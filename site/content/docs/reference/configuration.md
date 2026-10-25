---
title: "Configuration"
description: "Every environment variable and what it does."
---

All configuration is environment-driven: Pydantic settings in the backend, `NEXT_PUBLIC_*`
build arguments for the web app. Everything has a development default. In production the
installer writes `.env` for you.

## Database and Redis

| Variable            | Default                                              | Notes                              |
| ------------------- | ---------------------------------------------------- | ---------------------------------- |
| `POSTGRES_USER`     | `adda`                                               |                                    |
| `POSTGRES_PASSWORD` | `adda`                                               | **set a strong one in production** |
| `POSTGRES_DB`       | `adda`                                               |                                    |
| `DATABASE_URL`      | `postgresql+asyncpg://adda:adda@localhost:5432/adda` | for a backend outside Docker       |
| `REDIS_URL`         | `redis://localhost:6379/0`                           |                                    |

## Auth

| Variable                      | Default                                | Notes                                       |
| ----------------------------- | -------------------------------------- | ------------------------------------------- |
| `JWT_SECRET`                  | `change-me`                            | **required in production**, long and random |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440`                                 | Access-token lifetime                       |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `30`                                   | Refresh tokens rotate on every use          |
| `RESET_TOKEN_EXPIRE_MINUTES`  | `30`                                   | Password-reset link lifetime                |
| `PASSWORD_RESET_URL`          | `http://localhost:5173/reset-password` | The page reset emails link to               |

## Backend

| Variable       | Default                    | Notes                                                   |
| -------------- | -------------------------- | ------------------------------------------------------- |
| `IS_DEBUG`     | `false`                    | `true` serves the OpenAPI docs at `/docs`               |
| `SQL_ECHO`     | `false`                    | Log every SQL statement (very noisy)                    |
| `LOG_FORMAT`   | `text` (`json` in compose) | One JSON object per log line in production              |
| `CORS_ORIGINS` | `http://localhost:5173`    | Comma-separated browser origins allowed to call the API |

## Streaming

| Variable                       | Default                                | Notes                                                                                                          |
| ------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `RTMP_PORT`                    | `1935`                                 | Where encoders publish                                                                                         |
| `HLS_PORT`                     | `8888`                                 | Playback, published on localhost                                                                               |
| `MTX_API_URL`                  | `http://localhost:9997`                | How the backend reaches mediamtx                                                                               |
| `MTX_API_USER`, `MTX_API_PASS` | `admin`, `admin`                       | mediamtx control credentials                                                                                   |
| `MTX_AUTH_ADDRESS`             | `http://backend:7001/api/streams/auth` | The publish-auth webhook. `make infra` sets `http://host.docker.internal:7001/…` for a backend on your machine |
| `HLS_BASE_URL`                 | `http://localhost:8888`                | The playback address the browser uses                                                                          |
| `RTMP_BASE_URL`                | `rtmp://localhost:1935`                | Shown in the Studio's Setup tab                                                                                |

## Storage

| Variable         | Default         | Notes                                          |
| ---------------- | --------------- | ---------------------------------------------- |
| `RECORDINGS_DIR` | `../recordings` | Where mediamtx writes MP4 files (a bind mount) |
| `THUMBS_DIR`     | `../thumbs`     | Live frames used as card posters               |
| `UPLOADS_DIR`    | `../uploads`    | Emotes, banners, pictures and uploaded videos  |

## Bootstrap accounts

| Variable              | Default             | Notes                                        |
| --------------------- | ------------------- | -------------------------------------------- |
| `SUPERADMIN_USERNAME` | `admin`             |                                              |
| `SUPERADMIN_EMAIL`    | `admin@example.com` |                                              |
| `SUPERADMIN_PASSWORD` | `admin12345`        | **override in production**                   |
| `SEED_TEST_USERS`     | `true`              | Creates alice and bob; `false` in production |
| `SEED_TEST_PASSWORD`  | `password123`       |                                              |

Seeding is idempotent: it only creates accounts that do not exist yet.

## Email (optional)

| Variable        | Default                       | Notes                              |
| --------------- | ----------------------------- | ---------------------------------- |
| `SMTP_HOST`     | _(empty)_                     | Empty means email is off           |
| `SMTP_PORT`     | `587`                         |                                    |
| `SMTP_USERNAME` | _(empty)_                     |                                    |
| `SMTP_PASSWORD` | _(empty)_                     | An app password for most providers |
| `SMTP_FROM`     | `adda <noreply@adda.example>` |                                    |
| `SMTP_STARTTLS` | `true`                        |                                    |

With `SMTP_HOST` empty the email controls in Settings are hidden, and reset links are written
to the backend log.

## Web app (build time)

| Variable                   | Default                   | Notes                                                     |
| -------------------------- | ------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:7001`   | The API address the browser calls                         |
| `NEXT_PUBLIC_HLS_BASE_URL` | `http://localhost:8888`   | The playback address the browser uses                     |
| `NEXT_PUBLIC_SITE_URL`     | `https://adda.vercel.app` | Optional marketing site, linked from the footer and About |
| `API_SSR_URL`              | `http://localhost:7001`   | The API address the web server calls (server rendering)   |
