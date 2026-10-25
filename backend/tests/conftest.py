"""Test harness: a real (embedded) Postgres, an in-memory Redis, the real app.

`uv run pytest` needs no Docker and no services. Postgres comes from the
`pgserver` wheel and is migrated with the project's own Alembic revisions, so
the migrations are exercised too. Redis is `fakeredis` (shared by every client,
so pub/sub fan-out works). The environment is configured *before* the app is
imported because the engine and settings are module-level singletons.
"""

import atexit
import os
import shutil
import tempfile
from collections.abc import AsyncIterator

import fakeredis
import pgserver
import pytest
import redis.asyncio as aioredis

# ── environment (must precede any `core.*` import) ────────────────────
_PG_DIR = tempfile.mkdtemp(prefix="adda-test-pg-")
_DATA_DIR = tempfile.mkdtemp(prefix="adda-test-data-")
_pg = pgserver.get_server(_PG_DIR, cleanup_mode="delete")
atexit.register(shutil.rmtree, _DATA_DIR, True)

os.environ.update(
    DATABASE_URL=_pg.get_uri().replace("postgresql://", "postgresql+asyncpg://", 1),
    JWT_SECRET="test-secret-not-for-production-0123456789",
    DEBUG="false",
    SEED_TEST_USERS="false",
    SMTP_HOST="",
    RECORDINGS_DIR=os.path.join(_DATA_DIR, "recordings"),
    THUMBS_DIR=os.path.join(_DATA_DIR, "thumbs"),
    UPLOADS_DIR=os.path.join(_DATA_DIR, "uploads"),
    # Nothing listens here; mediamtx calls fail fast and are stubbed in tests.
    MTX_API_URL="http://127.0.0.1:9",
)

# One fake Redis server shared by every client the app creates.
_fake_redis_server = fakeredis.FakeServer()


def _fake_from_url(url: str, **kwargs) -> aioredis.Redis:
    return fakeredis.FakeAsyncRedis(server=_fake_redis_server, decode_responses=True)


aioredis.from_url = _fake_from_url  # type: ignore[assignment]


@pytest.fixture(scope="session")
def pg_server():
    """The embedded Postgres server (for tests that need their own database)."""
    return _pg


# ── database ──────────────────────────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def _migrated_database() -> None:
    """Apply every Alembic revision to the empty test database, once."""
    from alembic.config import Config

    from alembic import command

    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    command.upgrade(cfg, "head")


@pytest.fixture(autouse=True)
async def _clean_state(_migrated_database: None) -> AsyncIterator[None]:
    """Empty every table and Redis before each test."""
    from sqlalchemy import text

    from core.database import engine
    from core.redis_client import redis_client

    async with engine.begin() as conn:
        tables = (
            await conn.execute(
                text(
                    "select tablename from pg_tables "
                    "where schemaname = 'public' and tablename <> 'alembic_version'"
                )
            )
        ).scalars()
        names = ", ".join(f'"{t}"' for t in tables)
        if names:
            await conn.execute(text(f"truncate table {names} restart identity cascade"))
    await redis_client.flushall()
    yield


# ── app + helpers ─────────────────────────────────────────────────────
@pytest.fixture
async def client() -> AsyncIterator["TestClient"]:
    import httpx

    from main import app

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as http:
        yield TestClient(http)


class TestClient:
    """Thin wrapper that keeps a bearer token and prefixes the API path."""

    __test__ = False

    def __init__(self, http) -> None:
        self.http = http

    async def request(self, method: str, path: str, token: str | None = None, **kwargs):
        headers = dict(kwargs.pop("headers", {}))
        if token:
            headers["authorization"] = f"Bearer {token}"
        url = path if path.startswith("/health") else f"/api{path}"
        return await self.http.request(method, url, headers=headers, **kwargs)

    async def get(self, path: str, token: str | None = None, **kw):
        return await self.request("GET", path, token, **kw)

    async def post(self, path: str, token: str | None = None, **kw):
        return await self.request("POST", path, token, **kw)

    async def patch(self, path: str, token: str | None = None, **kw):
        return await self.request("PATCH", path, token, **kw)

    async def delete(self, path: str, token: str | None = None, **kw):
        return await self.request("DELETE", path, token, **kw)

    async def put(self, path: str, token: str | None = None, **kw):
        return await self.request("PUT", path, token, **kw)


class Account:
    """A registered user with its tokens."""

    def __init__(self, data: dict, password: str) -> None:
        self.id: str = data["user"]["id"]
        self.username: str = data["user"]["username"]
        self.email: str = data["user"]["email"]
        self.access: str = data["access_token"]
        self.refresh: str = data["refresh_token"]
        self.password = password


@pytest.fixture
def make_user(client: TestClient):
    counter = {"n": 0}

    async def _make(username: str | None = None, password: str = "correct-horse-1") -> Account:
        counter["n"] += 1
        name = username or f"user{counter['n']}"
        resp = await client.post(
            "/auth/register",
            json={
                "username": name,
                "email": f"{name}@example.com",
                "display_name": name.title(),
                "password": password,
            },
        )
        assert resp.status_code == 201, resp.text
        return Account(resp.json(), password)

    return _make


@pytest.fixture
def make_admin(client: TestClient, make_user):
    async def _make(username: str = "root") -> Account:
        from sqlalchemy import update

        from core.database import async_session_factory
        from models.user import SystemRole, User

        acct = await make_user(username)
        async with async_session_factory() as db:
            await db.execute(
                update(User).where(User.username == username).values(system_role=SystemRole.ADMIN)
            )
            await db.commit()
        return acct

    return _make


@pytest.fixture
def mediamtx(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Stub the mediamtx control calls; returns the community ids that were kicked."""
    kicked: list[str] = []

    async def fake_kick(community_id: str) -> None:
        kicked.append(community_id)

    for target in (
        "modules.communities.router.kick_publisher",
        "modules.streaming.router.kick_publisher",
    ):
        monkeypatch.setattr(target, fake_kick, raising=False)
    return kicked


@pytest.fixture
async def ws_url() -> AsyncIterator[str]:
    """Run the real app on a local port, in this event loop, for WebSocket tests."""
    import asyncio
    import socket

    import uvicorn

    from main import app

    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]

    server = uvicorn.Server(
        uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning", lifespan="off")
    )
    task = asyncio.create_task(server.serve())
    while not server.started:
        await asyncio.sleep(0.01)
    try:
        yield f"ws://127.0.0.1:{port}"
    finally:
        server.should_exit = True
        await task
