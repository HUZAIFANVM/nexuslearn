import json
from ai.llm import global_llm
from ai.usage import count_llm_call
from ai.prompts import LEARNING_PATH_PROMPT


def _dedupe(items: list) -> list:
    """De-duplicate while preserving order (drops falsy values)."""
    return list(dict.fromkeys(i for i in items if i))


def build_skill_evidence(assessment_summary: list, flashcard_summary: list) -> list:
    """Aggregate raw performance into a per-SUBJECT skill-evidence table.

    This is the cognitive-diagnosis step: instead of handing the LLM raw rows
    (which a small model reasons over poorly and which only carry meaningless
    names), we group every assessment and flashcard set by its source subject,
    tally correct vs incorrect, attach the SPECIFIC topics the employee missed,
    and derive a deterministic mastery_label. The LLM then names skills grounded
    in this digested evidence rather than inventing them from a label like
    "Quiz 1". A "subject" with no topic content is marked insufficient_data so
    the prompt can abstain instead of fabricating a skill.
    """
    by_subject = {}

    def bucket(subject):
        key = subject or "(unspecified subject)"
        if key not in by_subject:
            by_subject[key] = {
                "subject": key,
                "assessments_taken": 0,
                "questions_correct": 0,
                "questions_incorrect": 0,
                "missed_topics": [],
                "strong_topics": [],
                "flashcard_sets": 0,
                "flashcard_topics": [],
                "flashcard_mastered": 0,
                "flashcard_total": 0,
                "retention_rates": [],
                "has_topics": False,
            }
        return by_subject[key]

    for a in assessment_summary:
        b = bucket(a.get("subject"))
        b["assessments_taken"] += 1
        b["questions_correct"] += a.get("score", 0)
        b["questions_incorrect"] += max(0, a.get("total", 0) - a.get("score", 0))
        incorrect = a.get("topics_incorrect", [])
        correct = a.get("topics_correct", [])
        b["missed_topics"].extend(incorrect)
        b["strong_topics"].extend(correct)
        if incorrect or correct:
            b["has_topics"] = True

    for f in flashcard_summary:
        b = bucket(f.get("subject"))
        b["flashcard_sets"] += 1
        topics = f.get("topics", [])
        b["flashcard_topics"].extend(topics)
        b["flashcard_mastered"] += f.get("mastered", 0)
        b["flashcard_total"] += f.get("total", 0)
        if f.get("retention_rate") is not None:
            b["retention_rates"].append(f.get("retention_rate"))
        if topics:
            b["has_topics"] = True

    evidence = []
    for b in by_subject.values():
        q_total = b["questions_correct"] + b["questions_incorrect"]
        accuracy = round(b["questions_correct"] / q_total * 100, 1) if q_total else None
        retention = (
            round(sum(b["retention_rates"]) / len(b["retention_rates"]), 1)
            if b["retention_rates"] else None
        )
        mastery_ratio = (
            round(b["flashcard_mastered"] / b["flashcard_total"] * 100, 1)
            if b["flashcard_total"] else None
        )

        # Deterministic mastery label from whatever signals exist. Without topic
        # content there's no basis for a skill claim -> insufficient_data.
        signals = [s for s in (accuracy, retention, mastery_ratio) if s is not None]
        if not b["has_topics"] or not signals:
            label = "insufficient_data"
        else:
            avg = sum(signals) / len(signals)
            label = "strong" if avg >= 85 else "developing" if avg >= 60 else "weak"

        evidence.append({
            "subject": b["subject"],
            "mastery_label": label,
            "assessment_accuracy_pct": accuracy,
            "questions_correct": b["questions_correct"],
            "questions_incorrect": b["questions_incorrect"],
            "missed_topics": _dedupe(b["missed_topics"])[:12],
            "strong_topics": _dedupe(b["strong_topics"])[:6],
            "flashcard_topics": _dedupe(b["flashcard_topics"])[:15],
            "flashcard_mastered": b["flashcard_mastered"],
            "flashcard_total": b["flashcard_total"],
            "retention_rate": retention,
        })

    # Lead with the weakest subjects so the model anchors on real gaps first.
    order = {"weak": 0, "developing": 1, "strong": 2, "insufficient_data": 3}
    evidence.sort(key=lambda e: order.get(e["mastery_label"], 9))
    return evidence


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


def generate_learning_path(
    assessment_data: str, flashcard_data: str, available_documents: str, skill_evidence: str
) -> dict:
    prompt = LEARNING_PATH_PROMPT.format(
        skill_evidence=skill_evidence,
        assessment_data=assessment_data,
        flashcard_data=flashcard_data,
        available_documents=available_documents,
    )

    count_llm_call()
    response = global_llm.invoke(prompt)
    content = response.content.strip()

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    result = json.loads(content)

    # Overall headline summary (string). Default to empty if the model omits it.
    if not isinstance(result.get("summary"), str):
        result["summary"] = ""

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

    # Hard cap as a safety net so the roadmap never sprawls even if the model
    # ignores the "cluster & cap" instruction — keeps it readable and bounds the
    # payload. Lists are already ordered by severity/priority/strength.
    result["strengths"] = result["strengths"][:4]
    result["weaknesses"] = result["weaknesses"][:4]
    result["recommendations"] = result["recommendations"][:5]
    result["project_recommendations"] = result["project_recommendations"][:4]

    return result
