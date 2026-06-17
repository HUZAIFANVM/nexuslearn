from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from database import mentorships_collection, learning_paths_collection, users_collection
from auth.dependencies import get_current_user, require_hr_role

router = APIRouter(tags=["Mentorship"])


class MentorshipCreate(BaseModel):
    mentor_id: str
    mentee_id: str
    skill: str


def _oid(v: str) -> ObjectId:
    try:
        return ObjectId(v)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid id")


def _norm(s: str) -> str:
    return (s or "").strip().lower()


@router.get("/mentorship/suggestions")
async def suggestions(hr_user: dict = Depends(require_hr_role)):
    """Auto-pair from growth-map data: for each employee's weak skill, find a
    colleague who is STRONG in that same skill. Evidence-driven, not manual."""
    paths = list(learning_paths_collection.find())

    # Build skill -> list of strong mentors
    strong_by_skill = {}
    for p in paths:
        for s in p.get("strengths", []):
            skill = s.get("skill") if isinstance(s, dict) else s
            if not skill:
                continue
            strong_by_skill.setdefault(_norm(skill), []).append({
                "user_id": p["user_id"],
                "name": p.get("user_name") or p.get("user_email"),
                "skill": skill,
            })

    out = []
    seen = set()
    for p in paths:
        mentee_id = p["user_id"]
        mentee_name = p.get("user_name") or p.get("user_email")
        for w in p.get("weaknesses", []):
            skill = w.get("skill") if isinstance(w, dict) else w
            severity = w.get("severity", "moderate") if isinstance(w, dict) else "moderate"
            if not skill:
                continue
            mentors = strong_by_skill.get(_norm(skill), [])
            for m in mentors:
                if m["user_id"] == mentee_id:
                    continue  # can't mentor yourself
                key = (mentee_id, m["user_id"], _norm(skill))
                if key in seen:
                    continue
                seen.add(key)
                out.append({
                    "mentee_id": mentee_id,
                    "mentee_name": mentee_name,
                    "mentor_id": m["user_id"],
                    "mentor_name": m["name"],
                    "skill": skill,
                    "severity": severity,
                })
    # critical gaps first
    order = {"critical": 0, "moderate": 1, "minor": 2}
    out.sort(key=lambda x: order.get(x.get("severity"), 9))
    return out[:30]


@router.post("/mentorship")
async def create_mentorship(data: MentorshipCreate, hr_user: dict = Depends(require_hr_role)):
    mentor = users_collection.find_one({"_id": _oid(data.mentor_id)})
    mentee = users_collection.find_one({"_id": _oid(data.mentee_id)})
    if not mentor or not mentee:
        raise HTTPException(status_code=404, detail="Mentor or mentee not found")
    if data.mentor_id == data.mentee_id:
        raise HTTPException(status_code=400, detail="Mentor and mentee must differ")

    doc = {
        "mentor_id": data.mentor_id,
        "mentor_name": mentor.get("full_name"),
        "mentor_email": mentor.get("email"),
        "mentee_id": data.mentee_id,
        "mentee_name": mentee.get("full_name"),
        "mentee_email": mentee.get("email"),
        "skill": data.skill,
        "status": "active",
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
    }
    result = mentorships_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


def _serialize(m: dict) -> dict:
    return {
        "id": str(m["_id"]),
        "mentor_id": m["mentor_id"],
        "mentor_name": m.get("mentor_name"),
        "mentee_id": m["mentee_id"],
        "mentee_name": m.get("mentee_name"),
        "skill": m.get("skill"),
        "status": m.get("status", "active"),
        "created_at": m.get("created_at"),
    }


@router.get("/mentorship")
async def list_mentorships(hr_user: dict = Depends(require_hr_role)):
    return [_serialize(m) for m in mentorships_collection.find().sort("created_at", -1)]


@router.get("/mentorship/me")
async def my_mentorships(current_user: dict = Depends(get_current_user)):
    uid = str(current_user["_id"])
    items = list(mentorships_collection.find({"$or": [{"mentor_id": uid}, {"mentee_id": uid}]}))
    return [
        {**_serialize(m), "role": "mentor" if m["mentor_id"] == uid else "mentee"}
        for m in items
    ]


@router.delete("/mentorship/{mentorship_id}")
async def delete_mentorship(mentorship_id: str, hr_user: dict = Depends(require_hr_role)):
    res = mentorships_collection.delete_one({"_id": _oid(mentorship_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    return {"message": "Mentorship removed"}
