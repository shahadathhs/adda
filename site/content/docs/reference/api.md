---
title: "API overview"
description: "Authentication, the main REST endpoints, and the mediamtx webhook."
---

The backend is FastAPI. Every HTTP route is under **`/api`**. With `IS_DEBUG=true` the full
interactive OpenAPI spec is at `/docs`. The chat protocol and its REST endpoints are in
[Chat and realtime protocol](/docs/chat).

## Authentication

1. `POST /api/auth/login` with email and password returns `{ access_token, refresh_token }`.
2. Send `Authorization: Bearer <access_token>`.
3. When it expires, `POST /api/auth/refresh` with the refresh token returns a new pair. Refresh
   tokens rotate: the old one dies, and reusing it revokes the session.

Also: register, change password, forgot and reset password (`GET /api/auth/config` says whether
the server can send email). Guests send no token; they can read public data and cannot write.

## Channels (communities)

"Community" is the API's internal name for a channel.

| Method                | Path                                      | Who            |
| --------------------- | ----------------------------------------- | -------------- |
| `GET`                 | `/api/communities/by-slug/{slug}`         | anyone         |
| `GET`                 | `/api/communities/{id}`                   | anyone         |
| `GET`                 | `/api/communities/mine`                   | account        |
| `POST`                | `/api/communities`                        | account        |
| `PATCH`               | `/api/communities/{id}`                   | owner          |
| `DELETE`              | `/api/communities/{id}`                   | owner          |
| `GET`                 | `/api/communities/{id}/stream-key`        | owner          |
| `POST`                | `/api/communities/{id}/stream-key/rotate` | owner          |
| `GET`/`POST`/`DELETE` | `/api/communities/{id}/follow`            | account        |
| `GET`                 | `/api/communities/{id}/followers`         | anyone         |
| `GET`/`POST`/`DELETE` | `/api/communities/{id}/moderators`        | anyone / owner |
| `GET`/`POST`/`DELETE` | `/api/communities/{id}/announcements`     | anyone / owner |
| `POST`/`DELETE`       | `/api/communities/{id}/banner`            | owner          |

## Streaming

| Method | Path                                     | Who               | Purpose                       |
| ------ | ---------------------------------------- | ----------------- | ----------------------------- |
| `GET`  | `/api/streaming/discover?q=`             | anyone            | Browse and search, live first |
| `GET`  | `/api/streaming/communities/{id}/status` | anyone            | Live, viewers, start time     |
| `GET`  | `/api/streaming/communities/{id}/health` | owner, moderators | Viewers, uptime, codecs       |
| `POST` | `/api/streaming/communities/{id}/stop`   | owner, moderators | Disconnect the encoder        |

## Recordings

`GET /api/recordings?community_id=`, `GET /api/recordings/recent`, `GET /api/recordings/file?path=`
(play or download), `DELETE /api/recordings/file?community_id=&path=` (owner),
`GET`/`POST /api/recordings/comments`, `DELETE /api/recordings/comments/{id}`.

## Account

`GET /api/auth/me`, `PATCH /api/auth/me`, `PUT /api/me/identity-mode`, `GET /api/notifications`,
`POST /api/notifications/read`, `GET`/`PUT /api/me/notification-prefs`.

## Health and metrics

| Path       | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| `/health`  | Liveness                                              |
| `/ready`   | Readiness: Postgres and Redis answer; `503` otherwise |
| `/metrics` | Prometheus text (not published by the bundled proxy)  |

## Admin

`/api/admin/*` requires `admin` or `superadmin`. See [Administration](/docs/guides/admin).

## mediamtx auth webhook

`POST /api/streams/auth` is called by mediamtx on every publish. The path must be
`community/<uuid>` and the query must carry that channel's current `key`. It answers `200` to
allow and `403` to refuse, which is what makes stream keys real authentication.
