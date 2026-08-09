"""OTP generation + verification via Redis (for 2FA and passwordless login)."""

import random

from core.redis_client import redis_client

OTP_TTL = 300  # 5 minutes


async def generate_otp(key: str) -> str:
    """Generate a 6-digit code, store in Redis with TTL, return the code."""
    code = f"{random.randint(0, 999999):06d}"
    await redis_client.set(key, code, ex=OTP_TTL)
    return code


async def verify_otp(key: str, code: str) -> bool:
    """Verify a code against Redis. Single-use (deleted after verify)."""
    stored = await redis_client.get(key)
    if stored is None:
        return False
    await redis_client.delete(key)
    return stored == code
