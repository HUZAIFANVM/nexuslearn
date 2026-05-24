# NexusLearn — Migration & Setup Guide

## What is this project?
NexusLearn is an AI-powered enterprise learning platform built with FastAPI (Python) + React (MUI) + MongoDB. It has 5 AI features: Knowledge Assistants (RAG chatbots), Retention Training (SM-2 spaced repetition), Competency Evaluations, AI Growth Roadmaps, and SOP of the Day.

---

## Option 1: Manual Setup (Without Docker)

### Step 1: Verify Prerequisites

All tools should already be installed. Run these to confirm:

```bash
python --version        # Need 3.11+
node --version          # Need 18+
npm --version           # Comes with Node
mongod --version        # Need 7+
tesseract --version     # Need 5+
```

If any command fails, install that tool before proceeding:

| Tool | Install From |
|------|-------------|
| Python 3.11+ | https://www.python.org/downloads/ — check "Add to PATH" during install |
| Node.js 18+ | https://nodejs.org/ (LTS) |
| MongoDB 7+ | https://www.mongodb.com/try/download/community — install as Windows Service |
| Tesseract 5+ | https://github.com/UB-Mannheim/tesseract/wiki — check "Add to PATH" during install |

### Step 2: Start MongoDB

```bash
# Windows (if not running as service):
net start MongoDB

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

Verify it's running:
```bash
mongosh --eval "db.runCommand({ping:1})"
```

You should see `{ ok: 1 }`.

### Step 3: Setup Backend

```bash
cd test_project/backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows CMD:
venv\Scripts\activate
# Windows PowerShell:
venv\Scripts\Activate.ps1
# Windows Git Bash:
source venv/Scripts/activate
# Mac/Linux:
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt. **All backend commands below must run with venv active.**

### Step 4: Install Dependencies (bcrypt fix — READ THIS)

> **KNOWN ISSUE:** The project uses `passlib[bcrypt]` for password hashing. Recent `bcrypt` versions (4.1+) broke compatibility with `passlib` — passwords hash silently but verification always fails. This causes **login to fail with "invalid credentials" even with correct password**, and there's NO error in the terminal. The fix is to pin `bcrypt==4.0.1`.

```bash
# Upgrade pip first
pip install --upgrade pip setuptools wheel

# Install compatible bcrypt BEFORE other deps
pip install bcrypt==4.0.1

# Now install everything else
pip install -r requirements.txt
```

**After install, verify bcrypt didn't get overwritten:**

```bash
pip show bcrypt
```

Version **must** say `4.0.1`. If it says `4.1.x` or higher, fix it:

```bash
pip install bcrypt==4.0.1 --force-reinstall
```

**Quick sanity check — verify password hashing works:**

```bash
python -c "from passlib.context import CryptContext; ctx = CryptContext(schemes=['bcrypt'], deprecated='auto'); h = ctx.hash('test'); print('HASH OK:', h[:20]+'...'); print('VERIFY OK:', ctx.verify('test', h))"
```

Expected output:
```
HASH OK: $2b$12$xxxxx...
VERIFY OK: True
```

If you see `VERIFY OK: True`, you're good. If you see any error or `False`, bcrypt is broken — run `pip install bcrypt==4.0.1 --force-reinstall` and test again.

### Step 5: Configure Backend Environment

Edit `backend/.env` — the file already exists with keys. Verify these are valid:

```env
GROQ_API_KEY=gsk_...          # Must be valid Groq key
HF_TOKEN=hf_...               # Must be valid HuggingFace token
PINECONE_API_KEY=pcsk_...     # Must be valid Pinecone key
PINECONE_INDEX_NAME=nexuslearn
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=corporate_lms
SECRET_KEY=...                 # Any random string, used for JWT signing
DEV_MODE=true                  # Keep true for local testing (auto-verifies emails)

# Super Admin bootstrap — created once at startup if no super_admin exists in DB.
# CHANGE the password before sharing the project or deploying anywhere non-local.
SUPER_ADMIN_EMAIL=superadmin@nexuslearn.com
SUPER_ADMIN_PASSWORD=ChangeMe!SuperAdmin#2026
SUPER_ADMIN_NAME=Super Admin
```

