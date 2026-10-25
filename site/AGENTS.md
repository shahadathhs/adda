# site — Agent Instructions (marketing and docs)

A static Next.js (App Router) site, exported with `output: "export"` and deployed to Vercel.
No server, no hosted demo (the stack needs RTMP and HLS, which a static host cannot run).
Inherits `/docs/DESIGN.md`: the site carries the identity hardest. Conflicts resolve in
favour of DESIGN.md.

## Layout

```
site/
├── content/docs/        the docs, as Markdown with frontmatter (title, description)
│   └── _generated/      copies of /docs/{ARCHITECTURE,OPERATIONS,CHAT}.md (see below)
├── content/blog/        posts, dated in the frontmatter
├── public/              favicon, Space Grotesk (self-hosted woff2), real screenshots (screens/)
├── scripts/sync-docs.mjs
└── src/
    ├── app/             / (landing), /docs/[[...slug]], /blog, sitemap, robots, not-found
    ├── components/      one exported component per file
    └── lib/             content loader, docs sidebar (nav.ts), site constants
```

## Rules

- **Tokens, not colours.** `src/app/globals.css` holds the same tokens as the app: ink ladder,
  marigold with ink text on fills (never white), live red only for live. No violet, no
  gradients, radii 4/6/8 px, Space Grotesk for display, mono for commands and numbers.
- **Real screenshots only** in `public/screens/` (taken from the running app, no browser-chrome
  mock-ups, no invented UI). Retake them when the UI changes.
- **Honest copy.** Direct, self-hoster to self-hoster. No superlatives without a fact. Never
  name or compare adda to another product.
- **Docs have one source.** `ARCHITECTURE.md`, `OPERATIONS.md` and `CHAT.md` live in `/docs`
  and are copied into `content/docs/_generated/` by `pnpm -C site sync-docs` (run on `main`;
  `build` fails if the committed copies are stale). Edit `/docs`, not the copies. Everything
  else under `content/docs/` is written for the site.
- **Add a docs page:** create the `.md` file, add it to `src/lib/nav.ts`.
- Environment variables, paths and commands go in fenced code or inline mono, never bare text.
- Frontmatter values that contain a colon must be quoted.

## Quality

```bash
pnpm -C site typecheck && pnpm -C site build     # make site-build
make site-dev                                     # http://localhost:4321
pnpm check:design                                 # from the repo root
```

Pre-ship the DESIGN.md anti-slop checklist: the site is the brand's first impression.
