import logging
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth_emails import (
    send_2fa_code_email,
    send_2fa_setup_email,
    send_otp_login_email,
)
from core.config import settings
from core.database import get_db
from core.email import send_password_reset_email
from core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    UnauthorizedException,
)
from core.otp import generate_otp, verify_otp
from core.redis_client import redis_client
from core.security.deps import get_current_user
from core.security.jwt import create_access_token
from core.security.password import verify_password
from core.security.tokens import create_reset_token, verify_reset_token
from models.user import User
from modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    GoogleLinkRequest,
    Login2faVerify,
    OtpRequest,
    OtpVerify,
    ResetPasswordRequest,
    SetPasswordRequest,
    Token,
    TwoFactorDisable,
    TwoFactorVerify,
    UpdateProfileRequest,
    UserLogin,
    UserRegister,
)
from modules.auth.service.auth_service import (
    authenticate,
    create_user,
    get_or_create_google_user,
    get_user_by_email,
    get_user_by_username,
    link_google_account,
    set_password,
    update_profile,
)
from modules.auth.service.oauth import verify_google_id_token
from modules.users.schemas import UserOut

logger = logging.getLogger("adda.auth")

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_LOGIN_KEY = "adda:otp:login:{email}"
OTP_2FA_KEY = "adda:otp:2fa:{user_id}"
OTP_2FA_SETUP_KEY = "adda:otp:2fa-setup:{user_id}"
TEMP_TOKEN_KEY = "adda:temp-token:{token}"

TEMP_TOKEN_TTL = 300  # 5 minutes


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    if await get_user_by_email(db, data.email):
        raise ConflictException("Email already registered")
    if await get_user_by_username(db, data.username):
        raise ConflictException("Username already taken")

    user = await create_user(db, data)
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.post("/login")
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate(db, data.email, data.password)
    if user is None:
        raise UnauthorizedException("Incorrect email or password")
    if not user.is_active:
        raise ForbiddenException("Account suspended")

    if user.two_factor_enabled:
        if not settings.smtp_host:
            raise BadRequestException(
                "2FA is enabled but email is not configured. Contact an admin."
            )
        # Generate a temp token + 2FA code.
        temp_token = f"tt-{uuid.uuid4().hex}"
        await redis_client.set(
            TEMP_TOKEN_KEY.format(token=temp_token), str(user.id), ex=TEMP_TOKEN_TTL
        )
        code = await generate_otp(OTP_2FA_KEY.format(user_id=user.id))
        await send_2fa_code_email(user.email, code)
        return {"requires_2fa": True, "temp_token": temp_token}

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


@router.post("/login/verify-2fa", response_model=Token)
async def login_verify_2fa(data: Login2faVerify, db: AsyncSession = Depends(get_db)):
    user_id_raw = await redis_client.get(TEMP_TOKEN_KEY.format(token=data.temp_token))
    if user_id_raw is None:
        raise BadRequestException("Invalid or expired session")
    await redis_client.delete(TEMP_TOKEN_KEY.format(token=data.temp_token))

    user_id = user_id_raw if isinstance(user_id_raw, str) else user_id_raw.decode()

    if not await verify_otp(OTP_2FA_KEY.format(user_id=user_id), data.code):
        raise UnauthorizedException("Invalid or expired code")

    user = await db.get(User, uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise ForbiddenException("Account suspended")

    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


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


@router.post("/set-password")
async def set_password_endpoint(
    data: SetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.password_hash is not None:
        raise BadRequestException("Password is already set. Use change-password instead.")
    await set_password(db, current_user, data.new_password)
    return {"message": "Password has been set."}


# ── Password reset (email link) ───────────────────────────────────────
@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
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


# ── OTP login (passwordless) ──────────────────────────────────────────
@router.post("/otp/request", status_code=status.HTTP_202_ACCEPTED)
async def otp_request(data: OtpRequest, db: AsyncSession = Depends(get_db)):
    if not settings.smtp_host:
        raise BadRequestException("Email login is not configured.")
    user = await get_user_by_email(db, str(data.email))
    if user is None or not user.is_active:
        # Don't reveal whether the email exists.
        return {"message": "If that account exists, a code has been sent."}
    code = await generate_otp(OTP_LOGIN_KEY.format(email=data.email))
    await send_otp_login_email(user.email, code)
    return {"message": "If that account exists, a code has been sent."}


@router.post("/otp/verify", response_model=Token)
async def otp_verify(data: OtpVerify, db: AsyncSession = Depends(get_db)):
    if not await verify_otp(OTP_LOGIN_KEY.format(email=data.email), data.code):
        raise UnauthorizedException("Invalid or expired code")
    user = await get_user_by_email(db, data.email)
    if user is None or not user.is_active:
        raise UnauthorizedException("Invalid or expired code")
    token = create_access_token(str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user, from_attributes=True))


# ── 2FA management ────────────────────────────────────────────────────
@router.post("/2fa/enable", status_code=status.HTTP_202_ACCEPTED)
async def enable_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.two_factor_enabled:
        raise BadRequestException("2FA is already enabled.")
    if not settings.smtp_host:
        raise BadRequestException("Email is not configured — cannot enable 2FA.")
    code = await generate_otp(OTP_2FA_SETUP_KEY.format(user_id=current_user.id))
    await send_2fa_setup_email(current_user.email, code)
    return {"message": "Verification code sent to your email."}


@router.post("/2fa/enable/verify")
async def enable_2fa_verify(
    data: TwoFactorVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await verify_otp(OTP_2FA_SETUP_KEY.format(user_id=current_user.id), data.code):
        raise UnauthorizedException("Invalid or expired code")
    current_user.two_factor_enabled = True
    await db.commit()
    return {"message": "Two-factor authentication enabled."}


@router.post("/2fa/disable")
async def disable_2fa(
    data: TwoFactorDisable,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.password_hash or not verify_password(
        data.password, current_user.password_hash
    ):
        raise UnauthorizedException("Password is incorrect")
    current_user.two_factor_enabled = False
    await db.commit()
    return {"message": "Two-factor authentication disabled."}


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


@router.post("/google/link", response_model=UserOut)
async def google_link(
    data: GoogleLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.google_id:
        raise BadRequestException("Google account is already linked.")
    if not settings.google_client_id:
        raise BadRequestException("Google sign-in is not configured.")
    payload = verify_google_id_token(data.id_token)
    if payload is None:
        raise UnauthorizedException("Invalid Google token")

    google_id = str(payload.get("sub"))
    email = str(payload.get("email"))

    # Check the Google account isn't already linked to someone else.
    existing = await get_user_by_email(db, email)
    if existing and existing.google_id and existing.id != current_user.id:
        raise ConflictException("That Google account is linked to another user.")

    user = await link_google_account(db, current_user, google_id, payload.get("picture"))
    return user
