"""Groq free-tier usage guard.

A "call" = one LLM-backed request. We count calls per UTC day, globally and
per user, in MongoDB (atomic $inc — works across instances and survives
restarts). When a cap is exceeded we raise 429 so we never blow past the free
Groq quota. Fail-OPEN on a DB hiccup so a Mongo blip doesn't take AI offline.

Use as a FastAPI dependency on every LLM-backed endpoint:
    _quota: dict = Depends(ai_quota)
"""
from datetime import datetime
from fastapi import Depends, HTTPException, status
from pymongo import ReturnDocument

from config import settings
from database import llm_usage_collection
from auth.dependencies import get_current_user


def _today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _bump(key: str) -> int:
    """Atomically increment a daily counter row and return the new count."""
    doc = llm_usage_collection.find_one_and_update(
        {"_id": key},
        {"$inc": {"count": 1}, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc.get("count", 1)


def record_and_check(user_id: str) -> None:
    """Count this call; raise 429 if the global or per-user daily cap is hit."""
    day = _today()
    try:
        global_count = _bump(f"global:{day}")
        user_count = _bump(f"user:{user_id}:{day}")
    except Exception:
        # DB problem — don't block the user over a counter failure.
        return

    # Structured detail so the frontend can show a graceful "limit reached"
    # dialog (contact admin / upgrade) instead of a raw error.
    if global_count > settings.GROQ_DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "ai_quota_exceeded",
                "scope": "global",
                "message": "The platform has reached its daily AI capacity. Please try again after 00:00 UTC, or contact your administrator to raise the limit.",
            },
        )
    if user_count > settings.GROQ_USER_DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "ai_quota_exceeded",
                "scope": "user",
                "message": "You've used all of today's AI generations. Your limit resets at 00:00 UTC — or contact your administrator to upgrade.",
            },
        )


def ai_quota(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: enforce Groq usage caps before an LLM-backed endpoint runs."""
    record_and_check(str(current_user["_id"]))
    return current_user


def usage_today() -> dict:
    """Snapshot of today's global usage (for an HR/admin view)."""
    day = _today()
    g = llm_usage_collection.find_one({"_id": f"global:{day}"})
    used = g.get("count", 0) if g else 0
    return {
        "date": day,
        "global_used": used,
        "global_limit": settings.GROQ_DAILY_LIMIT,
        "per_user_limit": settings.GROQ_USER_DAILY_LIMIT,
        "remaining": max(0, settings.GROQ_DAILY_LIMIT - used),
    }
