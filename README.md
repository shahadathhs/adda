# adda

A self-hosted, **multi-tenant live-streaming platform** with **real-time
community chat**. One instance hosts many channels —
each with its own stream key, live page, chat, and recordings.

Three UIs, three deployment targets, one backend:

- **Viewer web app** (`apps/web`) — Next.js, deployed with your stack
- **Desktop console** (`apps/desktop`) — Tauri operator client, downloaded and
  pointed at your server
- **Marketing/docs site** (`site/`) — Astro/Starlight, hosted on Vercel

Shared TypeScript logic lives in `packages/` (`types` · `api-client` ·
`shared`) — logic is shared, **UI never is**.

> **adda** (আড্ডা /ˈ_add_ːa/) — Bengali for an informal, wide-ranging conversation
> among friends.

---

## Features

### Authentication & Security
- **JWT-based auth** with rotating **refresh tokens** (30-day, hashed at rest,
  reuse detection revokes the session) + 1-day access tokens; the frontend
  refreshes transparently on 401
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
- **Community channels** within each community (`text`, `announcement`, `live`)
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

### Creator Console (Desktop)
- **Dedicated operator client** — dense, dark, keyboard-first desktop app
  (not a wrapped website): Dashboard (stats + active streams), Streams
  (live monitor, viewer counts, force-stop), Communities (members, kick,
  stream-key reveal/rotate, suspend, delete), Users (roles, suspend,
  password reset, delete), Recordings (play/download/delete), Chat
  moderation, Settings
- **⌘K command palette**, ⌘1–⌘7 view switching, `⌘/` shortcut help
- **Native notifications** the moment any channel goes live
- Window state + last view remembered across launches; update-available
  check against GitHub releases
- **For every kind of user**: sign in and see *your* channels (owner/
  moderator/streamer roles) with per-channel tools; system admins
  additionally get the Platform section (users, all communities, live
  monitor, all recordings)

### Desktop Console (Tauri v2)
- **Operator client** — its own app (own UI, dense + dark + keyboard-first),
  not a wrapped website: dashboard, live monitor with force-stop, community
  management (members, stream keys), users, recordings, chat moderation
- **⌘K command palette**, ⌘1–⌘7 view switching, native notifications when a
  stream goes live (`stream_status` WebSocket events)
- **Runtime-configurable server** — first-run connect screen, changeable in
  Settings; signs in with an operator account (admin/superadmin)
- Shares only logic (`@adda/*` packages) with the web app — never UI
- Linux `.deb`/`.AppImage` buildable via Docker (no local Rust needed);
  macOS/Windows installers build natively

### Docs & Marketing Site (Astro + Starlight → Vercel)
- Splash landing with hero CTAs and feature tour
- Full guides: quickstart, self-hosting (TLS/proxy/persistence/scaling),
  going live with OBS, desktop console, administration
- Reference: configuration (every env var) + API/WebSocket overview, FAQ
- Zero-JS static output, SEO-ready, sitemap + search included

---

## Tech Stack

| Layer          | Technology                                                           |
|----------------|----------------------------------------------------------------------|
| **Viewer web** | Next.js 15 (App Router, SSR channel pages) · React 19 · TanStack Query · Tailwind CSS · hls.js |
| **Desktop console** | Tauri v2 operator client (own dense UI, ⌘K palette, native notifications) |
| **Backend**    | FastAPI · async SQLAlchemy 2.0 · asyncpg · Pydantic v2 · PyJWT + cryptography · bcrypt · aiosmtplib · httpx |
| **Database**   | PostgreSQL 16 (async) · Redis 7 (pub/sub + presence + OTP)          |
| **Streaming**  | mediamtx (RTMP ingest → HLS/WebRTC playback)                        |
| **Realtime**   | WebSocket gateway with Redis fan-out                                |
| **Infra**      | Docker Compose (single-command full stack)                          |
| **Tooling**    | uv (Python) · pnpm (JS) · Ruff + Pyright · ESLint · Husky · CI      |

---

## Architecture

```
   Vercel (product site)      Streamer's server                     Streamer's laptop
┌───────────────────┐   ┌───────────────────────────────────┐   ┌─────────────────────┐
│ site/             │   │ apps/web  Next.js viewer (:5173)  │   │ apps/desktop        │
│ Astro + Starlight │   │   SSR browse + channel pages      │   │ Tauri console       │
│ marketing + docs  │   │ backend/  FastAPI (:7001)         │◄──│ operator client     │
└───────────────────┘   │   REST /api · WebSocket /ws      │   │ (runtime server URL)│
                        │ postgres 16 · redis 7            │   └─────────────────────┘
                        │ mediamtx :1935/:8888/:8889/:9997 │
                        └───────────────────────────────────┘
                              ▲
                              └── @adda/types · @adda/api-client · @adda/shared (packages/)
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
│   ├── auth_emails.py       HTML email templates (OTP, 2FA)
│   └── security/
│       ├── jwt.py           HS256 access token create/decode
│       ├── password.py      bcrypt hash/verify
│       ├── tokens.py        Signed password-reset tokens
│       ├── deps.py          get_current_user (HTTP + WS)
│       └── guards.py        require_admin / require_superadmin
├── models/                  Shared SQLAlchemy 2.0 models
│   ├── user.py              User + SystemRole enum
│   ├── community.py         Community (+ stream_title)
│   ├── membership.py        Membership + CommunityRole enum
│   ├── channel.py           Channel
│   ├── channel_member.py    ChannelMember (per-channel access grants)
│   ├── message.py           Message (persisted chat)
│   ├── join_request.py      JoinRequest (private community workflow)
│   ├── follow.py            Follow (user × community)
│   └── refresh_token.py     RefreshToken (hashed, revocable sessions)
├── modules/                 Feature modules (one folder per domain)
│   ├── auth/                Register, login, JWT, 2FA, OTP, password reset
│   ├── communities/         CRUD, slugs, follows, stream keys, membership (+ admin_router)
│   ├── channels/            Channel CRUD, messages, per-channel permissions
│   ├── streaming/           Discover, live status, health, monitor, mediamtx webhook
│   ├── recordings/          VOD list/serve/delete (+ admin_router)
│   ├── stats/               Dashboard aggregate counts
│   ├── users/               Admin user management (+ admin_router)
│   └── realtime/            WS gateway + Redis pub/sub + presence
└── alembic/                 11 migrations
```

