# adda — Chat backend design

The chat the screens show ([02](design/screens/02-channel-live.png),
[07](design/screens/07-guest-channel-live.png),
[15](design/screens/15-studio-live.png)) is more than a message list: badges,
replies, mentions, reactions, emotes, a pin, a poll, identity mode, and
moderation. This document fixes the backend design for all of it, so the
features share one model instead of accumulating special cases.

Flows and acceptance criteria are in [FLOWS.md](FLOWS.md) (F5, F9–F14).

## Principles

1. **Every write has an account.** The database always records the real
   `user_id`. Guests cannot write (F9); the gateway rejects it.
2. **The wire is public.** What is sent to viewers never contains more than a
   viewer may know. Anonymous authors are stripped on the server, not hidden by
   the client.
3. **Contract first.** New message types are added to
   `backend/modules/realtime/protocol.py` and
   `web/src/lib/types/realtime.ts` before any logic.
4. **Thin gateway.** The WebSocket handler parses, authorises and routes.
   Logic lives in `modules/chat/service/`.
5. **Postgres is the record, Redis is the speed.** Counters, rate limits,
   slow-mode keys and live poll tallies live in Redis; everything durable is in
   Postgres.

## Module layout

```
backend/modules/chat/
├── router.py          # REST: history, emotes, polls, pins, moderation
├── schemas.py         # Pydantic DTOs (public vs moderator views)
└── service/
    ├── messages.py    # send, history, delete, serialise for the wire
    ├── identity.py    # display mode, public author, reveal + audit
    ├── badges.py      # owner / mod / follower, cached per channel+user
    ├── mentions.py    # parse @name, store, notify
    ├── reactions.py   # toggle, counts, batched fan-out
    ├── pins.py        # one pinned message per channel
    ├── emotes.py      # upload validation, storage, lookup
    ├── polls.py       # create, vote, tally, close
    └── moderation.py  # timeouts, bans, slow mode, followers-only, audit
backend/modules/notifications/   # bell + optional email (F13)
```

## Data model

Messages are keyed by the streamer channel (`community_id`). The text-room
`channels` table and the memberships/join-request surface are removed
(SCOPE, M1).

| Table                     | Columns (besides id, timestamps)                                                                                                                          | Notes                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `messages`                | `community_id`, `user_id`, `content` (max 300), `kind` (`user`/`system`), `display_mode` (`named`/`anonymous`), `reply_to_id`, `deleted_at`, `deleted_by` | Soft delete. Index `(community_id, created_at desc, id)` for cursor history. |
| `message_mentions`        | `message_id`, `user_id`                                                                                                                                   | Unique pair. Drives highlight and bell.                                      |
| `message_reactions`       | `message_id`, `user_id`, `emoji`                                                                                                                          | Unique triple. Emoji from an allowlist plus channel emotes.                  |
| `emotes`                  | `community_id`, `name`, `file_key`, `created_by`                                                                                                          | Unique `(community_id, name)`; max 50 per channel.                           |
| `communities` (additions) | `pinned_message_id`, `slow_mode_seconds`, `followers_only`, `about`, `links` (json), `banner_key`                                                         | Settings the studio edits.                                                   |
| `announcements`           | `community_id`, `body`, `pinned`, `created_by`                                                                                                            | Channel page posts (F15).                                                    |
| `polls`                   | `community_id`, `question`, `created_by`, `closes_at`, `status` (`open`/`closed`)                                                                         | One open poll per channel (partial unique index).                            |
| `poll_options`            | `poll_id`, `position`, `label`, `votes`                                                                                                                   | `votes` written on close.                                                    |
| `poll_votes`              | `poll_id`, `user_id`, `option_id`                                                                                                                         | Unique `(poll_id, user_id)`.                                                 |
| `channel_bans`            | `community_id`, `user_id`, `expires_at`, `reason`, `created_by`                                                                                           | `expires_at` null means permanent.                                           |
| `mod_actions`             | `community_id`, `actor_id`, `action`, `target_user_id`, `message_id`, `detail`                                                                            | Audit: delete, timeout, ban, lift, pin, reveal.                              |
| `recording_comments`      | `recording_id`, `user_id`, `at_seconds`, `body`, `display_mode`, `deleted_at`                                                                             | F16; same identity rules as chat.                                            |
| `notifications`           | `user_id`, `kind`, `payload` (json), `read_at`                                                                                                            | Bell. Kinds: `went_live`, `mention`, `reply`, `recording_comment`.           |
| `notification_prefs`      | `user_id`, `community_id` (nullable), `bell`, `email`                                                                                                     | Per-channel overrides; `community_id` null is the default.                   |
| `users` (additions)       | `identity_mode` (`named`/`anonymous`)                                                                                                                     | Chosen in settings (screen 12).                                              |

