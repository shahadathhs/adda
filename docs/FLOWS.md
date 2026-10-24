# adda — Flows, acceptance criteria and screen map

Each flow in [SCOPE.md](SCOPE.md) is done when every criterion below is true
**and** covered by an automated test (pytest for the API and WebSocket, Playwright
for the browser). Screen numbers refer to
[design/SCREENS.md](design/SCREENS.md). The chat backend is specified in
[CHAT.md](CHAT.md).

Every screen also ships its states: loading, empty, error, and (for realtime
views) reconnecting. See the `ux-states-a11y` skill for the checklist.

## F0 — Install

- On a clean Linux VPS with Docker, `./scripts/install.sh` asks for a domain
  and admin email, generates every secret, writes `.env`, and starts the stack.
- Only ports 80, 443 and 1935 are public. HTTPS is automatic.
- The admin password is printed once; no default passwords exist.
- Re-running the script does not change existing secrets.
- `GET /health` reports database, Redis and mediamtx status.

Test: a CI job brings the compose stack up, waits for `/health`, registers a
user, and publishes a test pattern with ffmpeg.

## F1 — Accounts (screens 08, 09, 10, 12)

- Register needs username, display name, email and password (8+). Duplicate
  username or email gives a specific, non-leaking error.
- Login failure says "Incorrect email or password" for both unknown email and
  wrong password; suspended accounts are told so.
- Refresh tokens rotate on every use. Reusing an already-rotated token revokes
  the whole session. Logout revokes the token.
- Change password requires the current one.
- Forgot password always answers with the same message. The link is single-use
  and expires (30 minutes by default). Without SMTP the link is logged for the
  host and the page says to ask the host.
- Profile edits validate username uniqueness.
- A profile picture (PNG, JPEG or WebP, up to 2 MB and 2000 px, checked by its
  bytes) can be uploaded, replaced and removed; replacing deletes the old file.
- A status is an emoji and/or up to 80 characters, with an optional end
  (1 hour, today, 7 days). Expired statuses read as unset. It can be cleared.

Tests: pytest for each rule; Playwright for register, login, reset.

## F2 — Discover and watch (01, 03, 06, 19, M1)

- Home lists live channels first, sorted by viewers; the top one is featured.
  The following rail needs an account.
- Search matches channel name and stream title; empty results offer a way on.
- Channel pages are server-rendered with title and Open Graph metadata.
- The HLS player starts muted, shows reconnecting state, and recovers.
- Offline channels show the offline panel and recordings. An unknown slug
  shows the not-found screen with HTTP 404.
- Viewer counts update over WebSocket without a page reload.

Tests: pytest for the browse and search queries; Playwright for home, channel,
offline and 404.

## F3 — Channel lifecycle (14, 17)

- Any account can create a channel (slug rules, duplicate slug error).
- The owner can reveal and copy the stream key and RTMP URL.
- Rotating the key disconnects the current publisher.
- Editing title, about, links and banner saves and shows on the page.
- Deleting needs a typed confirmation and removes recordings, emotes and
  followers.
- Only the owner (and admin) can do any of this.

Tests: pytest for ownership and cascade; Playwright for the studio setup.

## F4 — Go live (14, 15, 20, 21)

- mediamtx asks the backend to authorise a publisher; a wrong key is refused.
- Going live updates the channel and pushes `stream_status` within seconds.
- Stopping the encoder turns the channel offline within seconds.
- Owner or admin can force-stop a stream.
- After a stream ends the live page shows the ended state with recording
  progress; viewers dropped by a network error see the reconnecting state.

Tests: pytest for the webhooks and lifecycle; an ffmpeg publisher in the
end-to-end test.

## F5 — Chat and moderation (02, 07, 15, 18, 21)

- History loads with cursor pagination; new messages arrive live.
- Messages are 1–300 characters and rate limited per user.
- Owner and moderators can delete a message, time out or ban a viewer, and set
  slow mode and followers-only. Every action is recorded.
- A banned or timed-out account cannot send; it sees why.
- After a dropped connection the client reconnects with backoff and catches up
  without duplicates.
- Presence shows how many are in the channel.

Tests: pytest over the WebSocket for each rule; a two-instance test for
fan-out.

## F6 — Follows (01, 03, 05)

