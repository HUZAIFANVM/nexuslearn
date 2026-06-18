import json
import re
import uuid
import random
from ai.llm import global_llm
from ai.usage import count_llm_call
from ai.prompts import (
    ASSESSMENT_MCQ_PROMPT, ASSESSMENT_SCENARIO_PROMPT,
    ASSESSMENT_TECHNICAL_MCQ_PROMPT, ASSESSMENT_TECHNICAL_SCENARIO_PROMPT,
)

# Question style selects the content perspective. "general" is the original
# policy/scenario style; "technical" produces coding/engineering questions.
# Format (mcq/scenario) and difficulty compose on top of whichever style is picked.
QUESTION_STYLE_PROMPTS = {
    "general": {"mcq": ASSESSMENT_MCQ_PROMPT, "scenario": ASSESSMENT_SCENARIO_PROMPT},
    "technical": {"mcq": ASSESSMENT_TECHNICAL_MCQ_PROMPT, "scenario": ASSESSMENT_TECHNICAL_SCENARIO_PROMPT},
}


def _parse_llm_json(content: str) -> list:
    """Parse JSON from LLM response, handling markdown code blocks."""
    content = content.strip()

    # Try direct JSON parse first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Extract from markdown code block
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in code block: {e}")

    raise ValueError(f"Could not parse JSON from LLM response: {content[:300]}")


def _shuffle_options(q: dict):
    """Randomize option order so the correct answer is evenly distributed across
    a/b/c/d. The model tends to park the correct answer on one letter ('b')
    regardless of the prompt, so we enforce distribution in code. Options are
    re-lettered by their new position and correct_answer_id is repointed."""
    opts = q.get("options")
    if not isinstance(opts, list) or len(opts) < 2:
        return
    correct_id = q.get("correct_answer_id")
    correct_opt = next((o for o in opts if isinstance(o, dict) and o.get("id") == correct_id), None)
    random.shuffle(opts)
    letters = "abcdefghijklmnop"
    for i, opt in enumerate(opts):
        if isinstance(opt, dict):
            opt["id"] = letters[i]
    if correct_opt is not None:
        q["correct_answer_id"] = correct_opt["id"]


def _normalize_question(q: dict):
    """Best-effort cleanup so minor LLM formatting quirks don't get a good
    question silently rejected (a common cause of under-count). Lowercases and
    trims option ids + correct_answer_id so 'A' / ' a ' still matches 'a'."""
    if isinstance(q.get("options"), list):
        for opt in q["options"]:
            if isinstance(opt, dict) and "id" in opt and isinstance(opt["id"], str):
                opt["id"] = opt["id"].strip().lower()
    if isinstance(q.get("correct_answer_id"), str):
        q["correct_answer_id"] = q["correct_answer_id"].strip().lower()


def _validate_question(q: dict, expected_type: str = None):
    """Validate that a question has all required fields and correct structure."""
    required = {"type", "question", "options", "correct_answer_id", "explanation"}
    missing = required - set(q.keys())
    if missing:
        raise ValueError(f"Question missing fields: {missing}")

    if expected_type and q["type"] != expected_type:
        raise ValueError(f"Expected type '{expected_type}', got '{q['type']}'")

    if not q["question"] or not q["question"].strip():
        raise ValueError("Question text cannot be empty")

    if not isinstance(q["options"], list) or len(q["options"]) < 2:
        raise ValueError("Question must have at least 2 options")

    option_ids = {opt["id"] for opt in q["options"]}
    if q["correct_answer_id"] not in option_ids:
        raise ValueError(
            f"correct_answer_id '{q['correct_answer_id']}' not in options {option_ids}"
        )


def _deduplicate_questions(questions: list) -> list:
    """Remove questions with duplicate text (case-insensitive)."""
    seen = set()
    unique = []
    for q in questions:
        key = q["question"].strip().lower()
        if key not in seen:
            seen.add(key)
            unique.append(q)
    return unique


