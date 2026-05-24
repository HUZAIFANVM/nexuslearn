from bson import ObjectId
from database import (
    assessment_results_collection,
    flashcard_reviews_collection,
    flashcard_sets_collection,
    learning_paths_collection,
)


def get_employee_learning_stats(user_id: str) -> dict:
    """Gather learning stats for a single employee."""
    # Assessment stats
    assessment_results = list(assessment_results_collection.find({"user_id": user_id}))
    assessments_completed = len(assessment_results)
    avg_score = 0
    if assessments_completed > 0:
        avg_score = round(
            sum(r["percentage"] for r in assessment_results) / assessments_completed, 1
        )

    # Flashcard stats
    reviews = list(flashcard_reviews_collection.find({"user_id": user_id}))
    cards_reviewed = len(reviews)
    cards_mastered = sum(
        1 for r in reviews if r.get("repetitions", 0) >= 1 and r.get("easiness_factor", 2.5) >= 2.0
    )

    # Learning path
    learning_path = learning_paths_collection.find_one({"user_id": user_id})
    overall_score = learning_path.get("overall_score", 0) if learning_path else None

    return {
        "assessments_completed": assessments_completed,
        "avg_assessment_score": avg_score,
        "cards_reviewed": cards_reviewed,
        "cards_mastered": cards_mastered,
        "learning_path_score": overall_score,
    }
