# adda — Project Agent Instructions

A self-hosted community platform (Telegram-flavored) with live streaming.
Monorepo: FastAPI backend (`backend/`) + React/TS frontend (`frontend/`) +
mediamtx streaming server.

## Commands

### Backend (uv, Python 3.12)

```bash
cd backend
uv sync
uv run alembic upgrade head          # apply migrations
uv run uvicorn main:app --reload --port 7001
uv run ruff check .                   # lint (must pass)
uv run ruff format .                  # format
uv run pyright                        # type checking (must pass, no new warnings)
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

## Quality policy

- Run lint after every backend change: `cd backend && uv run ruff check .`.
  Auto-format with `uv run ruff format .` (and `uv run ruff check --fix .` for
  import sorting).
- Run type checking after every backend change: `cd backend && uv run pyright`.
  No new warnings in changed files.
- Run frontend lint/build after frontend changes: `cd frontend && pnpm lint && pnpm build`.

## Conventions

- **WebSocket contract is sacred.** The message types in
  `backend/modules/realtime/protocol.py` and `frontend/src/features/realtime/ws.ts`
  must stay in sync. When adding a realtime feature, define the type in both
  places first.
- Backend is async-first (async SQLAlchemy, asyncpg, `redis.asyncio`). Never use
  blocking calls in request handlers.
- **Layout:** `core/` holds shared infra — `config.py`, `database.py`,
  `redis_client.py`, `seed.py`, `security/` (jwt/password/deps/guards),
  `exceptions.py`. The shared `models/` package and `alembic/` sit at the
  backend root. Features live in `modules/<feature>/` — one folder per feature
  (`auth`, `users`, `communities`, `streaming`, `recordings`, `stats`,
  `realtime`).
- **Per-module shape:** `router.py` for public routes (+ `admin_router.py` for
  `/admin/*` routes), `webhook.py` for external webhooks, `schemas.py` for
  Pydantic DTOs, and a `service/` package of short focused files (e.g.
  `queries.py`, `commands.py`). Routers stay thin; logic lives in `service/`.
- **No role-based folders.** Admin endpoints belong to their feature module,
  protected by the `require_admin` guard applied at the router level
  (`APIRouter(dependencies=[Depends(require_admin)])`). The `/admin/...` URL
  prefix is preserved; only the code's home changes.
- SQLAlchemy models live in the shared `models/` package. `core/` may import a
  module's `model.py` but never its `router`/`service` (prevents import cycles).
- Use triple-quoted strings for multi-line prompt/text. Pydantic v2 models for
  all request/response schemas.
- Frontend uses TanStack Query + TanStack Router (file-based routes under
  `src/routes/`). Feature-sliced: each domain has `src/features/<domain>/` with
  `api.ts`, `hooks.ts`, `types.ts`. Shared UI in `src/shared/ui/` (shadcn/ui
  style). API client in `src/shared/api/client.ts`, WS in
  `src/features/realtime/ws.ts`.

## Ports

- Frontend: 5173 · Backend: 7001 · Postgres: 5432 · Redis: 6379
- mediamtx: RTMP 1935 · HLS 8888 · WebRTC 8889 · API 9997
