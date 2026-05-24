# All AI prompt templates used across the application

FLASHCARD_GENERATION_PROMPT = """You are a corporate training specialist creating scenario-based flashcards.

Given this document, generate {num_cards} UNIQUE flashcards at {difficulty} level.

Each card must present a realistic WORKPLACE SCENARIO that an employee would face,
followed by the BEST PRACTICE response based on the document content.

IMPORTANT RULES:
- Each scenario MUST be distinct — no two cards should cover the same topic or situation
- Base all content strictly on the document — do not invent facts not in the document
- Vary the categories across different topics in the document

Difficulty:
- easy: Common, straightforward situations
- medium: Situations requiring judgment and policy knowledge
- hard: Edge cases, ambiguous situations, multi-step responses

Return ONLY valid JSON array with exactly {num_cards} items:
[
  {{
    "category": "topic area",
    "scenario": "A detailed workplace scenario (2-3 sentences)...",
    "best_practice": "The correct approach based on the document (2-4 sentences)...",
    "key_takeaway": "One-sentence summary of the principle."
  }}
]

Document content:
{document_text}
"""

ASSESSMENT_MCQ_PROMPT = """You are a corporate training assessment creator.

Given this document, generate {num_questions} UNIQUE multiple-choice questions at {difficulty} level.

Each question should test understanding of the document content.

IMPORTANT RULES:
- Each question MUST test a DIFFERENT concept — no duplicate or overlapping questions
- Distribute correct answers randomly across a, b, c, d — do NOT make them all the same letter
- All wrong options must be plausible (not obviously incorrect)
- Base questions strictly on the document content

Difficulty:
- easy: Questions answerable by directly quoting the document
- medium: Questions requiring connecting 2-3 concepts from the document
- hard: Questions requiring analysis or judgment on scenarios from the document

You MUST return EXACTLY {num_questions} questions — no fewer, no more. Count carefully before responding.

Return ONLY valid JSON array with exactly {num_questions} items:
[
  {{
    "type": "mcq",
    "question": "The question text",
    "options": [
      {{"id": "a", "text": "Option A"}},
      {{"id": "b", "text": "Option B"}},
      {{"id": "c", "text": "Option C"}},
      {{"id": "d", "text": "Option D"}}
    ],
    "correct_answer_id": "a",
    "explanation": "2-3 sentence explanation of why this is correct and why others are wrong"
  }}
]

Document content:
{document_text}
"""

ASSESSMENT_SCENARIO_PROMPT = """You are a corporate training assessment creator.

Given this document, generate {num_questions} UNIQUE scenario-based questions at {difficulty} level.

Each question should present a realistic workplace scenario and ask what the best course of action would be.

IMPORTANT RULES:
- Each scenario MUST be distinct — different situations, different decision types
- Distribute correct answers randomly across a, b, c, d — do NOT make them all the same letter
- All wrong options must be plausible actions (not obviously incorrect)
- Scenarios should be 2-4 sentences, realistic and specific
- Base scenarios strictly on the document content

Difficulty:
- easy: Common situations with clear correct answers from the document
- medium: Situations requiring connecting multiple document concepts
- hard: Complex scenarios requiring analysis of document policies/procedures

You MUST return EXACTLY {num_questions} questions — no fewer, no more. Count carefully before responding.

Return ONLY valid JSON array with exactly {num_questions} items:
[
  {{
    "type": "scenario",
    "question": "What should you do in this situation?",
    "scenario_context": "A detailed workplace scenario (2-4 sentences)...",
    "options": [
      {{"id": "a", "text": "Option A"}},
      {{"id": "b", "text": "Option B"}},
      {{"id": "c", "text": "Option C"}},
      {{"id": "d", "text": "Option D"}}
    ],
    "correct_answer_id": "b",
    "explanation": "2-3 sentence explanation of why this is the best approach"
  }}
]

Document content:
{document_text}
"""

SOP_OF_THE_DAY_PROMPT = """You are a corporate training specialist creating an engaging "SOP of the Day" highlight.

Given this document, create a concise, engaging daily SOP highlight that employees will see as a notification when they log in.

The highlight should:
- Have an attention-grabbing title (max 10 words)
- Provide a clear, concise summary (2-3 sentences) of the most important takeaway
- List 3 key points that employees should remember
- Include a practical tip they can apply immediately today

Return ONLY valid JSON:
{{
  "title": "Catchy title about the SOP topic",
  "summary": "A clear 2-3 sentence summary of the key takeaway from this document...",
  "key_points": [
    "First important point to remember",
    "Second important point to remember",
    "Third important point to remember"
  ],
  "practical_tip": "One actionable tip employees can apply right away today"
}}

Document name: {document_name}

Document content:
{document_text}
"""

