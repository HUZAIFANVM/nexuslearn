# NexusLearn — Remaining Enhancement Phases

> Temporary reference file for continuing development later.
> All prior phases complete: Chatbot Optimization, Profile Picture Upload, Employee Management, SOP Automation, UI/UX Overhaul, In-App Notifications, Code Quality Pass, Growth Roadmap Enhancement, Bug Fix Pass, OCR Toggle on Upload.
> Phases 6-9 are pending. See `production.md` for production readiness tasks. See `bugs.md` for bug fix log.

---

## Phase 2: Employee Management (HR Admin) — ✅ COMPLETE

Implemented as planned. 8 backend endpoints in `backend/employees/` module, full management page at `/hr/employees`. Includes search, department/status filters, pagination, bulk actions, detail drawer with learning stats, edit dialog, reset password dialog. Profile picture avatars displayed throughout. Sidebar label changed from "Workforce Analytics" to "Employee Management". All 20 test cases passed.

---

## Phase 3: SOP of the Day Automation — ✅ COMPLETE

Implemented with modified approach: HR selects ONE document, system generates unique SOPs daily from it (not multi-document rotation). Tracks previously covered topics via LLM prompt to avoid repetition. When document content is exhausted (LLM signals `content_remaining: false`), automation pauses and HR is notified to pick a new document or reuse the same one (clears topic history). Includes startup catch-up — if server wasn't running at scheduled time, today's SOP is generated on startup.

**Backend:** `backend/sop_of_the_day/scheduler.py` (new), 4 new automation endpoints in routes.py, `generate_unique_sop_highlight()` in services.py, `SOP_AUTOMATION_PROMPT` in prompts.py, `sop_automation_config` collection, scheduler lifecycle in main.py, APScheduler dependency.

**Frontend:** Automation Settings card on SOPOfTheDayPage (toggle, time picker, doc selector, trigger now, covered topics, exhaustion alert with reuse/new doc options), Auto/Manual badges on history items, snackbar feedback.

---

## Phase 4: UI/UX Overhaul — ✅ COMPLETE

Comprehensive UI polish pass across the entire frontend:

1. **Collapsible Sidebar:** Open (220px, full labels) / Collapsed (64px, icons + tooltips). Chevron button to collapse, hamburger to expand. 0.25s smooth transition on sidebar and main content width.
2. **App-Wide Spacing Audit:** Eliminated excessive whitespace across all 15+ pages. Standardized spacing: headers `p: 3`, cards `p: 2.5`, grids `spacing: 2`, section gaps `mb: 2-2.5`. Landing page sections reduced from `py: 8-12` to `py: 5-7`.
3. **Chatbot Markdown Rendering:** Replaced plain-text bot responses with `react-markdown` + `remark-gfm`. Styled h1-h6 headings, bold/italic, lists, code blocks (dark theme), inline code, blockquotes, tables, links. No more raw `**asterisks**` or `# hashes`.
4. **Theme Fix:** Dialog padding 8px → 12px.
5. **Chat Page:** Bot list 280→250px, tightened card gaps, header padding.

**New Dependencies:** `react-markdown`, `remark-gfm`

**Modified Files:** Sidebar.jsx, AppLayout.jsx, ChatPage.jsx, theme.js, DashboardPage (HR+Employee), DocumentsPage, EmployeeManagementPage, SOPOfTheDayPage, SOPOfTheDayBanner, LandingPage, LoginForm, SignupForm.

---

## Phase 5: In-App Notifications — ✅ COMPLETE

Notification bell in the top-right corner of the app layout. Employees get notified when HR creates new assessments, flashcard sets, chatbots, documents, or SOPs. Notifications respect `access_type` and `departments` — employees only see notifications for resources they can access.

**Backend:** `backend/notifications/` module with 4 endpoints. Notification triggers added to assessments, flashcards, chatbots, documents, and SOP creation routes. `notifications` collection with compound indexes.

**Frontend:** `NotificationBell.jsx` component with badge count, popover dropdown, mark-as-read (individual + all), type-specific icons/colors, time-ago timestamps. Polls unread count every 30s. Integrated into `AppLayout.jsx`.

---

## URGENT: Retention Training "Practice Again" Mode

**Problem:** After completing a retention training session, employees can't practice again until cards are due (next day or later per SM-2 scheduling). In a corporate LMS, employees should be able to practice freely anytime.

**Solution:** Add a "Practice Again" button that shows all cards regardless of SM-2 schedule — free practice mode that does NOT affect SM-2 progress/intervals. Keeps the normal spaced repetition mode alongside it.

