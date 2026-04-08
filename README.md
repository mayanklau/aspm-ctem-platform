# ASPM &amp; CTEM Platform

[![CI](https://img.shields.io/badge/ci-github%20actions-blue)](./.github/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-3.1.0-informational)](./CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/angular-17-red)](https://angular.io/)

An **Application Security Posture Management** and **Continuous Threat Exposure
Management** platform that ingests findings from 18 tool categories (SAST,
DAST, SCA, BAS, CART, Firewall, WAF, IPS, SIEM, PT, Red Team, Audit, OS/DB
Compliance, and more), normalises them, computes multi-level risk scores, and
surfaces them through a CXO dashboard and per-domain drill-downs.

> **v3.1.0 is a production-hardening release.** If you are upgrading from 3.0.0,
> read [`CHANGELOG.md`](./CHANGELOG.md) — you must rotate `JWT_SECRET` and
> `DB_PASS`, and all mutating API routes now require authentication.

---

## Table of contents

- [Architecture](#architecture)
- [Quick start — Docker Compose](#quick-start--docker-compose)
- [Quick start — local dev](#quick-start--local-dev)
- [Configuration](#configuration)
- [Scoring model](#scoring-model)
- [Ingesting data](#ingesting-data)
- [API reference](#api-reference)
- [Testing](#testing)
- [Security hardening baseline](#security-hardening-baseline)
- [Project layout](#project-layout)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

```
┌──────────────┐    HTTPS     ┌────────────────────┐    SQL     ┌───────────┐
│  Angular 17  │ ───────────▶ │  Express / Sequelize│ ─────────▶│  MySQL 8  │
│  (nginx SPA) │ ◀─────────── │    REST API :3001   │ ◀──────── │           │
└──────────────┘    JSON      └─────────┬──────────┘            └───────────┘
                                        │
                               ┌────────┴─────────┐
                               │                  │
                         ┌─────▼──────┐    ┌──────▼──────┐
                         │  Parsers   │    │  Scheduler  │
                         │ (18 types) │    │ (node-cron) │
                         └────────────┘    └─────────────┘
                               │                  │
                         ┌─────▼──────────────────▼──────┐
                         │        Scoring engine         │
                         │   Level 1 → 2 → 3 (CPR)      │
                         └───────────────────────────────┘
```

- **Frontend** — Angular 17 (pure NgModule, no standalone components).
  Lazy-loaded `AppPostureModule` with 19 pages, reusable widgets (donut,
  gauge, coverage heatmap, finding table), and a CXO dashboard.
- **Backend** — Express 4 + Sequelize 6 + MySQL 8. Controllers are thin; all
  parsing logic lives in `services/parsers/*`. A `ScoringEngine` computes
  per-app scores asynchronously after every ingestion.
- **Ingestion** — Two paths: file upload (`POST /api/reports/upload`) and
  scheduled pulls via `ApiIntegrationScheduler`. Both call the same parsers
  and write to the same tables, so history is unified.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for deeper detail.

## Quick start — Docker Compose

Requires Docker 24+ and Docker Compose v2.

```bash
git clone <your-repo-url>
cd ASPM_CTEM_Platform_v3_1_0
cp aspm-v3/backend/.env.example aspm-v3/backend/.env
# edit .env: set a strong JWT_SECRET and DB_PASS

docker compose up --build
```

When the stack is healthy:

- Frontend — <http://localhost:4200>
- Backend API — <http://localhost:3001/api>
- Liveness — <http://localhost:3001/livez>
- Readiness — <http://localhost:3001/readyz>

To tear everything down and wipe data:

```bash
docker compose down -v
```

## Quick start — local dev

Requires Node.js 20+, MySQL 8+, and npm 10+.

```bash
# 1. Database
mysql -u root -p -e "CREATE DATABASE aspm_db CHARACTER SET utf8mb4;"

# 2. Backend
cd aspm-v3/backend
cp .env.example .env          # set DB_* and JWT_SECRET
npm ci
npm run migrate               # creates 16 tables + seeds weightages
npm run dev                   # nodemon on :3001

# 3. Frontend (new terminal)
cd aspm-v3/frontend
npm ci
npm start                     # ng serve on :4200, proxies /api → :3001
```

## Configuration

All backend configuration is environment-driven. See
[`aspm-v3/backend/.env.example`](./aspm-v3/backend/.env.example) for the full
list. The most important variables:

| Variable | Required | Default | Purpose |
| -------- | :------: | ------- | ------- |
| `NODE_ENV` | yes | `development` | `production` enables strict checks |
| `PORT` | no | `3001` | HTTP port |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASS` | yes | — | MySQL connection |
| `DB_POOL_MAX` | no | `10` | Sequelize max pool size |
| `DB_SSL` | no | `false` | Set `true` for managed MySQL |
| `JWT_SECRET` | **yes in prod** | — | HMAC secret; server refuses to boot in production without it |
| `JWT_EXPIRES_IN` | no | `8h` | Token lifetime |
| `CORS_ORIGINS` | no | `*` in dev | Comma-separated allowlist in production |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` | 15 minutes |
| `RATE_LIMIT_MAX` | no | `300` | Requests per window per IP |
| `UPLOAD_MAX_BYTES` | no | `52428800` | 50 MB |
| `LOG_LEVEL` | no | `info` | winston level |
| `LOG_DIR` | no | `./logs` | rotating file sink |

## Scoring model

Three-level scoring, normalised 0–10 (higher = more risk):

- **Level 1 — severity score**: `critical=5, high=4, medium=3, low=2, info=1`
- **Level 2 — weighted per report type**: each report type has a configurable
  weight in `report_weightages`. Defaults live in
  [`aspm-v3/backend/server.js`](./aspm-v3/backend/server.js).
- **Level 3 — app posture score**:
  `final = (new_app_score × 0.6) + (cpr_score × 0.4)`
  where CPR (Cyber Posture Rating) reflects long-running baseline risk.

Recompute for a single app: `POST /api/scores/application/:appId/compute`
Recompute all apps from the CLI: `npm run score:recompute` (backend)

## Ingesting data

Eighteen realistic sample CSVs live in
[`aspm-v3/backend/sample-data/`](./aspm-v3/backend/sample-data/). Upload via:

- **UI**: <http://localhost:4200/app-posture/ingestion>
- **API**:
  ```bash
  curl -X POST http://localhost:3001/api/reports/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@backend/sample-data/sast_sample.csv" \
    -F "reportType=sast" \
    -F "appId=APP-001" \
    -F "appName=Internet Banking Portal"
  ```

Scheduled pulls are configured via `POST /api/integrations` and run on
`node-cron` intervals (`hourly`, `daily`, etc.). Templates for SonarQube,
OWASP ZAP, Snyk, and QRadar are pre-seeded on first boot.

## API reference

Full reference is in [`docs/API.md`](./docs/API.md). Endpoints group as:

- `/api/reports/upload`, `/api/reports/ingestion-history` — ingestion
- `/api/reports/{sast,dast,sca,bas,cart,firewall,waf,ips,siem,pt,redteam,audit,compliance}` — per-type list / summary / detail / status
- `/api/scores/{applications,application/:id,enterprise,coverage,weightages}` — scoring
- `/api/integrations` — integration CRUD + test-connection + sync
- `/livez`, `/readyz`, `/healthz` — health probes

All `POST` / `PUT` / `PATCH` / `DELETE` endpoints require
`Authorization: Bearer <jwt>`.

## Testing

```bash
cd aspm-v3/backend
npm test                   # jest + supertest (unit + smoke)
npm run test:watch
npm run lint
npm audit --production
```

CI runs all of the above plus a docker build and smoke test against an
ephemeral MySQL service. See
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## Security hardening baseline

This repository ships production-ready by default. Notably:

- `helmet` with strict CSP-ready defaults; `compression`; per-IP rate limiting
- CORS allowlist enforced in production
- JWT required on all mutating routes; fail-fast when `JWT_SECRET` is absent
- Parameterised queries only (Sequelize); `LIKE` wildcards escaped
- Pagination hard-capped at 200 rows per page
- Upload: extension allowlist, MIME sniff, size cap, filename sanitisation,
  UUID on-disk naming
- Structured JSON logs, per-request `X-Request-Id`, graceful shutdown
- Non-root Docker user, `tini` as PID 1, multi-stage builds
- `npm audit` gate in CI

See [`SECURITY.md`](./SECURITY.md) for the responsible disclosure policy.

## Project layout

```
ASPM_CTEM_Platform_v3_1_0/
├── .github/workflows/ci.yml       # lint, test, audit, docker build
├── docker-compose.yml             # mysql + backend + frontend
├── Makefile                       # common dev / ops commands
├── README.md · CHANGELOG.md · LICENSE · SECURITY.md · CONTRIBUTING.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── HARDENING.md
└── aspm-v3/
    ├── backend/                   # Express + Sequelize
    │   ├── server.js              # createApp() + bootstrap
    │   ├── config/database.js
    │   ├── controllers/           # 14 report types + scoring + integrations + upload
    │   ├── services/
    │   │   ├── parsers/           # one per report type
    │   │   ├── scoring/ScoringEngine.js
    │   │   ├── upload/UploadService.js
    │   │   └── integrations/ApiIntegrationScheduler.js
    │   ├── middleware/            # auth, errorHandler, requestId, rateLimit, validate
    │   ├── models/index.js        # 16 Sequelize models
    │   ├── migrations/            # 001_schema.sql + run.js + seed.js
    │   ├── tests/                 # jest + supertest
    │   ├── sample-data/           # 18 realistic CSVs
    │   ├── Dockerfile
    │   └── package.json
    └── frontend/                  # Angular 17
        ├── src/app/app-posture/   # 19 pages + shared components
        ├── src/app/cxo-dashboard/
        ├── Dockerfile
        ├── nginx.conf
        └── package.json
```

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). PRs must pass CI (lint, tests,
audit) and update `CHANGELOG.md`.

## License

[MIT](./LICENSE) © 2026 Mayank Lau
