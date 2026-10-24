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
from core.security.password import verify_password
from core.security.tokens import create_reset_token, reset_token_matches, reset_token_subject
from models.user import User
from modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    RefreshRequest,
    ResetPasswordRequest,
    Token,
    UpdateProfileRequest,
    UserLogin,
    UserRegister,
)
from modules.auth.service.auth_service import (
    authenticate,
    create_user,
    get_user_by_email,
    get_user_by_username,
    set_password,
    update_profile,
)
from modules.auth.service.refresh_tokens import (
    create_session,
    revoke_refresh_token,
    rotate_refresh_token,
)
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
    return await create_session(db, user)


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate(db, data.email, data.password)
    if user is None:
        raise UnauthorizedException("Incorrect email or password")
    if not user.is_active:
        raise ForbiddenException("Account suspended")

    return await create_session(db, user)


@router.post("/refresh", response_model=Token)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    session = await rotate_refresh_token(db, data.refresh_token)
    if session is None:
        raise UnauthorizedException("Invalid or expired refresh token")
    return session


@router.post("/logout")
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Revoke a refresh token. Idempotent — always succeeds."""
    await revoke_refresh_token(db, data.refresh_token)
    return {"message": "Logged out."}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Profile ───────────────────────────────────────────────────────────
@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.username and data.username != current_user.username:
        existing = await get_user_by_username(db, data.username)
        if existing is not None:
            raise ConflictException("Username already taken")
    user = await update_profile(db, current_user, data)
    return user


# ── Password management ───────────────────────────────────────────────
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


@router.get("/config")
async def auth_config() -> dict[str, bool | int]:
    """What the sign-in pages need to know: can this server send email, and how long links last."""
    return {
        "email_enabled": bool(settings.smtp_host),
        "reset_link_minutes": settings.reset_token_expire_minutes,
    }


# ── Password reset (email link) ───────────────────────────────────────
@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, str(data.email))
    if user is not None:
        token = create_reset_token(user)
        link = f"{settings.password_reset_url}?token={token}"
        if settings.smtp_host:
            await send_password_reset_email(user.email, link)
        else:
            logger.info("SMTP off — reset link for %s: %s", user.email, link)
    return {"message": "If that account exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    subject = reset_token_subject(data.token)
    if subject is None:
        raise BadRequestException("Invalid or expired reset token")
    user_id, fingerprint = subject
    user = await db.get(User, uuid.UUID(user_id))
    # A used link no longer matches: the password it was issued for is gone.
    if user is None or not reset_token_matches(fingerprint, user):
        raise BadRequestException("Invalid or expired reset token")
    await set_password(db, user, data.password)
    return {"message": "Your password has been reset."}
