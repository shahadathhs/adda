# ── adda Makefile ─────────────────────────────────────────────────────
# Run `make` (or `make help`) to list all targets.
# Docker is the default path to a running stack; local dev targets are
# provided for faster feedback.

.DEFAULT_GOAL := help

BACKEND_DIR  := backend
FRONTEND_DIR := web
SITE_DIR     := site
COMPOSE      := docker compose
# compose.yaml is the one compose file and its defaults are production-safe.
# These are the local-development values; dev targets pass them to compose.
DEV_ENV := IS_DEBUG=true SEED_TEST_USERS=true \
  CORS_ORIGINS=http://localhost:5173,http://localhost:7001 \
  HLS_BASE_URL=http://localhost:8888 \
  PASSWORD_RESET_URL=http://localhost:5173/reset-password \
  NEXT_PUBLIC_API_BASE_URL=http://localhost:7001 \
  NEXT_PUBLIC_HLS_BASE_URL=http://localhost:8888
UV           := uv run
PNPM         := pnpm

# Alembic runs via uv and connects through DATABASE_URL — whether that Postgres
# is native or a Docker container (db-up) doesn't matter.
ALEMBIC := cd $(BACKEND_DIR) && $(UV) alembic

.PHONY: help setup env dirs toolchain install infra stack stack-dev clean-recordings clean fclean \
        up down restart build logs logs-backend logs-web ps \
        dev backend web release \
        migrate migration reset reset-migrate db-up typecheck test \
        lint lint-backend lint-web format build-web \
        site-dev site-build site-preview \
        check clean clean-recordings

