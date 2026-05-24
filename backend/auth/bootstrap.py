"""
Bootstrap helpers run once at application startup.

- seed_super_admin(): create the super_admin user from env vars if no
  super_admin exists yet. Idempotent.
- backfill_user_status(): give every existing user a `status` field so the
  new login check doesn't lock anyone out. Idempotent.
"""
from datetime import datetime
from config import settings
from database import users_collection
from auth.utils import get_password_hash


def seed_super_admin() -> None:
    """Create super_admin from env vars if none exists. Safe to call repeatedly."""
    # Already have a super_admin? Nothing to do.
    if users_collection.find_one({"role": "super_admin"}):
        return

    email = (settings.SUPER_ADMIN_EMAIL or "").strip().lower()
    password = settings.SUPER_ADMIN_PASSWORD or ""
    name = settings.SUPER_ADMIN_NAME or "Super Admin"

    if not email or not password:
        print(
            "[bootstrap] WARNING: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set in .env. "
            "Skipping super admin seed. Approve-HR endpoints will be unreachable until "
            "a super_admin exists."
        )
        return

    # Email already taken by a non-super-admin? Don't overwrite — log and skip.
    existing = users_collection.find_one({"email": email})
    if existing:
        print(
            f"[bootstrap] WARNING: SUPER_ADMIN_EMAIL '{email}' is already used by a "
            f"user with role='{existing.get('role')}'. Skipping super admin seed. "
            "Either choose a different email or manually promote that user."
        )
        return

    user_doc = {
        "email": email,
        "password": get_password_hash(password),
        "full_name": name,
        "role": "super_admin",
        "department": None,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "email_verified": True,
        "status": "approved",
        "google_id": None,
        "auth_provider": "local",
        "profile_picture": None,
    }
    users_collection.insert_one(user_doc)
    print(f"[bootstrap] Seeded super_admin user: {email}")


def backfill_user_status() -> None:
    """
    Set status='approved' on every user that doesn't have a status field yet.
    Without this, existing HR users would be locked out the moment login starts
    enforcing the new pending/rejected check.
    """
    result = users_collection.update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "approved"}},
    )
    if result.modified_count:
        print(f"[bootstrap] Backfilled status='approved' on {result.modified_count} user(s).")


def run_bootstrap() -> None:
    """Run all idempotent bootstrap steps. Call once at app startup."""
    backfill_user_status()
    seed_super_admin()
