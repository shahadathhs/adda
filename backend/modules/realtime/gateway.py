"""WebSocket gateway endpoint.

Authenticates via a `token` query param, then processes the typed protocol from
`modules/realtime/protocol.py`. Chat messages are broadcast through Redis (see
`manager.py`) so the realtime loop is proven end-to-end; persistence is the
next feature.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.security.deps import get_current_user_ws
from modules.realtime.constants import AUTH_ERROR_WS_CODE
from modules.realtime.manager import Connection, manager
from modules.realtime.protocol import IncomingMessage, outgoing

router = APIRouter(tags=["ws"])


def _connection_id() -> str:
    return f"conn-{uuid.uuid4().hex[:12]}"


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
                await manager.send_to(
                    conn, outgoing("error", data={"message": "Invalid message"})
                )
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
                payload = {
                    "id": f"m-{uuid.uuid4().hex[:16]}",
                    "channel": msg.channel,
                    "user_id": conn.user_id,
                    "username": conn.username,
                    "display_name": conn.display_name,
                    "content": content,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "reply_to": msg.data.get("reply_to"),
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
