# CLAUDE.md - diBoaS Platform

## Overview

diBoaS is a goal-driven wealth-building platform. The web app is a marketing and onboarding
site (waitlist, demo, goal calculator); the Practice app is a live play-money product. **No
production financial features are live.**

⚑ **Positioning is Brand's, not this file's.** The runtime still renders the legacy
side-pocket line; the ratified direction is Brand master v1.0.3. Resolve current positioning
through `AUTH-1` and `docs/full-view/BRAND_POSITIONING.md` — **do not author new surfaces from
the legacy line.**

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

**Stack rationale + when to reconsider it** (TS/Node app · Python quant · bought custody/ramp; the Rust/Go/Elixir triggers): `docs/tech/architecture-decisions.md` → **ADR-001**. Load-bearing architecture choices live there as revisitable ADRs.

## Architecture

```
diboas-platform/
  apps/web/            # Next.js web application (the live marketing/waitlist site)
  apps/sandbox/        # The diBoaS app: **Practice** mode live (play money); Real Money mode = parity build
                       #   behind a strict internal flag, never public until Legal moves the ring (domain: docs/domains/practice/).
                       #   ⚑ NAMING (F-R4, 2026-08-29): the PUBLIC/user-facing name is **Practice**;
                       #   "sandbox" is internal/dev vocabulary only (paths, package names, this file).
                       #   The label must keep communicating no-real-value (Legal). The in-app copy
                       #   sweep (~10 user-facing strings ×4 locales) is complete and guarded by COPY-3. —
                       #   real data/integrations except custody; LIVE + PUBLIC at app.diboas.com,
                       #   noindex (2026-08-22). Committed on main;
                       #   architecture ruling-complete (see docs/domains/practice/ARCHITECTURE.md).
  packages/email/      # @diboas/email - Email service (Resend)
  packages/i18n/       # @diboas/i18n - Internationalization
  packages/ui/         # @diboas/ui - Design system components
  packages/banking/    # @diboas/banking - event-sourced play ledger + Decimal.js fee math (backs apps/sandbox)
  packages/defi/       # @diboas/defi - strategy catalog-as-data + DeFiLlama/CoinGecko/gas providers (backs apps/sandbox)
  packages/investing/  # @diboas/investing - jobs split, goals, accrual replay (backs apps/sandbox)
  config/              # Design tokens JSON + schema
  scripts/             # Build/validation scripts
  docs/                # Documentation: only docs/tech/, docs/integrations/, docs/testing/ live here (tracked).
                       #   Every other area lives in the PRIVATE repo diboas-docs, checked out beside
                       #   this one: read `docs/<area>/X` as `../diboas-docs/<area>/X` (same names).
    sandbox-app/       # REGISTER_INDEX.md — the register's ID namespaces
    domains/           # Rules per domain (practice, learn, market, product, tools, …)
    decisions/         # Decision records, one per ruling (index: decisions/README.md)
    lanes/             # Per-lane handoffs (webapp, market)
    tech/              # Technical guides (committed) — canonical engineering reference
      ux-governance/   #   UX enforcement layer (committed): anti-slop checklist, principles canon, usage protocol
    audit/             # Audit history, security findings ledger, pending-work queue
    security/          # Recon/diagnostics reference + API defensive review
    full-view/         # Product/business/brand bible + FEES.md (canonical fee source)
    monitoring/        # INFRASTRUCTURE_GUIDE.md — env-var + deploy-values reference
    integrations/      # Host-side wiring for analytics + market-editorial workflow
    playbooks/         # Playbook registry: index of every repeatable end-to-end process
                       #   + home of cross-domain playbooks (talk-series creation)
    tools/             # Money Tools suite docs + weekly live-data runbook
```

### App Router Structure

