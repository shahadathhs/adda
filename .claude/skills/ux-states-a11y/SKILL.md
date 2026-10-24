---
name: ux-states-a11y
description: Use when building or reviewing interactive UI in web/ or site/ — forms, buttons, dialogs, lists, the player, chat. Covers required UI states, keyboard and focus behaviour, and WCAG 2.2 AA checks.
---

# States and accessibility

Generated UI usually shows only the happy path. adda ships every state and is
usable by keyboard and screen reader (WCAG 2.2 AA).

## Required states (per data view / form / action)

| State                  | What it must do                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Loading                | Skeleton or inline indicator shaped like the content; no layout shift when data arrives                    |
| Empty                  | Say what this place is for and give the next action ("No streams live. Follow channels to see them here.") |
| Error                  | Plain-language cause + a retry or fix; never a raw status code or stack                                    |
| Offline / reconnecting | Chat and player show connection state; WebSocket backoff is visible, history catches up                    |
| Disabled / pending     | Buttons show progress ("Signing in…") and cannot double-submit                                             |
| Overflow               | Long names truncate with title; missing avatar/banner has a designed fallback                              |
| Success                | Confirm quietly (toast or inline), and say what changed                                                    |

Destructive actions (delete channel, rotate stream key, force-stop) need a
confirmation that names the consequence; deletion uses typed confirmation.

## Keyboard and focus (WCAG 2.2 AA)

- Everything operable by keyboard in a logical order; no keyboard traps.
- Visible focus on every control (2.4.7), contrast ≥ 3:1 against its
  surroundings (1.4.11). Use the `ring` token; never `outline-none` without a replacement.
- Focus not obscured (2.4.11): the sticky header must not cover a focused
  element — use `scroll-margin-top` on focus targets.
- Target size ≥ 24×24 CSS px (2.5.8); prefer 32–40px for primary controls.
- Drag-only interactions need a single-pointer alternative (2.5.7).
- Dialogs/popovers: focus moves in, `Esc` closes, focus returns to the trigger.

## Semantics and perception

- Real elements: `button` for actions, `a` for navigation, `label` bound to every
  input, one `h1` per page, landmarks (`header`, `nav`, `main`).
- Icon-only buttons get `aria-label`; decorative icons get `aria-hidden`.
- Text contrast ≥ 4.5:1 (3:1 for large text). Never convey state by colour
  alone — live is red **and** says "LIVE".
- Announce dynamic changes: chat uses a polite live region (rate-limited), errors
  use `role="alert"`.
- Honour `prefers-reduced-motion`; no auto-playing audio (the player starts muted).
- Video: provide controls, and recordings must be playable without a mouse.

## Quick test

Tab through the page with the mouse unplugged, then zoom to 200%, then
throttle the network and kill the WebSocket. Anything confusing or broken is a bug.
