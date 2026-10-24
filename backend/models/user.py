from sqlalchemy import Boolean, String, text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class SystemRole:
    """Platform-level roles (channel roles live on Community / ChannelModerator)."""

    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"

    ALL = (USER, ADMIN, SUPERADMIN)
    STAFF = (ADMIN, SUPERADMIN)  # anyone who can access the admin dashboard


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Platform-level role: "user", "admin", or "superadmin".
    # Channel roles (owner, moderator) are separate: see Community.owner_id and
    # ChannelModerator.
    system_role: Mapped[str] = mapped_column(
        String(20), default=SystemRole.USER, server_default=text("'user'")
    )
    # Suspended accounts cannot log in (admin moderation lever).
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))

    def to_public_dict(self) -> dict[str, str | bool | None]:
        return {
            "id": str(self.id),
            "username": self.username,
            "display_name": self.display_name,
            "avatar_url": self.avatar_url,
            "bio": self.bio,
            "system_role": self.system_role,
        }
