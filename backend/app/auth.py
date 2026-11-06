"""Optional accounts: sign up / log in with an Indian mobile number and password.

Passwords are hashed with bcrypt; sessions are stateless JWT bearer tokens. Scanning does not
require an account (guest mode), so only /auth/* endpoints depend on this module.
"""

import re
from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from sqlalchemy import DateTime, String, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.config import Settings, get_settings
from app.db import Base, get_db

Role = Literal["farmer", "officer"]
JWT_ALGORITHM = "HS256"
# bcrypt only uses the first 72 bytes of a password.
MAX_PASSWORD_BYTES = 72


# --------------------------------------------------------------------------- model


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(16))
    password_hash: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )


# --------------------------------------------------------------------------- schemas


def normalise_phone(value: str) -> str:
    """Accept 98xxxxxxxx, 098xxxxxxxx, +91 98xxx xxxxx … and return E.164 (+9198xxxxxxxx)."""
    digits = re.sub(r"[\s\-()]", "", value)
    digits = re.sub(r"^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))", "", digits)
    if not re.fullmatch(r"[6-9]\d{9}", digits):
        raise ValueError("Enter a valid 10-digit Indian mobile number")
    return f"+91{digits}"


class PhoneModel(BaseModel):
    phone: str = Field(examples=["9876543210"])

    @field_validator("phone")
    @classmethod
    def _phone(cls, v: str) -> str:
        return normalise_phone(v)


class LoginRequest(PhoneModel):
    password: str = Field(min_length=1, max_length=128)


class SignupRequest(PhoneModel):
    name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128, description="At least 8 characters")
    role: Role = "farmer"

    @field_validator("name")
    @classmethod
    def _name(cls, v: str) -> str:
        return " ".join(v.split())

    @field_validator("password")
    @classmethod
    def _password(cls, v: str) -> str:
        if len(v.encode()) > MAX_PASSWORD_BYTES:
            raise ValueError("Password is too long")
        return v


class UserOut(BaseModel):
    id: int
    phone: str
    name: str
    role: Role
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_at: datetime
    user: UserOut


# --------------------------------------------------------------------------- helpers


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode()[:MAX_PASSWORD_BYTES], password_hash.encode())


# Used when the phone is unknown so login takes the same time either way.
_DUMMY_HASH = hash_password("timing-equaliser")


def issue_token(user: User, settings: Settings) -> TokenResponse:
    expires_at = datetime.now(UTC) + timedelta(days=settings.jwt_expiry_days)
    token = jwt.encode(
        {"sub": str(user.id), "exp": expires_at}, settings.jwt_secret, algorithm=JWT_ALGORITHM
    )
    return TokenResponse(
        access_token=token, expires_at=expires_at, user=UserOut.model_validate(user)
    )


_bearer = HTTPBearer(auto_error=False)


def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED, "Not signed in", headers={"WWW-Authenticate": "Bearer"}
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=[JWT_ALGORITHM]
        )
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        raise unauthorized from None
    if user is None:
        raise unauthorized
    return user


# --------------------------------------------------------------------------- routes


def create_auth_router(limiter: Limiter) -> APIRouter:
    router = APIRouter(prefix="/auth", tags=["auth"])
    limit = limiter.limit(lambda: get_settings().auth_rate_limit)

    @router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
    @limit
    def signup(
        request: Request,
        body: SignupRequest,
        settings: Annotated[Settings, Depends(get_settings)],
        db: Annotated[Session, Depends(get_db)],
    ) -> TokenResponse:
        """Create an account and return a session token."""
        user = User(
            phone=body.phone,
            name=body.name,
            role=body.role,
            password_hash=hash_password(body.password),
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status.HTTP_409_CONFLICT, "An account with this number already exists"
            ) from None
        return issue_token(user, settings)

    @router.post("/login", response_model=TokenResponse)
    @limit
    def login(
        request: Request,
        body: LoginRequest,
        settings: Annotated[Settings, Depends(get_settings)],
        db: Annotated[Session, Depends(get_db)],
    ) -> TokenResponse:
        """Exchange phone + password for a session token."""
        user = db.scalar(select(User).where(User.phone == body.phone))
        if (
            not verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
            or not user
        ):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong phone number or password")
        return issue_token(user, settings)

    @router.get("/me", response_model=UserOut)
    def me(user: Annotated[User, Depends(current_user)]) -> User:
        """The signed-in user's profile."""
        return user

    return router
