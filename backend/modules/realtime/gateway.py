"""WebSocket gateway endpoint.

Authenticates via a `token` query param, then processes the typed protocol from
`modules/realtime/protocol.py`. Chat messages are persisted to the database AND
broadcast through Redis (see `manager.py`) for multi-instance fan-out.

WS channel naming for DB-backed channels:  ``channel:<uuid>``
The gateway parses the UUID, saves a Message row, and broadcasts with the DB id.
"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.database import async_session_factory
from core.security.deps import get_current_user_ws
from models.message import Message as MessageModel
from modules.realtime.constants import AUTH_ERROR_WS_CODE
from modules.realtime.manager import Connection, manager
from modules.realtime.protocol import IncomingMessage, outgoing

router = APIRouter(tags=["ws"])


def _connection_id() -> str:
    return f"conn-{uuid.uuid4().hex[:12]}"


def _parse_channel_uuid(channel: str) -> uuid.UUID | None:
    """Extract the channel UUID from a WS topic like ``channel:<uuid>``."""
    if not channel.startswith("channel:"):
        return None
    try:
        return uuid.UUID(channel.removeprefix("channel:"))
    except ValueError:
        return None


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
                content = str(msg.data.get("content", "")).strip()
                if not content:
                    continue

                channel_uuid = _parse_channel_uuid(msg.channel)
                reply_to = msg.data.get("reply_to")

                if channel_uuid is not None:
                    # DB-backed channel — persist then broadcast.
                    async with async_session_factory() as db:
                        row = MessageModel(
                            channel_id=channel_uuid,
                            user_id=uuid.UUID(conn.user_id),
                            content=content,
                            reply_to_id=uuid.UUID(reply_to) if reply_to else None,
                        )
                        db.add(row)
                        await db.commit()
                        await db.refresh(row)
                        payload = {
                            "id": str(row.id),
                            "channel_id": str(channel_uuid),
                            "channel": msg.channel,
                            "user_id": conn.user_id,
                            "username": conn.username,
                            "display_name": conn.display_name,
                            "content": content,
                            "created_at": row.created_at.isoformat(),
                            "reply_to": reply_to,
                        }
                else:
                    # Global community chat — ephemeral broadcast (any authed user).
                    payload = {
                        "id": f"m-{uuid.uuid4().hex[:16]}",
                        "channel": msg.channel,
                        "user_id": conn.user_id,
                        "username": conn.username,
                        "display_name": conn.display_name,
                        "content": content,
                        "created_at": datetime.now(UTC).isoformat(),
                        "reply_to": reply_to,
                    }

                await manager.broadcast(
                    msg.channel, outgoing("chat_message", msg.channel, payload)
                )

    except WebSocketDisconnect:
        pass
    finally:
        left = list(conn.channels)
        await manager.disconnect(conn)
        for channel in left:
            await manager.announce_presence(channel)
