# Infrastructure & Deployment

> Current state of the diBoaS platform infrastructure as of May 2026.
> Phase 1: pre-launch marketing site with waitlist functionality.

## 1. Overview

| Layer          | Technology                                          | Version          |
| -------------- | --------------------------------------------------- | ---------------- |
| Framework      | Next.js (App Router)                                | 16.2.11          |
| Language       | TypeScript (strict)                                 | 5.9.x            |
| UI             | React + Tailwind CSS                                | 18.3.x / 3.4.x   |
| Monorepo       | Turborepo + pnpm                                    | 2.10.x / 10.33.0 |
| i18n           | react-intl (en, pt-BR, es, de)                      | 6.4.x            |
| Testing        | Vitest + @vitest/coverage-v8                        | 4.1.x            |
| Component dev  | Storybook                                           | 10.3.x           |
| Database       | Neon PostgreSQL (@neondatabase/serverless)          | 1.0.x            |
| Email          | Resend (@diboas/email)                              | workspace        |
| Error tracking | Sentry (@sentry/nextjs)                             | 10.65.x          |
| Analytics      | PostHog (consent-gated, lazy-loaded)                | 1.399.x          |
| Rate limiting  | Upstash Redis (@upstash/ratelimit + @upstash/redis) | 2.0.x / 1.36.x   |
| Performance    | web-vitals                                          | 5.1.x            |
| Sanitization   | DOMPurify                                           | 3.4.x            |

Single web application (`apps/web`). No backend services, no microservices, no message queues.

> **This doc is the current-state, as-built stack.** For the *forward-looking* rationale — why TypeScript/Node
> for the app, Python for quant, bought custody/ramp, and the **triggers that would make us reconsider** (Rust,
> Go, Elixir, …) — see **`docs/tech/architecture-decisions.md` → ADR-001 (backend & runtime stack)**.

## 2. Hosting — Vercel

- **Project:** Vercel project `diboas-platform-web` (team / project IDs held in the Vercel dashboard and `.env` — not published here).
- **Auto-deploy:** Pushes to `main` trigger production deployments.
- **Preview deployments:** Every PR gets a preview URL automatically.
- **Runtime:** Node.js (serverless functions for API routes).
- **Build command:** `pnpm build` (Turborepo orchestrates workspace dependency order).
- **`vercel.json`** (root) holds Dependabot deploy-gating + the audit-log retention cron (`/api/cron/purge-audit-logs`, daily 03:00 UTC). All other configuration is via the Vercel dashboard and `next.config.js`.

## 3. DNS & CDN — Cloudflare

