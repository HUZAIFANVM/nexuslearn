from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests

from config import settings


class GoogleAuthError(Exception):
    """Custom exception for Google authentication errors."""
    pass


def verify_google_token(token: str) -> dict:
    """
    Verify Google ID token and extract user information.

    Args:
        token: The Google ID token from the frontend

    Returns:
        dict containing: email, name, picture, google_id (sub)

    Raises:
        GoogleAuthError: If token verification fails
    """
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        # Verify issuer
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            raise GoogleAuthError("Invalid token issuer")

        # Verify audience (should be our client ID)
        if idinfo["aud"] != settings.GOOGLE_CLIENT_ID:
            raise GoogleAuthError("Invalid token audience")

        # Extract user info
        return {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "email_verified": idinfo.get("email_verified", False),
            "name": idinfo.get("name", ""),
            "picture": idinfo.get("picture", None),
            "given_name": idinfo.get("given_name", ""),
            "family_name": idinfo.get("family_name", ""),
        }

    except ValueError as e:
        raise GoogleAuthError(f"Invalid Google token: {str(e)}")
    except Exception as e:
        raise GoogleAuthError(f"Google authentication failed: {str(e)}")
