"""Shared 'ordered resource list + derived progress' engine.

Used by both onboarding paths and learning tracks. A step is one of:
  - "document"      → completion is MANUAL (user clicks "mark as read"), stored
                      in onboarding_progress.completed_steps.
  - "flashcard_set" → DERIVED: done once the user has reviewed any card in the set.
  - "assessment"    → DERIVED: done once the user has a recorded result.
"""
from database import (
    onboarding_progress_collection,
    flashcard_reviews_collection,
    assessment_results_collection,
)


def get_manual_completed(user_id: str) -> set:
    """Resource ids the user has explicitly marked complete (document steps)."""
    doc = onboarding_progress_collection.find_one({"user_id": user_id})
    return set(doc.get("completed_steps", [])) if doc else set()


def mark_step_complete(user_id: str, resource_id: str):
    """Record a manual completion (idempotent)."""
    onboarding_progress_collection.update_one(
        {"user_id": user_id},
        {"$addToSet": {"completed_steps": resource_id}},
        upsert=True,
    )


def compute_steps(user_id: str, steps: list) -> list:
    """Return each step annotated with a `done` flag, derived from real activity."""
    manual = get_manual_completed(user_id)
    out = []
    for s in steps:
        rid = s.get("resource_id")
        typ = s.get("type")
        if typ == "assessment":
            done = assessment_results_collection.find_one(
                {"user_id": user_id, "assessment_id": rid}
            ) is not None
        elif typ == "flashcard_set":
            done = flashcard_reviews_collection.find_one(
                {"user_id": user_id, "flashcard_set_id": rid}
            ) is not None
        else:  # document (or anything manual)
            done = rid in manual
        out.append({**s, "done": done})
    return out


def progress_summary(steps_with_done: list) -> dict:
    total = len(steps_with_done)
    completed = sum(1 for s in steps_with_done if s.get("done"))
    pct = round(completed / total * 100) if total else 0
    return {"completed": completed, "total": total, "percentage": pct}
