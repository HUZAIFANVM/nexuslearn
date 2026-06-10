from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument
from database import assessments_collection, assessment_results_collection, assessment_attempts_collection
from config import settings
from auth.dependencies import get_current_user, require_hr_role
from documents.services import get_document_text
from assessments.services import generate_assessment_questions

router = APIRouter(tags=["Assessments"])


class AssessmentCreate(BaseModel):
    document_id: str
    name: str
    assessment_type: str = "mcq"  # mcq, scenario, mixed
    difficulty: str = "medium"
    num_questions: int = 10
    departments: Optional[List[str]] = None
    access_type: str = "all"
    time_limit_minutes: Optional[int] = None


class AnswerSubmit(BaseModel):
    question_id: str
    selected_answer_id: str


class AssessmentSubmission(BaseModel):
    answers: List[AnswerSubmit]
    time_taken_seconds: Optional[int] = None


def _parse_object_id(id_str: str) -> ObjectId:
    """Parse string to ObjectId with proper error handling."""
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail=f"Invalid ID format: {id_str}")


def _build_detailed_answers(assessment: dict, graded_answers: list) -> list:
    """Join stored graded answers with the assessment's questions so the client
    can render a full review (question text, options, the user's pick, the correct
    answer, and the explanation) from the answers alone — used by both the submit
    response and the 'view past result' endpoint."""
    question_map = {q["id"]: q for q in assessment["questions"]}
    detailed = []
    for ga in graded_answers:
        q = question_map.get(ga["question_id"], {})
        detailed.append({
            "question_id": ga["question_id"],
            "question": q.get("question", ""),
            "scenario_context": q.get("scenario_context"),
            "options": q.get("options", []),
            "selected_answer_id": ga.get("selected_answer_id"),
            "correct_answer_id": q.get("correct_answer_id"),
            "is_correct": ga.get("is_correct"),
            "explanation": q.get("explanation", ""),
        })
    return detailed


