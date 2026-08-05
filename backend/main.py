import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from communities import router as communities_router
from config import settings
from members import router as members_router
from recordings.router import router as recordings_router
from streaming import router as streaming_router
from admin.router import router as admin_router
from streams.router import router as streams_router
from ws import router as ws_router

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
    from seed import seed_db

    await seed_db()

    from ws.manager import manager

    await manager.start()
    logging.getLogger("adda").info(
        "Backend startup complete. Debug=%s", settings.debug
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


# Routers
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(communities_router, prefix=settings.api_prefix)
app.include_router(members_router, prefix=settings.api_prefix)
app.include_router(recordings_router, prefix=settings.api_prefix)
app.include_router(streaming_router, prefix=settings.api_prefix)
app.include_router(streams_router, prefix=settings.api_prefix)
app.include_router(admin_router, prefix=settings.api_prefix)
# WebSocket gateway sits at the root (no api prefix)
app.include_router(ws_router)
