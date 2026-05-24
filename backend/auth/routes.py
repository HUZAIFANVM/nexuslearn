from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response, RedirectResponse
from datetime import datetime, timedelta
from typing import Optional
from bson import ObjectId

from config import settings
from database import users_collection, fs
from auth.utils import get_password_hash, verify_password, create_access_token
from auth.dependencies import get_current_user, get_user_by_email
from auth.email_service import (
    send_verification_email,
    verify_token,
    can_resend_verification,
    invalidate_previous_tokens,
    send_password_reset_email,
    verify_password_reset_token,
    can_request_password_reset,
    invalidate_previous_reset_tokens,
)
from auth.google_auth import verify_google_token, GoogleAuthError
from models.user import (
    UserCreate, UserLogin, Token, UserResponse,
    VerifyEmailRequest, ResendVerificationRequest, SignupResponse,
    GoogleAuthRequest, GoogleAuthResponse, GoogleCompleteSignupRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
)

router = APIRouter(tags=["Authentication"])


@router.get("/departments")
async def get_departments():
    return {"departments": settings.DEPARTMENTS}


@router.post("/signup", response_model=SignupResponse)
async def signup(
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    role: str = Form("employee"),
    department: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
):
    if get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    if role not in ["hr", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'hr' or 'employee'",
        )

    if role == "employee":
        if not department or department not in settings.DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Valid department required for employees. Choose from: {', '.join(settings.DEPARTMENTS)}",
            )

    hashed_password = get_password_hash(password)
    # In dev mode, auto-verify emails
    auto_verify = settings.DEV_MODE

    # Handle optional avatar upload
    avatar_file_id = None
    if profile_picture:
        if profile_picture.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(status_code=400, detail="Only JPG and PNG images are allowed")
        avatar_content = await profile_picture.read()
        if len(avatar_content) > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image must be under 2MB")
        avatar_file_id = fs.put(
            avatar_content,
            filename=f"avatar_signup_{email}",
            content_type=profile_picture.content_type,
        )

    # HR signups require super_admin approval; employees are auto-approved.
    initial_status = "pending" if role == "hr" else "approved"

    user_dict = {
        "email": email,
        "password": hashed_password,
        "full_name": full_name,
        "role": role,
        "department": department,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "email_verified": auto_verify,
        "status": initial_status,
        "google_id": None,
        "auth_provider": "local",
        "profile_picture": str(avatar_file_id) if avatar_file_id else None,
    }

    try:
        result = users_collection.insert_one(user_dict)
    except Exception as e:
        # Clean up orphaned GridFS file if insert fails
        if avatar_file_id:
            try:
                fs.delete(avatar_file_id)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail="Failed to create account")

    pending_suffix = (
        " Your HR account is pending super admin approval before you can log in."
        if role == "hr" else ""
    )

    if auto_verify:
        # Dev mode: skip email, account ready to use
        return SignupResponse(
            message=(
                "Account created! (Dev mode: email auto-verified)."
                + (pending_suffix if role == "hr" else " You can now log in.")
            ),
            email=email,
        )

    # Production: send verification email
    await send_verification_email(email, str(result.inserted_id), full_name)

    return SignupResponse(
        message=(
            "Account created! Please check your email to verify your account."
            + pending_suffix
        ),
        email=email,
    )


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not db_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive"
        )

    # Check email verification
    if not db_user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in",
        )

    # HR approval gate: HR cannot log in until a super_admin approves them.
    user_status = db_user.get("status", "approved")  # legacy users default to approved
    if db_user.get("role") == "hr" and user_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval",
        )
    if user_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account was rejected",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    user_info = {
        "id": str(db_user["_id"]),
        "email": db_user["email"],
        "full_name": db_user["full_name"],
        "role": db_user["role"],
        "department": db_user.get("department"),
        "profile_picture": db_user.get("profile_picture"),
        "auth_provider": db_user.get("auth_provider", "local"),
        "status": user_status,
    }
    return {"access_token": access_token, "token_type": "bearer", "user_info": user_info}


