"""Chat limits kept in Redis: rate, slow mode and duplicate suppression."""

import hashlib
import uuid

from core.redis_client import redis_client

RATE_BURST = 5  # messages allowed in one window
RATE_WINDOW_SECONDS = 5  # i.e. a burst of 5, then about one a second
DUPLICATE_SECONDS = 10


async def take_rate_token(community_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    """Count a message in the current window. False when the account is over the limit."""
    key = f"adda:rate:{community_id}:{user_id}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, RATE_WINDOW_SECONDS)
    return count <= RATE_BURST


async def slow_mode_remaining(community_id: uuid.UUID, user_id: uuid.UUID) -> int:
    """Seconds until this account may speak again under slow mode (0 when free to)."""
    ttl = await redis_client.ttl(f"adda:slow:{community_id}:{user_id}")
    return max(int(ttl), 0)


async def start_slow_mode(community_id: uuid.UUID, user_id: uuid.UUID, seconds: int) -> None:
    if seconds > 0:
        await redis_client.set(f"adda:slow:{community_id}:{user_id}", "1", ex=seconds)


async def is_duplicate(community_id: uuid.UUID, user_id: uuid.UUID, text: str) -> bool:
    """True if the same account sent this exact text in this channel in the last few seconds."""
    digest = hashlib.sha1(text.encode()).hexdigest()[:16]
    key = f"adda:dup:{community_id}:{user_id}:{digest}"
    return not await redis_client.set(key, "1", nx=True, ex=DUPLICATE_SECONDS)
