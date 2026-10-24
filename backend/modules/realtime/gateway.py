"""WebSocket gateway endpoint.

Authenticates via an optional `token` query param: a valid token is an account,
no token is a read-only guest (may subscribe and read, never write), and a bad
token is refused. Then processes the typed protocol from
`modules/realtime/protocol.py`. Chat messages are persisted to the database AND
broadcast through Redis (see `manager.py`) for multi-instance fan-out.

Chat topic for a channel: ``community/<uuid>/chat``. The gateway only parses and
routes; validation and persistence live in `modules/chat/service/messages.py`.
"""

import re
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.database import async_session_factory
from core.security.deps import get_current_user_ws
from models.user import User
from modules.chat.service.messages import MessageRejected, create_message, wire_payload
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


async def _handle_chat(conn: Connection, user: User | None, msg: IncomingMessage) -> None:
    """Persist a chat message and broadcast it, or tell the sender why not."""
    assert msg.channel is not None and msg.data is not None
    if user is None:
        await _error(conn, "auth_required", "Sign in to chat")
        return
    match = _CHAT_TOPIC.match(msg.channel)
    try:
        community_id = uuid.UUID(match.group(1)) if match else None
    except ValueError:
        community_id = None
    if community_id is None:
        await manager.send_to(
            conn, outgoing("error", data={"code": "invalid_channel", "message": "Unknown chat"})
        )
        return

    async with async_session_factory() as db:
        community = await get_community(db, community_id)
        if community is None:
            await manager.send_to(
                conn, outgoing("error", data={"code": "not_found", "message": "Channel not found"})
            )
            return
        # The socket's user is a snapshot from connect time; chat uses the current
        # row so identity-mode changes and suspensions apply immediately.
        user = await db.get(User, user.id)
        if user is None or not user.is_active:
            await _error(conn, "auth_required", "Sign in to chat")
            return
        try:
            row = await create_message(
                db, community_id, user, msg.data.get("content", ""), msg.data.get("reply_to")
            )
        except MessageRejected as exc:
            await manager.send_to(
                conn, outgoing("error", data={"code": exc.code, "message": exc.message})
            )
            return
        payload = await wire_payload(db, community, row, user, msg.channel)

    await manager.broadcast(msg.channel, outgoing("chat_message", msg.channel, payload))


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

    except WebSocketDisconnect:
        pass
    finally:
        left = list(conn.channels)
        await manager.disconnect(conn)
        for channel in left:
            await manager.announce_presence(channel)
