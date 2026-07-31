from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: EmailStr
    display_name: str
    avatar_url: str | None = None
    bio: str | None = None
    is_admin: bool = False

    @field_validator("id", mode="before")
    @classmethod
    def _coerce_uuid(cls, value: object) -> str:
        return str(value)