@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    user_id = verify_token(request.token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification link",
        )

    # Update user as verified
    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"email_verified": True}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification failed",
        )

    return {"message": "Email verified successfully! You can now log in."}


@router.post("/resend-verification")
async def resend_verification(request: ResendVerificationRequest):
    db_user = get_user_by_email(request.email)

    if not db_user:
        # Don't reveal if email exists
        return {"message": "If your email is registered, you will receive a verification link."}

    if db_user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified",
        )

    # Check rate limit
    if not can_resend_verification(str(db_user["_id"])):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 2 minutes before requesting another verification email",
        )

    # Invalidate previous tokens
    invalidate_previous_tokens(str(db_user["_id"]))

    # Send new verification email
    await send_verification_email(
        request.email,
        str(db_user["_id"]),
        db_user["full_name"]
    )

    return {"message": "If your email is registered, you will receive a verification link."}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Request a password reset link.

    For security, always returns the same generic response regardless of:
    - whether the email exists
    - whether the account is Google-only (no password)
    - whether the account is inactive

    Silently no-ops in those cases so attackers can't enumerate accounts.
    """
    generic_response = {
        "message": "If an account exists for that email, a password reset link has been sent."
    }

    db_user = get_user_by_email(request.email)
    if not db_user:
        return generic_response

    if not db_user.get("is_active", True):
        return generic_response

    # Google-only users have no password to reset — they sign in with Google.
    if db_user.get("auth_provider") == "google" or not db_user.get("password"):
        return generic_response

    # Rate-limit per user (don't reveal whether the limit was hit)
    if not can_request_password_reset(str(db_user["_id"])):
        return generic_response

    # Invalidate any older outstanding reset tokens for this user
    invalidate_previous_reset_tokens(str(db_user["_id"]))

    await send_password_reset_email(
        request.email,
        str(db_user["_id"]),
        db_user["full_name"],
    )

    return generic_response


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reset the user's password using a valid single-use token.

    Side effects on success:
    - Sets the new bcrypt-hashed password
    - Auto-verifies the user's email (token receipt proves email ownership)
    - Promotes Google-only accounts to auth_provider='both' (defensive — request handler
      blocks this case, but keep the post-condition correct if state changes)
    """
    user_id = verify_password_reset_token(request.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link",
        )

    try:
        user_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset link",
        )

    user = users_collection.find_one({"_id": user_oid})
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not found or inactive",
        )

    hashed_password = get_password_hash(request.new_password)

    update_fields = {
        "password": hashed_password,
        "email_verified": True,
        "password_changed_at": datetime.utcnow(),
    }
    # If somehow a Google-only user reached here, promote to "both" so they keep
    # both sign-in methods working.
    if user.get("auth_provider") == "google":
        update_fields["auth_provider"] = "both"

    users_collection.update_one({"_id": user_oid}, {"$set": update_fields})

    return {"message": "Password reset successful. You can now sign in with your new password."}


@router.post("/auth/google", response_model=GoogleAuthResponse)
async def google_auth(request: GoogleAuthRequest):
    try:
        google_user = verify_google_token(request.id_token)
    except GoogleAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    # Check if user exists by Google ID or email
    db_user = users_collection.find_one({
        "$or": [
            {"google_id": google_user["google_id"]},
            {"email": google_user["email"]}
        ]
    })

    if db_user:
        # Existing user - link accounts if needed
        if not db_user.get("google_id"):
            # Link Google account to existing email user
            users_collection.update_one(
                {"_id": db_user["_id"]},
                {
                    "$set": {
                        "google_id": google_user["google_id"],
                        "auth_provider": "both",
                        "email_verified": True,  # Google emails are verified
                        "profile_picture": db_user.get("profile_picture") or google_user.get("picture"),
                    }
                }
            )
            db_user = users_collection.find_one({"_id": db_user["_id"]})

        # HR approval gate also applies to Google sign-ins.
        user_status = db_user.get("status", "approved")
        if db_user.get("role") == "hr" and user_status == "pending":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending admin approval",
            )
        if user_status == "rejected":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account was rejected",
            )

        # Generate token and return
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user["email"]}, expires_delta=access_token_expires
        )

        user_info = {
            "id": str(db_user["_id"]),
            "email": db_user["email"],
            "full_name": db_user["full_name"],
            "role": db_user["role"],
            "department": db_user.get("department"),
            "profile_picture": db_user.get("profile_picture"),
            "auth_provider": db_user.get("auth_provider", "google"),
            "status": user_status,
        }

        return GoogleAuthResponse(
            status="logged_in",
            access_token=access_token,
            token_type="bearer",
            user_info=user_info,
        )
    else:
        # New user - need to complete signup
        return GoogleAuthResponse(
            status="pending_signup",
            email=google_user["email"],
            name=google_user["name"],
            picture=google_user.get("picture"),
            google_id=google_user["google_id"],
        )


