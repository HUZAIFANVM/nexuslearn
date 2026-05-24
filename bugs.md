# NexusLearn — Bug Fixes & Improvements Log

## Session: 2026-03-18

### Bug Fixes

#### 1. Flashcard Mastery Threshold Too Strict
- **Problem:** Even after rating all cards "Perfect", mastered count showed 0. SM-2 required `repetitions >= 3` (3 separate review sessions across days) to count a card as mastered — too strict for corporate LMS.
- **Fix:** Lowered mastery threshold to `repetitions >= 1` — one successful review (quality >= 3) now counts as mastered. SM-2 still schedules future reviews at increasing intervals.
- **Files:** `flashcards/routes.py`, `learning_paths/routes.py`, `employees/services.py`

#### 2. Flashcard Overview Stats Counting Deleted Sets
- **Problem:** Dashboard showed negative "New" cards (e.g. -10, -22). The `/flashcard-stats/overview` endpoint counted review records from ALL sets (including soft-deleted ones) but only counted `total_cards` from active sets. Result: `10 active cards - 32 reviewed card IDs = -22`.
- **Fix:** Filter reviews to only include those from active set IDs before calculating stats. Added `max(0, total_new)` safety clamp.
- **Files:** `flashcards/routes.py` (overview endpoint)

#### 3. Assessment Question Count — LLM Returning Fewer Than Requested
- **Problem:** HR requests 10 questions but LLM (Groq/Llama) sometimes returns only 1. Smaller models often ignore count instructions.
- **Fix:** Two-layer fix:
  1. Stronger prompts — added "You MUST return EXACTLY {num_questions} questions — no fewer, no more. Count carefully before responding."
  2. Retry logic (`_generate_questions_with_retry`) — if LLM returns fewer questions than requested, retries up to 2 more times asking for remaining count. Also handles LLM returning single object instead of array.
- **Files:** `assessments/services.py`, `ai/prompts.py`

#### 4. Employee Dashboard White Screen (Infinite Re-render)
- **Problem:** After growth roadmap enhancement, employee dashboard crashed with white screen. The dashboard rendered `path.strengths.map((s) => <Chip label={s} />)` expecting strings, but strengths were now objects `{skill, evidence, proficiency}`. React crashed trying to render objects as Chip labels.
- **Fix:** Added format detection — checks `typeof s === 'string'` and extracts `s.skill` for objects. Backward compatible with old string format.
- **Files:** `frontend-react/src/pages/employee/DashboardPage.jsx`

---

### Enhancements

#### 5. Growth Roadmap — Enhanced AI Analysis
- **Problem:** Growth roadmap prompt was vague ("analyze strengths and weaknesses"), producing generic results. Overall score was LLM-guessed (inconsistent). No project recommendations. HR could only see a single score number.
- **Changes:**
  - **Enhanced prompt:** Now asks for evidence-based strengths with proficiency level, weaknesses with severity (critical/moderate/minor) and gap descriptions, document recommendations tied to specific gaps, and project recommendations for managers.
  - **Server-side score calculation:** Weighted formula (60% assessment avg, 25% flashcard mastery rate, 15% retention rate) instead of LLM guessing.
  - **Validated LLM output:** Services validates all returned fields, handles malformed responses, backward compatible with old string format.
  - **HR "View Full Growth Roadmap" button:** In Employee Management detail drawer, opens a dialog showing full roadmap (score, strengths, weaknesses, project recommendations, document recommendations, assessment/flashcard summaries, generation timestamp).
  - **Updated employee LearningPathPage:** Shows structured strengths with proficiency badges, weaknesses with severity chips and colored borders, new "Suggested Projects for Growth" section.
- **Files:**
  - `backend/ai/prompts.py` — Enhanced LEARNING_PATH_PROMPT
  - `backend/learning_paths/services.py` — `calculate_overall_score()`, validation
  - `backend/learning_paths/routes.py` — Server-side score, stores `project_recommendations`, `user_name`, `department`
  - `frontend-react/src/pages/employee/LearningPathPage.jsx` — New structured UI
  - `frontend-react/src/pages/employee/DashboardPage.jsx` — Backward compat fix
  - `frontend-react/src/pages/hr/EmployeeManagementPage.jsx` — "View Growth Roadmap" button + dialog

#### 6. Growth Roadmap — Project Assignment Fitness
- **Problem:** Project recommendations were generic growth suggestions with no actionable guidance for HR/managers on whether to assign an employee to a project.
- **Enhancement:** Each project recommendation now includes:
  - `assignment_fitness`: **ready** (strong in required skills, assign directly), **supervised** (weak in some areas, assign under supervision), **not_ready** (critical gaps, needs training first)
  - `skills_required`: What skills the project demands
  - `fitness_rationale`: Evidence-based explanation citing actual scores
- **UI:** Color-coded fitness badges (green/yellow/red), dynamic card border colors, skills required chips (gray), fitness rationale box with colored background
- **Files:**
  - `backend/ai/prompts.py` — Updated LEARNING_PATH_PROMPT with fitness instructions
  - `backend/learning_paths/services.py` — Validation for new fields with defaults
  - `frontend-react/src/pages/employee/LearningPathPage.jsx` — Fitness badges, skills required, rationale display
  - `frontend-react/src/pages/hr/EmployeeManagementPage.jsx` — Same UI for HR roadmap view

---

### Pending (Saved for Later)

#### Retention Training "Practice Again" Mode
- **Problem:** After completing a review session, employees can't practice again until cards are due (next day or later per SM-2 scheduling).
- **Planned Fix:** Add "Practice Again" button — free practice mode that shows all cards without affecting SM-2 progress.
- **Status:** Saved in `phases.md` as URGENT
- **Details:** See `phases.md` for full scope
