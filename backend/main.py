import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from modules.auth.router import router as auth_router
from modules.chat.router import router as chat_router
from modules.communities.admin_router import router as communities_admin_router
from modules.communities.router import router as communities_router
from modules.realtime.gateway import router as ws_router
from modules.recordings.router import admin_router as recordings_admin_router
from modules.recordings.router import router as recordings_router
from modules.stats.router import router as stats_router
from modules.streaming.router import admin_router as streaming_admin_router
from modules.streaming.router import router as streaming_router
from modules.streaming.webhook import router as streams_router
from modules.users.router import router as users_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Start background work on boot; stop it cleanly on shutdown."""
    from core.seed import seed_db
    from modules.realtime.manager import manager
    from modules.streaming.service import monitor

    await seed_db()
    await manager.start()
    monitor.start()
    logging.getLogger("adda").info("Backend startup complete. Debug=%s", settings.debug)
    try:
        yield
    finally:
        await monitor.stop()
        await manager.stop()


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.debug else None,
)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


# ── Routers ───────────────────────────────────────────────────────────
# All HTTP routers mount under the /api prefix; the WebSocket gateway sits
# at the root (no prefix).
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(communities_router, prefix=settings.api_prefix)
app.include_router(chat_router, prefix=settings.api_prefix)
app.include_router(communities_admin_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(streaming_router, prefix=settings.api_prefix)
app.include_router(streaming_admin_router, prefix=settings.api_prefix)
app.include_router(streams_router, prefix=settings.api_prefix)
app.include_router(recordings_router, prefix=settings.api_prefix)
app.include_router(recordings_admin_router, prefix=settings.api_prefix)
app.include_router(stats_router, prefix=settings.api_prefix)
app.include_router(ws_router)