@router.post("/auth/google/complete", response_model=Token)
async def google_complete_signup(request: GoogleCompleteSignupRequest):
    # Verify email isn't already taken
    existing_user = get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Validate role and department
    if request.role not in ["hr", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'hr' or 'employee'",
        )

    if request.role == "employee":
        if not request.department or request.department not in settings.DEPARTMENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Valid department required for employees. Choose from: {', '.join(settings.DEPARTMENTS)}",
            )

    # HR signups require super_admin approval; employees are auto-approved.
    initial_status = "pending" if request.role == "hr" else "approved"

    # Create user
    user_dict = {
        "email": request.email,
        "password": None,  # No password for Google-only users
        "full_name": request.full_name,
        "role": request.role,
        "department": request.department,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "email_verified": True,  # Google emails are verified
        "status": initial_status,
        "google_id": request.google_id,
        "auth_provider": "google",
        "profile_picture": request.picture,
    }
    result = users_collection.insert_one(user_dict)

    # HR users go straight to "pending" — don't issue a token, force them to wait.
    if initial_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval",
        )

    # Generate token (employees only at this point)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": request.email}, expires_delta=access_token_expires
    )

    user_info = {
        "id": str(result.inserted_id),
        "email": request.email,
        "full_name": request.full_name,
        "role": request.role,
        "department": request.department,
        "profile_picture": request.picture,
        "auth_provider": "google",
        "status": initial_status,
    }

    return {"access_token": access_token, "token_type": "bearer", "user_info": user_info}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        department=current_user.get("department"),
        created_at=current_user["created_at"],
        profile_picture=current_user.get("profile_picture"),
        auth_provider=current_user.get("auth_provider", "local"),
        status=current_user.get("status", "approved"),
    )


@router.get("/avatar/{user_id}")
async def get_avatar(user_id: str):
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    pic = user.get("profile_picture")
    if not pic:
        raise HTTPException(status_code=404, detail="No avatar")

    # Google profile picture URL — redirect
    if pic.startswith("http"):
        return RedirectResponse(url=pic)

    # GridFS file ID
    try:
        grid_out = fs.get(ObjectId(pic))
        data = grid_out.read()
        return Response(
            content=data,
            media_type=grid_out.content_type,
            headers={"Cache-Control": "public, max-age=3600"},
        )
    except Exception:
        raise HTTPException(status_code=404, detail="Avatar file not found")


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are allowed")

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2MB")

    # Store in GridFS
    file_id = fs.put(
        content,
        filename=f"avatar_{str(current_user['_id'])}",
        content_type=file.content_type,
    )

    # Delete old GridFS avatar if exists
    old_pic = current_user.get("profile_picture")
    if old_pic and not old_pic.startswith("http"):
        try:
            fs.delete(ObjectId(old_pic))
        except Exception:
            pass

    # Update user document
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_picture": str(file_id)}},
    )

    return {
        "message": "Avatar updated",
        "profile_picture": str(file_id),
        "avatar_url": f"/avatar/{str(current_user['_id'])}",
    }


@router.delete("/me/avatar")
async def delete_avatar(current_user: dict = Depends(get_current_user)):
    pic = current_user.get("profile_picture")

    if pic and not pic.startswith("http"):
        try:
            fs.delete(ObjectId(pic))
        except Exception:
            pass

    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"profile_picture": None}},
    )

    return {"message": "Avatar removed"}
