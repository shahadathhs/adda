# ── adda Makefile ─────────────────────────────────────────────────────
# Run `make` (or `make help`) to list all targets.
# Docker is the default path to a running stack; local dev targets are
# provided for faster feedback.

.DEFAULT_GOAL := help

BACKEND_DIR  := backend
FRONTEND_DIR := frontend
COMPOSE      := docker compose
UV           := uv run
PNPM         := pnpm

# Alembic runs via uv and connects through DATABASE_URL — whether that Postgres
# is native or a Docker container (db-up) doesn't matter.
ALEMBIC := cd $(BACKEND_DIR) && $(UV) alembic

.PHONY: help setup env toolchain install \
        up down restart build logs logs-backend logs-frontend ps \
        dev backend frontend \
        migrate migration db-up test typecheck \
        lint build-web \
        check clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / \
	  {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ── Setup ─────────────────────────────────────────────────────────────

env: ## Create .env files (root, backend, frontend) from their examples
	@for f in .env backend/.env frontend/.env; do \
	  if [ ! -f "$$f" ] && [ -f "$$f.example" ]; then cp "$$f.example" "$$f" && echo "Created $$f"; \
	  else echo "$$f exists (skipped)"; fi; \
	done

toolchain: ## Ensure brew and uv are installed (uv manages its own Python)
	@command -v brew >/dev/null 2>&1 || { echo "Homebrew is required — install from https://brew.sh"; exit 1; }
	@command -v uv >/dev/null 2>&1 || { echo "Installing uv via brew..."; brew install uv; }

install: toolchain ## Install backend (uv) + frontend (pnpm) deps
	@cd $(BACKEND_DIR) && uv sync
	@cd $(FRONTEND_DIR) && pnpm install

setup: env install db-up migrate ## First-time setup: .env + toolchain + deps + Postgres + migrations
	@echo "Setup complete — DB synced to head. Run 'make dev'."

# ── Docker (full stack) ───────────────────────────────────────────────

up: ## Build & start all services (detached)
	$(COMPOSE) up -d --build

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

logs-frontend: ## Tail frontend logs
	$(COMPOSE) logs -f --tail=100 frontend

ps: ## List running containers
	$(COMPOSE) ps

# ── Local dev ─────────────────────────────────────────────────────────
# Requires postgres + redis running, e.g.:  make up postgres redis

dev: ## Run backend + frontend together (local)
	@trap 'kill 0' EXIT; \
	(cd $(BACKEND_DIR) && $(UV) uvicorn main:app --reload --port 7001) & \
	(cd $(FRONTEND_DIR) && $(PNPM) dev)

backend: ## Run backend dev server on :7001 (uvicorn --reload)
	@cd $(BACKEND_DIR) && $(UV) uvicorn main:app --reload --port 7001

frontend: ## Run frontend dev server on :5173 (vite)
	@cd $(FRONTEND_DIR) && $(PNPM) dev

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

migration: ## Generate a migration: make migration m="add posts"
	@test -n "$(m)" || { echo 'Usage: make migration m="message"'; exit 1; }
	$(ALEMBIC) upgrade head
	$(ALEMBIC) revision --autogenerate -m "$(m)"
	@echo "If upgrade()/downgrade() are just 'pass', there were no model changes — delete the file."

test: ## Run backend tests (pytest)
	@cd $(BACKEND_DIR) && $(UV) pytest

typecheck: ## Run backend type checking (pyright)
	@cd $(BACKEND_DIR) && $(UV) pyright

# ── Frontend ──────────────────────────────────────────────────────────

lint: ## Run frontend ESLint
	@cd $(FRONTEND_DIR) && $(PNPM) lint

build-web: ## Build frontend (tsc + vite)
	@cd $(FRONTEND_DIR) && $(PNPM) build

# ── Quality & cleanup ─────────────────────────────────────────────────

check: test typecheck lint build-web ## Run all quality gates

clean: ## Remove containers AND volumes (DESTRUCTIVE)
	$(COMPOSE) down -v
