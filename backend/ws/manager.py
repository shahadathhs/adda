"""Connection manager: tracks local WebSocket connections and bridges them to a
Redis pub/sub bus so messages fan out across all backend instances.

Design:
- Every connection subscribes to channels (e.g. "community:<id>:chat").
- `channel_peers` maps a channel → set of local connection ids subscribed to it.
- A single background task listens to the Redis bus `adda:events` and delivers
  each published message to every local peer subscribed to that channel.
- Presence is tracked with Redis sets `adda:presence:<channel>`.

This keeps one Redis subscriber per process regardless of how many users are
online — the right shape for horizontal scaling later.
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from typing import Any

import redis.asyncio as redis
from fastapi import WebSocket

from redis_client import redis_client

logger = logging.getLogger("adda.ws")

REDIS_BUS = "adda:events"
PRESENCE_PREFIX = "adda:presence:"


@dataclass
class Connection:
    id: str
    websocket: WebSocket
    user_id: str
    username: str
    display_name: str
    channels: set[str] = field(default_factory=set)


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: dict[str, Connection] = {}
        self.channel_peers: dict[str, set[str]] = {}
        self._listener_task: asyncio.Task[None] | None = None
        self._lock = asyncio.Lock()

    # ── lifecycle ────────────────────────────────────────────────
    async def start(self) -> None:
        if self._listener_task is None:
            self._listener_task = asyncio.create_task(self._redis_listener())

    def register(self, conn: Connection) -> None:
        self.connections[conn.id] = conn

    async def disconnect(self, conn: Connection) -> None:
        async with self._lock:
            self.connections.pop(conn.id, None)
            for channel in list(conn.channels):
                peers = self.channel_peers.get(channel)
                if peers:
                    peers.discard(conn.id)
                    if not peers:
                        self.channel_peers.pop(channel, None)
                await self._presence_remove(channel, conn.user_id)
            conn.channels.clear()

    # ── subscriptions ────────────────────────────────────────────
    async def subscribe(self, conn: Connection, channel: str) -> None:
        async with self._lock:
            conn.channels.add(channel)
            self.channel_peers.setdefault(channel, set()).add(conn.id)
        await self._presence_add(channel, conn.user_id)

    async def unsubscribe(self, conn: Connection, channel: str) -> None:
        async with self._lock:
            conn.channels.discard(channel)
            peers = self.channel_peers.get(channel)
            if peers:
                peers.discard(conn.id)
                if not peers:
                    self.channel_peers.pop(channel, None)
        await self._presence_remove(channel, conn.user_id)

    # ── delivery ─────────────────────────────────────────────────
    async def broadcast(self, channel: str, message: dict[str, Any]) -> None:
        """Publish to the Redis bus — delivered to all instances + local peers."""
        payload = json.dumps({"channel": channel, "message": message})
        await redis_client.publish(REDIS_BUS, payload)

    async def send_to(self, conn: Connection, message: dict[str, Any]) -> None:
        try:
            await conn.websocket.send_json(message)
        except Exception:
            await self.disconnect(conn)

    def peer_count(self, channel: str) -> int:
        return len(self.channel_peers.get(channel, ()))

    # ── presence (Redis sets) ────────────────────────────────────
    async def _presence_add(self, channel: str, user_id: str) -> None:
        await redis_client.sadd(PRESENCE_PREFIX + channel, user_id)

    async def _presence_remove(self, channel: str, user_id: str) -> None:
        # Only remove if no other local connection for this user is subscribed.
        still_local = any(
            user_id == c.user_id and channel in c.channels
            for c in self.connections.values()
        )
        if not still_local:
            await redis_client.srem(PRESENCE_PREFIX + channel, user_id)

    async def presence_members(self, channel: str) -> list[str]:
        members = await redis_client.smembers(PRESENCE_PREFIX + channel)
        return sorted(members)

    async def announce_presence(self, channel: str) -> None:
        members = await self.presence_members(channel)
        await self.broadcast(
            channel,
            {
                "type": "presence",
                "channel": channel,
                "data": {"online_count": len(members), "user_ids": members},
            },
        )

    # ── Redis listener (one per process) ─────────────────────────
    async def _redis_listener(self) -> None:
        await asyncio.sleep(0)  # let the event loop register the task
        while True:
            try:
                pubsub = redis_client.pubsub()
                await pubsub.subscribe(REDIS_BUS)
                async for raw in pubsub.listen():
                    if raw["type"] != "message":
                        continue
                    envelope = json.loads(raw["data"])
                    channel = envelope["channel"]
                    message = envelope["message"]
                    await self._fanout(channel, message)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Redis listener crashed, restarting in 1s")
                await asyncio.sleep(1.0)

    async def _fanout(self, channel: str, message: dict[str, Any]) -> None:
        for conn_id in list(self.channel_peers.get(channel, ())):
            conn = self.connections.get(conn_id)
            if conn is not None:
                await self.send_to(conn, message)


manager = ConnectionManager()
