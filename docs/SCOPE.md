# adda — Scope (v1)

adda is a **self-hosted, web-only live-streaming platform**. You run it on
your own server with `docker compose up`, point OBS at it, and broadcast to
a web page with realtime chat and automatic recordings.

This document replaces `MVP1.md`. It defines what v1 is, what it is not, and
the order of work to finish it. v1 is a _completed_ product with a small,
closed scope — not a full platform.

## Goal

**adda is a self-hosted live-streaming platform for the browser, built for
people who run their own server.** Install it with one command, stream from
OBS, and viewers watch and chat in realtime while every broadcast is
recorded. It is small enough for one host and finished enough to trust.

**Audience: self-hosters.** The person who runs adda is the primary user. So
install, upgrade, backup and operation matter as much as the viewer pages,
and the docs are written for someone running this on their own VPS.

**Social, but small.** One host is no reason for a lifeless site. adda keeps a
set of social features that make a channel feel alive: chat with replies,
mentions, reactions, emotes, pins and polls; follows and notifications; channel
profiles and recording comments. It leaves out the heavy ones (DMs,
communities, groups).

**Functional means tested.** Every screen in
[design/SCREENS.md](design/SCREENS.md) exists in the app, talks to the real
backend, shows its loading, empty and error states, and belongs to a flow in
[FLOWS.md](FLOWS.md) whose acceptance criteria are covered by automated tests.
A screen without a working flow behind it does not ship.

**Success looks like:**

1. A stranger goes from `git clone` to a live stream in under 10 minutes by
   following the docs.
2. Every flow below works end to end, including its error states, and has an
   automated test.
3. The marketing site shows the product convincingly without a live server:
   real screenshots, a short walkthrough and measured numbers.
4. The repo reads as maintained: CI green, docs match the code, tagged
   `v1.0.0`.

**Non-goals:** a hosted service (no accounts on our servers, no billing),
desktop or mobile apps, multi-tenant communities, DMs, and competing on scale
with large platforms. There is no deadline; scope is what is listed here, done
well.

## Product

> Your own live-streaming site. Install it, paste a stream key into OBS, go
> live. Viewers watch and chat in the browser. Streams are recorded for you.

**Web only.** There is no desktop app and no mobile app. Every role —
viewer, streamer, admin — uses the browser.

**Distribution.** adda is shipped as source plus a Docker Compose stack and an
install script. There is **no hosted demo**: streaming ingest (RTMP/HLS) needs
a server that cannot run on Vercel. The public face is the **marketing and docs
site** (`site/`, on Vercel), which carries the proof: screenshots, a recorded
walkthrough, the architecture, and measured numbers. The site is being moved
from Astro to Next.js (docs as MDX); it stays a separate app from `web/` so a
self-hosted install never ships marketing pages.

## The flows (all must close)

Acceptance criteria, tests and the screen map are in [FLOWS.md](FLOWS.md).
Screen numbers refer to [design/SCREENS.md](design/SCREENS.md).

