from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from pydantic import BaseModel

from database import (
    documents_collection,
    sop_of_the_day_collection,
    sop_dismissals_collection,
    sop_automation_config_collection,
)
from auth.dependencies import get_current_user, require_hr_role
from sop_of_the_day.services import generate_sop_highlight
from sop_of_the_day.scheduler import (
    get_automation_config,
    run_automated_sop_generation,
    reschedule_job,
)

router = APIRouter(tags=["SOP of the Day"])


# --- Pydantic Models ---

class SOPOfTheDayCreate(BaseModel):
    document_id: str


class SOPOfTheDayResponse(BaseModel):
    id: str
    document_id: str
    document_name: str
    title: str
    summary: str
    key_points: List[str]
    practical_tip: str
    created_by: str
    created_at: datetime
    is_active: bool
    source: Optional[str] = "manual"


class AutomationConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    schedule_time: Optional[str] = None
    document_id: Optional[str] = None
    clear_history: Optional[bool] = None


class AutomationConfigResponse(BaseModel):
    enabled: bool
    schedule_time: str
    document_id: Optional[str]
    document_name: Optional[str]
    previous_topics: List[str]
    generated_count: int
    document_exhausted: bool
    last_generated_at: Optional[datetime]


def _serialize_sop(sop: dict) -> SOPOfTheDayResponse:
    return SOPOfTheDayResponse(
        id=str(sop["_id"]),
        document_id=sop["document_id"],
        document_name=sop["document_name"],
        title=sop["title"],
        summary=sop["summary"],
        key_points=sop["key_points"],
        practical_tip=sop["practical_tip"],
        created_by=sop["created_by"],
        created_at=sop["created_at"],
        is_active=sop["is_active"],
        source=sop.get("source", "manual"),
    )


def _serialize_config(config: dict) -> AutomationConfigResponse:
    return AutomationConfigResponse(
        enabled=config.get("enabled", False),
        schedule_time=config.get("schedule_time", "08:00"),
        document_id=config.get("document_id"),
        document_name=config.get("document_name"),
        previous_topics=config.get("previous_topics", []),
        generated_count=config.get("generated_count", 0),
        document_exhausted=config.get("document_exhausted", False),
        last_generated_at=config.get("last_generated_at"),
    )


# --- Routes ---

@router.post("/sop-of-the-day", response_model=SOPOfTheDayResponse)
async def create_sop_of_the_day(
    data: SOPOfTheDayCreate,
    hr_user: dict = Depends(require_hr_role),
):
    """HR creates a new SOP of the Day from an ingested document."""
    # Verify document exists and has extracted text
    try:
        document = documents_collection.find_one({"_id": ObjectId(data.document_id)})
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if not document or not document.get("is_active"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    extracted_text = document.get("extracted_text", "")
    if not extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document has no extracted text. Please re-upload.",
        )

    # Deactivate any currently active SOP of the Day
    sop_of_the_day_collection.update_many(
        {"is_active": True},
        {"$set": {"is_active": False, "deactivated_at": datetime.utcnow()}},
    )

    # Generate AI highlight
    try:
        highlight = generate_sop_highlight(document["filename"], extracted_text)
    except Exception as e:
        print(f"Error generating SOP highlight: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate SOP highlight. Please try again.",
        )

    sop_data = {
        "document_id": data.document_id,
        "document_name": document["filename"],
        "title": highlight["title"],
        "summary": highlight["summary"],
        "key_points": highlight["key_points"],
        "practical_tip": highlight["practical_tip"],
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
        "is_active": True,
        "source": "manual",
    }

    result = sop_of_the_day_collection.insert_one(sop_data)
    sop_data["_id"] = result.inserted_id

    # Notify all employees
    from notifications.services import notify_new_sop
    try:
        notify_new_sop(highlight["title"], hr_user["email"])
    except Exception:
        pass

    return _serialize_sop(sop_data)


@router.get("/sop-of-the-day/active", response_model=Optional[SOPOfTheDayResponse])
async def get_active_sop(current_user: dict = Depends(get_current_user)):
    """Get the current active SOP of the Day (if not dismissed by this user)."""
    sop = sop_of_the_day_collection.find_one({"is_active": True})
    if not sop:
        return None

    # Check if user already dismissed this SOP
    user_id = str(current_user["_id"])
    dismissal = sop_dismissals_collection.find_one({
        "sop_id": str(sop["_id"]),
        "user_id": user_id,
    })
    if dismissal:
        return None

    return _serialize_sop(sop)


# --- Automation Routes (BEFORE parametric /{sop_id} routes) ---

