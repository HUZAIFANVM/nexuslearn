"""
Super-admin only endpoints for HR approval workflow.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from bson import ObjectId

from database import users_collection
from auth.dependencies import require_super_admin_role


router = APIRouter(prefix="/admin", tags=["Admin"])


# ---- helpers --------------------------------------------------------------

def _serialize_hr(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user.get("full_name"),
        "role": user.get("role"),
        "department": user.get("department"),
        "status": user.get("status", "approved"),
        "is_active": user.get("is_active", True),
        "email_verified": user.get("email_verified", False),
        "auth_provider": user.get("auth_provider", "local"),
        "created_at": user.get("created_at"),
        "status_changed_at": user.get("status_changed_at"),
        "status_changed_by": user.get("status_changed_by"),
        "status_reason": user.get("status_reason"),
    }


def _parse_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")


def _get_hr_user(user_id: str) -> dict:
    user = users_collection.find_one({"_id": _parse_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") != "hr":
        raise HTTPException(status_code=400, detail="User is not an HR account")
    return user


# ---- request bodies -------------------------------------------------------

class RejectRequest(BaseModel):
    reason: Optional[str] = None


# ---- endpoints ------------------------------------------------------------

@router.get("/hrs")
async def list_hr_users(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(require_super_admin_role),
):
    """List HR users, optionally filtered by status (pending/approved/rejected)."""
    query: dict = {"role": "hr"}
    if status_filter:
        if status_filter not in ("pending", "approved", "rejected"):
            raise HTTPException(status_code=400, detail="Invalid status filter")
        query["status"] = status_filter

    users = list(users_collection.find(query).sort("created_at", -1))
    return {"hrs": [_serialize_hr(u) for u in users], "count": len(users)}


@router.get("/hrs/pending")
async def list_pending_hrs(current_user: dict = Depends(require_super_admin_role)):
    """Convenience endpoint — pending HRs only."""
    users = list(
        users_collection.find({"role": "hr", "status": "pending"}).sort("created_at", -1)
    )
    return {"hrs": [_serialize_hr(u) for u in users], "count": len(users)}


@router.post("/hrs/{user_id}/approve")
async def approve_hr(
    user_id: str,
    current_user: dict = Depends(require_super_admin_role),
):
    user = _get_hr_user(user_id)
    if user.get("status") == "approved":
        return {"message": "Already approved", "user": _serialize_hr(user)}

    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "status": "approved",
                "status_changed_at": datetime.utcnow(),
                "status_changed_by": str(current_user["_id"]),
                "status_reason": None,
            }
        },
    )
    updated = users_collection.find_one({"_id": user["_id"]})
    return {"message": "HR account approved", "user": _serialize_hr(updated)}


@router.post("/hrs/{user_id}/reject")
async def reject_hr(
    user_id: str,
    body: RejectRequest = RejectRequest(),
    current_user: dict = Depends(require_super_admin_role),
):
    user = _get_hr_user(user_id)
    if user.get("status") == "rejected":
        return {"message": "Already rejected", "user": _serialize_hr(user)}

    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "status": "rejected",
                "status_changed_at": datetime.utcnow(),
                "status_changed_by": str(current_user["_id"]),
                "status_reason": body.reason,
            }
        },
    )
    updated = users_collection.find_one({"_id": user["_id"]})
    return {"message": "HR account rejected", "user": _serialize_hr(updated)}