**Scope:**
- Backend: New endpoint `GET /flashcard-sets/{id}/practice` — returns all cards (ignores `next_review` schedule)
- Frontend: "Practice Again" button on FlashcardsPage when no cards are due. Practice mode reviews don't call the `/review` endpoint (no SM-2 state change).
- UI: Clear distinction between "Scheduled Review" (affects progress) and "Practice Mode" (free study, no tracking)

---

## Phase 6: AI-Powered Courses + Certificate Generation

### Concept
HR uploads a document -> AI generates a **complete course**:
1. **Course Summary** — structured reading material
2. **Retention Training** — linked flashcard set (reuses existing flashcard generation)
3. **Competency Evaluation** — linked assessment (reuses existing assessment generation)

Employee takes course: **Read -> Practice -> Test -> Certificate**
Score >= 80% on assessment -> PDF certificate auto-generated.

### Backend — New module `backend/courses/`

**New dependencies:** `reportlab>=4.0.0` in `requirements.txt`

**New files:**
- `backend/courses/__init__.py`
- `backend/courses/routes.py` — All endpoints + inline Pydantic models
- `backend/courses/services.py` — Course generation orchestrator + certificate PDF generation

**New collections:** `courses`, `certificates` in `database.py`

**Course document schema:**
```json
{
  "document_id": "...", "document_name": "...", "title": "...", "description": "...",
  "summary": {
    "executive_overview": "...", "key_topics": [], "critical_points": [],
    "estimated_read_time": 5, "quick_study_content": "..."
  },
  "flashcard_set_id": "...",
  "assessment_id": "...",
  "created_by": "...", "created_at": "...", "is_active": true,
  "access_type": "all|specific", "departments": [],
  "difficulty": "foundational|intermediate|advanced",
  "pass_threshold": 80
}
```

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/courses/generate` | HR | AI generates full course from document |
| GET | `/courses` | Any | List courses (dept-filtered for employees) |
| GET | `/courses/{id}` | Any | Course detail with progress |
| DELETE | `/courses/{id}` | HR | Deactivate course |
| GET | `/courses/{id}/progress` | Any | User's progress (read/practiced/tested) |
| POST | `/courses/{id}/mark-read` | Any | Mark course material as read |
| POST | `/courses/{id}/complete` | Any | Submit assessment + check certificate eligibility |
| GET | `/certificates` | Any | User's earned certificates |
| GET | `/certificates/{id}/download` | Any | Download certificate PDF |
| GET | `/certificates/all` | HR | All issued certificates across org |

**Course generation flow:**
1. Get document extracted text
2. LLM generates course summary (title, description, structured content)
3. Reuse existing `flashcards/services.py` -> `generate_flashcards()` for linked flashcard set
4. Reuse existing `assessments/services.py` -> `generate_assessment()` for linked assessment
5. Store course with linked IDs
6. Return complete course

**Certificate PDF:** Use `reportlab` — NexusLearn branding, employee name, course title, score, date, UUID certificate number. Store in GridFS.

### Frontend

**New files:**
- `frontend-react/src/api/courses.js`
- `frontend-react/src/pages/hr/CoursesPage.jsx` — Generate from docs, list, manage
- `frontend-react/src/pages/employee/CoursesPage.jsx` — Course browser + progress
- `frontend-react/src/pages/employee/CourseDetailPage.jsx` — Step-by-step (Read -> Practice -> Test)
- `frontend-react/src/pages/employee/CertificatesPage.jsx` — Certificate gallery
- `frontend-react/src/components/courses/CertificateDialog.jsx` — Celebration popup

**Navigation changes:**
- `Sidebar.jsx` — Add "Learning Courses" to both HR and Employee nav
- `App.jsx` — Add routes: `/hr/courses`, `/employee/courses`, `/employee/courses/:id`, `/employee/certificates`

---

## Phase 7: Gamification Engine (XP, Badges, Streaks, Leaderboards)

### Backend — New module `backend/gamification/`

**New files:**
- `backend/gamification/__init__.py`
- `backend/gamification/routes.py`
- `backend/gamification/services.py` — XP calculations, badge logic, streak tracking

**New collections:** `user_xp`, `xp_transactions`, `user_badges`

**XP rules:**
| Action | XP |
|--------|-----|
| Flashcard review | 5 per card |
| Flashcard mastery | 25 |
| Assessment completed | 30 |
| Assessment score bonus | 1 per % above 70 |
| Course completed | 50 |
| Certificate earned | 100 |
| SOP read | 10 |
| Chatbot question | 5 |
| Daily login | 10 |
| 7-day streak | 50 bonus |
| 30-day streak | 200 bonus |

**8 Badges:** First Steps, Flawless (100% assessment), Consistent Learner (7-day streak), Unstoppable (30-day streak), Knowledge Builder (10 cards mastered), Subject Expert (50 cards), SOP Champion (10 SOPs read), Explorer (all features used)

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/gamification/me` | Any | Current user XP, level, streak, badges |
| GET | `/gamification/leaderboard` | Any | Org-wide leaderboard |
| GET | `/gamification/leaderboard/department` | Any | Department leaderboard |
| GET | `/gamification/badges` | Any | All badges with unlock status |
| GET | `/gamification/engagement-stats` | HR | Org engagement statistics |

