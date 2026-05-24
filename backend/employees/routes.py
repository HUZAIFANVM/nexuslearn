import math
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from config import settings
from database import users_collection
from auth.dependencies import require_hr_role
from auth.utils import get_password_hash
from employees.services import get_employee_learning_stats

router = APIRouter(tags=["Employee Management"])


# --- Pydantic models ---

class EmployeeUpdate(BaseModel):
    department: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class BulkAction(BaseModel):
    employee_ids: List[str]
    action: str  # "activate" or "deactivate"


# --- Helper ---

def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "department": user.get("department"),
        "is_active": user.get("is_active", True),
        "email_verified": user.get("email_verified", False),
        "auth_provider": user.get("auth_provider", "local"),
        "profile_picture": user.get("profile_picture"),
        "created_at": user.get("created_at"),
    }


# --- Endpoints ---

@router.get("/employees")
async def list_employees(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),  # "active" or "inactive"
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    hr_user: dict = Depends(require_hr_role),
):
    query = {}

    # Exclude the current HR user from the list
    query["_id"] = {"$ne": hr_user["_id"]}

    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    if department:
        query["department"] = department

    if status == "active":
        query["is_active"] = True
    elif status == "inactive":
        query["is_active"] = False

    total = users_collection.count_documents(query)
    skip = (page - 1) * limit
    users = list(
        users_collection.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return {
        "employees": [_serialize_user(u) for u in users],
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if total > 0 else 1,
    }


@router.get("/employees/stats")
async def get_employee_stats(hr_user: dict = Depends(require_hr_role)):
    all_users = list(users_collection.find({"_id": {"$ne": hr_user["_id"]}}))

    total = len(all_users)
    active = sum(1 for u in all_users if u.get("is_active", True))
    inactive = total - active

    # Count unique departments
    departments = set()
    for u in all_users:
        if u.get("department"):
            departments.add(u["department"])

    # By department breakdown
    by_department = {}
    for u in all_users:
        dept = u.get("department", "No Department")
        by_department[dept] = by_department.get(dept, 0) + 1

    # By role breakdown
    by_role = {}
    for u in all_users:
        role = u.get("role", "employee")
        by_role[role] = by_role.get(role, 0) + 1

    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "departments": len(departments),
        "by_department": by_department,
        "by_role": by_role,
    }


@router.get("/employees/{employee_id}")
async def get_employee(employee_id: str, hr_user: dict = Depends(require_hr_role)):
    try:
        user = users_collection.find_one({"_id": ObjectId(employee_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee = _serialize_user(user)
    employee["learning_stats"] = get_employee_learning_stats(employee_id)
    return employee


@router.put("/employees/{employee_id}")
async def update_employee(
    employee_id: str,
    update: EmployeeUpdate,
    hr_user: dict = Depends(require_hr_role),
):
    try:
        user = users_collection.find_one({"_id": ObjectId(employee_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = {}

    if update.department is not None:
        if update.department not in settings.DEPARTMENTS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid department. Choose from: {', '.join(settings.DEPARTMENTS)}",
            )
        update_data["department"] = update.department

    if update.role is not None:
        if update.role not in ["hr", "employee"]:
            raise HTTPException(status_code=400, detail="Role must be 'hr' or 'employee'")
        update_data["role"] = update.role

    if update.is_active is not None:
        update_data["is_active"] = update.is_active

    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    users_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": update_data},
    )

    updated = users_collection.find_one({"_id": ObjectId(employee_id)})
    return _serialize_user(updated)


@router.put("/employees/{employee_id}/deactivate")
async def deactivate_employee(employee_id: str, hr_user: dict = Depends(require_hr_role)):
    try:
        user = users_collection.find_one({"_id": ObjectId(employee_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    users_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {"is_active": False}},
    )
    return {"message": f"Employee {user['full_name']} deactivated"}


@router.put("/employees/{employee_id}/activate")
async def activate_employee(employee_id: str, hr_user: dict = Depends(require_hr_role)):
    try:
        user = users_collection.find_one({"_id": ObjectId(employee_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    users_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {"is_active": True}},
    )
    return {"message": f"Employee {user['full_name']} activated"}


@router.post("/employees/{employee_id}/reset-password")
async def reset_password(employee_id: str, hr_user: dict = Depends(require_hr_role)):
    try:
        user = users_collection.find_one({"_id": ObjectId(employee_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Employee not found")

    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Don't reset password for Google-only users
    if user.get("auth_provider") == "google":
        raise HTTPException(
            status_code=400,
            detail="Cannot reset password for Google-only accounts",
        )

    temp_password = secrets.token_urlsafe(10)
    hashed = get_password_hash(temp_password)

    users_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {"password": hashed}},
    )

    return {
        "message": f"Password reset for {user['full_name']}",
        "temporary_password": temp_password,
    }


@router.post("/employees/bulk-action")
async def bulk_action(action: BulkAction, hr_user: dict = Depends(require_hr_role)):
    if action.action not in ["activate", "deactivate"]:
        raise HTTPException(status_code=400, detail="Action must be 'activate' or 'deactivate'")

    ids = []
    for eid in action.employee_ids:
        try:
            ids.append(ObjectId(eid))
        except Exception:
            continue

    if not ids:
        raise HTTPException(status_code=400, detail="No valid employee IDs provided")

    is_active = action.action == "activate"
    result = users_collection.update_many(
        {"_id": {"$in": ids}},
        {"$set": {"is_active": is_active}},
    )

    return {
        "message": f"{result.modified_count} employees {'activated' if is_active else 'deactivated'}",
        "modified_count": result.modified_count,
    }
