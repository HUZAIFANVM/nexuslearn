# NexusLearn - Enterprise Learning Platform (Full Implementation Plan)

## Overview
Transform the monolithic FastAPI+Streamlit app into a modularized FastAPI backend + React (MUI) frontend with 5 AI-powered features: Knowledge Assistants, Retention Training (SM-2 Spaced Repetition), Competency Evaluations (MCQ + Scenario), AI-generated Growth Roadmaps, and SOP of the Day (Duolingo-style daily SOP highlights). The overall feel is a polished, modern corporate enterprise learning platform with premium aesthetics.

---

## Current Project Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Backend Modularization | ✅ DONE | main.py split into modules |
| Phase 2: Document Processing | ✅ DONE | extracted_text stored on upload |
| Phase 3: Retention Training (SM-2) | ✅ DONE | 8 endpoints, SM-2 algorithm |
| Phase 4: Competency Evaluations | ✅ DONE | 7 endpoints, MCQ/scenario/mixed |
| Phase 5: Growth Roadmaps | ✅ DONE | 4 endpoints, AI generation |
| Phase 6: React Frontend | ✅ DONE (has bug) | White screen bug — see Known Issues |
| Phase 7: Landing Page | ✅ DONE | Premium landing page at `/` with navbar, hero, stats, features, capabilities, CTA, footer |
| Phase 8: Modern Corporate Redesign | ✅ DONE | Full frontend overhaul — see Redesign Details |
| Phase 9: SOP of the Day | ✅ DONE | Duolingo-style daily SOP highlights — AI-generated from ingested docs |
| Phase 10: Email Verification + Google OAuth | ✅ DONE | Email verification required for signup, Google SSO option |
| Docker & Migration | ✅ DONE | docker-compose.yml ready |
| Phase 11: Chatbot Optimization | ✅ DONE | SSE streaming, DB optimization, Pinecone vector DB (replaced FAISS), chat UX polish |
| Profile Picture Upload | ✅ DONE | Optional avatar on signup, upload/change/remove anytime, GridFS storage |
| Phase 2: Employee Management | ✅ DONE | 8 endpoints, full HR management page — see details below |
| Phase 3: SOP Automation | ✅ DONE | APScheduler daily job, single-doc focus, catch-up on startup — see details below |
| Phase 4: UI/UX Overhaul | ✅ DONE | Collapsible sidebar, spacing audit, markdown chat — see details below |
| Phase 5: Notifications | ✅ DONE | In-app notification bell — triggered on new assessments, flashcards, chatbots, documents, SOPs |
| Code Quality Pass | ✅ DONE | SM-2 fix, JSON validation, deduplication, duplicate submission prevention, prompt improvements — see details below |
| Growth Roadmap Enhancement | ✅ DONE | Enhanced prompt, server-side scoring, HR view dialog, project recommendations, assignment fitness — see details below |
| Bug Fix Pass | ✅ DONE | Mastery threshold, overview stats negative count, assessment question count retry, dashboard crash — see `bugs.md` |
| OCR Toggle on Upload | ✅ DONE | Optional OCR toggle in upload dialog — off by default, speeds up non-scanned PDF ingestion |
| Super Admin & HR Approval | ✅ DONE | New `super_admin` role bootstrapped from `.env`; HR signups land as `status="pending"` and cannot log in until super admin approves — see details below |
| Design System Overhaul (Aurora + Glass) | ✅ DONE | New brand mark (knowledge graph), aurora background, glassmorphism across landing + entire in-app shell, floating IconRail + TopBar (replaces fixed sidebar), bento dashboards, FAQ accordion, animated entrance — see details below |
| Production Readiness | 📋 PENDING | See `production.md` for checklist (rate limiting, pagination, logging, etc.) |
| Phases 6-10 (Planned) | 📋 PENDING | See `phases.md` for full roadmap |

### Phase 8: Modern Corporate Redesign Details
- **Branding:** Renamed from "Corporate LMS" to **NexusLearn** — Enterprise Learning Platform
- **Design System:** Premium slate/blue palette, Plus Jakarta Sans headings, Inter body text, refined shadows/borders
- **Theme:** Complete MUI theme overhaul — custom palette, typography, component overrides (Card, Button, Chip, Dialog, Table, etc.)
- **Sidebar:** Dark gradient sidebar with brand icon, role badge, active-state indicator bar, gradient avatars
- **Landing Page:** 5-section scrollable page — fixed navbar, hero with auth forms, stats bar, features grid, capabilities section, CTA + footer
- **Dashboard Pages:** Rich layouts with welcome banners, stat cards with icons, performance charts, quick actions, recent activity feeds
- **Empty States:** All pages have styled empty states with icons, descriptive text, and action buttons (no blank/empty pages)
- **Corporate Feature Naming:** All features renamed to enterprise terminology (see Feature Naming Map below)

### Feature Naming Map (Old → New)
| Old Name | New Corporate Name | Context |
|----------|-------------------|---------|
| Corporate LMS | NexusLearn | Brand |
| Documents | Resource Library | HR page |
| Chatbots | Knowledge Assistants | HR page |
| Flashcards | Retention Training | HR + Employee pages |
| Assessments | Competency Evaluations | HR + Employee pages |
| Learning Path | Growth Roadmap | Employee page |
| Employee Progress | Workforce Analytics | HR page |
| Chat | AI Knowledge Hub | Employee page |
| easy/medium/hard | Foundational/Intermediate/Advanced | Difficulty levels |
| HR / Employee | HR Administrator / Team Member | Role labels |
| SOP of the Day | SOP of the Day | HR management + Employee login notification |

### Phase 9: SOP of the Day Details
- **Concept:** Duolingo "Word of the Day" style — HR sets a daily SOP highlight from ingested documents
- **AI Generation:** LLM generates an engaging title, summary, 3 key points, and a practical tip from the document's extracted text
- **Employee Experience:** On login, all employees see a premium dialog/notification with the SOP highlight. They can close it with the X button — dismissal is tracked per-user so it only shows once per SOP
- **HR Management:** Dedicated HR page (`/hr/sop-of-the-day`) to set new SOP of the Day from any uploaded document, view currently active SOP, deactivate, and browse history
- **Auto-deactivation:** Setting a new SOP automatically deactivates the previous one
- **Design:** Amber/orange gradient accent (distinct from blue theme), premium dialog with gradient header, key points cards, tip highlight box

### Feature Naming Map Update
| Old Name | New Corporate Name | Context |
|----------|-------------------|---------|
| SOP of the Day | SOP of the Day | HR + Employee notification |

### Phase 10: Email Verification + Google OAuth Details
- **Email Verification:** Users must verify email before logging in (uses `itsdangerous` for secure tokens, `fastapi-mail` for sending)
- **Google OAuth:** Single sign-on with Google accounts via `@react-oauth/google` and `google-auth`
- **Dev Mode:** When `DEV_MODE=true` in `.env`, emails are auto-verified (no SMTP required for local testing)
- **Account Linking:** If user signs up with email then uses Google with same email, accounts are linked (`auth_provider` becomes "both")
- **New User Fields:** `email_verified`, `google_id`, `auth_provider` ("local" | "google" | "both"), `profile_picture`
- **Rate Limiting:** Resend verification email limited to once per 2 minutes
- **Token Expiry:** Verification tokens expire after 24 hours (configurable)

#### New API Endpoints (Phase 10)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/verify-email` | Verify email with token from link |
| POST | `/resend-verification` | Resend verification email (2-min rate limit) |
| POST | `/auth/google` | Login/signup with Google ID token |
| POST | `/auth/google/complete` | Complete Google signup with role/department |

#### Authentication Flows
**Email Signup Flow:**
1. User submits signup form → account created with `email_verified: false`
2. Verification email sent (or auto-verified in dev mode)
3. User clicks link → `/verify-email?token=xxx` → email verified
4. User can now login

**Google OAuth Flow:**
1. User clicks "Sign in with Google" → Google popup
2. Frontend sends ID token to `/auth/google`
3. Existing user → JWT returned → logged in
4. New user → `{status: "pending_signup"}` → modal to select role/department → `/auth/google/complete`

