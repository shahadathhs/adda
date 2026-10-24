# adda — Concept screens

Concept renders of the web app, in the dark theme (adda is dark-first; see
[/DESIGN.md](../../DESIGN.md)). They are design targets, not final art: stream
frames are flat placeholders for real captures, names and numbers are
invented, and spacing will be tuned when the screens are built.

Regenerate every PNG with `node scripts/render-design.mjs` (headless Chrome;
set `CHROME_BIN` if it is not at the macOS default path). Sources are in
`docs/design/src/` — shared components in `components.mjs`, styles in
`ui.css` (the real tokens), one module per screen in `screens/`.

Desktop screens render at 1440 px wide. Individual files: `screens/NN-name.png`.

## Viewer

| #   | Screen              | Purpose and states                                                                       | Status   |
| --- | ------------------- | ---------------------------------------------------------------------------------------- | -------- |
| 01  | Home                | Featured live channel, following rail, live grid, recent recordings                      | rendered |
| 02  | Channel, live       | Player, chat with replies/mentions/reactions/emotes, pinned message, live poll, identity | rendered |
| 03  | Channel, offline    | Offline panel, latest recording, recordings list, follow and alerts                      | planned  |
| 04  | Recording playback  | Player with timeline markers, timestamped comments, click a time to seek                 | planned  |
| 05  | Channel profile     | About, links, badges, announcements, followers                                           | planned  |
| 06  | Browse and search   | Search results, empty result, filter live only                                           | planned  |
| 07  | Guest, channel live | Read-only chat; "Sign in to chat" instead of the composer; poll shown, vote disabled     | planned  |

## Account

| #   | Screen                  | Purpose and states                                                           | Status  |
| --- | ----------------------- | ---------------------------------------------------------------------------- | ------- |
| 08  | Sign in                 | Email and password, forgot-password link                                     | planned |
| 09  | Create account          | Username, email, password, error states                                      | planned |
| 10  | Reset password          | Request link, check-your-inbox, set new password, expired link               | planned |
| 11  | Notifications           | Bell open: went live, mentioned, replied, unread dot                         | planned |
| 12  | Settings, profile       | Display name, bio, avatar, identity mode (named or anonymous)                | planned |
| 13  | Settings, notifications | Per-channel alerts, email alerts opt-in (shown only when SMTP is configured) | planned |

## Studio (streamers)

| #   | Screen               | Purpose and states                                             | Status  |
| --- | -------------------- | -------------------------------------------------------------- | ------- |
| 14  | Studio, set up       | Create channel, stream key and RTMP URL, OBS steps, rotate key | planned |
| 15  | Studio, live control | Connection health, viewers, start poll, pin message, mod list  | planned |
| 16  | Studio, emotes       | Upload, name, preview, remove emotes                           | planned |
| 17  | Studio, channel page | Edit title, about, links, announcements                        | planned |

## System states

| #   | Screen          | Purpose and states                                                       | Status  |
| --- | --------------- | ------------------------------------------------------------------------ | ------- |
| 18  | Not found       | Dead channel link                                                        | planned |
| 19  | Stream ended    | Live page after the broadcast stops: recording is processing, follow CTA | planned |
| 20  | Connection lost | Chat reconnecting with backoff, player reconnecting                      | planned |

## Mobile (390 x 844)

| #   | Screen        | Purpose and states                        | Status  |
| --- | ------------- | ----------------------------------------- | ------- |
| M1  | Home          | Single-column live list, following strip  | planned |
| M2  | Channel, live | Player on top, chat below, poll collapsed | planned |

## Not in this set

- **Admin UI:** v1 has none; admin actions are API-only ([../SCOPE.md](../SCOPE.md)).
- **Light theme:** not part of the design system.
- **Marketing site:** designed separately once the app screens are agreed.
- **Motion:** the live pulse, going-live and chat motion are specified in
  DESIGN.md section 6, not shown in stills.

## Open design issue

`web/public/logo.svg` is a purple-to-pink gradient, which DESIGN.md bans. The
renders use the Radio glyph plus the Space Grotesk wordmark in marigold, the
same as the current top bar. A real mark needs to be drawn before launch.