Badges are not stored. Owner and moderator come from the channel's roles,
follower from the `follows` row; the badge list is computed when a message is
sent and cached in Redis per `(channel, user)` for a few minutes.

## Identity and anonymity

The public author of a message is built by `identity.public_author()`:

| `display_mode` | Wire `author`                                         |
| -------------- | ----------------------------------------------------- |
| `named`        | `{ id, username, display_name, avatar_url, badges }`  |
| `anonymous`    | `{ id: null, display_name: "Anonymous", badges: [] }` |

Anonymous messages carry no user id or name, and no badges that would identify
the author (an owner who chats anonymously is no longer shown as owner).
Reactions and votes follow the same rule where their authors are visible.

Revealing an author is a moderator action: `GET /chat/messages/{id}/author`
(owner, moderator of that channel, or admin) returns the account and writes a
`mod_actions` row with action `reveal`. Replies, mentions and notifications
are addressed to the real account, so they work in both modes. An anonymous
account cannot be mentioned by name because its name is never shown.

## Wire protocol

Channel strings keep their current form (`community:<id>:chat`,
`community:<id>`, `user:<id>`). Types below are added to both
`protocol.py` and `realtime.ts`.

**Client to server**

| Type                               | Data                        | Rules                                                                    |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `chat_message`                     | `content`, `reply_to?`      | Account only; length, rate limit, ban, slow mode, followers-only checked |
| `react`                            | `message_id`, `emoji`, `on` | Account only; toggles                                                    |
| `vote`                             | `poll_id`, `option_id`      | Account only; once per poll                                              |
| `subscribe`, `unsubscribe`, `ping` | as today                    | Guests may subscribe, never write                                        |

**Server to client**

| Type                                                         | Meaning                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `chat_message`                                               | New message (public author, `reply_to` preview, `mentions`, `emotes` used)                         |
| `message_deleted`                                            | Message id; clients render a tombstone where it was replied to                                     |
| `reaction_update`                                            | `{ message_id, counts }`, batched every 250 ms per message                                         |
| `pin_update`                                                 | Pinned message (or null)                                                                           |
| `poll_started`, `poll_update`, `poll_closed`                 | Poll with options; `poll_update` throttled to 2 per second                                         |
| `chat_settings`                                              | Slow mode and followers-only changed                                                               |
| `moderation`                                                 | Sent to the affected account only: timed out, banned, lifted, with expiry                          |
| `presence`, `stream_status`, `notification`, `error`, `pong` | as today; `error.code` includes `auth_required`, `rate_limited`, `banned`, `slow_mode`, `too_long` |

Every server message about chat content carries an `id`, so a reconnecting
client can ask for `GET /chat/messages?after=<id>` and merge without
duplicates.

## REST

