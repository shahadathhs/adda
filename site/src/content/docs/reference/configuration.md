---
title: Configuration
description: Every environment variable, and what it does.
---

All configuration is environment-driven (Pydantic Settings in the backend,
`VITE_*` env for the frontend build). Everything has a local-dev default.

## Root `.env`

Used by Docker Compose and shared by services.

### Database

| Variable             | Default                              | Notes                          |
| -------------------- | ------------------------------------ | ------------------------------ |
| `POSTGRES_USER`      | `adda`                               |                                |
| `POSTGRES_PASSWORD`  | `adda`                               | **set strong in prod**         |
| `POSTGRES_DB`        | `adda`                               |                                |
| `POSTGRES_PORT`      | `5432`                               |                                |
| `DATABASE_URL`       | `postgresql+asyncpg://adda:adda@localhost:5432/adda` | backend outside Docker |

### Redis

| Variable     | Default                   |
| ------------ | ------------------------- |
| `REDIS_PORT` | `6379`                    |
| `REDIS_URL`  | `redis://localhost:6379/0` |

### Auth

| Variable                    | Default                          | Notes                             |
| --------------------------- | -------------------------------- | --------------------------------- |
| `JWT_SECRET`                | `change-me`                      | **required** in prod — long+random |
| `JWT_ALGORITHM`             | `HS256`                          |                                   |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080`                        | access-token lifetime              |
| `RESET_TOKEN_EXPIRE_MINUTES` | `30`                           | password-reset token lifetime      |
| `PASSWORD_RESET_URL`        | `http://localhost:5173/reset-password` | frontend URL for reset links |
| `GOOGLE_CLIENT_ID`          | *(empty)*                        | enables Google sign-in             |
| `VITE_GOOGLE_CLIENT_ID`     | *(empty)*                        | same ID, for the browser button   |

### Backend

| Variable       | Default | Notes                           |
| -------------- | ------- | ------------------------------- |
| `BACKEND_PORT` | `7001`  |                                 |
| `IS_DEBUG`     | `true`  | enables `/docs` (OpenAPI)       |

### CORS

| Variable        | Default                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| `CORS_ORIGINS`  | `http://localhost:5173,http://localhost:5174,tauri://localhost,http://tauri.localhost`    |

Comma-separated browser origins allowed to call the API. The defaults cover
the web app (5173), the desktop console in dev/preview (5174), and the
packaged Tauri console (`tauri://localhost` on macOS/Linux,
`http://tauri.localhost` on Windows). In production, set it to your web
app's origin(s) — keep the `tauri://` entries so operators can use the
console.

### Streaming (mediamtx)

| Variable          | Default                  | Notes                                    |
| ----------------- | ------------------------ | ---------------------------------------- |
| `RTMP_PORT`       | `1935`                   | OBS ingest                               |
| `HLS_PORT`        | `8888`                   | playback                                 |
| `WEBRTC_PORT`     | `8889`                   | low-latency playback                     |
| `MTX_API_PORT`    | `9997`                   | mediamtx control API                     |
| `MTX_API_URL`     | `http://localhost:9997`  | used by the backend                      |
| `MTX_API_USER`    | `admin`                  | set in `mediamtx/mediamtx.yml`           |
| `MTX_API_PASS`    | `admin`                  | **change in prod**                       |
| `HLS_BASE_URL`    | `http://localhost:8888`  | browser-facing                           |
| `WEBRTC_BASE_URL` | `http://localhost:8889`  | browser-facing                           |
| `RTMP_BASE_URL`   | `rtmp://localhost:1935`  | shown in OBS setup instructions          |

### Bootstrap accounts

| Variable               | Default             | Notes                              |
| ---------------------- | ------------------- | ---------------------------------- |
| `SUPERADMIN_USERNAME`  | `admin`             |                                    |
| `SUPERADMIN_EMAIL`     | `admin@example.com` |                                    |
| `SUPERADMIN_PASSWORD`  | `admin12345`        | **override in prod**               |
| `SEED_TEST_USERS`      | `true`              | disable in prod                    |
| `SEED_TEST_PASSWORD`   | `password123`       | alice/bob test accounts            |

Seeding is idempotent — it only creates accounts that don't exist yet.

### SMTP

| Variable        | Default                       | Notes                          |
| --------------- | ----------------------------- | ------------------------------ |
| `SMTP_HOST`     | *(empty)*                     | empty = no email (dev mode)    |
| `SMTP_PORT`     | `587`                         |                                |
| `SMTP_USERNAME` | *(empty)*                     |                                |
| `SMTP_PASSWORD` | *(empty)*                     | app password for Gmail etc.    |
| `SMTP_FROM`     | `adda <noreply@adda.example>` |                                |
| `SMTP_STARTTLS` | `true`                        |                                |

## Frontend (build-time)

| Variable               | Default                  | Notes                     |
| ---------------------- | ------------------------ | ------------------------- |
| `VITE_API_BASE_URL`    | `http://localhost:7001`  | fallback; runtime-overridable |
| `VITE_HLS_BASE_URL`    | `http://localhost:8888`  | fallback; runtime-overridable |
| `VITE_GOOGLE_CLIENT_ID`| *(empty)*                | Google sign-in button     |

:::note[Runtime server config]
The desktop app (and the web app) store a server config in localStorage key
`adda_server_config`. The desktop setup screen writes it on first run —
`VITE_*` values are only fallback defaults.
:::