```
apps/web/src/app/
  [locale]/
    (landing)/             # All user-facing pages (single route group)
      about/               # About us — founder story, mission, beliefs
      business/            # B2B landing page
      market/        # Adelaide Market — Market Macro multi-view family (M3, 2026-08-13):
        [view]/      #   /market = umbrella; /market/bitcoin (scored view); /market/backdrop
                     #   (state view over the same weekly run). Weekly refresh via the
                     #   apps/web/scripts/market-refresh/ pipeline; host surface for the separate
                     #   diboas-analytics product spec'd in docs/mvp/ — the swap seam is the six
                     #   fetchers in lib/analytics-sdk/mock-client.server.ts (per-view loaders)
      delete-confirm/      # GDPR account deletion confirmation
      demo/                # Interactive financial demo (noindex)
      dream-mode/          # Goal calculator simulation (noindex)
      email-preferences/   # Email unsubscribe preferences
      help/                # Help center — FAQ by topic (6 topics)
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
  api/                     # API routes
    consent/               # Cookie/privacy consent (POST/DELETE)
    cron/                  # Audit-log retention purge (Vercel cron, daily 03:00 UTC)
    email/unsubscribe/     # RFC 8058 email unsubscribe
    health/                # Health check (liveness + readiness)
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
pnpm validate:all              # Full pipeline: type-check -> lint -> test -> build -> budget -> design-tokens -> translations -> market-data -> sdk-invariant -> seo -> ux-canon
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
node apps/web/scripts/market-refresh/run.mjs --etf-snapshot  # ONLY the weekly ETF-01 shares-outstanding snapshot (needs POLYGON_API_KEY); no core run; refused with --append-btc
node apps/web/scripts/market-refresh/generate.mjs            # render editorial JSONs from the template library + auto-write the data_status panel (B3 2026-08-11; overrides need a _cycle stamp)
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
pnpm --filter sandbox db:migrate  # Same for the Practice app's own database
```

The migration files are **private**: they live only in `../diboas-docs/ops/db-migrations/{web,sandbox}/`, never in
this repository, and the runners stop when that folder is missing. Add one through a PR there (`ops/README.md`).

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
- CSP: Nonce-based CSP generated per-request in `middleware.ts` (`'unsafe-inline'` prohibited for scripts) — live in **both** apps: `apps/web` since the F4 security batch, `apps/sandbox` since 2026-09-14 (register `5.212`; the sandbox shipped no CSP at all until then, which is what `5.212` recorded). The sandbox policy is deliberately TIGHTER (`connect-src`/`font-src` are `'self'`, no analytics hosts) and deliberately omits `upgrade-insecure-requests`, which breaks any HTTP origin; `docs/tech/engineering-gates.md` → `CSP-1`
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
- **40 namespaced JSON files** per locale — canonical registry is `SUPPORTED_NAMESPACES` in `packages/i18n/src/config.ts` (drift-guarded by `apps/web/src/lib/i18n/__tests__/namespaces.test.ts`); full annotated list in `packages/i18n/README.md`. Covers the landing/about/help/legal pages, the demo + dream flows, the `tools-*` calculator suite, and the market view namespaces (`market` shared + `market-bitcoin` + `market-backdrop`, M3 2026-08-13).
- Client/server split exports to avoid bundling React on server
- All new user-facing strings must be added to all 4 locales

## Design Tokens

- **Canonical token values:** `apps/web/src/styles/design-tokens.css` — **hand-maintained**. The `generate:design-tokens` generator is intentionally **disabled** (it would overwrite 2500+ lines of hand-tuned CSS — CRIT-1); edit this file directly, never regenerate.
- **`apps/sandbox` owns its own foundations:** `apps/sandbox/src/styles/tokens.css` — the six-theme semantic layer (`neutral`/`practice`/`real` × light/dark, built as palette → mode ramp → roles) guarded by `apps/sandbox/src/styles/__tests__/tokenArchitecture.test.ts`. It no longer copies the web file above (I-1d, register `5.215`); sandbox component CSS references roles only, never palette values or literals.
- Schema-validated subset (brand colors, typography, spacing, animation, z-index, breakpoints): `config/design-tokens.json` + `config/design-tokens.schema.json` — validated by `pnpm validate:design-tokens`.
- **Never hardcode colors, spacing, font-sizes, or radii in component CSS** — always reference a token (component CSS is fully tokenized; the only literals are documented exceptions: `em` relative sizing, `-1px` border-collapse, `@media print`).

## Environment Variables

- Documented in `apps/web/.env.example`
- `NEXT_PUBLIC_*` prefix for client-side variables
- Key categories: App URL, Analytics (GA4, Sentry, PostHog), Security (encryption, HMAC, CSRF, CSP), Rate limiting (Upstash Redis), Email (Resend), Database (Neon)
- Full reference: `docs/monitoring/INFRASTRUCTURE_GUIDE.md`

## Monitoring