### Phase 11: Chatbot Optimization Details
- **SSE Streaming:** New `POST /chat/stream` endpoint streams LLM responses token-by-token using Server-Sent Events. Manually handles condense question (non-streaming) + doc retrieval + streaming answer to avoid ConversationalRetrievalChain's callback issues with `AsyncIteratorCallbackHandler`.
- **Streaming LLM:** Added `streaming_llm` instance in `ai/llm.py` (ChatGroq with `streaming=True`) alongside existing `global_llm`.
- **DB Optimization:** Replaced 6 MongoDB operations per chat with 2-3 using aggregation pipelines (`get_chat_history_pairs()`, `save_chat_record()` with efficient trim). Added compound index on `(chatbot_id, user_id, timestamp)`.
- **Vector DB Swap:** Replaced FAISS (local disk) with Pinecone (managed cloud). Each document gets a Pinecone namespace (`doc_{document_id}`). No local caching or preloading needed — PineconeVectorStore is a stateless API wrapper. Old FAISS code commented out with `# [FAISS-DISABLED]` markers for easy revert.
- **Cache Invalidation:** Chain caches invalidated on document/chatbot delete. Pinecone namespace deleted on document delete.
- **Chat History Limit:** Reduced from 50 to 20 messages for LLM context (saves tokens), 100 max stored per user+chatbot.
- **Frontend UX:** Real-time streaming with blinking cursor, suggested question chips on empty state, message timestamps, copy response button (hover), retry button on errors, clear chat history button with confirmation dialog.
- **Clear Chat History:** `DELETE /chat-history/{chatbot_id}` endpoint + frontend button with confirmation prompt and success/error snackbar feedback.

### Profile Picture Upload Details
- **Signup:** Optional avatar picker (clickable circle with camera icon) above the Full Name field
- **Storage:** Images stored in GridFS (consistent with document upload pattern), file_id saved in user's `profile_picture` field
- **Validation:** JPG/PNG only, max 2MB (validated both client-side and server-side)
- **Profile Dialog:** Click sidebar avatar → opens ProfileDialog with upload/change/remove photo buttons, user info display
- **Display Logic:** Uploaded picture → Google profile picture (redirect) → Initials avatar (fallback)
- **Cache Busting:** Appends `?t={timestamp}` to avatar URL after upload/remove to force browser refetch
- **Signup Change:** `POST /signup` now accepts `multipart/form-data` (was JSON) — all form fields sent as Form() params + optional UploadFile

#### New API Endpoints (Profile Picture)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/avatar/{user_id}` | None | Serve avatar image (GridFS or redirect for Google URLs) |
| POST | `/me/avatar` | Any | Upload/replace profile picture |
| DELETE | `/me/avatar` | Any | Remove profile picture |

#### New/Modified Frontend Files
- `src/api/auth.js` — Added `uploadAvatar()`, `deleteAvatar()`, `getAvatarUrl()`; `signup()` now uses FormData
- `src/contexts/AuthContext.jsx` — Added `updateUser()` for live state updates
- `src/components/auth/SignupForm.jsx` — Added optional avatar picker with preview
- `src/components/profile/ProfileDialog.jsx` — **New file** — profile settings dialog
- `src/components/layout/Sidebar.jsx` — Avatar shows real image with initials fallback, clickable to open ProfileDialog

### Phase 2: Employee Management Details
- **Concept:** Full HR admin panel for managing employees — search, filter, edit, activate/deactivate, reset passwords, bulk actions
- **Backend Module:** `backend/employees/` with routes.py + services.py (8 endpoints, all HR-only auth)
- **No New Collections:** Reuses existing `users` collection
- **Learning Stats:** Detail drawer shows per-employee stats (assessments completed, avg score, cards reviewed/mastered, growth roadmap score)
- **Sidebar Rename:** "Workforce Analytics" → "Employee Management"
- **Old Page Replaced:** `EmployeeProgressPage.jsx` replaced by `EmployeeManagementPage.jsx`

#### New API Endpoints (Phase 2)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/employees` | HR | List employees (search, filter by dept/status, pagination) |
| GET | `/employees/stats` | HR | Aggregate stats (total, active, inactive, departments) |
| GET | `/employees/{id}` | HR | Employee detail + learning stats |
| PUT | `/employees/{id}` | HR | Update employee (department, role, is_active) |
| PUT | `/employees/{id}/deactivate` | HR | Deactivate account |
| PUT | `/employees/{id}/activate` | HR | Reactivate account |
| POST | `/employees/{id}/reset-password` | HR | Generate temp password (blocked for Google-only users) |
| POST | `/employees/bulk-action` | HR | Bulk activate/deactivate |

#### Employee Management Page Layout
1. Dark gradient hero header ("Employee Management")
2. 4 stat cards (Total, Active, Inactive, Departments)
3. Search bar + department filter + status filter
4. Employee table: Avatar, Name/Email, Department, Role chip, Status chip, Joined date, Actions
5. Checkbox column for bulk select + bulk action bar (activate/deactivate)
6. Right drawer for employee detail (profile + learning stats grid + growth roadmap score)
7. Edit dialog (department, role, status dropdowns)
8. Reset password confirmation dialog (shows temp password after generation)

### Feature Naming Map Update (Phase 2)
| Old Name | New Corporate Name | Context |
|----------|-------------------|---------|
| Workforce Analytics | Employee Management | HR sidebar nav |

### Phase 3: SOP of the Day Automation Details
- **Concept:** HR selects ONE document for automation. The system generates a unique SOP from it daily, tracking covered topics to avoid repetition. When the document's content is exhausted, HR is notified to pick a new document or reuse the same one (clears history).
- **Scheduler:** APScheduler `BackgroundScheduler` with `CronTrigger`, runs inside the FastAPI process. Daily job at configurable time (default 08:00).
- **Catch-up on Startup:** If the server wasn't running at the scheduled time, the scheduler checks on startup and generates today's SOP immediately if one hasn't been created yet.
- **Uniqueness:** All previously generated SOP titles are stored in `sop_automation_config.previous_topics` and passed to the LLM prompt so it generates different content each time.
- **Exhaustion Detection:** The LLM returns `content_remaining: true/false`. When `false`, automation pauses and `document_exhausted` is set in the config. HR sees an alert with options to reuse the same document (clears history) or select a new one.
- **Source Tracking:** Each SOP has a `source` field ("manual" or "automated") displayed as Auto/Manual badges in the UI.
- **UI:** Automation Settings card on HR SOP page with enable/disable toggle, schedule time picker, document selector, generated count, "Trigger Now" button, previously covered topics chips, and exhaustion alert.

#### New API Endpoints (Phase 3)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/sop-of-the-day/automation/config` | HR | Get automation settings |
| PUT | `/sop-of-the-day/automation/config` | HR | Update settings (enable/disable, time, document, clear history) |
| POST | `/sop-of-the-day/automation/trigger` | HR | Manual trigger for testing |
| GET | `/sop-of-the-day/automation/status` | HR | Automation status (active/disabled/exhausted/no_document) |

#### New/Modified Backend Files
- `backend/sop_of_the_day/scheduler.py` — **New** — APScheduler lifecycle, daily job, catch-up logic
- `backend/sop_of_the_day/routes.py` — Added 4 automation endpoints + `source` field on response model
- `backend/sop_of_the_day/services.py` — Added `generate_unique_sop_highlight()` with previous topics
- `backend/ai/prompts.py` — Added `SOP_AUTOMATION_PROMPT` with uniqueness + exhaustion detection
- `backend/database.py` — Added `sop_automation_config` collection
- `backend/main.py` — Added scheduler init/shutdown lifecycle hooks
- `backend/requirements.txt` — Added `APScheduler>=3.10.0,<4.0.0`

#### New/Modified Frontend Files
- `frontend-react/src/api/sopOfTheDay.js` — Added 4 automation API functions
- `frontend-react/src/pages/hr/SOPOfTheDayPage.jsx` — Added Automation Settings card, exhaustion alert, Auto/Manual badges, snackbar

