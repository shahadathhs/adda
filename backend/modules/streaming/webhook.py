"""mediamtx publish-auth webhook.

mediamtx is configured with `authMethod: http`, so it POSTs here on every
connection action that isn't excluded. Reads (HLS/playback) and the control
API are excluded in mediamtx.yml, so this only needs to gate `publish`.

A publish is allowed only when:
  * the path is `community/<uuid>`, and
  * the request carries `?key=<stream_key>` matching that community's key.
"""
import uuid
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.community import Community

router = APIRouter(prefix="/streams", tags=["streams"])

_COMMUNITY_PREFIX = "community/"


@router.post("/auth")
async def mediamtx_auth(
    request: Request, db: AsyncSession = Depends(get_db)
) -> Response:
    try:
        body = await request.json()
    except Exception:
        body = {}

    # Anything that isn't a publish is allowed (reads/API are excluded anyway).
    if body.get("action") != "publish":
        return Response(status_code=status.HTTP_200_OK)

    raw_path = (body.get("path") or "").split("?", 1)[0]
    key = parse_qs(body.get("query") or "").get("key", [""])[0]

    if not raw_path.startswith(_COMMUNITY_PREFIX) or not key:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    try:
        community_id = uuid.UUID(raw_path[len(_COMMUNITY_PREFIX):])
    except ValueError:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    community = (
        await db.execute(select(Community).where(Community.id == community_id))
    ).scalar_one_or_none()

    if community is None or community.stream_key != key:
        return Response(status_code=status.HTTP_403_FORBIDDEN)

    return Response(status_code=status.HTTP_200_OK)
