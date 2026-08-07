import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Community CRUD ────────────────────────────────────────────────────
class CommunityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = Field(default=None, max_length=1000)
    banner_url: str | None = None
    avatar_url: str | None = None
    is_private: bool = False


class CommunityUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    banner_url: str | None = None
    avatar_url: str | None = None
    is_private: bool | None = None


class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: str | None = None
    banner_url: str | None = None
    avatar_url: str | None = None
    is_private: bool
    owner_id: str
    member_count: int = 0
    is_live: bool = False


class StreamCredentialsOut(BaseModel):
    """Owner/admin-only: the RTMP URL (with key) + the raw key, for OBS setup."""

    stream_url: str
    stream_key: str


# ── Members ───────────────────────────────────────────────────────────
class MemberOut(BaseModel):
    user_id: uuid.UUID
    username: str
    display_name: str
    role: str
    joined_at: datetime


# ── Admin community management ────────────────────────────────────────
class AdminCommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    owner_id: uuid.UUID
    member_count: int = 0
    is_live: bool = False
    is_suspended: bool = False
    created_at: datetime


class AdminCommunityUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    is_private: bool | None = None
    is_suspended: bool | None = None
