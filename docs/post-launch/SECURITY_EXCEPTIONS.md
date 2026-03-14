# Security Exceptions

**Last reviewed:** 2026-03-15
**Next review due:** 2026-06-15 (quarterly)

This document tracks known security audit findings that cannot be resolved and have been accepted with documented risk assessment. All exceptions must be reviewed quarterly.

---

## 1. elliptic@6.6.1 — Risky Cryptographic Implementation

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Advisory** | [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84) |
| **Patched versions** | `<0.0.0` (no fix available) |
| **Dependency chain** | `@storybook/nextjs` → `node-polyfill-webpack-plugin` → `crypto-browserify` → `browserify-sign` / `create-ecdh` → `elliptic@6.6.1` |
| **Production impact** | **None** — Storybook is a devDependency, not included in production bundles |
| **Risk assessment** | Acceptable. The vulnerable package is only loaded in the Storybook development environment. It is never shipped to end users and cannot be exploited in production. |
| **Mitigation** | Monitor upstream for a fix. When `elliptic` publishes a patched version, update via pnpm override. |
| **Decision** | Accepted by CTO board, 2026-03-15 |

---

## 2. rollup@4.55.1 — Arbitrary File Write via Path Traversal

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Advisory** | [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) |
| **Patched versions** | `>=4.59.0` |
| **Dependency chain** | `tsup@8.5.1` → `rollup@4.55.1` (in `packages/email`, `packages/i18n`, `packages/ui`) |
| **Production impact** | **None** — rollup is a build-time bundler (devDependency). The vulnerability requires a malicious plugin or crafted input during the build process. Our build runs in trusted CI/local environments with no untrusted plugins. |
| **Risk assessment** | Acceptable. Build-time only, no user-facing exposure. The path traversal requires a malicious rollup plugin to be installed, which is not a realistic threat in our controlled build environment. |
| **Mitigation** | Update `tsup` when a version ships with `rollup@>=4.59.0`. Track at [tsup releases](https://github.com/egoist/tsup/releases). |
| **Decision** | Accepted by CTO board, 2026-03-15 |

---

## Review Process

1. Re-run `pnpm audit` quarterly
2. Check if upstream fixes are available for each exception
3. Remove entries once the underlying vulnerability is patched
4. Add new entries for any unfixable findings following the template above
