import uuid

from sqlalchemy import BigInteger, Float, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class VideoStatus:
    UPLOADING = "uploading"  # parts are still arriving
    PROCESSING = "processing"  # all bytes received; probing and preparing for playback
    READY = "ready"
    FAILED = "failed"


class VideoVisibility:
    PUBLIC = "public"  # listed in the channel page, the directory and search
    UNLISTED = "unlisted"  # anyone with the link can watch; not listed
    PRIVATE = "private"  # only the channel owner

    ALL = (PUBLIC, UNLISTED, PRIVATE)


class Video(Base):
    """A video the channel owner uploaded (as opposed to a recording of a live broadcast)."""

    __tablename__ = "videos"

    community_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("communities.id", ondelete="CASCADE"), index=True
    )
    uploader_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    status: Mapped[str] = mapped_column(
        String(12), default=VideoStatus.UPLOADING, server_default=text("'uploading'"), index=True
    )
    visibility: Mapped[str] = mapped_column(
        String(10), default=VideoVisibility.PUBLIC, server_default=text("'public'")
    )
    # The file the owner picked, and how much of it has arrived.
    original_name: Mapped[str] = mapped_column(String(255))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    received_bytes: Mapped[int] = mapped_column(BigInteger, default=0, server_default=text("0"))
    # Filled in once the file has been inspected.
    file_name: Mapped[str | None] = mapped_column(
        String(32), nullable=True
    )  # video.mp4 / video.webm
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    video_codec: Mapped[str | None] = mapped_column(String(24), nullable=True)
    audio_codec: Mapped[str | None] = mapped_column(String(24), nullable=True)
    error: Mapped[str | None] = mapped_column(String(300), nullable=True)