- **Domain:** diboas.com (registered via GoDaddy).
- **DNS:** Cloudflare in **DNS-only mode** (not proxied / no orange cloud).
- **SSL:** Managed by Vercel (automatic via Let's Encrypt). Cloudflare does not terminate TLS.
- **No Cloudflare WAF, caching, or Workers** — Cloudflare is used strictly for DNS resolution.

## 4. Database — Neon PostgreSQL

- **Provider:** Neon serverless PostgreSQL (project ID held in the Neon dashboard and `.env` — not published here).
- **Driver:** `@neondatabase/serverless` (HTTP-based, no persistent connections).
- **Usage:** Waitlist signups, referral tracking, position data, and investor contact requests (`investor_requests`, migration `014` — AES-256-GCM encrypted PII + HMAC blind index).
- **Migrations:** `pnpm --filter web db:migrate` (custom migration runner via `tsx`).
- **Status check:** `pnpm --filter web db:status`.
- **Env var:** `DATABASE_URL` (pooled connection string from Neon console).
- **Backups:** Managed by Neon (point-in-time recovery included in their service).

## 5. Email — Resend

- **Package:** `@diboas/email` (workspace package).
- **Provider:** Resend API.
- **Sending domain:** Configured via `send.adelaide` subdomain DNS records.
- **Env vars:** `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`.
- **Usage:** Waitlist confirmation emails.

## 6. Rate Limiting — Upstash Redis

- **Packages:** `@upstash/ratelimit` + `@upstash/redis`.
- **Fallback:** In-memory rate limiting when Upstash credentials are not configured.
- **Three tiers configured via env vars:**
  - **Strict** (sensitive endpoints like signup): 5 req / 60s
  - **Standard** (general API): 30 req / 60s
  - **Lenient** (read-only): 100 req / 60s
- **Env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_PREFIX`.

## 7. Monitoring

> **Operational playbook:** `docs/tech/MONITORING_OPS.md` (committed) — verification procedures, troubleshooting, rotation runbooks, incident archive.
>
> **Org-specific values** (current DSN, project IDs, dashboard links): `docs/monitoring/INFRASTRUCTURE_GUIDE.md` (local-only).

The monitoring operating invariants (PostHog ingest-host, CSP full-label wildcards, Sentry build secrets in `turbo.json#env`, DSN-active check, tunnel-path, GA4 two-stage loading) are **owned by `MONITORING_OPS.md` § E** — do not restate them here. The sub-sections below cover only the infra-facing facts (which config files, which env vars) that belong in this deployment doc.

### Sentry (error tracking + session replay + perf tracing)

- **Package:** `@sentry/nextjs` 10.65.x.
- **Config files:**
  - `apps/web/src/instrumentation.ts` — Next.js root instrumentation; wires server/edge Sentry configs based on `NEXT_RUNTIME`; also exports `onRequestError` hook for server-side error capture (RSC, route handlers, middleware)
  - `apps/web/sentry.server.config.ts` — Node.js runtime (loaded by `instrumentation.ts` when runtime is `nodejs`)
  - `apps/web/sentry.edge.config.ts` — middleware + edge routes (loaded when runtime is `edge`)
  - `apps/web/src/instrumentation-client.ts` — browser; auto-loaded by Next.js 16 (replaces legacy `sentry.client.config.ts`); session replay is OFF by default and added only after `CONSENT_GIVEN` per Lighthouse Workstream B
- **Tunnel route:** `apps/web/src/app/api/monitoring/route.ts` — same-origin POST endpoint that forwards Sentry envelopes to `*.ingest.sentry.io`. Bypasses ad-blockers AND keeps the CSP narrow (no `connect-src` exposure to Sentry's hostname). Manual handler — Turbopack does NOT auto-generate the tunnel route.
- **Build plugin:** `apps/web/next.config.js` § `sentryWebpackPluginOptions` — uploads source maps + tags releases. Configured with `tunnelRoute: '/api/monitoring'`. `silent: true` to reduce build-log noise — flip to `false` to debug build-time issues.
- **Release tagging:** falls back to `apps/web/package.json#version` (currently `0.1.0`); production builds override with the Vercel commit SHA via the build plugin.
- **Runtime env var (browser):** `NEXT_PUBLIC_SENTRY_DSN`
- **Build-time env vars** (must also be in `turbo.json#tasks.build.env`): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- **Client telemetry-tagging env vars** (read by `apps/web/src/config/monitoring.ts` `SENTRY_CONFIG`): `NEXT_PUBLIC_SENTRY_ORG`, `NEXT_PUBLIC_SENTRY_PROJECT`

### PostHog (product analytics, feature flags, surveys, session replay)

- **Package:** `posthog-js` 1.399.x.
- **Provider:** `apps/web/src/components/Providers/PostHogProvider.tsx` — lazy `import('posthog-js')` inside a `useEffect` after `hasAnalyticsConsent()` returns true. NEVER imported at module level.
- **Config source:** `apps/web/src/config/env.ts` § `POSTHOG_CONFIG`.
- **Env vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.
- **SDK init options + consent integration + the load-bearing ingest-host rule:** see `MONITORING_OPS.md` § C (canonical). Not restated here.

### Google Analytics 4

- **Config files:** inline Consent Mode v2 bootstrap in `apps/web/src/app/layout.tsx`; consent-gated script loader in `apps/web/src/components/Providers/GoogleAnalyticsLoader.tsx`.
- **Env var:** `NEXT_PUBLIC_GA_ID` (format: `G-XXXXXXXXXX`).
- **Two-stage loading mechanism** (Lighthouse Workstream D) — see `MONITORING_OPS.md` § D (canonical). Not restated here.

### web-vitals

- **Package:** `web-vitals` 5.1.x.
- **Loaded:** Dynamic `import()` with sample rate. Reports through the Sentry tunnel route (`/api/monitoring`) to keep all monitoring traffic same-origin.

### No Prometheus, Grafana, Datadog, New Relic, or LogRocket in production.

The `.env.example` lists placeholders for these services, but none are integrated into application code.

## 8. CI/CD — GitHub Actions

Seven workflows in `.github/workflows/`. Five run on push/PR (`ci.yml`, `security.yml`, `accessibility.yml`, `e2e.yml`, `lighthouse.yml`); two run only on a schedule (`market-refresh-weekly.yml`, `security-scan-quarterly.yml`). `security.yml` runs on both. For the consolidated cross-system view of every recurring job (including the Vercel cron), see **Scheduled jobs — every cadence in one place** at the end of this section.

### `ci.yml` — Quality gate

- **Triggers:** Push to `main`, PRs targeting `main`.
- **Runner:** `ubuntu-latest`, Node.js 24 (Vercel's current default per 2026-02-27 platform update; bumped from 20 in `ci.yml`), pnpm (cached).
- **Steps (sequential):**
  1. `pnpm install --frozen-lockfile`
  2. `pnpm format:check`
  3. `pnpm type-check`
  4. `pnpm lint`
  5. `pnpm test`
  6. `node scripts/check-market-data-jargon.mjs` (Phase-7 jargon ban + no-direct-market-data-import guard)
  7. `pnpm validate:sdk-invariant`
  8. `pnpm validate:translations`
  9. `pnpm validate:design-tokens`
  10. `pnpm validate:investor-figures` (figures-registry L2 gate; L1 canon checks auto-skip in CI)
  11. `pnpm build`
  12. `pnpm check:budget` (bundle-budget gate)
  13. `pnpm --filter web build-storybook` (Storybook build artifact)

### `security.yml` — Secrets scan + dependency audit

- **Triggers:** Push to `main`, PRs targeting `main`, weekly cron (Monday 00:00 UTC).
- **Jobs:**
  1. **gitleaks** — secret-scanning over full history (`fetch-depth: 0`), configured by `.gitleaks.toml`; hard-fails on any unallowlisted secret.
  2. **Dependency audit** — `pnpm audit --prod --audit-level=critical`. On a real finding: Slack notification via `slackapi/slack-github-action@v3`, then the job fails.
- **Endpoint-outage-aware (since PR #428):** npm retired the bulk-advisory endpoints pnpm 10.33 calls (HTTP 410 → `ERR_PNPM_AUDIT_BAD_RESPONSE`). That specific error is treated as an **infrastructure warning, not a finding**, so an npm outage no longer reddens every PR; any other audit failure still fails the job. Dependency coverage during the outage leans on the Snyk PR checks + the quarterly scan. Remove the outage branch when pnpm ships the endpoint fix.

### `accessibility.yml` — pa11y WCAG2AA

- pa11y accessibility scan (WCAG 2.1 AA) on PR/push.

### `e2e.yml` — Playwright

- End-to-end Playwright suite on PR/push.

### `lighthouse.yml` — Lighthouse CI (advisory)

- Core Web Vitals + category assertions on PR/push. Currently **warn-only**
  (`continue-on-error: true`; assertions are `["warn", …]`) — does not block merge
  pending threshold calibration against CI-runner noise (see PENDING_ALL §5.37).

### `market-refresh-weekly.yml` — Adelaide Market data refresh (scheduled)

- **Triggers:** weekly cron (**Mondays 06:00 UTC**) + manual `workflow_dispatch`.
- **What it does:** runs the full `/market` build-time pipeline — fetch (dual-source verified) → fail-closed quality gate → regime engine → `computed.json` → generate editorial copy from the reviewed template library → reconcile (`generate.mjs --check`) + jargon gate + market vitest.
- **Output:** opens a PR on branch `editorial/market-refresh-auto` (labels `market-refresh`, `needs-editorial-review`). It **never pushes to `main`** — a human reviews the plain-language copy and merges. The 14-day staleness gate is the backstop; each Monday's PR self-resets, so unmerged weeks accrue no debt.
- **Secret:** `POLYGON_API_KEY` (founder-owned) arms the optional ETF-01 snapshot leg; the run still succeeds without it (fail-open on the optional leg, fail-closed on the core pipeline). Full design lives in the pipeline scripts (`apps/web/scripts/market-refresh/`); editorial workflow: `docs/integrations/market-editorial.md`.

### `security-scan-quarterly.yml` — Deep security scan (scheduled)

- **Triggers:** quarterly cron (**day 1 of Jan/Apr/Jul/Oct, 06:00 UTC**) + manual `workflow_dispatch`.
- **What it does:** read-only, no state changes — `scripts/security-scan.sh --live` (passive recon against production + local dependency/secrets checks) followed by a **Snyk full-project test** (`--severity-threshold=critical`).
- **Why it exists:** closes the F24 blind spot — `pnpm audit` reads the npm/GHSA DB only, so Snyk-only advisories with **no CVE** (e.g. `SNYK-JS-ESBUILD-17750822`) are invisible to `security.yml`. The Snyk step is the only automated coverage for those on a repo cadence.
- **Secret:** `SNYK_TOKEN` arms the Snyk step; it skips cleanly (warning, still green) when unset. Output uploads as a 400-day artifact; findings are triaged manually into the security findings ledger. A failing run marks the cadence red so it can't silently rot. See `docs/tech/security-playbook.md` §quarterly scan.

### What is NOT in CI

- No staging deployment step.
- No CodeQL scanning.
- **Note:** Snyk scanning IS covered — as PR checks via the Snyk GitHub App (not a workflow file in this repo) plus the quarterly `security-scan-quarterly.yml` step above. It is simply not a `.github/workflows/` file, which is why it does not appear in the catalog.

### Scheduled jobs — every cadence in one place

Four recurring jobs run without human action, across two systems (Vercel cron + GitHub Actions). This table is the single source of truth for "what runs on a timer and why"; the per-workflow detail is above and (for the Vercel cron) in §2.

| Job                    | Cadence   | Cron                                                     | System                                     | What / why                                                                                                                                                                                         | Fails how                                                                               |
| ---------------------- | --------- | -------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Audit-log purge**    | Daily     | `0 3 * * *` (03:00 UTC)                                  | Vercel cron → `/api/cron/purge-audit-logs` | Deletes `audit_logs` rows older than 90 days (`AUDIT_LOG_RETENTION_DAYS`). Enforces GDPR storage-limitation on the raw-IP audit trail. Bearer-authed against `CRON_SECRET`; inert (503) until set. | Logs + 500 response; never throws. The only scheduled job that mutates production data. |
| **Security audit**     | Weekly    | `0 0 * * 1` (Mon 00:00 UTC)                              | GitHub `security.yml`                      | gitleaks + `pnpm audit` (critical). Catches vulnerabilities in already-merged deps that generate no commit.                                                                                        | Slack alert + red run on a real finding; npm-endpoint outage warns only.                |
| **Market refresh**     | Weekly    | `0 6 * * 1` (Mon 06:00 UTC)                              | GitHub `market-refresh-weekly.yml`         | Regenerates `/market` regime data + editorial copy; opens a review PR (never pushes). Keeps the publicly-indexed weekly-cadence page honest without a manual chore.                                | Red run on pipeline/gate failure; 14-day staleness gate is the backstop.                |
| **Deep security scan** | Quarterly | `0 6 1 1,4,7,10 *` (day 1 of Jan/Apr/Jul/Oct, 06:00 UTC) | GitHub `security-scan-quarterly.yml`       | Live recon + Snyk full-project test. Closes the no-CVE advisory blind spot (F24) that `pnpm audit` can't see.                                                                                      | Red run marks the cadence so it can't rot silently; artifact retained 400 days.         |

**Cross-references:** enforcement view in `docs/tech/engineering-gates.md` (Security & Performance rows); runtime-monitoring procedures in `docs/tech/MONITORING_OPS.md`; secret arming/verification in `docs/monitoring/INFRASTRUCTURE_GUIDE.md`.

## 9. Security — Middleware

The Next.js middleware (`apps/web/middleware.ts`) runs on every non-static request and provides:

- **CSP nonce:** base64 of 16 random bytes per request via Web Crypto (`crypto.getRandomValues` + `btoa`) — Edge Runtime has no `node:crypto`. Scripts require `nonce-<24-char-base64>` — no `unsafe-inline` in production. See `docs/tech/security.md` §2 for the full rationale.
- **Request ID:** Unique `x-request-id` header per request.
- **Locale detection:** Cookie > Accept-Language > default (`en`). Redirects bare paths to locale-prefixed paths.
- **Fail-open:** On middleware error, the request passes through without CSP rather than returning 500.

**Not in middleware (per-route concerns):** PII encryption (AES-256-GCM) lives in `apps/web/src/lib/security/encryption.ts` and is invoked by API route handlers that touch persisted PII (waitlist signup, email preferences). CSRF Origin validation lives in `apps/web/src/lib/security/csrf.ts` and is applied via `applyCsrf()` from `routeHelpers.ts` on mutation endpoints. `CSRF_ADDITIONAL_ORIGINS` configures the allowed-origin list consumed by that helper.

## 10. Environment Variables

Documented in `apps/web/.env.example` (~120 variables across these categories):

| Category      | Examples                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| Application   | `NEXT_PUBLIC_APP_URL`, `NODE_ENV`                                         |
| Database      | `DATABASE_URL`                                                            |
| Email         | `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`                                    |
| Cal.com       | `NEXT_PUBLIC_CAL_LINK`, `NEXT_PUBLIC_CAL_EMBED_SCRIPT`                    |
| Waitlist      | `FOUNDING_MEMBER_CAP`, `INTERNAL_API_KEY`                                 |
| Cron          | `CRON_SECRET` (Bearer-auths the Vercel cron `/api/cron/purge-audit-logs`) |
| Analytics     | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`  |
| Security      | `ENCRYPTION_KEY`, `HMAC_KEY`, `CSRF_ADDITIONAL_ORIGINS`                   |
| Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                      |
| Feature flags | `NEXT_PUBLIC_ENABLE_BOOKING`, `NEXT_PUBLIC_ENABLE_REFERRALS`              |
| Brand / SEO   | `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`          |

Secret rotation policy: 90-day cycle for `ENCRYPTION_KEY`, `HMAC_KEY`, `RESEND_API_KEY`, `INTERNAL_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET`.

## 11. Node.js & Runtime

- **Required:** Node.js >= 22.0.0, pnpm >= 8.0.0 (enforced in root `package.json` `engines`).
- **CI:** Node.js **24** (set in both workflow files; bumped 20 → 24, audit/2026-05-08, to match Vercel's current default per the 2026-02-27 platform update).
- **Vercel:** Node.js 24.x in dashboard — **matches CI.** Earlier note about a 20.x mismatch is stale: per the 2026-02-27 Vercel platform update, Node 24 LTS is the default; CI was bumped to align (Vercel runtime + CI both on Node 24).
- **`engines` field:** pins `>= 22.0.0` (founder decision 2026-07-10, prompted by verification finding V-1: a script imported the Node-22-only `fs.globSync` while the floor still claimed 20, a crash on any Node the repo nominally supported but nobody ran). Every real environment satisfies it: local dev 22.x, CI + Vercel 24.x.
- **Next.js runtime:** `nodejs` (not Edge) for server functions. `NEXT_RUNTIME` is set by the framework per execution context (`nodejs` / `edge`) — it is read, not configured; `instrumentation.ts` switches on it to load the matching Sentry config. Middleware (`apps/web/middleware.ts`) runs in the Edge Runtime regardless of this setting — see `docs/tech/security.md` §2 for the Edge-Runtime constraints on CSP nonce generation.

## 12. Build Configuration — Turborepo

Defined in `turbo.json`. All tasks depend on upstream workspace builds (`^build`):

| Task         | Cache | Outputs                    | Notes                           |
| ------------ | ----- | -------------------------- | ------------------------------- |
| `build`      | Yes   | `.next/**`, `dist/**`      | Env vars declared for cache key |
| `dev`        | No    | —                          | Persistent (watch mode)         |
| `lint`       | Yes   | —                          | Depends on package builds       |
| `type-check` | Yes   | —                          | Depends on package builds       |
| `test`       | Yes   | `coverage/**`              | Depends on package builds       |
| `lighthouse` | Yes   | `lighthouse-reports/**`    | Depends on build                |
| `pa11y`      | Yes   | `accessibility-reports/**` | Depends on build                |
