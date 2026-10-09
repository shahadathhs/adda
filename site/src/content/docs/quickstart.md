---
title: Quickstart
description: Your own live platform, on your domain, in one command.
---

One command asks for your domain and admin email, generates every secret,
and hands you a running platform with HTTPS. That's the whole install.

## Prerequisites

- A server (any VPS, 2 GB RAM is plenty to start) with **Docker** +
  **Docker Compose v2**
- A **domain** whose DNS A record points at that server
- Ports **80**, **443** (HTTPS) and **1935** (RTMP ingest for OBS) open

## 1. Get adda onto the server

```bash
git clone https://github.com/shahadathhs/adda.git
cd adda
```

## 2. Run the installer

```bash
./scripts/install.sh
```

You will be asked exactly two questions:

1. **Your domain** — e.g. `adda.example.com` (already pointed at this server)
2. **Admin email** — your login, and how the platform mails you

Everything else is generated for you: the database password, the token
signing secret, and your admin password. Email (SMTP) is optional — skip
it now, add it later in `.env` and restart.

The installer builds the images, starts everything behind automatic
HTTPS, waits for health checks, and prints your credentials:

```text
adda is live:  https://adda.example.com
  admin login:  you@example.com
  password:     <generated — shown only this once>
```

:::caution
Save the admin password immediately. It lives only in `.env` on your
server and is never displayed again. Change it in **Settings** after
first sign-in.
:::

## 3. Create your channel and go live

1. Sign in at `https://your-domain`, create a channel from the **Browse**
   page.
2. Open the channel → **Live** tab → copy the **Stream URL** and **stream
   key** from *Stream setup (OBS)*.
3. In OBS: **Settings → Stream → Custom**, paste the server URL and key,
   click **Start Streaming**.

The channel flips to **LIVE** within seconds — on the homepage grid, in
every follower's sidebar, with viewer counts and chat.

## Trying it locally instead?

The full stack runs on localhost with dev ports and no HTTPS:

```bash
make up        # → http://localhost:5173
```

Dev stacks seed test accounts (`admin@example.com` / `admin12345`, plus
alice and bob) for poking around. Production installs never do.

## Where to go next

- [Self-hosting guide](/guides/self-hosting/) — backups, tuning, scaling
- [Going live with OBS](/guides/streaming/) — stream titles, health, recordings
- [Desktop console](/guides/desktop/) — manage your platform as a native app
- [Configuration](/reference/configuration/) — every environment variable
- [FAQ](/faq/) — common issues (including port conflicts)
