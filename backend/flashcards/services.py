import json
import re
import uuid
from datetime import datetime, timedelta
from ai.llm import global_llm
from ai.prompts import FLASHCARD_GENERATION_PROMPT, FLASHCARD_TECHNICAL_PROMPT

# Each flashcard style defines its prompt, the fields the LLM must return, and
# which field uniquely identifies a card (used for dedup). "scenario" is the
# original workplace-policy style; "technical" is the workshop / tech-stack style.
CARD_STYLES = {
    "scenario": {
        "prompt": FLASHCARD_GENERATION_PROMPT,
        "required": {"category", "scenario", "best_practice", "key_takeaway"},
        "dedup_key": "scenario",
    },
    "technical": {
        "prompt": FLASHCARD_TECHNICAL_PROMPT,
        "required": {"category", "concept", "explanation", "example", "key_takeaway"},
        "dedup_key": "concept",
    },
}


def sm2_update(review: dict, quality: int) -> dict:
    """
    SM-2 spaced repetition algorithm.
    quality: 0-5 rating from user.
    Returns updated review dict fields.
    """
    ef = review.get("easiness_factor", 2.5)
    interval = review.get("interval", 1)
    repetitions = review.get("repetitions", 0)

    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(interval * ef)  # floor, not round — standard SM-2
        repetitions += 1
    else:
        repetitions = 0
        interval = 1

    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = max(1.3, min(ef, 3.0))  # Clamp: 1.3 <= EF <= 3.0

    next_review = datetime.utcnow() + timedelta(days=interval)

    return {
        "easiness_factor": ef,
        "interval": interval,
        "repetitions": repetitions,
        "next_review": next_review,
        "last_quality": quality,
        "last_reviewed": datetime.utcnow(),
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


def _validate_card(card: dict, required: set):
    """Validate that a flashcard has all required fields for its style."""
    missing = required - set(card.keys())
    if missing:
        raise ValueError(f"Flashcard missing fields: {missing}")
    for field in required:
        if not card[field] or not str(card[field]).strip():
            raise ValueError(f"Flashcard field '{field}' cannot be empty")


def _deduplicate_cards(cards: list, key_field: str) -> list:
    """Remove cards whose identifying field is a duplicate (case-insensitive)."""
    seen = set()
    unique = []
    for card in cards:
        key = str(card[key_field]).strip().lower()
        if key not in seen:
            seen.add(key)
            unique.append(card)
    return unique


def generate_flashcards(
    document_text: str, num_cards: int, difficulty: str, card_style: str = "scenario"
) -> list:
    """Use the LLM to generate flashcards from document text.

    card_style selects the perspective:
      - "scenario":  workplace situation -> best practice (for SOPs/policies)
      - "technical": concept -> explanation -> example (for tech-stack workshops)
    """
    style = CARD_STYLES.get(card_style)
    if style is None:
        raise ValueError(f"Invalid card_style: {card_style}")

    # Truncate text if too long for context window
    max_text_length = 12000
    truncated_text = document_text[:max_text_length]

    prompt = style["prompt"].format(
        num_cards=num_cards,
        difficulty=difficulty,
        document_text=truncated_text,
    )

    response = global_llm.invoke(prompt)
    cards = _parse_llm_json(response.content)

    # Validate each card against its style's required fields
    for card in cards:
        _validate_card(card, style["required"])

    # Deduplicate on the style's identifying field
    cards = _deduplicate_cards(cards, style["dedup_key"])

    # Tag with style + a unique ID so the client knows how to render each card
    for card in cards:
        card["style"] = card_style
        card["id"] = f"card_{uuid.uuid4().hex[:8]}"

    return cards
