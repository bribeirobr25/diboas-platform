# Post-Launch Implementation Plan

**Created:** March 11, 2026
**Status:** Website live at diboas.com (waitlist/marketing phase)
**Supersedes:** docs/pending-implementation.md (Nov 2025 — many items now complete)

---

## What's Already Done (Pre-Launch Completions)

Before planning forward, here's what was completed during pre-launch that the old `pending-implementation.md` listed as pending:

| Item | Old Status | Current Status |
|------|-----------|---------------|
| Sentry error monitoring | Awaiting config | **Done** — Client + Server configs, 10% tracing, session replay |
| Database (Neon PostgreSQL) | Not started | **Done** — 7 migrations, encrypted PII, HMAC blind index |
| Upstash Redis rate limiting | Not started | **Done** — 3-tier (strict/standard/lenient) |
| API rate limiting | Not started | **Done** — Per-endpoint, sliding window, in-memory fallback |
| AES-256-GCM encryption | Not started | **Done** — PII encryption, key separation (ENCRYPTION_KEY + HMAC_KEY) |
| Waitlist backend | Frontend only | **Done** — Full API (signup, position, stats, referral, delete) |
| Email service (Resend) | Not started | **Done** — Confirmation emails, delivery tracking |
| CSRF protection | Not started | **Done** — Origin validation on mutation endpoints |
| CSP nonce-based | Not started | **Done** — Per-request nonces in middleware.ts |
| Error boundaries | Partial | **Done** — 3-layer (Root > Route group > Page) |
| Loading states | Partial | **Done** — loading.tsx in every route group |
| PostHog consent-gated | Not started | **Done** — Lazy-load behind consent, no static import |
| Accessibility (WCAG AA) | Partial | **Done** — Focus traps, native buttons, contrast, fieldsets |
| GDPR deletion flow | Not started | **Done** — Deletion tokens, encrypted email lookup |
| i18n (4 locales) | Partial | **Done** — en, pt-BR, es, de with namespace split |

---

## Post-Launch Phases Overview

```
Phase 1: Hardening & Quick Wins (Weeks 1-3)  ← ACTIVE NOW
    ↓
Phases 2–7: Deferred — to be planned in a dedicated future session (CEO decision, March 11, 2026)
```

The team's current focus is exclusively on Phase 1 hardening + the post-launch fix plan (`docs/post-launch/diboas_fix_plan.md`).

---

## Phase 1: Hardening & Quick Wins (Weeks 1-3)

**Goal:** Fix known issues, improve observability, add Upstash Redis for production rate limiting, and harden what's already deployed.

### 1.1 Sentry Configuration Updates

**Principles:** #7 Error Handling, #12 Monitoring

The build logs show two Sentry deprecation warnings that should be addressed before they become breaking changes.

**Tasks:**
1. Rename `sentry.client.config.ts` → `instrumentation-client.ts` (Turbopack compatibility)
2. Add `Sentry.captureRequestError` to the `onRequestError` hook in instrumentation file
3. Verify source maps upload is working in production builds
4. Configure alert rules in Sentry dashboard (error spike, new error types)

**Files to modify:**
- `apps/web/sentry.client.config.ts` → rename
- `apps/web/instrumentation.ts` → add onRequestError hook

---

### 1.2 Production Environment Variables

**Principles:** #8 Security

**Tasks:**
1. Add `NEXT_PUBLIC_APP_URL=https://diboas.com` to Vercel env vars
2. Add `NEXT_PUBLIC_APP_DOMAIN=diboas.com` to Vercel env vars
3. Add `NEXT_PUBLIC_BASE_URL=https://diboas.com` to Vercel env vars
4. Verify OG images and referral links resolve correctly
5. Set Vercel Node.js version to 20.x (currently 24.x)

---

### 1.3 Upstash Redis for Production Rate Limiting

**Principles:** #8 Security, #11 Concurrency

Currently rate limiting falls back to in-memory (not distributed). For production with multiple serverless instances, Upstash Redis is needed.

**Tasks:**
1. Create Upstash Redis instance (free tier: 10K requests/day)
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars
3. Verify rate limiting works across serverless function instances
4. Monitor rate limit hit rates in Upstash dashboard

---

### 1.4 Performance Budget Investigation

