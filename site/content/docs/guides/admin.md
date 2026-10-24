---
title: "Administration"
description: "The seeded admin and the admin API for users, channels, streams and recordings."
---

Version 1 has **no admin web interface**. Everything an operator needs is a small admin API, so
it works from a terminal or a script. Streamers manage their own channels in the Studio.

## Roles

| Role         | Powers                                                  |
| ------------ | ------------------------------------------------------- |
| `user`       | A normal account: watches, chats, can create a channel  |
| `admin`      | Every `/api/admin/…` endpoint; can moderate any channel |
| `superadmin` | Everything an admin can do, and can assign staff roles  |

The installer seeds one superadmin from the email you gave it and prints the password once.
Change it in **Settings → Password** after your first sign-in.

## Using the admin API

Sign in for a token, then send it as a bearer token:

```bash
TOKEN=$(curl -s https://your.domain/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","password":"…"}' | jq -r .access_token)

curl -s https://your.domain/api/admin/stats -H "authorization: Bearer $TOKEN"
```

| Method   | Path                                            | What it does                          |
| -------- | ----------------------------------------------- | ------------------------------------- |
| `GET`    | `/api/admin/stats`                              | Totals: users, channels, live streams |
| `GET`    | `/api/admin/users?q=`                           | Search users                          |
| `PATCH`  | `/api/admin/users/{id}`                         | Change role, suspend or reactivate    |
| `POST`   | `/api/admin/users/{id}/reset-password`          | Set a new password for someone        |
| `DELETE` | `/api/admin/users/{id}`                         | Delete an account                     |
| `GET`    | `/api/admin/communities`                        | List every channel                    |
| `PATCH`  | `/api/admin/communities/{id}`                   | Edit or suspend a channel             |
| `GET`    | `/api/admin/communities/{id}/stream-key`        | Read a channel's key                  |
| `POST`   | `/api/admin/communities/{id}/stream-key/rotate` | Rotate it                             |
| `DELETE` | `/api/admin/communities/{id}`                   | Delete a channel                      |
| `GET`    | `/api/admin/live`                               | Active streams with viewer counts     |
| `POST`   | `/api/admin/communities/{id}/stop`              | Force-stop a stream                   |
| `GET`    | `/api/admin/recordings`                         | List recordings                       |
| `DELETE` | `/api/admin/recordings?path=`                   | Delete a recording                    |

"Community" is the API's internal name for a channel. Suspending a user blocks sign-in;
suspending a channel hides it from public listings. A suspended user's existing tokens stop
working immediately.

## Stream security recap

- Publishing needs the channel's stream key, checked by the mediamtx auth webhook on every connect.
- Rotating a key disconnects the live publisher at once.
- The RTMP path names the channel, so a key cannot be used on another channel.
- Admins and channel owners can also reveal an anonymous chat author; each lookup is logged.
