# adda Design System

The single source of truth for how adda looks and feels. Every surface
implements this system; per-app `AGENTS.md` files add surface-specific
hard rules.

**Surfaces — one product, three densities:**

| Surface | Location | Density | Type |
|---|---|---|---|
| Viewer web app | `apps/web/` | medium, content-first | display + system + mono |
| Operator console | `apps/desktop/` | dense, keyboard-first | system + mono (no webfonts) |
| Marketing + docs | `site/` | editorial spacing | display + system + mono |

**The surfaces are one product.** Density and chrome vary; the identity
kit is identical everywhere and copied verbatim, never reinterpreted:

- marigold accent + ink-on-accent · live red + the live pulse motif
- Space Grotesk display voice · mono tabular numerics
- the radius scale · the surface ladder · the spring curves
- button, stream-card, chat, and empty-state anatomy

Recognition test: cover the logo in a screenshot of any surface. If you
can't tell it's adda within two seconds, the implementation drifted —
fix it before shipping.

**Why this exists:** unconstrained AI-generated UI converges on one look —
shadcn default violet, `rounded-xl` cards, system font, timid palettes.
This document is the constraint. Every choice below is deliberately
non-default. When implementing UI, treat this file as law: drift toward
defaults is a bug.

---

## 1. Brand

**adda** (আড্ডা) — Bengali for an informal, wide-ranging conversation among
friends. The brand is *warm conversation in a dark room*.

| Concept | Expression |
|---|---|
| Warmth | Marigold accent — borrowed from marigold garlands, not from SaaS |
| Liveness | Live red is its own token, never the brand accent |
| Density | Content-first: video and chat dominate, chrome recedes |
| Precision | Counts, keys, timers always in tabular mono |

### The two-color rule (sacred)

**Brand accent (marigold) and live red are separate tokens and never
substitute for each other.**

- Marigold = actions, links, focus, brand moments
- Live red = on-air state, recording, force-stop — *only*

If a surface is live, it shows live red. Buttons never turn red "for
emphasis". This is the single most important rule in the system.

---

## 2. Aesthetic axioms

The five non-default decisions everything else derives from:

| Axiom | adda | Escapes the default of |
|---|---|---|
| Density | Web: medium, content-first · Desktop: dense, 13px base | spacious SaaS layouts |
| Radius | 4px controls / 6px panels / 8px media | `rounded-xl` everywhere |
| Saturation | one warm accent on near-black ink; state colors quiet | timid slate-on-white |
| Type | grotesk display + system body + mono numerics | Inter-for-everything |
| Motion | spring tiers: 120ms micro / 250ms state / signature moments | flat 400ms+ ease-out mush |

---

## 3. Color

### Surface ladder (dark-first)

Layering goes **dark → less dark** as surfaces elevate; text runs the
inverse. This is the ink-ladder pattern, not slate-gray flatness.

| Token | Web value | Desktop value | Role |
|---|---|---|---|
| `bg` | `#0c0d10` | `#0b0d10` | page background |
| `panel` | `#14161b` | `#12151a` | cards, sidebars, chat |
| `panel-2` | `#1c1f26` | `#171b22` | hover fills, secondary panels |
| `input` | `#262a33` | — | inputs, search fields |
| `line` | `#262a33` | `#232833` | borders, dividers |

Never use pure `#000` or pure `#fff` as surfaces. Never place alpha
borders on top of each other — draw each border once, solid.

### Text

| Token | Web | Desktop | Role |
|---|---|---|---|
| `fg` | `#edeef2` | `#e7ebf2` | primary text |
| `fg-muted` | `#9aa1af` | `#8b94a3` | secondary text, metadata |
| `fg-subtle` | `#676e7c` | — | timestamps, captions |

### Accent — marigold

| Token | Value | Role |
|---|---|---|
| `accent` | `#f5a623` | primary buttons, links, active states, focus |
| `accent-hover` | `#e29500` | hover |
| `accent-active` | `#c98400` | pressed |
| `accent-fg` | `#1a1205` | text/icons ON marigold — **dark ink, never white** |
| `accent-subtle` | `rgba(245,166,35,0.14)` | tinted fills, selected rows, mentions |

White text on marigold fails contrast and looks cheap. Ink on marigold is
the brand signature — protect it.

### State colors

