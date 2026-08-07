"""Admin platform-stats route (gated by `require_admin` at the router level)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security.guards import require_admin
from modules.stats.schemas import StatsOut
from modules.stats.service import stats as stats_service

router = APIRouter(
    prefix="/admin",
    tags=["admin-stats"],
    dependencies=[Depends(require_admin)],
)


@router.get("/stats", response_model=StatsOut)
async def stats(db: AsyncSession = Depends(get_db)) -> StatsOut:
    users, communities, live = await stats_service.compute_stats(db)
    return StatsOut(users=users, communities=communities, live=live)
