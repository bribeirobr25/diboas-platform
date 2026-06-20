# Security

## Reporting a vulnerability

If you believe you've found a security issue in this repository or in the live deployment at [diboas.com](https://diboas.com), please email **security@diboas.com** with:

- A description of the issue and its impact
- Steps to reproduce
- Any proof-of-concept code or screenshots

We will acknowledge the report within 72 hours and aim to have a fix or mitigation within 14 days for high-severity findings.

**Please do not file a public GitHub issue for security vulnerabilities.**

The machine-readable equivalent of this policy is published at
[`/.well-known/security.txt`](https://diboas.com/.well-known/security.txt) (RFC 9116);
its `Contact:` (`security@diboas.com`) and `Policy:` (this file) must stay in sync with the above.

## Secrets management

This repository does not contain production secrets. Required runtime secrets are listed in `apps/web/.env.example` with empty values and must be set in:

- The Vercel project dashboard (for production / preview deployments)
- A local `.env.local` (for development; gitignored)
- GitHub Actions secrets (for CI)

The application enforces this at startup: `apps/web/src/config/env.ts` throws on missing `ENCRYPTION_KEY`, `DATABASE_URL`, `INTERNAL_API_KEY`, `RESEND_API_KEY`, or `HMAC_KEY` in production.

## Pre-commit secrets scanning (gitleaks)

Every push and pull request is scanned by [gitleaks](https://github.com/gitleaks/gitleaks) via the **Secrets scan** job in `.github/workflows/security.yml`. The CI gate uses the ruleset in `.gitleaks.toml` (gitleaks default rules plus a small allowlist for known CI stubs and reference data).

You can also run gitleaks locally before committing — recommended for catching mistakes before they reach the remote.

### One-time setup

Install gitleaks:

```bash
# macOS
brew install gitleaks

# Linux — see https://github.com/gitleaks/gitleaks/releases for binaries

# Or via Docker (no install needed):
docker pull zricethezav/gitleaks:latest
```

Install the local pre-commit hook (one-time, after `pnpm install`):

```bash
pnpm run hooks:install
```

This wires `scripts/secrets-scan-staged.sh` as a Git pre-commit hook via [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks). The script gracefully skips with a warning if gitleaks isn't installed, so contributors aren't blocked — CI is the authoritative gate.

### Manual scanning

```bash
# Scan only staged files (what the pre-commit hook does)
pnpm run secrets:scan-staged

# Scan the entire working tree + history
pnpm run secrets:scan
```

### What to do if gitleaks flags something

1. **If it's a real secret**: do NOT commit. Rotate the secret at its source (Vercel / Neon / Resend / etc.), then either remove it from the staged change or replace it with an environment-variable reference.
2. **If it's a false positive**: add a targeted entry to `.gitleaks.toml` `[allowlist]` with a comment explaining why. Prefer `regexes` over broad `paths` so the allowlist doesn't accidentally cover future files.

Never bypass the hook with `git commit --no-verify` for a real finding — CI will catch it and block the PR.

## What is NOT a secret

The following are intentionally committed and are not secrets:

- `apps/web/.env.example` — variable-name template; all secret values are empty
- `pnpm-lock.yaml` — contains base64 SHA-512 content hashes that look like secrets to naïve scanners
- `apps/web/src/lib/market-data/data/*.json` — public market reference data (FX series, asset prices, inflation series)
- The CI stub strings `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=` and `ci-stub-hmac-key-32-chars-padding-here` in `.github/workflows/*.yml` — placeholder values used only to satisfy the env validator during accessibility / e2e / lighthouse CI runs
