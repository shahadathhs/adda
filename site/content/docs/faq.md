---
title: "FAQ"
description: "Common questions and the fixes for common problems."
---

## Which ports does adda need?

Open to the internet: **80** and **443** (the web app, through Caddy) and **1935** (RTMP, for
OBS). Everything else (Postgres, Redis, the backend on 7001, mediamtx on 8888 and 9997) is
published on `127.0.0.1` only.

## I started streaming but the channel stays offline

On a development setup the encoder must reach mediamtx, and mediamtx must reach the backend.
Check the mediamtx log (`docker compose logs mediamtx`). A line like
`failed to authenticate … no such host` means mediamtx cannot find the backend: run
`make infra` (it points mediamtx at the backend running on your machine). A `403` means the
key is wrong: copy the address from **Studio → Setup** again.

## Is there transcoding or several qualities?

No. Playback is passthrough HLS, so viewers receive the quality your encoder sends. That keeps
CPU use tiny. Choose a sane output in OBS (720p at 4 to 5 Mbps suits most audiences) and put a
CDN in front of the HLS path for large audiences.

## How far behind the live stream is playback?

A few seconds. It is HLS, not WebRTC. The Studio's Live tab shows the same delay viewers see.

## Do I need an email server?

No. Without `SMTP_HOST`, reset links are written to the backend log and the email controls in
Settings do not appear. Add SMTP when you want emailed reset links and opt-in live emails.

## How do I reset the admin password?

If email is set up, use **Forgot password** on the sign-in page. Otherwise an admin can set a
new password through the [admin API](/docs/guides/admin) (`POST /api/admin/users/{id}/reset-password`).

## Where are recordings stored?

In `recordings/` next to `compose.yaml`, written by mediamtx as MP4 files. They are not in the
database. [Back that folder up](/docs/operations) together with `uploads/` (emotes and banners).

## Can one server host many streamers?

Yes. Every channel has its own stream key and RTMP path. Two channels can be live at once; your
server's upload bandwidth is the limit.

## Chat shows "Reconnecting…"

The WebSocket dropped. The page retries with a growing delay and, once back, fetches what it
missed. If it never reconnects, check that your reverse proxy forwards `/ws` with the upgrade
headers (the bundled Caddy does).

## Can guests chat?

No. Guests can watch and read. Anything interactive needs an account, which keeps every message
tied to someone. Accounts can choose to appear as Anonymous.

## Where is the interactive API documentation?

Set `IS_DEBUG=true` for the backend and open `/docs` on the backend port.
