---
title: Administration
description: Running your instance — the seeded admin, and the admin API for users, streams and recordings.
---

adda v1 has **no admin web interface**. Everything an operator needs is in a
small, documented admin API, so it works from a terminal or a script. Streamers
manage their own channels in the web app's Studio.

## Roles

| Role         | Powers                                                       |
| ------------ | ------------------------------------------------------------ |
| `user`       | Normal account: watches, chats, can create a channel         |
| `admin`      | Can use every `/api/admin/…` endpoint                        |
| `superadmin` | Everything an admin can do (intended for the instance owner) |

The installer seeds one superadmin from the email you gave it and prints the
password once. Change it in **Settings** after your first sign-in.

## Using the admin API

Sign in to get a token, then send it as a bearer token:

```bash
TOKEN=$(curl -s https://your.domain/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"…"}' | jq -r .access_token)

curl -s https://your.domain/api/admin/stats -H "authorization: Bearer $TOKEN"
```

| Method   | Path                                   | What it does                          |
| -------- | -------------------------------------- | ------------------------------------- |
| `GET`    | `/api/admin/stats`                     | Totals: users, channels, live streams |
| `GET`    | `/api/admin/users?q=`                  | Search users                          |
| `PATCH`  | `/api/admin/users/{id}`                | Change role, suspend or reactivate    |
| `POST`   | `/api/admin/users/{id}/reset-password` | Set a new password for someone        |
| `DELETE` | `/api/admin/users/{id}`                | Delete an account                     |
| `GET`    | `/api/admin/communities`               | List every channel                    |
| `PATCH`  | `/api/admin/communities/{id}`          | Edit or suspend a channel             |
| `DELETE` | `/api/admin/communities/{id}`          | Delete a channel                      |
| `GET`    | `/api/admin/live`                      | Active streams with viewer counts     |
| `POST`   | `/api/admin/communities/{id}/stop`     | Force-stop a stream                   |
| `GET`    | `/api/admin/recordings`                | List recordings                       |
| `DELETE` | `/api/admin/recordings`                | Delete a recording                    |

"Community" is the API's internal name for a channel. Suspending a user blocks
sign-in; suspending a channel hides it from public listings.

If email is not configured, a forgotten password is fixed with the
`reset-password` endpoint above.

## Stream security recap

- Publishing requires the channel's stream key, checked by the mediamtx auth
  webhook on every connect.
- Rotating a key disconnects the live publisher immediately.
- The RTMP path encodes the channel, so keys cannot be crossed between channels.
