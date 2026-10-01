# adda

A self-hosted, **multi-tenant live-streaming platform** (think self-hosted
Twitch) with **real-time community chat**. One instance hosts many channels —
each with its own stream key, live page, chat, and recordings. Built as a
full-stack monorepo with a FastAPI backend, React/TypeScript web app + Tauri
desktop app, mediamtx streaming server, and an Astro/Starlight docs site.

> **adda** (আড্ডা /ˈ_add_ːa/) — Bengali for an informal, wide-ranging conversation
> among friends.

---

## Features

### Authentication & Security
- **JWT-based auth** with rotating **refresh tokens** (30-day, hashed at rest,
  reuse detection revokes the session) + 1-day access tokens; the frontend
  refreshes transparently on 401
- **Google OAuth** sign-in (Google Identity Services + JWKS verification)
- **Passwordless OTP login** (6-digit code via email, Redis-backed)
- **Two-factor authentication** (2FA) — enable/disable/verify lifecycle
- **Password reset** flow with signed JWT tokens
- **System roles** — `user`, `admin`, `superadmin` (enum-based RBAC)
- **Profile management** — update display name, bio, avatar; set/change password

### Communities
- Create communities with unique slugs, banners, descriptions
- **Public & private** communities (private requires admin approval to join)
- **Member management** — promote/demote roles (owner → admin → moderator →
  streamer → member → guest), kick members
- **Join request workflow** for private communities (request → approve/deny)
- **Suspend/unsuspend** communities (admin only)
- Auto-created **default channels** on community creation (`general`,
  `announcements`, `live`)

### Channels & Messaging
- **Discord-style channels** within each community (`text`, `announcement`, `live`)
- **Permission-controlled** — restricted channels require explicit read/write grants
- **Real-time chat** via WebSocket (reactions, replies, edits)
- **Message persistence** — channel messages are stored in PostgreSQL with cursor
  pagination
- Channel CRUD (default channels are deletion-protected)

