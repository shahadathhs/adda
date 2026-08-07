from pydantic import BaseModel


class StatsOut(BaseModel):
    users: int
    communities: int
    live: int
