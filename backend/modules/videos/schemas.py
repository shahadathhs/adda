import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Visibility = Literal["public", "unlisted", "private"]


class VideoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    visibility: Visibility = "public"
    filename: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0)


class VideoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    visibility: Visibility | None = None


class VideoOut(BaseModel):
    id: uuid.UUID
    community_id: uuid.UUID
    community_name: str
    community_slug: str
    title: str
    description: str | None
    status: str
    visibility: str
    size_bytes: int
    received_bytes: int
    duration_seconds: float | None
    width: int | None
    height: int | None
    error: str | None
    created_at: datetime
    poster_url: str | None
    file_url: str | None


class UploadStarted(BaseModel):
    video: VideoOut
    chunk_size: int
    max_chunk_size: int


class UploadProgress(BaseModel):
    received_bytes: int
