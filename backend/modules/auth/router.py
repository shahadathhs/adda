import logging
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.email import send_password_reset_email
from core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
)
from core.security.deps import get_current_user
from core.security.jwt import create_access_token
from core.security.password import verify_password
from core.security.tokens import create_reset_token, verify_reset_token
from models.user import User
from modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    ResetPasswordRequest,
    Token,
    UserLogin,
    UserRegister,
)
from modules.auth.service.auth_service import (
    authenticate,
    create_user,
    get_or_create_google_user,
    get_user_by_email,
    get_user_by_username,
    set_password,
)
from modules.auth.service.oauth import verify_google_id_token
from modules.users.schemas import UserOut

logger = logging.getLogger("adda.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_email(db, data.email):
        raise ConflictException("Email already registered")
    if await get_user_by_username(db, data.username):
        raise ConflictException("Username already taken")

    user = await create_user(db, data)
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate(db, data.email, data.password)
    if user is None:
        raise UnauthorizedException("Incorrect email or password")
    if not user.is_active:
        raise ForbiddenException("Account suspended")
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Password reset ────────────────────────────────────────────────────
@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Never reveal whether the email exists — always respond the same way.
    user = await get_user_by_email(db, str(data.email))
    if user is not None:
        token = create_reset_token(str(user.id))
        link = f"{settings.password_reset_url}?token={token}"
        if settings.smtp_host:
            await send_password_reset_email(user.email, link)
        else:
            logger.info("SMTP off — reset link for %s: %s", user.email, link)
    return {"message": "If that account exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user_id = verify_reset_token(data.token)
    if user_id is None:
        raise BadRequestException("Invalid or expired reset token")
    user = await db.get(User, uuid.UUID(user_id))
    if user is None:
        raise BadRequestException("Invalid or expired reset token")
    await set_password(db, user, data.password)
    return {"message": "Your password has been reset."}


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.password_hash or not verify_password(
        data.current_password, current_user.password_hash
    ):
        raise UnauthorizedException("Current password is incorrect")
    await set_password(db, current_user, data.new_password)
    return {"message": "Your password has been changed."}


# ── Google OAuth ──────────────────────────────────────────────────────
@router.post("/google", response_model=Token)
async def google_login(data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    if not settings.google_client_id:
        raise BadRequestException("Google sign-in is not configured")
    payload = verify_google_id_token(data.id_token)
    if payload is None:
        raise UnauthorizedException("Invalid Google token")

    email = payload.get("email")
    google_id = payload.get("sub")
    if not email or not google_id:
        raise UnauthorizedException("Invalid Google token")

    user = await get_or_create_google_user(
        db,
        google_id=str(google_id),
        email=str(email),
        name=payload.get("name"),
        picture=payload.get("picture"),
    )
    if not user.is_active:
        raise ForbiddenException("Account suspended")

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))
