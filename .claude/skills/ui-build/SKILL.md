---
name: ui-build
description: Use before writing or changing any UI in web/ or site/ (components, pages, styles, copy). Forces a design pass against /docs/DESIGN.md so the result is recognisably adda and not default generated UI.
---

# Building UI for adda

The failure mode is the average of every dashboard template: purple accent,
one sans font, three equal cards, soft shadows, rounded-everything, "John Doe".
Avoid it by deciding first and building from tokens — never from adjectives like
"clean and modern".

## 1. Before any code

1. Read `/docs/DESIGN.md` (§3 colour, §4 type, §5 geometry, §6 motion, §7 patterns)
   and the surface file: `web/AGENTS.md` or `site/AGENTS.md`.
2. Look at 2–3 existing components in the same area (`web/src/components/`)
   and reuse their anatomy. A new screen should look like a sibling of those.
3. State, in one or two lines, the decision this screen is making: what is the
   one primary action, and what does the viewer look at first? If you cannot
   say, stop and ask the user.

## 2. Build from constraints

- **Colour:** only tokens (`bg-background`, `bg-card`, `text-primary`, `border-border`…).
  Marigold = actions and brand. Live red = live state only. Ink text on accent
  fills, never white. No raw hex in components.
- **Type:** Space Grotesk for display, system stack for body, mono + tabular
  numerals for counts, keys, timers and durations. Use the scale in DESIGN.md §4.
- **Shape:** radii 4/6/8px only. Separate surfaces with the ink ladder and one
  1px border — not shadows, not glass, not gradients.
- **Layout:** do not default to "grid of equal cards". Pick hierarchy: one
  dominant element (the player, the live grid's first row) and quiet supporting
  content. Vary density deliberately.
- **Motion:** spring tiers from DESIGN.md §6 (120ms micro, 250ms state); animate
  `transform` and `opacity` only; honour `prefers-reduced-motion`.
- **Content:** real, product-specific copy and plausible data (channel names,
  stream titles, viewer counts). Never "Lorem ipsum", "Acme", "John Doe".
  Microcopy is plain and specific: "Stream key rotated. Your encoder was
  disconnected." not "Success!".
- **Structure:** one exported React component per file; use `lucide-react`
  icons, never emoji.

## 3. Always design the states

Every data-driven view ships all of these (see `ux-states-a11y`): loading,
empty, error, offline/live, and long or missing content (no avatar, long title,
zero viewers).

## 4. Verify

1. `pnpm lint && pnpm typecheck && pnpm check:design` — the design gate must show 0 errors.
2. Run the app, open the page, and look at it at 375px and 1280px width. Fix
   what you see; do not trust the code alone.
3. Subtract pass: remove any decoration that is not carrying information.
4. Walk the DESIGN.md §8 checklist. The logo-covered test: could this be any
   other product? If yes, redo it.
