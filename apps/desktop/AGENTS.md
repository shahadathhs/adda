# apps/desktop — Agent Instructions (Adda Console)

Tauri v2 + Vite + React operator console. Inherits `/DESIGN.md` — read it
before any UI work. This file adds console-specific hard rules. Conflicts
resolve in favor of `/DESIGN.md`.

## Design implementation

- Tokens live in `src/styles/index.css` under `@theme`. Surfaces are
  already correct (`#0b0d10` / `#12151a` / `#171b22` / `#232833`).
- Accent was violet `#8b5cf6` — **legacy, banned**. Replace with
  marigold: `--color-accent: #f5a623`, hover `#e29500`, active
  `#c98400`, `--color-accent-fg: #1a1205` (ink on marigold, never
  white), subtle `rgba(245,166,35,0.14)`.
- Live red `#eb3223` replaces `--color-live: #ef4444`; live red is for
  on-air states only, never actions.
- The console never loads webfonts — system stack stays. Character
  comes from density, alignment, and mono numerics.
- `font-num` (mono + tabular-nums) is mandatory for viewer counts,
  bitrates, durations, stream keys, IDs.
- Radii: 3/4/6px per `/DESIGN.md` §5; ban `rounded-xl`+.
- Motion: the shared spring voice from `/DESIGN.md` §6 — 120ms micro,
  250ms state (`--ease-spring`), tab indicator slides between tabs as a
  measured transform. SPA: no view transitions; panels animate
  transform/opacity only so the window feels native. Same identity kit
  as web — screenshots must read as the same product.

## Console conventions (unchanged)

- Dense, dark, keyboard-first: ⌘K palette, ⌘1–⌘7 view switching.
- Native notifications on `stream_status` WS events.
- Runtime server URL (`@adda/shared`); auth = same rotating refresh
  tokens as web.

## Code structure

- **One exported React component per file.** Small private helpers are
  fine; exactly one primary export per file.
- Current violations to fix when touched (split, don't grow):
  - `src/ui/table.tsx` — 5 components
  - `src/app/app.tsx` — 4
  - `src/views/communities-view.tsx` — 3
  - `src/views/users-view.tsx`, `src/views/recordings-view.tsx`,
    `src/ui/context-menu.tsx` — 3
  - `src/views/console-layout.tsx`, `src/ui/panel.tsx`,
    `src/views/dashboard-view.tsx`, `src/views/creator/overview.tsx`,
    `src/views/creator/members.tsx` — 2
- Views go in `src/views/`, shared primitives in `src/ui/` (one file
  per primitive), feature logic in `src/lib/` + `@adda/*` packages.

## Quality

- After every change: `pnpm -C apps/desktop lint`.
- Pre-ship the `/DESIGN.md` §8 anti-slop checklist.