| Token | Value | Role |
|---|---|---|
| `live` | `#eb3223` | LIVE badges, on-air dots, recording — only |
| `danger` | `#ef4444` | destructive actions, errors |
| `ok` | `#2fbf71` | success, online, healthy |
| `warn` | `#e0a33e` | warnings, degraded |

### Charts/data-viz

`#f5a623` `#4cc38a` `#5aa9e6` `#d67ab1` `#8f7ff0` — in that order.
Used by charts only, never for UI chrome.

### What is banned

- Violet/purple anywhere in brand surfaces (`#8b5cf6`, `hsl(262 …)`,
  purple gradients) — the AI-slop tell
- White text on accent fills
- Glassmorphism, gradient text, neon glows (the live pulse dot excepted)
- Default shadcn palette values (`hsl(222 47% 11%)` et al.)
- Starlight's default accent/links (`--sl-color-accent` purple) on the
  marketing site — always re-themed to marigold

### Marketing/docs surface additions (`site/`)

The site is public-facing brand, so it carries the identity hardest:

- Dark-first everywhere — the splash and docs read as the product, not
  as a generic light docs theme
- Splash hero: Space Grotesk display at `display`/`h1` scale, one
  marigold primary CTA (ink text) + ghost secondary CTAs
- The word "live" in marketing copy takes live red styling where it
  refers to the product's live states — never marigold
- Feature tours are real content (tables, short lists, screenshots) —
  no three-icon-card grids, no emoji decoration
- Docs body text stays system font; only headings/display use Space
  Grotesk; stats and config values render mono
- Screenshots show the real product UI (ink + marigold), never mocked-up
  generic frames

---

## 4. Typography

Web and site ship one webfont (display); desktop ships none (native feel).
The site self-hosts Space Grotesk as woff2 (no third-party font CDN).

| Role | Face | Notes |
|---|---|---|
| Display / headings / wordmark | **Space Grotesk** 500/700 | `next/font` (web), self-hosted woff2 (site) |
| Body / UI | system stack (`-apple-system, "Segoe UI", Roboto, …`) | never a webfont |
| Numerics / keys / durations | `ui-monospace, "SF Mono", …` + `tabular-nums` | class `font-num` |

### Scale (web)

| Style | Size/line | Weight | Tracking |
|---|---|---|---|
| display | 40/44 | 700 | -0.02em |
| h1 | 28/32 | 700 | -0.01em |
| h2 | 20/28 | 600 | -0.01em |
| h3 | 16/22 | 600 | 0 |
| body | 14/20 | 400 | 0 |
| secondary | 13/18 | 400 | 0 |
| caption | 12/16 | 500 | 0.01em |

Desktop base is 13px with the same proportions; scale down one step
(h2 → 15px, body → 13px, caption → 11px).

Rules:

- All viewer counts, durations, bitrates, sizes, stream keys: mono,
  tabular. No exceptions.
- Uppercase + tracking is reserved for LIVE badges and section eyebrows.
- Headings use Space Grotesk; buttons/inputs/labels use system.

---

## 5. Geometry

### Radius scale — the only radii allowed

| Token | Value | Used for |
|---|---|---|
| `radius-xs` | 3px | badges, tiny chips |
| `radius-sm` | 4px | buttons, inputs, menu items |
| `radius-md` | 6px | panels, cards, tooltips |
| `radius-lg` | 8px | media cards, modals |
| `radius-pill` | 999px | tags only |
| `radius-round` | 50% | avatars only |

`rounded-xl` (12px+) is banned on everything.

### Spacing

4px base grid. Web: 8 / 12 / 16 / 24 (component → section).
Desktop: 4 / 8 / 12 / 16. Page gutters: 24 web, 12 desktop.

### Fixed chrome

| Surface | Web | Desktop |
|---|---|---|
| Top bar | 56px | 36px (titlebar) |
| Chat panel | 320–340px, collapsible | per-tab layout |
| Control heights | 32px buttons, 36px inputs | 24–26px controls |
| Icon buttons | 32px | 24px |

### Elevation

Three levels, translucent black only (never opaque gray):

| Level | Shadow |
|---|---|
| 1 | `0 1px 2px rgba(0,0,0,.4)` — cards |
| 2 | `0 4px 12px rgba(0,0,0,.5)` — dropdowns, popovers |
| 3 | `0 8px 32px rgba(0,0,0,.6)` — modals |

Prefer surface-ladder elevation over shadows; shadows are for floating
elements only.

---

## 6. Motion