> **Pydantic note:** `SUPER_ADMIN_EMAIL` is validated by Pydantic's EmailStr at signup-comparison time. Avoid `.local`, `.localhost`, and other reserved TLDs — use a real-looking domain like `.com` / `.io`.

**If any API key is expired or invalid, get new ones:**

| Key | Get it from | Notes |
|-----|------------|-------|
| GROQ_API_KEY | https://console.groq.com/keys | Free tier, uses Llama 4 Scout |
| HF_TOKEN | https://huggingface.co/settings/tokens | Free, for embeddings model |
| PINECONE_API_KEY | https://www.pinecone.io | Free starter tier |

### Step 6: Verify Pinecone Index

The Pinecone index should already exist. If using a **new** Pinecone account:
1. Go to https://app.pinecone.io
2. Create index: name = `nexuslearn`, dimensions = `384`, metric = `cosine`, type = `Dense`
3. Update `PINECONE_API_KEY` in `backend/.env`

### Step 7: Start Backend

```bash
cd test_project/backend
# Activate venv if not already active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **First startup is slow** (~30-60s) — loads the HuggingFace embeddings model into memory. Subsequent starts are faster.

Wait until you see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Verify: open http://localhost:8000 — should show `{"message": "NexusLearn API", ...}`

### Step 8: Setup & Start Frontend

Open a **new terminal** (keep backend running in the first one):

```bash
cd test_project/frontend-react
npm install
```

Check `frontend-react/.env` has:
```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Should show:
```
VITE v5.x.x  ready
➜  Local: http://localhost:3000/
```

### Step 9: Verify Everything Works

1. Open http://localhost:3000
2. Click **Create Account** → fill name, email, password, select department, select role
   - **If you pick `Employee`**: account is auto-approved, you can log in immediately.
   - **If you pick `HR`**: account is created with `status="pending"`. Login is **blocked** with the message "Your account is pending admin approval" until a super admin approves it. This is by design — see Step 9.5.
3. `DEV_MODE=true` means email is auto-verified — no SMTP needed.
4. **Test login** with the account you just created — if login fails with "invalid credentials" right after signup, bcrypt is broken (go back to Step 4). If it fails with "pending admin approval", that's the new HR-approval flow working — proceed to Step 9.5.
5. Upload a document → create chatbots/flashcards/assessments from it (HR account required, after approval).

**Test accounts (if database was migrated with data):**
| Role | Email | Password |
|------|-------|----------|
| HR | testhr@nexuslearn.com | TestPass123! |
| Employee | testemp@nexuslearn.com | TestPass123! |

> Migrated HR accounts created before the super-admin feature shipped are auto-backfilled to `status="approved"` on the first backend startup, so they keep working without manual intervention.

### Step 9.4: Forgot Password / Reset Password

Any local-auth user (and Google users that later set a password) can recover their account from `/login` → **Forgot password?**.

**Flow:**
1. User clicks **Forgot password?** on the login screen → lands on `/forgot-password`.
2. User submits their email. Backend always responds with the same generic "if an account exists…" message (no account-enumeration leak). It silently no-ops for unknown emails, inactive users, and Google-only accounts.
3. Backend generates a single-use, itsdangerous-signed token, persists its SHA-256 hash in `password_reset_tokens` (TTL: 1 hour), and emails a link `${FRONTEND_URL}/reset-password?token=...` to the user.
4. User opens the link, sets a new password (≥8 chars, confirmed). Backend verifies the token, bcrypt-hashes the new password, **auto-verifies the email** (token receipt proves ownership), and marks the token as used so it cannot be replayed.

**Dev-mode console log (no SMTP needed):**

When `DEV_MODE=true` and SMTP creds are missing, the backend skips the actual email send and prints the reset URL to the backend terminal so you can test the flow locally:

```
[DEV] Password reset URL for someone@example.com: http://localhost:3000/reset-password?token=...
```

Copy that URL into a browser tab to complete the reset. This branch is gated on `DEV_MODE` + missing `MAIL_USERNAME` — in production with real SMTP creds, the URL is NOT logged.

**Production:** set valid `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SERVER` in `backend/.env` and switch `DEV_MODE=false`. The email is sent via `fastapi-mail` over SMTP/STARTTLS.

