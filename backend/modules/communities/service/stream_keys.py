from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.community import Community, new_stream_key
from modules.communities.schemas import StreamCredentialsOut


def build_stream_credentials(community: Community) -> StreamCredentialsOut:
    """RTMP URL (with key) + raw key for OBS setup.

    The key travels in the RTMP URL (?key=...) so it never appears in the
    public HLS path, which stays `community/<id>`.
    """
    url = f"{settings.rtmp_base_url}/community/{community.id}?key={community.stream_key}"
    return StreamCredentialsOut(stream_url=url, stream_key=community.stream_key)


async def regenerate_stream_key(db: AsyncSession, community: Community) -> Community:
    """Rotate the key a streamer uses to authenticate OBS publishing."""
    community.stream_key = new_stream_key()
    await db.commit()
    await db.refresh(community)
    return community
