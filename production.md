# NexusLearn — Production Readiness Checklist

> Tasks to complete before deploying to production with real users.
> These are non-functional improvements — all features work correctly as-is.

---

## 1. Security Audit — Auth Module

**Priority:** CRITICAL

- [ ] Audit password hashing (verify bcrypt rounds, salt handling in `auth/utils.py`)
- [ ] Verify JWT expiry enforcement and token refresh flow
- [ ] Add refresh token mechanism (current: 30min access token only, no refresh)
- [x] **Ensure password reset tokens are single-use and time-limited** — shipped. itsdangerous-signed tokens with 1-hour expiry, SHA-256 hashes persisted in `password_reset_tokens` (TTL index), `used_at` set on first verification so replay returns 400. Covered by `backend/test_forgot_password.py` (20/20).
- [ ] Audit Google OAuth token verification flow
- [ ] **Rotate the bootstrap super admin password** in `backend/.env` (`SUPER_ADMIN_PASSWORD`) — the committed default `ChangeMe!SuperAdmin#2026` MUST be replaced before any non-local deploy. The seed only runs when no `super_admin` row exists, so changing the env value alone won't update an already-seeded password — either change it before first boot, or update the password directly in MongoDB via `users` collection.
- [x] **Self-serve password reset for super admin** — the new `/forgot-password` flow works for any local-auth user, including the bootstrapped super admin. (Provided the super admin's email matches what HR/SMTP can deliver to.)
- [ ] Decide whether to support multiple super_admins / super-admin promotion of approved HRs (currently single super_admin via env seed)

**Files:** `backend/auth/utils.py`, `backend/auth/routes.py`, `backend/auth/google_auth.py`, `backend/auth/bootstrap.py`, `backend/admin/routes.py`, `backend/auth/email_service.py`

### Forgot Password — Production SMTP

The forgot-password flow requires real outbound email to be useful in production. Before deploy:

- [ ] Set valid SMTP credentials in `backend/.env`: `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SERVER`, `MAIL_PORT` (587), `MAIL_FROM_NAME`.
- [ ] Set `DEV_MODE=false` so the `[DEV] Password reset URL ...` console log is suppressed (it currently emits when DEV_MODE=true AND SMTP is missing). Reset URLs in logs are a credential disclosure risk in prod.
- [ ] Set `FRONTEND_URL` to the public origin (e.g. `https://app.nexuslearn.com`) so reset links point at the deployed UI, not `localhost:3000`.
- [ ] If using Gmail SMTP for `MAIL_SERVER=smtp.gmail.com`, generate an app password (not the Google account password). Consider switching to a transactional provider (SendGrid, SES, Postmark, Resend) for production deliverability.
- [ ] Add the `/forgot-password` and `/reset-password` endpoints to the rate-limiting list in section **3** below — they are unauthenticated and could be abused to spam emails or brute-force tokens.

---

## 2. Pagination on Heavy Endpoints

**Priority:** HIGH

Endpoints that currently return ALL records — will break at scale:

| Endpoint | Fix |
|----------|-----|
| `GET /assessment-results` | Add `skip` + `limit` query params |
| `GET /documents` | Add `skip` + `limit` query params |
| `GET /chatbots` | Add `skip` + `limit` query params |
| `GET /flashcard-sets` | Add `skip` + `limit` query params |
| `GET /assessments` | Add `skip` + `limit` query params |
| `GET /sop-of-the-day/history` | Already limited to 50, but add proper pagination |
| `GET /chat-history/{id}` | Already limited to 50, add cursor-based pagination |

**Pattern to follow:** See `GET /notifications` (already has `skip` + `limit`).

---

## 3. Rate Limiting

**Priority:** HIGH

Endpoints hitting external APIs (Groq LLM, Pinecone) need rate limiting to prevent token burn and abuse:

| Endpoint | Suggested Limit |
|----------|----------------|
| `POST /chat` | 20 req/min per user |
| `POST /chat/stream` | 20 req/min per user |
| `POST /assessments` (AI generation) | 5 req/min per user |
| `POST /flashcard-sets` (AI generation) | 5 req/min per user |
| `POST /sop-of-the-day` (AI generation) | 5 req/min per user |
| `POST /learning-paths/generate` | 5 req/min per user |
| `POST /login` | 10 req/min per IP (brute-force protection) |
| `POST /signup` | 5 req/min per IP — **specifically important for HR signups**: the new HR-approval flow lets anyone create `role="hr"` accounts that land in the super-admin pending queue. Without this limit, an attacker can spam the queue. |
| `POST /forgot-password` | 5 req/min per IP **and** 5 req/hour per email — the in-app 2-minute per-user limit deters accidental double-clicks but does not stop a distributed flood. Cap at IP + email level to prevent mailbox flooding via someone else's address. |
| `POST /reset-password` | 20 req/min per IP — slows token brute-force. Tokens are signed + per-user + 1-hour-expiry, so the attack surface is small, but limit anyway. |

**Implementation:** Use `slowapi` library (FastAPI-compatible, Redis-backed for multi-instance).

**Dependency to add:** `slowapi>=0.1.9` in `backend/requirements.txt`

### Related: HR-approval queue hardening (deferred)

Beyond rate-limiting `/signup`, two cheap follow-ups for the HR-approval feature:

- [ ] **Filter pending list to email-verified HRs only.** In `backend/admin/routes.py` (`list_pending_hrs` and the `pending` branch of `list_hr_users`), add `"email_verified": True` to the Mongo query so unconfirmed signups don't pollute the queue.
- [ ] **Notify super admin on new pending HR.** Use the existing `notifications` module to drop an in-app alert when a new HR row lands as `status="pending"`.
- [ ] **Notify HR on approve/reject.** Add notification triggers inside `admin/routes.py:approve_hr` / `reject_hr` so the affected user sees the outcome on next login.

---

## 4. Global Error Handling

**Priority:** MEDIUM

- [ ] Add FastAPI exception handlers for common errors (`ValidationError`, `PyMongoError`, unhandled `Exception`)
- [ ] Standardize error response format: `{"detail": "message", "error_code": "...", "status": 400}`
- [ ] Replace bare `except Exception` blocks with specific exception types
- [ ] Add request ID tracking for correlating logs to errors

**File to create:** `backend/middleware/error_handler.py`

---

## 5. Input Sanitization

**Priority:** MEDIUM

User-provided text fields go directly to MongoDB. Not a SQL injection risk, but:

- [ ] Sanitize HTML in user-provided names, chatbot names, assessment names, flashcard text
- [ ] Strip or escape `<script>` tags and HTML entities before storage
- [ ] Frontend already uses React (auto-escapes JSX), but `dangerouslySetInnerHTML` or `react-markdown` could render malicious content

**Fields to sanitize:** `full_name`, `name` (chatbots/assessments/flashcards), `message` (chat), any user-editable text

**Implementation:** Use `bleach` library or simple regex strip.

**Dependency to add:** `bleach>=6.0.0` in `backend/requirements.txt`

---

## 6. CORS Lockdown

**Priority:** MEDIUM (critical at deploy time)

Current: `allow_origins=["*"]` — allows any website to call the API.

- [ ] Change to specific origins in production:
  ```python
  allow_origins=[
      "https://your-domain.com",
      "http://localhost:3000",  # keep for local dev
  ]
  ```
- [ ] Move allowed origins to `.env` config:
  ```env
  CORS_ORIGINS=https://your-domain.com,http://localhost:3000
  ```

**File:** `backend/main.py`

---

## 7. Structured Logging

**Priority:** MEDIUM

Current: `print()` statements scattered throughout. No log levels, no timestamps, no request tracing.

- [ ] Replace all `print()` with Python `logging` module
- [ ] Add log levels: DEBUG (dev), INFO (request flow), WARNING (recoverable), ERROR (failures)
- [ ] Add request logging middleware (method, path, status, duration)
- [ ] Configure JSON log format for production (parseable by log aggregators)
- [ ] Add correlation/request ID to all log entries

**Implementation:** Use `loguru` or stdlib `logging` with `uvicorn.config.LOGGING_CONFIG`.

**Dependency (optional):** `loguru>=0.7.0` in `backend/requirements.txt`

---

## 8. LangChain Import Updates

**Priority:** LOW (functional but will break on future upgrade)

Current deprecation warnings:
```
Importing embeddings from langchain is deprecated.
Please import from langchain-community instead.
```

- [ ] `backend/ai/embeddings.py` — Change `from langchain.embeddings import HuggingFaceEmbeddings` to `from langchain_community.embeddings import HuggingFaceEmbeddings`
- [ ] `backend/chatbots/services.py` — Update `ConversationalRetrievalChain` import if moved
- [ ] `backend/chatbots/routes.py` — Update `AsyncIteratorCallbackHandler` import path
- [ ] Add `langchain-community>=0.1.0` to `requirements.txt`
- [ ] Test all chatbot/RAG flows after migration

---

## Implementation Order

| Order | Task | Effort |
|-------|------|--------|
| 1 | CORS lockdown | 10 min |
| 2 | LangChain imports | 30 min |
| 3 | Input sanitization | 1-2 hr |
| 4 | Rate limiting | 2-3 hr |
| 5 | Pagination | 2-3 hr |
| 6 | Global error handling | 2-3 hr |
| 7 | Structured logging | 3-4 hr |
| 8 | Auth security audit | 4-6 hr |

---

## Quick Start

Tell Claude: "Start production.md — do task #1" (or whichever task number).
