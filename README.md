# adda

A self-hosted community platform where **streaming is one feature**, not the whole
product. Think Telegram Channels + Discord + Twitch in a single deployable bundle.

Every **Community** is a communication hub with Posts, Live, Discussion, Files,
Recordings, and Events. Members chat Telegram-style (reactions, replies, edits),
admins broadcast live via OBS, and everything is stored locally on your own
infrastructure.

```
Communities
  ● Python Bangladesh   ● Linux   ● Open Source   ● Gaming
        └── Banner · Posts · Media · Files · Members · Live · Recordings
```

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind · Zustand · Radix UI |
| Backend  | FastAPI · async SQLAlchemy 2.0 · Pydantic v2 · PyJWT |
| Database | PostgreSQL (async) · Redis (pub/sub + presence) |
| Streaming | mediamtx (RTMP ingest → HLS / WebRTC playback) |
| Realtime | WebSocket gateway backed by Redis fan-out |
| Infra | Docker Compose (single command up) |

## Architecture

```
┌──────────────────┐   REST (auth, communities, files)   ┌──────────────────────┐
│  Frontend (5173) │ ──────────────────────────────────► │  Backend FastAPI(7001)│
│  React/Vite      │ ◄────────────────────────────────── │  service modules      │
└──────────────────┘   WebSocket (chat, presence, live)   └─────────┬────────────┘
            │                                                      │
            │  HLS playback (via mediamtx)                          ├──► PostgreSQL
            ▼                                                      ├──► Redis (pub/sub)
┌──────────────────┐    RTMP ingest (OBS)                          │
│   mediamtx       │ ◄─────────────── Streamer                     ▼
│   8888/8889      │                                     ┌──────────────────┐
└──────────────────┘                                     │ mediamtx API     │
                                                         │ (stream status)  │
                                                         └──────────────────┘
```

The **WebSocket message contract** is the single source of truth shared by both
halves (see `backend/ws/protocol.py` and `frontend/src/lib/ws.ts`). New realtime
features add a message type there first, then handle it on each side.

### Backend service modules

Each domain is a self-contained module under `backend/` — a router, a service,
and its models/schemas. They start in one app and can split into separate
services later.

```
auth/          register, login, JWT issuance
communities/   CRUD + join/leave + roles
ws/            realtime gateway + Redis pub/sub + presence
streaming/     go-live, stream status (reads mediamtx API)
members/       membership & permissions
notifications/ notification fan-out (scaffold)
```

## Getting started

### 1. Configure

```bash
cp .env.example .env
# edit JWT_SECRET to a random string
```

### 2. Run everything with Docker

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:7001 (docs at `/docs` in debug)
- mediamtx HLS: http://localhost:8888

The backend runs Alembic migrations automatically on startup.

### 3. Develop locally (faster feedback)

```bash
# Backend (needs postgres + redis running, e.g. via `docker compose up postgres redis`)
cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --port 7001

# Frontend
cd frontend
pnpm install
pnpm dev
```

## Going live (streaming)

1. Start the stack: `docker compose up -d`.
2. In OBS, set **Stream → Service: Custom**, **Server:** `rtmp://localhost:1935/community/<id>`
   (use any community id, e.g. `community/1`).
3. Start streaming. The backend reads stream status from mediamtx's REST API.
4. Watch at `http://localhost:8888/community/<id>/index.m3u8` (HLS) — the
   frontend player is wired to `VITE_HLS_BASE_URL`.

## Testing & quality

```bash
# Backend
cd backend && uv run pytest          # tests
cd backend && uv run pyright         # type checking

# Frontend
cd frontend && pnpm lint                 # eslint
cd frontend && pnpm build                # tsc + vite build
```

## Project layout

```
adda/
├── docker-compose.yml
├── .env.example
├── backend/        FastAPI app (uv)
│   ├── main.py     app entry, router registration
│   ├── config.py   settings (pydantic-settings)
│   ├── auth/ communities/ ws/ streaming/ members/
│   └── alembic/    migrations
├── frontend/       React app (pnpm + Vite)
│   └── src/
│       ├── store/      Zustand stores
│       ├── lib/        api + ws clients
│       ├── components/ UI
│       └── pages/      routes
└── mediamtx/       streaming server config
```

## Roadmap

The starter ships: auth (JWT), communities CRUD + join/leave, a Redis-backed WS
gateway with presence, and streaming status wired to mediamtx. Next up: chat
persistence, posts, files, media gallery, recordings, events, notifications.
