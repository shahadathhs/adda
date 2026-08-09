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
| Frontend | React 18 · TypeScript · TanStack Router · TanStack Query · Tailwind · shadcn/ui · hls.js |
| Backend  | FastAPI · async SQLAlchemy 2.0 · Pydantic v2 · PyJWT |
| Database | PostgreSQL (async) · Redis (pub/sub + presence) |
| Streaming | mediamtx (RTMP ingest → HLS playback) |
| Realtime | WebSocket gateway backed by Redis fan-out |
| Infra | Docker Compose (single command up) |

## Prerequisites

- **Docker** + **Docker Compose** — runs the full stack.
- **[uv](https://docs.astral.sh/uv/)** — Python package manager (installs its own
  Python 3.12; no system Python needed).
  Install: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Node.js 20+** + **pnpm** — only needed for local frontend dev (`make dev`).
  Enable pnpm via `corepack enable` after installing Node.

## Getting started

### Quick start (Docker — recommended)

```bash
make setup    # creates .env files + installs deps + starts Postgres + migrates
make up       # builds and starts all services
```

That's it. Open http://localhost:5173.

**Seeded accounts** (created automatically on first backend startup):

| User | Email | Password | Role |
|------|-------|----------|------|
| admin | `admin@example.com` | `admin12345` | admin |
| alice | `alice@example.com` | `password123` | member |
| bob | `bob@example.com` | `password123` | member |

Override these in `.env` (`SUPERADMIN_*`, `SEED_TEST_*`).

### Local development (faster feedback)

For frontend/backend hot-reload while keeping Postgres/Redis/mediamtx in Docker:

```bash
make setup                          # one-time: env + deps + DB
make up postgres redis mediamtx     # infra only (skip backend/frontend containers)
make dev                            # runs backend (uv) + frontend (vite) concurrently
```

Or run them individually:

```bash
make backend     # uvicorn --reload on :7001
make frontend    # vite dev server on :5173
```

## Going live (streaming)

Streams are **secured by a per-community stream key**. As the community owner:

1. Open the community → **Live** tab → **Stream setup** card.
2. Copy the **Stream URL** (it includes `?key=…`).
3. In OBS → **Settings → Stream**:
   - **Service:** Custom
   - **Server:** paste the Stream URL
   - **Stream Key:** *(leave empty)*
4. Click **Start Streaming**.

Viewers watch in the community's **Live** tab (HLS player, auto-connects).
After the stream ends, the recording appears in the **Recordings** tab automatically.

> Rotating the stream key (button in the same card) immediately kicks the current
> OBS connection — the old key stops working instantly.

## Common commands

```bash
make help              # list all targets

# Docker (full stack)
make up                # build + start all services (detached)
make down              # stop + remove containers
make logs              # tail all logs
make ps                # list running containers

# Database
make migrate           # apply Alembic migrations
make migration m="…"   # generate a new migration from model changes
make reset-migrate     # drop all tables, re-apply from scratch (destroys data)
make reset             # full factory reset: containers + volumes + recordings → fresh

# Quality gates
make typecheck         # backend pyright
make lint              # frontend eslint
make build-web         # frontend tsc + vite build
make check             # all of the above in sequence

# Cleanup
make clean             # remove containers + Docker volumes (keeps recordings)
make clean-recordings  # delete all recording files (keeps the folder)
```

## Architecture

```
┌──────────────────┐   REST (auth, communities, admin)  ┌──────────────────────┐
│  Frontend (5173) │ ─────────────────────────────────► │  Backend FastAPI(7001)│
│  React/Vite      │ ◄──────────────────────────────── │  service modules      │
└──────────────────┘   WebSocket (chat, presence)       └─────────┬────────────┘
            │                                                    │
            │  HLS playback (mediamtx :8888)                      ├──► PostgreSQL
            ▼                                                    ├──► Redis (pub/sub)
┌──────────────────┐    RTMP ingest (OBS + stream key)           │
│   mediamtx       │ ◄─────────────────── Streamer               ▼
│   :1935/:8888    │                                  ┌──────────────────┐
└──────────────────┘                                  │ ./recordings/    │
   auth webhook ──► backend validates key              │ (bind-mounted)   │
                                                       └──────────────────┘
```

### Backend modules

Each domain is self-contained under `backend/modules/` (shared infra in `core/`):

```
core/              config, database, redis, security/, seed, exceptions, email
models/            shared SQLAlchemy models (User, Community, Membership)
modules/
  auth/            register, login, JWT, password reset, Google OAuth
  communities/     CRUD + join/leave + stream keys + suspend (router + admin_router)
  realtime/        WS gateway + Redis pub/sub + presence (no persistence yet)
  streaming/       live status, viewer counts, force-stop + mediamtx auth webhook
  recordings/      list + serve + delete community VODs
  stats/           dashboard aggregate counts
  users/           admin user management (promote/suspend/reset-pw/delete)
```

## Ports

| Service | Port |
|---------|------|
| Frontend | 5173 |
| Backend API | 7001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| mediamtx RTMP | 1935 |
| mediamtx HLS | 8888 |
| mediamtx API | 9997 |

## Project layout

```
adda/
├── Makefile              all common commands
├── compose.yaml          Docker Compose (postgres, redis, mediamtx, backend, frontend)
├── .env.example          root env (compose interpolation)
├── backend/              FastAPI app (uv, Python 3.12)
│   ├── main.py           app entry, router registration, startup seed
│   ├── core/             shared infra (config, database, redis, security/, seed)
│   ├── models/           SQLAlchemy models (User, Community, Membership)
│   ├── modules/          feature modules (auth, communities, realtime, …)
│   └── alembic/          migrations
├── frontend/             React app (pnpm + Vite)
│   └── src/
│       ├── routes/       file-based routes (TanStack Router)
│       ├── pages/        page components
│       ├── features/     feature-sliced domains (api.ts, hooks.ts, types.ts)
│       └── shared/       UI kit + api client + config
├── mediamtx/             mediamtx config (Dockerfile-baked) + recording retention
└── recordings/           stream recordings (gitignored, bind-mounted)
```

## Roadmap

**Done:** auth (JWT + suspend), communities CRUD + stream keys, Redis WS gateway with
presence + chat, HLS live streaming (auto-connect), recordings (list + play + delete),
admin dashboard (users/communities/live/recordings), landing page.

**Next:** profile pages, posts/announcements, notifications, discovery/search, media gallery,
files, events, chat persistence, private-community enforcement.
