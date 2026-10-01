---
title: Quickstart
description: A full adda stack running locally in about five minutes.
---

The fastest path is Docker — one command builds and starts Postgres, Redis,
mediamtx, the FastAPI backend, and the React frontend.

## Prerequisites

- **Docker** + Docker Compose
- **Git**
- **make** (optional but convenient — plain `docker compose` works too)

## 1. Clone and configure

```bash
git clone https://github.com/shahadathhs/adda.git
cd adda
make setup
```

`make setup` copies `.env.example` files, installs toolchain dependencies,
starts Postgres, and applies database migrations.

:::note
Everything defaults to sensible local values. For production deployments,
review the [configuration reference](/reference/configuration/) first.
:::

## 2. Start the stack

```bash
make up
```

First build takes a few minutes. When it finishes, open
**http://localhost:5173**.

## 3. Sign in

Seeded accounts are created on first startup:

| User  | Email               | Password      | Role      |
| ----- | ------------------- | ------------- | --------- |
| admin | `admin@example.com` | `admin12345`  | superadmin |
| alice | `alice@example.com` | `password123` | member    |
| bob   | `bob@example.com`   | `password123` | member    |

Sign in as **alice**, click **New** on the Browse page, and create your first
channel.

## 4. Go live

1. Open your channel → **Live** tab → copy the **Stream URL** from
   *Stream setup (OBS)*.
2. In OBS: **Settings → Stream → Service: Custom**, paste the URL as the
   server, leave the stream key empty.
3. Click **Start Streaming** — the channel flips to **LIVE** within seconds
   and appears on the Browse grid.

See the [full streaming guide](/guides/streaming/) for stream titles, health
metrics, viewer counts, and recordings.

## 5. Watch

Open the channel from any browser (or the
[desktop app](/guides/desktop/)) — the HLS player auto-connects and the chat
rail on the right is live for everyone.

## Where to go next

- [Self-hosting guide](/guides/self-hosting/) — production setup, TLS, proxies
- [Administration](/guides/admin/) — the admin dashboard explained
- [Configuration](/reference/configuration/) — every environment variable
- [FAQ](/faq/) — common issues (including port conflicts)
