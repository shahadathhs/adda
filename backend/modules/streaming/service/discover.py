"""Turn communities into public discovery cards, with live state, viewers and followers."""

import asyncio
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from modules.communities.service.follows import count_followers_map
from modules.streaming.schemas import DiscoverItem
from modules.streaming.service import monitor
from modules.streaming.service.mediamtx import viewer_count
from modules.streaming.service.playback import hls_url, list_live_community_ids, webrtc_url


async def build_discover_items(
    db: AsyncSession, communities: Sequence[Community]
) -> list[DiscoverItem]:
    """One card per community, in the order given."""
    live_ids = set(await list_live_community_ids())
    viewers_map: dict[str, int] = {}
    started_map: dict[str, str | None] = {}
    if live_ids:
        ordered = list(live_ids)
        counts = await asyncio.gather(*(viewer_count(cid) for cid in ordered))
        starts = await asyncio.gather(*(monitor.started_at(cid) for cid in ordered))
        viewers_map = dict(zip(ordered, counts, strict=True))
        started_map = {
            cid: monitor.iso(s) if s is not None else None
            for cid, s in zip(ordered, starts, strict=True)
        }
    followers_map = await count_followers_map(db, [c.id for c in communities])

    return [
        DiscoverItem(
            community_id=str(c.id),
            name=c.name,
            slug=c.slug,
            description=c.description,
            avatar_url=c.avatar_url,
            banner_url=c.banner_url,
            stream_title=c.stream_title,
            is_live=str(c.id) in live_ids,
            viewers=viewers_map.get(str(c.id), 0),
            started_at=started_map.get(str(c.id)),
            follower_count=followers_map.get(c.id, 0),
            hls_url=hls_url(str(c.id)) if str(c.id) in live_ids else None,
            webrtc_url=webrtc_url(str(c.id)) if str(c.id) in live_ids else None,
        )
        for c in communities
    ]
