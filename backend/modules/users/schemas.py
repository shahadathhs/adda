import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserOut(BaseModel):
    """Public user representation, shared across modules."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: EmailStr
    display_name: str
    avatar_url: str | None = None
    bio: str | None = None
    system_role: str = "user"
    google_id: str | None = None
    two_factor_enabled: bool = False
    has_password: bool = True

    @field_validator("id", mode="before")
    @classmethod
    def _coerce_uuid(cls, value: object) -> str:
        return str(value)


# ── Admin user management ─────────────────────────────────────────────
class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: str
    display_name: str
    system_role: str
    is_active: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    system_role: str | None = None
    is_active: bool | None = None


class AdminPasswordReset(BaseModel):
    password: str = Field(min_length=8, max_length=128)