### Phase 4: UI/UX Overhaul Details
- **Collapsible Sidebar:** Toggle button (chevron/hamburger) to open/close sidebar. Open: 220px with full labels. Collapsed: 64px with icon-only + tooltips. Smooth 0.25s transition on sidebar and main content. Main content expands to full width when sidebar is closed.
- **App-Wide Spacing Audit:** Systematic tightening of padding, margins, and gaps across all pages to eliminate wasted whitespace. Standardized spacing scale: headers `p: 3`, cards `p: 2.5`, grids `spacing: 2`, section gaps `mb: 2-2.5`. Reduced Landing page section padding from `py: 8-12` to `py: 5-7`.
- **Main Content Padding:** Reduced from `md: 4` → `md: 2` for tighter sidebar-to-content gap.
- **Dialog Padding:** Global theme dialog padding increased from 8px to 12px.
- **Chatbot Markdown Rendering:** Bot responses now render with `react-markdown` + `remark-gfm` instead of plain text. Styled headings (h1-h6), bold/italic, bullet/numbered lists, code blocks (dark theme), inline code (pink highlight), blockquotes (blue border), tables, links, and horizontal rules. No more raw asterisks or hash symbols in responses.
- **Chat Page Tightening:** Bot list width 280px → 250px, reduced card/message padding, tighter header.
- **New Dependencies:** `react-markdown`, `remark-gfm`

#### Files Modified (Phase 4)
- `src/components/layout/Sidebar.jsx` — Collapsible drawer with open/collapsed states, toggle button, icon tooltips, COLLAPSED_WIDTH export
- `src/components/layout/AppLayout.jsx` — Sidebar open state management, dynamic width/margin transitions
- `src/pages/employee/ChatPage.jsx` — ReactMarkdown rendering with full MUI-styled markdown CSS
- `src/theme/theme.js` — Dialog padding fix
- `src/pages/hr/DashboardPage.jsx` — Spacing tightened
- `src/pages/employee/DashboardPage.jsx` — Spacing tightened
- `src/pages/employee/ChatPage.jsx` — Layout + spacing tightened
- `src/pages/hr/DocumentsPage.jsx` — Spacing tightened
- `src/pages/hr/EmployeeManagementPage.jsx` — Spacing tightened
- `src/pages/hr/SOPOfTheDayPage.jsx` — Spacing tightened
- `src/components/SOPOfTheDayBanner.jsx` — Spacing tightened
- `src/pages/LandingPage.jsx` — Section padding reduced, card sizing tightened
- `src/components/auth/LoginForm.jsx` — Form gap reduced
- `src/components/auth/SignupForm.jsx` — Form gap reduced

### Code Quality Pass Details
Full code review and fixes across chatbots, assessments, and flashcards:

**Assessments fixes:**
- Duplicate submission prevention — users can only submit once per assessment
- All questions must be answered — incomplete submissions rejected with 400
- Server-side time limit enforcement (with 30s network grace)
- `num_questions` bounds validation (1-50)
- Robust JSON parsing with regex fallback and clear error messages
- Schema validation on LLM output (required fields, correct_answer_id in options)
- Question deduplication (case-insensitive)
- ObjectId format validation (returns 400 not 500)
- Null department check for employees

**Flashcards / SM-2 fixes:**
- SM-2 interval uses `int()` (floor) instead of `round()` — matches standard algorithm
- Easiness factor capped at 3.0 (was unbounded — could cause 200+ day intervals)
- Streak calculation uses UTC consistently (was mixing local timezone)
- `num_cards` bounds validation (1-50)
- Robust JSON parsing + card schema validation
- Card deduplication (case-insensitive on scenario text)
- Null department check for employees

**Chatbot fixes:**
- LRU chain cache (max 50 entries) — prevents unbounded memory growth
- Streaming task cleanup in `finally` block — no more leaked async tasks
- PromptTemplate instead of f-string interpolation — prevents prompt injection
- ObjectId format validation

**Prompt improvements (ai/prompts.py):**
- "Distribute correct answers randomly across a, b, c, d" — prevents same-letter bias
- "Each question/scenario MUST be distinct" — uniqueness instruction
- "All wrong options must be plausible" — better distractors
- "Base strictly on document content" — prevents hallucination
- Better difficulty definitions (easy=direct quote, medium=connect concepts, hard=analysis)

**Files modified:** `assessments/routes.py`, `assessments/services.py`, `flashcards/routes.py`, `flashcards/services.py`, `chatbots/routes.py`, `chatbots/services.py`, `ai/prompts.py`

### Growth Roadmap Enhancement Details
- **Enhanced AI Prompt:** Evidence-based strengths (skill + evidence + proficiency level), weaknesses (skill + evidence + severity + gap description), project recommendations with assignment fitness (ready/supervised/not_ready)
- **Server-Side Score:** Weighted formula replaces LLM-guessed score — 60% assessment avg, 25% flashcard mastery rate, 15% retention rate
- **LLM Output Validation:** All fields validated with type checks, backward compatible with old string format
- **HR View:** "View Full Growth Roadmap" button in Employee Management detail drawer opens a dialog with complete roadmap (score, strengths, weaknesses, project recommendations, document recommendations, performance summaries, timestamp)
- **Employee View:** Updated LearningPathPage with proficiency badges, severity chips (Critical/Moderate/Minor), "Suggested Projects for Growth" section with assignment fitness badges
- **Assignment Fitness:** Each project recommendation includes fitness level (ready/supervised/not_ready) — helps HR/managers decide who to assign to what project. Color-coded badges (green/yellow/red), skills required chips, fitness rationale with evidence from scores
- **Mastery Threshold:** Changed from `repetitions >= 3` to `repetitions >= 1` across all endpoints — one successful review now counts as mastered

#### Growth Roadmap Output Schema (New)
```json
{
  "strengths": [{"skill": "...", "evidence": "...", "proficiency": "strong|competent"}],
  "weaknesses": [{"skill": "...", "evidence": "...", "severity": "critical|moderate|minor", "gap_description": "..."}],
  "recommendations": [{"topic": "...", "description": "...", "document_id": "...", "document_name": "...", "priority": "high|medium|low", "reason": "..."}],
  "project_recommendations": [{"title": "...", "description": "...", "skills_required": ["..."], "skills_developed": ["..."], "assignment_fitness": "ready|supervised|not_ready", "fitness_rationale": "...", "rationale": "..."}]
}
```

#### Files Modified (Growth Roadmap Enhancement)
- `backend/ai/prompts.py` — Enhanced LEARNING_PATH_PROMPT
- `backend/learning_paths/services.py` — `calculate_overall_score()`, output validation
- `backend/learning_paths/routes.py` — Server-side score, stores new fields
- `backend/flashcards/routes.py` — Mastery threshold fix, overview stats active-set filtering
- `backend/employees/services.py` — Mastery threshold fix
- `backend/assessments/services.py` — Question count retry logic
- `frontend-react/src/pages/employee/LearningPathPage.jsx` — Structured strengths/weaknesses UI, project recommendations section
- `frontend-react/src/pages/employee/DashboardPage.jsx` — Backward compat for object format
- `frontend-react/src/pages/hr/EmployeeManagementPage.jsx` — "View Growth Roadmap" button + dialog

### Bug Fix Pass Details
See `bugs.md` for full details. Summary:
1. **Mastery threshold** — `repetitions >= 3` → `repetitions >= 1` (4 files)
2. **Overview stats -10 bug** — Filter reviews to active sets only
3. **Assessment question count** — Retry logic + stronger prompts
4. **Dashboard white screen** — Handle object format in strength/weakness chips

### Phase 5: In-App Notifications Details
- **Concept:** Notification bell in top-right of app layout. Employees get notified when HR creates new resources for them.
- **Backend Module:** `backend/notifications/` with routes.py + services.py (4 endpoints)
- **Collection:** `notifications` with compound indexes for user lookups and unread counts
- **Polling:** Frontend polls unread count every 30 seconds
- **Notification Types:** `new_assessment`, `new_flashcard_set`, `new_chatbot`, `new_document`, `new_sop`
- **Targeting:** Respects `access_type` and `departments` — employees only get notified for resources they can access
- **UI:** Bell icon with badge count, popover dropdown with notification list, mark as read (individual + all), time-ago timestamps, type-specific icons and colors, empty state