@router.post("/assessments")
async def create_assessment(
    data: AssessmentCreate, hr_user: dict = Depends(require_hr_role)
):
    from database import documents_collection

    document = documents_collection.find_one({"_id": _parse_object_id(data.document_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if data.assessment_type not in ["mcq", "scenario", "mixed"]:
        raise HTTPException(status_code=400, detail="Assessment type must be mcq, scenario, or mixed")

    if data.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Difficulty must be easy, medium, or hard")

    if data.num_questions < 1 or data.num_questions > 50:
        raise HTTPException(status_code=400, detail="num_questions must be between 1 and 50")

    if data.time_limit_minutes is not None and (data.time_limit_minutes < 1 or data.time_limit_minutes > 300):
        raise HTTPException(status_code=400, detail="time_limit_minutes must be between 1 and 300")

    if data.access_type not in ["all", "specific"]:
        raise HTTPException(status_code=400, detail="access_type must be 'all' or 'specific'")

    if data.access_type == "specific":
        if not data.departments:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Departments required for specific access",
            )
        for dept in data.departments:
            if dept not in settings.DEPARTMENTS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid department: {dept}",
                )

    text = get_document_text(data.document_id)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from document")

    try:
        questions = generate_assessment_questions(
            text, data.num_questions, data.difficulty, data.assessment_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate assessment: {str(e)}")

    assessment_doc = {
        "name": data.name,
        "document_id": data.document_id,
        "document_name": document["filename"],
        "assessment_type": data.assessment_type,
        "difficulty": data.difficulty,
        "num_questions": len(questions),
        "questions": questions,
        "departments": data.departments or [],
        "access_type": data.access_type,
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
        "is_active": True,
        "time_limit_minutes": data.time_limit_minutes,
    }
    result = assessments_collection.insert_one(assessment_doc)

    # Notify target employees
    from notifications.services import notify_new_assessment
    try:
        notify_new_assessment(data.name, data.access_type, data.departments or [], hr_user["email"])
    except Exception:
        pass  # Don't fail the main operation if notification fails

    return {
        "id": str(result.inserted_id),
        "name": data.name,
        "document_name": document["filename"],
        "assessment_type": data.assessment_type,
        "num_questions": len(questions),
        "difficulty": data.difficulty,
        "created_at": assessment_doc["created_at"],
    }


@router.get("/assessments")
async def list_assessments(current_user: dict = Depends(get_current_user)):
    query = {"is_active": True}
    if current_user["role"] == "employee":
        user_dept = current_user.get("department")
        if not user_dept:
            raise HTTPException(status_code=403, detail="User department not set")
        query["$or"] = [{"access_type": "all"}, {"departments": user_dept}]

    assessments = list(assessments_collection.find(query))

    # For employees, look up which of these they've already completed (and their
    # score) in one query, so the UI can show "Completed — X%" + a View Result
    # action instead of letting them silently re-take and hit a duplicate error.
    results_by_assessment = {}
    if current_user["role"] == "employee":
        user_id = str(current_user["_id"])
        assessment_ids = [str(a["_id"]) for a in assessments]
        for r in assessment_results_collection.find({
            "user_id": user_id,
            "assessment_id": {"$in": assessment_ids},
        }):
            results_by_assessment[r["assessment_id"]] = r

    out = []
    for a in assessments:
        aid = str(a["_id"])
        item = {
            "id": aid,
            "name": a["name"],
            "document_id": a["document_id"],
            "document_name": a["document_name"],
            "assessment_type": a["assessment_type"],
            "difficulty": a["difficulty"],
            "num_questions": a["num_questions"],
            "access_type": a["access_type"],
            "created_by": a["created_by"],
            "created_at": a["created_at"],
            "time_limit_minutes": a.get("time_limit_minutes"),
        }
        prior = results_by_assessment.get(aid)
        if prior:
            item["completed"] = True
            item["result_score"] = prior["score"]
            item["result_total"] = prior["total"]
            item["result_percentage"] = prior["percentage"]
        else:
            item["completed"] = False
        out.append(item)
    return out


@router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str, current_user: dict = Depends(get_current_user)):
    assessment = assessments_collection.find_one(
        {"_id": _parse_object_id(assessment_id), "is_active": True}
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user["role"] == "employee" and assessment.get("access_type") == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in assessment.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")

    questions = assessment["questions"]
    # For employees, strip correct answers
    if current_user["role"] == "employee":
        questions = [
            {
                "id": q["id"],
                "type": q["type"],
                "question": q["question"],
                "scenario_context": q.get("scenario_context"),
                "options": q["options"],
            }
            for q in questions
        ]

    # Employee starting (or refreshing) a timed attempt: stamp / fetch the
    # server-side `started_at` so we can enforce the time limit independently
    # of the client clock. Skipped if the user already has a recorded result.
    attempt_started_at = None
    if current_user["role"] == "employee" and assessment.get("time_limit_minutes"):
        user_id = str(current_user["_id"])
        existing_result = assessment_results_collection.find_one({
            "user_id": user_id,
            "assessment_id": str(assessment["_id"]),
        })
        if not existing_result:
            attempt = assessment_attempts_collection.find_one_and_update(
                {"user_id": user_id, "assessment_id": str(assessment["_id"])},
                {"$setOnInsert": {"started_at": datetime.utcnow()}},
                upsert=True,
                return_document=ReturnDocument.AFTER,
            )
            attempt_started_at = attempt["started_at"]

    return {
        "id": str(assessment["_id"]),
        "name": assessment["name"],
        "document_name": assessment["document_name"],
        "assessment_type": assessment["assessment_type"],
        "difficulty": assessment["difficulty"],
        "num_questions": assessment["num_questions"],
        "questions": questions,
        "time_limit_minutes": assessment.get("time_limit_minutes"),
        "attempt_started_at": attempt_started_at,
        "created_at": assessment["created_at"],
    }


@router.post("/assessments/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: str,
    submission: AssessmentSubmission,
    current_user: dict = Depends(get_current_user),
):
    assessment = assessments_collection.find_one(
        {"_id": _parse_object_id(assessment_id), "is_active": True}
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    if current_user["role"] == "employee" and assessment.get("access_type") == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in assessment.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")

    user_id = str(current_user["_id"])

    # Prevent duplicate submissions
    existing_result = assessment_results_collection.find_one({
        "user_id": user_id,
        "assessment_id": assessment_id,
    })
    if existing_result:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted this assessment"
        )

    # Server-side time tracking. If the assessment is timed, compute the elapsed
    # time from the stamped `started_at` (ignoring whatever the client reports).
    # This prevents the "refresh to reset the timer" exploit.
    time_limit = assessment.get("time_limit_minutes")
    server_time_taken: Optional[int] = None
    attempt_expired = False
    if time_limit:
        attempt = assessment_attempts_collection.find_one({
            "user_id": user_id,
            "assessment_id": assessment_id,
        })
        if attempt and attempt.get("started_at"):
            elapsed = (datetime.utcnow() - attempt["started_at"]).total_seconds()
            server_time_taken = int(round(elapsed))
            allowed_seconds = time_limit * 60 + 30  # 30s grace for network latency
            if elapsed > allowed_seconds:
                attempt_expired = True
                # Still accept the submission so the employee isn't stuck — but
                # flag the result so HR can see they ran over.
    # Fall back to client-claimed time if there is no server-side attempt record
    # (covers untimed assessments or legacy attempts started before this change).
    if server_time_taken is None:
        server_time_taken = submission.time_taken_seconds

    # Validate that all questions are answered (skip this check when the timer
    # has expired — we want to grade whatever the employee managed to answer).
    question_map = {q["id"]: q for q in assessment["questions"]}
    submitted_ids = {a.question_id for a in submission.answers}
    expected_ids = set(question_map.keys())

    missing = expected_ids - submitted_ids
    if missing and not attempt_expired:
        raise HTTPException(
            status_code=400,
            detail=f"Missing answers for {len(missing)} question(s)"
        )

    # Ignore answers for non-existent questions
    graded_answers = []
    score = 0
    for answer in submission.answers:
        question = question_map.get(answer.question_id)
        if not question:
            continue
        is_correct = answer.selected_answer_id == question["correct_answer_id"]
        if is_correct:
            score += 1
        graded_answers.append(
            {
                "question_id": answer.question_id,
                "selected_answer_id": answer.selected_answer_id,
                "is_correct": is_correct,
            }
        )

    total = len(assessment["questions"])
    percentage = round((score / total) * 100, 1) if total > 0 else 0

    result_doc = {
        "user_id": user_id,
        "user_email": current_user["email"],
        "assessment_id": assessment_id,
        "assessment_name": assessment["name"],
        "answers": graded_answers,
        "score": score,
        "total": total,
        "percentage": percentage,
        "time_taken_seconds": server_time_taken,
        "expired": attempt_expired,
        "completed_at": datetime.utcnow(),
    }
    assessment_results_collection.insert_one(result_doc)

    # Clear the attempt record so a redundant resubmit doesn't reuse stale state.
    if time_limit:
        assessment_attempts_collection.delete_one({
            "user_id": user_id,
            "assessment_id": assessment_id,
        })

    # Return result with full per-answer detail (question, options, correct, explanation)
    detailed_answers = _build_detailed_answers(assessment, graded_answers)

    return {
        "score": score,
        "total": total,
        "percentage": percentage,
        "answers": detailed_answers,
        "time_taken_seconds": server_time_taken,
        "expired": attempt_expired,
    }


@router.get("/assessments/{assessment_id}/results")
async def get_assessment_results(
    assessment_id: str, current_user: dict = Depends(get_current_user)
):
    result = assessment_results_collection.find_one(
        {
            "assessment_id": assessment_id,
            "user_id": str(current_user["_id"]),
        },
        sort=[("completed_at", -1)],
    )
    if not result:
        raise HTTPException(status_code=404, detail="No results found")

    # Join with the assessment's questions so the past-result review renders fully
    # (question text, options, correct answer, explanation) — same shape the submit
    # response returns. Fall back to the bare stored answers if the assessment was
    # since deleted.
    assessment = assessments_collection.find_one({"_id": _parse_object_id(assessment_id)})
    answers = _build_detailed_answers(assessment, result["answers"]) if assessment else result["answers"]

    return {
        "id": str(result["_id"]),
        "assessment_name": result["assessment_name"],
        "score": result["score"],
        "total": result["total"],
        "percentage": result["percentage"],
        "answers": answers,
        "time_taken_seconds": result.get("time_taken_seconds"),
        "completed_at": result["completed_at"],
    }


@router.get("/assessment-results")
async def get_all_results(hr_user: dict = Depends(require_hr_role)):
    results = list(assessment_results_collection.find().sort("completed_at", -1))
    return [
        {
            "id": str(r["_id"]),
            "user_email": r["user_email"],
            "assessment_name": r["assessment_name"],
            "score": r["score"],
            "total": r["total"],
            "percentage": r["percentage"],
            "time_taken_seconds": r.get("time_taken_seconds"),
            "completed_at": r["completed_at"],
        }
        for r in results
    ]


@router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str, hr_user: dict = Depends(require_hr_role)):
    result = assessments_collection.update_one(
        {"_id": _parse_object_id(assessment_id)},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"message": "Assessment deleted successfully"}
