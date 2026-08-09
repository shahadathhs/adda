from pydantic import BaseModel


class LiveStreamOut(BaseModel):
    community_id: str
    name: str
    viewers: int
