"""WebSocket message protocol — THE shared contract between backend and frontend.

This must stay in sync with `web/src/lib/types/realtime.ts`. When adding a realtime
feature, add the message type here first, then handle it on both sides.

Connections are accounts (valid `token`) or read-only guests (no token); guests
can subscribe to channel topics but any write gets `error` `auth_required`.

Channels are namespaced strings, e.g.:
    community/<id>            — channel-wide events (stream_status)
    community/<id>/chat       — live chat (persisted)
    user/<id>                 — personal notifications
"""

from typing import Any, Literal

from pydantic import BaseModel

# ── Client → Server ───────────────────────────────────────────────
ClientMessageType = Literal[
    "subscribe",  # join a channel
    "unsubscribe",  # leave a channel
    "chat_message",  # send a chat message
    "react",  # toggle a reaction: data {message_id, emoji, on}
    "vote",  # vote in a poll: data {poll_id, option_id}
    "ping",
]

# ── Server → Client ───────────────────────────────────────────────
ServerMessageType = Literal[
    "subscribed",
    "unsubscribed",
    "chat_message",  # echoes + broadcasts new chat messages
    "message_deleted",  # data {message_id}; clients show a tombstone
    "reaction_update",  # data {message_id, counts}, batched every 250 ms
    "pin_update",  # data {message: <chat message> | null}
    "poll_started",  # data: a poll (see below)
    "poll_update",  # the poll with fresh tallies, at most twice a second
    "poll_closed",  # the final poll
    "chat_settings",  # data {slow_mode_seconds, followers_only}
    "moderation",  # to the affected account only: {community_id, action, expires_at}
    "presence",  # online members in a channel
    "stream_status",  # a community went live / offline
    "notification",  # personal notification (delivered on user/<id>)
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
class ChatAuthorPayload(BaseModel):
    """Public author of a message. Anonymous authors have no id or username."""

    id: str | None
    username: str | None
    display_name: str
    avatar_url: str | None
    badges: list[str]


class ReplyPreviewPayload(BaseModel):
    """The message being replied to; `deleted` true means it is a tombstone."""

    id: str
    deleted: bool = False
    content: str | None = None
    author: ChatAuthorPayload | None = None


class ChatMessagePayload(BaseModel):
    """Shape of the `data` field for a `chat_message`."""

    id: str
    channel: str
    community_id: str
    author: ChatAuthorPayload
    content: str
    created_at: str  # ISO 8601
    reply_to: str | None = None
    reply: ReplyPreviewPayload | None = None
    mentions: list[str] = []  # ids of mentioned accounts
    reactions: dict[str, int] = {}  # emoji -> count


class PollOptionPayload(BaseModel):
    id: str
    label: str
    votes: int
    percent: int


class PollPayload(BaseModel):
    """`poll_started`, `poll_update` and `poll_closed` data. `my_vote` is only sent to the voter."""

    id: str
    community_id: str
    question: str
    status: str  # "open" | "closed"
    closes_at: str
    total: int
    my_vote: str | None = None
    options: list[PollOptionPayload]


# `error` messages carry `data.code`: auth_required, forbidden, invalid_channel, not_found, empty,
# too_long, banned, timed_out, followers_only, slow_mode, rate_limited, duplicate, bad_emoji,
# too_many_reactions, poll_closed, bad_option, already_voted.
