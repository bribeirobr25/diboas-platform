# CLAUDE.md - diBoaS Platform

## Overview

diBoaS is a goal-driven wealth building platform — your side-pocket for wealth creation powered by the digital dollar. Currently **live in pre-launch/waitlist** phase at [diboas.com](https://diboas.com). The web app is a marketing and onboarding site with waitlist, interactive demo, and goal calculator — no production financial features are live yet.

**Current phase:** Pre-launch marketing site with waitlist functionality. Live since March 11, 2026. Domain packages, application services, and full DDD are Phase 2+ requirements.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **UI:** React 18, Tailwind CSS 3
- **Monorepo:** Turborepo + pnpm 8.15 workspaces
- **i18n:** react-intl (4 locales: en, pt-BR, es, de)
- **Testing:** Vitest, @vitest/coverage-v8, Lighthouse CI, pa11y
- **Monitoring:** Sentry (error tracking + session replay), PostHog (product analytics), GA4 (traffic analytics), web-vitals
- **Security:** DOMPurify, Upstash Redis rate limiting, AES-256-GCM encryption, HMAC blind indexing
- **Email:** Resend (transactional email with circuit breaker)
- **Database:** Neon PostgreSQL (serverless)
- **Component dev:** Storybook 10

## Architecture

```
diboas-platform/
  apps/web/            # Next.js web application (only app)
  packages/email/      # @diboas/email - Email service (Resend)
  packages/i18n/       # @diboas/i18n - Internationalization
  packages/ui/         # @diboas/ui - Design system components
  packages/banking/    # @diboas/banking - Banking domain (Phase 2+ stub)
  packages/defi/       # @diboas/defi - DeFi strategies (Phase 2+ stub)
  packages/investing/  # @diboas/investing - Investment domain (Phase 2+ stub)
  config/              # Design tokens JSON + schema
  scripts/             # Build/validation scripts
  docs/                # Project documentation (only docs/tech/ is git-tracked)
    tech/              # Technical guides (committed)
    audit/             # Audit tracking (local-only)
    monitoring/        # Infrastructure & monitoring guide (local-only)
    full-view/         # Product & business docs (local-only)
    post-launch/       # Post-launch planning (local-only)
    revenue/           # Fee modeling reference (local-only)
    roadmap/           # Phase 2+ architecture planning (local-only)
    skills-commands/   # Framework & kit playbooks (local-only)
    video-storyboards/ # Marketing video prompts (local-only)
```

### App Router Structure

```
apps/web/src/app/
  [locale]/
    (landing)/             # All user-facing pages (single route group)
      about/               # About us — founder story, mission, beliefs
      business/            # B2B landing page
      market/        # Adelaide Daily — market updates (placeholder)
      delete-confirm/      # GDPR account deletion confirmation
      demo/                # Interactive financial demo (noindex)
      dream-mode/          # Goal calculator simulation (noindex)
      email-preferences/   # Email unsubscribe preferences
      help/                # Help center — FAQ by topic (6 topics)
      legal/               # Legal pages
        cookies/           # Cookie policy
        privacy/           # Privacy policy
        terms/             # Terms of use
      protocols/           # Protocol transparency page
      security/            # Security information
      share/               # Social sharing redirect (OG metadata)
      strategies/          # Investment strategies
  api/                     # API routes
    consent/               # Cookie/privacy consent (POST/DELETE)
    email/unsubscribe/     # RFC 8058 email unsubscribe
    health/                # Health check (liveness + readiness)
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
pnpm validate:all              # Full pipeline: type-check -> lint -> test -> build -> tokens -> translations
pnpm validate:design-tokens    # Validate design tokens against schema
pnpm validate:translations     # Check translation key parity across locales
pnpm check:dead-code           # Dead code detection (knip)
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
pnpm --filter web db:migrate   # Run database migrations
pnpm --filter web db:status    # Check migration status
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
- **Barrel exports:** Every directory has `index.ts`
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

#### Already in place (do not regress)
- **Bundle optimization:** `experimental.optimizePackageImports` for 17 packages in `next.config.js` (Turbopack-aware tree-shaking).
- **Bundler:** `next build` uses Turbopack by default in Next.js 16 (do not pass `--webpack` — silently drops middleware, see B1 audit fix). The webpack `splitChunks` config + `WebpackPerformancePlugin` were removed in F1 audit (2026-05-08) — they were dead code under Turbopack. Restore from git history if you ever flip back to webpack mode.
- **Prefetch hygiene (W7 audit/2026-05-08):** Secondary `<LocaleLink>` / `<Link>` to other top-level routes use `prefetch={false}` to avoid the "preloaded but not used" browser warning. The pattern is: high-intent CTAs (waitlist, demo, brand-logo home) prefetch by default; secondary nav (Business / Adelaide Daily / Learn / About) and exploratory cards (LessonRoadmap active card → lesson page) opt out. Trade: marginally slower navigation on those clicks; gain: clean console + ~2.5KB less wasted bandwidth per page.
- **Color contrast (W2 audit/2026-05-08):** All clickable brand-colored text uses `--text-brand-accessible` (teal-700, 4.85:1 on white) NOT `--color-teal-600`. Success-tinted text uses `--text-success-accessible` (emerald-700, 5.53:1) NOT `--color-emerald-600`. Muted-on-light text uses `--color-slate-600` (7.55:1) NOT `--color-slate-400` (2.56:1, fails AA). Muted-on-dark uses `--color-text-on-dark-muted` at 0.95 alpha (was 0.85). Verified across 263 axe runs (static + `:hover` + `:focus-visible` + `:disabled` + mobile + demo flow), 0 violations.
- **Analytics deferral:** GA4 `afterInteractive`, PostHog consent-gated lazy init, web-vitals dynamic `import()` with sample rate.
- **Production compiler:** `removeConsole`, `reactRemoveProperties` enabled.
- **SSR-safe localStorage:** All reads wrapped in try-catch inside `useEffect` (never in `useState` initializer for SSR components).
- **Lint:** 0 warnings, 0 errors. `react/no-array-index-key` and `react-hooks/*` strict-Compiler warnings have targeted `eslint-disable-next-line` directives where the code is correct (factory variants, hydration patterns, event-handler `Date.now()`, seeded `useMemo` randomness). The directive must be on the line immediately before the offending expression — for multi-line JSX, that's the `key={…}` attribute line, not the opening tag.
- **Cadence 7-value union (Phase 6A.2/2026-05-11):** `Cadence` is `oneTime | daily | weekly | monthly | quarterly | semiAnnual | yearly`. `convertCadenceToMonthly` is the only allowed cadence-to-monthly conversion; `oneTime` returns 0 (no recurring stream — caller branches via `isOneTime`). Never reintroduce a 3-value (daily/weekly/monthly) assumption. The `<select>` UI presents all 7; `case 'monthly':` switches are forbidden — exhaustive type-narrowing via the union is the only pattern.
- **Lazy-loaded calculator pattern (Phase 6C.0/2026-05-11; updated Next-16 2026-05-17):** `CompoundInterestCalculator` is a `'use client'` component imported directly from each tool route (`/tools/compound-interest`, `/tools/retirement`, `/tools/goal-savings`) AND the lesson route (`/learn/compound-interest` via `LessonThreeBeat`). Next.js code-splits client components automatically via the App Router; no `next/dynamic` wrapper needed. **Do NOT use `dynamic(import, { ssr: false })` in Server Components** — Next.js 16 forbids `ssr: false` in RSC. The component exports both a named function and a default (legacy from the earlier dynamic-import pattern; knip flags it as a duplicate; that flag is expected and harmless).
- **`tools-shared` namespace (Phase 6C/2026-05-11):** Calculator labels common across tools (results panel, scenario captions, format strings) live in `packages/i18n/translations/{locale}/tools-shared.json` (not per-tool). New tool pages MUST load `tools-shared` plus their own `tools-<key>` namespace via `loadPageNamespaces`. Adding tool-specific copy goes in the per-tool file; cross-tool copy goes in `tools-shared`.
- **Canonical URL strategy for tools (Phase 6F/2026-05-12):** `/tools/<slug>` is the canonical surface for every calculator. Lighthouse SEO requires absolute URLs in `canonical` / `hreflang` (caught in 6F audit). `PAGE_SEO_CONFIG` in `apps/web/src/lib/seo/constants.ts` is the single source — never hand-roll metadata. Tool pages use `toolMetadata('<key>')` from `@/lib/tools` which composes title/description/canonical/OG/hreflang per locale.
- **B2B URL pattern (Phase 6E/2026-05-12):** B2B-flavored tools live under the same `/tools/<slug>` path (not `/business/tools/<slug>`). `ToolDescriptor.forBusiness: true` drives the "Für Unternehmen" filter chip on the `/tools` landing and the `B2BToolsCallout` pill on `/business`. Both pills link to `/tools/<slug>` — there is no separate B2B tools route. `processorFeeRate` and other B2B defaults are locale-aware via `Record<SupportedLocale, T>` (en 2.9% / pt-BR 3.0% / es,de 1.75% reflecting EU IFR).
- **Palm-tree retirement icon via LucideIcon barrel (Phase 6A.1/2026-05-11):** `Palmtree` is re-exported from `@/components/UI/LucideIcon`. Goal/tool cards for retirement use `Palmtree`, NOT `Target` (Target is reserved for `time-to-target` calculator). Never `import { Palmtree } from 'lucide-react'` directly — the barrel re-export is the single project-allowed surface (CLAUDE.md §Build rules).
- **Currency-hedge effective-rate model (Phase 7/2026-05-13):** for non-USD locales, the canonical formula is `effectiveLocalAPY = (1 + usdYield) × (1 + localDepreciation) − 1`. Consumed via `calculateWithCurrencyHedge` (FV-shape) or `calculateMonthlyWithCurrencyHedge` (annuity) from `@/lib/market-data`. The deprecated explicit-FX-out-then-FX-back model (`projectedExchangeRate()`, `futureValueWithCurrencyHedge()`) was removed; the old model produced ~7% higher results at 5yr / ~32% higher at 30yr horizons. NEVER reintroduce phrases like "convert at spot rate, grow in USD, convert back at year-N rate" in code, copy, or tests. Source-of-truth: `apps/web/src/lib/market-data/formulas/currencyHedge.ts` header + `docs/tech/financial-calculations.md` §"Currency Hedge Model".
- **Compound Interest engine split lesson vs tools (Phase 7 Q7a/2026-05-13):** `calculateCompoundProjection` (lib/compound-interest/calculator.ts) is the lesson engine — non-hedged, pure math demo, consumed by `/learn/compound-interest`. `calculateCompoundProjectionHedged` (calculatorHedged.ts) is the tools engine — hedge for non-USD locales, consumed by `/tools/compound-interest`, `/tools/retirement`, `/tools/goal-savings`. Both wrap canonical formulas. NEVER consolidate the two with a `hedge: boolean` flag — two distinct named functions per Q7a R1 discipline. The component layer uses `engine='lesson' | 'tool'` prop on `CompoundInterestCalculator` / `CalculatorDefault` / `CalculatorOutputs` to pick. Default `'lesson'` keeps lesson pristine; tool pages pass `engine="tool"`.
- **Two hedge-precedent patterns (Phase 7 L2/2026-05-13):** for new currency-hedge wiring, the two verified-in-prod precedents are: **(A) FV-shaped tools** copy `apps/web/src/components/Sections/ComparisonTable/ComparisonTable.tsx:36-58` — uses `calculateWithCurrencyHedge`. **(B) Months-shaped tools** copy `apps/web/src/components/Sections/GoalExampleCards/useGoalCardData.ts:57-61` — uses manual `(1+diboasApy)*(1+depreciation)-1` then `monthsToInflationAdjustedTarget`. Do NOT create wrapper helpers in `lib/tools/` over these canonical functions (Phase 7 CC2 prohibition).
- **"Digital dollar" terminology + jargon ban (Phase 7 Q2a/Q4/2026-05-13):** body copy uses "digital dollar" / "dólar digital" / "Digital-Dollar" / "dólar digital" — never `USDC`, `stablecoin`, `DeFi`, `tokenized`, `yield farming`, `liquidity pool`, `blockchain` outside regulatory disclaimer keys (`*.disclosure*`, `*.regulatoryFootnote*`, `*.tilaDisclosure*`, `*.usDisclosure*`). PR review grep gate documented in `docs/audit/PRE_PHASE_7_TOOLS_POLISH.md` §5.3. APY may stay in TILA Reg DD compliance disclosure text but NOT body copy.
- **`digitalDollarSuffix` pattern (Phase 7 §5.2/2026-05-13):** `tools-shared.scenarios.digitalDollarSuffix` carries the "in digital dollar" qualifier per locale (empty for en; populated for pt-BR/de/es). Tool surfaces append this suffix to diBoaS scenario labels when `engine === 'tool'` AND `LOCALE_CURRENCY[locale] !== 'USD'`. Lesson surfaces NEVER append it (lesson is non-hedged, pedagogical math, per R2 reminder). Wired through `CalculatorOutputs` (engine-aware), `EmergencyFundCalculator` (depreciation>0 gate), `TimeToTargetCalculator` (non-bank scenarios + depreciation>0).
- **B2B card numbers derived via script (Phase 7 M1+M2+NF1/2026-05-13):** `scripts/derive-b2b-card-numbers.mjs` computes the 8 canonical values (Payment Fees × 4 + Idle Cash × 4) from canonical rates. When `FALLBACK_MARKET_DATA.rates.scenarioRates`, `bankRates.*.savings`, or `exchangeRates.*.annualDepreciation` change, re-run the script and update the tombstoned numbers in `landing-b2b.json` × 4 locales. NEVER hand-roll B2B card numbers — Phase 7 caught a `$11,556 = $10,800 × 1.07` stale-7%-era drift this way (M1 finding).
- **Dynamic lesson vignettes via canonical engine (Phase 7 L3a/2026-05-13):** Beat 2 vignettes in `learn-compound-interest.json` carry a `yearlyAmount` numeric field. `CalculatorVignettes.tsx` reads it and computes 12-year FV via `calculateMonthlyContributions(yearlyAmount/12, SCENARIO_RATES.historical/100, 0, 144)` at render time. NEVER hardcode a `twelveYear` string in translations — when scenario rates change, the vignettes auto-refresh. The lesson uses RAW Historical rate (no hedge) per Q7a/R2 — non-USD locales see the same pedagogical math, NOT effective-rate APY.
- **Inflation/depreciation rate unit convention:** `FALLBACK_MARKET_DATA.inflationRates.*` and `exchangeRates.*.annualDepreciation` are stored as **decimals** (0.045 = 4.5%, 0.03 = 3%). `bankRates.*.savings` and `scenarioRates.*` are stored as **percent** (4 = 4%, 0.32 = 0.32%). When passing to formulas, divide percent-shaped values by 100 first; pass decimal-shaped values directly. Phase-7 caught a pre-existing `inflation/100` double-conversion bug in `EmergencyFundCalculator` this way — the existing precedent is `useGoalCardData.ts:54` (`selectInflationRate` returns a decimal, no `/100`).
- **Shared tool disclaimer carries currency-hedge sentence (Phase 7 Q5b/2026-05-13):** `tools-shared.disclaimer` (4 locales) includes the "diBoaS returns are shown in digital dollar; for non-US currencies, the local-currency total combines the dollar return with how your local currency typically moves against the US dollar over time" sentence. Renders on every `ToolPage`. MiCA Art. 13 / CVM 3 / FTC compliance — do not strip this without legal review.
- **Asset History monthly-precision FX path (Audit follow-up/2026-05-23):** for `/tools/asset-history` ONLY, cross-currency math uses monthly-precision FX from `monthlySeries.fx[CURRENCY]` via `buildFxLookup` in `lib/asset-history/calculator.ts`. Each month's contribution converts to asset-native currency at that month's `closeLocalPerUsd`; terminal converts back at end-month's rate. Forward-fill (largest `ym ≤ requested`) handles end-of-window gaps (e.g., ECB EUR lags asset price data by 1 month). This is DIFFERENT from `calculateMonthlyPathDependentHedge` (used by Goal Savings retrospective via `calculatorPathDependent.ts`) which walks 5-year `FxBucket` averages from `historicalAnchors.fxBuckets`. Both are path-dependent retrospective models; monthly-precision is required for asset-history because DCA buys real units at real prices and any FX smoothing biases the unit count. The `displayCurrency` arg on `calculateAssetHistoryDcaReplay`/`calculateAssetHistoryLumpSum` (`'USD' | 'BRL' | 'EUR'`, default USD) gates the FX path: same-currency cases skip the conversion entirely. NEVER reintroduce the prohibited forward-projection explicit-FX phrasing here either — this is retrospective using known historical rates, not projected forward rates. Source: `docs/tech/financial-calculations.md` §"Path-Dependent FX Hedge" → "When to use which".
- **Asset native currency map (Audit follow-up/2026-05-23):** `ASSET_NATIVE_CURRENCY` in `lib/asset-history/calculator.ts` defines each asset's pricing currency: USD for BTC/SP500/QQQ/MSCI_WORLD/GOLD/TLT; BRL for IBOVESPA; EUR for DAX. The UI's `displayCurrency` is derived from `localeKey` (en→USD, pt-BR→BRL, es/de→EUR) and passed to the calculator. Cross-rate composition handles all 9 combinations (3 display × 3 native) via USD as the pivot currency.
- **A8 MarketDataContextProvider SSR pre-warm (Audit follow-up/2026-05-23):** every calculator-bearing page server-side awaits `marketDataService.get()` and wraps children in `<MarketDataContextProvider initialSnapshot={snapshot}>`. The provider calls `marketDataService.primeCache(snapshot)` synchronously during render — before child components call `getSync()` — so calculators get live data on first paint. Eliminates the hydration-time depreciation flip (forward tools on `/`) AND the silently-stale-fallback issue (tool pages that never call `useMarketData`). Wired in `/tools/layout.tsx`, `/page.tsx`, `/business/page.tsx`, `/learn/compound-interest/page.tsx`. NEVER skip the wrap when adding a new calculator-bearing route. **Naming note:** intentionally `MarketDataContextProvider` (not `MarketDataProvider`) to avoid collision with the existing `IMarketDataProvider` interface (the SDK-adapter abstraction in `lib/market-data/types.ts`).
- **BTC pre-2014-09 backfill via CoinMetrics (Audit follow-up/2026-05-23):** `monthlyPrices.json` BTC series is spliced — CoinMetrics community-tier `PriceUSD` daily 2010-07 → 2014-08 (aggregated to monthly OHLC) + Yahoo Finance BTC-USD 2014-09 onwards. Splice point validated at 2014-08-31 → 2014-09-01 (2.6% day-to-day drop, within normal BTC volatility). BTC 2010 DCA $100/mo now produces ~$534M LOW-confidence result, INSIDE the research-anchored $500M–$1.5B legacy range — independent validation. Fetcher: `apps/web/scripts/data-fetchers/fetch-btc-coinmetrics.mjs`.
- **MSCI World 2010-2011 gap intentional (Audit follow-up/2026-05-23):** URTH ETF (the MSCI World tracker) launched January 2012; pre-2012 MSCI World data is gated behind MSCI Inc's licensed feed. Substituting a proxy (e.g., ACWI) would introduce ~1-2pp annualized methodology drift for 19 months. Decision: keep the 2012-01 data floor; calculator throws `AssetHistoryDataError` for `MSCI_WORLD` `startYear ∈ {2010, 2011}`; UI catches and renders no result panel.
- **TLT historical loss is real, not a calc bug (Audit follow-up/2026-05-23):** TLT 2016 DCA $100/mo produces -1.5%/yr annualized (terminal $10,632 from $12,500 contributed). This is historically accurate — long-duration (~17yr) Treasuries lost ~50% peak-to-trough during the 2022-2023 Fed rate-hike cycle (10y yield went from 0.5% to 5%). Coupons recovered some price loss but not all. NEVER assume a result that looks "wrong" is a bug — verify against the underlying price/FX path data first.
- **Gain/loss badge + asset-description tooltip (Audit follow-up/2026-05-23):** Asset History renders `(+N%)` green / `(−N%)` red gain badge next to terminal value, plus a `<sup>?</sup>` tooltip on the asset selector explaining the asset's character and risk dynamics (e.g., TLT's rate sensitivity). Per-asset descriptions live in `tools-asset-history.json` `inputs.assetDescriptions.{ASSET}` × 4 locales. `gainBadgeTooltip` lives in `tools-asset-history.inputs` (not `tools-shared` yet — if/when other tools add gain/loss badges, MOVE to `tools-shared.labels.gainBadgeTooltip` for DRY).
- **USD-equivalent badge on forward tools (Audit follow-up/2026-05-23):** non-USD-locale users on Compound Interest / Retirement / Goal Savings / Emergency Fund / Time-to-Target / Idle Cash see "≈ $X USD today" next to their amount input. Rendered by `UsdEquivalentBadge` from `@/components/UI` — pure presentation, no math change. The forward-tool math continues to use the effective-rate hedge model (`(1+usdYield)(1+depreciation)−1`) per the existing Phase 7 prohibition. Inflation Impact / Currency Depreciation / Card Fees intentionally do NOT receive the badge (those tools have no implicit USD step).
- **Test-vector schema v2 (Audit follow-up/2026-05-23):** `TEST_VECTORS.json` schema bumped from `tools-test-vectors-v1` → `v2`. Only difference: `assetHistory` `mode-comparison` scenario carries explicit `lumpSumAmount` + `dcaAmount` (replaces single `amount` field). Auditor implementations MUST key into each leg via the explicit fields. All other 139 scenarios byte-identical to v1.

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

## i18n

- Reference locale: `en` (source of truth)
- Translations: `packages/i18n/translations/{locale}/`
- Namespaced JSON files: about, common, dreamMode, faq, landing-b2b, landing-b2c, landing-help, preDemo, preDream, protocols, security, share, strategies, waitlist + legal/ subdirectory (cookies, privacy, terms)
- Client/server split exports to avoid bundling React on server
- All new user-facing strings must be added to all 4 locales

## Design Tokens

- Source: `config/design-tokens.json`
- Schema: `config/design-tokens.schema.json`
- Generated CSS: `apps/web/src/styles/design-tokens.css`
- Validate: `pnpm validate:design-tokens`
- Generate: `pnpm generate:design-tokens`
- Categories: brand colors, typography, spacing, animation, z-index, breakpoints

## Environment Variables

- Documented in `apps/web/.env.example`
- `NEXT_PUBLIC_*` prefix for client-side variables
- Key categories: App URL, Analytics (GA4, Sentry, PostHog), Security (encryption, HMAC, CSRF, CSP), Rate limiting (Upstash Redis), Email (Resend), Database (Neon)
- Full reference: `docs/monitoring/INFRASTRUCTURE_GUIDE.md`

## Dependencies Between Packages

- `apps/web` depends on `@diboas/i18n`, `@diboas/ui`, and `@diboas/email`
- `@diboas/i18n` must be built before `apps/web` dev/build (`pnpm dev:fresh` handles this)
- Turborepo handles build ordering via `turbo.json` task dependencies
- **Dependency pinning strategy:** `next` is pinned exact (16.1.7). Other deps use caret ranges — `pnpm-lock.yaml` (committed) ensures reproducible builds. Do not delete or gitignore the lockfile.

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

## Audit Status

All Phase 1 audit findings resolved (March 2026). Architecture compliance audit completed April 2026 — 12/12 principles fully compliant (P4 DRY violation fixed April 30). SEO external tools audit completed and fixes applied (domain standardization, robots.txt, meta tags, heading hierarchy, dynamic imports for PageSpeed). Full compliance audit May 2026 — 12/12 principles compliant, 96% CLAUDE.md accuracy, 99.5% docs/tech accuracy. Pre-production security, stability, SEO, and analytics audits all passed. Phase 6 closed 2026-05-12 (9 sub-phases, calculator suite + tools landing + B2B tools). Pre-Phase-7 Tools Polish closed 2026-05-13 (currency-hedge math for non-USD locales, "digital dollar" framing, jargon sweep, B2B card recompute, dynamic lesson vignettes — 3 audit rounds + post-execution visual sweep). Historical Performance Calibration closed 2026-05-16 (Phases A-E + H-I; F+G deferred — path-dependent currency-hedge methodology, DCA terminal-table lookup, asset-history retrospective tool at `/tools/asset-history`, confidence stratification per audit M6). **787 tests passing** (was 485 → 552 → 606 → 613 → 762 → 787). Remaining pending items tracked in `docs/audit/PENDING_ALL.md`.

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
