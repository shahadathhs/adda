---
title: Administration
description: The admin dashboard — users, communities, live streams, recordings.
---

Every deployment has three system roles:

| Role       | Powers                                                             |
| ---------- | ------------------------------------------------------------------ |
| `user`     | Normal member — uses the app                                       |
| `admin`    | Full admin dashboard access                                        |
| `superadmin` | Everything an admin can do (intended for the instance owner)     |

The seeded `admin@example.com` account is a superadmin. Promote others from
**Admin → Users**.

## Getting to the dashboard

Sign in with an admin account — you'll land on **/admin/overview**
automatically (admins don't see the regular app except Settings). The
collapsible sidebar has five sections:

### Overview

Platform stats at a glance: total users, communities, and live streams.

### Users

Search users, promote/demote system roles, suspend/reactivate, trigger a
password reset, or delete accounts.

### Communities

Manage **every** channel on the instance — even ones you don't own:

- Edit name/description, toggle private
- **Suspend** a community (hidden from public listings, instantly)
- View members, kick members
- View/rotate the community's stream key
- **Stop stream** — force-disconnect the active publisher

### Live

Active streams with viewer counts and a **force-stop** button per stream.
Useful when moderation has to happen *now*.

### Recordings

Browse every recording across all channels, filter by community, play, or
delete from disk.

## Moderation model

- **System level** (dashboard): suspend users, suspend communities, stop
  streams, delete recordings.
- **Community level**: each community's owner and admins manage members,
  roles (`owner → admin → moderator → streamer → member → guest`), join
  requests for private communities, and their own channel's messages.

## Stream security recap

- Publishing requires the per-community stream key (validated by the mediamtx
  auth webhook on every connect).
- Rotating a key kicks the live publisher instantly.
- The RTMP path encodes the community, so keys can't be crossed between
  channels.
