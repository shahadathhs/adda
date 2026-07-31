# adda — Project Agent Instructions

A self-hosted community platform (Telegram-flavored) with live streaming.
Monorepo: FastAPI backend (`backend/`) + React/TS frontend (`frontend/`) +
mediamtx streaming server.

## Commands

### Backend (Poetry, Python 3.11+)

```bash
cd backend
poetry install
poetry run alembic upgrade head          # apply migrations
poetry run uvicorn main:app --reload --port 7001
poetry run pytest                         # tests
poetry run pyright                        # type checking (must pass, no new warnings)
```

### Frontend (pnpm)

```bash
cd frontend
pnpm install
pnpm dev                                  # dev server → http://localhost:5173
pnpm lint                                 # eslint
pnpm build                                # tsc + vite build
```

### Infra (Docker)

```bash
docker compose up -d --build              # postgres + redis + mediamtx + backend + frontend
```

## Testing & quality policy

- Run backend tests after every backend change: `cd backend && poetry run pytest`.
- Run type checking after every backend change: `cd backend && poetry run pyright`.
  No new warnings in changed files.
- Run frontend lint/build after frontend changes: `cd frontend && pnpm lint && pnpm build`.

## Conventions

- **WebSocket contract is sacred.** The message types in `backend/ws/protocol.py`
  and `frontend/src/lib/ws.ts` must stay in sync. When adding a realtime feature,
  define the type in both places first.
- Backend is async-first (async SQLAlchemy, asyncpg, `redis.asyncio`). Never use
  blocking calls in request handlers.
- Each domain is a module with `router.py` + `service.py`. Routers stay thin;
  business logic lives in services.
- Use triple-quoted strings for multi-line prompt/text. Pydantic v2 models for all
  request/response schemas.
- Frontend state via Zustand stores (`src/store/`). API calls via `src/lib/api.ts`,
  WS via `src/lib/ws.ts`.

## Ports

- Frontend: 5173 · Backend: 7001 · Postgres: 5432 · Redis: 6379
- mediamtx: RTMP 1935 · HLS 8888 · WebRTC 8889 · API 9997
