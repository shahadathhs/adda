---
title: Desktop console
description: The adda operator console — stream and community management on your desktop.
---

The **Adda Console** is the creator client: a native desktop app (Tauri v2)
for anyone who runs a channel — streamers, channel moderators, and system
admins. Viewers use the web app; the console is for *running the show* —
dense, dark, keyboard-first, with its own UI built for desktop conventions
(no wrapped website).

```
┌──────────────┬─────────────────────────────────────────────┐
│ Adda Console │  Dashboard                        ● Realtime│
│──────────────│                                              │
│ ⌘1 Dashboard │  Users 42   Communities 7   Live 2           │
│ ⌘2 Streams   │                                              │
│ ⌘3 Communities│  Active streams                             │
│ ⌘4 Users     │  ┌────────────────────────────────────────┐ │
│ ⌘5 Recordings│  │ My Stream   LIVE   1,284 viewers  Stop │ │
│ ⌘6 Chat      │  └────────────────────────────────────────┘ │
│ ⌘7 Settings  │                                              │
└──────────────┴─────────────────────────────────────────────┘
```

## Install

Grab the latest installer from the
[GitHub releases](https://github.com/shahadathhs/adda/releases) page:

| Platform | File                           |
| -------- | ------------------------------ |
| macOS    | `.dmg` (Apple Silicon / Intel) |
| Windows  | `.exe` / `.msi`                |
| Linux    | `.deb` / `.AppImage`           |

:::caution[Unsigned binaries]
Installers are not code-signed yet — see the
[FAQ](/faq/#macos-says-the-app-is-from-an-unknown-developer) for the one-time
Gatekeeper/SmartScreen workaround.
:::

## First run

1. Enter your server address (e.g. `https://your-adda-server.com`)
2. Sign in with your account
3. Done — the console remembers both. Change them any time in
   **Settings → Connection**.

The sidebar adapts to who you are: your channels appear in the **Channel**
section (with your role next to each), and system `admin`/`superadmin`
accounts additionally get the **Platform** section (users, all communities,
live monitor, all recordings). No channels yet? Create one right from the
picker.

## What's inside

**Channel views** (per selected channel):

| View           | What you do there                                                     |
| -------------- | --------------------------------------------------------------------- |
| **Overview**   | Live status, viewers, followers, members, title, health, recent VODs  |
| **Stream**     | Go-live setup: OBS URL + key, rotation, live title                    |
| **Chat**       | Inspect persisted channel messages and moderate (delete) them         |
| **Recordings** | Browse, play, download your channel's recordings                      |
| **Members**    | Roles (moderator/streamer/member/guest), kick, join requests          |

**Platform views** (system admins only):
| -------------- | --------------------------------------------------------------------- |
| **Dashboard**  | Platform stats + active streams at a glance                            |
| **Streams**    | Live monitor (5s refresh), viewer counts, force-stop (button or right-click) |
| **Communities**| Manage every channel: members, kick, stream-key reveal/rotate, suspend, delete |
| **Users**      | Search, promote/demote roles, suspend, reset passwords, delete          |
| **Recordings** | Browse/filter, play in-app, download, delete                            |
| **Chat**       | Inspect persisted channel messages and moderate (delete) them          |
| **Settings**   | Server connection, account, version                                    |

## Desktop behaviors

- **⌘K command palette** — navigate, refresh data, sign out
- **⌘1–⌘7** — jump between views
- **Native notifications** — the console subscribes to every community's
  realtime channel and notifies you the moment a stream goes live
  (`stream_status` WebSocket events)
- **Status bar** — realtime connection state, server URL, live viewer totals

## Building from source

```bash
# Native (needs a Rust toolchain: brew install rust)
make desktop-build

# Linux .deb/.AppImage via Docker — no Rust needed
make desktop
```

Installers land in `apps/desktop/src-tauri/target/` (native) or
`./dist-desktop/` (Docker).

## How auth works

Same rotating tokens as the web app: a short-lived access token plus a 30-day
refresh token (hashed server-side, reuse detection revokes the session). The
console refreshes transparently; you stay signed in until the refresh token
expires or is revoked.
