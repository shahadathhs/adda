from fastapi import Depends

from core.exceptions import ForbiddenException
from core.security.deps import get_current_user
from models.user import SystemRole, User


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for staff-only endpoints (admin + superadmin)."""
    if current_user.system_role not in SystemRole.STAFF:
        raise ForbiddenException("Admins only")
    return current_user


async def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for superadmin-only endpoints (promote/demote admins)."""
    if current_user.system_role != SystemRole.SUPERADMIN:
        raise ForbiddenException("Superadmins only")
    return current_user
