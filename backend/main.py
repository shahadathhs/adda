import logging
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core import metrics
from core.config import settings
from core.logging import configure as configure_logging
from modules.auth.router import router as auth_router
from modules.chat.emotes_router import router as emotes_router
from modules.chat.polls_router import router as polls_router
from modules.chat.room_router import router as room_router
from modules.chat.router import identity_router as identity_router
from modules.chat.router import router as chat_router
from modules.chat.service.messages import MessageRejected
from modules.communities.admin_router import router as communities_admin_router
from modules.communities.profile_router import router as profile_router
from modules.communities.router import router as communities_router
from modules.notifications.router import router as notifications_router
from modules.realtime.gateway import router as ws_router
from modules.recordings.comments_router import router as recording_comments_router
from modules.recordings.router import admin_router as recordings_admin_router
from modules.recordings.router import router as recordings_router
from modules.stats.router import router as stats_router
from modules.streaming.router import admin_router as streaming_admin_router
from modules.streaming.router import router as streaming_router
from modules.streaming.webhook import router as streams_router
from modules.users.router import router as users_router

configure_logging(settings.log_format)
access_log = logging.getLogger("adda.access")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Start background work on boot; stop it cleanly on shutdown."""
    from core.seed import seed_db
    from modules.chat.service import polls, reactions
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
        await reactions.batcher.stop()
        await polls.stop()
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


@app.middleware("http")
async def observe(request: Request, call_next):
    """Count and time every request, and write one access-log line for it."""
    started = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        elapsed = time.perf_counter() - started
        route = getattr(request.scope.get("route"), "path", None) or "unmatched"
        if route not in ("/metrics", "/health"):
            metrics.HTTP_REQUESTS.labels(request.method, route, str(status_code)).inc()
            metrics.HTTP_LATENCY.labels(request.method, route).observe(elapsed)
            access_log.info(
                "%s %s %s",
                request.method,
                request.url.path,
                status_code,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "ms": round(elapsed * 1000, 1),
                },
            )


@app.get("/ready")
async def ready() -> JSONResponse:
    """Readiness: the database and Redis both answer. 503 otherwise, with which one failed."""
    from sqlalchemy import text

    from core.database import engine
    from core.redis_client import redis_client

    checks: dict[str, bool] = {}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False
    try:
        checks["redis"] = bool(await redis_client.ping())
    except Exception:
        checks["redis"] = False
    ok = all(checks.values())
    return JSONResponse(status_code=200 if ok else 503, content={"ready": ok, **checks})


@app.get("/metrics", include_in_schema=False)
async def prometheus_metrics() -> Response:
    """Prometheus scrape endpoint. The proxy in front does not publish it."""
    body, content_type = metrics.render()
    return Response(body, media_type=content_type)


@app.exception_handler(MessageRejected)
async def message_rejected_handler(_: Request, exc: MessageRejected) -> JSONResponse:
    """Chat rule violations raised in REST handlers: a 400 with the same code the socket uses."""
    return JSONResponse(status_code=400, content={"detail": exc.message, "code": exc.code})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


# ── Routers ───────────────────────────────────────────────────────────
# All HTTP routers mount under the /api prefix; the WebSocket gateway sits
# at the root (no prefix).
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(communities_router, prefix=settings.api_prefix)
app.include_router(chat_router, prefix=settings.api_prefix)
app.include_router(identity_router, prefix=settings.api_prefix)
app.include_router(room_router, prefix=settings.api_prefix)
app.include_router(polls_router, prefix=settings.api_prefix)
app.include_router(emotes_router, prefix=settings.api_prefix)
app.include_router(profile_router, prefix=settings.api_prefix)
app.include_router(notifications_router, prefix=settings.api_prefix)
app.include_router(communities_admin_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(streaming_router, prefix=settings.api_prefix)
app.include_router(streaming_admin_router, prefix=settings.api_prefix)
app.include_router(streams_router, prefix=settings.api_prefix)
app.include_router(recording_comments_router, prefix=settings.api_prefix)
app.include_router(recordings_router, prefix=settings.api_prefix)
app.include_router(recordings_admin_router, prefix=settings.api_prefix)
app.include_router(stats_router, prefix=settings.api_prefix)
app.include_router(ws_router)
