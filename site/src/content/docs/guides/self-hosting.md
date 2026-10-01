---
title: Self-hosting
description: Production deployment guide — TLS, reverse proxy, persistence, scaling.
---

adda is designed to be self-hosted on a single box (a 2 vCPU / 4 GB VPS is a
fine start for a small community) and can scale horizontally when you outgrow
it.

## Requirements

- Linux server with Docker + Docker Compose
- Ports open: **80/443** (web), **1935** (RTMP ingest)
- A domain name pointing at the server

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
JWT_SECRET=<python -c "import secrets; print(secrets.token_urlsafe(48))">
POSTGRES_PASSWORD=<strong password>

# Bootstrap admin — override with strong values
SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=<strong password>
SEED_TEST_USERS=false

# Public URLs your viewers/broadcasters will use
HLS_BASE_URL=https://stream.example.com
WEBRTC_BASE_URL=https://stream.example.com/webrtc
RTMP_BASE_URL=rtmp://stream.example.com

# Email (needed for password reset, 2FA, OTP login)
SMTP_HOST=smtp.example.com
SMTP_USERNAME=adda@example.com
SMTP_PASSWORD=<app password>
SMTP_FROM=adda <noreply@example.com>
```

## 2. Start

```bash
make setup
make up
```

Migrations run via `make setup`; they're idempotent.

## 3. Reverse proxy (TLS)

Route two hostnames: the **app** (`app.example.com` — frontend + API +
WebSocket) and the **stream** (`stream.example.com` — HLS/WebRTC/RTMP from
mediamtx). A minimal Caddy file:

```caddy
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
make up          # rebuilds changed images and restarts
make migrate     # applies any new database migrations
```

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
| Frontend         | 5173           | Vite/NGINX web app          |
| Backend API      | 7001           | REST + WebSocket            |
| PostgreSQL       | 5432           | database                    |
| Redis            | 6379           | pub/sub, presence, OTP      |
| mediamtx RTMP    | 1935           | OBS ingest                  |
| mediamtx HLS     | 8888           | playback (browser)          |
| mediamtx WebRTC  | 8889           | low-latency playback        |
| mediamtx API     | 9997           | control (auth webhook, etc) |
