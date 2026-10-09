# apps/web — Agent Instructions (viewer app)

Next.js 15 App Router viewer app. Inherits `/DESIGN.md` — read it before
any UI work. This file adds web-specific hard rules. Conflicts resolve in
favor of `/DESIGN.md`.

## Design implementation

- Tokens live in `src/app/globals.css` as shadcn-style CSS variables
  (`--background`, `--primary`, …) mapped through `@theme inline`.
  Values come from `/DESIGN.md` §3 — the current violet values
  (`hsl(262 83% 58%)`) are legacy and must be replaced, never reused.
- Accent = marigold `#f5a623` with **ink** `accent-fg` `#1a1205` on
  accent fills. Never white-on-accent.
- Live red `--live: #eb3223` is a separate token; never substitute the
  accent for live states.
- Space Grotesk loads via `next/font` (`latin` subset, weights 500/700)
  as `--font-display`; body stays on the system stack; `font-num` =
  mono + `tabular-nums` for counts, durations, keys.
- Radii: use the scale (4/6/8px) via `--radius-sm|md|lg`. Ban
  `rounded-xl`+ on controls.
- Motion: CSS-first springs from `/DESIGN.md` §6 — 120ms micro
  (`--ease-micro`), 250ms state (`--ease-spring`), View Transitions for
  navigation (thumbnail morphs into the player via
  `view-transition-name`), `@starting-style` +
  `allow-discrete` for entries/exits. Only `transform`/`opacity`
  animate. No animation libraries without PR justification.
- SSR pages (`/`, `/channel/[slug]`) render with the same tokens — no
  flash of the old theme; check no-JS rendering too.

## Code structure

- **One exported React component per file.** A file may contain small
  private helpers, but exactly one default/primary export.
- Current violations to fix when touched (split, don't grow):
  - `src/components/channel-view.tsx` — 4 components
  - `src/app/settings/page.tsx` — 4
  - `src/components/browse-client.tsx` — 3
  - `src/components/top-bar.tsx`, `src/app/reset-password/page.tsx` — 2
- `src/components/ui/` holds primitives (one file per primitive);
  feature components live beside their route or in
  `src/components/<feature>/`.
- Server components fetch via `src/lib/ssr.ts` (`API_SSR_URL`); client
  code uses `@adda/api-client`. Never fetch on the client what SSR
  already renders for a route.

## Quality

- After every change: `pnpm -C apps/web lint && pnpm -C apps/web build`.
- Pre-ship the `/DESIGN.md` §8 anti-slop checklist.
