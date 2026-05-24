from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from database import flashcard_sets_collection, flashcard_reviews_collection
from config import settings
from auth.dependencies import get_current_user, require_hr_role
from documents.services import get_document_text
from flashcards.services import generate_flashcards, sm2_update

router = APIRouter(tags=["Flashcards"])


class FlashcardSetCreate(BaseModel):
    document_id: str
    name: str
    num_cards: int = 10
    difficulty: str = "medium"
    departments: Optional[List[str]] = None
    access_type: str = "all"


class ReviewSubmit(BaseModel):
    card_id: str
    quality: int  # 0-5


def _parse_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=400, detail=f"Invalid ID format: {id_str}")


def _get_dept_query(current_user: dict) -> dict:
    """Build department-filtered query for employees."""
    query = {"is_active": True}
    if current_user["role"] == "employee":
        user_dept = current_user.get("department")
        if not user_dept:
            raise HTTPException(status_code=403, detail="User department not set")
        query["$or"] = [{"access_type": "all"}, {"departments": user_dept}]
    return query


@router.post("/flashcard-sets")
async def create_flashcard_set(
    data: FlashcardSetCreate, hr_user: dict = Depends(require_hr_role)
):
    from database import documents_collection

    document = documents_collection.find_one({"_id": _parse_object_id(data.document_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    text = get_document_text(data.document_id)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from document")

    if data.difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Difficulty must be easy, medium, or hard")

    if data.num_cards < 1 or data.num_cards > 50:
        raise HTTPException(status_code=400, detail="num_cards must be between 1 and 50")

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

    try:
        cards = generate_flashcards(text, data.num_cards, data.difficulty)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

    flashcard_set = {
        "name": data.name,
        "document_id": data.document_id,
        "document_name": document["filename"],
        "num_cards": len(cards),
        "difficulty": data.difficulty,
        "cards": cards,
        "access_type": data.access_type,
        "departments": data.departments if data.access_type == "specific" else [],
        "created_by": hr_user["email"],
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = flashcard_sets_collection.insert_one(flashcard_set)

    # Notify target employees
    from notifications.services import notify_new_flashcard_set
    try:
        notify_new_flashcard_set(data.name, data.access_type, data.departments or [], hr_user["email"])
    except Exception:
        pass

    return {
        "id": str(result.inserted_id),
        "name": data.name,
        "document_name": document["filename"],
        "num_cards": len(cards),
        "difficulty": data.difficulty,
        "cards": cards,
        "created_at": flashcard_set["created_at"],
    }


@router.get("/flashcard-sets")
async def list_flashcard_sets(current_user: dict = Depends(get_current_user)):
    query = _get_dept_query(current_user)
    sets = list(flashcard_sets_collection.find(query))
    return [
        {
            "id": str(s["_id"]),
            "name": s["name"],
            "document_id": s["document_id"],
            "document_name": s["document_name"],
            "num_cards": s["num_cards"],
            "difficulty": s["difficulty"],
            "access_type": s.get("access_type", "all"),
            "created_by": s["created_by"],
            "created_at": s["created_at"],
        }
        for s in sets
    ]


@router.get("/flashcard-sets/{set_id}")
async def get_flashcard_set(set_id: str, current_user: dict = Depends(get_current_user)):
    fset = flashcard_sets_collection.find_one({"_id": _parse_object_id(set_id), "is_active": True})
    if not fset:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    if current_user["role"] == "employee" and fset.get("access_type") == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in fset.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": str(fset["_id"]),
        "name": fset["name"],
        "document_id": fset["document_id"],
        "document_name": fset["document_name"],
        "num_cards": fset["num_cards"],
        "difficulty": fset["difficulty"],
        "cards": fset["cards"],
        "created_by": fset["created_by"],
        "created_at": fset["created_at"],
    }


@router.delete("/flashcard-sets/{set_id}")
async def delete_flashcard_set(set_id: str, hr_user: dict = Depends(require_hr_role)):
    result = flashcard_sets_collection.update_one(
        {"_id": _parse_object_id(set_id)},
        {"$set": {"is_active": False, "deleted_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    return {"message": "Flashcard set deleted successfully"}


@router.get("/flashcard-sets/{set_id}/due")
async def get_due_cards(set_id: str, current_user: dict = Depends(get_current_user)):
    fset = flashcard_sets_collection.find_one({"_id": _parse_object_id(set_id), "is_active": True})
    if not fset:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    if current_user["role"] == "employee" and fset.get("access_type") == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in fset.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")

    user_id = str(current_user["_id"])
    now = datetime.utcnow()

    # Get all review records for this user and set
    reviews = {
        r["card_id"]: r
        for r in flashcard_reviews_collection.find(
            {"user_id": user_id, "flashcard_set_id": set_id}
        )
    }

    due_cards = []
    mastered = 0
    learning = 0
    new_count = 0

    for card in fset["cards"]:
        card_id = card["id"]
        review = reviews.get(card_id)

        if review is None:
            # New card — always due
            new_count += 1
            due_cards.append({**card, "status": "new"})
        elif review["next_review"] <= now:
            # Overdue
            if review["repetitions"] >= 1 and review["easiness_factor"] >= 2.0:
                mastered += 1
            else:
                learning += 1
            due_cards.append({**card, "status": "due", "last_quality": review.get("last_quality")})
        else:
            # Not due yet
            if review["repetitions"] >= 1 and review["easiness_factor"] >= 2.0:
                mastered += 1
            else:
                learning += 1

    # Sort: overdue first, then new
    due_cards.sort(key=lambda c: (0 if c["status"] == "due" else 1))

    return {
        "cards": due_cards,
        "cards_due": len(due_cards),
        "cards_mastered": mastered,
        "cards_learning": learning,
        "cards_new": new_count,
        "total_cards": len(fset["cards"]),
    }


@router.post("/flashcard-sets/{set_id}/review")
async def submit_review(
    set_id: str, data: ReviewSubmit, current_user: dict = Depends(get_current_user)
):
    if data.quality < 0 or data.quality > 5:
        raise HTTPException(status_code=400, detail="Quality must be between 0 and 5")

    fset = flashcard_sets_collection.find_one({"_id": _parse_object_id(set_id), "is_active": True})
    if not fset:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    if current_user["role"] == "employee" and fset.get("access_type") == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in fset.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")

    # Verify card exists in set
    card_exists = any(c["id"] == data.card_id for c in fset["cards"])
    if not card_exists:
        raise HTTPException(status_code=404, detail="Card not found in set")

    user_id = str(current_user["_id"])

    # Get existing review or create default
    existing = flashcard_reviews_collection.find_one(
        {"user_id": user_id, "flashcard_set_id": set_id, "card_id": data.card_id}
    )

    if existing is None:
        existing = {
            "easiness_factor": 2.5,
            "interval": 1,
            "repetitions": 0,
            "total_reviews": 0,
            "correct_count": 0,
        }

    # Run SM-2 algorithm
    updated = sm2_update(existing, data.quality)
    total_reviews = existing.get("total_reviews", 0) + 1
    correct_count = existing.get("correct_count", 0) + (1 if data.quality >= 3 else 0)

    review_doc = {
        "user_id": user_id,
        "user_email": current_user["email"],
        "flashcard_set_id": set_id,
        "card_id": data.card_id,
        "easiness_factor": updated["easiness_factor"],
        "interval": updated["interval"],
        "repetitions": updated["repetitions"],
        "next_review": updated["next_review"],
        "last_quality": updated["last_quality"],
        "last_reviewed": updated["last_reviewed"],
        "total_reviews": total_reviews,
        "correct_count": correct_count,
    }

    flashcard_reviews_collection.update_one(
        {"user_id": user_id, "flashcard_set_id": set_id, "card_id": data.card_id},
        {"$set": review_doc},
        upsert=True,
    )

    return {
        "card_id": data.card_id,
        "easiness_factor": updated["easiness_factor"],
        "interval": updated["interval"],
        "repetitions": updated["repetitions"],
        "next_review": updated["next_review"].isoformat(),
        "total_reviews": total_reviews,
        "correct_count": correct_count,
    }


@router.get("/flashcard-sets/{set_id}/stats")
async def get_set_stats(set_id: str, current_user: dict = Depends(get_current_user)):
    fset = flashcard_sets_collection.find_one({"_id": _parse_object_id(set_id), "is_active": True})
    if not fset:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    if current_user["role"] == "employee" and fset.get("access_type") == "specific":
        user_dept = current_user.get("department")
        if not user_dept or user_dept not in fset.get("departments", []):
            raise HTTPException(status_code=403, detail="Access denied")

    user_id = str(current_user["_id"])
    reviews = list(
        flashcard_reviews_collection.find(
            {"user_id": user_id, "flashcard_set_id": set_id}
        )
    )

    total_cards = len(fset["cards"])
    reviewed_ids = {r["card_id"] for r in reviews}
    new_count = total_cards - len(reviewed_ids)

    mastered = 0
    learning = 0
    total_ef = 0.0
    total_correct = 0
    total_reviews_count = 0
    now = datetime.utcnow()
    next_due_count = 0

    for r in reviews:
        total_ef += r["easiness_factor"]
        total_correct += r.get("correct_count", 0)
        total_reviews_count += r.get("total_reviews", 0)

        if r["repetitions"] >= 1 and r["easiness_factor"] >= 2.0:
            mastered += 1
        else:
            learning += 1

        if r["next_review"] <= now:
            next_due_count += 1

    # Add new cards to due count
    next_due_count += new_count

    avg_ef = total_ef / len(reviews) if reviews else 2.5
    retention_rate = (total_correct / total_reviews_count * 100) if total_reviews_count > 0 else 0.0

    # Calculate streak using UTC dates consistently
    streak_days = 0
    if reviews:
        review_dates = sorted(
            set(
                r["last_reviewed"].date()
                for r in reviews
                if r.get("last_reviewed")
            ),
            reverse=True,
        )
        today_utc = datetime.utcnow().date()
        for i, d in enumerate(review_dates):
            expected = today_utc - timedelta(days=i)
            if d == expected:
                streak_days += 1
            else:
                break

    return {
        "total_cards": total_cards,
        "mastered": mastered,
        "learning": learning,
        "new": new_count,
        "average_easiness": round(avg_ef, 2),
        "retention_rate": round(retention_rate, 1),
        "next_due_count": next_due_count,
        "streak_days": streak_days,
    }


@router.get("/flashcard-stats/overview")
async def get_overview_stats(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    # Get active sets (filtered by department for employees)
    query = _get_dept_query(current_user)
    active_sets = list(flashcard_sets_collection.find(query))
    active_set_ids = {str(s["_id"]) for s in active_sets}

    total_cards = sum(s["num_cards"] for s in active_sets)

    # Only count reviews belonging to active sets
    all_reviews = list(flashcard_reviews_collection.find({"user_id": user_id}))
    active_reviews = [r for r in all_reviews if r["flashcard_set_id"] in active_set_ids]

    total_mastered = 0
    total_learning = 0
    total_correct = 0
    total_reviews_count = 0

    for r in active_reviews:
        if r["repetitions"] >= 1 and r["easiness_factor"] >= 2.0:
            total_mastered += 1
        else:
            total_learning += 1
        total_correct += r.get("correct_count", 0)
        total_reviews_count += r.get("total_reviews", 0)

    reviewed_ids = {r["card_id"] for r in active_reviews}
    total_new = total_cards - len(reviewed_ids)

    retention_rate = (total_correct / total_reviews_count * 100) if total_reviews_count > 0 else 0.0

    return {
        "total_sets": len(active_sets),
        "total_cards": total_cards,
        "mastered": total_mastered,
        "learning": total_learning,
        "new": max(0, total_new),
        "retention_rate": round(retention_rate, 1),
        "total_reviews": total_reviews_count,
    }
