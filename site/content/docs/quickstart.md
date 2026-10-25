---
title: "Quickstart"
description: "Your own live platform, on your domain, in one command."
---

One command asks for your domain and an admin email, installs what is missing (Docker
included), generates every secret and starts the platform behind automatic HTTPS.

## Before you start

- A server: any 2 GB VPS running Ubuntu or Debian
- A **domain** you control, which you will point at the server
- Ports **80** and **443** (web) and **1935** (RTMP, where OBS publishes) open
- Root access, or sudo

## 1. Run the installer

On the server, as root:

```bash
curl -fsSL https://raw.githubusercontent.com/shahadathhs/adda/dev/scripts/install.sh | sh
```

It asks two things, your **domain** (for example `adda.example.com`) and your **admin email**.
Then it shows the DNS record to add, waits until it resolves, generates the database
password, token secret and admin password, builds the images and starts the stack. At the
end it prints:

```text
adda is live:  https://adda.example.com
  admin login:  you@example.com
  password:     <generated, shown only this once>
```

> **Save that password now.** It is also in `/opt/adda/.env`, but it is never shown again.
> You can change it later in **Settings → Password**.

Email is off until you add the `SMTP_*` values to `/opt/adda/.env`. Everything works without
it; the only thing you lose is emailed password-reset links and the optional live-stream
emails. See [Configuration](/docs/reference/configuration).

## 2. Create your channel

1. Sign in with the admin email, or create an account.
2. In the left rail of the home page choose **Create a channel**, give it a name, and you land
   in the **Studio**.
3. Open the **Setup** tab. It shows the **Server** and **Stream key** for OBS, and one field
   that holds both together.

## 3. Go live

In OBS, open **Settings → Stream**, choose **Custom…**, paste the server and the stream key
(or paste the combined address into Server and leave the key empty) and press **Start
Streaming**.

Within a few seconds the Studio shows **LIVE**, your channel appears on the home page, and
anyone who follows you gets a bell. Open the **Live** tab to see what viewers see, with the
chat beside it. More in [Going live with OBS](/docs/guides/streaming).

## Try it on your laptop first

You need Docker, [uv](https://docs.astral.sh/uv/) and pnpm (Node 22):

```bash
git clone https://github.com/shahadathhs/adda.git && cd adda
make setup     # env files, dependencies, Postgres + Redis + mediamtx, migrations
make dev       # backend on :7001 and web on :5173, with hot reload
```

Development seeds an admin (`admin@example.com` / `admin12345`) and two test accounts
(`alice@example.com` and `bob@example.com`, password `password123`). A production install
never creates them.

## Next

- [Going live with OBS](/docs/guides/streaming)
- [Chat and moderation](/docs/guides/chat-and-moderation)
- [Operations](/docs/operations): backups, metrics, upgrades
