"""WebSocket gateway endpoint.

Authenticates via an optional `token` query param: a valid token is an account,
no token is a read-only guest (may subscribe and read, never write), and a bad
token is refused. Then processes the typed protocol from
`modules/realtime/protocol.py`. Chat messages are persisted to the database AND
broadcast through Redis (see `manager.py`) for multi-instance fan-out.

Chat topic for a channel: ``community/<uuid>/chat``. The gateway only parses and
routes; validation and persistence live in `modules/chat/service/`.
"""

import re
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core import metrics
from core.database import async_session_factory
from core.security.deps import get_current_user_ws
from models.community import Community
from models.message import Message
from models.poll import Poll
from models.user import User
from modules.chat.service import polls, reactions
from modules.chat.service.messages import MessageRejected, send_message
from modules.chat.service.serialize import serialize_one
from modules.communities.service.queries import get_community
from modules.realtime.constants import AUTH_ERROR_WS_CODE
from modules.realtime.manager import Connection, manager
from modules.realtime.protocol import IncomingMessage, outgoing

router = APIRouter(tags=["ws"])


def _connection_id() -> str:
    return f"conn-{uuid.uuid4().hex[:12]}"


_CHAT_TOPIC = re.compile(r"^community/([0-9a-fA-F-]{36})/chat$")


async def _error(conn: Connection, code: str, message: str) -> None:
    await manager.send_to(conn, outgoing("error", data={"code": code, "message": message}))


def _may_subscribe(conn: Connection, channel: str) -> bool:
    """Channel events are public; a `user/<id>` channel belongs to that account alone."""
    if channel.startswith("user/"):
        return not conn.is_guest and channel == f"user/{conn.user_id}"
    return True


def _community_id(channel: str | None) -> uuid.UUID | None:
    match = _CHAT_TOPIC.match(channel or "")
    if not match:
        return None
    try:
        return uuid.UUID(match.group(1))
    except ValueError:
        return None


def _uuid(value: object) -> uuid.UUID | None:
    try:
        return uuid.UUID(str(value))
    except ValueError:
        return None


async def _load_channel(
    conn: Connection, user: User | None, msg: IncomingMessage
) -> tuple[uuid.UUID, User, Community] | None:
    """Common gate for every chat write: signed in, a real chat topic, an existing channel, and
    the account as it is now (the socket's copy is a snapshot from connect time)."""
    if user is None:
        await _error(conn, "auth_required", "Sign in to chat")
        return None
    community_id = _community_id(msg.channel)
    if community_id is None:
        await _error(conn, "invalid_channel", "Unknown chat")
        return None
    async with async_session_factory() as db:
        community = await get_community(db, community_id)
        fresh = await db.get(User, user.id)
        if community is None:
            await _error(conn, "not_found", "Channel not found")
            return None
        if fresh is None or not fresh.is_active:
            await _error(conn, "auth_required", "Sign in to chat")
            return None
        db.expunge(community)
        db.expunge(fresh)
    return community_id, fresh, community


async def _handle_chat(conn: Connection, user: User | None, msg: IncomingMessage) -> None:
    """Persist a chat message and broadcast it, or tell the sender why not."""
    assert msg.channel is not None and msg.data is not None
    loaded = await _load_channel(conn, user, msg)
    if loaded is None:
        return
    _, sender, community = loaded
    async with async_session_factory() as db:
        try:
            row = await send_message(
                db, community, sender, msg.data.get("content", ""), msg.data.get("reply_to")
            )
        except MessageRejected as exc:
            metrics.CHAT_REJECTED.labels(exc.code).inc()
            await _error(conn, exc.code, exc.message)
            return
        payload = await serialize_one(db, community, row, sender, msg.channel)
    await manager.broadcast(msg.channel, outgoing("chat_message", msg.channel, payload))


async def _handle_react(conn: Connection, user: User | None, msg: IncomingMessage) -> None:
    assert msg.channel is not None and msg.data is not None
    loaded = await _load_channel(conn, user, msg)
    if loaded is None:
        return
    community_id, sender, _ = loaded
    message_id = _uuid(msg.data.get("message_id"))
    async with async_session_factory() as db:
        message = await db.get(Message, message_id) if message_id else None
        if message is None or message.community_id != community_id:
            await _error(conn, "not_found", "Message not found")
            return
        try:
            await reactions.toggle(
                db, message, sender.id, str(msg.data.get("emoji", "")), bool(msg.data.get("on"))
            )
        except MessageRejected as exc:
            await _error(conn, exc.code, exc.message)
            return
    reactions.batcher.mark(msg.channel, message.id)


async def _handle_vote(conn: Connection, user: User | None, msg: IncomingMessage) -> None:
    assert msg.channel is not None and msg.data is not None
    loaded = await _load_channel(conn, user, msg)
    if loaded is None:
        return
    community_id, voter, _ = loaded
    poll_id, option_id = _uuid(msg.data.get("poll_id")), _uuid(msg.data.get("option_id"))
    async with async_session_factory() as db:
        poll = await db.get(Poll, poll_id) if poll_id else None
        if poll is None or poll.community_id != community_id or option_id is None:
            await _error(conn, "not_found", "Poll not found")
            return
        try:
            await polls.vote(db, poll, voter, option_id)
        except MessageRejected as exc:
            await _error(conn, exc.code, exc.message)
            return
        # The sender sees their own choice right away; everyone else gets the throttled update.
        await manager.send_to(
            conn, outgoing("poll_update", msg.channel, await polls.state(db, poll, voter.id))
        )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    user = await get_current_user_ws(token) if token else None

    if token and user is None:
        await websocket.close(code=AUTH_ERROR_WS_CODE)
        return

    await websocket.accept()
    await manager.start()

    conn_id = _connection_id()
    conn = Connection(
        id=conn_id,
        websocket=websocket,
        user_id=str(user.id) if user else f"guest:{conn_id}",
        username=user.username if user else "guest",
        display_name=user.display_name if user else "Guest",
        is_guest=user is None,
    )
    manager.register(conn)

    # Accounts listen on their personal channel; notifications arrive there
    # without an explicit subscribe. Guests have none.
    if user is not None:
        await manager.subscribe(conn, f"user/{conn.user_id}")

    try:
        while True:
            raw = await websocket.receive_json()
            try:
                msg = IncomingMessage.model_validate(raw)
            except Exception:
                await manager.send_to(conn, outgoing("error", data={"message": "Invalid message"}))
                continue

            if msg.type == "ping":
                await manager.send_to(conn, outgoing("pong"))

            elif msg.type == "subscribe" and msg.channel:
                if not _may_subscribe(conn, msg.channel):
                    await _error(conn, "forbidden", "Not allowed to join that channel")
                    continue
                await manager.subscribe(conn, msg.channel)
                await manager.send_to(conn, outgoing("subscribed", msg.channel))
                await manager.announce_presence(msg.channel)

            elif msg.type == "unsubscribe" and msg.channel:
                await manager.unsubscribe(conn, msg.channel)
                await manager.send_to(conn, outgoing("unsubscribed", msg.channel))
                await manager.announce_presence(msg.channel)

            elif msg.type == "chat_message" and msg.channel and msg.data is not None:
                await _handle_chat(conn, user, msg)

            elif msg.type == "react" and msg.channel and msg.data is not None:
                await _handle_react(conn, user, msg)

            elif msg.type == "vote" and msg.channel and msg.data is not None:
                await _handle_vote(conn, user, msg)

    except WebSocketDisconnect:
        pass
    finally:
        left = list(conn.channels)
        await manager.disconnect(conn)
        for channel in left:
            await manager.announce_presence(channel)
