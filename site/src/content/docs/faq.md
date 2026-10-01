---
title: FAQ
description: Frequently asked questions and troubleshooting.
---

## Which ports does adda need?

5173 (web), 7001 (API), 1935 (RTMP ingest), 8888/8889 (HLS/WebRTC playback).
Postgres (5432), Redis (6379), and the mediamtx API (9997) should stay
internal.

## Redis fails to start: "port 6379 already allocated"

Something else on the machine already uses Redis's port (another project's
container or a local Redis). Either stop it, or change `REDIS_PORT` in `.env`
and `REDIS_URL` to match, then `make up` again.

## macOS says the app is from an unknown developer

Desktop installers are currently unsigned. Right-click the app → **Open** →
**Open** in the dialog (macOS), or
`xattr -d com.apple.quarantine /Applications/adda.app` in a terminal.
Windows SmartScreen: **More info → Run anyway**.

## Is there transcoding / multi-bitrate?

No — playback is **passthrough HLS**: viewers receive your encoder's original
bitrate. That keeps CPU usage tiny and latency low, but means you should pick
a sane OBS output (720p @ ~4–5 Mbps works for most audiences). Add a CDN in
front of `HLS_PORT` for large audiences. Multi-bitrate is on the roadmap.

## How do I reset the admin password?

If SMTP is configured, use **Forgot password** on the login page. Otherwise,
quickest path is direct in the database:

```bash
docker compose exec postgres psql -U adda -d adda \
  -c "delete from users where email='admin@example.com';"
docker compose restart backend   # re-seeds the superadmin from .env
```

:::caution
Deleting a superadmin cascades to communities they own. Prefer password-reset
email in real deployments.
:::

## Where are recordings stored?

`./recordings/` at the repo root (bind-mounted into mediamtx and the
backend). Back that folder up; recordings are not stored in Postgres.

## Can one instance host many streamers?

Yes — that's the point. Every community gets its own stream key and RTMP path
(`community/<id>`), and the Browse page shows everything live across the
instance. Two streamers can be live at the same time; only your server's
uplink bounds it.

## How do I enable Google sign-in?

Create an OAuth 2.0 Web client ID at
[Google Cloud Console](https://console.cloud.google.com/apis/credentials),
then set `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` in `.env` and
rebuild the frontend (`make up --build frontend`).

## Chat says "offline" / WebSocket won't connect

- Check `/ws` isn't stripped or blocked by your reverse proxy (upgrade
  headers are required — see the [self-hosting guide](/guides/self-hosting/))
- The access token expires: the client refreshes automatically, but forcing
  a re-login (`Settings → Log out`) clears stale tokens

## How do I see the full API docs?

Set `IS_DEBUG=true` in the backend environment and open `http://localhost:7001/docs`
for the interactive OpenAPI documentation.
