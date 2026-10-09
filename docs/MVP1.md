# MVP1 — Functionally Complete Release

MVP1 is the smallest set of **closed flows** adda can be marketed on.
Every flow below works end-to-end: entry → happy path → error paths →
exit. Nothing ships half-wired. If a flow can't be demonstrated live in
one sitting, it is not in MVP1.

**The product equation MVP1 must back up:**

> **Community channels + live streaming + direct messages, self-hosted.**
> Structured community channels with realtime chat, live streaming with
> recordings, and fast one-to-one direct messages — one `docker compose
> up` on your own server, a desktop console that connects to it, and
> docs that walk you through every step.

---

## The flows (all must close)

### F1 — Auth (email + password only)

| Step | Status |
|---|---|
| Register (email, password, display name) → signed in | ✅ built |
| Login; 2FA challenge when enabled (TOTP) | ✅ built |
| OTP email login (6-digit code via SMTP) | ✅ built |
| Forgot password → SMTP email → reset form → login | ✅ built |
| Change password (settings), set-password for accounts without one | ✅ built |
| Session: transparent refresh on 401, logout everywhere-clean | ✅ built |
| Profile: display name, bio, avatar URL | ✅ built |

**Included minimum:** SMTP-backed password reset + OTP login + TOTP 2FA.
Registration is instant — no email verification (self-hosted; admin owns
the mail domain).

**Cut from MVP1:** email verification.
All backend work exists; they re-enter in MVP2 after UI polish.

### F2 — Discover & watch

| Step | Status |
|---|---|
| Browse page: live-first grid, viewer counts, search | ✅ built |
| Channel page (`/channel/[slug]`) with SSR + OG metadata | ✅ built |
| HLS player: auto-start, reconnect watchdog, Safari native | ✅ built |
| Live badge + viewer count (WS-pushed, mono tabular) | ✅ built |
| Offline state: player hidden, "offline" panel + follow CTA | ⚠️ verify |
| Dead slug → clean 404, private → access message | ⚠️ verify |

### F3 — Channel lifecycle (owner)

| Step | Status |
|---|---|
| Create channel (slug validation, duplicate error) → auto `general`/`announcements`/`live` | ✅ built |
| My-channels list → channel management | ✅ built |
| Stream setup: reveal/copy key, RTMP URL, OBS instructions | ✅ built |
| Rotate key → old publisher kicked, confirm dialog | ✅ built |
| Edit (title, banner, description) · delete (typed confirm) | ⚠️ verify |

### F4 — Going live (the money flow)

| Step | Status |
|---|---|
| OBS paste URL+key → publish-auth webhook validates | ✅ built |
| Live event → WS `stream_status` push → browse re-ranks | ✅ built |
| Player connects, viewer count ticks, uptime runs | ✅ built |
| Stream ends → offline everywhere within seconds | ✅ built |
| Owner/admin force-stop | ✅ built |

Demo bar: paste key in OBS → live on the homepage grid before the
encode finishes. If that's not true, nothing else matters.

### F5 — Chat

| Step | Status |
|---|---|
| Open channel → WS subscribe → history load (cursor pagination) | ✅ built |
| Send → optimistic → echoed → others receive | ✅ built |
| Presence (in-channel count) | ✅ built |
| Moderation: delete message (mods/owner/admin) | ✅ built |
| Reconnect: backoff, resubscribe, history catch-up | ✅ built |

**Cut from MVP1 UI:** reactions, replies, edits — backend may support
them; the UI ships send + delete only. One chat experience, done.

### F6 — Follows

| Step | Status |
|---|---|
| Follow/unfollow on channel page | ✅ built |
| Following rail on home with live indicators | ✅ built |

### F7 — Recordings

| Step | Status |
|---|---|
| Stream ends → recording exists on disk, listed on channel page | ✅ built |
| Play in-page; download link | ⚠️ verify download |
| Delete: admin/console only (owners via console) | ✅ built |

### F8 — Operator console (desktop)

| Step | Status |
|---|---|
| First run: server URL connect screen → operator login | ✅ built |
| Dashboard (stats + live now), streams (force-stop), channels (members, key rotate, suspend, delete), users (roles, suspend, reset, delete), recordings, chat moderation, settings | ✅ built |
| ⌘K palette, ⌘1–⌘7, native live notifications | ✅ built |
| Packaged builds: macOS + Windows + Linux (`.deb`/`.AppImage`) | ⚠️ verify fresh bundles |

### F9 — Direct messages (minimal) — 🆕 new build

One-to-one text DMs. The smallest DM system that is still *complete*:
threaded, realtime, unread-tracked, blockable, notified. No group DMs,
no typing indicators, no read receipts, no attachments, no editing.

