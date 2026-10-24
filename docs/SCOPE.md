# adda — Scope (v1)

adda is a **self-hosted, web-only live-streaming platform**. You run it on
your own server with `docker compose up`, point OBS at it, and broadcast to
a web page with realtime chat and automatic recordings.

This document replaces `MVP1.md`. It defines what v1 is, what it is not, and
the order of work to finish it. v1 is a _completed_ product with a small,
closed scope — not a full platform.

## Product

> Your own live-streaming site. Install it, paste a stream key into OBS, go
> live. Viewers watch and chat in the browser. Streams are recorded for you.

**Web only.** There is no desktop app and no mobile app. Every role —
viewer, streamer, admin — uses the browser.

**Distribution.** adda is shipped as source plus a Docker Compose stack and an
install script. There is **no hosted demo**: streaming ingest (RTMP/HLS) needs
a server that cannot run on Vercel. The public face is the **marketing and docs
site** (`site/`, Astro, on Vercel), which carries the proof: screenshots, a
recorded walkthrough, the architecture, and measured numbers.

## The flows (all must close)

| ID  | Flow               | Summary                                                                                                   |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| F0  | Install            | `./scripts/install.sh` → secrets generated, stack up behind Caddy with HTTPS, admin created               |
| F1  | Auth               | Register, login, rotating refresh tokens, logout, change/reset password, profile                          |
| F2  | Discover and watch | Live-first browse grid, channel page (SSR + OG metadata), HLS player with reconnect, viewer count         |
| F3  | Channel lifecycle  | Create channel, reveal/copy stream key + RTMP URL, rotate key (kicks publisher), edit, delete             |
| F4  | Go live            | OBS publishes → publish-auth webhook → live pushed over WebSocket → offline within seconds on stop        |
| F5  | Chat               | History, send, presence count, delete message, moderation (timeout/ban), reconnect with catch-up          |
| F6  | Follows            | Follow/unfollow, followers tab, following rail with live indicators                                       |
| F7  | Recordings         | Stream end → recording + thumbnail on the channel page → play in page, download                           |
| F8  | Operate            | Seeded admin account; force-stop, suspend and delete through the documented admin API (no admin UI in v1) |

## Out of scope for v1

Stated plainly in the README and site, in the same spirit as a "what is not
built" table.

- Desktop app (Tauri console), native mobile, and an admin UI (admin actions
  stay available through the API)
- Direct messages and blocks
- Community hierarchy: multi-channel communities, join requests, memberships
- OTP login, TOTP 2FA, set-password flow, email verification
- Social login
- Reactions, replies, message edits, emotes
- Low-latency WebRTC playback (HLS only)
- Clips, transcoding ladders, VOD chapters
- Multi-node deployment documentation

This code is **not deleted**. It moves to an `archive/v3-full` branch so
`main` shows only the finished product.

## Quality bar

The siblings in this portfolio (Algomind, DropGrid, Voice Studio) set it.

- **Tests.** pytest for auth, token rotation, the stream webhooks and lifecycle
  (publish-auth, live, end, key rotation), recordings, and the WebSocket chat
  gateway. A Playwright smoke test covers register → create channel → go live
  (ffmpeg test-pattern publisher) → watch → chat. CI runs all of it.
- **Operability.** Health endpoint, structured logs, Prometheus metrics,
  documented backup of Postgres and recordings, tested install on a clean VPS.
- **Realtime proof.** Two backend instances behind Redis fan-out, with a test
  that chat and `stream_status` reach clients on both.
- **Measured claims.** Glass-to-glass HLS latency and chat fan-out numbers,
  with the method, published on the site.
- **Governance.** `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `VERSION`, release script.
- **Docs.** A `docs/` index: architecture, realtime protocol, streaming
  pipeline, deployment, CI, design. Behavior changes update docs in the same
  commit.
- **Design.** Every surface follows `/DESIGN.md` and its anti-slop checklist.

## Milestones

### M0 — Cleanup

- [x] Branch `archive/v3-full` from the pre-cleanup `adda-v3`
- [x] Remove the desktop app (code, CI, compose, Makefile, site docs)
- [x] Remove DMs (routes, models, protocol messages, migration)
- [x] Remove OTP, 2FA and the set-password flow; add the missing
      forgot-password page so the email reset flow closes end to end
- [ ] Simplify the community surface: one chat per channel, no join requests
      or memberships UI. The internal `Community` name stays; the UI, API
      docs and README say "channel"
- [x] Fix `AGENTS.md` (it described the old Vite/TanStack web app)
- [ ] Move `@app.on_event("startup")` to a lifespan handler
- [x] `VERSION` file
- [x] Tooling centralised at the root (husky, lint-staged, commitlint, oxlint,
      prettier, editorconfig, tsconfig.base); lockfile committed; configs moved
      to `infra/`; `apps/web` flattened to `web/` and the `@adda/*` packages
      folded into `web/src/lib/` (single client, so no shared-package layer)
- [ ] Governance files (`LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`)
- [ ] Rewrite `README.md` and the dual web/desktop columns in `DESIGN.md`

### M1 — Tests and CI

- [ ] pytest harness with a test database and Redis
- [ ] Auth and token-rotation tests
- [ ] Stream webhook and lifecycle tests
- [ ] WebSocket chat gateway tests, including two-instance fan-out
- [ ] Playwright smoke flow with an ffmpeg test publisher
- [ ] CI runs lint, types, tests and builds

### M2 — Close the open flows

- [ ] Offline state, dead-slug 404 and private-channel handling
- [ ] Channel edit and delete with typed confirmation
- [ ] Recording download
- [ ] Chat moderation: timeout, ban, slow mode
- [ ] `.env.example` complete; clean-VPS install walkthrough in ten minutes

### M3 — Operability

- [ ] Metrics endpoint and structured logging
- [ ] Backup and restore notes, tested
- [ ] Latency and fan-out measurements with method

### M4 — Docs and site

- [ ] `docs/` index and architecture diagram (OBS → mediamtx → backend →
      Redis → WebSocket → viewers)
- [ ] README with a status table (built / not built) and screenshots
- [ ] Marketing site: recorded walkthrough, screenshots recaptured on the
      current design, measured numbers, honest "not in v1" section
- [ ] Site deployed on Vercel

### M5 — Release

- [ ] Anti-slop checklist on web and site
- [ ] Tag `v1.0.0`
