from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "employee"
    department: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_info: dict


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: Optional[str]
    created_at: datetime
    profile_picture: Optional[str] = None
    auth_provider: Optional[str] = "local"
    status: Optional[str] = "approved"


# Email verification models
class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class SignupResponse(BaseModel):
    message: str
    email: str


# Password reset models
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# Google OAuth models
class GoogleAuthRequest(BaseModel):
    id_token: str


class GoogleAuthResponse(BaseModel):
    status: Literal["logged_in", "pending_signup"]
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    user_info: Optional[dict] = None
    # For pending_signup
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    google_id: Optional[str] = None


class GoogleCompleteSignupRequest(BaseModel):
    google_id: str
    email: EmailStr
    full_name: str
    picture: Optional[str] = None
    role: str = "employee"
    department: Optional[str] = None