#### New API Endpoints (Phase 5)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | Any | User notifications (paginated, includes unread count) |
| GET | `/notifications/unread-count` | Any | Unread count only |
| POST | `/notifications/{id}/read` | Any | Mark single notification as read |
| POST | `/notifications/read-all` | Any | Mark all notifications as read |

#### Notification Triggers (added to existing routes)
| Trigger | Route | Target |
|---------|-------|--------|
| Assessment created | `POST /assessments` | Employees matching access_type/departments |
| Flashcard set created | `POST /flashcard-sets` | Employees matching access_type/departments |
| Chatbot created | `POST /chatbots` | Employees matching access_type/departments |
| Document uploaded | `POST /upload-document` | All employees |
| SOP of the Day created | `POST /sop-of-the-day` | All employees |

#### New/Modified Files
- `backend/notifications/__init__.py` — Module init
- `backend/notifications/routes.py` — 4 notification endpoints
- `backend/notifications/services.py` — Notification CRUD + convenience trigger helpers
- `backend/database.py` — Added `notifications` collection + indexes
- `backend/main.py` — Included notifications router
- `backend/assessments/routes.py` — Added notification trigger on create
- `backend/flashcards/routes.py` — Added notification trigger on create
- `backend/chatbots/routes.py` — Added notification trigger on create
- `backend/documents/routes.py` — Added notification trigger on upload
- `backend/sop_of_the_day/routes.py` — Added notification trigger on create
- `frontend-react/src/api/notifications.js` — API functions
- `frontend-react/src/components/notifications/NotificationBell.jsx` — Bell icon + popover dropdown
- `frontend-react/src/components/layout/AppLayout.jsx` — Added NotificationBell to top bar

### OCR Toggle on Upload Details
- **Problem:** OCR (pytesseract) on embedded PDF images was slow, making every document upload take a long time even for text-based PDFs.
- **Solution:** Added an "Enable OCR" toggle (off by default) in the upload dialog. HR can enable it only for scanned documents or PDFs with embedded images.
- **Backend:** Added `use_ocr: bool = Form(False)` param to `POST /upload-document`. Passed through `extract_text_from_file()` → `extract_text_from_pdf()`. When `False`, the image extraction + pytesseract loop is skipped entirely.
- **Frontend:** Styled toggle switch between file picker and auto-generate checkboxes with `DocumentScanner` icon, description text, and tooltip.

#### Modified Files
- `backend/documents/routes.py` — Added `use_ocr` form parameter, passed to extraction
- `backend/documents/services.py` — `extract_text_from_pdf()` and `extract_text_from_file()` accept `use_ocr` param, conditionally skip OCR
- `frontend-react/src/pages/hr/DocumentsPage.jsx` — Added OCR toggle switch in upload dialog

### Super Admin & HR Approval Details
- **New role:** `super_admin` (third role alongside `hr` / `employee`). Internal label "Super Admin". Used purely for moderating HR account approvals; super admin does NOT have access to HR-only endpoints (documents, chatbots, assessments, etc.).
- **Bootstrap mechanism:** A super_admin is seeded at FastAPI startup from environment variables `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` / `SUPER_ADMIN_NAME`. The seed is idempotent — runs only when no super_admin row exists yet. If the configured email is already taken by a non-super-admin user, the seed is skipped with a console warning (no overwrite).
- **Status field on users:** Every user now has a `status` field — one of `pending` | `approved` | `rejected`. Existing users (created before this feature) are auto-backfilled to `status="approved"` on the same startup hook. New employees: `approved` immediately. New HRs (local signup or Google OAuth): `pending`.
- **Login gate:** After password verification and email-verification check, login enforces:
  - HR with `status="pending"` → 403 "Your account is pending admin approval"
  - Any user with `status="rejected"` → 403 "Your account was rejected"
  - Super admin and approved HR/employee → JWT issued as before
- **Audit trail:** Approve/reject endpoints stamp `status_changed_at`, `status_changed_by` (super admin user id), and `status_reason` (optional, on reject) on the user document.
- **Frontend:** Super admin lands on `/admin/pending-hrs` after login. The page has Pending / Approved / Rejected tabs, an approve button, and a reject dialog with optional reason. Super admin sidebar shows only this single nav item plus the "Super Admin" role badge.
- **Pre-existing flows untouched:** All existing HR endpoints, employee endpoints, signup, Google OAuth, email verification, JWT issuance, etc. continue to work exactly as before — the only change to login is the new status check.

#### New API Endpoints (Super Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/hrs` | super_admin | List HR users, optional `status_filter=pending\|approved\|rejected` |
| GET | `/admin/hrs/pending` | super_admin | Convenience — pending HRs only |
| POST | `/admin/hrs/{user_id}/approve` | super_admin | Set HR status to `approved` |
| POST | `/admin/hrs/{user_id}/reject` | super_admin | Set HR status to `rejected` (optional `{reason}` body) |

#### New/Modified Backend Files (Super Admin & HR Approval)
- `backend/admin/__init__.py` — **New** — module init
- `backend/admin/routes.py` — **New** — 4 super-admin-only endpoints
- `backend/auth/bootstrap.py` — **New** — `seed_super_admin()` + `backfill_user_status()` (idempotent)
- `backend/auth/dependencies.py` — Added `require_super_admin_role`
- `backend/auth/routes.py` — Signup sets `status` based on role; login checks status; Google `/auth/google` and `/auth/google/complete` apply same gate
- `backend/main.py` — Registers `admin_router`; calls `run_bootstrap()` in startup hook
- `backend/config.py` — Added `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`
- `backend/models/user.py` — `UserResponse` now exposes `status`
- `backend/.env` — Added `SUPER_ADMIN_*` block

#### New/Modified Frontend Files (Super Admin & HR Approval)
- `frontend-react/src/api/admin.js` — **New** — `listHRs`, `listPendingHRs`, `approveHR`, `rejectHR`
- `frontend-react/src/pages/admin/PendingHRsPage.jsx` — **New** — tabbed approval queue (Pending / Approved / Rejected) with approve + reject-with-reason dialog
- `frontend-react/src/components/auth/ProtectedRoute.jsx` — Now understands `super_admin`; exports `homeForRole(role)` helper
- `frontend-react/src/App.jsx` — Adds `/admin/*` routes guarded by `requiredRole="super_admin"`
- `frontend-react/src/components/layout/Sidebar.jsx` — Adds super-admin nav (single "HR Approvals" link), role label map
- `frontend-react/src/components/auth/LoginForm.jsx` — Uses `homeForRole()` for post-login navigation (local + Google paths)
- `frontend-react/src/pages/LandingPage.jsx` — Uses `homeForRole()` for already-authenticated redirect

#### Updated Authentication Flows
**Email Signup Flow (HR variant):**
1. User submits signup with `role="hr"` → user created with `email_verified` (per dev/prod) AND `status="pending"`.
2. Verification email sent (or auto-verified in dev mode).
3. User attempts login → 403 "Your account is pending admin approval".
4. Super admin approves via `/admin/pending-hrs` → user record flips to `status="approved"`.
5. User logs in → normal HR JWT and dashboard.

**Email Signup Flow (Employee):** unchanged — `status="approved"` on creation.

**Google OAuth Flow (HR variant):**
1. User clicks Google sign-in → modal asks for role/dept → submits with `role="hr"`.
2. User row created with `status="pending"` and the endpoint returns 403 instead of issuing a JWT.
3. Super admin approves; user can sign in with Google as normal afterwards.

#### Deferred Hardening (intentionally left for later)
- **Email-verified filter on pending list** — pending HRs whose email is not yet verified are still listed. Adding `email_verified=true` to the pending query will prevent spam from unconfirmed addresses. Trivial change inside `admin/routes.py:list_pending_hrs`.
- **Rate limit `/signup`** — currently unbounded. Covered by `production.md` task #3 (rate limiting via `slowapi`).

### Design System Overhaul Details (Aurora + Glassmorphism)

This pass replaced the original "MUI default cards on a flat slate background" look with a coherent aurora-and-glass design language inspired by Karsaaz Agent + Linear/Vercel. It applies to **both** the public landing page and the in-app shell — every page benefits from the same primitives.

