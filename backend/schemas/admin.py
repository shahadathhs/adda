import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Stats ──
class StatsOut(BaseModel):
    users: int
    communities: int
    live: int


# ── Users ──
class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    email: str
    display_name: str
    is_admin: bool
    is_active: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    is_admin: bool | None = None
    is_active: bool | None = None


class AdminPasswordReset(BaseModel):
    password: str = Field(min_length=8, max_length=128)


# ── Communities ──
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


class StreamCredentialsOut(BaseModel):
    stream_url: str
    stream_key: str


# ── Members ──
class MemberOut(BaseModel):
    user_id: uuid.UUID
    username: str
    display_name: str
    role: str
    joined_at: datetime


# ── Live ──
class LiveStreamOut(BaseModel):
    community_id: str
    name: str
    viewers: int


# ── Recordings ──
class RecordingOut(BaseModel):
    community_id: str | None
    name: str
    path: str  # relative to the recordings dir; used as the delete handle
    size_bytes: int
    created_at: datetime
