import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from database import (
    mentorships_collection, learning_paths_collection, users_collection,
    mentorship_sessions_collection, mentorship_messages_collection,
    documents_collection, flashcard_sets_collection, assessments_collection,
    assessment_results_collection,
)
from auth.dependencies import get_current_user, require_hr_role

router = APIRouter(tags=["Mentorship"])


# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #
class MentorshipCreate(BaseModel):
    mentor_id: str
    mentee_id: str
    skill: str


class SessionCreate(BaseModel):
    note: str
    date: Optional[str] = None  # ISO date string; defaults to now


class MessageCreate(BaseModel):
    text: str


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _oid(v: str) -> ObjectId:
    try:
        return ObjectId(v)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid id")


def _norm(s: str) -> str:
    return (s or "").strip().lower()


def _skill_tokens(skill: str):
    """Significant words in a skill name, for naive resource/assessment matching."""
    return [w for w in re.split(r"[^a-z0-9]+", _norm(skill)) if len(w) > 3]


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
        "completed_at": m.get("completed_at"),
    }


def _get_mentorship(mentorship_id: str) -> dict:
    m = mentorships_collection.find_one({"_id": _oid(mentorship_id)})
    if not m:
        raise HTTPException(status_code=404, detail="Mentorship not found")
    return m


def _ensure_participant_or_hr(m: dict, user: dict):
    """Only the mentor, the mentee, or an HR/super-admin may view/act."""
    if user.get("role") in ("hr", "super_admin"):
        return
    uid = str(user["_id"])
    if uid not in (m.get("mentor_id"), m.get("mentee_id")):
        raise HTTPException(status_code=403, detail="Not part of this mentorship")


def _notify(user_ids, title, message, resource_id):
    """Best-effort notification fan-out (never breaks the main action)."""
    try:
        from notifications.services import create_notification
        create_notification(
            notification_type="mentorship",
            title=title,
            message=message,
            target_users=[u for u in user_ids if u],
            resource_type="mentorship",
            resource_id=resource_id,
        )
    except Exception:
        pass


# --------------------------------------------------------------------------- #
# Suggestions + pairing
# --------------------------------------------------------------------------- #
@router.get("/mentorship/suggestions")
async def suggestions(hr_user: dict = Depends(require_hr_role)):
    """Auto-pair from growth-map data: a colleague STRONG in a skill mentors
    someone with a gap in that same skill."""
    paths = list(learning_paths_collection.find())
    strong_by_skill = {}
    for p in paths:
        for s in p.get("strengths", []):
            skill = s.get("skill") if isinstance(s, dict) else s
            if skill:
                strong_by_skill.setdefault(_norm(skill), []).append(
                    {"user_id": p["user_id"], "name": p.get("user_name") or p.get("user_email")}
                )

    # Pairs already created (skip re-suggesting them)
    existing = {
        (m["mentor_id"], m["mentee_id"], _norm(m.get("skill", "")))
        for m in mentorships_collection.find({}, {"mentor_id": 1, "mentee_id": 1, "skill": 1})
    }

    out, seen = [], set()
    for p in paths:
        mentee_id = p["user_id"]
        mentee_name = p.get("user_name") or p.get("user_email")
        for w in p.get("weaknesses", []):
            skill = w.get("skill") if isinstance(w, dict) else w
            severity = w.get("severity", "moderate") if isinstance(w, dict) else "moderate"
            if not skill:
                continue
            for m in strong_by_skill.get(_norm(skill), []):
                if m["user_id"] == mentee_id:
                    continue
                key = (mentee_id, m["user_id"], _norm(skill))
                if key in seen or (m["user_id"], mentee_id, _norm(skill)) in existing:
                    continue
                seen.add(key)
                out.append({
                    "mentee_id": mentee_id, "mentee_name": mentee_name,
                    "mentor_id": m["user_id"], "mentor_name": m["name"],
                    "skill": skill, "severity": severity,
                })
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
        "mentor_id": data.mentor_id, "mentor_name": mentor.get("full_name"), "mentor_email": mentor.get("email"),
        "mentee_id": data.mentee_id, "mentee_name": mentee.get("full_name"), "mentee_email": mentee.get("email"),
        "skill": data.skill, "status": "active",
        "created_by": hr_user["email"], "created_at": datetime.utcnow(),
    }
    result = mentorships_collection.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Notify both participants
    mid = str(result.inserted_id)
    _notify([data.mentor_id], "You're now a mentor",
            f"You've been paired to mentor {mentee.get('full_name')} on {data.skill}.", mid)
    _notify([data.mentee_id], "You have a new mentor",
            f"{mentor.get('full_name')} will mentor you on {data.skill}.", mid)
    return _serialize(doc)


