"""
Integration tests for the forgot-password / reset-password flow.

Prerequisites:
  - Backend running on http://localhost:8000 (DEV_MODE=true is fine, recommended)
  - MongoDB running locally
  - Run from the backend directory so we can import database/email_service helpers

What it covers (10 scenarios):
  1.  Unknown email returns generic 200 (no enumeration)
  2.  Inactive user returns generic 200 + no token persisted
  3.  Google-only user returns generic 200 + no token persisted
  4.  Local user: token generated and persisted in Mongo
  5.  Rate limit: second request within 2 min does NOT create a new token
  6.  Reset with valid token: succeeds, password updated, email auto-verified
  7.  Old password no longer works after reset
  8.  New password works for login after reset
  9.  Replay attack: same token used twice -> 400
 10.  Bogus token -> 400
 11.  Short password (<8 chars) -> 422 validation error
"""
import sys
import os
import time
import requests
from datetime import datetime
from bson import ObjectId

# Make the backend importable when run from anywhere
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import users_collection, password_reset_tokens_collection  # noqa: E402
from auth.utils import get_password_hash  # noqa: E402

BASE = "http://localhost:8000"

PASS = 0
FAIL = 0
FAILURES = []


def test(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        FAILURES.append(f"{name}: {detail}")
        print(f"  [FAIL] {name} -- {detail}")


def cleanup_user(email):
    user = users_collection.find_one({"email": email})
    if user:
        password_reset_tokens_collection.delete_many({"user_id": user["_id"]})
        users_collection.delete_one({"_id": user["_id"]})


def seed_local_user(email, password, *, active=True, verified=False, auth_provider="local"):
    cleanup_user(email)
    res = users_collection.insert_one({
        "email": email,
        "password": get_password_hash(password) if password else None,
        "full_name": "Test User",
        "role": "employee",
        "department": "Software Engineer",
        "created_at": datetime.utcnow(),
        "is_active": active,
        "email_verified": verified,
        "status": "approved",
        "google_id": "google_test_id" if auth_provider == "google" else None,
        "auth_provider": auth_provider,
        "profile_picture": None,
    })
    return str(res.inserted_id)


def latest_reset_token(user_id):
    """Read back the most recent unused token from Mongo. Note: this is the
    SHA-256 hash — we can't reverse it to get the signed token. To get the
    actual token we use the backend's DEV log line, captured by the caller."""
    return password_reset_tokens_collection.find_one(
        {"user_id": ObjectId(user_id), "used_at": None},
        sort=[("created_at", -1)],
    )


def count_tokens(user_id):
    return password_reset_tokens_collection.count_documents({"user_id": ObjectId(user_id)})


# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
print("Forgot Password / Reset Password — Integration Tests")
print("=" * 60)

# Health check
try:
    r = requests.get(f"{BASE}/health", timeout=3)
    if r.status_code != 200:
        print(f"[FATAL] Backend not healthy (status {r.status_code}). Start uvicorn first.")
        sys.exit(2)
except Exception as e:
    print(f"[FATAL] Cannot reach backend at {BASE}: {e}")
    sys.exit(2)

# ---------------------------------------------------------------------------
print("\n--- Test 1: Unknown email returns generic 200 ---")
r = requests.post(f"{BASE}/forgot-password", json={"email": "nobody-pwreset@example.com"})
test("Unknown email status 200", r.status_code == 200, f"got {r.status_code} {r.text}")
test(
    "Unknown email generic message",
    "If an account exists" in r.json().get("message", ""),
    f"got message={r.json().get('message')}",
)

# ---------------------------------------------------------------------------
print("\n--- Test 2: Inactive user — no token created ---")
INACTIVE_EMAIL = "pwreset-inactive@example.com"
inactive_id = seed_local_user(INACTIVE_EMAIL, "Original123!", active=False)
r = requests.post(f"{BASE}/forgot-password", json={"email": INACTIVE_EMAIL})
test("Inactive user status 200", r.status_code == 200, f"got {r.status_code}")
test(
    "Inactive user: no token persisted",
    count_tokens(inactive_id) == 0,
    f"expected 0 tokens, got {count_tokens(inactive_id)}",
)
cleanup_user(INACTIVE_EMAIL)

# ---------------------------------------------------------------------------
print("\n--- Test 3: Google-only user — no token created ---")
GOOGLE_EMAIL = "pwreset-google@example.com"
google_id = seed_local_user(
    GOOGLE_EMAIL, password=None, auth_provider="google", verified=True,
)
r = requests.post(f"{BASE}/forgot-password", json={"email": GOOGLE_EMAIL})
test("Google-only user status 200", r.status_code == 200, f"got {r.status_code}")
test(
    "Google-only user: no token persisted",
    count_tokens(google_id) == 0,
    f"expected 0 tokens, got {count_tokens(google_id)}",
)
cleanup_user(GOOGLE_EMAIL)

# ---------------------------------------------------------------------------
print("\n--- Test 4: Local user — token generated ---")
LOCAL_EMAIL = "pwreset-local@example.com"
OLD_PASSWORD = "OldPass123!"
local_id = seed_local_user(LOCAL_EMAIL, OLD_PASSWORD, verified=False)
r = requests.post(f"{BASE}/forgot-password", json={"email": LOCAL_EMAIL})
test("Local user status 200", r.status_code == 200, f"got {r.status_code}")
tok_doc = latest_reset_token(local_id)
test("Local user: token persisted", tok_doc is not None, "no token row in Mongo")
test(
    "Local user: token has token_hash + created_at",
    tok_doc and "token_hash" in tok_doc and "created_at" in tok_doc,
    f"got fields {list(tok_doc.keys()) if tok_doc else None}",
)

# ---------------------------------------------------------------------------
print("\n--- Test 5: Rate limit within 2 minutes — no new token ---")
tokens_before = count_tokens(local_id)
r2 = requests.post(f"{BASE}/forgot-password", json={"email": LOCAL_EMAIL})
tokens_after = count_tokens(local_id)
test("Rate-limited second request still 200", r2.status_code == 200)
test(
    "Rate-limit: no new token row created",
    tokens_after == tokens_before,
    f"before={tokens_before} after={tokens_after}",
)

# ---------------------------------------------------------------------------
print("\n--- Tests 6-9: Reset flow with real token (requires DEV log) ---")
# In DEV_MODE the backend prints the reset URL to stdout. Since we can't
# capture the parent process's stdout from here, we generate a token directly
# via the email_service helpers and use it via the HTTP endpoint. This still
# exercises /reset-password end-to-end.
from auth.email_service import generate_password_reset_token  # noqa: E402

# Use the token from the request we just made (Test 4); we can't read it back
# from Mongo (only the hash is stored), so generate a fresh one for this user
# and invalidate the older row first.
password_reset_tokens_collection.update_many(
    {"user_id": ObjectId(local_id), "used_at": None},
    {"$set": {"used_at": datetime.utcnow()}},
)
fresh_token = generate_password_reset_token(local_id)

NEW_PASSWORD = "BrandNew456!"

# --- Test 6: short password rejected by Pydantic (run before consuming token) ---
r = requests.post(f"{BASE}/reset-password", json={"token": fresh_token, "new_password": "short"})
test("Short password rejected", r.status_code == 422, f"got {r.status_code}: {r.text[:200]}")

# --- Test 7: valid reset succeeds ---
r = requests.post(
    f"{BASE}/reset-password",
    json={"token": fresh_token, "new_password": NEW_PASSWORD},
)
test("Valid reset returns 200", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")
test(
    "Reset response message present",
    "successful" in r.json().get("message", "").lower(),
    f"got {r.json()}",
)

# --- Test 8: email_verified flipped to True ---
user_after = users_collection.find_one({"_id": ObjectId(local_id)})
test(
    "Reset auto-verified email",
    user_after.get("email_verified") is True,
    f"email_verified={user_after.get('email_verified')}",
)
test(
    "password_changed_at timestamp set",
    "password_changed_at" in user_after,
    f"fields={list(user_after.keys())}",
)

# --- Test 9: login with NEW password works ---
r = requests.post(f"{BASE}/login", json={"email": LOCAL_EMAIL, "password": NEW_PASSWORD})
test("Login with new password OK", r.status_code == 200, f"got {r.status_code}: {r.text[:200]}")

# --- Test 10: login with OLD password fails ---
r = requests.post(f"{BASE}/login", json={"email": LOCAL_EMAIL, "password": OLD_PASSWORD})
test("Login with old password rejected", r.status_code == 401, f"got {r.status_code}: {r.text[:200]}")

# --- Test 11: Replay — same token reused returns 400 ---
r = requests.post(
    f"{BASE}/reset-password",
    json={"token": fresh_token, "new_password": "AnotherNew789!"},
)
test("Reused token rejected", r.status_code == 400, f"got {r.status_code}: {r.text[:200]}")

# --- Test 12: Bogus token returns 400 ---
r = requests.post(
    f"{BASE}/reset-password",
    json={"token": "this.is.not.a.valid.token", "new_password": "AnotherNew789!"},
)
test("Bogus token rejected", r.status_code == 400, f"got {r.status_code}: {r.text[:200]}")

# Cleanup
cleanup_user(LOCAL_EMAIL)

# ---------------------------------------------------------------------------
print("\n" + "=" * 60)
print(f"RESULTS: {PASS} passed, {FAIL} failed")
print("=" * 60)
if FAILURES:
    print("\nFailures:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
sys.exit(0)
