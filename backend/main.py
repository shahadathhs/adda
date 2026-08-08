import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from modules.auth.router import router as auth_router
from modules.channels.router import router as channels_router
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

app = FastAPI(
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


@app.on_event("startup")
async def startup() -> None:
    from core.seed import seed_db

    await seed_db()

    from modules.realtime.manager import manager

    await manager.start()
    logging.getLogger("adda").info("Backend startup complete. Debug=%s", settings.debug)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


# ── Routers ───────────────────────────────────────────────────────────
# All HTTP routers mount under the /api prefix; the WebSocket gateway sits
# at the root (no prefix).
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(communities_router, prefix=settings.api_prefix)
app.include_router(channels_router, prefix=settings.api_prefix)
app.include_router(communities_admin_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(streaming_router, prefix=settings.api_prefix)
app.include_router(streaming_admin_router, prefix=settings.api_prefix)
app.include_router(streams_router, prefix=settings.api_prefix)
app.include_router(recordings_router, prefix=settings.api_prefix)
app.include_router(recordings_admin_router, prefix=settings.api_prefix)
app.include_router(stats_router, prefix=settings.api_prefix)
app.include_router(ws_router)