- Follow and unfollow are idempotent. The follower count and "follower since"
  are correct. The following rail shows live indicators.

## F7 — Recordings (03, 04, 20)

- When a stream ends a recording and thumbnail are created and listed, with a
  processing state until ready.
- A recording plays in the page and can be downloaded. The owner can delete it.

## F8 — Operate

- A seeded admin exists. The documented admin API can list users, suspend or
  delete a user, force-stop a stream and delete a recording. Admin actions
  are logged.

## F9 — Guests (07)

- A visitor without an account can browse, watch and read chat and polls.
- Any write over REST or WebSocket from a guest is rejected with an
  `auth_required` error, and the UI shows a sign-in prompt in its place.

## F10 — Chat extras (02, 15, M2)

- Replying shows a preview of the parent; if the parent is deleted the reply
  shows "message deleted".
- `@name` mentions notify that account and highlight the message for them.
- Reactions toggle per account and emoji; counts update live (batched).
- Owner and moderators can pin and unpin one message per channel.

## F11 — Emotes (16, 02)

- The owner uploads an emote (PNG, GIF or WebP, up to 256 KB, 128 x 128 px)
  with a unique name; up to 50 per channel.
- `:name:` in chat renders the image for everyone; removing an emote renders
  the text plain.

## F12 — Polls (02, 15, M2)

- Owner or a moderator starts one poll at a time with 2–4 options and a
  duration. Each account votes once. Results update live and persist after the
  poll closes (on time or when ended early).

## F13 — Notifications (11, 13)

- A followed channel going live, a mention, and a reply each create a bell
  notification for the right account only; the unread dot and mark-all-read
  work.
- Email alerts are opt-in per account and per channel, at most one email per
  channel per hour. With SMTP unset the email controls are hidden.

## F14 — Identity mode (12, 02)

- An account chooses to appear under its name or as "Anonymous". The choice
  applies to new messages, reactions and votes shown to other viewers.
- The public payload for an anonymous message carries no user id or name.
- The owner, moderators and admin can reveal the account behind a message; each
  reveal is audited.
- An anonymous account cannot be mentioned by name.

## F15 — Channel profile (05, 03, 17)

- The profile shows about text, links, banner, follower count, badges and
  announcements, with pinned announcements first.
- The owner posts and deletes announcements and manages moderators.

## F16 — Recording comments (04)

- An account comments at a position in a recording. The list is sorted by time
  or recency; markers show on the timeline; clicking a timestamp seeks.
- Authors and moderators can delete a comment. Guests can read only.

## Screen map

| Screen | Flow(s)          | Backend module              | Proven by                       |
| ------ | ---------------- | --------------------------- | ------------------------------- |
| 01     | F2, F6           | `communities`, `stats`      | pytest browse; e2e home         |
| 02     | F5, F10–F12, F14 | `chat`, `realtime`          | pytest chat; two-instance; e2e  |
| 03     | F2, F6, F7, F15  | `communities`, `recordings` | pytest; e2e offline             |
| 04     | F7, F16          | `recordings`, `chat`        | pytest comments; e2e            |
| 05     | F6, F15          | `communities`, `users`      | pytest profile                  |
| 06     | F2               | `communities`               | pytest search; e2e              |
| 07     | F9               | `realtime`, `chat`          | pytest guest rejection; e2e     |
| 08–10  | F1               | `auth`                      | pytest auth; e2e                |
| 11     | F13              | `notifications`             | pytest notifications            |
| 12–13  | F1, F13, F14     | `users`, `notifications`    | pytest settings; e2e            |
| 14     | F3, F4           | `streaming`, `communities`  | pytest lifecycle; compose smoke |
| 15     | F4, F5, F10, F12 | `streaming`, `chat`         | pytest; e2e                     |
| 16     | F11              | `chat` (emotes)             | pytest upload limits            |
| 17     | F3, F15          | `communities`               | pytest ownership                |
| 18     | F5, F15          | `chat` (moderation)         | pytest roles                    |
| 19     | F2               | web only (404)              | e2e                             |
| 20     | F4, F7           | `streaming`, `recordings`   | pytest; e2e                     |
| 21     | F4, F5           | `realtime`                  | e2e (kill the socket)           |
| M1, M2 | F2, F5           | as 01 and 02                | e2e at mobile width             |
