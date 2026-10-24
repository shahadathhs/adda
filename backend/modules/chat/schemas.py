import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class AuthorOut(BaseModel):
    """The public author of a message. Anonymous authors carry no id or name."""

    id: uuid.UUID | None = None
    username: str | None = None
    display_name: str
    avatar_url: str | None = None
    badges: list[str] = []


class ReplyOut(BaseModel):
    """A short preview of the message being replied to; `deleted` is true for a tombstone."""

    id: uuid.UUID
    deleted: bool = False
    content: str | None = None
    author: AuthorOut | None = None


class MessageOut(BaseModel):
    """A chat message as returned by the history endpoint (same shape as the WS payload)."""

    id: uuid.UUID
    community_id: uuid.UUID
    author: AuthorOut
    content: str
    reply_to: uuid.UUID | None = None
    reply: ReplyOut | None = None
    mentions: list[uuid.UUID] = []
    reactions: dict[str, int] = {}
    my_reactions: list[str] | None = None
    created_at: datetime


class IdentityModeIn(BaseModel):
    mode: Literal["named", "anonymous"]


class ChatSettingsIn(BaseModel):
    slow_mode_seconds: int | None = None
    followers_only: bool | None = None


class PinIn(BaseModel):
    message_id: uuid.UUID


class BanIn(BaseModel):
    user_id: uuid.UUID
    minutes: int | None = None  # None bans for good
    reason: str | None = None


class BanOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    display_name: str
    reason: str | None = None
    expires_at: datetime | None = None
    created_at: datetime


class ModActionOut(BaseModel):
    id: uuid.UUID
    action: str
    actor: str | None = None
    target: str | None = None
    detail: str | None = None
    created_at: datetime
