import json
from ai.llm import global_llm
from ai.prompts import LEARNING_PATH_PROMPT


def calculate_overall_score(assessment_summary: list, flashcard_summary: list) -> int:
    """Calculate overall score server-side from real performance data.

    Weighted formula:
    - Assessment avg percentage: 60% weight
    - Flashcard mastery rate: 25% weight
    - Flashcard retention rate: 15% weight
    """
    scores = []
    weights = []

    # Assessment component (60% weight)
    if assessment_summary:
        avg_pct = sum(a["percentage"] for a in assessment_summary) / len(assessment_summary)
        scores.append(avg_pct)
        weights.append(0.6)

    # Flashcard mastery component (25% weight)
    if flashcard_summary:
        total_mastered = sum(f["mastered"] for f in flashcard_summary)
        total_cards = sum(f["total"] for f in flashcard_summary)
        mastery_pct = (total_mastered / max(total_cards, 1)) * 100
        scores.append(mastery_pct)
        weights.append(0.25)

        # Flashcard retention component (15% weight)
        avg_retention = sum(f["retention_rate"] for f in flashcard_summary) / len(flashcard_summary)
        scores.append(avg_retention)
        weights.append(0.15)

    if not scores:
        return 0

    # Normalize weights to sum to 1.0
    total_weight = sum(weights)
    overall = sum(s * (w / total_weight) for s, w in zip(scores, weights))
    return min(100, max(0, round(overall)))


def generate_learning_path(assessment_data: str, flashcard_data: str, available_documents: str) -> dict:
    prompt = LEARNING_PATH_PROMPT.format(
        assessment_data=assessment_data,
        flashcard_data=flashcard_data,
        available_documents=available_documents,
    )

    response = global_llm.invoke(prompt)
    content = response.content.strip()

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    result = json.loads(content)

    # Validate required fields
    if "strengths" not in result or not isinstance(result["strengths"], list):
        result["strengths"] = []
    if "weaknesses" not in result or not isinstance(result["weaknesses"], list):
        result["weaknesses"] = []
    if "recommendations" not in result or not isinstance(result["recommendations"], list):
        result["recommendations"] = []
    if "project_recommendations" not in result or not isinstance(result["project_recommendations"], list):
        result["project_recommendations"] = []

    # Validate strength objects
    validated_strengths = []
    for s in result["strengths"]:
        if isinstance(s, dict) and "skill" in s:
            validated_strengths.append({
                "skill": s.get("skill", ""),
                "evidence": s.get("evidence", ""),
                "proficiency": s.get("proficiency", "competent"),
            })
        elif isinstance(s, str):
            # Backward compat: plain string strengths
            validated_strengths.append({"skill": s, "evidence": "", "proficiency": "competent"})
    result["strengths"] = validated_strengths

    # Validate weakness objects
    validated_weaknesses = []
    for w in result["weaknesses"]:
        if isinstance(w, dict) and "skill" in w:
            validated_weaknesses.append({
                "skill": w.get("skill", ""),
                "evidence": w.get("evidence", ""),
                "severity": w.get("severity", "moderate"),
                "gap_description": w.get("gap_description", ""),
            })
        elif isinstance(w, str):
            validated_weaknesses.append({"skill": w, "evidence": "", "severity": "moderate", "gap_description": ""})
    result["weaknesses"] = validated_weaknesses

    # Validate project recommendations
    validated_projects = []
    for p in result["project_recommendations"]:
        if isinstance(p, dict) and "title" in p:
            validated_projects.append({
                "title": p.get("title", ""),
                "description": p.get("description", ""),
                "skills_required": p.get("skills_required", []),
                "skills_developed": p.get("skills_developed", []),
                "assignment_fitness": p.get("assignment_fitness", "supervised"),
                "fitness_rationale": p.get("fitness_rationale", ""),
                "rationale": p.get("rationale", ""),
            })
    result["project_recommendations"] = validated_projects

    return result