**Backend — new `modules/dms/`** (follows the per-module shape):

| Item | Notes |
|---|---|
| Models: `dm_threads` (unique user pair) · `dm_messages` (thread, sender, body, created_at) · per-thread `last_read_message_id` · `user_blocks` | one alembic migration |
| WS contract **first**: `dm.message`, `dm.read`, `dm.thread.updated` | `protocol.py` + `realtime.ts` in the same commit (sacred rule) |
| Routing rides the existing `user:<id>` queue | fan-out via existing Redis pub/sub; online dots reuse presence |
| REST: list threads (peer, last message, unread count) · open/create thread by user id · history (cursor pagination) · mark read · block/unblock | `router.py` + `schemas.py` + `service/` |
| Guardrails: blocked pair → sender gets one generic failure, no thread; DMs allowed between any two account-holders (self-hosted trust model) | admin visibility: none (DMs are private by design — document this) |

**UI — web + desktop share behavior, not code:**

| Item | Notes |
|---|---|
| Inbox: thread list — peer name + avatar, last message, relative time, unread accent dot + bold, online dot | chat anatomy from DESIGN.md §7 |
| Thread view = the existing chat message anatomy; history loads before first message | |
| Start DM: click username in channel chat / members list → "Message" → opens thread (create-on-first-message) | |
| Unread: top-bar badge (web) · tab strip badge (desktop); mark-read on thread view | |
| Notifications: web toast + desktop native notification when a DM lands while you're not viewing that thread | reuses the `stream_status` notification path |
| Block/unblock: from thread header + profile; unblock in settings | |
| Reconnect: backoff, resubscribe, history catch-up, unread recompute | same machinery as channel chat |

**Demo bar:** two browsers, two accounts — message from A lands on B's
screen with sound-less toast in <1s; B's inbox badge increments; B
replies; A sees it. Kill B's WS mid-conversation → reconnect → history
and unread state are correct.

### F0 — First run (self-hoster)

| Step | Status |
|---|---|
| `./scripts/install.sh` → asks domain + admin email, generates every secret (Postgres, JWT, admin password), writes `.env` | ✅ built |
| One command → stack up behind Caddy with automatic HTTPS; only 80/443/1935 public | ✅ built |
| Admin password shown once; changeable in Settings | ✅ built |
| Seeded admin login documented; no default passwords in prod | ✅ built |
| Dev mode preserved: `make up` (dev overlay, test users, localhost ports) | ✅ built |
| Site guides: quickstart + self-hosting match the installer reality | ✅ built |
| `.env.example` complete — no undocumented vars | ⚠️ verify |
| Fresh VPS: DNS → install → go live in ≤10 min | ⚠️ verify end-to-end |

---

## The no-slop bar (blocking, not optional)

MVP1 marketing runs on screenshots. Every surface ships re-skinned to
`/DESIGN.md` before release:

1. Token swap: web `globals.css` + desktop `index.css` → ink ladder +
   marigold (ink-on-accent), live red separate; site re-themed via
   `--sl-color-*`
2. Type: Space Grotesk (web + site), mono tabular for all counts/keys
3. Motion: spring tiers + live pulse + going-live crossfade (§6)
4. File split: one exported component per file — the 18 named
   multi-component files are split as they're re-skinned
5. Recognition test passes on every surface with the logo covered

## Ship checklist

- [ ] Every F0–F9 row is ✅ (walk each flow manually, both apps)
- [ ] Error paths demonstrated: wrong password, 2FA wrong code, expired
      reset link, dead slug, duplicate slug, key rotate while live,
      WS kill mid-chat, DM to blocked user, DM reconnect mid-thread
- [ ] Fresh VPS: `install.sh` → DNS → go live in ≤10 min (full walkthrough)
- [ ] `ruff` + `pyright` clean · web lint/build clean · desktop lint
      clean · site build clean
- [ ] Anti-slop checklist (DESIGN.md §8) on all three surfaces
- [ ] Screenshots for site/README re-captured on the new design
- [ ] `site/` quickstart matches reality (ports, env, seeded admin)
- [ ] Site docs updated: DM privacy note (admins cannot read DMs) in
      FAQ + admin guide

## Explicitly deferred (MVP2+)

email verification · private channels +
join-request approvals · restricted channels / permission grants · chat
reactions/replies/edits UI · emotes · group DMs · typing indicators ·
read receipts · DM attachments/media · DM search & export ·
clips/VOD chapters/transcoding · native mobile · multi-node fan-out
docs · self-service account deletion
