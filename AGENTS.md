# adda — Project Agent Instructions

A self-hosted, web-only live-streaming platform with realtime chat. Scope and
milestones live in `docs/SCOPE.md`.

## Docs map (read before building a feature)

| Doc                      | Use it for                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| `docs/SCOPE.md`          | Goal, non-goals, who can do what, milestones                     |
| `docs/FLOWS.md`          | Acceptance criteria per flow (F0–F16) and the screen-to-test map |
| `docs/CHAT.md`           | Chat backend: data model, wire protocol, rules, build order      |
| `docs/design/SCREENS.md` | The concept screens to match (`docs/design/screens/*.png`)       |
| `docs/DESIGN.md`         | Tokens, type, motion, component patterns, anti-slop checklist    |
| `docs/ARCHITECTURE.md`   | How the services, streaming path and code fit together           |
| `docs/OPERATIONS.md`     | Install, config, metrics, backup and restore, upgrade            |

**Definition of done for a feature:** its flow's acceptance criteria in
`docs/FLOWS.md` hold, they are covered by tests (pytest for the API and
WebSocket, Playwright for the browser), the screen matches its concept render
including loading, empty, error and reconnecting states, and docs that describe
the behaviour are updated in the same commit.
pnpm monorepo: FastAPI backend (`backend/`) + Next.js viewer/studio web app
(`web/`) + mediamtx streaming server + a static Next.js marketing and docs
site (`site/`).

## Layout

```
adda/
├── backend/   # FastAPI API + WebSocket gateway
├── web/       # viewer + studio web app (Next.js App Router)
│   └── src/lib/{api,types,config}   # API client, DTOs, runtime config
├── site/      # static Next.js marketing + docs (→ Vercel)
├── infra/     # mediamtx (streaming server) + Caddy (HTTPS) configs
└── docs/      # scope, architecture, deployment
```

## Design system (required reading)

`/docs/DESIGN.md` is the law for all UI work — tokens, type, radius, motion,
component patterns, and the anti-slop checklist. Per-surface rules live in
`web/AGENTS.md` and `site/AGENTS.md`. Core
rules: marigold accent `#f5a623` with dark-ink text on fills (never white),
live red `#eb3223` reserved for live states, violet/purple banned, radii
only 4/6/8px, mono tabular numerics, spring motion (120ms micro / 250ms
state, transform+opacity only), one exported React component per file.
Both surfaces (web and site) share one identity kit.

## UI work (skills)

Project skills in `.claude/skills/` apply to anything under `web/` or `site/`:
`ui-build` (read before writing UI), `ux-states-a11y` (states, keyboard, WCAG 2.2
AA) and `ui-review` (audit before commit). `pnpm check:design` is the
automated gate for the banned patterns in `/docs/DESIGN.md` and runs in CI.

## Commands

### Install (workspace — covers web and site)

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
pnpm -C web dev                  # dev server → http://localhost:5173
pnpm lint                             # oxlint + prettier (whole repo)
pnpm typecheck                        # tsc --noEmit
pnpm -C web build                # next build (standalone output)
```

- Next.js App Router viewer app: SSR browse (`/`) and channel pages
  (`/channel/[slug]`) with OG metadata; authed pages are client-side.
- Server components fetch via `API_SSR_URL` (see `src/lib/ssr.ts`); client
  code uses the typed client in `src/lib/api` (localStorage tokens).
- Legacy UUID links redirect: `/community/[id]` → channel view.

### Marketing and docs site (static Next.js, workspace member)

```bash
make site-dev                         # dev server → http://localhost:4321
make site-build                       # static export → site/out/
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
- Run the backend tests after every backend change: `make test` (or
  `cd backend && uv run pytest`). They need no Docker: the harness starts an
  embedded Postgres, applies the real Alembic migrations, and uses an
  in-memory Redis. New behaviour ships with tests in `backend/tests/`.
- Run web lint/build after web or package changes:
  `pnpm lint && pnpm typecheck && pnpm -C web build`.
- Run `pnpm -C site build` after docs-site changes. Edit `/docs` for the engineering docs; the
  site copies of `ARCHITECTURE`, `OPERATIONS` and `CHAT` are synced (`pnpm -C site sync-docs`).
- Browser tests: `pnpm e2e` (Playwright, against the running stack; needs ffmpeg or Docker
  for the test stream and a generated test video).
- Concept screens: `node scripts/render-design.mjs` regenerates `docs/design/screens`. Change
  a screen in `docs/design/src` in the same commit as the UI it shows.

## Conventions

- **No competitor naming.** Never name or compare adda to any other
  product/brand — streaming, chat, or messaging apps included — in
  code, docs, comments, site content, or commits. Describe features in
  adda's own words; the product stands on its own.
- **WebSocket contract is sacred.** The message types in
  `backend/modules/realtime/protocol.py` and `web/src/lib/types/realtime.ts`
  (transport in `web/src/lib/api/ws.ts`) must stay in sync. When adding
  a realtime feature, define the type in both places first.
- Backend is async-first (async SQLAlchemy, asyncpg, `redis.asyncio`). Never use
  blocking calls in request handlers.
- **Layout:** `core/` holds shared infra — `config.py`, `database.py`,
  `redis_client.py`, `seed.py`, `security/` (jwt/password/deps/guards),
  `exceptions.py`. The shared `models/` package and `alembic/` sit at the
  backend root. Features live in `modules/<feature>/` — one folder per feature
  (`auth`, `users`, `communities`, `chat`, `streaming`, `recordings`, `videos`, `browse`, `stats`,
  `realtime`, `notifications`). Channel roles:
  the owner is `Community.owner_id`; moderators are `ChannelModerator` rows.
  "Community" is the internal name for a streamer's channel; the UI, docs and
  public text say "channel".
- **Every write needs an account.** Guests are read-only, enforced in the
  backend (REST and WebSocket), never only in the UI. Anonymous chat hides the
  author from viewers only; the account is always recorded.
- **Per-module shape:** `router.py` for public routes (+ `admin_router.py` for
  `/admin/*` routes), `webhook.py` for external webhooks, `schemas.py` for
  Pydantic DTOs, and a `service/` package of short focused files (e.g.
  `queries.py`, `commands.py`). Routers stay thin; logic lives in `service/`.
- **Every page uses one width.** The app shell wraps pages in `PageContainer` (1280px); do
  not add wider per-page wrappers. Directory filters and page numbers live in the address.
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
  API calls live in `src/lib/api`, DTOs in `src/lib/types`.

## Ports

- Web: 5173 · Backend: 7001 · Postgres: 5432 · Redis: 6379
- mediamtx: RTMP 1935 · HLS 8888 · WebRTC 8889 · API 9997
