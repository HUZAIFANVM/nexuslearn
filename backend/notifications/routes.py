from fastapi import APIRouter, Depends, HTTPException, Query
from auth.dependencies import get_current_user
from notifications.services import (
    get_user_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
)

router = APIRouter(tags=["Notifications"])


@router.get("/notifications")
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    notifications = get_user_notifications(user_id, skip=skip, limit=limit)
    unread = get_unread_count(user_id)
    return {"notifications": notifications, "unread_count": unread}


@router.get("/notifications/unread-count")
async def unread_count(current_user: dict = Depends(get_current_user)):
    count = get_unread_count(str(current_user["_id"]))
    return {"unread_count": count}


@router.post("/notifications/{notification_id}/read")
async def read_notification(
    notification_id: str, current_user: dict = Depends(get_current_user)
):
    success = mark_as_read(notification_id, str(current_user["_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


@router.post("/notifications/read-all")
async def read_all_notifications(current_user: dict = Depends(get_current_user)):
    count = mark_all_as_read(str(current_user["_id"]))
    return {"message": f"Marked {count} notifications as read"}