| ID  | Flow                | Screens            | Summary                                                                                            |
| --- | ------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| F0  | Install             | —                  | `./scripts/install.sh`: secrets generated, stack up behind Caddy with HTTPS, admin created         |
| F1  | Accounts            | 08, 09, 10, 12     | Register, login, rotating refresh tokens, logout, change password, email reset link, profile       |
| F2  | Discover and watch  | 01, 03, 06, 19, M1 | Live-first home, search, channel page (SSR + OG), HLS player with reconnect, viewer count          |
| F3  | Channel lifecycle   | 14, 17             | Create channel, stream key and RTMP URL, rotate key (kicks publisher), edit, delete                |
| F4  | Go live             | 14, 15, 20, 21     | OBS publishes, webhook authorises, live pushed over WebSocket, offline within seconds, ended state |
| F5  | Chat and moderation | 02, 07, 15, 18, 21 | History, send, presence, delete, slow mode, followers-only, timeouts and bans, reconnect catch-up  |
| F6  | Follows             | 01, 03, 05         | Follow, unfollow, follower count and "since", following rail with live indicators                  |
| F7  | Recordings          | 03, 04, 20         | Recording and thumbnail on stream end, processing state, play, download                            |
| F8  | Operate             | —                  | Seeded admin; force-stop, suspend and delete through the documented admin API (no admin UI)        |
| F9  | Guests              | 07                 | Read-only visitors: browse, watch, read chat and polls. No chatting, reacting, voting or following |
| F10 | Chat extras         | 02, 15, M2         | Replies, @mentions, message reactions, pinned message                                              |
| F11 | Emotes              | 16, 02             | Streamer uploads emotes for the channel; chat renders `:name:`                                     |
| F12 | Polls               | 02, 15, M2         | Streamer starts a poll; viewers vote; live results; closes and keeps the result                    |
| F13 | Notifications       | 11, 13             | In-app bell plus optional email: followed channel live, mentioned, replied to                      |
| F14 | Identity mode       | 12, 02             | An account appears under its name or as "Anonymous" (still recorded under the account)             |
| F15 | Channel profile     | 05, 03, 17         | About, links, banner, follower count, badges, announcements, moderators                            |
| F16 | Recording comments  | 04                 | Timestamped comments on a past broadcast; click a timestamp to seek                                |

### Who can do what

Every interaction is performed by an account and recorded against it in the
backend. Guests are read-only.

| Capability                                       | Guest | Account |
| ------------------------------------------------ | ----- | ------- |
| Browse, watch, read chat, see polls and profiles | yes   | yes     |
| Chat, reply, mention, react, vote                | no    | yes     |
| Follow channels, notification bell, email alerts | no    | yes     |
| Create a channel, stream, upload emotes          | no    | yes     |
| Comment on recordings                            | no    | yes     |

Channel roles on top of an account: **owner** (one per channel; stream key,
settings, emotes, moderators), **moderator** (delete messages, time out and ban,
reveal an anonymous author, pin) and **follower** (a badge, nothing more). The
server **admin** can act on any channel through the admin API.

**Identity mode.** An account chooses how it appears to other viewers: under
its name, or as "Anonymous". Anonymous hides the name from viewers only — the
backend still records the account, and the channel owner, its moderators and
the admin can see who is behind a message for moderation. Blocking and
abuse handling therefore work the same in both modes.

**Email.** SMTP is optional configuration. When set, adda sends password-reset
links and (opt-in per user) "a channel you follow is live" emails, limited to
one per channel per hour. When unset, those features are hidden, the reset page
tells people to ask the host, and the host can reset any password through the
admin API. The rest of the product works unchanged.

The chat backend behind F5 and F9–F14 is specified in [CHAT.md](CHAT.md).

## Out of scope for v1

Stated plainly in the README and site, in the same spirit as a "what is not
built" table.

- Desktop app (Tauri console), native mobile, and an admin UI (admin actions
  stay available through the API)
- Direct messages and blocks
- Community hierarchy: multi-channel communities, join requests, memberships
- OTP login, TOTP 2FA, set-password flow, email verification
- Social login
- Message edits and direct messages between users
- A light theme, and an admin web UI
- Email digests, marketing mail, and any mail beyond reset links and live alerts
- Low-latency WebRTC playback (HLS only)
- Clips, transcoding ladders, VOD chapters
- Multi-node deployment documentation

This code is **not deleted**: it remains in git history (everything before
commit `b51fa50`) if it is ever needed again.

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
- **Design.** Every surface follows `/docs/DESIGN.md` and its anti-slop checklist.

## Milestones

### M0 — Cleanup

- [x] Keep the pre-cleanup code in git history (everything before `b51fa50`)
- [x] Remove the desktop app (code, CI, compose, Makefile, site docs)
- [x] Remove DMs (routes, models, protocol messages, migration)
- [x] Remove OTP, 2FA and the set-password flow; add the missing
      forgot-password page so the email reset flow closes end to end
