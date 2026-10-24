"""WebSocket gateway endpoint.

Authenticates via a `token` query param, then processes the typed protocol from
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
from modules.chat.service.messages import MessageRejected, create_message, wire_payload
from modules.communities.service.queries import get_community
from modules.realtime.constants import AUTH_ERROR_WS_CODE
from modules.realtime.manager import Connection, manager
from modules.realtime.protocol import IncomingMessage, outgoing

router = APIRouter(tags=["ws"])


def _connection_id() -> str:
    return f"conn-{uuid.uuid4().hex[:12]}"


_CHAT_TOPIC = re.compile(r"^community/([0-9a-fA-F-]{36})/chat$")


async def _handle_chat(conn: Connection, user, msg: IncomingMessage) -> None:
    """Persist a chat message and broadcast it, or tell the sender why not."""
    assert msg.channel is not None and msg.data is not None
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
        if await get_community(db, community_id) is None:
            await manager.send_to(
                conn, outgoing("error", data={"code": "not_found", "message": "Channel not found"})
            )
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
        payload = wire_payload(row, user, msg.channel)

    await manager.broadcast(msg.channel, outgoing("chat_message", msg.channel, payload))


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    token = websocket.query_params.get("token")
    user = await get_current_user_ws(token) if token else None

    if user is None:
        await websocket.close(code=AUTH_ERROR_WS_CODE)
        return

    await websocket.accept()
    await manager.start()

    conn = Connection(
        id=_connection_id(),
        websocket=websocket,
        user_id=str(user.id),
        username=user.username,
        display_name=user.display_name,
    )
    manager.register(conn)

    # Every authed connection listens on its personal channel — personal
    # notifications are delivered there without explicit subscribe.
    user_channel = f"user/{conn.user_id}"
    await manager.subscribe(conn, user_channel)

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
                await manager.subscribe(conn, msg.channel)
                await manager.send_to(conn, outgoing("subscribed", msg.channel))
                await manager.announce_presence(msg.channel)

            elif msg.type == "unsubscribe" and msg.channel:
                await manager.unsubscribe(conn, msg.channel)
                await manager.send_to(conn, outgoing("unsubscribed", msg.channel))
                await manager.announce_presence(msg.channel)

            elif msg.type == "chat_message" and msg.channel and msg.data:
                await _handle_chat(conn, user, msg)

    except WebSocketDisconnect:
        pass
    finally:
        left = list(conn.channels)
        await manager.disconnect(conn)
        for channel in left:
            await manager.announce_presence(channel)
