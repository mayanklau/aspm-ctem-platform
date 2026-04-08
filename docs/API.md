# API Reference

Base URL: `http://localhost:3001` (or your deployed backend host).
All `/api/*` responses use the envelope:

```json
{
  "success": true,
  "data": ... ,
  "meta": { "total": 123, "page": 1, "limit": 50, "pages": 3 },
  "timestamp": "2026-04-08T12:00:00.000Z",
  "request_id": "9b1e..."
}
```

On failure:

```json
{
  "success": false,
  "error": "human-readable message",
  "details": { "fields": [...] },
  "timestamp": "...",
  "request_id": "..."
}
```

## Authentication

All mutating endpoints require:

```
Authorization: Bearer <jwt>
```

In non-production, mint a token:

```bash
curl -X POST http://localhost:3001/api/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{"username":"mayank","role":"admin"}'
```

In production, integrate your IdP and sign tokens with the same `JWT_SECRET`
the backend uses. The token payload must include `username` and `role`
(`admin` is required for weightage and integration CRUD).

## Health probes

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/livez`  | none | process liveness (200 if Node is up) |
| GET | `/readyz` | none | readiness (200 only if MySQL is reachable) |
| GET | `/healthz`| none | legacy alias |

## Ingestion

| Method | Path | Auth | Body |
| ------ | ---- | ---- | ---- |
| POST | `/api/reports/upload` | required | multipart: `file`, `reportType`, `appId`, `appName` |
| GET  | `/api/reports/ingestion-history` | optional | query: `reportType`, `status`, `page`, `limit` |
| GET  | `/api/reports/ingestion/:id` | optional | — |

`reportType` ∈ `sast | dast | sca | bas | cart | firewall_pan | firewall_fortinet | firewall_checkpoint | waf | ips | siem | pt_external | pt_internal | pt_mobile | redteam | audit | os_compliance | db_compliance`

Upload response:

```json
{
  "success": true,
  "data": {
    "ingestion_id": "uuid",
    "total": 1234,
    "inserted": 1230,
    "failed": 4,
    "parse_errors": [ { "row": 17, "message": "..." } ]
  }
}
```

## Per-report-type endpoints

Every report type exposes the same shape (replace `{type}` with the slug):

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET    | `/api/reports/{type}` | optional | list with `?appId&severity&status&q&from&to&page&limit&sort&dir` |
| GET    | `/api/reports/{type}/summary` | optional | grouped counts by `severity` × `status` |
| GET    | `/api/reports/{type}/:id` | optional | single record |
| PATCH  | `/api/reports/{type}/:id/status` | required | body `{ "status": "open\|in_progress\|resolved\|accepted_risk\|false_positive" }` |

Pagination is hard-capped: `limit ≤ 200`. The `q` parameter performs a
LIKE-escaped search across the type's text columns only.

Type-specific extras:

- `GET /api/reports/siem/killchain` — kill-chain stage distribution
- `PATCH /api/reports/pt/:id/retest` — record a retest pass/fail
- `POST /api/reports/compliance/oracle-sync` — trigger an Oracle pull (admin)

## Scoring

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET  | `/api/scores/applications` | optional | all apps with current scores |
| GET  | `/api/scores/application/:appId` | optional | single app, all dimensions |
| POST | `/api/scores/application/:appId/compute` | required | force a recompute |
| GET  | `/api/scores/application/:appId/trend` | optional | time series |
| GET  | `/api/scores/enterprise` | optional | rollups |
| GET  | `/api/scores/coverage` | optional | report-type × app coverage heatmap |
| GET  | `/api/scores/weightages` | optional | current weights |
| PUT  | `/api/scores/weightages` | required + `admin` | update weights |

## Integrations

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| GET    | `/api/integrations` | optional | list configured pulls |
| POST   | `/api/integrations` | required + `admin` | create |
| PUT    | `/api/integrations/:id` | required + `admin` | update |
| DELETE | `/api/integrations/:id` | required + `admin` | delete |
| POST   | `/api/integrations/:id/sync` | required | trigger an immediate sync |
| POST   | `/api/integrations/test-connection` | required | dry-run credentials |

## Rate limits

- Global on `/api/*` — 300 requests / 15 min / IP (default, tunable via env)
- Stricter on `POST /api/reports/upload` — 30 / 15 min / IP

Both are disabled when `NODE_ENV=test`.

## Error codes

| HTTP | Meaning |
| ---- | ------- |
| 200 / 201 | Success |
| 400 | Validation, malformed body, multer error, sequelize validation |
| 401 | Missing or invalid JWT |
| 403 | JWT valid but role insufficient |
| 404 | Unknown route or record |
| 429 | Rate limited |
| 500 | Internal — generic message in production, full error in dev |
| 503 | Readiness probe failed (`/readyz` only) |
