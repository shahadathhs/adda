"""Admin user-management routes (gated by `require_admin` at the router level)."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import BadRequestException, NotFoundException
from core.security.deps import get_current_user
from core.security.guards import require_admin
from models.user import User
from modules.users.schemas import AdminPasswordReset, AdminUserOut, AdminUserUpdate
from modules.users.service import admin as admin_service
from modules.users.service import queries

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=list[AdminUserOut])
@router.get("/", response_model=list[AdminUserOut], include_in_schema=False)
async def list_users(q: str | None = None, db: AsyncSession = Depends(get_db)) -> list[User]:
    return await queries.list_users(db, q)


@router.patch("/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: uuid.UUID,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    user = await queries.get_user(db, user_id)
    if user is None:
        raise NotFoundException("User not found")
    # Guard against locking yourself out.
    if user.id == current_user.id and ((data.is_admin is False) or (data.is_active is False)):
        raise BadRequestException("You can't revoke your own admin role or suspend yourself")
    return await admin_service.update_user_fields(db, user, data)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    user_id: uuid.UUID,
    data: AdminPasswordReset,
    db: AsyncSession = Depends(get_db),
) -> None:
    user = await queries.get_user(db, user_id)
    if user is None:
        raise NotFoundException("User not found")
    await admin_service.set_password(db, user, data.password)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    user = await queries.get_user(db, user_id)
    if user is None:
        raise NotFoundException("User not found")
    if user.id == current_user.id:
        raise BadRequestException("You can't delete your own account")
    await admin_service.delete_user(db, user)
