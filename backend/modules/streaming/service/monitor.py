"""Background stream monitor.

Watches mediamtx for live/offline transitions and publishes `stream_status`
events on each community's realtime channel, so subscribed clients react
instantly instead of waiting for the next REST poll. Stream start times are
recorded in Redis and used by the health endpoint for uptime.
"""

import asyncio
import logging
import time
from datetime import UTC, datetime

from core.redis_client import redis_client
from modules.realtime.manager import manager
from modules.realtime.protocol import outgoing
from modules.streaming.service.mediamtx import viewer_count
from modules.streaming.service.playback import list_live_community_ids

log = logging.getLogger("adda.stream_monitor")

# Redis hash: community_id -> unix epoch of stream start.
STARTED_KEY = "adda:stream:started"
POLL_SECONDS = 5

_task: asyncio.Task[None] | None = None


def iso(epoch: float) -> str:
    """Unix epoch → ISO 8601 (UTC)."""
    return datetime.fromtimestamp(epoch, tz=UTC).isoformat()


async def started_at(community_id: str) -> float | None:
    """Unix epoch of the current stream's start, or None if not tracked."""
    val = await redis_client.hget(STARTED_KEY, community_id)
    return float(val) if val is not None else None


async def _announce(community_id: str, is_live: bool, started: float | None) -> None:
    viewers = await viewer_count(community_id) if is_live else 0
    await manager.broadcast(
        f"community:{community_id}",
        outgoing(
            "stream_status",
            channel=f"community:{community_id}",
            data={
                "community_id": community_id,
                "is_live": is_live,
                "viewers": viewers,
                "started_at": iso(started) if started is not None else None,
            },
        ),
    )


async def _tick() -> None:
    current = set(await list_live_community_ids())
    previous = {str(key) for key in await redis_client.hkeys(STARTED_KEY)}

    for community_id in current - previous:
        started = time.time()
        await redis_client.hset(STARTED_KEY, community_id, started)
        log.info("community %s went live", community_id)
        await _announce(community_id, is_live=True, started=started)

    for community_id in previous - current:
        await redis_client.hdel(STARTED_KEY, community_id)
        log.info("community %s went offline", community_id)
        await _announce(community_id, is_live=False, started=None)


async def _run() -> None:
    while True:
        try:
            await _tick()
        except Exception:
            log.exception("stream monitor tick failed")
        await asyncio.sleep(POLL_SECONDS)


def start() -> None:
    """Spawn the monitor loop (idempotent; one task per process)."""
    global _task
    if _task is None or _task.done():
        _task = asyncio.create_task(_run())
        log.info("stream monitor started (poll=%ss)", POLL_SECONDS)
