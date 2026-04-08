.PHONY: help install lint test audit build up down logs clean reset migrate seed dev-token

SHELL := /bin/bash

BACKEND_DIR  := aspm-v3/backend
FRONTEND_DIR := aspm-v3/frontend

help:  ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install:  ## Install backend + frontend dependencies
	cd $(BACKEND_DIR)  && npm ci
	cd $(FRONTEND_DIR) && npm ci

lint:  ## Run ESLint on the backend
	cd $(BACKEND_DIR) && npm run lint

test:  ## Run backend unit tests
	cd $(BACKEND_DIR) && npm test

audit:  ## Run npm audit on production deps
	cd $(BACKEND_DIR) && npm run audit:prod

migrate:  ## Apply database migrations
	cd $(BACKEND_DIR) && npm run migrate

seed:  ## Seed default data
	cd $(BACKEND_DIR) && npm run seed

build:  ## Build all docker images
	docker compose build

up:  ## Start the full stack via docker compose
	docker compose up -d

down:  ## Stop the stack (preserves volumes)
	docker compose down

logs:  ## Tail logs from all services
	docker compose logs -f --tail=100

reset:  ## Stop the stack AND delete the MySQL volume (destructive)
	docker compose down -v

dev-token:  ## Mint a dev JWT against a running local backend
	@curl -s -X POST http://localhost:3001/api/auth/dev-token \
	  -H 'Content-Type: application/json' \
	  -d '{"username":"mayank","role":"admin"}' | tee /dev/stderr | python3 -c 'import sys,json; print("\nexport TOKEN="+json.load(sys.stdin)["data"]["token"])'

clean:  ## Remove node_modules, dist, logs, uploads
	rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/logs $(BACKEND_DIR)/uploads $(BACKEND_DIR)/coverage
	rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/.angular