### Live Streaming
- **RTMP ingest → HLS playback** via [mediamtx](https://github.com/bluenviron/mediamtx)
- **Per-community stream keys** with instant rotation (kicks active publisher)
- **Publish-auth webhook** — mediamtx calls back to backend to validate stream key
- **Discover/browse page** — live-first grid with viewer counts and search
- **Stream titles & health** — what's live now, viewers, uptime, codecs
- **Follows** — follow channels, personal Following rail with live indicators
- **Instant live/offline push** — background monitor publishes `stream_status`
  over WebSocket to subscribed clients
- **Auto-start HLS player** when a stream goes live
- **Admin force-stop** — kick a publisher from the dashboard
- OBS/Streamlabs ready — just paste the stream URL

### Recordings
- Automatic recording of live streams (stored locally on disk)
- List, play, and delete recordings per community
- Admin can manage all recordings across communities

### Real-time Infrastructure
- **WebSocket gateway** with typed protocol (client ↔ server contract in sync)
- **Redis pub/sub fan-out** for multi-instance scaling
- **Presence tracking** via Redis sets
- Auto-reconnect with exponential backoff (frontend)
- Channel-namespace routing: `community:<id>`, `community:<id>:chat`,
  `community:<id>:presence`, `channel:<uuid>`, `user:<id>`

### Admin Dashboard
- Sidebar layout with collapsible navigation
- **Overview** — platform stats (user count, community count, live count)
- **Users** — search, promote/demote roles, suspend, reset password, delete
- **Communities** — manage any community, suspend, rotate keys, view members
- **Live** — monitor active streams, viewer counts, force-stop
- **Recordings** — browse and delete recordings across all communities

### Desktop App (Tauri v2)
- The same React app wrapped in a native window — small binary, system webview
- **Runtime-configurable server** — first-run "Connect to a server" screen;
  each user points their app at their own self-hosted instance (changeable in
  Settings → Connection)
- One codebase, three clients: browser, desktop dev, desktop installers
- Linux `.deb`/`.AppImage` buildable via Docker (no local Rust needed);
  macOS/Windows installers build natively

### Docs & Marketing Site (Astro + Starlight)
- Static site with landing page, full guides (quickstart, self-hosting,
  streaming with OBS, desktop app, administration), configuration + API
  reference, and FAQ
- Zero-JS static output, SEO-ready, served from `site/dist/`

### Public Site
- Marketing landing page with feature showcase
- 12 public pages (about, features, pricing, docs, blog, changelog, roadmap,
  contact, privacy, terms, status)
- Per-page SEO via TanStack Router `head()` metadata
- Dark/light theme toggle
- Responsive design

---

## Tech Stack

| Layer          | Technology                                                           |
|----------------|----------------------------------------------------------------------|
| **Frontend**   | React 19 · TypeScript · TanStack Router · TanStack Query · Tailwind CSS · Radix UI (shadcn/ui) · react-hook-form + Zod · hls.js · next-themes |
| **Desktop**    | Tauri v2 (system webview, Rust shell)                                |
| **Backend**    | FastAPI · async SQLAlchemy 2.0 · asyncpg · Pydantic v2 · PyJWT + cryptography · bcrypt · aiosmtplib · httpx |
| **Database**   | PostgreSQL 16 (async) · Redis 7 (pub/sub + presence + OTP)          |
| **Streaming**  | mediamtx (RTMP ingest → HLS/WebRTC playback)                        |
| **Realtime**   | WebSocket gateway with Redis fan-out                                |
| **Infra**      | Docker Compose (single-command full stack)                          |
| **Tooling**    | uv (Python) · pnpm (JS) · Ruff + Pyright · ESLint · Husky · CI      |

---

## Architecture

```
                         ┌─────────────────────────────────────────────────┐
                         │                  Frontend (:5173)                │
                         │  React 19 · TanStack Router · TanStack Query     │
                         │  Radix UI · hls.js · next-themes                 │
                         └────────┬──────────────────┬──────────────────────┘
                                  │ REST /api        │ WebSocket /ws
                                  ▼                  ▼
┌──────────────────┐    ┌──────────────────────────────────────┐    ┌─────────────┐
│  mediamtx        │    │         Backend FastAPI (:7001)        │    │   Redis 7   │
│  :1935  RTMP     │◄───│                                        │───►│  pub/sub    │
│  :8888  HLS      │    │  modules/ (auth, communities, channels,│    │  presence   │
│  :8889  WebRTC   │    │    streaming, recordings, stats, users,│    │  OTP store  │
│  :9997  API      │───►│    realtime)  core/ (config, database, │    └─────────────┘
│                  │    │    security, seed, email, exceptions)   │
│  auth webhook    │    │                                        │    ┌─────────────┐
│  recordings dump │    │  Alembic migrations · Pydantic v2 DTOs │───►│ PostgreSQL  │
└──────────────────┘    └────────────────────────────────────────┘    │    16       │
       │                                                               └─────────────┘
       ▼
┌──────────────────┐
│  ./recordings/   │  ← bind-mounted (mediamtx writes, backend serves)
└──────────────────┘
```

### Backend module map

```
backend/
├── main.py                  App entry — router registration, startup seed, CORS
├── core/                    Shared infrastructure
│   ├── config.py            Pydantic Settings (env-driven)
│   ├── database.py          Async SQLAlchemy engine + session factory
│   ├── redis_client.py      Async Redis client
│   ├── exceptions.py        Typed API exception hierarchy (400–503)
│   ├── seed.py              Idempotent startup seeding
│   ├── otp.py               Redis-backed OTP (generate/verify)
│   ├── email.py             Async SMTP sender
│   ├── auth_emails.py       HTML email templates (OTP, 2FA, Google link)
│   └── security/
│       ├── jwt.py           HS256 access token create/decode
│       ├── password.py      bcrypt hash/verify
│       ├── tokens.py        Signed password-reset tokens
│       ├── deps.py          get_current_user (HTTP + WS)
│       └── guards.py        require_admin / require_superadmin
├── models/                  Shared SQLAlchemy 2.0 models
│   ├── user.py              User + SystemRole enum
│   ├── community.py         Community
│   ├── membership.py        Membership + CommunityRole enum
│   ├── channel.py           Channel
│   ├── channel_member.py    ChannelMember (per-channel access grants)
│   ├── message.py           Message (persisted chat)
│   ├── join_request.py      JoinRequest (private community workflow)
│   └── refresh_token.py     RefreshToken (hashed, revocable sessions)
├── modules/                 Feature modules (one folder per domain)
│   ├── auth/                Register, login, JWT, 2FA, OTP, Google OAuth, password reset
│   ├── communities/         CRUD, stream keys, membership, join requests (+ admin_router)
│   ├── channels/            Channel CRUD, messages, per-channel permissions
│   ├── streaming/           Live status, viewer counts, force-stop, mediamtx webhook
│   ├── recordings/          VOD list/serve/delete (+ admin_router)
│   ├── stats/               Dashboard aggregate counts
│   ├── users/               Admin user management (+ admin_router)
│   └── realtime/            WS gateway + Redis pub/sub + presence
└── alembic/                 9 migrations
```

### Frontend structure

```
apps/web/src/                # viewer web app (pnpm workspace member)
├── routes/                  TanStack Router (file-based, 28 route files)
│   ├── __root.tsx           Root layout + SEO head
│   ├── _public/             12 public pages (landing, about, docs, pricing, …)
│   ├── _authed/             Authenticated pages (home, community, settings)
│   ├── admin/               Admin dashboard (overview, users, communities, …)
│   ├── login.tsx  register.tsx  reset-password.tsx
├── features/                Feature-sliced domains
│   ├── auth/                Login forms, Google button, hooks, Zod schemas
│   ├── admin/               Dashboard tabs + hooks
│   ├── communities/         Community UI + members panel
│   ├── channels/            Channel view + chat
│   ├── realtime/            WebSocket client + chat panel
│   ├── streaming/           HLS player
│   ├── recordings/          Recordings panel
│   └── site/                Navbar, footer, page header (marketing site)
├── shared/
│   ├── ui/                  19 shadcn/ui-style components (Radix-based)
│   ├── api/client.ts        Authenticated fetch client
│   ├── lib/utils.ts         cn() classname helper
│   └── config.ts            API/WS/HLS/WebRTC base URLs
└── app/                     App shell (providers, router, query client, topbar)
```

---

## Getting Started

### Prerequisites

- **Docker** + **Docker Compose**
- **[uv](https://docs.astral.sh/uv/)** — Python package manager
  (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Node.js 20+** + **pnpm** (`corepack enable`) — only for local web dev

### Quick start (Docker)

```bash
make setup    # creates .env files, installs deps, starts Postgres, runs migrations
make up       # builds and starts all services
```

Open **http://localhost:5173**.

**Seeded accounts** (auto-created on first startup):

| User   | Email                | Password      | Role       |
|--------|----------------------|---------------|------------|
| admin  | `admin@example.com`  | `admin12345`  | superadmin |
| alice  | `alice@example.com`  | `password123` | member     |
| bob    | `bob@example.com`    | `password123` | member     |

### Local development (hot reload)

```bash
make setup                       # one-time setup
make up postgres redis mediamtx  # start infra in Docker
make dev                         # backend (uvicorn --reload) + web (vite) concurrently
```

Or run individually:

```bash
make backend     # uvicorn --reload on :7001
make web         # vite dev server on :5173
```

### Desktop app (Tauri v2)

```bash
make desktop-dev     # run the app in dev mode (needs Rust: brew install rust)
make desktop-build   # native installers (.dmg on macOS, .exe on Windows)
make desktop         # Linux .deb/.AppImage via Docker — no Rust needed → ./dist-desktop/
```

On first launch the app asks for your server address (default
`http://localhost:7001` for a local stack) — it remembers it afterwards.

### Releasing desktop installers

Releases are triggered by the code that lands on **main**: when a push to
main contains a version that hasn't been released yet, CI builds the
installers and publishes the release (tag included) automatically.

```bash
make release v=0.2.0   # bump + commit + push (on any branch)
# then merge that branch into main → CI releases v0.2.0
```

macOS, Windows, and Linux installers land on the GitHub releases page a few
minutes after the merge. Binaries are currently unsigned (macOS Gatekeeper /
Windows SmartScreen will prompt on first open).

---

## Going Live (Streaming)

Streams are secured by a **per-community stream key**.

1. Open your community → **Live** tab → **Stream setup**
2. Copy the **Stream URL** (includes `?key=…`)
3. In OBS → **Settings → Stream**:
   - **Service:** Custom
   - **Server:** paste the Stream URL
   - **Stream Key:** *(leave empty)*
4. Click **Start Streaming**

Viewers watch via the **Live** tab (HLS player auto-connects). After the
stream ends, the recording appears in the **Recordings** tab automatically.

> Rotating the stream key instantly kicks the active OBS connection.

---

## Commands

```bash
make help              # list all targets

# Docker (full stack)
make up                # build + start all services (detached)
make down              # stop + remove containers
make logs              # tail all logs
make ps                # list running containers

# Local dev
make dev               # backend + web together
make backend           # uvicorn --reload on :7001
make web               # vite dev server on :5173

# Desktop app
make desktop-dev       # run desktop app in dev mode (needs Rust)
make desktop-build     # native installers (macOS/Windows)
make desktop           # Linux installers via Docker → ./dist-desktop/

# Docs / marketing site
make site-dev          # docs site dev server → http://localhost:4321
make site-build        # static build → site/dist/

# Database
make migrate                       # apply Alembic migrations
make migration m="add posts table" # generate a new migration
make reset-migrate                 # drop all tables, re-apply from scratch
make reset                         # full factory reset (containers + volumes + recordings)

# Quality gates
make check             # typecheck (pyright) + lint (ruff + eslint) + build (tsc + vite)

# Cleanup
make clean             # remove containers + Docker volumes (keeps recordings)
```

---

## Ports

| Service          | Port |
|------------------|------|
| Frontend         | 5173 |
| Backend API      | 7001 |
| PostgreSQL       | 5432 |
| Redis            | 6379 |
| mediamtx RTMP    | 1935 |
| mediamtx HLS     | 8888 |
| mediamtx WebRTC  | 8889 |
| mediamtx API     | 9997 |

---

## Project Layout

```
adda/
├── Makefile                 all common commands
├── compose.yaml             Docker Compose (5 services)
├── .env.example             root env template
├── .github/workflows/ci.yml CI: ruff + pyright + eslint + vite build
├── apps/
│   └── web/                 Viewer web app (React 19 + Vite + TanStack)
│       ├── src/             routes/ + features/ + shared/ (shadcn-style UI kit)
│       └── src-tauri/       Tauri v2 desktop shell (Rust + icons + Dockerfile)
├── packages/                Shared TS logic (never UI)
│   ├── types/               DTOs mirroring Pydantic schemas (@adda/types)
│   ├── api-client/          request + auth + WS client + endpoints (@adda/api-client)
│   └── shared/              runtime server config + zod schemas (@adda/shared)
├── backend/                 FastAPI app (uv, Python 3.12)
│   ├── main.py              app entry, router registration, startup seed
│   ├── core/                shared infra (config, database, redis, security/, seed)
│   ├── models/              9 SQLAlchemy models
│   ├── modules/             8 feature modules
│   └── alembic/             11 migrations
├── site/                    Astro + Starlight marketing/docs site (→ Vercel)
├── mediamtx/                mediamtx config (Dockerfile-baked) + recording retention
└── recordings/              stream recordings (gitignored, bind-mounted)
```

---

## Roadmap

**Shipped:** authentication (JWT + refresh tokens + Google OAuth + 2FA + OTP +
password reset), communities (CRUD + membership + join requests + private
communities), channels (Discord-style + permissions + message persistence), live
streaming (RTMP → HLS via mediamtx with per-community keys), recordings
(auto-record + VOD playback), real-time infrastructure (WebSocket + Redis
pub/sub + presence), admin dashboard (users + communities + live + recordings),
public marketing site (12 pages), desktop app (Tauri v2 with runtime server
config).

**Next:** profile pages, posts/announcements, notifications, discovery/search,
media gallery, file sharing, events, DMs.

---

## License

MIT
