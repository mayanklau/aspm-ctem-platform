# Architecture

## Overview

The ASPM & CTEM Platform is a three-tier system that ingests security findings
from heterogeneous tools, normalises them into a common schema, computes
risk scores, and surfaces them through dashboards.

```
┌────────────────────┐  HTTPS  ┌─────────────────────┐  TCP  ┌──────────┐
│  Angular 17 SPA    │ ──────▶ │  Express API :3001  │ ────▶ │ MySQL 8  │
│  served by nginx   │ ◀────── │  Sequelize ORM      │ ◀──── │          │
└────────────────────┘   JSON  └──────────┬──────────┘       └──────────┘
                                          │
                                  ┌───────┴───────┐
                                  │               │
                            ┌─────▼─────┐   ┌─────▼─────────┐
                            │ Parsers   │   │ Scheduler     │
                            │ (per type)│   │ (node-cron)   │
                            └─────┬─────┘   └─────┬─────────┘
                                  │               │
                            ┌─────▼───────────────▼─────┐
                            │     Scoring engine        │
                            │ Level 1 → Level 2 → CPR   │
                            └───────────────────────────┘
```

## Frontend

Angular 17 with **pure NgModule** routing (no standalone components). The
posture surface is one lazy-loaded module, `AppPostureModule`, which contains:

- 19 pages (one per report type plus ingestion, integrations, score admin)
- Reusable widgets: `donut`, `gauge`, `posture-gauge`, `severity-badge`,
  `sev-bars`, `coverage-heatmap`, `score-card`, `stat-card`, `finding-table`
- A single service (`AppPostureService`) wrapping the backend's REST surface
- Pipes for `avg-by`, `sum-by`, `min`

A separate `cxo-dashboard` widget bundle is embeddable into a host shell so
the platform can drop into an existing CXO dashboard without owning the
chrome.

In production the SPA is served by `nginx:alpine` (port 8080 inside the
container) with:

