---
title: Desktop app
description: Install the adda desktop app and connect it to your server.
---

adda ships as a native desktop app (built with Tauri v2) that wraps the same
UI as the web app in a small, fast native window — and it's
**runtime-configurable**, so one installer works with any adda server.

## Install

Grab the latest installer for your platform from the
[GitHub releases](https://github.com/shahadathhs/adda/releases) page:

| Platform | File                    |
| -------- | ----------------------- |
| macOS    | `.dmg` (Apple Silicon / Intel) |
| Windows  | `.exe` / `.msi`         |
| Linux    | `.deb` / `.AppImage`    |

:::caution[Unsigned binaries]
Installers are not code-signed yet. macOS Gatekeeper and Windows SmartScreen
will show a one-time "unknown developer" prompt — see the
[FAQ](/faq/#macos-says-the-app-is-from-an-unknown-developer) for the
workaround.
:::

## First run: connect to a server

The desktop app doesn't hardcode a server. On first launch you get a
**Connect to a server** screen:

1. Enter your server's URL, e.g. `https://app.example.com`
2. The HLS/streaming URL is derived automatically (same host, port 8888) —
   override it only if your deployment splits hosts
3. Sign in with your normal account

The choice persists locally. Change it any time in
**Settings → Connection**.

## Building from source

```bash
# Native (needs a Rust toolchain: brew install rust)
make desktop-build

# Linux .deb/.AppImage via Docker — no Rust needed
make desktop
```

Installers land in `frontend/src-tauri/target/` (native) or `./dist-desktop/`
(Docker).

## How auth works on desktop

The app stores rotating tokens locally: a short-lived access token and a
30-day refresh token (hashed server-side with reuse detection). When the
access token expires, the client refreshes transparently — you stay signed
in until the refresh token is revoked or expires.