@router.get("/mentorship")
async def list_mentorships(hr_user: dict = Depends(require_hr_role)):
    return [_serialize(m) for m in mentorships_collection.find().sort("created_at", -1)]


@router.get("/mentorship/me")
async def my_mentorships(current_user: dict = Depends(get_current_user)):
    uid = str(current_user["_id"])
    items = list(mentorships_collection.find({"$or": [{"mentor_id": uid}, {"mentee_id": uid}]}).sort("created_at", -1))
    return [{**_serialize(m), "role": "mentor" if m["mentor_id"] == uid else "mentee"} for m in items]


@router.get("/mentorship/{mentorship_id}")
async def get_mentorship(mentorship_id: str, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    uid = str(current_user["_id"])
    role = "hr" if current_user.get("role") in ("hr", "super_admin") and uid not in (m["mentor_id"], m["mentee_id"]) \
        else ("mentor" if m["mentor_id"] == uid else "mentee")
    return {**_serialize(m), "my_role": role}


@router.post("/mentorship/{mentorship_id}/complete")
async def complete_mentorship(mentorship_id: str, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    mentorships_collection.update_one(
        {"_id": m["_id"]},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow()}},
    )
    _notify([m["mentor_id"], m["mentee_id"]], "Mentorship completed",
            f"The mentorship on {m.get('skill')} was marked complete.", mentorship_id)
    return {"message": "Mentorship completed"}


@router.delete("/mentorship/{mentorship_id}")
async def delete_mentorship(mentorship_id: str, hr_user: dict = Depends(require_hr_role)):
    m = _get_mentorship(mentorship_id)
    mentorships_collection.delete_one({"_id": m["_id"]})
    mentorship_sessions_collection.delete_many({"mentorship_id": mentorship_id})
    mentorship_messages_collection.delete_many({"mentorship_id": mentorship_id})
    return {"message": "Mentorship removed"}