- gzip on text assets
- 1-year immutable cache for hashed bundles
- SPA fallback to `index.html`
- `/api/` reverse-proxied to the backend service
- Strict security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`)

## Backend

### Application factory

`server.js` exports `createApp()` so tests can boot an Express instance
without binding a port. `bootstrap()` is the production entry point that
authenticates against MySQL, runs `sequelize.sync({ alter: false })`, seeds
defaults, starts the integration scheduler, listens on `$PORT`, and installs
SIGTERM/SIGINT handlers for graceful shutdown.

### Middleware stack (order matters)

1. `requestId` — generates or propagates `X-Request-Id`
2. `helmet` — security headers
3. `cors` — strict allowlist in production
4. `compression`
5. `express.json` — body limit driven by `JSON_BODY_LIMIT`
6. `morgan` → `winston.stream` — HTTP access logs
7. Static `/uploads`
8. Health probes (`/livez`, `/readyz`, `/healthz`)
9. `apiLimiter` on `/api/*`
10. Application routes from `dependency.js`
11. `notFoundHandler` (404 JSON)
12. `errorHandler` (4-arg)

### Routes

All routes live in `dependency.js`. Auth policy:

- **GET** endpoints use `auth.optional` by default. Set `REQUIRE_READ_AUTH=true`
  to flip to `auth.required` without code changes.
- **POST / PUT / PATCH / DELETE** always use `auth.required`.
- Admin-only mutations (weightage updates, integration CRUD) wrap an extra
  `auth.requireRole('admin')`.
- Non-production environments expose `POST /api/auth/dev-token` so developers
  can mint short-lived JWTs without standing up an IdP.

### Controllers

Each per-report-type controller is built from a generic factory in
`controllers/_base.js`. The factory provides `list`, `getById`, `updateStatus`,
and `summary` actions. Type-specific handlers (e.g. SIEM kill-chain
distribution, PT retest tracking) live alongside.

### Services

| Path | Responsibility |
| ---- | -------------- |
| `services/parsers/*` | One parser per report type. They normalise CSV/JSON/XML into the canonical record shape and accumulate per-row errors. |
| `services/scoring/ScoringEngine.js` | Computes Level 1 → Level 2 → CPR scores per application. |
| `services/upload/UploadService.js` | Multer wrapper with sanitisation, extension allowlist, and size cap. |
| `services/integrations/ApiIntegrationScheduler.js` | node-cron scheduler that pulls from configured integrations and reuses the same parsers as the upload path. |

### Models

Sixteen Sequelize models are declared in `models/index.js`, mirroring the DDL
in `migrations/001_schema.sql`. Names are `snake_case` columns,
`PascalCase` model identifiers, with `underscored: true` and standard
`created_at` / `updated_at` timestamps.

## Data flow — file upload

```
Client ──POST /api/reports/upload (multipart)──▶ uploadCtrl
   1. uploadLimiter (rate limit)
   2. auth.required
   3. UploadService multer (extension/size/MIME)
   4. uploadCtrl.uploadReport
        a. Insert IngestionHistory row (status=processing)
        b. Pick parser by reportType
        c. parser.parse(file) → records[]
        d. Model.bulkCreate(records, { ignoreDuplicates: true })
        e. Update IngestionHistory (success/partial/failed)
        f. Fire-and-forget ScoringEngine.computeApplicationScore(appId)
        g. Delete the temp file
   5. Response: { ingestion_id, total, inserted, failed, parse_errors[5] }
```

## Data flow — scheduled pull

```
node-cron tick ──▶ ApiIntegrationScheduler.runJob(integration)
   1. axios call against integration.endpoint_url with credentials
   2. Hand response payload to the same parser used by upload
   3. bulkCreate into the same Model
   4. Record an IngestionHistory row with source_type=api_pull
   5. Recompute scores
```

The unified ingestion history means the UI doesn't care whether a finding
arrived via upload or schedule — same audit trail either way.

## Scoring

Three levels, all normalised 0–10 (higher = more risk):

| Level | Input | Output |
| ----- | ----- | ------ |
| **L1** | Severity per finding | `critical=5, high=4, medium=3, low=2, info=1` |
| **L2** | L1 scores aggregated per report type, weighted by `report_weightages` | per-app per-type score 0–10 |
| **L3 (CPR)** | `(new_app_score × 0.6) + (cpr_baseline × 0.4)` | final app posture score 0–10 |

Recompute on demand: `POST /api/scores/application/:appId/compute`
(admin-equivalent: triggers happen automatically after every successful
upload but are non-blocking — the upload response returns before scoring
completes).

## Observability

- **Logs** — winston, JSON in production with daily rotation under `LOG_DIR`,
  human-readable colourised in development. Every line carries the request
  correlation ID when emitted from a request handler.
- **Metrics** — none built in (yet). Easy hooks for `prom-client` exist in
  `server.js`; a `/metrics` endpoint can be added behind `requireRole('ops')`.
- **Tracing** — none built in. The `X-Request-Id` propagation makes adding
  OpenTelemetry trivial later.

## Deployment topologies

| Environment | Frontend | Backend | DB |
| ----------- | -------- | ------- | -- |
| Local dev | `ng serve` :4200 with `proxy.conf.json` | `nodemon` :3001 | local MySQL |
| Local docker | `nginx:alpine` :4200 | `node:20-alpine` :3001 | `mysql:8` container with named volume |
| Staging / prod | Same images behind a real load balancer with TLS termination | Same image, autoscaled | Managed MySQL with TLS (`DB_SSL=true`) |

## Threat model snapshot

| Asset | Threat | Mitigation |
| ----- | ------ | ---------- |
| Findings DB | Bulk exfil via unauthenticated API | All write paths require JWT; read paths can be locked down via `REQUIRE_READ_AUTH=true` |
| Scoring weightages | Unauthorised tampering changes risk posture | `requireRole('admin')` |
| Upload endpoint | Path traversal, oversized payloads, exotic file types | UUID-only on-disk names, extension allowlist, size cap, stricter rate limit |
| JWT secret | Default secret leak | Server refuses to boot in production without `JWT_SECRET` |
| Search endpoint | LIKE wildcard scan / DoS via huge `limit` | Wildcards escaped, pagination capped at 200 |
| Logs | PII / secret leakage in stack traces | 500 detail hidden in prod responses, full detail only in logs |
| Container | Compromise → host pivot | Non-root user, tini PID 1, read-only base layers, healthchecks |