- [ ] Simplify the community surface (moved to M1: it needs the messages
      migration). The internal `Community` name stays; the UI, API docs and
      README say "channel"
- [x] Fix `AGENTS.md` (it described the old Vite/TanStack web app)
- [x] `VERSION` file
- [x] Tooling centralised at the root (husky, lint-staged, commitlint, oxlint,
      prettier, editorconfig, tsconfig.base); lockfile committed; configs moved
      to `infra/`; `apps/web` flattened to `web/` and the `@adda/*` packages
      folded into `web/src/lib/` (single client, so no shared-package layer)
- [x] Concept screens for every flow ([design/SCREENS.md](design/SCREENS.md))
- [x] Docs updated from the screens: SCOPE, FLOWS, CHAT, DESIGN, README, AGENTS;
      existing site pages made truthful (full site rebuild is M7)

### M1 — Foundations

- [x] pytest harness: embedded Postgres, real migrations, in-memory Redis; CI runs it
- [x] Auth and token-rotation tests (found and fixed: suspended users' access
      tokens kept working, reset links were reusable, follow was not idempotent)
- [x] Stream webhook and lifecycle tests
- [x] Messages keyed by channel (`community_id`); text-room `channels`,
      memberships and join requests removed; moderators added; chat history
      is persisted and the web chat loads it
- [x] `@app.on_event("startup")` replaced by a lifespan handler

### M2 — Realtime chat platform (F5, F9–F12)

Backend and web together, in the order of [CHAT.md](CHAT.md): messages and
identity, badges, replies and mentions, reactions, pins, emotes, polls,
moderation and rate limits. Contract first: protocol types in both
`protocol.py` and `web/src/lib/types/realtime.ts`.

- [ ] Each feature has pytest coverage, including guests being rejected
- [ ] Two-instance test: chat, polls and reactions reach clients on both
- [ ] Screens 02, 07, M2 built and wired

### M3 — Accounts and notifications (F1, F13, F14)

- [ ] Identity mode setting and its reveal rule, audited
- [ ] Notifications: bell, mark read, preferences; optional email with the
      once-per-hour limit; SMTP-off behaviour
- [ ] Screens 08–13 built and wired

### M4 — Streamer experience (F3, F4, F7, F15, F16)

- [ ] Studio: setup, live control, emotes, channel page, moderators
      (screens 14–18)
- [ ] Channel profile, announcements, followers, badges (05)
- [ ] Recording comments, processing and ended states (03, 04, 20)
- [ ] Offline, not found and reconnecting states (19, 21)

### M5 — Viewer polish (F2, F6)

- [ ] Home, browse and search, mobile layouts (01, 06, M1)
- [ ] New logo and favicon in marigold; remove the purple gradient mark
- [ ] Anti-slop checklist and `pnpm check:design` clean

### M6 — Operability and verification (F0, F8)

- [ ] Metrics endpoint, structured logging, health checks
- [ ] Backup and restore notes, tested
- [ ] Clean-VPS install in ten minutes, timed; compose smoke test in CI
- [ ] Playwright end-to-end: register, create channel, go live with an ffmpeg
      test publisher, watch, chat, poll, react
- [ ] Latency and fan-out measurements, with the method

### M7 — Docs and site

- [ ] `docs/` index and architecture diagram (OBS, mediamtx, backend, Redis,
      WebSocket, viewers); README rewritten with a built / not built table
- [ ] Marketing and docs site moved to Next.js (MDX docs), screenshots taken
      from the real app, measured numbers, honest "not in v1" section
- [ ] Site deployed on Vercel

### M8 — Release

- [ ] Governance files (`LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`,
      `CODE_OF_CONDUCT.md`)
- [ ] Point the install script and docs at `main` (they use `dev` until then)
- [ ] Tag `v1.0.0`
