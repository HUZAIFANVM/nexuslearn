from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from config import settings
from database import users_collection

security = HTTPBearer()


def get_user_by_email(email: str):
    return users_collection.find_one({"email": email})


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = get_user_by_email(email=email)
    if user is None:
        raise credentials_exception
    return user


def require_hr_role(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "hr":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR role required for this operation",
        )
    return current_user


def require_super_admin_role(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin role required for this operation",
        )
    return current_user
