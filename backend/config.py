from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "adda"
    debug: bool = False
    api_prefix: str = "/api"

    # Database
    database_url: str = "postgresql+asyncpg://adda:adda@localhost:5432/adda"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Streaming (mediamtx)
    mtx_api_url: str = "http://localhost:9997"
    mtx_api_user: str = "admin"
    mtx_api_pass: str = "admin"
    hls_base_url: str = "http://localhost:8888"
    webrtc_base_url: str = "http://localhost:8889"
    rtmp_base_url: str = "rtmp://localhost:1935"

    # CORS origins (comma-separated)
    cors_origins: str = "http://localhost:5173"

    # Bootstrap accounts — seeded idempotently on startup (only created if they
    # don't already exist). Override all of these in prod with strong values.
    superadmin_username: str = "admin"
    superadmin_email: str = "admin@example.com"
    superadmin_password: str = "admin12345"
    seed_test_users: bool = True
    seed_test_password: str = "password123"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
