"""WebSocket message protocol — THE shared contract between backend and frontend.

This must stay in sync with `frontend/src/lib/ws.ts`. When adding a realtime
feature, add the message type here first, then handle it on both sides.

Channels are namespaced strings, e.g.:
    community:<id>            — community-wide events (stream_status, posts)
    community:<id>:chat       — live chat
    community:<id>:presence   — who's online
    user:<id>                 — personal notifications
"""

from typing import Any, Literal

from pydantic import BaseModel

# ── Client → Server ───────────────────────────────────────────────
ClientMessageType = Literal[
    "subscribe",  # join a channel
    "unsubscribe",  # leave a channel
    "chat_message",  # send a chat message
    "ping",
]

# ── Server → Client ───────────────────────────────────────────────
ServerMessageType = Literal[
    "subscribed",
    "unsubscribed",
    "chat_message",  # echoes + broadcasts new chat messages
    "presence",  # online members in a channel
    "stream_status",  # a community went live / offline
    "notification",  # personal notification
    "error",
    "pong",
]


class IncomingMessage(BaseModel):
    """Envelope for every message the client sends over the socket."""

    type: ClientMessageType
    channel: str | None = None
    data: dict[str, Any] | None = None


def outgoing(
    type: ServerMessageType,
    channel: str | None = None,
    data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build a server→client message dict."""
    msg: dict[str, Any] = {"type": type}
    if channel is not None:
        msg["channel"] = channel
    if data is not None:
        msg["data"] = data
    return msg


# ── Typed payloads ────────────────────────────────────────────────
class ChatMessagePayload(BaseModel):
    """Shape of the `data` field for a `chat_message`."""

    id: str
    channel: str
    user_id: str
    username: str
    display_name: str
    content: str
    created_at: str  # ISO 8601
    reply_to: str | None = None


class PresencePayload(BaseModel):
    channel: str
    online_count: int
    user_ids: list[str]
