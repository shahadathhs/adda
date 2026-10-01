# adda — Project Agent Instructions

A self-hosted multi-tenant live-streaming platform (Twitch-like) with
community chat. pnpm monorepo: FastAPI backend (`backend/`) + React/TS viewer
web app (`apps/web/`, Vite + TanStack) + Tauri operator console
(`apps/desktop/`) + mediamtx streaming server + Astro/Starlight docs site
(`site/`).

## Target architecture (in progress)

```
adda/
├── apps/
│   ├── web/            # viewer web app (Vite + React + TanStack Router)
│   └── desktop/        # (planned) React + Tauri operator console
├── packages/           # shared TS logic — NEVER shared UI
│   ├── types/          # DTOs mirroring Pydantic schemas (@adda/types)
│   ├── api-client/     # request + auth + WS client + endpoints (@adda/api-client)
│   └── shared/         # runtime server config + zod schemas (@adda/shared)
├── backend/            # FastAPI (unified API for all clients)
├── site/               # Astro/Starlight marketing + docs (→ Vercel)
└── mediamtx/           # streaming server config
```

**Boundary rule:** apps may import `@adda/*` packages but never each other's
code. There is no `packages/ui` and there never will be — desktop and web UIs
evolve independently.

## Commands

### Install (workspace — covers apps/web, packages, site)

```bash
pnpm install
```

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

### Web app (Next.js workspace member)

```bash
pnpm -C apps/web dev                  # dev server → http://localhost:5173
pnpm -C apps/web lint                 # oxlint + eslint + prettier
pnpm -C apps/web build                # next build (standalone output)
```

- Next.js App Router viewer app: SSR browse (`/`) and channel pages
  (`/channel/[slug]`) with OG metadata; authed pages are client-side.
- Server components fetch via `API_SSR_URL` (see `src/lib/ssr.ts`); client
  code uses `@adda/api-client` (localStorage tokens).
- `@adda/*` packages are transpiled via `transpilePackages` (raw TS source).
- Legacy UUID links redirect: `/community/[id]` → channel view.

### Docs/marketing site (Astro + Starlight, workspace member)

```bash
make site-dev                         # dev server → http://localhost:4321
make site-build                       # static build → site/dist/
```

### Desktop console (Tauri v2, requires Rust toolchain)

```bash
pnpm -C apps/desktop desktop:dev        # tauri dev — needs backend running on :7001
pnpm -C apps/desktop desktop:build      # bundles installers into src-tauri/target
pnpm -C apps/desktop dev                # console UI in a browser on :5174 (no Rust)
```

- The console (`apps/desktop/`) is the **operator client** — stream/community
  management for streamers and admins. It shares logic via `@adda/*` packages
  but has its own UI (dense, dark, keyboard-first; never shares UI with web).
- Server URL is runtime-configured (`@adda/shared`): first-run connect screen,
  changeable in Settings. Auth = operator account (admin/superadmin) with the
  same rotating refresh tokens as web.
- Native notifications on `stream_status` WS events via the Tauri
  notification plugin; ⌘K command palette; ⌘1–⌘7 view switching.
- Linux installers build without local Rust via Docker:
  `docker compose --profile desktop run --rm desktop` → `./dist-desktop/`.

### Infra (Docker)

```bash
docker compose up -d --build          # postgres + redis + mediamtx + backend + web
```

## Quality policy

- Run lint after every backend change: `cd backend && uv run ruff check .`.
  Auto-format with `uv run ruff format .` (and `uv run ruff check --fix .` for
  import sorting).
- Run type checking after every backend change: `cd backend && uv run pyright`.
  No new warnings in changed files.
- Run web lint/build after web or package changes:
  `pnpm -C apps/web lint && pnpm -C apps/web build`.
- Run `pnpm -C site build` after docs-site changes.

## Conventions

- **WebSocket contract is sacred.** The message types in
  `backend/modules/realtime/protocol.py` and `packages/types/src/realtime.ts`
  (transport in `packages/api-client/src/ws.ts`) must stay in sync. When adding
  a realtime feature, define the type in both places first.
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
- Web app uses TanStack Query + TanStack Router (file-based routes under
  `src/routes/`). Feature-sliced: each domain has `src/features/<domain>/` with
  `hooks.ts` + UI (api/types live in `@adda/*` — the per-feature `api.ts`/
  `types.ts` files are re-export shims; new code should import `@adda/*`
  directly). Shared UI in `src/shared/ui/` (shadcn/ui style).
- Workspace packages export TypeScript source (no build step) — keep them
  dependency-light and UI-free.

## Ports

- Web: 5173 · Backend: 7001 · Postgres: 5432 · Redis: 6379
- mediamtx: RTMP 1935 · HLS 8888 · WebRTC 8889 · API 9997