Sentry (errors + replay) · PostHog (product) · GA4 (traffic) · web-vitals. All consent-gated
where it matters, all lazy-loaded, all in `apps/web`.

**The operating playbook, every config invariant, and the verification and rotation runbooks
live in `docs/tech/MONITORING_OPS.md`. Read it before changing anything in this stack** — its
invariants exist because each one has already failed silently here once.

Two that bite immediately: **analytics libraries are never imported at module level** (dynamic
`import()` after consent), and **Sentry build secrets must be listed in `turbo.json#env`** or
Turborepo scrubs them and source-map upload is skipped with no error.

⚑ `apps/sandbox` has **no external error sink** — it reports through one local seam
(`lib/monitoring/reportError.ts`). Attaching a third-party processor is a Legal decision
(`ownerKey` handling), not an engineering default.

## Dependencies Between Packages

- `apps/web` depends on `@diboas/i18n`, `@diboas/ui`, and `@diboas/email`
- `@diboas/i18n` must be built before `apps/web` dev/build (`pnpm dev:fresh` handles this)
- Turborepo handles build ordering via `turbo.json` task dependencies
- **Dependency pinning strategy:** `next` is pinned exact (16.4.3 as of 2026-10-27 — bumped from 16.3.8 for two critical RCEs, GHSA-673q-mjm6-r5xr and GHSA-2464-fhr4-w9xw, and the Server Actions DoS GHSA-p3m5-59mp-jv5r; before that 16.3.8 for `next/og` GHSA-vcvr-r3jv-pc5j, PENDING_ALL 5.477; both `apps/web/package.json`, `apps/sandbox/package.json`, and root `package.json#pnpm.overrides.next` must stay aligned — AND the `postcss` devDep must match next's internal exact pin, see `docs/tech/implementation-notes.md` § postcss/storybook footgun). Other deps use caret ranges — `pnpm-lock.yaml` (committed) ensures reproducible builds. Do not delete or gitignore the lockfile.

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

Every quality domain maps to LIVE enforcement — CI job, lint rule, drift-guard test, or a
mandatory review row — in **`docs/tech/engineering-gates.md`**. That registry is the status
authority for every gate, and it lists UNENFORCED gaps honestly with dispositions. A gate is
never "live" until it is **built AND sabotage-proven in both directions**.

**"Review" has exactly two definitions, both git-tracked:**

- `docs/tech/increment-review-gate.md` — ONE change.
- `docs/tech/system-review-gate.md` — a BATCH (the seven fronts; the data lifecycle checked at
  its seams; cross-increment coherence).

Both require that **every PASS pastes its instrument** and that **`N/A` is proven, not
asserted**, and both end in a stated NOT-CHECKED list with owners.

**`AUTH-1` · CANON-FIRST AUTHORITY RESOLUTION is the first mechanical row of both.**
Before any authority question is raised, search the authority corpus: `pnpm review:auth`
(or `review:canon-index` / `review:citations` / `review:escalations`). It proves the corpus is
reachable, names what is `CITED · NOT REACHABLE` so a missing file never reads as _"no
authority exists"_, checks that every `file:line` citation still resolves, and fails any record
that escalates without a completed `CANON-FIRST SEARCH = COMPLETED` block.

⚑ **Authority packages are SEARCHED as authority and NEVER scanned as repository claims.**

**Any PR touching effects, timers, listeners, async flows or error paths cites the applicable
R-rows from `docs/tech/robustness-checklist.md` (PASS / N-A per row) in its self-check.**

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
- **Every defect leaves a guard:** a confirmed bug, regression or side effect closes only with an
  automated guard that fails if it comes back, plus a recorded search for the same mistake elsewhere —
  `docs/tech/coding-standards.md` § Every defect leaves a guard; checked by `pnpm review:guards`
- Tools: Vitest + @testing-library/react
- Environment: node (default); add jsdom as dev dependency for DOM-based component tests
- **`apps/sandbox` DOM test harness: ✅ BUILT (2026-08-08, R1 Phase 0)** — `@vitejs/plugin-react` +
  `happy-dom` + `@testing-library/react`, `globals: true`, `.tsx` in the include glob, sandbox-specific
  `setupFiles` (`apps/sandbox/src/test/setup.ts`). Default env stays `node`; component tests annotate
  `// @vitest-environment happy-dom` per file (the web app's split). The harness was proven by a
  deliberately-failing render test that FAILED before being corrected (`BottomSheet.test.tsx`).
- **`apps/sandbox` browser harness** (Q0, gate `HARNESS-1`): `pnpm --filter sandbox e2e` against a
  sandbox production build — multi-tab in one context, a real CDP tab freeze (**only** via the
  `freezable` fixture; Playwright's own pages cannot be frozen), and a build swap on one origin.
  Rules: `docs/tech/implementation-notes.md` § Sandbox browser harness.

## Current state

**Live since 2026-03-11.** Two products, one repository:

- **`apps/web` → `diboas.com`** — pre-launch marketing site: waitlist, demo, goal calculator,
  the 11-tool Money Tools suite, the 7-talk Learn program, and `/market` (Adelaide Market, weekly auto-refresh).
- **`apps/sandbox` → `app.diboas.com`** — the **Practice** app. 🚀 LIVE + PUBLIC since
  2026-08-22, **play money only**, `noindex`, geofence armed. Real Money mode is a parity
  build behind a strict internal flag — **`I-8` / Real is NOT AUTHORIZED**.

**Current phase:** Pre-I2 closure. **`I-2` has NOT started and does not start automatically.**

**Market lane** (`/market` and its weekly refresh): its open work is the market entries in
`docs/audit/PENDING_ALL.md`, whose header names the current market session handover.

⚑ **Private docs live in the private repo `diboas-docs`, checked out beside this one** (since
2026-10-30). Every `docs/<area>/…` path below and in records, except `docs/tech/`,
`docs/integrations/` and `docs/testing/`, is read at `../diboas-docs/<area>/…`. The gates resolve
it themselves (`scripts/lib/docs-root.mjs`, override with `DIBOAS_DOCS_DIR`). **Update both checkouts on
`main` before reading anything** (`git -C ../diboas-docs switch main && git -C ../diboas-docs pull --ff-only`,
and the same here): a stale checkout, or one left on a branch, reads an old register. Edit private docs
there, through a branch and PR. Media live in the private repo `diboas-media`. Start every session at `BRAIN.md`, the first page of `diboas-docs`; `AGENTS.md` here holds
the rules for every agent.

⚑ **Do not read a status out of prose — including this file.** Determine current work by the
procedure in `docs/tech/documentation-lifecycle.md` §4:

```text
current work     docs/audit/PENDING_ALL.md         + its machine-readable status index
current gates    docs/tech/engineering-gates.md    + its gate status index
current canon    pnpm review:auth  ·  `docs/full-view/canon/README.md` (local-only)
ID namespaces    docs/sandbox-app/REGISTER_INDEX.md
repository state git — never prose
```

**Test counts are measured, never carried.** Five per-package runs (`web`, `sandbox`,
`banking`, `investing`, `defi` — the only workspaces with a real test script); re-measure
immediately before publishing a figure. `pnpm review:counts` checks that what is published
agrees with itself.

**History** — per-lane implementation narrative, dated status entries and the count
progression — lives in `docs/audit/AUDIT_HISTORY.md`. It is evidence, not authority.

## Do-not-regress — the three sandbox covenants

**Compliance-critical. Never relax a guard, test or control below.**

| Covenant                                                                       | Guard                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **US GENIUS** — a payment stablecoin is NEVER described as earning or yielding | `apps/web/src/lib/i18n/__tests__/genius-stablecoin-wall.test.ts`                                       |
| **Brazil** — no funding incentive, in mechanism or copy                        | `CI-N2` · `apps/sandbox/src/__tests__/ciN2NoFundingIncentive.test.ts`                                  |
| **Geofence** — CN/RU/KP, exact set, edge-enforced                              | `apps/sandbox/src/config/geofence.ts` (read `implementation-notes.md` § Canon intake 2026-09-07 first) |

Legal reviewed these on 2026-08-29 and **the guards, tests and controls are UNCHANGED — do not
relax any of them.** Each covenant's precise legal classification is Legal's, not this file's:
resolve it through `AUTH-1` (`LC-RR-01`, in the canon corpus) before writing any compliance
copy or claim.

Every other locked-in decision lives as an annotated entry in
**`docs/tech/implementation-notes.md`** — read the matching entry before touching those
subsystems.

## STOP conditions

Stop and report rather than proceed when:

```text
authority is missing, unreachable or contradictory   (a missing document is NOT permission
                                                      to infer the rule)
the work needs a NEW vendor, account, API key or provider terms
the work would create Product, Legal, Brand, Growth, M&E or Token authority
a domain policy question has no ruling in canon
I-2 · I-8 / Real                                      NOT AUTHORIZED
```

**Git (founder ruling 2026-10-28):** standing go for every task to branch, commit, push and open a
PR. **The merge is always the founder's.** After verifying a founder merge, Claude may delete and
clean up what that merge made obsolete. Sabotage restores still use a saved file copy verified by
`sha256`, never `git checkout`.

## Visual Development — human-first design workflow

**Design tokens are the source of truth.** `apps/web/src/styles/design-tokens.css` (web,
hand-maintained — the generator is deliberately disabled) and
`apps/sandbox/src/styles/tokens.css` (the six-theme semantic layer). **Never hardcode a
colour, spacing, font-size or radius** — reference a role token.

### Anti-slop defaults

No default purple/blue gradients or AI orbs · no gradient initial-circles · no pure `#000`/
`#FFF` · no repeated KPI strips · no card soup · no mixed icon families · **no emoji as UI
icons** · no empty/decorative charts · no uniform border-radius · no hierarchy by coloured box
alone · no generic SaaS templates · **no fake metrics, pricing or hallucinated features** · no
lorem ipsum · **no legacy fee figures** (current fees: `docs/full-view/FEES.md`).

### Visual check — after every front-end change

1. Start the dev server and get the network IP (`ifconfig en0 | grep "inet "`). **The Docker
   MCP browser cannot reach `localhost`** — use `http://<NETWORK_IP>:<port>`.
2. `browser_navigate` → `browser_snapshot` to discover sections.
3. **Screenshot each section individually** — a full-page shot hides spacing and sizing bugs.
4. Resize: desktop 1440×900 **and** mobile 375×812.
5. Click through **every** step/state of interactive components.
6. `browser_console_messages` — check for errors.
7. **Test German at 375px** — German runs ~30% longer; check overflow and that no hardcoded
   English leaks through.
8. Fix what you find before declaring done.

⚑ **If Docker MCP is unavailable, say so explicitly: _"I could not visually verify this."_
Never imply a visual pass happened when it did not.** A dev-mode screenshot of an error
surface proves nothing — Next renders its own overlay; use a production build.

### Build rules for UI work

Existing tokens only · the project's `LucideIcon` component (never `lucide-react` directly) ·
**never invent product claims, fee figures or capabilities** · every new user-facing string in
**all four locales** · Factory pattern with variants · motion respects
`prefers-reduced-motion` · regulatory disclaimers per locale.

**Mandatory pre-PR self-checks**, cited in the PR description:

- **Friction / dark-pattern** — `docs/tech/ux-governance/anti-slop-checklist.md` Part 3 (rows
  1–26), PASS/FAIL per row with UX-NN ids. **A FAIL on rows 10–17 (the veto list) blocks
  merge, regardless of measured lift.**
- **Voice** (any copy change) — `docs/tech/ux-governance/VOICE_RUBRIC.md` Q1–Q4. **A Q3 FAIL
  blocks merge** — never selling, promising, or advising about money. Non-English surfaces are
  scored in their own register; anything unconfirmable natively is tagged
  `[NATIVE PASS REQUIRED]`.

The governance layer (enforcement files, the asset gate, the storytelling companion) lives in
`docs/tech/ux-governance/`; `pnpm validate:ux-canon` guards its structure in CI.

## Documentation

**`CLAUDE.md` is session bootstrap — not an audit archive, decision log or document index.**
What belongs here, what does not, how a durable rule is promoted to its living owner, how
execution records are compacted at lane closure, and **how to resolve current authority** are
all defined in **`docs/tech/documentation-lifecycle.md`**. Read its §4 before assuming where
an authority lives.

```text
NO DURABLE RULE MAY EXIST ONLY IN A DISPOSABLE AUDIT ARTIFACT
NO HISTORICAL AUDIT ARTIFACT BECOMES CURRENT AUTHORITY BY EXISTENCE
```

**Deleting or cleaning up a document is delegated to Claude and is carried out only after Claude has verified the founder's merge of the change that made it obsolete (founder ruling 2026-10-28).**
