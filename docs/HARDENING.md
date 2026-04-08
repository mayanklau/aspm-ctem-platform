# Hardening Notes

This document describes the production-hardening baseline shipped in
**v3.1.0** and the rationale for each control. If you need to deviate, do it
deliberately and write down why.

## 1. Secrets

| Control | Where | Notes |
| ------- | ----- | ----- |
| `.env` removed from the tree | repo root | The v3.0 zip shipped real credentials. **Rotate `DB_PASS` and `JWT_SECRET` regardless of when you upgrade.** |
| `.gitignore` blocks `.env*` | repo root | Only `.env.example` is allowed |
| Fail-fast on missing `JWT_SECRET` in production | `server.js`, `middleware/auth.js` | Server `process.exit(1)` if absent |
| Fail-fast on missing DB env vars in production | `config/database.js` | Same — refuses to start |

## 2. Authentication & authorisation

- All POST/PUT/PATCH/DELETE routes use `auth.required`.
- Weightage updates and integration CRUD use `auth.requireRole('admin')`.
- GET routes default to `auth.optional` for backwards compat with the v3.0
  dashboard. **Set `REQUIRE_READ_AUTH=true` in production** to flip every
  read to required without code changes.
- Tokens are HMAC JWT signed with `JWT_SECRET`, default expiry `8h`,
  configurable via `JWT_EXPIRES_IN`.
- A dev-only `/api/auth/dev-token` endpoint exists for local bootstrapping
  and is **never mounted** when `NODE_ENV=production`.

## 3. Transport & headers

| Control | Library | Notes |
| ------- | ------- | ----- |
| HSTS, X-Frame-Options, nosniff, etc. | `helmet` | Default policy with `crossOriginResourcePolicy: cross-origin` so the SPA can fetch `/api` from a different host |
| CORS allowlist | `cors` | `CORS_ORIGINS` comma-separated; deny-all in prod if unset |
| Compression | `compression` | gzip on application/json + text |
| `X-Powered-By` removed | `app.disable('x-powered-by')` | |
| Trust proxy = 1 | `app.set('trust proxy', 1)` | so `req.ip` is the real client behind a single load balancer hop |

## 4. Rate limiting

- `/api/*` — 300 requests / 15 min / IP (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`)
- `POST /api/reports/upload` — 30 / 15 min / IP (`RATE_LIMIT_UPLOAD_MAX`)
- Disabled under `NODE_ENV=test` for fast deterministic CI

## 5. Input validation & SQL safety

- All SQL goes through Sequelize. No raw string concatenation in any
  controller or service shipped in this repo.
- The base controller `?q=` search is restricted to columns the caller
  declares as TEXT and **escapes LIKE wildcards** (`%`, `_`, `\`).
- Pagination is hard-capped at `MAX_LIMIT=200` rows / page.
- `?sort=` and `?dir=` are validated against an allowlist; the default is
  `created_at DESC`.
- `PATCH /api/reports/{type}/:id/status` validates `status` against an enum
  before touching the row.
- A general-purpose `validate` middleware (`express-validator`) is wired up
  for endpoints that need richer body validation; extend per-controller as
  you add new mutating routes.

## 6. File upload

- Only the extensions `.csv .json .xml .xlsx .xls .pdf` are accepted.
- On-disk filenames are **UUID-only** with a sanitised extension. The
  user-supplied original filename is never used as a path component.
- `safeOriginalName()` is exported for callers that want to log the original
  name without trusting it.
- Size cap defaults to 50 MB (`UPLOAD_MAX_BYTES`).
- Multer is constrained to a single file and 20 fields per request.
- Files land in `UPLOAD_DIR` (default `./uploads`), which the Dockerfile
  mounts as a writable volume owned by the non-root `aspm` user.

## 7. Logging & error handling

- `winston` JSON in production, daily-rotated under `LOG_DIR`, max 14 days.
- `morgan` HTTP access log streams through winston so you have one source
  of truth.
- Per-request `X-Request-Id` is generated (or propagated from the upstream
  hop) and included in every log line, every response envelope, and every
  error.
- The global `errorHandler` distinguishes Multer / Sequelize / JWT errors
  and never leaks internal stack traces to clients in production.
- `unhandledRejection` and `uncaughtException` are logged. The latter
  triggers a graceful shutdown rather than a hard crash.

## 8. Process lifecycle

- `createApp()` is a pure factory; tests boot it without binding a port.
- `bootstrap()` handles DB connect, sync, seed, scheduler start, and listen.
- SIGTERM and SIGINT trigger a graceful drain:
  1. Stop accepting new connections (`server.close`)
  2. Stop the integration scheduler
  3. Close the Sequelize pool
  4. `process.exit(0)`
- A 15-second hard timeout forces exit if any of the above hangs.

## 9. Container

- `node:20-alpine` base, multi-stage build, dev deps stripped via
  `npm ci --omit=dev`.
- Runs as a dedicated non-root user `aspm`.
- `tini` is PID 1, so signals propagate cleanly to the Node process.
- `HEALTHCHECK` hits `/livez`.
- `LOG_DIR` and `UPLOAD_DIR` are explicitly created and `chown`ed before the
  user switch.
- Frontend container runs as `nginx` (already non-root in the base image)
  on port 8080 so it can bind without privileges.
- `docker-compose.yml` declares MySQL with a healthcheck and uses
  `depends_on.condition: service_healthy` so the backend never starts before
  the database is ready.
- The compose file uses `${JWT_SECRET:?...}` so missing the env var aborts
  the stack with a clear message instead of silently booting an insecure
  default.

## 10. CI gates

The GitHub Actions workflow runs on every push and PR:

1. `npm ci` (cached)
2. `npm run lint` — must be clean (zero warnings)
3. `npm test` — jest unit tests
4. `npm audit --omit=dev --audit-level=high` — warns on high+critical
5. `npm run build` for the frontend
6. Docker build for backend and frontend images (smoke)

The MySQL service is provisioned per job so tests touch a real database
when needed without contaminating shared infrastructure.

## 11. What we did NOT add (and why)

| Not added | Rationale |
| --------- | --------- |
| Full RBAC model with users / roles tables | The v3.0 schema has no users table; adding one is a separate migration that should be designed against your real IdP. The JWT `role` claim is the temporary handoff. |
| OpenTelemetry tracing | Easy to add later thanks to `requestId` propagation; out of scope for the hardening pass. |
| Prometheus `/metrics` endpoint | Same — hooks are in place, decision deferred. |
| WAF rules | Belongs at the ingress, not the app. |
| Field-level encryption for PII | The current schema doesn't store PII; revisit when it does. |
| SAST/DAST in CI | This *is* the SAST/DAST platform — eat your own dog food via the integrations endpoint. |

## 12. Upgrade notes (3.0 → 3.1)

1. **Rotate `DB_PASS` and `JWT_SECRET`.** The v3.0 zip leaked both.
2. Provide every required env var (see `.env.example`). Production deploys
   will refuse to start without `JWT_SECRET`, `DB_HOST`, `DB_NAME`,
   `DB_USER`, `DB_PASS`.
3. If any client previously called write endpoints unauthenticated, it must
   now pass a valid `Authorization: Bearer <jwt>` header.
4. Set `CORS_ORIGINS` to your real frontend origin(s) before going live.
5. Decide on `REQUIRE_READ_AUTH`. If your dashboard sits behind SSO already,
   flip it to `true`.
6. Re-run migrations: `npm run migrate`. The schema is unchanged from v3.0
   but the migration runner is the supported path.
