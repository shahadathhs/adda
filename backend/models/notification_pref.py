import uuid

from sqlalchemy import ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class NotificationPref(Base):
    """Bell and email switches. `community_id` null is the account-wide default."""

    __tablename__ = "notification_prefs"
    __table_args__ = (
        Index(
            "uq_notification_pref_user_community",
            "user_id",
            "community_id",
            unique=True,
            postgresql_where=text("community_id IS NOT NULL"),
        ),
        Index(
            "uq_notification_pref_user_default",
            "user_id",
            unique=True,
            postgresql_where=text("community_id IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    community_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), nullable=True
    )
    bell: Mapped[bool] = mapped_column(default=True, server_default=text("true"))
    email: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