**Endpoints:**

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/forgot-password` | `{"email":"user@example.com"}` |
| POST | `/reset-password`  | `{"token":"...","new_password":"NewPass123!"}` |

**Security properties verified by `backend/test_forgot_password.py` (20/20 pass):**
- Unknown email returns the same generic message as a real one (no enumeration).
- Inactive users and Google-only users never get a token generated.
- 2-minute per-user rate limit on `/forgot-password` (additional requests no-op silently).
- Tokens are **single-use** — replaying a used token returns `400`.
- Tokens **expire after 1 hour** (TTL index on the collection auto-purges rows; itsdangerous `max_age` rejects expired tokens).
- Bogus / malformed tokens return `400`.
- Pydantic `min_length=8` validation rejects short passwords with `422`.
- Successful reset bumps `email_verified=True` and stamps `password_changed_at`.
- Old password no longer logs in; new password does.

To re-run the suite at any time:

```bash
cd test_project/backend
# venv must be active; backend must be running
python test_forgot_password.py
```

### Step 9.5: Super Admin & HR Approval

The first time the backend starts, it seeds a super admin user from your `SUPER_ADMIN_*` env vars (only if no super_admin exists yet). This account moderates HR signups.

1. Sign in at http://localhost:3000 with the super admin credentials from `backend/.env`:
   - **Email:** value of `SUPER_ADMIN_EMAIL` (default: `superadmin@nexuslearn.com`)
   - **Password:** value of `SUPER_ADMIN_PASSWORD` (default: `ChangeMe!SuperAdmin#2026` — **change this before sharing the project**)
2. You land on `/admin/pending-hrs` with three tabs: **Pending / Approved / Rejected**.
3. Pending HRs have **Approve** and **Reject** buttons. Reject opens a dialog for an optional reason.
4. After you approve an HR, that user can log in normally and access all HR pages.

**API endpoints for super admin:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/hrs/pending` | List pending HRs |
| GET | `/admin/hrs?status_filter=approved` | Filter by status |
| POST | `/admin/hrs/{id}/approve` | Approve HR |
| POST | `/admin/hrs/{id}/reject` | Reject HR (optional `{"reason":"..."}` body) |

**Idempotency:** The bootstrap is safe to run repeatedly. Restarting the backend does NOT overwrite an existing super admin — to rotate credentials, edit the row directly in MongoDB or delete it and let the seed run again with new env values.

---

## Option 2: Docker Setup

### Step 1: Verify Docker is installed

```bash
docker --version        # Need Docker Desktop
docker-compose --version
```

If not installed: https://www.docker.com/products/docker-desktop/

### Step 2: Verify `.env` files have valid API keys

Same as manual setup Step 4 — check `backend/.env` has valid GROQ, HF, and Pinecone keys.

### Step 3: Build and Run

```bash
cd test_project
docker-compose up --build
```

First build takes 5-10 minutes. After that:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| MongoDB | localhost:27017 |

### Docker Commands

```bash
docker-compose up -d          # Start in background
docker-compose logs -f         # View logs
docker-compose down            # Stop all
docker-compose up --build      # Rebuild after code changes
docker-compose down -v         # Reset everything (deletes database)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Forgot password: no email arrives** | In `DEV_MODE=true` with empty `MAIL_USERNAME`, the backend skips the SMTP send and prints `[DEV] Password reset URL for ...: http://localhost:3000/reset-password?token=...` to the backend terminal. Copy that URL into a browser. For real email delivery, set valid `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` / `MAIL_SERVER` in `backend/.env` and (optionally) `DEV_MODE=false`. |
| **Forgot password: "Invalid or expired password reset link"** | Reset tokens are single-use and expire after 1 hour. Request a new one from `/forgot-password`. If you just requested one within the last 2 minutes, the rate limit suppressed the second request — wait 2 minutes and try again. |
| **HR login returns "Your account is pending admin approval"** | Working as designed. Sign in as super admin (creds in `backend/.env`, `SUPER_ADMIN_*`), go to `/admin/pending-hrs`, click Approve. |
| **HR login returns "Your account was rejected"** | A super admin previously rejected the account. Sign in as super admin → `/admin/pending-hrs` → Rejected tab → Approve to restore access. |
| **Super admin can't sign in / wasn't seeded** | Check backend startup logs for `[bootstrap]` lines. Causes: (a) `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` missing in `.env`, (b) email uses a Pydantic-blocked TLD like `.local` (use `.com`), (c) the email is already taken by another non-super-admin user. To reset: delete the existing super_admin row in Mongo (`mongosh corporate_lms --eval "db.users.deleteOne({role:'super_admin'})"`), fix `.env`, restart backend. |
| **Login fails "invalid credentials" right after signup** | bcrypt version issue. Run: `pip install bcrypt==4.0.1 --force-reinstall` then restart backend. See Step 3 above. |
| **Signup works but login always fails** | Same bcrypt issue. Verify with: `python -c "from passlib.context import CryptContext; ctx = CryptContext(schemes=['bcrypt'], deprecated='auto'); h = ctx.hash('test'); print(ctx.verify('test', h))"` — must print `True`. If `False`, reinstall bcrypt 4.0.1. |
| **After fixing bcrypt, old accounts still can't login** | Passwords hashed with broken bcrypt are unrecoverable. Create new accounts, or delete users from MongoDB: `mongosh corporate_lms --eval "db.users.deleteMany({})"` |
| Backend "Module not found" | Activate venv first (`venv\Scripts\activate`), then `pip install -r requirements.txt` |
| AI features fail | Check GROQ_API_KEY, PINECONE_API_KEY, HF_TOKEN are valid in `.env` |
| "Cannot connect to MongoDB" | Run `net start MongoDB` (Windows) or `sudo systemctl start mongod` (Linux) |
| Frontend blank white screen | Open F12 → Console for error. Try `cd frontend-react && npm install` |
| Tesseract not found | Add Tesseract to system PATH (`C:\Program Files\Tesseract-OCR` on Windows) |
| Port 8000/3000 in use | Kill the process: `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| First doc upload very slow | Normal — first upload triggers embedding generation + Pinecone indexing. Use OCR toggle OFF for faster uploads on text-based PDFs. |

---

Antigravity Setup Prompt

Copy-paste this when setting up with Claude Code on the new laptop:

```
I have the NexusLearn project unzipped in my test_project folder. It's a FastAPI + React + MongoDB enterprise learning platform.

