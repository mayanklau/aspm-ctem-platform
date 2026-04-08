# Security Policy

The ASPM & CTEM Platform handles sensitive security telemetry — findings, rules,
credentials, kill-chain data. We take vulnerabilities in this codebase seriously.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.1.x   | :white_check_mark: |
| 3.0.x   | :white_check_mark: (critical fixes only) |
| < 3.0   | :x:                |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately by emailing the maintainers or opening a
[GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
on this repository.

When reporting, please include:

- A clear description of the issue and its impact
- Steps to reproduce (proof-of-concept is welcome)
- The affected version / commit SHA
- Any suggested remediation

## Response Targets

| Severity | Acknowledgement | Fix target |
| -------- | --------------- | ---------- |
| Critical | 24 hours        | 7 days     |
| High     | 48 hours        | 14 days    |
| Medium   | 5 business days | 30 days    |
| Low      | 10 business days| Next release |

## Scope

In scope:

- The `aspm-v3/backend` service (Node.js / Express / Sequelize)
- The `aspm-v3/frontend` Angular application
- Provided Docker and deployment manifests
- Default configuration and migration SQL

Out of scope:

- Vulnerabilities in third-party dependencies already tracked upstream
  (please report to the upstream project; we will bump the dependency)
- Denial of service via unrealistic load without a concrete exploitation path
- Self-XSS requiring the victim to paste attacker-controlled content into
  DevTools

## Hardening Baseline

This repository ships with a hardening baseline that downstream deployers are
expected to preserve:

- `helmet`, `express-rate-limit`, and strict CORS on all API routes
- Fail-fast on missing `JWT_SECRET` in production
- Non-root container user, read-only root filesystem where possible
- Parameterised queries via Sequelize (no raw string concatenation)
- Upload filename sanitisation, extension allowlist, and size limits
- Dependency audit via `npm audit` in CI

If you find a deployment path that bypasses any of these, that counts as a
security issue — please report it.
