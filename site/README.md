# adda site — marketing + docs

The public face of the project: a static Astro/Starlight site that
**explains the product** and **guides self-hosters** through deploying
the backend + web stack and using the desktop console. It is maintained
by the project, deployed once by us — it is not part of a user's
self-hosted stack.

## Local development

```bash
make site-dev       # dev server → http://localhost:4321
make site-build     # static build → site/dist/
make site-preview   # preview the built output
```

## Deploying (project maintainers)

The site is static and deploys to Vercel with zero config:

1. Push the repo to GitHub
2. In Vercel: **Add New Project** → import the repo
3. Set the **Root Directory** to `site` — `site/vercel.json` takes care
   of the rest
4. Point the domain at the Vercel project

The site is fully decoupled from any running adda stack — it can go down
without affecting anyone's streams, chat, or viewers.

## Content rules

- `src/content/docs/` holds the guides and reference — user-facing
  documentation for **their** deployment, never notes about ours
- Landing page is bespoke (`src/pages/index.astro`); docs keep the
  Starlight chrome
- Follow `../AGENTS.md` (repo root) and `AGENTS.md` here for design and
  tone rules
