import json
import re
import uuid
from datetime import datetime, timedelta
from ai.llm import global_llm
from ai.prompts import FLASHCARD_GENERATION_PROMPT


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


def _validate_card(card: dict):
    """Validate that a flashcard has all required fields."""
    required = {"category", "scenario", "best_practice", "key_takeaway"}
    missing = required - set(card.keys())
    if missing:
        raise ValueError(f"Flashcard missing fields: {missing}")
    for field in required:
        if not card[field] or not str(card[field]).strip():
            raise ValueError(f"Flashcard field '{field}' cannot be empty")


def _deduplicate_cards(cards: list) -> list:
    """Remove cards with duplicate scenarios (case-insensitive)."""
    seen = set()
    unique = []
    for card in cards:
        key = card["scenario"].strip().lower()
        if key not in seen:
            seen.add(key)
            unique.append(card)
    return unique


def generate_flashcards(document_text: str, num_cards: int, difficulty: str) -> list:
    """Use LLM to generate scenario-based flashcards from document text."""
    # Truncate text if too long for context window
    max_text_length = 12000
    truncated_text = document_text[:max_text_length]

    prompt = FLASHCARD_GENERATION_PROMPT.format(
        num_cards=num_cards,
        difficulty=difficulty,
        document_text=truncated_text,
    )

    response = global_llm.invoke(prompt)
    cards = _parse_llm_json(response.content)

    # Validate each card
    for card in cards:
        _validate_card(card)

    # Deduplicate
    cards = _deduplicate_cards(cards)

    # Add unique IDs to each card
    for card in cards:
        card["id"] = f"card_{uuid.uuid4().hex[:8]}"

    return cards
