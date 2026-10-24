# Contributing to adda

Thanks for helping. A short path to a good first change:

1. **Read the scope.** [docs/SCOPE.md](docs/SCOPE.md) says what adda is and is not;
   [docs/FLOWS.md](docs/FLOWS.md) has the acceptance criteria for each flow. A change that
   adds something outside the scope is usually better as an issue first.
2. **Set up.** Needs Docker, [uv](https://docs.astral.sh/uv/) and pnpm (Node 22):
   ```bash
   make setup     # env files, dependencies, Postgres + Redis + mediamtx, migrations
   make dev       # backend :7001 and web :5173 with hot reload
   ```
3. **Make the change** following [AGENTS.md](AGENTS.md) (layout and conventions) and, for
   anything visual, [docs/DESIGN.md](docs/DESIGN.md).
4. **Prove it.** A change is done when its flow's acceptance criteria hold and are covered by
   a test:
   ```bash
   make test                                  # pytest, no Docker needed
   pnpm lint && pnpm typecheck && pnpm check:design
   pnpm e2e                                   # Playwright, against the running stack
   ```
   For UI changes, also compare the screen with its render in `docs/design/screens` and cover
   its loading, empty, error and reconnecting states.
5. **Update the docs** that describe the behaviour in the same change.

## Commits and pull requests

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (a git hook
checks them): `feat: …`, `fix: …`, `docs: …`, `test: …`, `chore: …`. Keep a pull request to
one idea, describe what changed and how you checked it, and leave the checklist in the
template (if any) honest.

## House rules

- The WebSocket contract (`backend/modules/realtime/protocol.py` and
  `web/src/lib/types/realtime.ts`) changes in both places at once.
- Never name or compare adda to other products in code, docs or commits.
- No violet, no gradients, radii 4/6/8 px, marigold with ink text. The design gate enforces it.
