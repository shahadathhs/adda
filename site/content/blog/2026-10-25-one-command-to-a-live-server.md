---
title: "One command to a live server"
description: "What the installer does, what it will not do for you, and why only three ports are public."
date: 2026-10-25
order: 4
tag: "Operations"
image: "/blog/one-command-to-a-live-server.svg"
---

adda's installer is a shell script you pipe from the repository. Piping a script into a shell
deserves suspicion, so here is exactly what it does.

```text
curl -fsSL https://raw.githubusercontent.com/shahadathhs/adda/dev/scripts/install.sh | sh
```

## The steps

Run as root on a fresh server, the script:

1. asks for your **domain** and **admin email**;
2. installs Docker and Compose if they are missing;
3. downloads the adda source, with no git needed;
4. waits until the domain's DNS points at this machine;
5. **generates every secret** and writes `.env`;
6. starts the stack, with Caddy getting an HTTPS certificate for the domain;
7. prints the admin password **once**.

It is a plain script you can read before you run it. Nothing in it phones home.

## Secrets are generated, not defaulted

The database password, the signing key and the admin password are random and created on your
machine. There are no default credentials to forget to change. Running the script again does not
rewrite existing secrets, so an upgrade cannot lock you out of your own database.

## Three public ports

Only **80 and 443** (the web app, through Caddy) and **1935** (RTMP, for OBS) face the internet.
Postgres, Redis, the backend and the media server's control port are published on `127.0.0.1`
only: reachable from the machine itself for debugging, and from nowhere else.

## One compose file

Production and local development use the same `compose.yaml`. Its defaults are the safe ones:
debug off, no test users, HTTPS URLs. Local development overrides them from the Makefile, never by
editing the file, so the file you read is the file that runs.

## What the script will not do

It does not buy a domain, create DNS records or open your firewall. It does not configure email;
password-reset links and live alerts need `SMTP_*` values, and without them the email controls
simply do not appear. And it does not claim a speed: a timed install on a clean server is still on
the list of things to measure.

## After it finishes

Sign in with the admin email, create your channel, and open **Studio → Setup**. The server address
and stream key are there with a copy button; paste them into OBS under _Settings → Stream → Custom_.
