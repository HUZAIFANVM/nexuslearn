import json
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from database import (
    learning_paths_collection,
    assessments_collection,
    assessment_results_collection,
    flashcard_reviews_collection,
    flashcard_sets_collection,
    documents_collection,
)
from auth.dependencies import get_current_user, require_hr_role
from learning_paths.services import generate_learning_path, calculate_overall_score, build_skill_evidence

router = APIRouter(tags=["Learning Paths"])


def _topic_stem(text: str, limit: int = 140) -> str:
    """Trim a question/scenario into a short topic stem for the prompt."""
    text = " ".join((text or "").split())
    return text[:limit] + ("…" if len(text) > limit else "")


def _gather_user_data(user_id: str, user_email: str) -> tuple:
    """Gather assessment and flashcard performance data for a user.

    Crucially, we enrich each item with the ACTUAL subject matter — the source
    document, the topics covered, and (for assessments) which specific question
    topics were answered right vs wrong. Without this the LLM only sees the
    assessment/set NAME, so a vaguely-named set ("Quiz 1") yields vague,
    ungrounded strengths/weaknesses/projects. The topic content is the real
    skill signal regardless of how HR named things.
    """
    # Assessment results — joined with the assessment to recover question topics.
    assessment_results = list(
        assessment_results_collection.find({"user_id": user_id})
    )
    assessment_summary = []
    for r in assessment_results:
        # The assessment may be soft-deleted; look it up without the is_active filter.
        assessment = None
        try:
            assessment = assessments_collection.find_one({"_id": ObjectId(r["assessment_id"])})
        except Exception:
            pass

        topics_correct, topics_incorrect = [], []
        if assessment:
            q_by_id = {q["id"]: q for q in assessment.get("questions", [])}
            for ans in r.get("answers", []):
                q = q_by_id.get(ans.get("question_id"))
                if not q:
                    continue
                stem = _topic_stem(q.get("scenario_context") or q.get("question"))
                if not stem:
                    continue
                if ans.get("is_correct"):
                    topics_correct.append(stem)
                else:
                    topics_incorrect.append(stem)

        assessment_summary.append(
            {
                "name": r["assessment_name"],
                "subject": assessment.get("document_name") if assessment else None,
                "type": assessment.get("assessment_type") if assessment else None,
                "difficulty": assessment.get("difficulty") if assessment else None,
                "score": r["score"],
                "total": r["total"],
                "percentage": r["percentage"],
                # The wrong topics are the precise skill gaps; cap to bound prompt size.
                "topics_incorrect": topics_incorrect[:12],
                "topics_correct": topics_correct[:6],
            }
        )

    # Flashcard performance — enriched with source document + the card categories
    # (topics) so skills are inferred from subject matter, not the set name.
    reviews = list(flashcard_reviews_collection.find({"user_id": user_id}))
    set_ids = list(set(r["flashcard_set_id"] for r in reviews))

    flashcard_summary = []
    for set_id in set_ids:
        fset = flashcard_sets_collection.find_one({"_id": ObjectId(set_id)})
        if not fset:
            continue
        set_reviews = [r for r in reviews if r["flashcard_set_id"] == set_id]
        mastered = sum(
            1 for r in set_reviews if r["repetitions"] >= 1 and r["easiness_factor"] >= 2.0
        )
        total = fset["num_cards"]
        total_correct = sum(r.get("correct_count", 0) for r in set_reviews)
        total_reviews_count = sum(r.get("total_reviews", 0) for r in set_reviews)
        retention = (
            round(total_correct / total_reviews_count * 100, 1) if total_reviews_count > 0 else 0
        )
        # Distinct topic categories across the cards in this set.
        topics = list(dict.fromkeys(
            c.get("category") for c in fset.get("cards", []) if c.get("category")
        ))
        flashcard_summary.append(
            {
                "set_name": fset["name"],
                "subject": fset.get("document_name"),
                "card_style": fset.get("card_style", "scenario"),
                "topics": topics[:15],
                "mastered": mastered,
                "total": total,
                "retention_rate": retention,
            }
        )

    # Available documents
    docs = list(documents_collection.find({"is_active": True}))
    available_docs = [
        {"id": str(d["_id"]), "name": d["filename"]} for d in docs
    ]

    return assessment_summary, flashcard_summary, available_docs


@router.post("/learning-paths/generate")
async def generate_path(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    assessment_summary, flashcard_summary, available_docs = _gather_user_data(
        user_id, current_user["email"]
    )

    if not assessment_summary and not flashcard_summary:
        raise HTTPException(
            status_code=400,
            detail="No assessment or flashcard data found. Complete some assessments or review flashcards first.",
        )

    # Aggregate raw performance into a per-subject skill-evidence table (the
    # cognitive-diagnosis step) so the LLM reasons over digested, grounded data
    # instead of meaningless names.
    skill_evidence = build_skill_evidence(assessment_summary, flashcard_summary)

    try:
        result = generate_learning_path(
            assessment_data=json.dumps(assessment_summary),
            flashcard_data=json.dumps(flashcard_summary),
            available_documents=json.dumps(available_docs),
            skill_evidence=json.dumps(skill_evidence, default=str),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate learning path: {str(e)}"
        )

    # Calculate score server-side from real data
    overall_score = calculate_overall_score(assessment_summary, flashcard_summary)

    path_doc = {
        "user_id": user_id,
        "user_email": current_user["email"],
        "user_name": current_user.get("full_name", current_user["email"]),
        "department": current_user.get("department", ""),
        "generated_at": datetime.utcnow(),
        "overall_score": overall_score,
        "summary": result.get("summary", ""),
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "recommendations": result.get("recommendations", []),
        "project_recommendations": result.get("project_recommendations", []),
        "assessment_summary": assessment_summary,
        "flashcard_summary": flashcard_summary,
        "skill_evidence": skill_evidence,
        "status": "active",
    }

    # Upsert — replace previous path for this user
    learning_paths_collection.update_one(
        {"user_id": user_id},
        {"$set": path_doc},
        upsert=True,
    )

    return path_doc


@router.get("/learning-paths/me")
async def get_my_path(current_user: dict = Depends(get_current_user)):
    path = learning_paths_collection.find_one({"user_id": str(current_user["_id"])})
    if not path:
        raise HTTPException(status_code=404, detail="No learning path found. Generate one first.")

    path["id"] = str(path.pop("_id"))
    return path


@router.get("/learning-paths/employees")
async def get_all_paths(hr_user: dict = Depends(require_hr_role)):
    paths = list(learning_paths_collection.find())
    for p in paths:
        p["id"] = str(p.pop("_id"))
    return paths


@router.get("/learning-paths/employees/{user_id}")
async def get_employee_path(user_id: str, hr_user: dict = Depends(require_hr_role)):
    path = learning_paths_collection.find_one({"user_id": user_id})
    if not path:
        raise HTTPException(status_code=404, detail="No learning path found for this employee")

    path["id"] = str(path.pop("_id"))
    return path
