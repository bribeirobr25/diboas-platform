# CLAUDE.md - diBoaS Platform

## Overview

diBoaS is a goal-driven wealth building platform — your side-pocket for wealth creation powered by the digital dollar. Currently **live in pre-launch/waitlist** phase at [diboas.com](https://diboas.com). The web app is a marketing and onboarding site with waitlist, interactive demo, and goal calculator — no production financial features are live yet.

**Current phase:** Pre-launch marketing site with waitlist functionality. Live since March 11, 2026. Domain packages, application services, and full DDD are Phase 2+ requirements.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **UI:** React 18, Tailwind CSS 3
- **Monorepo:** Turborepo + pnpm 10.33 workspaces (supply-chain hardened: script-blocking allowlist + 3-day `minimumReleaseAge`; re-resolving commands need `--config.minimumReleaseAge=0`)
- **i18n:** react-intl (4 locales: en, pt-BR, es, de)
- **Testing:** Vitest, @vitest/coverage-v8, Lighthouse CI, pa11y
- **Monitoring:** Sentry (error tracking + session replay), PostHog (product analytics), GA4 (traffic analytics), web-vitals
- **Security:** DOMPurify, Upstash Redis rate limiting, AES-256-GCM encryption, HMAC blind indexing
- **Email:** Resend (transactional email with retry + backoff)
- **Database:** Neon PostgreSQL (serverless)
- **Component dev:** Storybook 10

## Architecture

```
diboas-platform/
  apps/web/            # Next.js web application (the live marketing/waitlist site)
  apps/sandbox/        # Play-money B2C+B2B practice app (work-front; docs/sandbox-app/) —
                       #   real data/integrations except custody; gated + noindex. Committed on main;
                       #   architecture ruling-complete; Release-1 build sequence documented
                       #   (see docs/sandbox-app/SANDBOX_ARCHITECTURE_AND_FLOWS.md + RELEASE1_IMPLEMENTATION_PLAN).
  packages/email/      # @diboas/email - Email service (Resend)
  packages/i18n/       # @diboas/i18n - Internationalization
  packages/ui/         # @diboas/ui - Design system components
  packages/banking/    # @diboas/banking - event-sourced play ledger + Decimal.js fee math (backs apps/sandbox)
  packages/defi/       # @diboas/defi - strategy catalog-as-data + DeFiLlama/CoinGecko/gas providers (backs apps/sandbox)
  packages/investing/  # @diboas/investing - jobs split, goals, accrual replay (backs apps/sandbox)
  config/              # Design tokens JSON + schema
  scripts/             # Build/validation scripts
  docs/                # Documentation (only docs/tech/ + docs/integrations/ are git-tracked; the rest is local-only)
    sandbox-app/       # Sandbox work-front: rules, build order, architecture map + flow traces,
                       #   board records, release-1 implementation plan (the ordered build document)
    tech/              # Technical guides (committed) — canonical engineering reference
      ux-governance/   #   UX enforcement layer (committed): anti-slop checklist, principles canon, usage protocol
    audit/             # Audit history, security findings ledger, pending-work queue
    security/          # Recon/diagnostics reference + API defensive review
    full-view/         # Product/business/brand bible + FEES.md (canonical fee source)
    monitoring/        # INFRASTRUCTURE_GUIDE.md — env-var + deploy-values reference
    integrations/      # Host-side wiring for analytics + market-editorial workflow
    mvp/               # Spec for diboas-analytics — a SEPARATE product diBoaS hosts at /market
    playbooks/         # Playbook registry (local-only): index of every repeatable
                       #   end-to-end process + home of cross-domain playbooks
                       #   (talk-series creation; social/motion/cinema generators
                       #   stay in docs/socials/ and are pointed to)
    tools/             # Money Tools suite docs + weekly live-data runbook
    researches/        # Dated regulatory + market deep-research reports (reference)
    roadmap/           # Phase-2 forward analysis (aspirational; superseded-flagged — verify vs this file)
```

### App Router Structure

```
apps/web/src/app/
  [locale]/
    (landing)/             # All user-facing pages (single route group)
      about/               # About us — founder story, mission, beliefs
      business/            # B2B landing page
      market/        # Adelaide Market — BTC macro-regime dashboard (live; weekly refresh via the
                     #   apps/web/scripts/market-refresh/ pipeline; host surface for the separate
                     #   diboas-analytics product spec'd in docs/mvp/ — swap-ready via RegimeDataProvider)
      delete-confirm/      # GDPR account deletion confirmation
      demo/                # Interactive financial demo (noindex)
      dream-mode/          # Goal calculator simulation (noindex)
      email-preferences/   # Email unsubscribe preferences
      help/                # Help center — FAQ by topic (6 topics)
      investors/           # Investor vertical — public pitch page (thesis, market, raise)
      learn/               # "Real Talk" — the 7-talk Money Basics series (all live
        [lesson]/          #   2026-07-16; registry-driven at lib/learn/registry.ts:
                           #   3-beat talks + quiz + tool moment; Talk 1 embeds the
                           #   calculator; YouTube facade ships dark until recordings)
      legal/               # Legal pages
        cookies/           # Cookie policy
        privacy/           # Privacy policy
        terms/             # Terms of use
      protocols/           # Protocol transparency page
      security/            # Security information
      share/               # Social sharing redirect (OG metadata)
      strategies/          # Investment strategies
      tools/               # Money Tools — 11-calculator suite. Entry point: money-jobs
                           #   (tool #11, "start" section); then compound-interest, retirement,
                           #   goal-savings, emergency-fund, time-to-target, asset-history,
                           #   inflation-impact, currency-depreciation, card-fees, idle-cash
        money-jobs/        #   Money Jobs — give every part of a monthly amount a job (B2C
                           #   split + B2B runway; email-gated plan; ?for=business opens B2B)
    (investor-room)/       # Password-gated investor room (separate route group; noindex)
      investor-room/       # Room landing + gated document pages (full docs + print-to-PDF; EN + pt-BR native, DE/ES render EN via roomContentLocale)
  api/                     # API routes
    consent/               # Cookie/privacy consent (POST/DELETE)
    cron/                  # Audit-log retention purge (Vercel cron, daily 03:00 UTC)
    email/unsubscribe/     # RFC 8058 email unsubscribe
    health/                # Health check (liveness + readiness)
    investor-request/      # Investor contact request (encrypted store + founder notification)
    monitoring/            # Sentry envelope tunnel (same-origin; bypasses ad-blockers)
    og/                    # Dynamic Open Graph image generation
    waitlist/              # Waitlist (signup, delete, position, referral, stats)
```

### Source Organization (apps/web/src/)

- `components/` - UI components (Factory pattern with variants)
- `config/` - Feature configs, page configs, navigation
- `hooks/` - Custom React hooks
- `lib/` - Utilities, security, services
- `styles/` - Global CSS, design tokens CSS
- `types/` - TypeScript type definitions
- `test/` - Test setup and utilities

## Commands

### Development

```bash
pnpm dev:web          # Start web app dev server
pnpm dev:fresh        # Clean rebuild + dev server
pnpm dev:clean        # Kill port 3000 + restart
pnpm dev:reset        # Clean build cache (.next, .turbo) + restart dev server
```

### Quality

```bash
pnpm type-check       # TypeScript checking (all workspaces)
pnpm lint             # ESLint (all workspaces)
pnpm test             # Vitest (all workspaces)
pnpm build            # Production build (all workspaces)
```

### Validation

```bash
pnpm validate:all              # Full pipeline: type-check -> lint -> test -> build -> budget -> design-tokens -> translations -> market-data -> sdk-invariant -> investor-figures -> seo -> ux-canon
pnpm validate:design-tokens    # Validate design tokens against schema
pnpm validate:translations     # Check translation key parity across locales
pnpm validate:seo              # SEO gate: config bounds/uniqueness, route/OG parity, per-locale seo keys
pnpm check:dead-code           # Dead code detection (knip)
```

### Market data refresh (`/market` — Adelaide Market)

Build-time pipeline; never runs at request time. Editorial writes go out as a
PR, never a direct push (weekly workflow: `.github/workflows/market-refresh-weekly.yml`).

```bash
# full pipeline: fetch -> fail-closed quality gate -> engine -> computed.json (+ run archive)
node apps/web/scripts/market-refresh/run.mjs
node apps/web/scripts/market-refresh/run.mjs --append-btc    # also append the due monthly BTC candle (dual-source verified)
node apps/web/scripts/market-refresh/run.mjs --etf-snapshot  # weekly ETF-01 shares-outstanding snapshot (needs POLYGON_API_KEY)
node apps/web/scripts/market-refresh/generate.mjs            # render editorial JSONs from the template library
node apps/web/scripts/market-refresh/generate.mjs --check    # reconcile committed JSONs vs the generator (CI drift gate)
node apps/web/scripts/market-refresh/tools-monthlies.mjs     # F-M8 leg: append the due month for the 7 non-BTC tools series
node apps/web/scripts/data-fetchers/compute-regime.mjs       # thin CLI over the shared engine (manual score check)
```

### Formatting

```bash
pnpm format                    # Prettier format all files
pnpm format:check              # Check formatting (CI)
```

### Testing (web app)

```bash
pnpm --filter web test:watch   # Watch mode testing
pnpm --filter web test:coverage # Coverage report
```

### Storybook

```bash
pnpm --filter web storybook        # Start Storybook dev server (port 6006)
pnpm --filter web build-storybook  # Build Storybook for deployment
```

### Database

```bash
pnpm --filter web db:migrate      # Run database migrations
pnpm --filter web db:status       # Check migration status
pnpm --filter web investor:read   # Decrypt stored /investors requests to the terminal (founder runbook; needs live DATABASE_URL + ENCRYPTION_KEY in .env.local)
```

### Production

```bash
pnpm --filter web start        # Start production server
```

### Audits

```bash
pnpm audit:full                # 15-point pre-launch audit
pnpm audit:ci                  # CI-friendly audit (non-interactive)
pnpm security:audit            # pnpm audit for vulnerabilities
pnpm performance:audit         # Lighthouse CI
pnpm accessibility:audit       # pa11y WCAG2AA
```

### Analytics

```bash
pnpm analytics:report          # Generate analytics report
```

## Coding Standards

### Component Pattern

Components use a **Factory pattern** with variant directories:

```
ComponentName/
  ComponentNameFactory.tsx    # Variant selector
  ComponentName.stories.tsx   # Storybook stories
  index.ts                    # Barrel export
  variants/
    VariantA/
      VariantA.tsx
      index.ts
```

### Key Conventions

- **Path alias:** `@/*` maps to `apps/web/src/*`
- **Barrel exports:** directories expose an `index.ts` barrel **where consumers use it** — unconsumed barrels are dead code and get deleted (knip Option A, founder 2026-07-11; `pnpm check:dead-code` guards files/deps/binaries)
- **Strict TypeScript:** No implicit any, strict null checks
- **Tailwind CSS:** Utility-first styling, design tokens via CSS custom properties
- **Error boundaries:** Layered (page-level, navigation-level, global)
- **Provider pattern:** Context providers for i18n, locale, analytics

### Security

- All user input sanitized with DOMPurify
- API routes require rate limiting (Upstash Redis)
- PII encrypted with AES-256-GCM
- CSP: Nonce-based CSP generated per-request in `middleware.ts` (`'unsafe-inline'` prohibited for scripts)
- No hardcoded secrets - use environment variables
- CSRF protection on mutation endpoints
- Analytics libraries: lazy-loaded behind consent check via dynamic `import()` (never static import)
- PostHog: never imported at module level; use `import('posthog-js')` after consent

### React Performance Guidelines

Prioritized by real-world impact (ref: Vercel React Best Practices).

#### Apply now (all new code)

- **Defer `await` until needed:** Move `await` inside conditional branches — don't block on fetches that may not be used
- **`Promise.all()` for independent operations:** Never chain sequential `await`s when operations are independent
- **Lazy `useState` initialization:** Use `useState(() => compute())` when initial value requires computation (parsing, filtering, index building)
- **Derived state during render:** Compute values from props/state inline — don't store in state or sync via `useEffect`
- **Functional `setState`:** Use `setState(prev => ...)` when new state depends on previous state
- **Event handlers over effects:** Run user-triggered side effects in event handlers, not in `useEffect`
- **Explicit conditional rendering:** Use ternary `condition ? <X /> : null` instead of `&&` to avoid rendering falsy values like `0`
- **Extract default non-primitive values:** Hoist default objects/functions to module scope (`const NOOP = () => {}`)

#### Apply post-launch (product features)

- **Strategic Suspense boundaries:** Wrap async data sections to show shell UI while loading
- **`next/dynamic` with `ssr: false`:** For heavy client-only components (charts, editors, rich text)
- **Cross-request LRU caching:** For frequently accessed data shared across requests
- **`React.cache()` for per-request dedup:** Wrap repeated DB queries or auth checks within a single request
- **`after()` from `next/server`:** Schedule non-blocking work (logging, analytics, email) after response is sent
- **SWR for client-side data fetching:** Automatic deduplication, caching, and revalidation
- **`content-visibility: auto`:** For long scrollable lists (transaction history, activity feeds)
- **`useRef` for transient values:** Store frequently-changing non-UI values (mouse position, intervals) without re-renders
- **`useTransition` for non-urgent updates:** Mark search filtering, pagination as transitions to keep UI responsive
- **React Compiler:** When adopted, removes need for manual `useMemo`/`memo`

#### Already in place (do not regress)

The full register of locked-in implementation decisions (bundler / Turbopack, prefetch hygiene, color contrast, the currency-hedge math, tools-suite patterns, asset-history FX paths & data provenance, etc.) lives in **`docs/tech/implementation-notes.md`**. Read the matching entry there before changing any of those subsystems.

## i18n

- Reference locale: `en` (source of truth)
- Translations: `packages/i18n/translations/{locale}/`
- **40 namespaced JSON files** per locale — canonical registry is `SUPPORTED_NAMESPACES` in `packages/i18n/src/config.ts` (drift-guarded by `apps/web/src/lib/i18n/__tests__/namespaces.test.ts`); full annotated list in `packages/i18n/README.md`. Covers the landing/about/help/legal pages, the investor vertical (`investor` + `investor-docs`), the demo + dream flows, and the `tools-*` calculator suite.
- Client/server split exports to avoid bundling React on server
- All new user-facing strings must be added to all 4 locales

## Design Tokens

- **Canonical token values:** `apps/web/src/styles/design-tokens.css` — **hand-maintained**. The `generate:design-tokens` generator is intentionally **disabled** (it would overwrite 2500+ lines of hand-tuned CSS — CRIT-1); edit this file directly, never regenerate.
- Schema-validated subset (brand colors, typography, spacing, animation, z-index, breakpoints): `config/design-tokens.json` + `config/design-tokens.schema.json` — validated by `pnpm validate:design-tokens`.
- **Never hardcode colors, spacing, font-sizes, or radii in component CSS** — always reference a token (component CSS is fully tokenized; the only literals are documented exceptions: `em` relative sizing, `-1px` border-collapse, `@media print`).

## Environment Variables

- Documented in `apps/web/.env.example`
- `NEXT_PUBLIC_*` prefix for client-side variables
- Key categories: App URL, Analytics (GA4, Sentry, PostHog), Security (encryption, HMAC, CSRF, CSP), Rate limiting (Upstash Redis), Email (Resend), Database (Neon)
- Full reference: `docs/monitoring/INFRASTRUCTURE_GUIDE.md`

## Monitoring

Stack: Sentry (errors + session replay), PostHog (product analytics, feature flags, surveys), GA4 (traffic), web-vitals. All consent-gated where it matters, all lazy-loaded.

**Detailed playbook:** `docs/tech/MONITORING_OPS.md` — verification procedures, troubleshooting, rotation runbooks, full pitfalls list. The summary below is the one-page operating constraints; when in doubt, read the playbook.

**Architecture:**

- Sentry envelopes route through `/api/monitoring` (same-origin tunnel — bypasses ad-blockers + keeps CSP narrow). Manual handler at `apps/web/src/app/api/monitoring/route.ts` because Turbopack doesn't auto-generate the tunnel route.
- Sentry root instrumentation at `apps/web/src/instrumentation.ts` switches on `NEXT_RUNTIME` to load `sentry.server.config.ts` (nodejs) or `sentry.edge.config.ts` (edge). Browser-side Sentry init at `apps/web/src/instrumentation-client.ts` — replay is OFF by default, added only after `CONSENT_GIVEN` per Lighthouse Workstream B.
- `instrumentation.ts` also exports `onRequestError` — Next.js calls it on RSC/route-handler/middleware errors, which then call `Sentry.captureException`.
- Sentry release fallback `0.1.0` must stay aligned with `apps/web/package.json#version`. Production overrides with the Vercel commit SHA via the build plugin.
- PostHog provider at `apps/web/src/components/Providers/PostHogProvider.tsx` — lazy `import('posthog-js')` inside `useEffect` after `hasAnalyticsConsent()`. Never imported at module level.
- GA4 split into two files (Lighthouse Workstream D): Consent Mode v2 inline bootstrap in `apps/web/src/app/layout.tsx` (pre-hydration), and consent-gated script-loading gate in `apps/web/src/components/Providers/GoogleAnalyticsLoader.tsx` (the `gtag/js` script doesn't download until `applicationEventBus.CONSENT_GIVEN`).

**Critical config invariants (do NOT regress)** — one-line guardrails; full rationale + symptoms in `MONITORING_OPS.md` (§ E unless noted):

- **PostHog `host` = ingest endpoint** (`https://us.i.posthog.com` / `eu.i.posthog.com`), never console URLs — the SDK derives the assets host from it; wrong host silently degrades the SDK.
- **CSP wildcards must be full-label** — use `*.i.posthog.com` in `script-src`, never partial-label `*-assets.i.posthog.com` (invalid per CSP 3, silently dropped). Only reliable check is a browser console grep for `contains an invalid source`.
- **Sentry build secrets in `turbo.json#env`** — `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` (server-side, NOT `NEXT_PUBLIC_*`); missing → Turborepo scrubs them → source-map upload silently skipped.
- **Sentry DSN keys can be silently disabled** — a disabled Client Key 403s and drops 100% of events with no UI warning; verify "Active" before pointing prod at a new DSN (§ E.2; `SECURITY_FINDINGS_2026-05.md` § F16).
- **Tunnel route path is `/api/monitoring`**, not `/monitoring` (locale middleware would redirect the bare path → 404; `/api/*` is excluded from the matcher).
- **PostHog init: pin `defaults: '2025-11-30'`** (latest accepted by `posthog-js` 1.313.0); newer dates trip a TS error until the SDK is upgraded.
- **PostHog init: `person_profiles: 'identified_only'`** (GDPR + ~95% person-quota savings); persons only created on explicit `identify()` with an opaque submission ID, never an email.
- **`dynamic({ ssr: false })` inside `'use client'` is a footgun** on Next 16 + Turbopack (silent hydration failure) — import client components directly (§ E.5; `SECURITY_FINDINGS_2026-05.md` § F20).
- **Sentry `correlationId` rides on `tags`, never `extra`** (E-2) — both doors tag events with `x-request-id` for server↔client correlation; `beforeSend` scrubs `user`/`extra`/`breadcrumbs` but NOT `tags`, so moving it to `extra` or adding `tags` to the scrub list silently breaks correlation. PII must never go on `tags`.

**Verification after monitoring changes:** see `MONITORING_OPS.md` § F (Sentry test event, PostHog network trace, GA4 dataLayer, CSP console grep, release tagging, lesson-page calculator regression check).

## Dependencies Between Packages

- `apps/web` depends on `@diboas/i18n`, `@diboas/ui`, and `@diboas/email`
- `@diboas/i18n` must be built before `apps/web` dev/build (`pnpm dev:fresh` handles this)
- Turborepo handles build ordering via `turbo.json` task dependencies
- **Dependency pinning strategy:** `next` is pinned exact (16.2.12 as of 2026-08-04; both `apps/web/package.json`, `apps/sandbox/package.json`, and root `package.json#pnpm.overrides.next` must stay aligned — AND the `postcss` devDep must match next's internal exact pin, see `docs/tech/implementation-notes.md` § postcss/storybook footgun). Other deps use caret ranges — `pnpm-lock.yaml` (committed) ensures reproducible builds. Do not delete or gitignore the lockfile.

## 12 Principles of Excellence

Condensed reference from `docs/tech/coding-standards.md`:

1. **Domain-Driven Design** — Organize around business domains, clear boundaries, events for cross-domain
2. **Event-Driven Architecture** — All state changes emit events (eventId, type, timestamp, correlationId)
3. **Service Agnostic Abstraction** — Interface-based, swappable providers, factory pattern
4. **Code Reusability & DRY** — Write once, shared packages, no duplication
5. **Semantic Naming** — [Domain][Entity][Action]Service, SCREAMING_SNAKE_CASE constants
6. **File Decoupling** — Single responsibility. Recommended file sizes: Services ~200 lines, Components ~150, Utils ~100. These are guidelines to encourage DRY and reusability, not hard limits. Consistency is the priority — a larger file that stays consistent and respects DRY is better than a forced split that creates duplication or breaks cohesion. Split when it improves clarity; don't split just to meet a line count
7. **Error Handling & Recovery** — Never crash, retry with backoff, circuit breakers, fallbacks
8. **Security & Audit** — Input validation, output encoding, rate limiting, encryption, PII masking
9. **Performance & SEO** — Code splitting, lazy loading, LCP <2.5s, FID <100ms, CLS <0.1
10. **Product KPIs & Analytics** — Track interactions, enrich with context, conversion funnels
11. **Concurrency & Race Conditions** — Locks, optimistic locking, queues, idempotency
12. **Monitoring & Observability** — Tracing, structured logging, health checks, Sentry

## Engineering Gates

Every quality domain (SEO, accessibility, performance, security, robustness) maps to LIVE enforcement — CI job, lint rule, drift-guard test, or mandatory review checklist — in **`docs/tech/engineering-gates.md`** (the registry; UNENFORCED gaps are listed there honestly with dispositions). `pnpm validate:seo` runs in CI and `validate:all`. **Any PR touching effects, timers, listeners, async flows, or error paths cites the applicable R-rows from `docs/tech/robustness-checklist.md` (PASS/N-A per row) in its self-check** — same discipline as the anti-slop Part-3 rows for UX.

## Race Condition & Async Patterns

- Every `useEffect` with timers → store IDs, clear in cleanup
- Every `useEffect` with async → use `mounted` flag or `AbortController`
- Every `addEventListener` → corresponding `removeEventListener` in cleanup
- Use refs (not state) for values that should not trigger re-renders
- Service classes with global listeners → store bound references, remove in `destroy()`
- Never include state-setter output in same effect's dependency array if the effect sets that state

## Accessibility Standards

- WCAG 2.1 AA minimum compliance
- All interactive elements: native `<button>` or `<a>` (never `div role="button"`)
- All modals/dialogs: use `useFocusTrap` hook with `returnFocus: true`
- Minimum contrast: 4.5:1 for text, 3:1 for UI components — use `text-gray-500` minimum
- Touch targets ≥24×24 CSS px with spacing (WCAG 2.5.8) — includes range sliders (the input element is the target, not the track) and adjacent form controls. NOT covered by the pa11y WCAG2AA gate — review-time check (PSI 2026-07-17 lesson)
- Heading levels never skip (h1→h2→h3) — axe rates this best-practice tier, so pa11y won't catch it either; review-time check (PSI 2026-07-17 lesson)
- Form groups: `<fieldset>` + `<legend>` for screen readers
- Dropdowns: handle Escape key, return focus to trigger
- Reduced motion: all animations must respect `prefers-reduced-motion`
- Skip navigation link required on all page layouts

## Error Handling Patterns

- Error boundaries: 4 layers — Root (`global-error.tsx`) > App (`error.tsx`) > Locale (`[locale]/error.tsx`) > Route group (`(landing)/error.tsx`) + per-section (`SectionErrorBoundary`)
- Loading states: `loading.tsx` in every route group for Suspense
- API calls: use `fetchWithRetry` for user-facing operations (2 retries, exponential backoff)
- Third-party scripts: always dynamic `import()` with fallback (never static import for analytics)
- Global error handlers: single coordinator pattern — MonitoringService registers, delegates to ErrorReportingService

## Testing Requirements

- 80% coverage minimum for `lib/`, `hooks/`
- 60% coverage minimum for components
- 100% for security utilities
- Naming: `should [expected behavior] when [condition]`
- Required: hooks with async behavior, error handlers, security utilities, API routes
- Tools: Vitest + @testing-library/react
- Environment: node (default); add jsdom as dev dependency for DOM-based component tests
- **`apps/sandbox` has no DOM test environment yet** — it lacks `@vitejs/plugin-react`, and its vitest
  `include` glob (`src/**/__tests__/**/*.test.ts`) excludes `.tsx`, so a render test there is **silently
  skipped rather than run**. Wire the harness (plugin + `happy-dom`/`jsdom` + `@testing-library/react` +
  `globals` + a sandbox-specific `setupFiles`; `apps/web/src/test/setup.ts` is web-specific and does not
  copy) before adding component tests there, and assert a deliberately-failing render test FAILS.

## Audit Status

**Current phase:** Pre-launch marketing site (live since 2026-03-11) — waitlist, interactive demo, goal calculator, the 11-tool Money Tools suite, the 7-talk Learn/"Real Talk" program, the investor vertical, and `/market` (Adelaide Market, weekly auto-refresh). 12/12 principles-of-excellence compliant. **~1,334 web tests passing.** `apps/sandbox/` + `packages/banking|defi|investing` are a **gated, noindex, pre-launch work-front** (B2C+B2B play-money practice app — now a **permanent practice mode** beside the future real-money app). Status 2026-07-29: P1.2 ledger-persistence slices built; **architecture ruling-complete + feasibility-researched** (kill-board green; stack = Turnkey + Transak + Jupiter/CCTP V2; every decision FC-1…FC-15 ruled — the map `docs/sandbox-app/SANDBOX_ARCHITECTURE_AND_FLOWS.md` is the reference). Next: the internal build track continues per the work-front plans (`docs/sandbox-app/`, local-only) alongside provider validation.

**Do-not-regress (compliance-critical):** the 3 sandbox covenants — the US GENIUS "stablecoin never adjacent to earn/yield" wall (guard: `apps/web/src/lib/i18n/__tests__/genius-stablecoin-wall.test.ts`), BR-top-up no-incentive, and the CN/RU/KP geofence. Every other locked-in decision (bundler, prefetch, brand assets, market pipeline, Learn platform, currency-hedge math, etc.) lives as an annotated entry in `docs/tech/implementation-notes.md` — read the matching entry there before touching those subsystems.

**Open (small) — full forward queue in `docs/audit/PENDING_ALL.md`:**

- **BotID Stage 2 enforcement** — pending observation review, then the Stage 3 decision.
- diboas-analytics.com German — ✅ RULED 2026-07-30: **du** (the register ruling's mechanical consequence — analytics is neither legal nor investor). Execution = a queued register pass, `[NATIVE PASS REQUIRED]`; Sie stays ONLY on legal ×3 + the investor vertical (do-not-regress).
- DMARC (5.34) re-eval — scheduled.

**Where the detail lives** (all local-only / `.gitignore`'d — a fresh clone won't have them; docs policy = delete-after-execution, see § Visual Development retention note):

- Load-bearing implementation decisions + do-not-regress register → **`docs/tech/implementation-notes.md`** (committed)
- Full audit narrative + test-count progression → `docs/audit/AUDIT_HISTORY.md`
- Live security findings ledger → `docs/audit/SECURITY_FINDINGS_2026-05.md`
- Forward-looking pending queue → `docs/audit/PENDING_ALL.md`
- Dated session-by-session audit log (through 2026-07-22; moved out of this file 2026-07-27) → `docs/audit/AUDIT_STATUS_LOG_ARCHIVE.md`

## Visual Development — Human-First Design Workflow

### Design document precedence

When working on any frontend UI, use design tokens as the source of truth:

- `apps/web/src/styles/design-tokens.css` — canonical token values for colors, spacing, typography
- Anti-slop defaults below — canonical anti-pattern list and review criteria

### Anti-slop defaults

Avoid these patterns in all frontend work unless brand rules explicitly allow them:

- Default purple/blue startup gradients or shiny AI orbs
- Gradient profile circles with initials as decoration
- Pure black (#000) or pure white (#FFF) — use palette-derived neutrals
- Repeated KPI strips showing the same data in multiple places
- Card soup — too many cards with equal visual weight and no hierarchy
- Mixed icon families or inconsistent icon weights
- Emoji used as core UI icons
- Empty charts or decorative analytics that communicate nothing real
- Too much border-radius on everything with no variation
- Hierarchy created only by colored boxes instead of typography + spacing
- Generic SaaS layout templates repeated across screens
- Fake metrics, fake workflows, fake pricing, or hallucinated features
- Lorem ipsum or "Acme Inc" placeholder copy in any deliverable
- Legacy fee figures (0.75%, 0.12%, 0.09%, subscription tiers) — current fees in `docs/full-view/FEES.md`

### Quick visual check (after every frontend change)

**IMMEDIATELY** after implementing any front-end change:

1. Start the dev server (`pnpm dev:web`) and wait for it to be ready
2. Install the browser if needed (`mcp__MCP_DOCKER__browser_install`)
3. Get the machine's network IP (`ifconfig en0 | grep "inet "`) — Docker MCP browser cannot reach `localhost`, use `http://<NETWORK_IP>:3000` instead
4. Navigate to affected pages using `mcp__MCP_DOCKER__browser_navigate`
5. Use `mcp__MCP_DOCKER__browser_snapshot` to discover all sections on the page
6. **Screenshot EACH section individually** by element ref — not just one viewport-level screenshot (spacing and sizing issues are invisible at full-page zoom)
7. Resize viewport with `mcp__MCP_DOCKER__browser_resize` — test at desktop (1440×900) and mobile (375×812)
8. For interactive components (wizards, carousels, accordions): **click through ALL steps/states** and screenshot each — do not only check the initial view
9. Check console for errors using `mcp__MCP_DOCKER__browser_console_messages`
10. For each section, verify: spacing consistency, button sizing harmony within button groups, icon usage (no emoji as UI icons), content density
11. Test German locale at mobile viewport (375px) — screenshot each section for text overflow and verify no hardcoded English strings leak through
12. Fix visual and interaction issues before declaring done

**Important:** The Playwright browser runs inside Docker MCP, not on the host machine. Always use the network IP (e.g., `http://192.168.x.x:3000`), never `localhost` or `127.0.0.1`.

If Docker MCP browser tools are NOT available: explicitly say "I could not visually verify this — browser tooling is not available." Never imply visual verification was performed when it was not.

### Comprehensive design review

Invoke `@agent design-reviewer` for thorough design validation when:

- Completing significant UI/UX features
- Before finalizing PRs with visual changes
- Needing comprehensive accessibility and responsiveness testing
- Running `/mydesign review` or `/review-ui`

### Slash commands available

- `/mydesign` — unified design workflow (build, review, audit, explore, tweak)
- `/build-ui` — focused build workflow with interactive context gathering
- `/review-ui` — focused review workflow against anti-slop checklist

### Build rules for UI work

- Always use existing design tokens from `apps/web/src/styles/design-tokens.css` — never hardcode colors, spacing, or font sizes
- Always use the project's `LucideIcon` component (`@/components/UI/LucideIcon`) — never import `lucide-react` directly or other external icon libraries
- Never invent product claims, fee figures, or capabilities — use only confirmed data from existing translations and configs
- All new user-facing strings must be added to all 4 locales (en, pt-BR, es, de)
- German text is ~30% longer than English — verify components handle text expansion
- Regulatory disclaimers (MiCA for EU, CVM 3-warning for BR, FTC for US) have required text per locale — check translation files
- Use Factory pattern with variants for all new components
- Motion must respect `prefers-reduced-motion` (already in Accessibility Standards above)
- **Pre-PR friction/dark-pattern self-check (mandatory):** any PR touching user-facing copy, flows, forms, or selectors runs `docs/tech/ux-governance/anti-slop-checklist.md` Part 3 (rows 1–26) and cites the results (PASS/FAIL per row, with UX-NN principle IDs from `docs/tech/ux-governance/UX_PRINCIPLES_CANON.md`) in the PR description — **a FAIL on rows 10–17 (the canonical veto list) blocks merge, regardless of measured lift.** Structural drift in the governance files themselves is caught by `pnpm validate:ux-canon` (part of `validate:all`).
- **Pre-PR voice self-check (mandatory for copy):** any PR touching user-facing copy also scores the surface against `docs/tech/ux-governance/VOICE_RUBRIC.md` (Q1 Draper feeling / Q2 Adelaide tone / Q3 the three nevers — never selling, promising, or advising / Q4 the want) and cites the scores. A **Q3 FAIL blocks merge** like a veto row (a promise or advice about money is a truth-and-regulatory breach, not a style note); non-English surfaces are scored in their own locale register, with anything unconfirmable natively tagged `[NATIVE PASS REQUIRED]`.
- **UX governance operating protocol** (build mode / audit mode / role table / finding format): `docs/tech/ux-governance/UX_GOVERNANCE_USAGE.md`. The six governance files — **four enforcement** (`anti-slop-checklist.md`, `UX_PRINCIPLES_CANON.md`, `UX_GOVERNANCE_USAGE.md`, `VOICE_RUBRIC.md`), **one asset gate** (`asset-compliance-checklist.md`), and **one advisory-craft companion** (`STORYTELLING_CRAFT.md`, advisory never a blocker) — live in `docs/tech/ux-governance/` and are **git-tracked** (G-1 revisited and accepted via relocation, founder 2026-07-10) — the ux-canon validator runs for real in CI. `asset-compliance-checklist.md` (added 2026-07-13) is the pass/fail gate for **generated marketing images and video frames** (logo/palette/character/fabricated-figure checks). `STORYTELLING_CRAFT.md` (added 2026-07-13) is the **positive storytelling/content-craft companion** to the Voice Rubric — the frameworks to use (story spine, But/Therefore, honest hooks, show-don't-name emotion, series/format), plus a cross-reference of the growth tactics diBoaS rejects back to the veto rows; it was mined from the reference transcripts in `docs/socials/storytelling/`. **Docs retention policy (founder-ruled 2026-08-04, supersedes archive-never-delete): delete-after-execution.** Executed or superseded docs are DELETED once their substance is recorded in a living doc — no `_archive/` folders, and living docs must not reference deleted material. Deletion of anything is **founder-only**: Claude's cleanup routines never delete files in `docs/audit/`, `docs/ui-ux/`, the Writing System, or `docs/socials/avatar/` — they propose deletions to the founder instead. `docs/socials/avatar/` (BAR persona doc + reference images + voice samples, G-1 founder ruling 2026-07-19) is **local-only** (gitignored, no git history) yet the **source-of-truth character input to the asset-compliance gate** — losing it is unrecoverable, so it must never be part of any cleanup; true durability still needs an off-repo copy.
