"""Groq free-tier usage guard.

Groq's free tier for Llama-4-Scout is bound mainly by **requests/day (~1000 RPD)**
plus **requests/min (~30 RPM)**. So we:

  * count ACTUAL Groq requests (call ``count_llm_call()`` at every real LLM
    invocation — this captures retry loops and multi-prompt endpoints, which a
    per-endpoint counter would miss);
  * cap the GLOBAL daily request count (the binding limit) in MongoDB
    (atomic, cross-instance, restart-safe);
  * cap each USER's daily AI *actions* (fairness) in MongoDB;
  * throttle GLOBAL requests-per-minute in memory so bursts don't trip Groq's RPM.

The check runs as a FastAPI dependency BEFORE an endpoint; the actual-request
counting happens DURING it via count_llm_call(). Fail-OPEN on DB hiccups.
"""
import time
from collections import deque
from datetime import datetime
from fastapi import Depends, HTTPException, status
from pymongo import ReturnDocument

from config import settings
from database import llm_usage_collection
from auth.dependencies import get_current_user

# In-memory sliding window of recent real-request timestamps (RPM guard).
# Single-instance scope; move to Redis if you run multiple backend instances.
_recent_calls = deque()


def _today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _get(key: str) -> int:
    doc = llm_usage_collection.find_one({"_id": key})
    return doc.get("count", 0) if doc else 0


def _bump(key: str) -> int:
    doc = llm_usage_collection.find_one_and_update(
        {"_id": key},
        {"$inc": {"count": 1}, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc.get("count", 1)


def _quota_error(scope: str, message: str):
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={"code": "ai_quota_exceeded", "scope": scope, "message": message},
    )


def count_llm_call(n: int = 1) -> None:
    """Record `n` ACTUAL Groq requests. Call once per real LLM invocation
    (inside retry loops too). Never raises — we don't abort an in-flight
    generation; the next request's pre-check will block once over."""
    try:
        day = _today()
        now = time.time()
        for _ in range(max(1, n)):
            _bump(f"global:{day}")
            _recent_calls.append(now)
    except Exception:
        pass


def ai_quota(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: enforce Groq caps before an LLM-backed endpoint runs.

    - GLOBAL daily request cap (binding free-tier limit) — read-only check.
    - GLOBAL requests-per-minute throttle (in-memory) — transient.
    - PER-USER daily action cap (fairness) — increments here.
    """
    day = _today()

    # 1) Global daily request cap (counted accurately by count_llm_call).
    try:
        if _get(f"global:{day}") >= settings.GROQ_DAILY_LIMIT:
            raise _quota_error(
                "global",
                "NexusLearn is a student-built project running on a free AI tier, so the "
                "daily AI capacity is limited — and it's been used up for today. It resets "
                "at 00:00 UTC. Thanks so much for your patience and for understanding! 🙏",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # fail-open on DB error

    # 2) Global per-minute throttle (burst guard for Groq's RPM).
    now = time.time()
    cutoff = now - 60
    while _recent_calls and _recent_calls[0] < cutoff:
        _recent_calls.popleft()
    if len(_recent_calls) >= settings.GROQ_RPM_LIMIT:
        raise _quota_error(
            "rate",
            "Lots of people are using the AI right now, and NexusLearn runs on a limited "
            "free tier — please try again in a few moments. Thanks for your patience! 🙏",
        )

    # 3) Per-user daily action cap.
    try:
        user_count = _bump(f"user:{str(current_user['_id'])}:{day}")
        if user_count > settings.GROQ_USER_DAILY_LIMIT:
            raise _quota_error(
                "user",
                "You've used up today's AI generations. NexusLearn is a student project on a "
                "free, limited AI tier, so everyone gets a daily allowance — yours resets at "
                "00:00 UTC. Thanks for understanding! 🙏",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # fail-open on DB error

    return current_user


def usage_today() -> dict:
    """Snapshot of today's global AI-request usage (HR/admin view)."""
    day = _today()
    used = _get(f"global:{day}")
    return {
        "date": day,
        "global_used": used,
        "global_limit": settings.GROQ_DAILY_LIMIT,
        "per_user_limit": settings.GROQ_USER_DAILY_LIMIT,
        "rpm_limit": settings.GROQ_RPM_LIMIT,
        "remaining": max(0, settings.GROQ_DAILY_LIMIT - used),
    }
