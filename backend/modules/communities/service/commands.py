import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.community import Community
from models.video import Video
from modules.chat.service.emotes import list_emotes
from modules.communities.schemas import CommunityCreate, CommunityUpdate


async def create_community(
    db: AsyncSession, data: CommunityCreate, owner_id: uuid.UUID
) -> Community:
    community = Community(
        name=data.name,
        slug=data.slug,
        description=data.description,
        banner_url=data.banner_url,
        avatar_url=data.avatar_url,
        is_private=data.is_private,
        owner_id=owner_id,
    )
    db.add(community)
    await db.commit()
    await db.refresh(community)
    return community


async def update_community(
    db: AsyncSession, community: Community, data: CommunityUpdate
) -> Community:
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "links":
            value = value or []
        setattr(community, field, value)
    await db.commit()
    await db.refresh(community)
    return community


async def delete_community(db: AsyncSession, community: Community) -> None:
    """Delete the channel and everything stored for it (recordings, emotes, banner)."""
    from modules.chat.service.emotes import emotes_dir
    from modules.recordings.service.files import purge_community_files
    from modules.videos.service.storage import remove_video_files

    emote_files = [e.file_key for e in await list_emotes(db, community.id)]
    video_ids = (
        (await db.execute(select(Video.id).where(Video.community_id == community.id)))
        .scalars()
        .all()
    )
    await db.delete(community)
    await db.commit()
    purge_community_files(str(community.id))
    for video_id in video_ids:
        remove_video_files(video_id)
    for key in emote_files:
        (emotes_dir() / key).unlink(missing_ok=True)
