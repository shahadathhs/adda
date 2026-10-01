---
title: API overview
description: REST endpoints, authentication, the WebSocket protocol, and the mediamtx webhook.
---

The backend is FastAPI; all HTTP routes live under **`/api`**. When
`IS_DEBUG=true` a full interactive OpenAPI spec is served at **`/docs`**.

## Authentication

1. `POST /api/auth/login` with email+password → `{ access_token, refresh_token }`
2. Send `Authorization: Bearer <access_token>` on every call
3. On expiry, `POST /api/auth/refresh` with the refresh token → new pair
   (rotating — the old refresh token dies; reuse revokes the session)

Other flows: register, OTP email login, 2FA enable/verify, Google ID-token
login, password reset.

## REST surface (selected)

### Communities / channels

| Method   | Path                                       | Auth    |
| -------- | ------------------------------------------ | ------- |
| `GET`    | `/api/communities?q=&limit=&offset=`       | public  |
| `GET`    | `/api/communities/{id}`                    | public  |
| `POST`   | `/api/communities`                         | user    |
| `PATCH`  | `/api/communities/{id}`                    | owner   |
| `DELETE` | `/api/communities/{id}`                    | owner   |
| `GET`    | `/api/communities/{id}/stream-key`         | owner   |
| `POST`   | `/api/communities/{id}/stream-key/rotate`  | owner   |
| `GET`    | `/api/communities/{id}/follow`             | user    |
| `POST`   | `/api/communities/{id}/follow`             | user    |
| `DELETE` | `/api/communities/{id}/follow`             | user    |
| `GET`    | `/api/communities/followed/by-me`          | user    |
| `GET`    | `/api/communities/{id}/members`            | public  |
| `POST`   | `/api/communities/{id}/members`            | user    |
| `PATCH`  | `/api/communities/{id}/members/{user_id}`  | c-admin |
| `DELETE` | `/api/communities/{id}/members/{user_id}`  | c-admin |

Channels: CRUD under `/api/communities/{id}/channels/…` plus
`GET /api/channels/{channel_id}/messages` (cursor-paginated).

### Streaming

| Method | Path                                       | Auth    | Purpose                       |
| ------ | ------------------------------------------ | ------- | ----------------------------- |
| `GET`  | `/api/streaming/discover?q=`               | public  | browse grid, live-first       |
| `GET`  | `/api/streaming/live`                      | public  | live ids + playback URLs      |
| `GET`  | `/api/streaming/communities/{id}/status`   | public  | live, viewers, URLs           |
| `GET`  | `/api/streaming/communities/{id}/health`   | owner   | health snapshot               |
| `GET`  | `/api/streaming/playbook`                  | user    | OBS instructions              |

### Recordings

`GET /api/recordings?community_id=`, `GET /api/recordings/file?path=`,
`DELETE /api/recordings` — admin variants under `/api/admin/recordings`.

### Admin (`/api/admin/*`, requires `admin`/`superadmin`)

`GET /api/admin/stats`, `GET /api/admin/users`, user role/suspend/delete,
`GET /api/admin/communities`, `GET /api/admin/live`,
`POST /api/admin/communities/{id}/stop`, recordings management.

## WebSocket protocol

Connect to **`/ws?token=<access_token>`**. Messages are JSON with a `type`.

**Client → server**

| Type            | Fields                          |
| --------------- | ------------------------------- |
| `subscribe`     | `channel`                       |
| `unsubscribe`   | `channel`                       |
| `chat_message`  | `channel`, `data.content`       |
| `ping`          |                                 |

**Server → client**

| Type            | Payload                                      |
| --------------- | -------------------------------------------- |
| `subscribed`    | `channel`                                    |
| `unsubscribed`  | `channel`                                    |
| `chat_message`  | `ChatMessagePayload`                         |
| `presence`      | `channel`, `online_count`, `user_ids`        |
| `stream_status` | `community_id`, `is_live`, `viewers`, `started_at` |
| `notification`  | *(reserved)*                                 |
| `pong` / `error`|                                              |

**Channel namespaces**

```
community/<id>            — community events (stream_status)
community/<id>/chat       — live chat
community/<id>/presence   — who's online
channel:<uuid>            — persisted channel chat
user:<id>                 — personal notifications
```

The contract is defined in `backend/modules/realtime/protocol.py` and mirrored
in `frontend/src/features/realtime/ws.ts` — keep both in sync when extending.

## mediamtx auth webhook

`POST /api/streams/auth` — called by mediamtx on every publish attempt. The
path must be `community/<uuid>` and the query must carry the community's
current `key`. Returns `200` to allow, `403` to reject. This is what makes
stream keys a real auth mechanism.