@router.get("/sop-of-the-day/automation/config", response_model=AutomationConfigResponse)
async def get_automation_config_endpoint(hr_user: dict = Depends(require_hr_role)):
    """Get current automation configuration."""
    config = get_automation_config()
    return _serialize_config(config)


@router.put("/sop-of-the-day/automation/config", response_model=AutomationConfigResponse)
async def update_automation_config(
    data: AutomationConfigUpdate,
    hr_user: dict = Depends(require_hr_role),
):
    """Update automation configuration."""
    config = get_automation_config()
    update_fields = {"updated_at": datetime.utcnow()}

    if data.enabled is not None:
        update_fields["enabled"] = data.enabled

    if data.schedule_time is not None:
        try:
            parts = data.schedule_time.split(":")
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError()
            update_fields["schedule_time"] = data.schedule_time
            reschedule_job(data.schedule_time)
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time format. Use HH:MM (24-hour).",
            )

    if data.document_id is not None:
        try:
            document = documents_collection.find_one({"_id": ObjectId(data.document_id)})
        except Exception:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        if not document or not document.get("is_active"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

        if not document.get("extracted_text"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document has no extracted text.",
            )

        update_fields["document_id"] = data.document_id
        update_fields["document_name"] = document["filename"]
        update_fields["previous_topics"] = []
        update_fields["generated_count"] = 0
        update_fields["document_exhausted"] = False

    if data.clear_history:
        update_fields["previous_topics"] = []
        update_fields["generated_count"] = 0
        update_fields["document_exhausted"] = False

    sop_automation_config_collection.update_one(
        {"_id": config["_id"]},
        {"$set": update_fields},
    )

    updated = get_automation_config()
    return _serialize_config(updated)


@router.post("/sop-of-the-day/automation/trigger")
async def trigger_automation(hr_user: dict = Depends(require_hr_role)):
    """Manually trigger SOP generation for testing."""
    config = get_automation_config()

    if not config.get("document_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No document selected for automation.",
        )

    if config.get("document_exhausted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is exhausted. Select a new document or reuse the current one.",
        )

    try:
        run_automated_sop_generation()
        return {"message": "SOP generated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate SOP: {str(e)}",
        )


@router.get("/sop-of-the-day/automation/status")
async def get_automation_status(hr_user: dict = Depends(require_hr_role)):
    """Get detailed automation status."""
    config = get_automation_config()

    if not config.get("enabled"):
        status_label = "disabled"
    elif config.get("document_exhausted"):
        status_label = "exhausted"
    elif not config.get("document_id"):
        status_label = "no_document"
    else:
        status_label = "active"

    return {
        "status": status_label,
        "enabled": config.get("enabled", False),
        "document_name": config.get("document_name"),
        "document_exhausted": config.get("document_exhausted", False),
        "generated_count": config.get("generated_count", 0),
        "previous_topics": config.get("previous_topics", []),
        "last_generated_at": config.get("last_generated_at"),
        "schedule_time": config.get("schedule_time", "08:00"),
    }


# --- Parametric Routes ---

@router.post("/sop-of-the-day/{sop_id}/dismiss")
async def dismiss_sop(sop_id: str, current_user: dict = Depends(get_current_user)):
    """Employee dismisses/closes the SOP of the Day notification."""
    user_id = str(current_user["_id"])

    # Check if already dismissed
    existing = sop_dismissals_collection.find_one({
        "sop_id": sop_id,
        "user_id": user_id,
    })
    if existing:
        return {"message": "Already dismissed"}

    sop_dismissals_collection.insert_one({
        "sop_id": sop_id,
        "user_id": user_id,
        "user_email": current_user["email"],
        "dismissed_at": datetime.utcnow(),
    })

    return {"message": "SOP dismissed successfully"}


@router.get("/sop-of-the-day/history", response_model=List[SOPOfTheDayResponse])
async def get_sop_history(hr_user: dict = Depends(require_hr_role)):
    """HR views all past SOP of the Day entries."""
    sops = list(
        sop_of_the_day_collection.find().sort("created_at", -1).limit(50)
    )
    return [_serialize_sop(sop) for sop in sops]


@router.delete("/sop-of-the-day/{sop_id}")
async def deactivate_sop(sop_id: str, hr_user: dict = Depends(require_hr_role)):
    """HR deactivates an SOP of the Day."""
    try:
        result = sop_of_the_day_collection.update_one(
            {"_id": ObjectId(sop_id)},
            {"$set": {"is_active": False, "deactivated_at": datetime.utcnow()}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")
        return {"message": "SOP of the Day deactivated"}
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOP not found")
