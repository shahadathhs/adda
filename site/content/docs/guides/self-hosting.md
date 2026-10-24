---
title: "Self-hosting"
description: "Production deployment: configuration, HTTPS, custom proxies, persistence and scaling."
---

adda runs on one server (2 vCPU and 4 GB is a fine start for a small community). You host one
thing, the stack: backend, web app, streaming server, Postgres and Redis. Nothing of ours is in
the path.

## The easy path

[`scripts/install.sh`](/docs/quickstart) does everything below: it generates the secrets, starts
the stack and gets HTTPS through the bundled Caddy. Follow these steps only for a custom setup
(an existing reverse proxy, an external Postgres, separate hostnames).

## 1. Configure

```bash
git clone https://github.com/shahadathhs/adda.git
cd adda
cp .env.example .env
```

At minimum set these in `.env`. The full list is in [Configuration](/docs/reference/configuration).

```bash
JWT_SECRET=$(openssl rand -hex 48)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

ADDA_DOMAIN=example.com
CORS_ORIGINS=https://example.com

SUPERADMIN_EMAIL=you@example.com
SUPERADMIN_PASSWORD=$(openssl rand -base64 18)
SEED_TEST_USERS=false

# Public URLs (one domain; playback is proxied under /hls)
HLS_BASE_URL=https://example.com/hls
NEXT_PUBLIC_API_BASE_URL=https://example.com
NEXT_PUBLIC_HLS_BASE_URL=https://example.com/hls
PASSWORD_RESET_URL=https://example.com/reset-password
```

Optionally add the `SMTP_*` values for emailed reset links and live emails.

## 2. Start

```bash
docker compose --profile prod up -d --build
```

The backend applies database migrations when it starts, and waits for Postgres and Redis. Caddy
serves traffic once the stack is healthy.

## 3. A different reverse proxy

The bundled Caddy routes `/api`, `/ws`, `/health` and `/hls` to the right services and everything
else to the web app (see `infra/caddy/Caddyfile`). If you proxy yourself, keep that routing, and
make sure `/ws` keeps the upgrade headers:

```nginx
location /ws {
    proxy_pass http://127.0.0.1:7001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

Do not publish `/metrics`. Keep **port 1935** open to the internet for RTMP; mediamtx checks every
publisher against the channel's key.

## 4. What to keep

| Data                                 | Where it lives                        |
| ------------------------------------ | ------------------------------------- |
| Accounts, channels, chat, polls      | Postgres (the `postgres_data` volume) |
| Recordings                           | `./recordings/`                       |
| Emotes, banners and profile pictures | `./uploads/`                          |
| Presence, rate limits, live tallies  | Redis, ephemeral by design            |

[Back up](/docs/operations) the database, `uploads/` and `recordings/`. Everything else rebuilds.

## 5. Upgrading

```bash
git pull
docker compose --profile prod up -d --build
```

Migrations run automatically. Take a backup first.

## Scaling notes

- The backend keeps no per-request state, and WebSocket fan-out goes through Redis, so several
  backend instances behind one Redis work (this is tested with two real processes). Use sticky
  sessions for `/ws`.
- Streaming is passthrough: mediamtx remuxes RTMP to HLS at the source bitrate. Size your upload
  bandwidth for viewers times bitrate, or put a CDN in front of `/hls`.

## Ports

| Service       | Port    | Purpose            | Published                    |
| ------------- | ------- | ------------------ | ---------------------------- |
| Caddy         | 80, 443 | HTTPS entrypoint   | internet (prod profile)      |
| mediamtx RTMP | 1935    | Encoder ingest     | internet                     |
| Web           | 5173    | Web app (SSR)      | localhost                    |
| Backend       | 7001    | REST and WebSocket | localhost                    |
| mediamtx HLS  | 8888    | Playback           | localhost (Caddy proxies it) |
| mediamtx API  | 9997    | Control            | localhost                    |
| Postgres      | 5432    |                    | localhost                    |
| Redis         | 6379    |                    | localhost                    |