help: ## Show this help
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / \
	  {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Setup ─────────────────────────────────────────────────────────────

env: ## Create .env files (root, backend, web) from their examples
	@for f in .env backend/.env web/.env; do \
	  if [ ! -f "$$f" ] && [ -f "$$f.example" ]; then cp "$$f.example" "$$f" && echo "Created $$f"; \
	  else echo "$$f exists (skipped)"; fi; \
	done

dirs: ## Create local data directories (recordings/, thumbs/)
	@mkdir -p recordings thumbs

toolchain: ## Ensure uv is installed
	@command -v uv >/dev/null 2>&1 || { \
	  echo "uv is required. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"; \
	  exit 1; \
	}

install: toolchain ## Install backend (uv) + workspace (pnpm) deps
	@cd $(BACKEND_DIR) && uv sync
	pnpm install

setup: env dirs install infra migrate ## First-time setup: .env + dirs + deps + Postgres/Redis/mediamtx + migrations
	@echo "Setup complete — infrastructure is up and the DB is at head. Run 'make dev'."

# ── Docker (full stack) ───────────────────────────────────────────────

stack: ## Start the production stack with HTTPS (needs .env from install.sh)
	$(COMPOSE) --profile prod up -d --build

stack-dev: ## Start the dev stack (all ports on localhost, no HTTPS)
	$(DEV_ENV) $(COMPOSE) up -d --build

up: ## Build & start all services (detached, dev ports)
	$(DEV_ENV) $(COMPOSE) up -d --build

down: ## Stop & remove containers (keeps volumes)
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

build: ## Build (or rebuild) service images
	$(COMPOSE) build

logs: ## Tail logs for all services
	$(COMPOSE) logs -f --tail=100

logs-backend: ## Tail backend logs
	$(COMPOSE) logs -f --tail=100 backend

logs-web: ## Tail web logs
	$(COMPOSE) logs -f --tail=100 web

ps: ## List running containers
	$(COMPOSE) ps

# ── Local dev ─────────────────────────────────────────────────────────

# The backend runs on the host here, so mediamtx must reach it through the host
# gateway, not the compose service name used when the backend is a container.
infra: env ## Start the infra (postgres + redis + mediamtx) and wait until it is ready
	MTX_AUTH_ADDRESS=http://host.docker.internal:7001/api/streams/auth \
	  $(COMPOSE) up -d --wait postgres redis mediamtx

dev: infra migrate ## Run backend (:7001) + web (:5173) with hot reload (starts infra, applies migrations)
	@trap 'kill 0' EXIT; \
	(cd $(BACKEND_DIR) && $(UV) uvicorn main:app --reload --port 7001) & \
	(cd $(FRONTEND_DIR) && $(PNPM) dev)

backend: ## Run backend dev server on :7001 (uvicorn --reload)
	@cd $(BACKEND_DIR) && $(UV) uvicorn main:app --reload --port 7001

web: ## Run web dev server on :5173 (next dev)
	@cd $(FRONTEND_DIR) && $(PNPM) dev

# ── Release ───────────────────────────────────────────────────────────
# Bumps the version and commits. When the bump lands on main,
# the release tag and notes are created from the bumped version.

release: ## Prepare a release: make release v=0.2.0 (bump + commit + push; merge to main to build)
	@test -n "$(v)" || { echo 'Usage: make release v=0.2.0'; exit 1; }
	./scripts/bump-version.sh $(v)
	git add VERSION web/package.json
	git commit -m "chore: release v$(v)"
	git push origin $$(git rev-parse --abbrev-ref HEAD)
	@echo ""
	@echo "Version bumped to v$(v) and pushed. Merge this branch into main and tag it."

# ── Backend: migrations, tests, typecheck ──────────────────────────────
# Alembic autogenerate diffs models against the LIVE database, so we always
# `upgrade head` first to sync the DB. That keeps the diff clean and prevents
# duplicate / stale migrations.
#
#   make migrate            apply migrations
#   make migration m="msg"  generate one from model changes
#   make db-up              start a Postgres on :5432 (if you don't have one)

db-up: env ## Start a Docker Postgres on :5432 (for local dev)
	$(COMPOSE) up -d --wait postgres

migrate: ## Apply migrations (Alembic)
	$(ALEMBIC) upgrade head

reset-migrate: db-up ## Reset DB: drop everything, re-apply migrations from scratch (destroys DB data)
	$(COMPOSE) exec -T postgres psql -U adda -d adda -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(ALEMBIC) upgrade head

reset: ## Full factory reset: remove containers + volumes + recordings + thumbnails, then start fresh (DESTRUCTIVE)
	$(COMPOSE) down -v
	@rm -rf recordings thumbs && mkdir recordings thumbs
	@$(MAKE) --no-print-directory env dirs
	@$(MAKE) --no-print-directory up
	@echo "Reset complete — fresh DB (migrated + seeded on backend startup)."
migration: ## Generate a migration: make migration m="add posts"
	@test -n "$(m)" || { echo 'Usage: make migration m="message"'; exit 1; }
	$(ALEMBIC) upgrade head
	$(ALEMBIC) revision --autogenerate -m "$(m)"
	@echo "If upgrade()/downgrade() are just 'pass', there were no model changes — delete the file."

typecheck: ## Run backend type checking (pyright)
	@cd $(BACKEND_DIR) && $(UV) pyright

test: ## Run backend tests (embedded Postgres + in-memory Redis, no Docker needed)
	@cd $(BACKEND_DIR) && $(UV) pytest

lint-backend: ## Lint backend (ruff)
	@cd $(BACKEND_DIR) && $(UV) ruff check .

format: ## Format backend (ruff)
	@cd $(BACKEND_DIR) && $(UV) ruff format .
	@cd $(BACKEND_DIR) && $(UV) ruff check --fix .

# ── Frontend ──────────────────────────────────────────────────────────

lint-web: ## Lint JS/TS and docs (oxlint + prettier, repo-wide)
	@$(PNPM) lint

lint: lint-backend lint-web ## Lint backend (ruff) + JS/TS (oxlint/prettier)

build-web: ## Build web app (next build)
	@cd $(FRONTEND_DIR) && $(PNPM) build

# ── Marketing / docs site (Astro + Starlight) ─────────────────────────
# Deps come from the root workspace: `pnpm install` (see: make install).

site-dev: ## Run docs-site dev server on :4321
	@cd $(SITE_DIR) && $(PNPM) dev

site-build: ## Build static docs site → site/dist/
	@cd $(SITE_DIR) && $(PNPM) build

site-preview: ## Preview the built docs site
	@cd $(SITE_DIR) && $(PNPM) preview

# ── Quality & cleanup ─────────────────────────────────────────────────

check: typecheck test lint build-web site-build ## Run all quality gates (backend + web + site)

clean-recordings: ## Delete ALL recordings (keeps the folder) — DESTRUCTIVE
	@rm -rf recordings && mkdir recordings
	@echo "Recordings cleared."

clean: ## Remove containers + Docker volumes (keeps recordings) — DESTRUCTIVE
	$(COMPOSE) down -v

# Everything generated, so the next `make setup` starts from a clean checkout.
# Keeps the source, git history and your .env files.
fclean: ## Remove EVERYTHING generated: containers, volumes, images, recordings, deps, build output, caches — DESTRUCTIVE
	-$(COMPOSE) down -v --remove-orphans --rmi local
	@rm -rf recordings thumbs
	@rm -rf node_modules web/node_modules site/node_modules
	@rm -rf web/.next site/dist site/.astro
	@rm -rf backend/.venv backend/.pytest_cache backend/.ruff_cache backend/.pyright
	@find . -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name '*.tsbuildinfo' -not -path './.git/*' -delete 2>/dev/null || true
	@echo "Clean. Run 'make setup' to start again (your .env files were kept)."