| Endpoint                                                  | Purpose                                    |
| --------------------------------------------------------- | ------------------------------------------ |
| `GET /communities/{id}/messages?before=&limit=`           | History, cursor pagination, public authors |
| `GET /chat/messages/{id}/author`                          | Reveal (moderators); audited               |
| `POST/DELETE /communities/{id}/pin`                       | Pin and unpin (owner, moderator)           |
| `GET/POST/DELETE /communities/{id}/emotes`                | List, upload (multipart), remove           |
| `POST /communities/{id}/polls`, `POST /polls/{id}/end`    | Start and end a poll                       |
| `PUT /communities/{id}/chat-settings`                     | Slow mode, followers-only                  |
| `GET/POST/DELETE /communities/{id}/bans`                  | Timeouts and bans                          |
| `GET/POST/DELETE /communities/{id}/moderators`            | Owner manages moderators                   |
| `GET/POST/DELETE /recordings/{id}/comments`               | F16                                        |
| `GET /notifications`, `POST /notifications/read`          | Bell                                       |
| `GET/PUT /me/notification-prefs`, `PUT /me/identity-mode` | Settings                                   |

## Rules and limits

- **Length:** 1–300 characters, control characters stripped, surrounding
  whitespace trimmed.
- **Rate limit:** token bucket per account and channel in Redis (default 5
  messages burst, 1 per second sustained). Owners and moderators are exempt.
- **Slow mode:** a Redis key `slow:<channel>:<user>` with TTL equals the
  configured seconds. **Followers-only:** the sender needs a follow row.
- **Duplicates:** an identical message from the same account within 10
  seconds is dropped.
- **Emotes:** content type is sniffed, not trusted; PNG, GIF or WebP, at most
  256 KB and 128 x 128 px; stored under the uploads volume with a generated
  file name; the user-supplied name is only ever a lookup key.
- **Reactions:** allowlist of about eight emoji plus the channel's emotes; a
  user may add up to 5 distinct reactions per message.
- **Polls:** 2–4 options, 30 seconds to 30 minutes. While open, tallies are
  Redis hashes (`HINCRBY`), written to `poll_options.votes` on close. A server
  restart reconciles open polls from `poll_votes`.
- **Moderation order of checks on send:** authenticated, not banned or timed
  out, followers-only, slow mode, rate limit, then length.

## Scaling and reliability

- Fan-out uses the existing Redis pub/sub, so any number of backend instances
  work. Reaction and poll updates are coalesced before publish to cap event
  rate.
- Presence and viewer counts keep their current Redis-backed implementation.
- History queries fetch authors, badges, mentions and reaction counts in one
  batched pass per page, not per message.
- Soft-deleted messages stay in the table for audit, with content blanked in
  responses.

## Tests

| Area                 | pytest checks                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| Guests               | every write type rejected with `auth_required`, over REST and WebSocket                                  |
| Identity             | anonymous payload has no id or name; reveal needs a moderator and writes an audit row; outsiders get 403 |
| Messages             | length, rate limit, duplicate drop, slow mode, followers-only, ban and timeout expiry                    |
| Replies and mentions | preview, deleted parent tombstone, mention creates a notification only for that account                  |
| Reactions            | toggle, allowlist, per-message cap, batched update                                                       |
| Emotes               | oversize, wrong type, duplicate name, 50 limit, deletion renders plain text                              |
| Polls                | one open poll, one vote per account, tally survives a restart, closes on time                            |
| Moderation           | roles can and cannot act; each action writes `mod_actions`                                               |
| Fan-out              | two backend instances: chat, polls and reactions reach clients on both                                   |
| Reconnect            | catch-up with `after=` returns missed messages without duplicates                                        |

## Build order

1. Migration: messages by channel, drop text rooms, drop memberships (done:
   `d9a3f1c2b7e4`; also adds `channel_moderators`, soft delete and the
   300-character limit).
2. Contract: all new types in `protocol.py` and `realtime.ts`.
3. Messages, identity, badges, history; guest rejection.
4. Replies, mentions, notifications plumbing.
5. Reactions, pins.
6. Emotes.
7. Polls.
8. Moderation and rate limits.
9. Recording comments.

Each step ships with its pytest coverage and its screens (SCOPE, M2).
