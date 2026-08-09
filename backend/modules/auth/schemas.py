from pydantic import BaseModel, EmailStr, Field

from modules.users.schemas import UserOut


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class GoogleAuthRequest(BaseModel):
    id_token: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: str


# ── Profile update ────────────────────────────────────────────────────
class UpdateProfileRequest(BaseModel):
    username: str | None = Field(
        default=None, min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$"
    )
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    avatar_url: str | None = Field(default=None, max_length=512)
    bio: str | None = Field(default=None, max_length=500)


class SetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


# ── OTP login (passwordless) ──────────────────────────────────────────
class OtpRequest(BaseModel):
    email: EmailStr


class OtpVerify(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


# ── 2FA ───────────────────────────────────────────────────────────────
class TwoFactorVerify(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class TwoFactorDisable(BaseModel):
    password: str


class Login2faVerify(BaseModel):
    temp_token: str
    code: str = Field(min_length=6, max_length=6)


class GoogleLinkRequest(BaseModel):
    id_token: str
