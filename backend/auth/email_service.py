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

        html_content = _verification_email_html(full_name, verification_url, settings.VERIFICATION_TOKEN_EXPIRE_HOURS)

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

        html_content = _password_reset_email_html(full_name, reset_url)

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


# ---------------------------------------------------------------------------
# HTML email templates
# ---------------------------------------------------------------------------
#
# Email clients (especially Outlook) are picky:
#   - Inline styles only — no <style> block reliably supported.
#   - Tables for layout — flexbox/grid are flaky.
#   - No SVG — strip it. Brand mark is rendered as a styled "N" inside a
#     gradient box, plus the wordmark in text.
#   - Max width 600px, single column.
#
# Both templates share the same shell. _email_shell() wraps the body content.

_BRAND_PRIMARY = "#3B82F6"
_BRAND_SECONDARY = "#8B5CF6"
_BRAND_DARK = "#0F172A"
_BG = "#F1F5F9"
_TEXT = "#1E293B"
_MUTED = "#64748B"
_LIGHTER = "#94A3B8"
_HAIRLINE = "#E2E8F0"


def _email_shell(*, preview: str, body_html: str) -> str:
    """Wrap inner body content with the standard NexusLearn email chrome."""
    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>NexusLearn</title>
</head>
<body style="margin:0; padding:0; background-color:{_BG}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:{_TEXT};">
  <!-- Preview text (shows in inbox preview, hidden in the body) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    {preview}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:{_BG}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:20px; box-shadow:0 8px 32px rgba(15,23,42,0.08); overflow:hidden; border:1px solid {_HAIRLINE};">

          <!-- Header with brand gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,{_BRAND_PRIMARY} 0%,{_BRAND_SECONDARY} 100%); padding:36px 32px 32px 32px; text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle; padding-right:14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="44" height="44" align="center" valign="middle" style="background-color:rgba(255,255,255,0.18); border:1px solid rgba(255,255,255,0.30); border-radius:12px; color:#FFFFFF; font-weight:800; font-size:20px; line-height:44px; text-align:center;">N</td>
                      </tr>
                    </table>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="color:#FFFFFF; font-size:20px; font-weight:800; letter-spacing:-0.01em; line-height:1;">NexusLearn</div>
                    <div style="color:rgba(255,255,255,0.78); font-size:12px; letter-spacing:0.06em; text-transform:uppercase; margin-top:4px;">Enterprise Learning Platform</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body slot -->
          <tr>
            <td style="padding:36px 36px 32px 36px;">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC; border-top:1px solid {_HAIRLINE}; padding:24px 36px; text-align:center;">
              <div style="color:{_LIGHTER}; font-size:12px; line-height:1.6;">
                Sent by <span style="color:{_MUTED}; font-weight:600;">NexusLearn</span> · nexuslearn.tech
              </div>
              <div style="color:{_LIGHTER}; font-size:11px; line-height:1.6; margin-top:6px;">
                &copy; {datetime.utcnow().year} NexusLearn. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _primary_button(href: str, label: str) -> str:
    """Render a brand-gradient pill button. Uses a bulletproof bordered button
    so Outlook (which ignores gradients) still shows a solid blue pill."""
    return f"""
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
      <tr>
        <td align="center" bgcolor="{_BRAND_PRIMARY}" style="border-radius:999px; background:linear-gradient(135deg,{_BRAND_PRIMARY} 0%,{_BRAND_SECONDARY} 100%); box-shadow:0 8px 24px rgba(99,102,241,0.30);">
          <a href="{href}" target="_blank" style="display:inline-block; padding:14px 36px; color:#FFFFFF; font-weight:700; font-size:15px; text-decoration:none; border-radius:999px; line-height:1;">{label}</a>
        </td>
      </tr>
    </table>
    """


def _verification_email_html(full_name: str, verification_url: str, expire_hours: int) -> str:
    first_name = (full_name or "there").split(" ")[0]
    body = f"""
    <div style="font-size:13px; color:{_MUTED}; letter-spacing:0.08em; text-transform:uppercase; font-weight:700; margin-bottom:14px;">Confirm Your Email</div>
    <h1 style="color:{_TEXT}; font-size:26px; line-height:1.25; margin:0 0 14px 0; font-weight:800; letter-spacing:-0.01em;">Welcome to NexusLearn, {first_name}.</h1>
    <p style="color:{_MUTED}; font-size:15px; line-height:1.65; margin:0 0 8px 0;">
      You're one click away from your personalized learning workspace — chatbots, retention training, competency evaluations, and a growth roadmap built for you.
    </p>
    <p style="color:{_MUTED}; font-size:15px; line-height:1.65; margin:0 0 8px 0;">
      Confirm your email to activate your account:
    </p>

    {_primary_button(verification_url, "Verify my email")}

    <p style="color:{_LIGHTER}; font-size:13px; line-height:1.65; margin:8px 0 24px 0;">
      Button not working? Paste this link into your browser:<br />
      <a href="{verification_url}" style="color:{_BRAND_PRIMARY}; word-break:break-all; text-decoration:none;">{verification_url}</a>
    </p>

    <div style="border-top:1px solid {_HAIRLINE}; margin:28px 0;"></div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background-color:#FEF3C7; border:1px solid #FDE68A; border-radius:12px; padding:14px 16px;">
          <div style="color:#92400E; font-size:13px; font-weight:700; margin-bottom:4px;">Heads up</div>
          <div style="color:#78350F; font-size:13px; line-height:1.55;">
            This link expires in <strong>{expire_hours} hours</strong> and works only once. If you didn't sign up for NexusLearn, you can safely ignore this email — no account will be created.
          </div>
        </td>
      </tr>
    </table>
    """
    return _email_shell(
        preview=f"Hi {first_name} — one click to activate your NexusLearn account.",
        body_html=body,
    )


def _password_reset_email_html(full_name: str, reset_url: str) -> str:
    first_name = (full_name or "there").split(" ")[0]
    body = f"""
    <div style="font-size:13px; color:{_MUTED}; letter-spacing:0.08em; text-transform:uppercase; font-weight:700; margin-bottom:14px;">Reset Your Password</div>
    <h1 style="color:{_TEXT}; font-size:26px; line-height:1.25; margin:0 0 14px 0; font-weight:800; letter-spacing:-0.01em;">Hi {first_name}, let's get you back in.</h1>
    <p style="color:{_MUTED}; font-size:15px; line-height:1.65; margin:0 0 8px 0;">
      We received a request to reset the password on your NexusLearn account. Tap the button below to choose a new one.
    </p>

    {_primary_button(reset_url, "Choose a new password")}

    <p style="color:{_LIGHTER}; font-size:13px; line-height:1.65; margin:8px 0 24px 0;">
      Button not working? Paste this link into your browser:<br />
      <a href="{reset_url}" style="color:{_BRAND_PRIMARY}; word-break:break-all; text-decoration:none;">{reset_url}</a>
    </p>

    <div style="border-top:1px solid {_HAIRLINE}; margin:28px 0;"></div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="background-color:#FEE2E2; border:1px solid #FECACA; border-radius:12px; padding:14px 16px;">
          <div style="color:#991B1B; font-size:13px; font-weight:700; margin-bottom:4px;">Didn't request this?</div>
          <div style="color:#7F1D1D; font-size:13px; line-height:1.55;">
            Ignore this email — your password stays unchanged. The link expires in <strong>1 hour</strong> and can be used only once. If you keep getting these without asking, contact your administrator.
          </div>
        </td>
      </tr>
    </table>
    """
    return _email_shell(
        preview=f"Hi {first_name} — reset your NexusLearn password.",
        body_html=body,
    )
