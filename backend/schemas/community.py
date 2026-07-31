from pydantic import BaseModel, ConfigDict, Field


class CommunityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: str | None = Field(default=None, max_length=1000)
    banner_url: str | None = None
    avatar_url: str | None = None
    is_private: bool = False


class CommunityUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    banner_url: str | None = None
    avatar_url: str | None = None
    is_private: bool | None = None


class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    slug: str
    description: str | None = None
    banner_url: str | None = None
    avatar_url: str | None = None
    is_private: bool
    owner_id: str
    member_count: int = 0
    is_live: bool = False
