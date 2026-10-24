import uuid
from datetime import datetime

from pydantic import BaseModel


class MessageOut(BaseModel):
    """A chat message as returned by the history endpoint (same shape as the WS payload)."""

    id: uuid.UUID
    community_id: uuid.UUID
    user_id: uuid.UUID
    username: str
    display_name: str
    content: str
    reply_to_id: uuid.UUID | None = None
    created_at: datetime