SOP_AUTOMATION_PROMPT = """You are a corporate training specialist creating an engaging "SOP of the Day" highlight.

Given this document, create a concise, engaging daily SOP highlight focusing on a DIFFERENT topic or aspect than any previously covered.

The highlight should:
- Have an attention-grabbing title (max 10 words)
- Provide a clear, concise summary (2-3 sentences) of a specific takeaway NOT covered before
- List 3 key points that employees should remember about THIS specific topic
- Include a practical tip they can apply immediately today
- Assess whether the document still has meaningful, distinct content that has NOT been covered

PREVIOUSLY COVERED TOPICS (you MUST cover something DIFFERENT):
{previous_topics}

If the list above is empty, choose the most important topic from the document.
If all major topics have been covered, set content_remaining to false.

Return ONLY valid JSON:
{{
  "title": "Catchy title about the SOP topic",
  "summary": "A clear 2-3 sentence summary of a SPECIFIC takeaway not covered before...",
  "key_points": [
    "First important point to remember",
    "Second important point to remember",
    "Third important point to remember"
  ],
  "practical_tip": "One actionable tip employees can apply right away today",
  "content_remaining": true
}}

Set "content_remaining" to false ONLY if you believe all major distinct topics in this document have now been covered (including this one). Otherwise set it to true.

Document name: {document_name}

Document content:
{document_text}
"""

LEARNING_PATH_PROMPT = """You are a corporate learning advisor analyzing an employee's performance data to produce an actionable growth roadmap.

Assessment Results (name, score, total, percentage):
{assessment_data}

Flashcard Performance (set_name, mastered, total, retention_rate):
{flashcard_data}

Available Documents:
{available_documents}

ANALYSIS INSTRUCTIONS:
1. Identify specific SKILLS demonstrated by the data — not vague labels. Look at assessment names and flashcard set topics to infer domain skills.
2. For each strength, cite the evidence (e.g. "Scored 90% on Safety Protocols assessment").
3. For each weakness, assess severity (critical / moderate / minor) and describe the gap.
4. Recommend documents to study, prioritized by weakness severity.
5. Suggest 2-4 real-world PROJECT RECOMMENDATIONS — types of tasks or projects relevant to the employee's skill profile. For EACH project, assess assignment fitness:
   - "ready": Employee is STRONG in the required skills — assign directly, they can lead or own this.
   - "supervised": Employee is WEAK in some required skills — assign under supervision so they learn on the job.
   - "not_ready": Employee has CRITICAL gaps in required skills — do NOT assign yet, needs training first.
   Base fitness on the employee's actual assessment scores and flashcard mastery for the relevant skills.

Return ONLY valid JSON:
{{
  "strengths": [
    {{
      "skill": "Specific skill name",
      "evidence": "What data shows this strength",
      "proficiency": "strong|competent"
    }}
  ],
  "weaknesses": [
    {{
      "skill": "Specific skill name",
      "evidence": "What data shows this gap",
      "severity": "critical|moderate|minor",
      "gap_description": "What the employee needs to improve and why it matters"
    }}
  ],
  "recommendations": [
    {{
      "topic": "Topic name",
      "description": "Why they should study this",
      "document_id": "doc_id from available documents",
      "document_name": "filename from available documents",
      "priority": "high|medium|low",
      "reason": "Specific reason tied to their weakness data"
    }}
  ],
  "project_recommendations": [
    {{
      "title": "Short project/task title",
      "description": "What the project involves",
      "skills_required": ["skill1", "skill2"],
      "skills_developed": ["skill1", "skill2"],
      "assignment_fitness": "ready|supervised|not_ready",
      "fitness_rationale": "Why this fitness level — cite specific scores/evidence",
      "rationale": "Why this project is relevant to the employee's growth"
    }}
  ]
}}

IMPORTANT:
- Only reference document_id and document_name values that exist in the Available Documents list above.
- If no documents match a weakness, omit document_id and document_name for that recommendation.
- Be specific and evidence-based — avoid generic statements like "good performance" or "needs improvement".
- Project recommendations should be practical tasks a manager could realistically assign.
- EVERY project recommendation MUST include assignment_fitness (ready/supervised/not_ready) based on the employee's actual data. Do NOT default everything to one level.
"""
