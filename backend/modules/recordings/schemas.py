from datetime import datetime

from pydantic import BaseModel


class RecordingOut(BaseModel):
    community_id: str | None
    name: str
    path: str  # relative to the recordings dir; used as the delete handle
    size_bytes: int
    created_at: datetime
