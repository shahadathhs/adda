from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

if TYPE_CHECKING:
    from models.membership import Membership


class Community(Base):
    __tablename__ = "communities"

    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_private: Mapped[bool] = mapped_column(default=False)

    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    members: Mapped[list["Membership"]] = relationship(
        "Membership",
        back_populates="community",
        cascade="all, delete-orphan",
    )

    def to_public_dict(self, member_count: int = 0, is_live: bool = False) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "banner_url": self.banner_url,
            "avatar_url": self.avatar_url,
            "is_private": self.is_private,
            "owner_id": str(self.owner_id),
            "member_count": member_count,
            "is_live": is_live,
        }
