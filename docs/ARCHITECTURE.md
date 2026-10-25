# adda — Architecture

How the pieces fit. Scope and acceptance criteria are in [SCOPE.md](SCOPE.md) and
[FLOWS.md](FLOWS.md); the chat design is in [CHAT.md](CHAT.md); running it in
production is in [OPERATIONS.md](OPERATIONS.md).

```
OBS ──RTMP──▶ mediamtx ──auth webhook──▶ backend (FastAPI) ◀──▶ Postgres
                 │                            │   ▲
                 └──HLS──▶ viewers' browsers  │   └── Redis (pub/sub, presence,
                                              │        rate limits, poll tallies)
                     web (Next.js) ◀──REST + WebSocket──┘
                     Caddy: HTTPS in front of everything
```

## Services

| Service  | Role                                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| mediamtx | Accepts RTMP from the encoder, writes HLS for viewers and MP4 recordings. Asks the backend to authorise every publish            |
| backend  | REST API, the WebSocket gateway, the stream monitor, thumbnails, video preparation (ffmpeg), emails                              |
| Postgres | The record: accounts, channels, messages, polls, moderation log, notifications                                                   |
| Redis    | Speed and fan-out: pub/sub between backend instances, presence, rate limits, slow-mode keys, live poll tallies                   |
| web      | Next.js app: SSR for browse and channel pages, client-side for everything signed-in                                              |
| Caddy    | HTTPS and routing in production (`--profile prod`): `/api`, `/ws`, `/health` to the backend, `/hls` to mediamtx, the rest to web |

## The streaming path

1. A streamer's encoder publishes `rtmp://host:1935/community/<channel id>?key=<key>`.
2. mediamtx calls `POST /api/streams/auth`; the backend allows the publish only if the
   key matches the channel (`modules/streaming/webhook.py`). Reads and the control API
   are excluded, so viewing never needs a key.
3. The **stream monitor** (`modules/streaming/service/monitor.py`) polls mediamtx every
   5 s. On a live or offline transition it records the start time, broadcasts
   `stream_status`, notifies followers (bell, and opted-in email at most once an hour
   per channel) and starts or stops the thumbnail worker.
4. Viewers play `…/hls/community/<id>/index.m3u8` with hls.js (native HLS on Safari).
5. mediamtx writes `recordings/community/<id>/*.mp4`; the backend lists and serves them.

## Browse, search and uploaded videos

- **Browse and search** (`modules/browse`): `GET /api/browse/channels|recordings|videos`
  return `{items, total, page, page_size}` for the directory pages, with a text filter,
  a status or channel filter, a sort and a page (at most 48 per page); `GET /api/search`
  returns a few channels, recordings and videos for the search box. Private and suspended
  channels never appear. Live state and viewer counts come from mediamtx and Redis, so
  filtering and sorting happen in memory after one query: fine at self-hosted scale.
- **Uploaded videos** (`modules/videos`, table `videos`): the channel owner creates a
  video with its size, then sends the file in 8 MB parts at an explicit offset
  (`PUT /videos/{id}/chunk?offset=`); the server's own file size is the source of truth,
  so a wrong offset is a 409 and the client resumes from the count it is given. On
  `complete` a background task inspects the file with ffprobe, accepts only codecs browsers
  play directly, remuxes MP4-family files with the index first (`-c copy -movflags
+faststart`, no re-encoding), takes a poster frame and marks the video `ready` or
  `failed` with the reason. Files live in `uploads/videos/<id>/`. A restart resumes videos
  that were being prepared, and uploads untouched for a day are removed. Media is served
  by `FileResponse`, so range requests work; unlisted and private media accept the
  viewer's token as `?token=` because a video element cannot send a header.
- **Profile extras** (`modules/users/profile_router.py`): avatar upload (sniffed by bytes,
  stored in `uploads/avatars/`) and the status line (`status_emoji`, `status_text`,
  `status_expires_at`; an expired status reads as unset).

## Realtime

One WebSocket endpoint (`/ws`). Every backend instance listens to one Redis channel and
delivers each event to its local sockets, so any number of instances work behind one
Redis (proved by `backend/tests/test_two_instances.py`). Chat messages are written to
Postgres first and then published; reactions and poll updates are coalesced before
publish. Presence is a Redis set per topic. Guests connect without a token and are
read-only, enforced in the gateway.

The message types are the contract, defined in `backend/modules/realtime/protocol.py`
and `web/src/lib/types/realtime.ts`; they change together.

## Backend layout

```
backend/
├── core/        config, database, redis, security, images, metrics, logging, seed
├── models/      SQLAlchemy models, one per file
├── alembic/     migrations (applied on container start and by `make migrate`)
└── modules/<feature>/   router.py, schemas.py, service/ (short focused files)
    auth  users  communities  chat  notifications  streaming  recordings  videos  browse  stats  realtime
```

- Routers stay thin; logic is in `service/`. Admin endpoints live in their feature module
  behind `require_admin`.
- "Community" is the internal name for a streamer's channel. The owner is
  `Community.owner_id`; moderators are `ChannelModerator` rows.
- **Every write needs an account** and is enforced here, never only in the UI. Anonymous
  chat hides the author from viewers only (`modules/chat/service/identity.py`); the
  account is always recorded and moderators can reveal it, audited in `mod_actions`.

## Web layout

```
web/src/
├── app/         routes (App Router): /, /live, /channels, /videos, /recordings, /search, /about,
│                /channel/[slug] (+ /recording, /video/[id], /profile), /studio/*, /settings/*, auth pages
├── components/  one exported component per file; browse/, search/, home/, channel/, studio/,
│                settings/, about/, ui/ (primitives)
└── lib/         api (typed client, socket, chunked upload), types (DTOs), hooks (chat,
                 notifications, browse, videos), config
```

Every page renders inside `PageContainer`, a centred column capped at 1280px (the top bar and
footer share it). Directory filters and the page number live in the address
(`lib/use-url-params.ts`), so every view can be linked. Server components fetch with `API_SSR_URL`; client code uses the typed client with
tokens in `localStorage`. `/design/<screen>` renders screens with invented data in
development only, for comparison with `docs/design/screens`.

## Testing

| Layer             | How                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| API and WebSocket | `make test`: pytest against an embedded Postgres with the real migrations and an in-memory Redis |
| Two instances     | `ADDA_TEST_REDIS_URL=… pytest tests/test_two_instances.py` (two real processes, real Redis)      |
| Browser           | `pnpm e2e`: Playwright against the running stack, with an ffmpeg test-pattern publisher          |
| UI rules          | `pnpm check:design` (banned patterns from DESIGN.md), `pnpm lint`, `pnpm typecheck`              |
