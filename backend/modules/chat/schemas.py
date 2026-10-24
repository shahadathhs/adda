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


class MessageOut(BaseModel):
    """A chat message as returned by the history endpoint (same shape as the WS payload)."""

    id: uuid.UUID
    community_id: uuid.UUID
    author: AuthorOut
    content: str
    reply_to: uuid.UUID | None = None
    created_at: datetime


class IdentityModeIn(BaseModel):
    mode: Literal["named", "anonymous"]