# --------------------------------------------------------------------------- #
# Sessions (check-ins)
# --------------------------------------------------------------------------- #
@router.get("/mentorship/{mentorship_id}/sessions")
async def list_sessions(mentorship_id: str, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    sessions = mentorship_sessions_collection.find({"mentorship_id": mentorship_id}).sort("created_at", -1)
    return [
        {"id": str(s["_id"]), "note": s["note"], "date": s.get("date"),
         "logged_by_name": s.get("logged_by_name"), "created_at": s.get("created_at")}
        for s in sessions
    ]


@router.post("/mentorship/{mentorship_id}/sessions")
async def add_session(mentorship_id: str, data: SessionCreate, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    if not data.note.strip():
        raise HTTPException(status_code=400, detail="Session note cannot be empty")
    doc = {
        "mentorship_id": mentorship_id,
        "note": data.note.strip(),
        "date": data.date or datetime.utcnow().date().isoformat(),
        "logged_by": str(current_user["_id"]),
        "logged_by_name": current_user.get("full_name"),
        "created_at": datetime.utcnow(),
    }
    mentorship_sessions_collection.insert_one(doc)
    # Notify the other participant a session was logged
    uid = str(current_user["_id"])
    other = m["mentee_id"] if uid == m["mentor_id"] else m["mentor_id"]
    _notify([other], "New mentorship check-in",
            f"{current_user.get('full_name')} logged a session on {m.get('skill')}.", mentorship_id)
    return {"message": "Session logged"}


# --------------------------------------------------------------------------- #
# Messaging (mentor <-> mentee chat)
# --------------------------------------------------------------------------- #
@router.get("/mentorship/{mentorship_id}/messages")
async def list_messages(mentorship_id: str, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    msgs = mentorship_messages_collection.find({"mentorship_id": mentorship_id}).sort("created_at", 1).limit(200)
    uid = str(current_user["_id"])
    return [
        {"id": str(x["_id"]), "sender_id": x["sender_id"], "sender_name": x.get("sender_name"),
         "text": x["text"], "created_at": x.get("created_at"), "mine": x["sender_id"] == uid}
        for x in msgs
    ]


@router.post("/mentorship/{mentorship_id}/messages")
async def send_message(mentorship_id: str, data: MessageCreate, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    text = data.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(text) > 4000:
        raise HTTPException(status_code=400, detail="Message too long")
    doc = {
        "mentorship_id": mentorship_id,
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("full_name"),
        "text": text,
        "created_at": datetime.utcnow(),
    }
    result = mentorship_messages_collection.insert_one(doc)
    return {"id": str(result.inserted_id), "created_at": doc["created_at"]}


# --------------------------------------------------------------------------- #
# Progress (skill score trend + gap status)
# --------------------------------------------------------------------------- #
@router.get("/mentorship/{mentorship_id}/progress")
async def progress(mentorship_id: str, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    toks = _skill_tokens(m.get("skill", ""))
    mentee_id = m["mentee_id"]

    # Assessment score trend on this skill (match skill tokens against names)
    trend = []
    for r in assessment_results_collection.find({"user_id": mentee_id}).sort("completed_at", 1):
        name = _norm(r.get("assessment_name", ""))
        if toks and any(t in name for t in toks):
            trend.append({
                "assessment_name": r.get("assessment_name"),
                "percentage": r.get("percentage"),
                "completed_at": r.get("completed_at"),
            })

    # Does the mentee's latest roadmap still list this skill as a weakness?
    path = learning_paths_collection.find_one({"user_id": mentee_id})
    skill_status = "no_data"
    if path:
        weak = {_norm(w.get("skill")) for w in path.get("weaknesses", []) if isinstance(w, dict)}
        skill_status = "gap_remaining" if _norm(m.get("skill")) in weak else "gap_closed"

    return {
        "skill": m.get("skill"),
        "skill_status": skill_status,   # gap_remaining | gap_closed | no_data
        "trend": trend,
        "latest_score": trend[-1]["percentage"] if trend else None,
        "first_score": trend[0]["percentage"] if trend else None,
    }


# --------------------------------------------------------------------------- #
# Recommended resources for the skill (reuse existing content)
# --------------------------------------------------------------------------- #
@router.get("/mentorship/{mentorship_id}/resources")
async def resources(mentorship_id: str, current_user: dict = Depends(get_current_user)):
    m = _get_mentorship(mentorship_id)
    _ensure_participant_or_hr(m, current_user)
    toks = _skill_tokens(m.get("skill", ""))

    def matches(*texts):
        blob = _norm(" ".join(t for t in texts if t))
        return bool(toks) and any(t in blob for t in toks)

    docs = [
        {"id": str(d["_id"]), "name": d["filename"]}
        for d in documents_collection.find({"is_active": True})
        if matches(d.get("filename"))
    ][:5]
    sets = [
        {"id": str(s["_id"]), "name": s["name"]}
        for s in flashcard_sets_collection.find({"is_active": True})
        if matches(s.get("name"), " ".join(c.get("category", "") for c in s.get("cards", [])))
    ][:5]
    quizzes = [
        {"id": str(a["_id"]), "name": a["name"]}
        for a in assessments_collection.find({"is_active": True})
        if matches(a.get("name"), a.get("document_name"))
    ][:5]

    return {"skill": m.get("skill"), "documents": docs, "flashcard_sets": sets, "assessments": quizzes}
