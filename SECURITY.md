# Security

## Reporting a vulnerability

Please **do not open a public issue** for a security problem. Use GitHub's private
vulnerability reporting ("Security" tab → "Report a vulnerability") on this repository.
Include what you found, how to reproduce it, and the version (the `VERSION` file) or
commit. You will get an acknowledgement within a few days; fixes for confirmed issues are
released as soon as they are ready, and you are credited unless you prefer not to be.

## Supported versions

Only the latest release is supported. adda is self-hosted, so applying a fix means
upgrading your own server (see [docs/OPERATIONS.md](docs/OPERATIONS.md)).

## What is worth reporting

Anything that lets someone read or change what they should not: authentication or
token handling, guests writing anything, an anonymous chat author being exposed to
viewers, a stream key leaking, publishing to a channel without its key, path traversal
in recordings or uploads, injection, or a way to knock the server over cheaply.

## How the system is meant to behave

- Passwords are hashed with bcrypt; access tokens are short-lived JWTs and refresh tokens
  rotate; reset links are single-use.
- Every write needs an account and is enforced on the server, for REST and WebSocket.
- The public chat payload never carries an anonymous author's id or name; revealing one is
  restricted to the channel owner, its moderators and admins, and is logged.
- Uploads are identified by their bytes, not their file names, and stored under generated names.
- `/metrics` is not published by the reverse proxy.
