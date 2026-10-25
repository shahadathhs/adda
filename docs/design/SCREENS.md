# adda — Concept screens

28 screens: 26 desktop (1440 px wide) and 2 mobile. Every page shares one centred
column capped at 1280 px, the top bar (links Following, Live, Channels, Videos,
Recordings plus a global search) and the four-column footer.

Concept renders of the web app, in the dark theme (adda is dark-first; see
[DESIGN.md](../DESIGN.md)). They are design targets, not final art: stream
frames are flat placeholders for real captures, names and numbers are
invented, and spacing will be tuned when the screens are built.

Overview sheet: [overview.png](overview.png). Individual screens:
`screens/NN-name.png` (desktop 1440 px wide, mobile 390 x 844).

Regenerate everything with `node scripts/render-design.mjs` (headless Chrome;
set `CHROME_BIN` if it is not at the macOS default path), or pass screen ids
to render only those. Sources are in `docs/design/src/`: shared components in
`components.mjs` and `shells.mjs`, the real tokens in `ui.css`, and one module
per screen in `screens/`.

## Viewer

| #   | Screen              | Purpose and states                                                                                        |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| 01  | Home                | Hero with search, featured stream, following rail, sections of 8 cards with "View all"                    |
| 02  | Channel, live       | Player, chat with replies, mentions, reactions, emotes, pinned message, poll, identity                    |
| 03  | Channel, offline    | Offline panel with follow and alerts, recordings list, about and announcements                            |
| 04  | Recording playback  | Player with comment markers on the timeline, timestamped comments, comment at current time                |
| 05  | Channel profile     | Banner, badges, about, links, announcements, followers with "follower since"                              |
| 06  | Search results      | Results grouped into channels, videos and recordings, each with a count and "Filter and page through all" |
| 22  | Channels directory  | Filter bar (text, show, sort), four-column card grid, numbered pagination                                 |
| 23  | Videos directory    | Same directory pattern with filters active and "Clear filters"                                            |
| 24  | Video watch         | Player, title, channel and file details, description, "More from" the channel                             |
| 26  | About               | What adda is, four feature cards, who and where, built with                                               |
| 27  | Search dropdown     | Popover under the global search: channels, videos, recordings, "See all results"                          |
| 07  | Guest, channel live | Read-only chat, poll results without voting, sign in to follow and chat                                   |

## Account

| #   | Screen                  | Purpose and states                                                                 |
| --- | ----------------------- | ---------------------------------------------------------------------------------- |
| 08  | Sign in                 | Email and password, forgot-password link, "watch without an account" note          |
| 09  | Create account          | Username, display name, email, password, taken-username error                      |
| 10  | Reset password          | Request, check your inbox, new password, expired link, email not configured        |
| 11  | Notifications           | Bell open: went live, mentioned, replied, comment on a recording; unread state     |
| 12  | Settings, profile       | Two columns: profile and picture; status with emoji picks, chat identity, password |
| 13  | Settings, notifications | In-app toggles, optional email alerts per channel; account menu with status line   |

## Studio (streamers)

| #   | Screen               | Purpose and states                                                              |
| --- | -------------------- | ------------------------------------------------------------------------------- |
| 14  | Studio, setup        | RTMP URL, hidden stream key, rotate key, four OBS steps, waiting-for-encoder    |
| 15  | Studio, live         | Stream health, start a poll, pin a message, slow mode, recent mod actions, chat |
| 25  | Studio, videos       | Your videos with status chips, edit and delete; upload card with drop zone      |
| 28  | Studio, uploading    | Upload progress and cancel, a preparing row and a failed row with its reason    |
| 16  | Studio, emotes       | Emote grid with usage, upload with name and limits, live preview                |
| 17  | Studio, channel page | Details, links, banner, announcements with pin, delete with typed confirmation  |
| 18  | Studio, moderators   | Moderators, timeouts and bans with lift, add a moderator from followers         |

## System states

| #   | Screen          | Purpose and states                                                      |
| --- | --------------- | ----------------------------------------------------------------------- |
| 19  | Not found       | Dead channel link, search, live channels as a way out                   |
| 20  | Stream ended    | Peak viewers, recording progress, follow and alerts, chat stays open    |
| 21  | Connection lost | Player and chat reconnecting with backoff, draft kept, sending disabled |

## Mobile (390 x 844)

| #   | Screen        | Purpose and states                                           |
| --- | ------------- | ------------------------------------------------------------ |
| M1  | Home          | Following strip with live rings, single-column live list     |
| M2  | Channel, live | Player on top, chat below, pinned message and poll collapsed |

## Not in this set

- **Admin UI:** v1 has none; admin actions are API-only ([../SCOPE.md](../SCOPE.md)).
- **Light theme:** not part of the design system.
- **Marketing site:** designed separately once the app screens are agreed.
- **Motion:** the live pulse, going-live and chat motion are specified in
  DESIGN.md section 6, not shown in stills.
- **Follower list page:** a plain variant of a pattern already shown
  (follower rows). Change password is a card on the settings profile tab.
- **Recordings directory and live directory:** the same pattern as 22 and 23.

## What the screens imply (feeds the docs update)

- **Chat:** badges (owner, mod, follower), replies, mentions, reactions,
  emotes, pinned message, poll, identity mode, slow mode, timeouts, reconnect.
- **Recordings:** timestamped comments, download, processing progress.
- **Channels:** about, links, banner, announcements with pin, followers with
  join date, moderators, bans, emotes, delete with typed confirmation.
- **Accounts:** guests are read-only; identity mode; notification preferences
  with optional email; email-link password reset with a no-SMTP fallback.

## Open design issue

`web/public/logo.svg` is a purple-to-pink gradient, which DESIGN.md bans. The
renders use the Radio glyph plus the Space Grotesk wordmark in marigold, the
same as the current top bar. A real mark needs to be drawn before launch.
