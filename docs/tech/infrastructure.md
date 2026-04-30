# Infrastructure & Deployment

> Current state of the diBoaS platform infrastructure as of March 2026.
> Phase 1: pre-launch marketing site with waitlist functionality.

## 1. Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.7 |
| Language | TypeScript (strict) | 5.9.x |
| UI | React + Tailwind CSS | 18.3.x / 3.4.x |
| Monorepo | Turborepo + pnpm | 2.8.x / 8.15.0 |
| i18n | react-intl (en, pt-BR, es, de) | 6.4.x |
| Testing | Vitest + @vitest/coverage-v8 | 4.1.x |
| Component dev | Storybook | 10.3.x |
| Database | Neon PostgreSQL (@neondatabase/serverless) | 1.0.x |
| Email | Resend (@diboas/email) | workspace |
| Error tracking | Sentry (@sentry/nextjs) | 10.49.x |
| Analytics | PostHog (consent-gated, lazy-loaded) | 1.313.x |
| Rate limiting | Upstash Redis (@upstash/ratelimit + @upstash/redis) | 2.0.x / 1.36.x |
| Performance | web-vitals | 5.1.x |
| Sanitization | DOMPurify | 3.4.x |

Single web application (`apps/web`). No backend services, no microservices, no message queues.

## 2. Hosting — Vercel

- **Project:** `diboas-platform-web` (Vercel team `team_yJJIgLwDIgziqWx0pBsiEVlf`)
- **Auto-deploy:** Pushes to `main` trigger production deployments.
- **Preview deployments:** Every PR gets a preview URL automatically.
- **Runtime:** Node.js (serverless functions for API routes).
- **Build command:** `pnpm build` (Turborepo orchestrates workspace dependency order).
- **No `vercel.json`** — all configuration is via the Vercel dashboard and `next.config.js`.

## 3. DNS & CDN — Cloudflare

- **Domain:** diboas.com (registered via GoDaddy).
- **DNS:** Cloudflare in **DNS-only mode** (not proxied / no orange cloud).
- **SSL:** Managed by Vercel (automatic via Let's Encrypt). Cloudflare does not terminate TLS.
- **No Cloudflare WAF, caching, or Workers** — Cloudflare is used strictly for DNS resolution.

## 4. Database — Neon PostgreSQL

- **Provider:** Neon serverless PostgreSQL (project: `snowy-dawn-74472412`).
- **Driver:** `@neondatabase/serverless` (HTTP-based, no persistent connections).
- **Usage:** Waitlist signups, referral tracking, position data.
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

### Sentry (error tracking)
- **Package:** `@sentry/nextjs` 10.49.x.
- **Config:** `instrumentation-client.ts` (client-side), server instrumentation via Sentry Next.js plugin.
- **Env vars:** `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ORG`, `NEXT_PUBLIC_SENTRY_PROJECT`.

### PostHog (product analytics)
- **Package:** `posthog-js` 1.313.x.
- **Consent-gated:** Never imported at module level. Loaded via dynamic `import('posthog-js')` only after user consent.
- **Env vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.

### Google Analytics 4
- **Loaded:** Via `afterInteractive` script strategy.
- **Env var:** `NEXT_PUBLIC_GA_ID`.

### web-vitals
- **Package:** `web-vitals` 5.1.x.
- **Loaded:** Dynamic `import()` with sample rate. Reports to Vercel Analytics endpoint.

### No Prometheus, Grafana, Datadog, New Relic, or LogRocket in production.
The `.env.example` lists placeholders for these services, but none are integrated into application code.

## 8. CI/CD — GitHub Actions

Two workflows in `.github/workflows/`:

### `ci.yml` — Quality gate
- **Triggers:** Push to `main`, PRs targeting `main`.
- **Runner:** `ubuntu-latest`, Node.js 20, pnpm (cached).
- **Steps (sequential):**
  1. `pnpm install --frozen-lockfile`
  2. `pnpm type-check`
  3. `pnpm lint`
  4. `pnpm test`
  5. `pnpm validate:translations`
  6. `pnpm validate:design-tokens`
  7. `pnpm build`

### `security.yml` — Dependency audit
- **Triggers:** Push to `main`, PRs targeting `main`, weekly cron (Monday 00:00 UTC).
- **Steps:**
  1. `pnpm audit --prod --audit-level=high`
  2. On failure: Slack notification via `slackapi/slack-github-action@v2`.
  3. Fails the job if vulnerabilities are found.

### What is NOT in CI
- No E2E tests (Playwright not configured).
- No Lighthouse CI step (available locally via `pnpm performance:audit`).
- No staging deployment step.
- No CodeQL or Snyk scanning.

## 9. Security — Middleware

The Next.js middleware (`apps/web/middleware.ts`) runs on every non-static request and provides:

- **CSP nonce:** `crypto.randomUUID()` per request. Scripts require `nonce-{uuid}` — no `unsafe-inline` in production.
- **Request ID:** Unique `x-request-id` header per request.
- **Locale detection:** Cookie > Accept-Language > default (`en`). Redirects bare paths to locale-prefixed paths.
- **Fail-open:** On middleware error, the request passes through without CSP rather than returning 500.
- **PII encryption:** AES-256-GCM via `ENCRYPTION_KEY`. HMAC-SHA256 blind index via `HMAC_KEY`.
- **CSRF:** Origin validation on mutation endpoints. Additional origins configurable via `CSRF_ADDITIONAL_ORIGINS`.

## 10. Environment Variables

Documented in `apps/web/.env.example` (67 variables across these categories):

| Category | Examples |
|----------|---------|
| Application | `NEXT_PUBLIC_APP_URL`, `NODE_ENV` |
| Database | `DATABASE_URL` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` |
| Cal.com | `NEXT_PUBLIC_CAL_LINK`, `NEXT_PUBLIC_CAL_EMBED_SCRIPT` |
| Waitlist | `FOUNDING_MEMBER_CAP`, `INTERNAL_API_KEY` |
| Analytics | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY` |
| Security | `CSP_NONCE_SECRET`, `ENCRYPTION_KEY`, `HMAC_KEY` |
| Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Feature flags | `NEXT_PUBLIC_ENABLE_BOOKING`, `NEXT_PUBLIC_ENABLE_REFERRALS` |
| Brand / SEO | `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |

Secret rotation policy: 90-day cycle for `ENCRYPTION_KEY`, `HMAC_KEY`, `RESEND_API_KEY`, `INTERNAL_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`.

## 11. Node.js & Runtime

- **Required:** Node.js >= 20.0.0, pnpm >= 8.0.0 (enforced in root `package.json` `engines`).
- **CI:** Node.js 20 (set in both workflow files).
- **Vercel:** Currently set to Node.js 24.x in dashboard. Should be 20.x to match CI and `engines` field.
- **Next.js runtime:** `nodejs` (not Edge). Configurable via `NEXT_RUNTIME` env var.

## 12. Build Configuration — Turborepo

Defined in `turbo.json`. All tasks depend on upstream workspace builds (`^build`):

| Task | Cache | Outputs | Notes |
|------|-------|---------|-------|
| `build` | Yes | `.next/**`, `dist/**` | Env vars declared for cache key |
| `dev` | No | — | Persistent (watch mode) |
| `lint` | Yes | — | Depends on package builds |
| `type-check` | Yes | — | Depends on package builds |
| `test` | Yes | `coverage/**` | Depends on package builds |
| `lighthouse` | Yes | `lighthouse-reports/**` | Depends on build |
| `pa11y` | Yes | `accessibility-reports/**` | Depends on build |