Motion is physics, not decoration: it tells you what changed, where it
came from, and what the product is doing. Static-everywhere feels dead;
bouncy-everywhere feels cheap. adda uses spring motion with tight,
purposeful tiers — the same curve family on every surface.

### Spring tokens (the shared voice)

```css
/* Standard spring — subtle overshoot, state changes */
--ease-spring: linear(
  0, 0.0036 0.68%, 0.0183 1.65%, 0.0679 3.31%, 0.1772 5.75%,
  0.3628 8.42%, 0.5919 11.28%, 0.7879 14.15%, 0.9307 16.95%,
  1.0152 19.94%, 1.0424 22.99%, 1.0455 25.9%, 1.0351 28.65%,
  1.0117 33.05%, 0.9866 38.72%, 0.978 45.4%, 0.9866 55.5%,
  0.9973 71.4%, 1
);

/* Micro spring — no visible overshoot, feedback only */
--ease-micro: linear(
  0, 0.0147 1.42%, 0.0679 3.31%, 0.216 6.28%, 0.5118 10.49%,
  0.8105 14.79%, 0.9758 18.87%, 1.0304 22.66%, 1.0405 26.15%,
  1.0267 31.19%, 1.0042 38.85%, 0.9964 47.36%, 1
);
```

### Tiers

| Tier | When | Duration / curve |
|---|---|---|
| Micro feedback | hover, focus, press, toggle | 120ms `--ease-micro` |
| State change | panels, popovers, dialogs, tab indicators | 250ms `--ease-spring` |
| Navigation | route/view transitions | 300ms crossfade + 8px slide |
| Signature | going live/offline, celebrations | 400–600ms `--ease-spring` |
| Entrance choreography | lists, grids, site sections | 250ms spring, 35ms stagger, total ≤400ms |

**Exits are 0.7× their entrance.** Leaving should feel faster than
arriving.

### Signature interactions (identical on every surface)

- **The live pulse** — the brand's heartbeat: live-red dot with a
  2s expanding ring (`scale 1→1.8, opacity .6→0`). Same motif on
  thumbnails, the player, the console sidebar, the site.
- **Going live** — thumbnail/player crossfades 400ms while the LIVE
  badge pops in (`scale .6→1`, spring). The moment a channel turns on
  feels like power-on, everywhere.
- **The marigold press** — primary buttons compress to `scale .97` on
  press and spring back. Ink fill, no color shift on press.
- **Shared element continuity** — when a stream card opens the channel
  page, the thumbnail morphs into the player (View Transitions
  `view-transition-name`). The stream never "jumps".

### Element rules

| Element | Motion |
|---|---|
| Buttons | press `scale .97`, 120ms micro spring return |
| Popover/dialog/menu | `scale .97→1` + fade + 4px rise, 250ms spring; exit 175ms |
| Stream card | hover lift `translateY(-2px)` + thumbnail `brightness 1.05`, 120ms |
| Tab indicator (console) | slides between tabs, 250ms spring (measured transform, not per-tab re-render) |
| ⌘K palette | `scale .98→1` + fade, 150ms |
| Chat message | new message rises 4px + fades, 150ms; auto-scroll only when already at bottom |
| Viewer counts | digits swap in place — tabular mono keeps width stable; **no odometer rolls** |
| Site page change | cross-document View Transition crossfade; headings morph via `view-transition-name` |
| Site scroll reveals | 12px rise + fade, once per element, `animation-timeline: view()` with IO fallback |

### Engineering rules

- Animate **only `transform` and `opacity`**. Never width/height/top/
  left/margin — layout animation is banned.
- Nothing above the fold animates on first paint (LCP is sacred);
  entrances run once, on mount, not on every re-render.
- `prefers-reduced-motion: reduce` → springs become 1ms, pulse/ring/
  reveals become static opacity. Content is never hidden behind
  animation when reduced motion is on.
- Tech per surface — no heavy animation libraries by default:
  - **Web (Next 15):** CSS-first (`linear()` springs,
    `@starting-style` for entries, `transition-behavior: allow-discrete`
    for exits, View Transitions API). Add a spring library only if
    choreography genuinely exceeds CSS — justify it in the PR.
  - **Desktop (Tauri):** same CSS springs; SPA so no view transitions —
    keep panels to transform/opacity for a native window feel.
  - **Site (Astro 5):** `<ClientRouter />` for cross-document view
    transitions; scroll-driven CSS animations with IntersectionObserver
    fallback.

