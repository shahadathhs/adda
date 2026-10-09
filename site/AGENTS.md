# site/ — Agent Instructions (marketing + docs)

Astro + Starlight marketing and docs site (deploys to Vercel). Inherits
`/DESIGN.md` — read it before any UI work. The site is the public face of
the brand, so the design system applies hardest here. Conflicts resolve
in favor of `/DESIGN.md`.

## Current state

Re-themed (2026-10): `src/styles/theme.css` carries the full identity —
ink ladder + marigold in dark (primary scope), warm paper in light,
Space Grotesk self-hosted at `public/fonts/`, purple family remapped to
ochre, live-red hue fixed. Splash hero uses display type with a staggered
entrance. When touching UI, extend these tokens — never hardcode colors
or reintroduce framework defaults.

Known follow-ups (not blockers):
- Expressive-Code block theme still stock — tune to the ink ladder
- Cross-document view transitions (ClientRouter) deferred — the site
  stays zero-JS-first; revisit if navigation motion is wanted

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
- Motion: pure CSS only per `/DESIGN.md` §6 — `linear()` springs,
  `@starting-style` entrances, scroll-driven reveals with IO fallback.
  No animation libraries; keep the site zero-JS. The live pulse motif
  appears wherever copy shows live states.
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

- **The landing page is fully bespoke** — `src/pages/index.astro` is a
  plain Astro page (own `<head>`, header, footer; **no Starlight
  shell**). Section order: `site-header` → `landing-hero` → `hero-mock`
  (browser-frame browse-page mock, the hero centerpiece) →
  `landing-demos` → `landing-cta` → `landing-why` → `site-footer`.
- Starlight chrome is for docs routes only. Anything product-y renders
  in the bespoke system: `.sl-link-button` base styles live in
  `src/styles/theme.css` so buttons match on both landing and docs.
- Theme lives in `src/styles/theme.css` (ink ladder + marigold, both
  scopes, landing reset) with Space Grotesk self-hosted in
  `public/fonts/`. Demo/mock components render the real product anatomy
  from `/DESIGN.md` §7 — flat surfaces only, no gradients.
- Docs content lives in `src/content/docs/` (Starlight collections;
  sidebar in `astro.config.mjs`). There is intentionally no
  `docs/index.md` — the landing owns `/`.
- One component per file when adding Astro components
  (`src/components/`), same rule as the other apps.
- Keep the site zero-JS where possible: prefer pure CSS theming over
  client scripts; no frameworks beyond Astro/Starlight.

## Quality

- After every change: `pnpm -C site build` (and `make site-dev` to
  eyeball dark theme + splash).
- Pre-ship the `/DESIGN.md` §8 anti-slop checklist — for the site it
  is the brand's first impression.