**Principles:** #9 Performance

Build logs show all entrypoints exceeding the 800KB budget (most at ~5.2MB). The primary contributor is the i18n bundle (2.8MB per build output).

**Tasks:**
1. Investigate `@diboas/i18n` bundle — the ESM output is 2.8MB because all translations are bundled together
2. Consider splitting translations by locale (load only the active locale)
3. Consider splitting translations by namespace (load only page-relevant keys)
4. Evaluate `next/dynamic` for heavy client components (charts, carousels)
5. Run Lighthouse CI against production to establish baseline scores

**Files to investigate:**
- `packages/i18n/tsup.config.ts` — build configuration
- `packages/i18n/src/index.ts` — barrel export that bundles everything

---

### 1.5 CI/CD Pipeline

**Principles:** #12 Monitoring, #8 Security

No GitHub Actions workflows exist yet. Vercel auto-deploys on push, but there's no quality gate.

**Tasks:**
1. Create `.github/workflows/ci.yml` with:
   - `pnpm type-check` (all workspaces)
   - `pnpm lint` (all workspaces)
   - `pnpm test` (all workspaces)
   - `pnpm build` (production build verification)
2. Run on: push to `main`, pull requests to `main`
3. Block PR merges if CI fails (GitHub branch protection rule)
4. Add `pnpm validate:translations` and `pnpm validate:design-tokens` to CI

---

## Phases 2–7: Deferred

> **CEO Decision (Bar) — March 11, 2026:**
> Phases 2 through 7 (Authentication, Core Backend, Provider Integrations, Domain Features, Real-Time Monitoring, and Testing Infrastructure) will be discussed and planned in a dedicated future session. For now, the team focuses exclusively on Phase 1 hardening and the post-launch fix plan (`docs/post-launch/diboas_fix_plan.md`).
>
> **Important:** When these phases are revisited, the provider and wallet sections must be updated to reflect the confirmed diBoaS architecture:
> - **Wallets:** Turnkey (MPC), not Privy
> - **On-ramp/KYC:** Onramper (all markets including PIX), not Stripe/Plaid/Persona
> - **DeFi protocols:** Solana-first (Sky, Aave, Compound, Jito, Jupiter), not Ethereum-first
> - **Credit/BNPL:** Deliberately and permanently excluded — must not appear in any phase

---

## Database Migration Sequence

**Current (001–007):** Waitlist entries, counters, deletion tokens, email delivery logs, B2B founding member counters.

**Migrations 008+ will be defined when Phases 2–7 are planned.** No new migrations are needed for Phase 1.

All future migrations must be:
- Idempotent (safe to re-run)
- Tracked in `schema_migrations` table (existing pattern)
- Include proper indexes per database.md
- Use `snake_case` naming for tables and columns

---

## Service File Organization

Service file organization for Phases 2–7 will be defined when those phases are planned. The constraints from `coding-standards.md` apply to all future work:
- Services: ≤200 lines (prefer 100-150)
- Single responsibility per file
- Interface-based abstractions for all external dependencies
- All services emit domain events for significant state changes
- Every async operation in try-catch with correlation ID logging

---

## Risk Register (Phase 1)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Neon free tier limits (500MB storage) | Medium | Monitor usage; upgrade to Pro when approaching 80% |
| Vercel serverless cold starts | Low | Use `output: 'standalone'`, keep functions warm |
| Upstash rate limit (10K requests/day free) | Medium | Monitor; upgrade when approaching limit |
| i18n bundle size (2.8MB) | High | Phase 1 priority — split by locale/namespace |

---

## Success Criteria

| Phase | Success Metric |
|-------|---------------|
| 1 | Lighthouse score >90, CI pipeline green, Sentry clean, all fix plan items shipped |
| 2–7 | To be defined when phases are planned |

---

## Related Documentation

- Architecture: `docs/architecture.md`
- Coding Standards: `docs/coding-standards.md`
- Security: `docs/security.md`
- Database Design: `docs/database.md`
- API Specifications: `docs/api.md`
- Backend Services: `docs/backend.md`
- Integrations: `docs/integrations.md`
- Component Patterns: `docs/component-architecture-pattern.md`
- Error Handling: `docs/error-boundary-guide.md`
- Infrastructure: `docs/infrastructure.md`