---

## 7. Component patterns

### Stream card (the most important component)

```
┌─────────────────────────┐
│ 16:9 thumbnail          │  radius-lg, hover: translateY(-2px) + shadow-1
│ [LIVE]          128 👁  │  LIVE: top-left, live red, 11px 700 uppercase
└─────────────────────────┘  viewers: bottom-left, overlay rgba(0,0,0,.6),
│ ◉  Title one line…      │  white text, mono tabular count
│    channel · category   │  avatar 36px round; title 14/600 fg;
└─────────────────────────┘  meta 13 fg-muted; category hover → accent
```

### Buttons

| Variant | Fill | Text |
|---|---|---|
| primary | `accent` | `accent-fg` (ink) |
| secondary | transparent, 1px `line` border | `fg`; hover: `panel-2` |
| ghost | transparent | `fg-muted`; hover: `panel-2` + `fg` |
| danger | `danger` | white (red passes with white) |
| on-live | n/a — never accent a live state with marigold | |

Height 32px web / 26px desktop; 13px 600 label; radius-sm.

### Chat

13px/18px lines, `panel` background, 8px row spacing. Username 600 in
per-user color, message `fg`. Emotes/emoji render inline at 20px+.
Mentions: `accent-subtle` background, radius-xs. Compact, scannable,
no bubbles.

### Live indicator

`live` red fill, white 11px 700 uppercase "LIVE", radius-xs, with the
2s pulse dot. Used identically on thumbnails, player, sidebar, lists.

### Empty states

One line of `fg-muted`, no illustration zoo, at most one ghost action.

---

## 8. Anti-slop checklist

Run before shipping any UI change:

- [ ] No violet/purple, no gradient text, no glass, no neon glows
- [ ] Every radius comes from the scale (no `rounded-xl`)
- [ ] Accent fills carry ink text, not white
- [ ] Live red only on live states; marigold only on actions/brand
- [ ] Counts/keys/timers are mono tabular
- [ ] Surfaces use the ladder; no pure black/white surfaces
- [ ] Borders drawn once, from `line`
- [ ] Motion uses the spring tiers; only `transform`/`opacity` animate
- [ ] Recognizably adda with the logo covered (any surface)
- [ ] One exported component per file
- [ ] Looks like adda, not like a v0 output — if you can't tell, redo it

---

## 9. Agent quick reference

```yaml
bg: "#0c0d10"          # web / "#0b0d10" desktop
panel: "#14161b"       # web / "#12151a" desktop
panel2: "#1c1f26"      # web / "#171b22" desktop
input: "#262a33"
line: "#262a33"        # web / "#232833" desktop

accent: "#f5a623"      # marigold — actions, links, focus
accent_hover: "#e29500"
accent_active: "#c98400"
accent_fg: "#1a1205"   # ink on marigold — NEVER white
accent_subtle: "rgba(245,166,35,0.14)"

live: "#eb3223"        # live states ONLY
danger: "#ef4444"
ok: "#2fbf71"
warn: "#e0a33e"

fg: "#edeef2"          # web / "#e7ebf2" desktop
fg_muted: "#9aa1af"    # web / "#8b94a3" desktop
fg_subtle: "#676e7c"

font_display: "Space Grotesk"   # headings, wordmark (web)
font_body: "system-ui stack"
font_mono: "ui-monospace + tabular-nums for counts/keys/durations"

radius: { xs: 3, sm: 4, md: 6, lg: 8, pill: 999 }   # px
motion:
  micro:  "120ms --ease-micro"    # hover/press/toggle
  state:  "250ms --ease-spring"   # panels/popovers/indicators
  nav:    "300ms crossfade + 8px slide"
  signature: "400-600ms --ease-spring"  # going live, celebrations
  exit_scale: 0.7                        # exits = 0.7x entrance
  curves: "linear() springs in /DESIGN.md §6 — shared verbatim"
type_px: { display: 40, h1: 28, h2: 20, h3: 16, body: 14, secondary: 13, caption: 12 }
```

### Banned (hard list)

`#8b5cf6` · `#9146ff` · `hsl(262 …)` · `rounded-xl`+ on controls ·
white-on-amber · Inter-everything · glassmorphism · gradient text ·
`shadow-lg`-style opaque shadows · layout-property animation (width/
top/margin) · odometer/count-up number rolls · elastic bounce on micro
feedback · entrance animations re-running on re-render · chart colors
in chrome
