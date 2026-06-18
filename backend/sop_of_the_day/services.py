import json
from ai.llm import global_llm
from ai.usage import count_llm_call
from ai.prompts import SOP_OF_THE_DAY_PROMPT, SOP_AUTOMATION_PROMPT


def generate_sop_highlight(document_name: str, document_text: str) -> dict:
    """Generate an AI-powered SOP of the Day highlight from document content."""
    # Truncate text if too long (keep first 8000 chars for context)
    text = document_text[:8000] if len(document_text) > 8000 else document_text

    prompt = SOP_OF_THE_DAY_PROMPT.format(
        document_name=document_name,
        document_text=text,
    )

    count_llm_call()
    response = global_llm.invoke(prompt)
    content = response.content.strip()

    # Extract JSON from response
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    return json.loads(content)


def generate_unique_sop_highlight(
    document_name: str,
    document_text: str,
    previous_topics: list,
) -> dict:
    """Generate a unique SOP highlight that avoids previously covered topics."""
    text = document_text[:8000] if len(document_text) > 8000 else document_text

    if previous_topics:
        topics_str = "\n".join(f"- {topic}" for topic in previous_topics)
    else:
        topics_str = "(none yet — this is the first SOP from this document)"

    prompt = SOP_AUTOMATION_PROMPT.format(
        document_name=document_name,
        document_text=text,
        previous_topics=topics_str,
    )

    count_llm_call()
    response = global_llm.invoke(prompt)
    content = response.content.strip()

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    result = json.loads(content)

    if "content_remaining" not in result:
        result["content_remaining"] = True

    return result
