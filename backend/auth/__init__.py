import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.models import User
from backend.schemas.schemas import SignupRequest, LoginRequest, TokenResponse, DeviceLoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
DEVICE_TOKEN_EXPIRE_DAYS = 365 * 10  # 10 years — device tokens never expire in practice

security = HTTPBearer()


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(user_id: int, expire_minutes: int | None = None, expire_days: int | None = None) -> str:
    if expire_days:
        delta = timedelta(days=expire_days)
    else:
        delta = timedelta(minutes=expire_minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + delta,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/device-login", response_model=TokenResponse)
def device_login(body: DeviceLoginRequest, db: Session = Depends(get_db)):
    """Auto-register or login a device using its unique device_id.
    Creates a user account on first call; subsequent calls return a fresh token.
    The device_id is stored as the email (prefixed) so it fits the existing User model.
    """
    virtual_email = f"device:{body.device_id}@ecohabit.local"
    user = db.query(User).filter(User.email == virtual_email).first()
    if user is None:
        # First time: auto-register this device
        dummy_hash = _hash_password(body.device_id)  # device_id used as password — irrelevant
        user = User(email=virtual_email, hashed_password=dummy_hash)
        db.add(user)
        db.commit()
        db.refresh(user)
    return TokenResponse(access_token=_create_token(user.id, expire_days=DEVICE_TOKEN_EXPIRE_DAYS))


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=body.email, hashed_password=_hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=_create_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not _verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(access_token=_create_token(user.id))


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
