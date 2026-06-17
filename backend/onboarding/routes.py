from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

from database import (
    onboarding_templates_collection,
    users_collection,
)
from auth.dependencies import get_current_user, require_hr_role
from onboarding.services import compute_steps, progress_summary, mark_step_complete

router = APIRouter(tags=["Onboarding"])


class Step(BaseModel):
    type: str  # "document" | "flashcard_set" | "assessment"
    resource_id: str
    title: str


class TemplateCreate(BaseModel):
    title: str
    role: str = "employee"
    department: Optional[str] = None  # None = applies to all departments for that role
    steps: List[Step]


class CompleteStep(BaseModel):
    resource_id: str


def _oid(v: str) -> ObjectId:
    try:
        return ObjectId(v)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail="Invalid id")


def _find_template_for(role: str, department: Optional[str]):
    """Best match: exact role+department, else role with no department (general)."""
    t = onboarding_templates_collection.find_one({"role": role, "department": department})
    if not t:
        t = onboarding_templates_collection.find_one({"role": role, "department": None})
    return t


@router.post("/onboarding/templates")
async def create_template(data: TemplateCreate, hr_user: dict = Depends(require_hr_role)):
    doc = {
        "title": data.title,
        "role": data.role,
        "department": data.department,
        "steps": [s.dict() for s in data.steps],
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
    }
    result = onboarding_templates_collection.insert_one(doc)
    return {"id": str(result.inserted_id), **{k: doc[k] for k in ("title", "role", "department", "steps")}}


@router.get("/onboarding/templates")
async def list_templates(hr_user: dict = Depends(require_hr_role)):
    out = []
    for t in onboarding_templates_collection.find().sort("created_at", -1):
        out.append({
            "id": str(t["_id"]),
            "title": t["title"],
            "role": t.get("role", "employee"),
            "department": t.get("department"),
            "steps": t.get("steps", []),
            "created_at": t.get("created_at"),
        })
    return out


@router.delete("/onboarding/templates/{template_id}")
async def delete_template(template_id: str, hr_user: dict = Depends(require_hr_role)):
    res = onboarding_templates_collection.delete_one({"_id": _oid(template_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}


@router.get("/onboarding/me")
async def my_onboarding(current_user: dict = Depends(get_current_user)):
    template = _find_template_for(current_user["role"], current_user.get("department"))
    if not template:
        return {"has_path": False}
    steps = compute_steps(str(current_user["_id"]), template.get("steps", []))
    return {
        "has_path": True,
        "template_id": str(template["_id"]),
        "title": template["title"],
        "steps": steps,
        **progress_summary(steps),
    }


@router.post("/onboarding/complete-step")
async def complete_step(data: CompleteStep, current_user: dict = Depends(get_current_user)):
    mark_step_complete(str(current_user["_id"]), data.resource_id)
    return {"message": "Step marked complete"}


@router.get("/onboarding/status")
async def onboarding_status(hr_user: dict = Depends(require_hr_role)):
    """Per new-hire onboarding completion, for the HR overview."""
    employees = list(users_collection.find({"role": "employee", "is_active": {"$ne": False}}))
    out = []
    for emp in employees:
        template = _find_template_for("employee", emp.get("department"))
        if not template:
            continue
        steps = compute_steps(str(emp["_id"]), template.get("steps", []))
        summ = progress_summary(steps)
        out.append({
            "user_id": str(emp["_id"]),
            "full_name": emp.get("full_name"),
            "email": emp.get("email"),
            "department": emp.get("department"),
            "template_title": template["title"],
            **summ,
        })
    out.sort(key=lambda x: x["percentage"])  # least-progressed first
    return out
