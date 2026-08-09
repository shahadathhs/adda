from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.user import User
from modules.streaming.service.playback import list_live_community_ids


async def compute_stats(db: AsyncSession) -> tuple[int, int, int]:
    """Platform dashboard counts: (users, communities, live_streams)."""
    users = int((await db.execute(select(func.count()).select_from(User))).scalar() or 0)
    communities = int((await db.execute(select(func.count()).select_from(Community))).scalar() or 0)
    live = len(await list_live_community_ids())
    return users, communities, live
