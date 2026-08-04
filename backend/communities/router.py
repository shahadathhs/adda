import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import get_current_user
from communities.service import (
    count_members,
    create_community,
    delete_community,
    get_community,
    get_community_by_slug,
    list_communities,
    regenerate_stream_key,
    update_community,
)
from config import settings
from database import get_db
from models.community import Community
from models.user import User
from schemas.community import (
    CommunityCreate,
    CommunityOut,
    CommunityUpdate,
    StreamCredentialsOut,
)
from streaming.service import is_community_live, kick_publisher

router = APIRouter(prefix="/communities", tags=["communities"])


async def _serialize(db: AsyncSession, community: Community) -> CommunityOut:
    member_count = await count_members(db, community.id)
    live = await is_community_live(str(community.id))
    data = community.to_public_dict(member_count=member_count, is_live=live)
    return CommunityOut.model_validate(data, from_attributes=True)


def _stream_credentials(community: Community) -> StreamCredentialsOut:
    # Key travels in the RTMP URL (?key=…) so it never appears in the HLS path.
    url = f"{settings.rtmp_base_url}/community/{community.id}?key={community.stream_key}"
    return StreamCredentialsOut(stream_url=url, stream_key=community.stream_key)


async def _get_owned_community(
    community_id: uuid.UUID, current_user: User, db: AsyncSession
) -> Community:
    community = await get_community(db, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    if community.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Only the owner can view or rotate the stream key"
        )
    return community


@router.get("", response_model=list[CommunityOut])
@router.get("/", response_model=list[CommunityOut], include_in_schema=False)
async def list_all(
    limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)
):
    communities = await list_communities(db, limit=limit, offset=offset)
    return [await _serialize(db, c) for c in communities]


@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
async def create(
    data: CommunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if await get_community_by_slug(db, data.slug):
        raise HTTPException(status_code=409, detail="Slug already taken")
    community = await create_community(db, data, current_user.id)
    return await _serialize(db, community)


@router.get("/{community_id}", response_model=CommunityOut)
async def get_one(community_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    community = await get_community(db, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    return await _serialize(db, community)


@router.patch("/{community_id}", response_model=CommunityOut)
async def update(
    community_id: uuid.UUID,
    data: CommunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    if community.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only the owner can update this community")
    community = await update_community(db, community, data)
    return await _serialize(db, community)


@router.delete("/{community_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await get_community(db, community_id)
    if community is None:
        raise HTTPException(status_code=404, detail="Community not found")
    if community.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only the owner can delete this community")
    await delete_community(db, community)


@router.get("/{community_id}/stream-key", response_model=StreamCredentialsOut)
async def get_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await _get_owned_community(community_id, current_user, db)
    return _stream_credentials(community)


@router.post(
    "/{community_id}/stream-key/rotate", response_model=StreamCredentialsOut
)
async def rotate_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = await _get_owned_community(community_id, current_user, db)
    community = await regenerate_stream_key(db, community)
    # Drop the current OBS connection so the new key takes effect now;
    # reconnecting requires the rotated key (the old one is dead in the DB).
    await kick_publisher(str(community.id))
    return _stream_credentials(community)