**Integration:** Add `award_xp()` calls to existing flashcard, assessment, SOP, chatbot, learning path, and new course/certificate routes.

### Frontend
- `frontend-react/src/api/gamification.js`
- `frontend-react/src/pages/employee/LeaderboardPage.jsx`
- `frontend-react/src/pages/employee/BadgesPage.jsx`
- `frontend-react/src/components/gamification/XPBar.jsx`
- `frontend-react/src/components/gamification/StreakIndicator.jsx`
- `frontend-react/src/components/gamification/BadgeUnlockedDialog.jsx`
- Modify employee `DashboardPage.jsx` — Add XP bar, streak, recent badges
- Modify HR `DashboardPage.jsx` — Add engagement stats card

---

## Phase 8: AI Document Summarizer

**On document upload/first access:** LLM auto-generates structured summary.

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/documents/{id}/summary` | Any | Get document summary |
| POST | `/documents/{id}/generate-summary` | HR | Generate/regenerate summary |
| GET | `/documents/{id}/quick-study` | Any | Condensed 2-minute reading |

**Summary fields:** executive_overview, key_topics, critical_points, difficulty_assessment, estimated_read_time, quick_study_content, key_testable_concepts

### Frontend
- `frontend-react/src/components/documents/DocumentSummaryDialog.jsx`
- `frontend-react/src/components/documents/QuickStudyDialog.jsx`
- Modify `DocumentsPage.jsx` — Add "AI Summary" + "Quick Study" buttons on document cards

---

## Phase 9: AI Workforce Intelligence Dashboard

**For HR:** LLM synthesizes cross-system data into natural-language insights.

### Backend — New module `backend/analytics/`

**New collection:** `analytics_reports` (cached AI reports with TTL)

**Endpoints:**
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/workforce-intelligence` | HR | AI-generated workforce insights |
| GET | `/analytics/department-gaps` | HR | Department skill gap analysis |
| GET | `/analytics/at-risk-employees` | HR | Disengaged employee detection |
| POST | `/analytics/refresh` | HR | Force refresh AI analysis |

### Frontend
- `frontend-react/src/pages/hr/WorkforceIntelligencePage.jsx`
- Health score card, department analysis grid, at-risk employee table, AI recommendations panel

---

## Dependencies to Add (by Phase)

| Phase | Package | File |
|-------|---------|------|
| Phase 6 | `reportlab>=4.0.0` | `backend/requirements.txt` |

> Note: Phase 3 deps (`APScheduler`) and Phase 4 deps (`react-markdown`, `remark-gfm`) are already installed.

---

## Implementation Order

| Phase | Enhancement | Status |
|-------|-----------|--------|
| Profile Picture | Avatar upload on signup + profile settings | ✅ DONE |
| Phase 2 | Employee Management | ✅ DONE |
| Phase 3 | SOP Automation | ✅ DONE |
| Phase 4 | UI/UX Overhaul (collapsible sidebar, spacing audit, markdown chat) | ✅ DONE |
| Phase 5 | In-App Notifications (bell, triggers on create) | ✅ DONE |
| Code Quality | SM-2 fix, validation, deduplication, prompt improvements | ✅ DONE |
| Growth Roadmap | Enhanced prompt, server-side scoring, HR view, project recs, assignment fitness | ✅ DONE |
| Bug Fix Pass | Mastery threshold, overview stats, assessment retry, dashboard crash | ✅ DONE |
| OCR Toggle | Optional OCR toggle on document upload (off by default, speeds up ingestion) | ✅ DONE |
| Production | Rate limiting, pagination, logging, auth audit | 📋 See `production.md` |
| **URGENT** | Retention Training "Practice Again" mode | 🔴 URGENT |
| Phase 6 | AI Courses + Certificates | 📋 NEXT |
| Phase 7 | Gamification | 📋 PENDING |
| Phase 8 | Document Summarizer | 📋 PENDING |
| Phase 9 | Workforce Intelligence | 📋 PENDING |

---

## Quick Start (When Resuming)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend-react
npm install
npm run dev
```

To continue: pick up from this file ("start Phase 6") or move to production.md ("do task #1").