def _generate_questions_with_retry(prompt: str, expected_type: str, num_requested: int, max_retries: int = 5) -> list:
    """Generate questions, retrying until we have num_requested UNIQUE, VALID ones.

    Small models routinely return fewer questions than asked, return duplicates,
    or emit malformed JSON on an attempt. So we:
      - deduplicate *inside* the loop (not after) so dupes never count toward the
        target and then get stripped, leaving us short;
      - treat a malformed/failed attempt as 0 questions and keep going instead of
        aborting the whole generation;
      - on each retry, tell the model exactly which questions already exist so it
        produces genuinely new ones rather than regenerating the same set.
    """
    collected = []
    seen = set()

    for attempt in range(max_retries + 1):
        remaining = num_requested - len(collected)
        if remaining <= 0:
            break

        if attempt == 0:
            current_prompt = prompt
        else:
            # Append a strong override + the list of questions already produced so
            # the model returns DIFFERENT ones. We append rather than rewrite the
            # body so we never accidentally alter numbers inside the document text.
            already = "\n".join(f"- {q['question']}" for q in collected)
            current_prompt = (
                f"{prompt}\n\n"
                f"You have ALREADY created these questions — do NOT repeat or rephrase any of them:\n"
                f"{already}\n\n"
                f"Now return EXACTLY {remaining} ADDITIONAL question(s) that are completely "
                f"different from the ones above. Output ONLY a JSON array of {remaining} new "
                f"question object(s) — no fewer, no more."
            )

        # A bad attempt (LLM error or unparseable JSON) must not abort the whole run.
        try:
            count_llm_call()  # one actual Groq request per retry iteration
            response = global_llm.invoke(current_prompt)
            questions = _parse_llm_json(response.content)
        except Exception:
            continue

        # Handle case where LLM returns a single object instead of an array
        if isinstance(questions, dict):
            questions = [questions]
        if not isinstance(questions, list):
            continue

        for q in questions:
            if not isinstance(q, dict):
                continue
            _normalize_question(q)
            try:
                _validate_question(q, expected_type=expected_type)
            except (ValueError, KeyError, TypeError):
                continue
            key = q["question"].strip().lower()
            if key in seen:
                continue
            _shuffle_options(q)
            seen.add(key)
            collected.append(q)
            if len(collected) >= num_requested:
                break

    return collected[:num_requested]


def generate_assessment_questions(
    document_text: str, num_questions: int, difficulty: str, assessment_type: str,
    question_style: str = "general",
) -> list:
    max_text_length = 12000
    truncated_text = document_text[:max_text_length]

    style = QUESTION_STYLE_PROMPTS.get(question_style)
    if style is None:
        raise ValueError(f"Invalid question_style: {question_style}")
    mcq_template = style["mcq"]
    scenario_template = style["scenario"]

    if assessment_type == "mcq":
        prompt = mcq_template.format(
            num_questions=num_questions,
            difficulty=difficulty,
            document_text=truncated_text,
        )
        questions = _generate_questions_with_retry(prompt, "mcq", num_questions)

    elif assessment_type == "scenario":
        prompt = scenario_template.format(
            num_questions=num_questions,
            difficulty=difficulty,
            document_text=truncated_text,
        )
        questions = _generate_questions_with_retry(prompt, "scenario", num_questions)

    elif assessment_type == "mixed":
        mcq_count = num_questions // 2
        scenario_count = num_questions - mcq_count

        mcq_prompt = mcq_template.format(
            num_questions=mcq_count,
            difficulty=difficulty,
            document_text=truncated_text,
        )
        scenario_prompt = scenario_template.format(
            num_questions=scenario_count,
            difficulty=difficulty,
            document_text=truncated_text,
        )

        mcq_questions = _generate_questions_with_retry(mcq_prompt, "mcq", mcq_count)
        scenario_questions = _generate_questions_with_retry(scenario_prompt, "scenario", scenario_count)

        questions = mcq_questions + scenario_questions
    else:
        raise ValueError(f"Invalid assessment_type: {assessment_type}")

    # Deduplicate questions
    questions = _deduplicate_questions(questions)

    # Add unique IDs
    for q in questions:
        q["id"] = f"q_{uuid.uuid4().hex[:8]}"

    return questions
