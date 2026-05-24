import hashlib
import secrets
from datetime import datetime
from typing import Optional

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from bson import ObjectId

from config import settings
from database import (
    email_verification_tokens_collection,
    password_reset_tokens_collection,
    users_collection,
)


# Email configuration
mail_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

# Token serializer
serializer = URLSafeTimedSerializer(settings.SECRET_KEY)


def generate_verification_token(user_id: str) -> str:
    """Generate a secure verification token for email verification."""
    # Create token with user_id and a random salt
    token_data = {"user_id": user_id, "salt": secrets.token_hex(16)}
    token = serializer.dumps(token_data, salt="email-verification")

    # Store token hash in database
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    email_verification_tokens_collection.insert_one({
        "user_id": ObjectId(user_id),
        "token_hash": token_hash,
        "created_at": datetime.utcnow(),
        "used_at": None,
    })

    return token


def verify_token(token: str) -> Optional[str]:
    """Verify the email verification token and return user_id if valid."""
    try:
        # Check token hasn't expired (24 hours max)
        max_age = settings.VERIFICATION_TOKEN_EXPIRE_HOURS * 3600
        token_data = serializer.loads(token, salt="email-verification", max_age=max_age)
        user_id = token_data.get("user_id")

        if not user_id:
            return None

        # Check token hash exists and hasn't been used
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = email_verification_tokens_collection.find_one({
            "user_id": ObjectId(user_id),
            "token_hash": token_hash,
            "used_at": None,
        })

        if not token_record:
            return None

        # Mark token as used
        email_verification_tokens_collection.update_one(
            {"_id": token_record["_id"]},
            {"$set": {"used_at": datetime.utcnow()}}
        )

        return user_id

    except (BadSignature, SignatureExpired):
        return None


async def send_verification_email(email: str, user_id: str, full_name: str) -> bool:
    """Send verification email to user."""
    try:
        token = generate_verification_token(user_id)
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
                .header {{ background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 32px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ padding: 32px; }}
                .content p {{ color: #475569; line-height: 1.6; margin: 0 0 16px 0; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin: 16px 0; }}
                .footer {{ padding: 24px 32px; background: #f8fafc; text-align: center; }}
                .footer p {{ color: #94a3b8; font-size: 13px; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>NexusLearn</h1>
                </div>
                <div class="content">
                    <p>Hi {full_name},</p>
                    <p>Welcome to NexusLearn! Please verify your email address to complete your registration and start your learning journey.</p>
                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </p>
                    <p>This link will expire in {settings.VERIFICATION_TOKEN_EXPIRE_HOURS} hours.</p>
                    <p>If you didn't create an account with NexusLearn, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 NexusLearn. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="Verify your NexusLearn account",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        return True

    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False


def can_resend_verification(user_id: str, rate_limit_minutes: int = 2) -> bool:
    """Check if user can request a new verification email (rate limiting)."""
    from datetime import timedelta

    # Find most recent token for this user
    latest_token = email_verification_tokens_collection.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )

    if not latest_token:
        return True

    time_since_last = datetime.utcnow() - latest_token["created_at"]
    return time_since_last > timedelta(minutes=rate_limit_minutes)


def invalidate_previous_tokens(user_id: str):
    """Invalidate all previous unused tokens for a user."""
    email_verification_tokens_collection.update_many(
        {"user_id": ObjectId(user_id), "used_at": None},
        {"$set": {"used_at": datetime.utcnow()}}
    )


# ---------------------------------------------------------------------------
# Password reset tokens
# ---------------------------------------------------------------------------

PASSWORD_RESET_EXPIRE_SECONDS = 3600  # 1 hour


def generate_password_reset_token(user_id: str) -> str:
    """Generate a secure single-use password reset token."""
    token_data = {"user_id": user_id, "salt": secrets.token_hex(16)}
    token = serializer.dumps(token_data, salt="password-reset")

    token_hash = hashlib.sha256(token.encode()).hexdigest()
    password_reset_tokens_collection.insert_one({
        "user_id": ObjectId(user_id),
        "token_hash": token_hash,
        "created_at": datetime.utcnow(),
        "used_at": None,
    })

    return token


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token; return user_id if valid, else None."""
    try:
        token_data = serializer.loads(
            token,
            salt="password-reset",
            max_age=PASSWORD_RESET_EXPIRE_SECONDS,
        )
        user_id = token_data.get("user_id")
        if not user_id:
            return None

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        token_record = password_reset_tokens_collection.find_one({
            "user_id": ObjectId(user_id),
            "token_hash": token_hash,
            "used_at": None,
        })
        if not token_record:
            return None

        # Mark as used (single-use)
        password_reset_tokens_collection.update_one(
            {"_id": token_record["_id"]},
            {"$set": {"used_at": datetime.utcnow()}}
        )
        return user_id

    except (BadSignature, SignatureExpired):
        return None


async def send_password_reset_email(email: str, user_id: str, full_name: str) -> bool:
    """Send a password reset email with a single-use, time-limited link."""
    try:
        token = generate_password_reset_token(user_id)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        # Dev affordance: when SMTP isn't configured (DEV_MODE or missing creds),
        # print the reset URL to the backend console so developers can test the
        # flow locally without a real mail server. Never enabled in production.
        if settings.DEV_MODE or not settings.MAIL_USERNAME:
            print(f"[DEV] Password reset URL for {email}: {reset_url}")
            if settings.DEV_MODE and not settings.MAIL_USERNAME:
                # SMTP definitely won't work; skip the actual send.
                return True

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
                .header {{ background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 32px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 24px; }}
                .content {{ padding: 32px; }}
                .content p {{ color: #475569; line-height: 1.6; margin: 0 0 16px 0; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; margin: 16px 0; }}
                .footer {{ padding: 24px 32px; background: #f8fafc; text-align: center; }}
                .footer p {{ color: #94a3b8; font-size: 13px; margin: 0; }}
                .warn {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; color: #78350f; font-size: 13px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>NexusLearn</h1>
                </div>
                <div class="content">
                    <p>Hi {full_name},</p>
                    <p>We received a request to reset the password on your NexusLearn account. Click the button below to choose a new password.</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </p>
                    <p>This link will expire in 1 hour and can be used only once.</p>
                    <div class="warn">If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</div>
                </div>
                <div class="footer">
                    <p>&copy; 2024 NexusLearn. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="Reset your NexusLearn password",
            recipients=[email],
            body=html_content,
            subtype=MessageType.html,
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        return True

    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        return False


def can_request_password_reset(user_id: str, rate_limit_minutes: int = 2) -> bool:
    """Rate-limit password reset requests (default: one every 2 minutes)."""
    from datetime import timedelta

    latest_token = password_reset_tokens_collection.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)],
    )
    if not latest_token:
        return True
    time_since_last = datetime.utcnow() - latest_token["created_at"]
    return time_since_last > timedelta(minutes=rate_limit_minutes)


def invalidate_previous_reset_tokens(user_id: str):
    """Invalidate all unused password reset tokens for a user."""
    password_reset_tokens_collection.update_many(
        {"user_id": ObjectId(user_id), "used_at": None},
        {"$set": {"used_at": datetime.utcnow()}}
    )
