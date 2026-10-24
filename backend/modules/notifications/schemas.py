import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: uuid.UUID
    kind: str
    payload: dict[str, Any]
    read: bool
    created_at: datetime


class NotificationList(BaseModel):
    items: list[NotificationOut]
    unread: int


class MarkReadBody(BaseModel):
    ids: list[uuid.UUID] | None = None  # None marks everything read


class PrefOut(BaseModel):
    community_id: uuid.UUID | None
    community_name: str | None = None
    bell: bool
    email: bool


class PrefsOut(BaseModel):
    email_available: bool  # false when the server has no SMTP configured
    default: PrefOut
    channels: list[PrefOut]


class PrefIn(BaseModel):
    community_id: uuid.UUID | None = None
    bell: bool | None = None
    email: bool | None = None
