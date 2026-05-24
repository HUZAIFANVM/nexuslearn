import json
import re
import uuid
from ai.llm import global_llm
from ai.prompts import ASSESSMENT_MCQ_PROMPT, ASSESSMENT_SCENARIO_PROMPT


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


def _generate_questions_with_retry(prompt: str, expected_type: str, num_requested: int, max_retries: int = 2) -> list:
    """Generate questions with retry if LLM returns fewer than requested."""
    all_questions = []

    for attempt in range(max_retries + 1):
        remaining = num_requested - len(all_questions)
        if remaining <= 0:
            break

        # On retry, adjust the prompt to ask for only the remaining count
        if attempt > 0:
            # Replace the num_questions in the prompt for retry
            retry_prompt = prompt.replace(
                f"generate {num_requested} UNIQUE",
                f"generate {remaining} UNIQUE"
            ).replace(
                f"exactly {num_requested} items",
                f"exactly {remaining} items"
            )
            # Also add emphasis
            retry_prompt += f"\n\nIMPORTANT: You MUST return EXACTLY {remaining} questions. Not fewer, not more."
        else:
            retry_prompt = prompt

        response = global_llm.invoke(retry_prompt)
        questions = _parse_llm_json(response.content)

        # Handle case where LLM returns a single object instead of array
        if isinstance(questions, dict):
            questions = [questions]

        valid = []
        for q in questions:
            try:
                _validate_question(q, expected_type=expected_type)
                valid.append(q)
            except ValueError:
                continue

        all_questions.extend(valid)

    return all_questions[:num_requested]


def generate_assessment_questions(
    document_text: str, num_questions: int, difficulty: str, assessment_type: str
) -> list:
    max_text_length = 12000
    truncated_text = document_text[:max_text_length]

    if assessment_type == "mcq":
        prompt = ASSESSMENT_MCQ_PROMPT.format(
            num_questions=num_questions,
            difficulty=difficulty,
            document_text=truncated_text,
        )
        questions = _generate_questions_with_retry(prompt, "mcq", num_questions)

    elif assessment_type == "scenario":
        prompt = ASSESSMENT_SCENARIO_PROMPT.format(
            num_questions=num_questions,
            difficulty=difficulty,
            document_text=truncated_text,
        )
        questions = _generate_questions_with_retry(prompt, "scenario", num_questions)

    elif assessment_type == "mixed":
        mcq_count = num_questions // 2
        scenario_count = num_questions - mcq_count

        mcq_prompt = ASSESSMENT_MCQ_PROMPT.format(
            num_questions=mcq_count,
            difficulty=difficulty,
            document_text=truncated_text,
        )
        scenario_prompt = ASSESSMENT_SCENARIO_PROMPT.format(
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
