import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class MessageMention(Base):
    """An account @mentioned in a message."""

    __tablename__ = "message_mentions"
    __table_args__ = (UniqueConstraint("message_id", "user_id", name="uq_mention_message_user"),)

    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