### Web app structure

```
apps/web/src/                # Next.js 15 App Router viewer (workspace member)
├── app/                     # file-based routes
│   ├── page.tsx             Browse (SSR: live-first grid, search, Following rail)
│   ├── channel/[slug]/      Channel page (SSR + OG metadata, player, chat, setup)
│   ├── community/[id]/      Legacy UUID links → channel view
│   ├── login/ register/ reset-password/   (password · 2FA · OTP)
│   ├── settings/            Profile, password, 2FA
│   └── layout.tsx providers.tsx globals.css
├── components/              ui kit, LivePlayer (hls.js), ChatRail, ChannelView…
└── lib/                     session + data hooks (TanStack Query), SSR fetch helper

apps/desktop/src/            # operator console (own design system — no shared UI)
├── views/                   dashboard · streams · communities · users ·
│                            recordings · chat · settings (+ boot screens)
├── ui/                      dense console primitives (button/table/panel/…)
└── lib/                     session, admin data hooks, notifications, update check
```

---

## Getting Started

### Install on a server (one command)

Point a domain's DNS A record at a fresh server with Docker, open ports
80, 443 and 1935, then:

```bash
./scripts/install.sh        # or: curl -fsSL <release-url>/install.sh | sh
```

It asks for two things — **your domain** and an **admin email** — and
does the rest: generates the Postgres password, JWT secret, and admin
password, writes `.env`, builds every image, starts the stack behind
Caddy with automatic HTTPS, and prints your login exactly once.

```text
adda is live:  https://adda.example.com
  admin login:  you@example.com
  password:     <generated — shown once, change after first sign-in>
  OBS stream URL:  rtmp://adda.example.com/live
```

Postgres, Redis, and the streaming internals are never exposed to the
internet — only HTTPS (80/443) and RTMP (1935).

### Prerequisites

- **Docker** + **Docker Compose v2**
- **[uv](https://docs.astral.sh/uv/)** — Python package manager
  (`curl -LsSf https://astral.sh/uv/install.sh | sh`) — dev only
- **Node.js 20+** + **pnpm** (`corepack enable`) — only for local web dev

### Quick start (local Docker)

```bash
make setup       # creates .env files, installs deps, starts Postgres, runs migrations
make up          # builds and starts the full stack with dev ports (no HTTPS)
```

Open **http://localhost:5173**.

**Seeded accounts** (dev only — `SEED_TEST_USERS=true` via the dev overlay):

| User   | Email                | Password      | Role       |
|--------|----------------------|---------------|------------|
| admin  | `admin@example.com`  | `admin12345`  | superadmin |
| alice  | `alice@example.com`  | `password123` | member     |
| bob    | `bob@example.com`    | `password123` | member     |

> Production stacks made by `install.sh` seed **only** the admin, with a
> generated password. `SEED_TEST_USERS` defaults to false.

### Local development (hot reload)

```bash
make setup                       # one-time setup
make up postgres redis mediamtx  # start infra in Docker
make dev                         # backend (uvicorn --reload) + web (next dev) concurrently
```

Or run individually:

```bash
make backend     # uvicorn --reload on :7001
make web         # next dev server on :5173
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

1. Open your channel page → **Stream setup (OBS)** card (channel owners)
2. Copy the **Stream URL** (includes `?key=…`)
3. In OBS → **Settings → Stream**:
   - **Service:** Custom
   - **Server:** paste the Stream URL
   - **Stream Key:** *(leave empty)*
4. Click **Start Streaming**

Set a **stream title** in the same card — it shows on your channel page and
the browse grid while live. Viewers get the HLS player automatically; admins
can also force-stop or manage streams from the desktop console. After the
stream ends, the recording appears under Recordings.

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
make web               # next dev server on :5173

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
make check             # everything: pyright + ruff + lint + web/desktop/site builds

# Cleanup
make clean             # remove containers + Docker volumes (keeps recordings)
```

---

## Ports

| Service          | Port |
|------------------|------|
| Web (Next.js)    | 5173 |
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
├── .github/workflows/ CI: backend (ruff+pyright), web/desktop/site lint+build,
│                          console installers via tauri-action
├── apps/
│   ├── web/                 Viewer web app (Next.js 15, SSR browse + channel pages)
│   │   └── src/app/         App Router pages + components + lib
│   └── desktop/             Operator console (React + Tauri v2, own UI)
│       ├── src/             views/ + ui/ (dense console design system)
│       └── src-tauri/       Tauri shell + notification plugin
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

**Shipped:** authentication (JWT + refresh tokens + 2FA + OTP +
password reset), communities (CRUD + slugs + follows + join requests + private
communities), channels (permissions + message persistence), live streaming
(RTMP → HLS via mediamtx, per-community keys, discover, stream titles & health,
instant live/offline push), recordings (auto-record + VOD playback), real-time
infrastructure (WebSocket + Redis pub/sub + presence), Next.js viewer with SSR
channel pages, desktop operator console (Tauri v2), Astro docs/marketing site.

**Next:** profile pages, posts/announcements, notifications, discovery/search,
media gallery, file sharing, events, DMs.

---

## License

MIT
