# Infrastructure & Deployment

> Current state of the diBoaS platform infrastructure as of May 2026.
> Phase 1: pre-launch marketing site with waitlist functionality.

## 1. Overview

| Layer          | Technology                                          | Version        |
| -------------- | --------------------------------------------------- | -------------- |
| Framework      | Next.js (App Router)                                | 16.2.6         |
| Language       | TypeScript (strict)                                 | 5.9.x          |
| UI             | React + Tailwind CSS                                | 18.3.x / 3.4.x |
| Monorepo       | Turborepo + pnpm                                    | 2.8.x / 8.15.0 |
| i18n           | react-intl (en, pt-BR, es, de)                      | 6.4.x          |
| Testing        | Vitest + @vitest/coverage-v8                        | 4.1.x          |
| Component dev  | Storybook                                           | 10.3.x         |
| Database       | Neon PostgreSQL (@neondatabase/serverless)          | 1.0.x          |
| Email          | Resend (@diboas/email)                              | workspace      |
| Error tracking | Sentry (@sentry/nextjs)                             | 10.49.x        |
| Analytics      | PostHog (consent-gated, lazy-loaded)                | 1.313.x        |
| Rate limiting  | Upstash Redis (@upstash/ratelimit + @upstash/redis) | 2.0.x / 1.36.x |
| Performance    | web-vitals                                          | 5.1.x          |
| Sanitization   | DOMPurify                                           | 3.4.x          |

Single web application (`apps/web`). No backend services, no microservices, no message queues.

## 2. Hosting — Vercel

- **Project:** Vercel project `diboas-platform-web` (team / project IDs held in the Vercel dashboard and `.env` — not published here).
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

- **Provider:** Neon serverless PostgreSQL (project ID held in the Neon dashboard and `.env` — not published here).
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

