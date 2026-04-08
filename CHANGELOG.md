# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2026-04-08

### Added — Production hardening

- **Security middleware**: `helmet`, `compression`, `express-rate-limit` on all
  API routes; configurable per-IP limits via env.
- **CORS allowlist**: `CORS_ORIGINS` env var, comma-separated; rejects unknown
  origins in production.
- **Global error handler** and JSON 404 handler; correlated via per-request
  `X-Request-Id`.
- **Graceful shutdown**: SIGTERM / SIGINT drain HTTP server and Sequelize pool.
- **Fail-fast on missing secrets**: `JWT_SECRET` is required in production; the
  server refuses to boot without it.
- **Auth overhaul**: `auth.required` is now the default for all mutating and
  admin routes. `auth.optional` is reserved for read-only public endpoints.
  Added `auth.requireRole('admin')` helper.
- **Input validation layer** via `express-validator` on upload, scoring
  recompute, and integration mutation endpoints.
- **Upload hardening**: MIME sniffing, extension + size limit enforcement,
  filename sanitisation, UUID-only on-disk names, quarantine directory hook.
- **SQL LIKE escaping** in `controllers/_base.js` to prevent wildcard
  injection; pagination hard-capped at 200 rows per page.
- **Structured logging**: `winston` JSON logs to stdout + rotating file sink;
  morgan HTTP access logs piped through winston.
- **Health endpoints**: `/livez` (process up), `/readyz` (DB reachable),
  `/healthz` retained as alias.
- **Dockerisation**: multi-stage `Dockerfile` for backend (non-root user,
  `npm ci --omit=dev`, tini as PID 1) and frontend (nginx:alpine with SPA
  fallback and gzip). `docker-compose.yml` with MySQL 8, backend, frontend,
  healthchecks, and named volumes.
- **CI/CD**: GitHub Actions workflow — lint, test, audit, build images, smoke
  test with ephemeral MySQL service.
- **Test scaffolding**: Jest + supertest for backend; smoke tests for helpers,
  response shape, scoring math, and `/healthz`.
- **Developer ergonomics**: ESLint + Prettier configs, `.editorconfig`,
  `.dockerignore`, `Makefile` with common targets.
- **Docs**: architecture overview, API reference, hardening notes, and
  `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `CHANGELOG.md`.

### Changed

- Backend + frontend `package.json` versions bumped to `3.1.0`.
- `server.js` refactored into a composable `createApp()` factory so tests can
  boot an app without binding a port.
- `config/database.js` now reads SSL options, connection pool sizing, and
  slow-query logging from env.
- README rewritten for v3.1.0 with Docker-first quick start.

### Fixed

- Committed `backend/.env` with real credentials has been **removed from the
  tree**. Rotate the old `DB_PASS` and `JWT_SECRET` immediately if they were
  ever deployed.
- Version mismatch between README (v2.0), folder (v3.0), and `package.json`
  (2.0.0) — all aligned to 3.1.0.
- `_base.js` search query constructed an `OR` over every field including
  enum-like columns (`severity`, `status`), producing broken `LIKE` clauses.
  Search is now limited to text columns with escaped wildcards.
- Fire-and-forget scoring recompute in `upload` controller swallowed errors
  silently; it now logs failures through winston.

### Security

- Default JWT secret removed. Deployments that relied on the old fallback
  (`aspm-dev-secret`) **must** set `JWT_SECRET` before upgrading.
- All routes previously using `auth.optional` that perform writes now require
  a valid token.

## [3.0.0] - Prior release

- Full NgModule Angular 17 frontend with 19 posture pages
- Express + Sequelize (MySQL) backend with 14 report-type parsers
- OCSF-aligned schema, CPR scoring engine, ingestion history
- Oracle connector stub, API integration scheduler, 18 sample CSVs
