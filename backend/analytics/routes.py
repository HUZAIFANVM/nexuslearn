"""L&D analytics — turns existing results data into 'measuring success' views.
All read-only aggregation over collections we already populate.
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta

from database import (
    users_collection,
    assessment_results_collection,
    flashcard_reviews_collection,
    flashcard_sets_collection,
    assessments_collection,
    documents_collection,
    learning_paths_collection,
)
from auth.dependencies import require_hr_role

router = APIRouter(tags=["Analytics"])


@router.get("/analytics/overview")
async def overview(hr_user: dict = Depends(require_hr_role)):
    # --- Users ---
    employees = list(users_collection.find({"role": "employee"}))
    dept_of = {str(u["_id"]): (u.get("department") or "Unassigned") for u in employees}
    total_employees = len(employees)
    active_employees = sum(1 for u in employees if u.get("is_active", True))

    # New signups in the last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    new_30d = sum(1 for u in employees if u.get("created_at") and u["created_at"] >= cutoff)

    # --- Assessment results ---
    results = list(assessment_results_collection.find())
    total_attempts = len(results)
    avg_score = round(sum(r.get("percentage", 0) for r in results) / total_attempts, 1) if total_attempts else 0

    # Per-department assessment average (join result.user_id -> department)
    by_dept = {}
    for r in results:
        dept = dept_of.get(r.get("user_id"), "Unassigned")
        b = by_dept.setdefault(dept, {"department": dept, "attempts": 0, "score_sum": 0.0})
        b["attempts"] += 1
        b["score_sum"] += r.get("percentage", 0)
    dept_scores = [
        {"department": b["department"], "attempts": b["attempts"],
         "avg_score": round(b["score_sum"] / b["attempts"], 1) if b["attempts"] else 0}
        for b in by_dept.values()
    ]
    dept_scores.sort(key=lambda x: x["avg_score"], reverse=True)

    # --- Flashcard retention ---
    reviews = list(flashcard_reviews_collection.find())
    total_correct = sum(r.get("correct_count", 0) for r in reviews)
    total_reviews = sum(r.get("total_reviews", 0) for r in reviews)
    retention = round(total_correct / total_reviews * 100, 1) if total_reviews else 0
    mastered = sum(1 for r in reviews if r.get("repetitions", 0) >= 1 and r.get("easiness_factor", 0) >= 2.0)

    # --- Content + roadmaps ---
    content = {
        "documents": documents_collection.count_documents({"is_active": True}),
        "assessments": assessments_collection.count_documents({"is_active": True}),
        "flashcard_sets": flashcard_sets_collection.count_documents({"is_active": True}),
        "roadmaps_generated": learning_paths_collection.count_documents({}),
    }

    return {
        "users": {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "new_last_30_days": new_30d,
        },
        "assessments": {
            "total_attempts": total_attempts,
            "avg_score": avg_score,
            "by_department": dept_scores,
        },
        "flashcards": {
            "retention_rate": retention,
            "cards_mastered": mastered,
            "total_reviews": total_reviews,
        },
        "content": content,
    }


@router.get("/analytics/skill-gaps")
async def skill_gaps(
    department: Optional[str] = Query(None),
    hr_user: dict = Depends(require_hr_role),
):
    """Roll up every employee's growth-map weaknesses into an org/department
    skill-gap heatmap: skill -> counts by severity."""
    query = {}
    if department:
        query["department"] = department
    paths = list(learning_paths_collection.find(query))

    gaps = {}
    for p in paths:
        for w in p.get("weaknesses", []):
            if not isinstance(w, dict):
                continue
            skill = w.get("skill")
            if not skill:
                continue
            sev = w.get("severity", "moderate")
            g = gaps.setdefault(skill, {"skill": skill, "critical": 0, "moderate": 0, "minor": 0, "total": 0})
            if sev not in ("critical", "moderate", "minor"):
                sev = "moderate"
            g[sev] += 1
            g["total"] += 1

    out = list(gaps.values())
    # weight critical heaviest so the worst gaps surface first
    out.sort(key=lambda g: (g["critical"] * 3 + g["moderate"] * 2 + g["minor"]), reverse=True)
    return {"department": department, "skill_gaps": out, "employees_analyzed": len(paths)}