#### Brand Mark — `NexusMark.jsx`
- **Concept:** A custom SVG knowledge-graph glyph — central hub + 3 connected satellite nodes, with the top-right satellite intentionally larger and pulled higher to suggest upward growth (the "Learn" half of the name). A faint orbital ring around the hub adds depth at hero size and gracefully fades at favicon size.
- **Implementation:** Renders in `currentColor`, so it inherits whatever the parent text color is — works on top of the brand blue→purple gradient chip (white) and in any monochrome context.
- **Replaces:** The generic `AutoAwesome` MUI sparkle that was previously used as the brand glyph in the landing navbar/footer, sidebar header, login/signup card headers, and verify-email page. `AutoAwesome` is still used decoratively as an "AI feature" indicator on dashboards/buttons (different intent).
- **Favicon:** `public/nexus-mark.svg` — the same glyph baked onto the brand gradient (since favicons can't inherit page color). Wired in `index.html` via `<link rel="icon" type="image/svg+xml" href="/nexus-mark.svg" />`.

#### Glass + Aurora Primitives — `src/theme/glass.js`
A small reusable module of `sx`-compatible style objects, all light/dark-mode aware, all ready to spread onto any element:
- `glassCard(theme)` — frosted card surface (~62% opaque + 22px blur + 160% saturate + soft inner highlight + 1px translucent border).
- `glassNavbar(theme)` — slightly less opaque variant for sticky/floating chrome (24px blur, 180% saturate).
- `glassButton(theme)` — translucent secondary CTA with hover lift.
- `brandPillButton` — solid blue→purple gradient pill (`borderRadius: 999`, glow shadow, 1px hover lift) — the canonical primary CTA across the app.
- `auroraBackground(theme)` — full-page aurora: 4 soft radial-gradient blobs (blue, purple, amber, teal) at ~70-80% saturation in centres, fading to transparent at ~45% radius, on a `#FAFBFF → #F5F3FF` base. Dark mode swaps in deeper, slightly muted versions over `#0B0F1A → #111827`.
- `auroraBackgroundSubtle(theme)` — lighter version with 2 ellipses for sections that aren't the hero.
- **Animation primitives** (all wrapped in `@media (prefers-reduced-motion: no-preference)` so users opted out of motion get a static UI):
  - `fadeInUp(delayMs)` — opacity 0 + translateY(12px) → final state, 0.5s cubic-bezier. Apply with stagger (e.g. `idx * 40`) for cascade.
  - `floatGently` — slow 6s loop, ±6px vertical drift, used on hero icons / decorative orbs.
  - `glassShineHover` — `::before` pseudo-element sweeps a subtle white gradient across the card on hover (700ms cubic-bezier). Card needs `position: relative; overflow: hidden`.
  - `hoverLift(theme)` — translateY(-3px) + intensified shadow on hover.

#### MUI Theme Glassification — `src/theme/theme.js`
Theme-level component overrides so **every Card / Paper / Dialog / Accordion / Popover / Menu** is glass by default — pages get the look "for free" without per-component edits:
- `MuiCard` — 18px radius, 22px blur + 160% saturate, ~62% white / ~55% slate background, soft white inner highlight, soft outer shadow, brand-tinted hover shadow.
- `MuiDialog` — 22px radius, 28px blur + 160% saturate, ~78% opaque background, deeper outer shadow.
- `MuiAccordion` — 16px radius (instead of 12px), 20px blur, glass background.
- `MuiPopover` / `MuiMenu` — 22px blur, ~82% opaque, brand-tinted border.

#### Landing Page (`/`)
- **Aurora background:** Fixed full-page aurora layer (`position: fixed`, `inset: 0`, `zIndex: 0`, `pointerEvents: none`) that flows behind every section. Hero and Capabilities sit transparently on top; Features and FAQ get their own *subtler* aurora tint.
- **Floating pill navbar:** Detached from the screen edges — centered, max-width 1180px, 999px radius (full pill on desktop, 18px on mobile). Frosted glass.
- **Auth card** (right side of hero) → glass.
- **Feature / capability cards** → glass + `glassShineHover` + tinted hover lift toward each card's accent.
- **Animated scroll-down indicator** at the bottom of the hero — gradient label "Scroll to Explore" + animated mouse outline with a brand-gradient dot traveling down inside + 3 staggered chevrons fading downward + a soft brand-gradient halo behind, all on a `prefers-reduced-motion: no-preference` guard. Click or keyboard (Enter/Space) smoothly scrolls to the Features section.
- **FAQ section** between Capabilities and CTA — 6 product-relevant questions in MUI `Accordion` (glass-themed). Below the accordion: a "Still have questions? Start a free trial" prompt linking to signup.
- **All primary CTAs** unified to `brandPillButton`. Secondary CTAs use `glassButton`.

#### In-App Shell — Floating Glass Islands
The original "fixed sidebar + main pane" shell was replaced with floating glass islands:
- **`AppLayout.jsx`** (rewritten) — aurora layer fixed behind everything; main canvas is transparent; pages render their own glass cards on top. Fade-up entrance for `<main>`. Old `Sidebar.jsx` deleted.
- **`IconRail.jsx`** (new) — vertical glass capsule floating at `left:16, top:96, bottom:24`, width 68px. Brand glyph at top, role-aware nav icons (active → brand-gradient pill with glow), logout pinned at bottom. Hover scales + tooltips. Massively more space for content than the old 220px sidebar.
- **`TopBar.jsx`** (new) — floating pill at top-center between the rail and right edge. Role chip (Super Admin / HR Administrator / Team Member) + "Welcome back, *FirstName*" + theme toggle (rotates 8° on hover) + notification bell + clickable avatar (opens ProfileDialog).
- **Result:** All in-app pages inherit the aurora + the same floating chrome with zero per-page wiring.

#### Bento Dashboards
- **HR Dashboard** rebuilt as a 2-column bento: hero card (gradient + decorative orbs + floating animation) + 4 stat tiles + quick actions on the left; performance bar + recent activity on the right. Stagger fade-up across all tiles.
- **Employee Dashboard** rebuilt with the same pattern: hero + retention progress on left; quick links + growth roadmap (with floating circular score) on right.
- The old "uniform 4-up stat row + performance + quick actions" grid is gone. New layout is more visually distinctive while preserving every data point.

#### Per-Page Glass Polish
- **Chat (`AI Knowledge Hub`)** — user bubbles became brand-gradient pills with glow shadow; bot bubbles became frosted glass; send button is a brand-pill with hover lift; typing-dots bubble is glass.
- **HR list pages** (Documents, Chatbots, Flashcards, Assessments) — every card has stagger fade-up + `glassShineHover` + tinted hover-lift; CTAs swapped to `brandPillButton`.
- **Employee Management** — gradient banner replaced with a glass hero card (brand gradient + floating decorative orb); stat tiles animate in with stagger; drawer header re-themed.
- **SOP of the Day** — hero became amber→orange→red gradient glass card with floating decorative orb; "Set New SOP" became frosted-on-gradient pill.
- **Learning Path / Employee Flashcards / Employee Assessments / Pending HRs** — all CTAs unified to `brandPillButton`, card grids stagger-animate.
- **Pending HRs** also got a glass hero card.

#### Chrome Polish
- **NotificationBell** — bigger hover hit area, rotates 8° on hover when there are unread items, badge has a 2px white halo, popover header is a soft brand-tint gradient strip.
- **SOPBanner dialog** — header now uses the amber→orange→red gradient (slate gradient in dark mode) instead of the dull black slate.
- **ProfileDialog** unchanged — already glass via theme.

#### Accessibility & Performance
- All entrance + decorative animations are gated by `@media (prefers-reduced-motion: no-preference)`. Users who set "Reduce motion" in their OS get a static UI.
- `backdrop-filter` is paired with `-webkit-backdrop-filter` for Safari compatibility.
- Brand mark and scroll-down indicator have `role="button"` / `aria-label` / keyboard activation where interactive.
- Glass surfaces inherit MUI's contrast tokens — text remains AA-compliant in both themes.

#### New / Modified Frontend Files
- `frontend-react/public/nexus-mark.svg` — **New** — gradient-baked favicon SVG.
- `frontend-react/index.html` — Linked the SVG favicon.
- `frontend-react/src/theme/glass.js` — **New** — glass + aurora + animation primitives.
- `frontend-react/src/theme/theme.js` — Glass defaults applied across `MuiCard / MuiPaper / MuiDialog / MuiAccordion / MuiPopover / MuiMenu`.
- `frontend-react/src/components/brand/NexusMark.jsx` — **New** — brand glyph (knowledge graph SVG).
- `frontend-react/src/components/layout/AppLayout.jsx` — Rewritten as floating-islands shell.
- `frontend-react/src/components/layout/IconRail.jsx` — **New** — floating left rail.
- `frontend-react/src/components/layout/TopBar.jsx` — **New** — floating top pill.
- `frontend-react/src/components/layout/Sidebar.jsx` — **Deleted** — replaced by IconRail+TopBar.
- `frontend-react/src/pages/LandingPage.jsx` — Aurora layer, floating pill navbar, scroll-down indicator, FAQ accordion, glass cards across all sections, brand-pill CTAs.
- `frontend-react/src/components/auth/LoginForm.jsx`, `SignupForm.jsx`, `pages/VerifyEmailPage.jsx` — Brand mark, glass card backdrop, aurora background.
- `frontend-react/src/pages/hr/DashboardPage.jsx`, `pages/employee/DashboardPage.jsx` — Rebuilt as bento.
- `frontend-react/src/pages/employee/ChatPage.jsx` — Glass bubbles, brand-pill send.
- `frontend-react/src/pages/hr/DocumentsPage.jsx`, `ChatbotsPage.jsx`, `FlashcardsPage.jsx`, `AssessmentsPage.jsx`, `EmployeeManagementPage.jsx`, `SOPOfTheDayPage.jsx` — Hero/CTA/card glass + stagger animations.
- `frontend-react/src/pages/employee/LearningPathPage.jsx`, `FlashcardsPage.jsx`, `AssessmentsPage.jsx` — `brandPillButton` CTAs + animated card grids.
- `frontend-react/src/pages/admin/PendingHRsPage.jsx` — Glass hero + animated layout.
- `frontend-react/src/components/notifications/NotificationBell.jsx` — Hover micro-interactions, gradient header, glass popover (via theme).
- `frontend-react/src/components/SOPOfTheDayBanner.jsx` — Brand-gradient header.

#### Tuning Knobs
Two files drive the entire design language. Change one value in `glass.js` (e.g. blur radius, aurora colors, animation timing) and it propagates app-wide:
- `src/theme/glass.js` — colors, blur, opacities, animation timing.
- `src/theme/theme.js` — MUI component defaults.

### Known Issues / TODO
- **LangChain deprecation warnings**: Backend shows warnings about importing from `langchain` instead of `langchain-community`. Functional but should be updated eventually (see `production.md` task #8).
- **Frontend not tested end-to-end**: All pages built but user flows not verified yet.
- **Streamlit frontend**: Old `frontend/streamlit_app.py` still exists — safe to delete. The React frontend (`frontend-react/`) is the active frontend.
- **Production readiness**: See `production.md` for remaining non-functional improvements (rate limiting, pagination, logging, auth audit, CORS lockdown, input sanitization).
- **Super admin recovery**: There is no self-serve password reset for the super admin. Recovery is "edit `.env`, delete the existing super_admin row in Mongo, restart the backend".

---

## How to Run (Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (`net start MongoDB` on Windows)
- Tesseract OCR installed (for PDF image text extraction)

### Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd frontend-react
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`, Backend on `http://localhost:8000`

### Run with Docker (for migration / deployment)
```bash
# From project root
docker-compose up --build
```
Frontend: `http://localhost:3000` | Backend: `http://localhost:8000` | MongoDB: `localhost:27017`

---

## Project File Structure

```
test_project/
├── docker-compose.yml
├── .dockerignore
├── spec.md                          # THIS FILE — project plan & checkpoint
├── production.md                    # Production readiness checklist (rate limiting, pagination, logging, etc.)
├── phases.md                        # Remaining enhancement phases roadmap
│
├── backend/
│   ├── Dockerfile
│   ├── .env                         # API keys, SMTP credentials, GOOGLE_CLIENT_ID, DEV_MODE (DO NOT commit to git)
│   ├── requirements.txt
│   ├── main.py                      # Slim entry (~40 lines) — includes all routers
│   ├── config.py                    # pydantic-settings, loads .env, Pinecone client init
│   ├── database.py                  # MongoDB client + all collection refs
│   ├── ai/
│   │   ├── llm.py                   # ChatGroq global_llm + streaming_llm (Llama 4 Scout)
│   │   ├── embeddings.py            # HuggingFace all-MiniLM-L6-v2
│   │   └── prompts.py               # All AI prompt templates
│   ├── auth/
│   │   ├── routes.py                # POST /signup (multipart), /login, /verify-email, /resend-verification, /auth/google, /auth/google/complete, GET /me, /departments, /avatar/{user_id}, POST/DELETE /me/avatar
│   │   ├── dependencies.py          # get_current_user, require_hr_role, require_super_admin_role
│   │   ├── utils.py                 # JWT creation, password hashing
│   │   ├── email_service.py         # Email verification (fastapi-mail, itsdangerous)
│   │   ├── google_auth.py           # Google OAuth token verification
│   │   └── bootstrap.py             # seed_super_admin() + backfill_user_status() — runs at startup
│   ├── admin/
│   │   └── routes.py                # 4 super-admin-only endpoints: list HRs, pending, approve, reject
│   ├── models/
│   │   ├── user.py                  # UserCreate, UserLogin, Token, UserResponse
│   │   ├── document.py              # DocumentResponse
│   │   └── chatbot.py               # ChatbotCreate/Response, ChatMessage/Response
│   ├── documents/
│   │   ├── routes.py                # POST /upload-document, GET /documents, DELETE
│   │   └── services.py              # PDF extraction, Pinecone indexing, get_document_text()
│   ├── chatbots/
│   │   ├── routes.py                # CRUD chatbots, POST /chat, POST /chat/stream (SSE), GET/DELETE /chat-history
│   │   └── services.py              # Pinecone vectorstore retrieval, chain cache, optimized history helpers
│   ├── flashcards/
│   │   ├── routes.py                # 8 endpoints (CRUD, due, review, stats, overview)
│   │   └── services.py              # SM-2 algorithm, AI card generation
│   ├── assessments/
│   │   ├── routes.py                # 7 endpoints (CRUD, submit, results)
│   │   └── services.py              # AI question generation (MCQ/scenario/mixed)
│   ├── learning_paths/
│   │   ├── routes.py                # 4 endpoints (generate, me, employees, employee/{id})
│   │   └── services.py              # AI path generation from performance data
│   ├── employees/
│   │   ├── routes.py                # 8 endpoints (list, stats, detail, update, activate, deactivate, reset-password, bulk-action)
│   │   └── services.py              # Learning stats aggregation per employee
│   ├── notifications/
│   │   ├── routes.py                # 4 endpoints (list, unread-count, read, read-all)
│   │   └── services.py              # Notification CRUD + trigger helpers (notify_new_assessment, etc.)
│   └── sop_of_the_day/
│       ├── routes.py                # 9 endpoints (5 original + 4 automation: config, update, trigger, status)
│       ├── services.py              # AI SOP highlight generation (manual + unique/automated)
│       └── scheduler.py             # APScheduler daily job, catch-up on startup, reschedule
│
├── frontend-react/
│   ├── Dockerfile
│   ├── nginx.conf                   # SPA routing + API proxy for production
│   ├── package.json
│   ├── .env                         # VITE_API_URL, VITE_GOOGLE_CLIENT_ID
│   ├── vite.config.js               # Dev proxy /api -> localhost:8000
│   ├── index.html                   # Plus Jakarta Sans + Inter fonts, custom scrollbar
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── App.jsx                  # GoogleOAuthProvider, Routes: /, /login, /signup, /verify-email, /admin/* (super_admin), /hr/* (hr), /employee/* (employee)
│       ├── theme/
│       │   ├── theme.js             # Premium MUI theme — slate palette, glass defaults across Card/Paper/Dialog/Accordion/Popover/Menu
│       │   └── glass.js             # Reusable style helpers — glassCard, glassNavbar, glassButton, brandPillButton, auroraBackground(Subtle), fadeInUp, floatGently, glassShineHover, hoverLift
│       ├── contexts/AuthContext.jsx  # Token + user in localStorage, updateUser()
│       ├── api/
│       │   ├── client.js            # Axios + JWT interceptor
│       │   ├── auth.js              # login, signup (FormData), getMe, getDepartments, verifyEmail, resendVerification, googleAuth, googleCompleteSignup, uploadAvatar, deleteAvatar, getAvatarUrl
│       │   ├── employees.js         # getEmployees, getEmployeeStats, getEmployee, updateEmployee, activate, deactivate, resetPassword, bulkAction
│       │   ├── documents.js         # upload, list, delete
│       │   ├── chatbots.js          # CRUD, sendMessage, sendMessageStream (SSE), getChatHistory, clearChatHistory
│       │   ├── flashcards.js        # CRUD, getDueCards, submitReview, stats
│       │   ├── assessments.js       # CRUD, submit, getResults
│       │   ├── learningPaths.js     # generate, getMyPath, getAllPaths
│       │   ├── notifications.js     # getNotifications, getUnreadCount, markAsRead, markAllAsRead
│       │   ├── admin.js             # listHRs, listPendingHRs, approveHR, rejectHR (super_admin only)
│       │   └── sopOfTheDay.js       # create, getActive, dismiss, history, deactivate + automation (config, update, trigger, status)
│       ├── components/
│       │   ├── SOPOfTheDayBanner.jsx # SOP of the Day login notification dialog (shown in AppLayout)
│       │   ├── profile/
│       │   │   └── ProfileDialog.jsx # Profile settings dialog — upload/change/remove avatar, user info
│       │   ├── notifications/
│       │   │   └── NotificationBell.jsx # Bell icon with badge + popover dropdown (type icons, mark read, time-ago)
│       │   ├── brand/
│       │   │   └── NexusMark.jsx    # Custom SVG brand glyph — knowledge graph (central hub + 3 satellites), inherits currentColor
│       │   ├── layout/
│       │   │   ├── AppLayout.jsx    # Floating-glass-island shell — fixed aurora layer + IconRail + TopBar + transparent main canvas
│       │   │   ├── IconRail.jsx     # Floating left-side glass capsule — brand glyph + role-based icon nav (active = brand-gradient pill) + logout
│       │   │   └── TopBar.jsx       # Floating top pill — role chip + greeting + theme toggle + NotificationBell + clickable avatar (ProfileDialog)
│       │   └── auth/
│       │       ├── LoginForm.jsx     # Clean card design, Google OAuth, verification handling — uses homeForRole()
│       │       ├── SignupForm.jsx    # Clean card design, Google OAuth, optional avatar picker, verification success state
│       │       ├── ProtectedRoute.jsx # Route guard + exports homeForRole(role) for redirect targets (super_admin / hr / employee)
│       │       ├── GoogleButton.jsx  # Google sign-in button component
│       │       └── GoogleSignupModal.jsx # Role/department selection for new Google users
│       └── pages/
│           ├── LandingPage.jsx      # Premium 5-section landing — navbar, hero+auth, stats, features, capabilities, CTA, footer
│           ├── LoginPage.jsx
│           ├── SignupPage.jsx
│           ├── VerifyEmailPage.jsx  # Email verification page (token from URL)
│           ├── hr/
│           │   ├── DashboardPage.jsx       # Command Center — welcome banner, stat cards, performance bars, quick actions, recent evaluations
│           │   ├── DocumentsPage.jsx       # Resource Library — file cards with type icons, drag-drop upload dialog
│           │   ├── ChatbotsPage.jsx        # Knowledge Assistants — avatar cards, access scope chips
│           │   ├── FlashcardsPage.jsx      # Retention Training — layered cards, proficiency levels
│           │   ├── AssessmentsPage.jsx     # Competency Evaluations — tabbed view (evaluations + results table)
│           │   ├── SOPOfTheDayPage.jsx     # SOP of the Day — create from docs, view active, history + automation settings card
│           │   ├── EmployeeProgressPage.jsx # (Legacy) Workforce Analytics — kept for reference
│           │   └── EmployeeManagementPage.jsx # Employee Management — table, search, filters, bulk actions, detail drawer, edit/reset dialogs
│           ├── admin/
│           │   └── PendingHRsPage.jsx    # Super Admin — tabbed (Pending / Approved / Rejected) HR approval queue with approve + reject-with-reason dialog
│           └── employee/
│               ├── DashboardPage.jsx       # My Dashboard — welcome banner, quick access cards, retention stats, growth summary
│               ├── ChatPage.jsx            # AI Knowledge Hub — SSE streaming, markdown rendering (react-markdown), suggested questions, copy/retry, clear history
│               ├── FlashcardsPage.jsx      # Retention Training — flip cards, quality rating, session completion
│               ├── AssessmentsPage.jsx     # Competency Check — card-based options, progress bar, detailed results
│               └── LearningPathPage.jsx    # Growth Roadmap — circular score, priority recommendations, dual summaries
│
└── frontend/                        # OLD Streamlit app (can delete after React works)
    ├── streamlit_app.py
    └── requirements.txt
```

---

## All API Endpoints

### Auth & Profile
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /departments | None | List departments |
| POST | /signup | None | Register user (multipart: fields + optional avatar). HR signups created with `status="pending"`; employees `approved` |
| POST | /login | None | Get JWT token (requires verified email + non-pending HR + non-rejected status) |
| GET | /me | Any | Current user info (now includes `status`) |
| POST | /verify-email | None | Verify email with token |
| POST | /resend-verification | None | Resend verification email |
| POST | /auth/google | None | Login/signup with Google ID token |
| POST | /auth/google/complete | None | Complete Google signup with role/department |
| GET | /avatar/{user_id} | None | Serve avatar image (GridFS or Google redirect) |
| POST | /me/avatar | Any | Upload/replace profile picture |
| DELETE | /me/avatar | Any | Remove profile picture |

### Resource Library (Documents)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /upload-document | HR | Upload + extract text + Pinecone indexing (optional OCR via `use_ocr` flag) |
| GET | /documents | Any | List active documents |
| DELETE | /documents/{id} | HR | Soft delete |

### Knowledge Assistants (Chatbots)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /chatbots | HR | Create chatbot from processed document |
| GET | /chatbots | Any | List (dept-filtered for employees) |
| POST | /chat | Any | Send message, get RAG response |
| POST | /chat/stream | Any | Send message, get SSE streaming response |
| GET | /chat-history/{id} | Any | Get conversation history |
| DELETE | /chat-history/{id} | Any | Clear user's chat history with a chatbot |
| DELETE | /chatbots/{id} | HR | Soft delete (invalidates caches) |

### Retention Training (Flashcards / SM-2)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /flashcard-sets | HR | AI generates scenario cards from document |
| GET | /flashcard-sets | Any | List all active sets |
| GET | /flashcard-sets/{id} | Any | Get set with cards |
| DELETE | /flashcard-sets/{id} | HR | Soft delete |
| GET | /flashcard-sets/{id}/due | Any | Cards due for review (SM-2 scheduling) |
| POST | /flashcard-sets/{id}/review | Any | Submit quality (0-5), update SM-2 state |
| GET | /flashcard-sets/{id}/stats | Any | Mastery stats for a set |
| GET | /flashcard-stats/overview | Any | Overall flashcard stats across all sets |

### Competency Evaluations (Assessments)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /assessments | HR | AI generates MCQ/scenario/mixed questions |
| GET | /assessments | Any | List (dept-filtered for employees) |
| GET | /assessments/{id} | Any | Get assessment (answers hidden for employees) |
| POST | /assessments/{id}/submit | Any | Submit answers, get graded result |
| GET | /assessments/{id}/results | Any | Get user's latest result |
| GET | /assessment-results | HR | All results across all employees |
| DELETE | /assessments/{id} | HR | Soft delete |

### Growth Roadmaps (Learning Paths)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /learning-paths/generate | Any | AI generates path from performance data |
| GET | /learning-paths/me | Any | Get own learning path |
| GET | /learning-paths/employees | HR | All employee paths |
| GET | /learning-paths/employees/{user_id} | HR | Specific employee path |

### SOP of the Day
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /sop-of-the-day | HR | AI generates SOP highlight from ingested document |
| GET | /sop-of-the-day/active | Any | Get active SOP (null if dismissed by user) |
| GET | /sop-of-the-day/automation/config | HR | Get automation settings |
| PUT | /sop-of-the-day/automation/config | HR | Update automation settings |
| POST | /sop-of-the-day/automation/trigger | HR | Manual trigger for testing |
| GET | /sop-of-the-day/automation/status | HR | Automation status |
| POST | /sop-of-the-day/{id}/dismiss | Any | Dismiss SOP notification (per-user tracking) |
| GET | /sop-of-the-day/history | HR | List all past SOP entries |
| DELETE | /sop-of-the-day/{id} | HR | Deactivate SOP of the Day |

### Employee Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /employees | HR | List employees (search, filter, pagination) |
| GET | /employees/stats | HR | Aggregate stats (total, active, inactive, departments) |
| GET | /employees/{id} | HR | Employee detail + learning stats |
| PUT | /employees/{id} | HR | Update employee (department, role, status) |
| PUT | /employees/{id}/deactivate | HR | Deactivate account |
| PUT | /employees/{id}/activate | HR | Reactivate account |
| POST | /employees/{id}/reset-password | HR | Generate temp password |
| POST | /employees/bulk-action | HR | Bulk activate/deactivate |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /notifications | Any | User notifications (paginated) |
| GET | /notifications/unread-count | Any | Unread count |
| POST | /notifications/{id}/read | Any | Mark as read |
| POST | /notifications/read-all | Any | Mark all as read |

### Admin (Super Admin only)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /admin/hrs | super_admin | List HR users (optional `?status_filter=pending\|approved\|rejected`) |
| GET | /admin/hrs/pending | super_admin | List pending HRs only |
| POST | /admin/hrs/{user_id}/approve | super_admin | Approve HR account (sets `status="approved"`, stamps audit fields) |
| POST | /admin/hrs/{user_id}/reject | super_admin | Reject HR account (optional `{reason}` body, stamps audit fields) |

### System
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | None | API info |
| GET | /health | None | Health check |

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| users | User accounts (email, password hash, role, department, email_verified, google_id, auth_provider, profile_picture, status, status_changed_at, status_changed_by, status_reason). Roles: `super_admin` \| `hr` \| `employee`. Status: `pending` \| `approved` \| `rejected` |
| email_verification_tokens | Verification tokens with TTL index (24h auto-expiry) |
| documents | Uploaded docs (filename, file_id, extracted_text, features) |
| chatbots | Chatbot configs (name, document_id, access_type, departments) |
| chat_history | Chat messages (chatbot_id, user_id, message, response) |
| flashcard_sets | AI-generated flashcard sets with scenario cards (access_type, departments) |
| flashcard_reviews | Per-user per-card SM-2 review state |
| assessments | AI-generated assessments with questions |
| assessment_results | User submission results with grading |
| learning_paths | AI-generated personalized learning paths |
| sop_of_the_day | AI-generated daily SOP highlights (title, summary, key_points, practical_tip) |
| sop_dismissals | Per-user dismissal tracking for SOP notifications |
| sop_automation_config | Singleton config for SOP automation (enabled, schedule_time, document_id, previous_topics, exhaustion state) |
| notifications | In-app notifications per user (type, title, message, is_read, resource reference) |
| fs.files / fs.chunks | GridFS for raw file storage |

---

## Technical Decisions
- **UI Library:** Material UI (MUI) v5
- **Build Tool:** Vite
- **Fonts:** Plus Jakarta Sans (headings), Inter (body)
- **Color Palette:** Slate (#0F172A primary), Blue (#3B82F6 accent), with semantic colors for success/warning/error
- **Design Language:** Clean cards with subtle borders, gradient CTAs, rounded corners (12-16px), empty states with icons/descriptions
- **Assessment Format:** MCQ + Scenario-based + Mixed (labeled: Multiple Choice / Scenario-Based / Comprehensive)
- **Difficulty Levels:** Foundational (easy), Intermediate (medium), Advanced (hard)
- **Growth Roadmap:** AI-only (auto-generated from performance data)
- **Retention Training Method:** SM-2 Spaced Repetition
- **Retention Training Content:** Scenario + Best Practice (corporate style)
- **Retention Training Access:** Department-based filtering (same as chatbots/assessments — HR can assign to all or specific departments)
- **LLM:** Groq (Llama 4 Scout 17B), temperature 0.2
- **Embeddings:** HuggingFace all-MiniLM-L6-v2
- **Vector DB:** Pinecone (managed, for chatbot RAG only — replaced FAISS, old code commented out with `# [FAISS-DISABLED]`)
- **Database:** MongoDB with GridFS
- **Auth:** JWT Bearer tokens, HS256, 30min expiry
- **Email Verification:** Required for local signup (itsdangerous tokens, fastapi-mail)
- **Google OAuth:** Optional SSO via @react-oauth/google + google-auth library
- **Dev Mode:** `DEV_MODE=true` auto-verifies emails for local testing
- **Roles:** Super Admin, HR Administrator, Team Member (internally: super_admin / hr / employee). Super admin is bootstrapped from `.env`; HR signups require super-admin approval before they can log in.
- **Scheduling:** APScheduler BackgroundScheduler (in-process, CronTrigger for daily SOP automation, catch-up on startup)
- **CORS:** Allow all origins (development mode)
- **Landing Page:** `/` shows a premium multi-section scrollable page for unauthenticated users (Navbar, Hero with embedded login/signup, Stats bar, Features grid, Capabilities, CTA, Footer); authenticated users are redirected to their role-based dashboard
- **Auth Form Style:** Clean white cards on light background for standalone `/login` and `/signup` pages; forms accept an `embedded` prop for inline use on the landing page
- **Sidebar Style:** Dark gradient (#0F172A → #1E293B) with brand icon, role badge, active indicator bar, gradient user avatar. Collapsible: open (220px, full labels) / collapsed (64px, icons + tooltips) with chevron/hamburger toggle and 0.25s transition

---

## Migration to Another PC

### Option 1: Docker (Recommended)
1. Copy entire `test_project` folder to new PC
2. Install Docker Desktop
3. Configure `.env` files (see Environment Setup below)
4. Run `docker-compose up --build`
5. Frontend: `http://localhost:3000` | Backend: `http://localhost:8000`

### Option 2: Manual
1. Copy entire `test_project` folder
2. Install: Python 3.11+, Node.js 18+, MongoDB, Tesseract OCR
3. Start MongoDB: `net start MongoDB`
4. Configure `.env` files (see Environment Setup below)
5. Backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
6. Frontend: `cd frontend-react && npm install && npm run dev`

### Environment Setup

**backend/.env** (required variables):
```env
GROQ_API_KEY=your_groq_key
HUGGINGFACE_HUB_TOKEN=your_hf_token
SECRET_KEY=your_secret_key
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=corporate_lms

# Email (SMTP) - for production email verification
MAIL_USERNAME=your.email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your.email@gmail.com
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_FROM_NAME=NexusLearn

# Google OAuth - get from Google Cloud Console
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# Pinecone - get from https://www.pinecone.io
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=nexuslearn

# Dev mode - set to false in production
DEV_MODE=true

# Super Admin bootstrap (seeded once at startup if no super_admin exists in DB)
# CHANGE THESE BEFORE PRODUCTION DEPLOY — password is bcrypt-hashed at seed time
SUPER_ADMIN_EMAIL=superadmin@nexuslearn.com
SUPER_ADMIN_PASSWORD=ChangeMe!SuperAdmin#2026
SUPER_ADMIN_NAME=Super Admin
```

**Pinecone Setup:**
1. Create account at https://www.pinecone.io
2. Create an index named `nexuslearn` with **384 dimensions**, **cosine** metric, **dense** vector type
3. Copy the API key to `backend/.env`

**frontend-react/.env**:
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

**Google OAuth Setup:**
1. Go to https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials → Create OAuth client ID
3. Add `http://localhost:3000` to authorized JavaScript origins and redirect URIs
4. Copy the Client ID to both `.env` files
