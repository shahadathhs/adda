from pydantic import BaseModel, Field


class PeerOut(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str | None = None


class DmMessageOut(BaseModel):
    id: str
    thread_id: str
    sender_id: str
    content: str
    created_at: str  # ISO 8601


class ThreadOut(BaseModel):
    """One conversation in the inbox — peer, last message, unread count."""

    id: str
    peer: PeerOut
    last_message: DmMessageOut | None = None
    unread_count: int = 0
    created_at: str


class OpenThreadRequest(BaseModel):
    peer_id: str


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MarkReadRequest(BaseModel):
    message_id: str
