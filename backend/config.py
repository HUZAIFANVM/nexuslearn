import os
import sys
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # NOTE: SECRET_KEY has NO default value on purpose. The app must refuse to
    # start if it's not set, so production deploys can never silently fall back
    # to a weak default.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    GROQ_API_KEY: str = ""
    HF_TOKEN: str = ""

    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "corporate_lms"

    # [FAISS-DISABLED] FAISS_INDEX_DIR: str = "./faiss_indexes"

    # Pinecone settings
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "nexuslearn"

    DEPARTMENTS: list = [
        # Engineering & Data
        "Data Engineer",
        "AI Engineer",
        "Software Engineer",
        "QA Engineer",
        "Data Analyst",
        "DevOps / Infrastructure",
        "IT / Support",
        "Security",
        # Product & Design
        "Product Management",
        "Design / UX",
        # Go-to-market
        "Sales",
        "Marketing",
        "Customer Success",
        "Customer Support",
    ]

    # Email (SMTP) settings
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = ""
    MAIL_FROM_NAME: str = "NexusLearn"

    # Verification settings
    VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    FRONTEND_URL: str = "http://localhost:3000"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Dev mode - auto-verifies emails without sending.
    # Defaults to False so production never accidentally inherits an insecure
    # default. Set DEV_MODE=true in .env for local development.
    DEV_MODE: bool = False

    # Super admin bootstrap (seeded at startup if no super_admin exists in DB)
    SUPER_ADMIN_EMAIL: str = ""
    SUPER_ADMIN_PASSWORD: str = ""
    SUPER_ADMIN_NAME: str = "Super Admin"

    # CORS — comma-separated allowed origins. Empty in dev (defaults to "*").
    # In production: set CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
    CORS_ORIGINS: str = ""

    # --- Rate limiting (in-app, per client IP, sliding 60s window) ---
    RATE_LIMIT_PER_MIN: int = 120        # general endpoints
    AUTH_RATE_LIMIT_PER_MIN: int = 12    # login/signup/reset/google (brute-force guard)

    # --- Groq (free-tier) usage caps ---
    # Llama-4-Scout free tier ~= 1000 requests/day, ~30 requests/min. We count
    # ACTUAL Groq requests for the global cap (retries included) and keep a buffer.
    GROQ_DAILY_LIMIT: int = 900          # global ACTUAL Groq requests / UTC day (buffer under ~1000 RPD)
    GROQ_USER_DAILY_LIMIT: int = 25      # per user AI actions / UTC day (fairness)
    GROQ_RPM_LIMIT: int = 25             # global requests / minute (buffer under ~30 RPM)

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS.strip():
            return ["*"]
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Fail loudly if SECRET_KEY isn't set — the app must not start without one.
if not settings.SECRET_KEY:
    print(
        "[config] FATAL: SECRET_KEY is not set. Set it in backend/.env "
        "(generate with: python -c \"import secrets;print(secrets.token_urlsafe(64))\")",
        file=sys.stderr,
    )
    sys.exit(1)

# Set HuggingFace token in environment for the library to pick up
os.environ["HF_TOKEN"] = settings.HF_TOKEN
os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
# [FAISS-DISABLED] os.makedirs(settings.FAISS_INDEX_DIR, exist_ok=True)

# Pinecone initialization
from pinecone import Pinecone
pc = Pinecone(api_key=settings.PINECONE_API_KEY)
pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
