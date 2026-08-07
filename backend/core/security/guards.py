from fastapi import Depends

from core.exceptions import ForbiddenException
from core.security.deps import get_current_user
from models.user import User


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for admin-only endpoints; returns the admin user.

    Apply at the router level to protect every route without repeating
    the dependency on each handler:

        APIRouter(prefix="/admin/...", dependencies=[Depends(require_admin)])
    """
    if not current_user.is_admin:
        raise ForbiddenException("Admins only")
    return current_user
