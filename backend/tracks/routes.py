from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from database import learning_tracks_collection
from config import settings
from auth.dependencies import get_current_user, require_hr_role
from onboarding.services import compute_steps, progress_summary, mark_step_complete

router = APIRouter(tags=["Learning Tracks"])


class TrackItem(BaseModel):
    type: str  # "document" | "flashcard_set" | "assessment"
    resource_id: str
    title: str


class TrackCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    access_type: str = "all"            # "all" | "specific"
    departments: Optional[List[str]] = None
    items: List[TrackItem]


class CompleteStep(BaseModel):
    resource_id: str


def _oid(v: str) -> ObjectId:
    try:
        return ObjectId(v)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid id")


def _dept_query(current_user: dict) -> dict:
    query = {}
    if current_user["role"] == "employee":
        dept = current_user.get("department")
        query["$or"] = [{"access_type": "all"}, {"departments": dept}]
    return query


@router.post("/tracks")
async def create_track(data: TrackCreate, hr_user: dict = Depends(require_hr_role)):
    if data.access_type not in ("all", "specific"):
        raise HTTPException(status_code=400, detail="access_type must be 'all' or 'specific'")
    if data.access_type == "specific":
        if not data.departments:
            raise HTTPException(status_code=400, detail="Departments required for specific access")
        for d in data.departments:
            if d not in settings.DEPARTMENTS:
                raise HTTPException(status_code=400, detail=f"Invalid department: {d}")
    doc = {
        "name": data.name,
        "description": data.description or "",
        "access_type": data.access_type,
        "departments": data.departments if data.access_type == "specific" else [],
        "items": [it.dict() for it in data.items],
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = learning_tracks_collection.insert_one(doc)
    return {"id": str(result.inserted_id), "name": data.name, "items": doc["items"]}


@router.get("/tracks")
async def list_tracks(current_user: dict = Depends(get_current_user)):
    query = {"is_active": {"$ne": False}}
    query.update(_dept_query(current_user))
    out = []
    for t in learning_tracks_collection.find(query).sort("created_at", -1):
        steps = compute_steps(str(current_user["_id"]), t.get("items", []))
        out.append({
            "id": str(t["_id"]),
            "name": t["name"],
            "description": t.get("description", ""),
            "access_type": t.get("access_type", "all"),
            "item_count": len(t.get("items", [])),
            **progress_summary(steps),
        })
    return out


@router.get("/tracks/{track_id}")
async def get_track(track_id: str, current_user: dict = Depends(get_current_user)):
    t = learning_tracks_collection.find_one({"_id": _oid(track_id), "is_active": {"$ne": False}})
    if not t:
        raise HTTPException(status_code=404, detail="Track not found")
    if current_user["role"] == "employee" and t.get("access_type") == "specific":
        if current_user.get("department") not in t.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")
    steps = compute_steps(str(current_user["_id"]), t.get("items", []))
    return {
        "id": str(t["_id"]),
        "name": t["name"],
        "description": t.get("description", ""),
        "steps": steps,
        **progress_summary(steps),
    }


@router.post("/tracks/complete-step")
async def complete_step(data: CompleteStep, current_user: dict = Depends(get_current_user)):
    mark_step_complete(str(current_user["_id"]), data.resource_id)
    return {"message": "Step marked complete"}


@router.delete("/tracks/{track_id}")
async def delete_track(track_id: str, hr_user: dict = Depends(require_hr_role)):
    res = learning_tracks_collection.update_one(
        {"_id": _oid(track_id)},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")
    return {"message": "Track deleted"}
