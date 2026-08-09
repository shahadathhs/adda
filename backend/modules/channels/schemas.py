import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChannelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    slug: str = Field(min_length=1, max_length=50, pattern=r"^[a-z0-9-]+$")
    type: str = Field(default="text", max_length=20)  # text, announcement, live
    position: int = 0
    is_restricted: bool = False


class ChannelUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=50)
    position: int | None = None
    is_restricted: bool | None = None


class ChannelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    community_id: uuid.UUID
    name: str
    slug: str
    type: str
    position: int
    is_restricted: bool = False
    has_access: bool = True  # computed per-request
    created_at: datetime


class MessageOut(BaseModel):
    id: uuid.UUID
    channel_id: uuid.UUID
    user_id: uuid.UUID
    username: str
    display_name: str
    content: str
    reply_to_id: uuid.UUID | None = None
    created_at: datetime
    edited_at: datetime | None = None


class ChannelMemberOut(BaseModel):
    user_id: uuid.UUID
    username: str
    display_name: str
    can_read: bool
    can_write: bool


class AddChannelMemberBody(BaseModel):
    user_id: uuid.UUID
    can_read: bool = True
    can_write: bool = True
