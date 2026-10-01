---
title: adda
description: Self-hosted, multi-tenant live streaming for your community.
template: splash
hero:
  tagline: Self-hosted live streaming for your community
  image:
    file: ../../assets/logo.svg
  actions:
    - text: Get started
      link: /quickstart/
      variant: primary
    - text: Go live with OBS
      link: /guides/streaming/
      variant: secondary
    - text: Self-hosting guide
      link: /guides/self-hosting/
      variant: secondary
---

**adda** (আড্ডা) bundles everything a streaming community needs into a single
deployable stack: text channels, real-time chat, **live video**, recordings,
and a full admin dashboard. One instance, many streamers — like a self-hosted
Twitch you fully own.

## Why adda?

- **Multi-tenant by design.** One server hosts many channels. Every community
  gets its own stream key, live page, chat, and recordings — no need to run a
  copy per streamer.
- **Own your stack.** Postgres for data, Redis for realtime fan-out, mediamtx
  for video. No third-party trackers, no forced logins, no cloud dependency.
- **Real-time everywhere.** WebSocket chat with presence, instant live/offline
  notifications, Redis pub/sub so you can scale to multiple backend instances.
- **Three clients, one codebase.** Web app, and a native desktop app (Tauri)
  that connects to *your* server URL on first run.
- **Secure out of the box.** Rotating refresh tokens, 2FA, email OTP, Google
  sign-in, per-community stream keys with instant rotation.

## Feature tour

| Area           | What you get                                                               |
| -------------- | -------------------------------------------------------------------------- |
| Streaming      | RTMP ingest → HLS + WebRTC playback, viewer counts, stream health, titles  |
| Chat           | Realtime WebSocket chat, replies, presence, persisted channel history      |
| Communities    | Public/private channels, roles, join requests, followers                   |
| Recordings     | Automatic recording of every stream, in-app playback, admin management    |
| Admin          | Users, communities, live monitor with force-stop, recordings, stats       |
| Auth           | Password + JWT, refresh rotation, 2FA, OTP, Google OAuth, password reset  |

## How it fits together

```
Browser / Desktop (React + Tauri)
        │ REST /api          │ WebSocket /ws
        ▼                    ▼
   FastAPI backend  ──►  Redis (pub/sub, presence)
        │
        ▼
   PostgreSQL 16  ·  mediamtx (RTMP → HLS/WebRTC)  ·  recordings on disk
```

## Ready to start?

Read the [Quickstart](/quickstart/) — a full stack in about five minutes,
or jump straight into [self-hosting](/guides/self-hosting/) for production
checklists, reverse proxy configs, and environment reference.
