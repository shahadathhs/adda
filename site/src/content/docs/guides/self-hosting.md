---
title: Self-hosting
description: Production deployment guide — TLS, reverse proxy, persistence, scaling.
---

adda is designed to be self-hosted on a single box (a 2 vCPU / 4 GB VPS is a
fine start for a small community) and can scale horizontally when you outgrow
it. You host two things: the **stack** (backend + web app + streaming) and
nothing else — the desktop console is an installer your operators download,
and there is no cloud component of ours anywhere in your deployment.

## Requirements

- Linux server with Docker + Docker Compose
- Ports open: **80/443** (web), **1935** (RTMP ingest)
- A domain name pointing at the server

:::note
**The easy path:** `./scripts/install.sh` does steps 1–3 automatically —
generates every secret, starts the stack, and configures automatic HTTPS
for your domain via the bundled Caddy service. Only follow the manual
steps below if you need a custom setup (existing reverse proxy, separate
hostnames, external Postgres, …).
:::

## 1. Configure

```bash
git clone https://github.com/shahadathhs/adda.git
cd adda
cp .env.example .env
```

At minimum, change these in `.env` — see the
[configuration reference](/reference/configuration/) for the full list:

```bash
# Strong, unique values
JWT_SECRET=$(openssl rand -hex 48)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# The domain (drives HTTPS + all public URLs)
ADDA_DOMAIN=example.com
CORS_ORIGINS=https://example.com

# Bootstrap admin — override with strong values
SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=$(openssl rand -base64 18)
SEED_TEST_USERS=false

# Public URLs (single domain — playback is proxied under /hls)
HLS_BASE_URL=https://example.com/hls
NEXT_PUBLIC_API_BASE_URL=https://example.com
NEXT_PUBLIC_HLS_BASE_URL=https://example.com/hls
PASSWORD_RESET_URL=https://example.com/reset-password

# Email (optional — needed for password-reset mail)
SMTP_HOST=smtp.example.com
SMTP_USERNAME=adda@example.com
SMTP_PASSWORD=<app password>
SMTP_FROM=adda <noreply@example.com>
```

## 2. Start

```bash
docker compose --profile prod up -d --build
```

Migrations run automatically on backend startup; they're idempotent.
The stack waits for its own health checks before Caddy serves traffic.

## 3. Reverse proxy (custom setups)

The bundled Caddy handles HTTPS and routes `/api`, `/ws`, `/hls` and the
web app on one domain (see `deploy/caddy/Caddyfile`). Skip this section
unless you're replacing it. If you proxy yourself:

Route two hostnames: the **app** (`app.example.com` — frontend + API +
WebSocket) and the **stream** (`stream.example.com` — HLS/WebRTC/RTMP from
mediamtx). A minimal Caddy file:

```nginx
# Caddyfile — app + API + WebSocket on one domain
app.example.com {
    reverse_proxy localhost:5173
}

stream.example.com {
    reverse_proxy localhost:8888
    reverse_proxy /webrtc/* localhost:8889
}
```

With nginx, make sure WebSocket upgrade headers are set for `/ws`:

```nginx
location /ws {
    proxy_pass http://127.0.0.1:7001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

:::tip
Keep the RTMP port (1935) open directly to the internet — OBS publishes over
plain RTMP. mediamtx validates every publisher against the community's stream
key via an auth webhook, so unauthenticated publishes are rejected.
:::

## 4. Persistence

| Data                    | Where it lives                                        |
| ----------------------- | ----------------------------------------------------- |
| Users, channels, chats  | Docker volume `adda_postgres_data`                    |
| Recordings              | `./recordings/` bind mount (host path, easy to mount) |
| Live state (presence)   | Redis — ephemeral by design                            |

Back up the Postgres volume and the `recordings/` directory. Everything else
is rebuildable.

## 5. Updating

```bash
git pull
docker compose --profile prod up -d --build
```

Rebuilds changed images and restarts. Database migrations run
automatically on backend startup; they're idempotent.

## Scaling notes

- The backend is stateless across requests; WebSocket fan-out goes through
  Redis pub/sub, so you can run multiple backend replicas behind a load
  balancer with sticky sessions for `/ws`.
- Streaming is passthrough (no transcoding): mediamtx remuxes RTMP → HLS at
  the source bitrate. Size your uplink for `viewers × bitrate`, or front
  mediamtx with a CDN for large audiences.

## Ports reference

| Service          | Container port | Purpose                     |
| ---------------- | -------------- | --------------------------- |
| Web (Next.js)    | 5173           | viewer web app (SSR)       |
| Backend API      | 7001           | REST + WebSocket            |
| PostgreSQL       | 5432           | database                    |
| Redis            | 6379           | pub/sub, presence, OTP      |
| mediamtx RTMP    | 1935           | OBS ingest                  |
| mediamtx HLS     | 8888           | playback (browser)          |
| mediamtx WebRTC  | 8889           | low-latency playback        |
| mediamtx API     | 9997           | control (auth webhook, etc) |