First, check if prerequisites are installed by running:
- python --version (need 3.11+)
- node --version (need 18+)
- mongod --version (need 7+)
- tesseract --version (need 5+)

If all are present, set up the project:

1. Start MongoDB service (net start MongoDB on Windows, sudo systemctl start mongod on Linux)
2. Create Python virtual environment in backend/, activate it, install requirements.txt
3. Check backend/.env — verify GROQ_API_KEY, HF_TOKEN, PINECONE_API_KEY, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD are filled in and DEV_MODE=true
4. Start the backend: uvicorn main:app --reload --port 8000
5. In frontend-react/, run npm install
6. Check frontend-react/.env has VITE_API_URL=http://localhost:8000
7. Start the frontend: npm run dev
8. Verify both are running — backend at localhost:8000, frontend at localhost:3000
9. On first backend boot, watch the logs for `[bootstrap] Seeded super_admin user: <email>`. Test by signing in at http://localhost:3000 with the SUPER_ADMIN_EMAIL/PASSWORD — should land on /admin/pending-hrs.

If any prerequisite is missing, tell me which one and how to install it before proceeding.

Project docs: spec.md (full spec), phases.md (roadmap), mg.md (this setup guide).
```

---

## Quick Reference

```
Backend  (port 8000)  →  FastAPI + Python
Frontend (port 3000)  →  React + MUI + Vite
Database              →  MongoDB (port 27017)
Vector DB             →  Pinecone (cloud)
LLM                   →  Groq API (Llama 4 Scout)
Embeddings            →  HuggingFace all-MiniLM-L6-v2
OCR                   →  Tesseract
```

| File | Purpose |
|------|---------|
| `spec.md` | Full project specification |
| `phases.md` | Enhancement roadmap (Phase 6+ pending) |
| `backend/.env` | API keys and config (DO NOT share publicly) |
| `frontend-react/.env` | Frontend config |
| `docker-compose.yml` | Docker setup |
