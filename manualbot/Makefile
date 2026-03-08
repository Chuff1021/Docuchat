.PHONY: help up down build logs api-shell db-shell migrate seed clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Docker ───────────────────────────────────────────────────────────────────

up: ## Start all services
	cd infra && docker compose up -d

up-build: ## Build and start all services
	cd infra && docker compose up -d --build

down: ## Stop all services
	cd infra && docker compose down

down-v: ## Stop all services and remove volumes
	cd infra && docker compose down -v

build: ## Build all Docker images
	cd infra && docker compose build

logs: ## Follow logs for all services
	cd infra && docker compose logs -f

logs-api: ## Follow API logs
	cd infra && docker compose logs -f api

logs-worker: ## Follow worker logs
	cd infra && docker compose logs -f worker

# ─── Database ─────────────────────────────────────────────────────────────────

migrate: ## Run database migrations
	cd infra && docker compose exec api alembic upgrade head

migrate-down: ## Rollback last migration
	cd infra && docker compose exec api alembic downgrade -1

seed: ## Seed demo data
	cd infra && docker compose exec api python seed.py

db-shell: ## Open PostgreSQL shell
	cd infra && docker compose exec postgres psql -U manualbot -d manualbot

# ─── Development ──────────────────────────────────────────────────────────────

api-shell: ## Open shell in API container
	cd infra && docker compose exec api bash

api-dev: ## Run API in development mode (local)
	cd apps/api && uvicorn app.main:app --reload --port 8000

worker-dev: ## Run Celery worker (local)
	cd apps/api && celery -A app.workers.celery_app worker --loglevel=info -Q ingestion,default

web-dev: ## Run Next.js frontend (local)
	cd apps/web && npm run dev

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean: ## Remove all containers, volumes, and images
	cd infra && docker compose down -v --rmi all

# ─── Quick Start ──────────────────────────────────────────────────────────────

setup: ## First-time setup: copy env files
	@cp apps/api/.env.example apps/api/.env
	@cp apps/web/.env.example apps/web/.env.local
	@echo "✅ Env files created. Edit apps/api/.env and add your OPENAI_API_KEY"

start: up ## Alias for 'up'
	@echo "✅ ManualBot is starting..."
	@echo "   Dashboard: http://localhost:3000"
	@echo "   API:       http://localhost:8000"
	@echo "   API Docs:  http://localhost:8000/api/docs"
	@echo ""
	@echo "   Demo login: demo@manualbot.ai / demo1234"
