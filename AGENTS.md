# adda — Project Agent Instructions

A self-hosted, web-only live-streaming platform with realtime chat. Scope and
milestones live in `docs/SCOPE.md`.
pnpm monorepo: FastAPI backend (`backend/`) + Next.js viewer/studio web app
(`apps/web/`) + mediamtx streaming server + Astro/Starlight docs site
(`site/`).

## Target architecture (in progress)

```
adda/
├── apps/
│   ├── web/            # viewer + studio web app (Next.js App Router)
├── packages/           # shared TS logic — NEVER shared UI
│   ├── types/          # DTOs mirroring Pydantic schemas (@adda/types)
│   ├── api-client/     # request + auth + WS client + endpoints (@adda/api-client)
│   └── shared/         # runtime server config + zod schemas (@adda/shared)
├── backend/            # FastAPI (unified API for all clients)
├── site/               # Astro/Starlight marketing + docs (→ Vercel)
└── mediamtx/           # streaming server config
```

**Boundary rule:** apps may import `@adda/*` packages but never each other's
code. There is no `packages/ui` and there never will be.

## Design system (required reading)

`/DESIGN.md` is the law for all UI work — tokens, type, radius, motion,
component patterns, and the anti-slop checklist. Per-surface rules live in
`apps/web/AGENTS.md` and `site/AGENTS.md`. Core
rules: marigold accent `#f5a623` with dark-ink text on fills (never white),
live red `#eb3223` reserved for live states, violet/purple banned, radii
only 4/6/8px, mono tabular numerics, spring motion (120ms micro / 250ms
state, transform+opacity only), one exported React component per file.
Both surfaces (web and site) share one identity kit.

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
pnpm lint                             # oxlint + prettier (whole repo)
pnpm typecheck                        # tsc --noEmit
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
  `pnpm lint && pnpm typecheck && pnpm -C apps/web build`.
- Run `pnpm -C site build` after docs-site changes.

## Conventions

- **No competitor naming.** Never name or compare adda to any other
  product/brand — streaming, chat, or messaging apps included — in
  code, docs, comments, site content, or commits. Describe features in
  adda's own words; the product stands on its own.
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
- Web app is Next.js App Router (`src/app/`) with TanStack Query for client
  data. Shared components live in `src/components/`, helpers in `src/lib/`;
  API calls and DTOs come from `@adda/api-client` and `@adda/types`.
- Workspace packages export TypeScript source (no build step) — keep them
  dependency-light and UI-free.

## Ports

- Web: 5173 · Backend: 7001 · Postgres: 5432 · Redis: 6379
- mediamtx: RTMP 1935 · HLS 8888 · WebRTC 8889 · API 9997
