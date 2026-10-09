# site/ — Agent Instructions (marketing + docs)

Astro + Starlight marketing and docs site (deploys to Vercel). Inherits
`/DESIGN.md` — read it before any UI work. The site is the public face of
the brand, so the design system applies hardest here. Conflicts resolve
in favor of `/DESIGN.md`.

## Current state (to fix on touch)

The site is stock Starlight: default light docs theme, default splash
hero, zero custom CSS. That is off-brand and must be re-themed, never
extended as-is. Known violations:

- Default light theme — adda is dark-first (`/DESIGN.md` §3)
- Default Starlight accent/links (purple family) — banned
- System font everywhere, no display face — no brand character
- Splash hero is the stock Starlight template output

## Design implementation

- Re-theme via a `src/styles/theme.css` loaded through
  `customCss` in `astro.config.mjs`, overriding `--sl-color-*`
  variables in both light and dark scopes (keep dark as the primary):
  - `--sl-color-bg` → `#0c0d10` · panels → `#14161b` · borders →
    `#262a33` (the `/DESIGN.md` §3 surface ladder)
  - Accent → marigold `#f5a623`; **text/CTAs on accent use ink
    `#1a1205`, never white**; links use marigold, not purple
  - Live red `#eb3223` only where copy refers to actual live states
- Typography: self-host Space Grotesk (woff2, 500/700) for headings,
  wordmark, and hero; body/UI stays on the system stack; code/config
  values render in the mono stack. No third-party font CDN.
- Splash page: one marigold primary CTA + ghost secondaries; feature
  content as real tables/lists/screenshots — **no three-icon-card
  grids, no emoji decoration, no gradient text**.
- Motion: `<ClientRouter />` for cross-document view transitions
  (headings morph via `view-transition-name`), scroll-driven CSS
  reveals (12px rise + fade, once, IO fallback) per `/DESIGN.md` §6.
  The live pulse motif appears wherever copy shows live states.
- Screenshots in docs must show the real product UI (ink + marigold),
  not generic mockups.

## Content conventions

- Docs content lives in `src/content/docs/` (Starlight collections);
  sidebar in `astro.config.mjs`.
- Config values, env vars, API paths: fenced code or inline mono —
  never bare body text.
- Tone: direct, self-hoster-to-self-hoster; no marketing fluff, no
  "blazing fast", no superlatives without a fact behind them.

## Code structure

- One component per file when adding Astro components
  (`src/components/`), same rule as the other apps.
- Keep the site zero-JS where possible: prefer pure CSS theming over
  client scripts; no frameworks beyond Astro/Starlight.

## Quality

- After every change: `pnpm -C site build` (and `make site-dev` to
  eyeball dark theme + splash).
- Pre-ship the `/DESIGN.md` §8 anti-slop checklist — for the site it
  is the brand's first impression.
