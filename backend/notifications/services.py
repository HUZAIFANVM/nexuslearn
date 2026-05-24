from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from database import notifications_collection, users_collection


def create_notification(
    notification_type: str,
    title: str,
    message: str,
    target_users: Optional[List[str]] = None,
    target_departments: Optional[List[str]] = None,
    target_all: bool = False,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    created_by: Optional[str] = None,
):
    """
    Create notifications for target users.

    target_users: list of user_id strings (specific users)
    target_departments: list of department names (all employees in those depts)
    target_all: if True, notify all active employees
    """
    # Resolve target user IDs
    user_ids = set()

    if target_users:
        user_ids.update(target_users)

    if target_all:
        employees = users_collection.find(
            {"role": "employee", "is_active": {"$ne": False}},
            {"_id": 1},
        )
        user_ids.update(str(e["_id"]) for e in employees)

    elif target_departments:
        employees = users_collection.find(
            {
                "role": "employee",
                "is_active": {"$ne": False},
                "department": {"$in": target_departments},
            },
            {"_id": 1},
        )
        user_ids.update(str(e["_id"]) for e in employees)

    if not user_ids:
        return 0

    now = datetime.utcnow()
    docs = [
        {
            "user_id": uid,
            "type": notification_type,
            "title": title,
            "message": message,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "created_by": created_by,
            "is_read": False,
            "created_at": now,
        }
        for uid in user_ids
    ]

    result = notifications_collection.insert_many(docs)
    return len(result.inserted_ids)


def get_user_notifications(user_id: str, skip: int = 0, limit: int = 30):
    notifications = list(
        notifications_collection.find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    return [
        {
            "id": str(n["_id"]),
            "type": n["type"],
            "title": n["title"],
            "message": n["message"],
            "resource_type": n.get("resource_type"),
            "resource_id": n.get("resource_id"),
            "is_read": n["is_read"],
            "created_at": n["created_at"],
        }
        for n in notifications
    ]


def get_unread_count(user_id: str) -> int:
    return notifications_collection.count_documents(
        {"user_id": user_id, "is_read": False}
    )


def mark_as_read(notification_id: str, user_id: str) -> bool:
    result = notifications_collection.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
    )
    return result.modified_count > 0


def mark_all_as_read(user_id: str) -> int:
    result = notifications_collection.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True, "read_at": datetime.utcnow()}},
    )
    return result.modified_count


# --- Convenience helpers for triggering from other modules ---

def notify_new_assessment(assessment_name: str, access_type: str, departments: list, created_by: str):
    create_notification(
        notification_type="new_assessment",
        title="New Competency Evaluation",
        message=f'A new evaluation "{assessment_name}" is now available for you.',
        target_all=(access_type == "all"),
        target_departments=departments if access_type == "specific" else None,
        resource_type="assessment",
        created_by=created_by,
    )


def notify_new_flashcard_set(set_name: str, access_type: str, departments: list, created_by: str):
    create_notification(
        notification_type="new_flashcard_set",
        title="New Retention Training",
        message=f'New training cards "{set_name}" have been added. Start practicing!',
        target_all=(access_type == "all"),
        target_departments=departments if access_type == "specific" else None,
        resource_type="flashcard_set",
        created_by=created_by,
    )


def notify_new_chatbot(chatbot_name: str, access_type: str, departments: list, created_by: str):
    create_notification(
        notification_type="new_chatbot",
        title="New Knowledge Assistant",
        message=f'A new Knowledge Assistant "{chatbot_name}" is ready to answer your questions.',
        target_all=(access_type == "all"),
        target_departments=departments if access_type == "specific" else None,
        resource_type="chatbot",
        created_by=created_by,
    )


def notify_new_document(document_name: str, created_by: str):
    create_notification(
        notification_type="new_document",
        title="New Resource Available",
        message=f'A new document "{document_name}" has been added to the Resource Library.',
        target_all=True,
        resource_type="document",
        created_by=created_by,
    )


def notify_new_sop(sop_title: str, created_by: str = None):
    create_notification(
        notification_type="new_sop",
        title="SOP of the Day",
        message=f'Today\'s SOP highlight: "{sop_title}" — check it out!',
        target_all=True,
        resource_type="sop",
        created_by=created_by,
    )
