"""Admin-only endpoints (gated by `require_admin`).

Stats + management for users, communities, live streams, and recordings.
All routes require an admin token; non-admins get 403.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.deps import require_admin
from auth.password import hash_password
from communities.service import (
    count_members,
    delete_community,
    get_community,
)
from config import settings
from database import get_db
from members.service import (
    get_membership,
    leave_community,
    list_members as list_members_service,
)
from models.community import Community
from models.membership import CommunityRole
from models.user import User
from recordings.router import resolve_recording, scan_recordings
from schemas.admin import (
    AdminCommunityOut,
    AdminCommunityUpdate,
    AdminPasswordReset,
    AdminUserOut,
    AdminUserUpdate,
    LiveStreamOut,
    MemberOut,
    RecordingOut,
    StatsOut,
    StreamCredentialsOut,
)
from streaming.service import (
    is_community_live,
    kick_publisher,
    list_live_community_ids,
    viewer_count,
)

router = APIRouter(prefix="/admin", tags=["admin"])


def _not_found(detail: str) -> None:
    raise HTTPException(status_code=404, detail=detail)


async def _community_out(db: AsyncSession, c: Community) -> AdminCommunityOut:
    return AdminCommunityOut(
        id=c.id,
        name=c.name,
        slug=c.slug,
        owner_id=c.owner_id,
        member_count=await count_members(db, c.id),
        is_live=await is_community_live(str(c.id)),
        is_suspended=c.is_suspended,
        created_at=c.created_at,
    )


def _stream_creds(c: Community) -> StreamCredentialsOut:
    url = f"{settings.rtmp_base_url}/community/{c.id}?key={c.stream_key}"
    return StreamCredentialsOut(stream_url=url, stream_key=c.stream_key)


# ── Stats ─────────────────────────────────────────────────────────────
@router.get("/stats", response_model=StatsOut)
async def stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> StatsOut:
    from sqlalchemy import func

    users = int((await db.execute(select(func.count()).select_from(User))).scalar() or 0)
    communities = int(
        (await db.execute(select(func.count()).select_from(Community))).scalar() or 0
    )
    return StatsOut(users=users, communities=communities, live=len(await list_live_community_ids()))


# ── Users ─────────────────────────────────────────────────────────────
@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    if q:
        pat = f"%{q}%"
        stmt = stmt.where(or_(User.username.ilike(pat), User.email.ilike(pat)))
    return list((await db.execute(stmt)).scalars().all())


@router.patch("/users/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: uuid.UUID,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        _not_found("User not found")
    # Guard against locking yourself out.
    if user.id == current_user.id and (
        (data.is_admin is False) or (data.is_active is False)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can't revoke your own admin role or suspend yourself",
        )
    if data.is_admin is not None:
        user.is_admin = data.is_admin
    if data.is_active is not None:
        user.is_active = data.is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    user_id: uuid.UUID,
    data: AdminPasswordReset,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    user = await db.get(User, user_id)
    if user is None:
        _not_found("User not found")
    user.password_hash = hash_password(data.password)
    await db.commit()


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> None:
    user = await db.get(User, user_id)
    if user is None:
        _not_found("User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can't delete your own account",
        )
    await db.delete(user)
    await db.commit()


# ── Communities ───────────────────────────────────────────────────────
@router.get("/communities", response_model=list[AdminCommunityOut])
async def list_communities(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[AdminCommunityOut]:
    result = await db.execute(select(Community).order_by(Community.created_at.desc()))
    return [await _community_out(db, c) for c in result.scalars().all()]


@router.patch("/communities/{community_id}", response_model=AdminCommunityOut)
async def update_community(
    community_id: uuid.UUID,
    data: AdminCommunityUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminCommunityOut:
    c = await get_community(db, community_id)
    if c is None:
        _not_found("Community not found")
    for field in ("name", "description", "is_private", "is_suspended"):
        value = getattr(data, field)
        if value is not None:
            setattr(c, field, value)
    await db.commit()
    await db.refresh(c)
    return await _community_out(db, c)


@router.get("/communities/{community_id}/members", response_model=list[MemberOut])
async def list_members(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[MemberOut]:
    out: list[MemberOut] = []
    for m in await list_members_service(db, community_id):
        await db.refresh(m, attribute_names=["user"])
        if m.user is not None:
            out.append(
                MemberOut(
                    user_id=m.user_id,
                    username=m.user.username,
                    display_name=m.user.display_name,
                    role=m.role.value,
                    joined_at=m.created_at,
                )
            )
    return out


@router.delete(
    "/communities/{community_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def kick_member(
    community_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    membership = await get_membership(db, community_id, user_id)
    if membership is None:
        _not_found("Member not found")
    if membership.role == CommunityRole.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can't remove the owner; transfer ownership or delete the community",
        )
    await leave_community(db, membership)


@router.get(
    "/communities/{community_id}/stream-key", response_model=StreamCredentialsOut
)
async def view_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> StreamCredentialsOut:
    c = await get_community(db, community_id)
    if c is None:
        _not_found("Community not found")
    return _stream_creds(c)


@router.post(
    "/communities/{community_id}/stream-key/rotate",
    response_model=StreamCredentialsOut,
)
async def rotate_stream_key(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> StreamCredentialsOut:
    from communities.service import regenerate_stream_key

    c = await get_community(db, community_id)
    if c is None:
        _not_found("Community not found")
    c = await regenerate_stream_key(db, c)
    await kick_publisher(str(c.id))  # force the old key to stop working now
    return _stream_creds(c)


@router.delete(
    "/communities/{community_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_community_endpoint(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    c = await get_community(db, community_id)
    if c is None:
        _not_found("Community not found")
    await delete_community(db, c)


# ── Live streams ──────────────────────────────────────────────────────
@router.get("/live", response_model=list[LiveStreamOut])
async def list_live(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[LiveStreamOut]:
    out: list[LiveStreamOut] = []
    for cid in await list_live_community_ids():
        c = await get_community(db, uuid.UUID(cid))
        if c is None:
            continue
        out.append(
            LiveStreamOut(
                community_id=cid, name=c.name, viewers=await viewer_count(cid)
            )
        )
    return out


@router.post(
    "/communities/{community_id}/stop", status_code=status.HTTP_204_NO_CONTENT
)
async def stop_stream(
    community_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    c = await get_community(db, community_id)
    if c is None:
        _not_found("Community not found")
    await kick_publisher(str(community_id))


# ── Recordings ────────────────────────────────────────────────────────
@router.get("/recordings", response_model=list[RecordingOut])
async def list_recordings(
    community_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[RecordingOut]:
    if community_id is not None:
        recs = scan_recordings(str(community_id))
    else:
        ids = {
            str(i) for i in (await db.execute(select(Community.id))).scalars().all()
        }
        recs = scan_recordings(None, ids)
    return [RecordingOut(**r) for r in recs]


@router.delete("/recordings", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recording(
    path: str,
    _: User = Depends(require_admin),
) -> None:
    import os

    full = resolve_recording(path)
    if full is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path")
    os.remove(full)