> **Operational playbook:** `docs/tech/MONITORING_OPS.md` (committed) — verification procedures, troubleshooting, rotation runbooks, incident archive.
>
> **Org-specific values** (current DSN, project IDs, dashboard links): `docs/monitoring/INFRASTRUCTURE_GUIDE.md` (local-only).
>
> **Quick gotchas** (full list in `MONITORING_OPS.md` § E):
> - PostHog `host` MUST be `us.i.posthog.com` / `eu.i.posthog.com` (ingest), never `app.posthog.com` (console). Wrong value → `/array/<token>/config.js` 404 + silently degraded SDK.
> - CSP wildcards MUST be full-label (`*.i.posthog.com`); partial-label patterns (`*-assets.i.posthog.com`) are silently ignored by browsers.
> - Sentry build secrets (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`) MUST be listed in `turbo.json#env`, otherwise Turborepo scrubs them and source maps silently fail to upload.
> - When rotating a Sentry DSN, verify the project key is "Active" (not "Disabled") in Sentry → Project Settings → Client Keys. Disabled keys return HTTP 403 silently and drop 100% of events.

### Sentry (error tracking + session replay + perf tracing)

- **Package:** `@sentry/nextjs` 10.49.x.
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

- **Package:** `posthog-js` 1.313.x.
- **Provider:** `apps/web/src/components/Providers/PostHogProvider.tsx` — lazy `import('posthog-js')` inside a `useEffect` after `hasAnalyticsConsent()` returns true. NEVER imported at module level.
- **Config source:** `apps/web/src/config/env.ts` § `POSTHOG_CONFIG`.
- **SDK init options:**
  - `defaults: '2025-11-30'` — pinned default-config bundle (latest accepted by `posthog-js` 1.313.0). Stabilises SDK behaviour across version bumps.
  - `person_profiles: 'identified_only'` — GDPR-friendly + cost-saving. Anonymous events still tracked under a session-anonymous `distinct_id`; a "person" is only created when `posthog.identify(distinctId)` is called (typically after waitlist signup).
  - `respect_dnt: true`
  - `advanced_disable_feature_flags: process.env.NODE_ENV === 'development'`
- **Consent integration:** subscribes to `ApplicationEventBus` events (`CONSENT_GIVEN` → init if not already; `CONSENT_WITHDRAWN` → `opt_out_capturing()`).
- **Env vars:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (must be the **ingest** host `https://us.i.posthog.com` or `https://eu.i.posthog.com`; SDK derives the `*-assets.i.posthog.com` host from the `.i.` infix).

### Google Analytics 4

- **Two-stage loading** (Lighthouse Workstream D, 2026-05-22):
  1. **Inline Consent Mode v2 bootstrap** in `apps/web/src/app/layout.tsx` (`<head>` pre-hydration): declares `window.dataLayer`, sets `gtag('consent', 'default', { analytics_storage: 'denied', ... })`, subscribes to the DOM `cookie-consent-changed` event to flush `gtag('consent', 'update', { analytics_storage: 'granted' })` after the user accepts.
  2. **Script-loading gate** in `apps/web/src/components/Providers/GoogleAnalyticsLoader.tsx`: the `gtag/js` `<Script>` tag (~67 KB) does NOT download until `applicationEventBus.CONSENT_GIVEN` fires. Saves the download entirely for users who don't accept analytics (~60-70% of EU traffic).
- **Env var:** `NEXT_PUBLIC_GA_ID` (format: `G-XXXXXXXXXX`).

### web-vitals

- **Package:** `web-vitals` 5.1.x.
- **Loaded:** Dynamic `import()` with sample rate. Reports through the Sentry tunnel route (`/api/monitoring`) to keep all monitoring traffic same-origin.

### No Prometheus, Grafana, Datadog, New Relic, or LogRocket in production.

The `.env.example` lists placeholders for these services, but none are integrated into application code.

## 8. CI/CD — GitHub Actions

Two workflows in `.github/workflows/`:

### `ci.yml` — Quality gate

- **Triggers:** Push to `main`, PRs targeting `main`.
- **Runner:** `ubuntu-latest`, Node.js 24 (Vercel's current default per 2026-02-27 platform update; bumped from 20 in `ci.yml`), pnpm (cached).
- **Steps (sequential):**
  1. `pnpm install --frozen-lockfile`
  2. `pnpm type-check`
  3. `pnpm lint`
  4. `pnpm test`
  5. `pnpm validate:translations`
  6. `pnpm validate:design-tokens`
  7. `pnpm build`
  8. `pnpm check:budget` (bundle-budget gate)
  9. `pnpm --filter web build-storybook` (Storybook build artifact)

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

- **CSP nonce:** base64 of 16 random bytes per request via Web Crypto (`crypto.getRandomValues` + `btoa`) — Edge Runtime has no `node:crypto`. Scripts require `nonce-<24-char-base64>` — no `unsafe-inline` in production. See `docs/tech/security.md` §2 for the full rationale.
- **Request ID:** Unique `x-request-id` header per request.
- **Locale detection:** Cookie > Accept-Language > default (`en`). Redirects bare paths to locale-prefixed paths.
- **Fail-open:** On middleware error, the request passes through without CSP rather than returning 500.

**Not in middleware (per-route concerns):** PII encryption (AES-256-GCM) lives in `apps/web/src/lib/security/encryption.ts` and is invoked by API route handlers that touch persisted PII (waitlist signup, email preferences). CSRF Origin validation lives in `apps/web/src/lib/security/csrf.ts` and is applied via `applyCsrf()` from `routeHelpers.ts` on mutation endpoints. `CSRF_ADDITIONAL_ORIGINS` configures the allowed-origin list consumed by that helper.

## 10. Environment Variables

Documented in `apps/web/.env.example` (67 variables across these categories):

| Category      | Examples                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| Application   | `NEXT_PUBLIC_APP_URL`, `NODE_ENV`                                        |
| Database      | `DATABASE_URL`                                                           |
| Email         | `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`                                   |
| Cal.com       | `NEXT_PUBLIC_CAL_LINK`, `NEXT_PUBLIC_CAL_EMBED_SCRIPT`                   |
| Waitlist      | `FOUNDING_MEMBER_CAP`, `INTERNAL_API_KEY`                                |
| Analytics     | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY` |
| Security      | `CSP_NONCE_SECRET`, `ENCRYPTION_KEY`, `HMAC_KEY`                         |
| Rate limiting | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                     |
| Feature flags | `NEXT_PUBLIC_ENABLE_BOOKING`, `NEXT_PUBLIC_ENABLE_REFERRALS`             |
| Brand / SEO   | `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`         |

Secret rotation policy: 90-day cycle for `ENCRYPTION_KEY`, `HMAC_KEY`, `RESEND_API_KEY`, `INTERNAL_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`.

## 11. Node.js & Runtime

- **Required:** Node.js >= 20.0.0, pnpm >= 8.0.0 (enforced in root `package.json` `engines`).
- **CI:** Node.js **24** (set in both workflow files; bumped 20 → 24, audit/2026-05-08, to match Vercel's current default per the 2026-02-27 platform update).
- **Vercel:** Node.js 24.x in dashboard — **matches CI.** Earlier note about a 20.x mismatch is stale: per the 2026-02-27 Vercel platform update, Node 24 LTS is the default; CI was bumped to align (Vercel runtime + CI both on Node 24).
- **`engines` field:** still pins `>= 20.0.0` as the minimum supported (Node 24 satisfies it). Bumping the floor to 22 or 24 is a separate question — not blocking.
- **Next.js runtime:** `nodejs` (not Edge) for server functions. Configurable via `NEXT_RUNTIME` env var. Middleware (`apps/web/middleware.ts`) runs in the Edge Runtime regardless of this setting — see `docs/tech/security.md` §2 for the Edge-Runtime constraints on CSP nonce generation.

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
