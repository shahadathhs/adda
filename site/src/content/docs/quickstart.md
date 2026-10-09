---
title: Quickstart
description: Your own live platform, on your domain, in one command.
---

One command asks for your domain and admin email, installs whatever is
missing (Docker included), generates every secret, and hands you a
running platform with HTTPS. That's the whole install.

## Prerequisites

- A server — any 2 GB VPS running Ubuntu or Debian
- A **domain** you control (you'll point it at the server)
- Ports **80**, **443** (HTTPS) and **1935** (RTMP ingest for OBS) open
- Root access (or sudo)

No Docker, no git, no terminal skills beyond pasting one line.

## 1. Run the installer

SSH into the server (your VPS provider shows you how — one command) and
paste:

```bash
curl -fsSL https://raw.githubusercontent.com/shahadathhs/adda/adda-v3/scripts/install.sh | sh
```

You will be asked exactly two questions:

1. **Your domain** — e.g. `adda.example.com`
2. **Admin email** — your login

The script then shows you the exact DNS record to add (your domain →
this server's IP) and **waits with you** until it propagates. While
waiting, add the record in your registrar's DNS dashboard. Everything
else is automatic:

- Docker and Compose installed if missing
- adda downloaded to `/opt/adda`
- database password, token secret, and admin password generated
- images built, stack started behind automatic HTTPS
- your credentials printed

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

:::note[Email]
The installer skips email (SMTP) for now. Without it, everything works —
admins can reset passwords from the desktop console — but automatic
reset emails need SMTP: add the `SMTP_*` values to `/opt/adda/.env` and
restart. See the [configuration reference](/reference/configuration/).
:::

## 2. Create your channel and go live

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
