# Contributing

Thanks for your interest in improving the ASPM & CTEM Platform.

## Development setup

```bash
# clone, then from the repo root
cd aspm-v3/backend
cp .env.example .env    # fill in DB credentials + a strong JWT_SECRET
npm ci
npm run migrate
npm run dev             # nodemon on :3001

# in another terminal
cd aspm-v3/frontend
npm ci
npm start               # ng serve on :4200
```

Or use Docker Compose for a one-shot environment:

```bash
docker compose up --build
```

## Branching

- `main` is always deployable. It is protected; changes land via PR.
- Feature branches: `feat/<short-description>`
- Fixes: `fix/<short-description>`
- Chores / refactors: `chore/...`, `refactor/...`, `docs/...`

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scoring): add per-business-unit rollup
fix(upload): sanitise original filename before persisting
docs(readme): document docker compose flow
```

## Before opening a PR

1. `npm run lint` passes (backend and frontend)
2. `npm test` passes
3. New code has tests — smoke tests at minimum
4. `npm audit --production` is clean (or the new advisory is called out)
5. No secrets committed (`git diff --cached` before every commit)
6. Update `CHANGELOG.md` under `## [Unreleased]`

## Code style

- Backend: ESLint + Prettier (configs in `aspm-v3/backend`). 2-space indent.
- Frontend: Angular CLI defaults + Prettier. 2-space indent.
- SQL migrations: lowercase keywords (`select`, `where`) are fine; table and
  column names `snake_case`.

## Reporting security issues

**Do not** open public issues for vulnerabilities. See [`SECURITY.md`](./SECURITY.md).
