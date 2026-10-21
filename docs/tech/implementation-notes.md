# Implementation Notes — Do-Not-Regress Decisions Register

**Purpose:** This is the full, archival record of the implementation decisions, performance optimizations, and per-feature "do-not-regress" notes that were previously inlined in `CLAUDE.md` under _React Performance Guidelines → Already in place_. They were moved here on **2026-06-02** to keep `CLAUDE.md` focused on the operating rules an agent needs every session.

`CLAUDE.md` retains a curated **core** of the genuinely cross-cutting prohibitions and footguns (terminology ban, currency-hedge model prohibition, Turbopack `--webpack` warning, `dynamic({ssr:false})` footgun, inflation/depreciation unit convention, LucideIcon barrel rule, SSR pre-warm wrap, compliance disclaimer). **This document is the complete register** — when working in any of the areas below, read the relevant entry here first. Each entry cites its own source-of-truth file/doc; those remain authoritative for the underlying values.

> **Relationship to other docs:** financial/currency-hedge math model → `docs/tech/financial-calculations.md` (authoritative). Monitoring stack invariants → `docs/tech/MONITORING_OPS.md`. Coding principles → `docs/tech/coding-standards.md`. This file is the implementation-decision changelog, not a re-statement of those models.

---

## Frontend / Next.js / Performance (already in place — do not regress)

- **`postcss` devDep must EXACTLY match the version pinned inside `next` (2026-08-04):** `next` ships an exact internal `postcss` dependency (8.5.23 at next 16.3.4, still 8.5.23 at 16.3.8 — verified 2026-10-06 in the lockfile's `next@16.3.8(…)` block, one `webpack@5.108.4(…)(postcss@8.5.23)` instance graph-wide; check `pnpm-lock.yaml`'s `next@…` block on every next bump). Bumping our `apps/web` devDep past it forks pnpm's peer-keyed graph into TWO `webpack@5.x_…_postcss@…` instances, and Storybook's preview build dies with `The 'compilation' argument must be an instance of Compilation` (hooks registry from one webpack instance, compilation object from the other). Keep the devDep pinned exact to next's version; when bumping `next`, move `postcss` in the same commit. Also: **dependency-bump batteries must include `pnpm --filter web build-storybook`** — it is part of the CI quality job and is the only leg that catches this class.

- **Bundle optimization:** `experimental.optimizePackageImports` for 14 packages in `next.config.js` (Turbopack-aware tree-shaking).
- **Bundler:** `next build` uses Turbopack by default in Next.js 16 (do not pass `--webpack` — silently drops middleware, see B1 audit fix). The webpack `splitChunks` config + `WebpackPerformancePlugin` were removed in F1 audit (2026-05-08) — they were dead code under Turbopack. Restore from git history if you ever flip back to webpack mode.
- **Prefetch hygiene (W7 audit/2026-05-08):** Secondary `<LocaleLink>` / `<Link>` to other top-level routes use `prefetch={false}` to avoid the "preloaded but not used" browser warning. The pattern is: high-intent CTAs (waitlist, demo, brand-logo home) prefetch by default; secondary nav (Business / Adelaide Market / Learn / About) and exploratory cards (LessonRoadmap active card → lesson page) opt out. Trade: marginally slower navigation on those clicks; gain: clean console + ~2.5KB less wasted bandwidth per page.
- **Color contrast (W2 audit/2026-05-08):** All clickable brand-colored text uses `--text-brand-accessible` (teal-700, 4.85:1 on white) NOT `--color-teal-600`. Success-tinted text uses `--text-success-accessible` (emerald-700, 5.53:1) NOT `--color-emerald-600`. Muted-on-light text uses `--color-slate-600` (7.55:1) NOT `--color-slate-400` (2.56:1, fails AA). Muted-on-dark uses `--color-text-on-dark-muted` at 0.95 alpha (was 0.85). Verified across 263 axe runs (static + `:hover` + `:focus-visible` + `:disabled` + mobile + demo flow), 0 violations.
- **Analytics deferral:** GA4 `afterInteractive`, PostHog consent-gated lazy init, web-vitals dynamic `import()` with sample rate. (See also `CLAUDE.md` § Monitoring for the live invariants.)
- **Carousel CTA navigation + fire-and-forget handlers (PERF-1/2026-06-07):** In `AppFeaturesCarouselFactory.tsx` the CTA is owned by the variant's native `<Link>` (internal) / `<a target="_blank" rel="noopener noreferrer">` (external) — the factory's `onCTAClick` handler **only records analytics; it must NOT call `window.location.href` / `window.open`** (that double-navigated: a hard reload over the `<Link>`'s SPA push, or a second tab over `<a target="_blank">`). All four factory handlers (`onNavigate`/`onSlideChange`/`onCTAClick`/`onPlayPause`) are fire-and-forget — `void analyticsService.trackEvent(...).catch(() => {})`, never `async`/`await` — so carousel interaction never blocks on the analytics round-trip. Note: the live B2C/B2B "How It Works" carousels (`B2C_HOW_IT_WORKS_CONFIG`, `B2B_HOW_IT_WORKS_CONFIG`) intentionally define cards **without** `ctaText`/`ctaHref`, so no CTA renders there — the CTA path is exercised only by the `default` config (Storybook). Also (RC-5): `useCarousel`'s unmount effect clears the transition `timerRef` (`timerRef.current?.clear()`) — `goToSlide` reassigns it per navigation and the `CleanupManager` doesn't own it, so without the clear an in-flight transition timer could `setIsTransitioning` after unmount.
- **Production compiler:** `removeConsole`, `reactRemoveProperties` enabled.
- **SSR-safe localStorage:** All reads wrapped in try-catch inside `useEffect` (never in `useState` initializer for SSR components).
- **Lint:** 0 warnings, 0 errors. `react/no-array-index-key` and `react-hooks/*` strict-Compiler warnings have targeted `eslint-disable-next-line` directives where the code is correct (factory variants, hydration patterns, event-handler `Date.now()`, seeded `useMemo` randomness). The directive must be on the line immediately before the offending expression — for multi-line JSX, that's the `key={…}` attribute line, not the opening tag.
- **OG cards = warm editorial palette + real monogram, never "dB" circle / dark gradient (2026-07-13, F-BRAND / G-3):** all three OG code paths (`lib/og/templates.tsx`, `api/og/share/ogTemplates.tsx`, `api/og/dream/route.tsx`) render the shared `OGMonogram` from `api/og/_brand/monogram.tsx` (the official palm-"B" mark, 96px base64 data-URI, edge-inlined — no runtime fetch) on a warm cream background (`--editorial-paper`/`--editorial-ink` tokens inlined as hex; `OG_COLORS.warmBackground`/`ink`/`inkSoft`/`inkMuted`). Never reintroduce the banned gradient-circle-with-initials ("dB") or the dark SaaS gradient (anti-slop Part 1). **Tool-result honesty tone-map is load-bearing:** `negative → OG_COLORS.error` (red), `neutral → OG_COLORS.ink` (plain — was `white` on the old dark bg; adapted to ink so it stays visible on cream), `positive → OG_COLORS.success` (green). The `ToolResultTemplate` per-tool `toolName`/`headlineByTool` overrides and the `isValidToolResultValue` clamp (`value > 0 && ≤ 1e9`, in `ogUtils.ts`) are upstream guards — untouched. Share route params: `tool` (must be in `SHAREABLE_TOOL_KEYS`) + positive `value` + `tone`; an invalid tool/value falls back to `DefaultTemplate` by design.
- **Favicon = monogram, never the wordmark (2026-07-13, F-BRAND):** the browser-tab icon set (`public/favicon.ico` + `public/icons/favicon-16x16.png` + `-32x32.png`, wired in `layout.tsx#metadata.icons`) is derived from the palm-"B" monogram (`logo-icon.png`), NOT the "diBoaS" wordmark — a wordmark favicon is illegible at 16-32px (why the old `favicon.avif` failed). The `/favicon.ico → /favicon.avif` redirect in `next.config.js` was removed so the real static `.ico` serves. **COMPLETED 2026-07-16 (sharp from the pnpm store — `node_modules/.pnpm/sharp@0.34.5`):** transparent nav wordmarks `logo-wordmark-{onlight,ondark}.{avif,webp}` (background-keyed via flat-bg max-channel-distance alpha, trimmed, h=88, ~10–16 KB) rendered by the `BrandWordmark` component (`components/UI/BrandWordmark/`) with the nav state classes toggling variant **visibility** (pure-CSS transparent→solid transition preserved; `semantic-components.css` §brand-wordmark); optimized PWA icon set `public/icons/{apple-touch-icon,icon-192,icon-512,icon-maskable-512}.png` (palette-quantized, 1.7–6.6 KB) + `manifest.json` repointed; JSON-LD/SEO logo → `logo-icon-monogram.avif` (256px, 1.6 KB) in `layout.tsx`, `metadata-factory.ts`, `structuredData.ts` (+ test); `SEO.DEFAULT_OG` → the dynamic `/api/og/default` route (a REAL 1200×630 — the old wordmark file never matched the declared size); `LOGOS.WORDMARK` key removed (dead). The four ~900 KB official source PNGs moved OUT of the served tree to `apps/web/brand-source/` (git-kept for re-export); legacy `favicon.avif` / `logo-icon.avif` / `logo-wordmark.avif` deleted after zero-ref verification. **Naming rule stands:** `-onlight`/`-ondark` = FOR light/dark surfaces. (Plan record deleted — delete-after-execution.)

## i18n / Tools architecture (already in place — do not regress)

- **Cadence 7-value union (Phase 6A.2/2026-05-11):** `Cadence` is `oneTime | daily | weekly | monthly | quarterly | semiAnnual | yearly`. `convertCadenceToMonthly` is the only allowed cadence-to-monthly conversion; `oneTime` returns 0 (no recurring stream — caller branches via `isOneTime`). Never reintroduce a 3-value (daily/weekly/monthly) assumption. The `<select>` UI presents all 7; `case 'monthly':` switches are forbidden — exhaustive type-narrowing via the union is the only pattern.
- **Lazy-loaded calculator pattern (Phase 6C.0/2026-05-11; updated Next-16 2026-05-17):** `CompoundInterestCalculator` is a `'use client'` component imported directly from each tool route (`/tools/compound-interest`, `/tools/retirement`, `/tools/goal-savings`) AND the lesson route (`/learn/compound-interest` via `LessonThreeBeat`). Next.js code-splits client components automatically via the App Router; no `next/dynamic` wrapper needed. **Do NOT use `dynamic(import, { ssr: false })` in Server Components** — Next.js 16 forbids `ssr: false` in RSC. The component exports both a named function and a default (legacy from the earlier dynamic-import pattern; knip flags it as a duplicate; that flag is expected and harmless).
- **`tools-shared` namespace (Phase 6C/2026-05-11):** Calculator labels common across tools (results panel, scenario captions, format strings) live in `packages/i18n/translations/{locale}/tools-shared.json` (not per-tool). New tool pages MUST load `tools-shared` plus their own `tools-<key>` namespace via `loadPageNamespaces`. Adding tool-specific copy goes in the per-tool file; cross-tool copy goes in `tools-shared`.
- **Canonical URL strategy for tools (Phase 6F/2026-05-12):** `/tools/<slug>` is the canonical surface for every calculator. Lighthouse SEO requires absolute URLs in `canonical` / `hreflang` (caught in 6F audit). `PAGE_SEO_CONFIG` in `apps/web/src/lib/seo/constants.ts` is the single source — never hand-roll metadata. Tool pages use `toolMetadata('<key>')` from `@/lib/tools` which composes title/description/canonical/OG/hreflang per locale.
- **B2B URL pattern (Phase 6E/2026-05-12):** B2B-flavored tools live under the same `/tools/<slug>` path (not `/business/tools/<slug>`). `ToolDescriptor.forBusiness: true` drives the "Für Unternehmen" filter chip on the `/tools` landing (the former `B2BToolsCallout` pill on `/business` was an unrendered orphan, deleted 2026-07-07 with the MSG-07 prune). Links go to `/tools/<slug>` — there is no separate B2B tools route. `processorFeeRate` and other B2B defaults are locale-aware via `Record<SupportedLocale, T>` (en 2.9% / pt-BR 3.0% / es,de 0.8% effective post-IFR — Decision Q3; the earlier 1.75% figure recorded here was superseded and the copy aligned per MSG-02, 2026-07-07).
- **Palm-tree retirement icon via LucideIcon barrel (Phase 6A.1/2026-05-11):** `Palmtree` is re-exported from `@/components/UI/LucideIcon`. Goal/tool cards for retirement use `Palmtree`, NOT `Target` (Target is reserved for `time-to-target` calculator). Never `import { Palmtree } from 'lucide-react'` directly — the barrel re-export is the single project-allowed surface (CLAUDE.md § Build rules).

- **Money Jobs — two named engines, never a mode flag (tool #11/2026-07-11, R1):** `calculateMoneyJobsPersonal` and `calculateMoneyJobsBusiness` are separate engines in `apps/web/src/lib/money-jobs/calculator.ts`. The business engine models an operating floor + runway, not a household split — do NOT merge them behind a `mode` parameter. `MONEY_JOBS_MODEL` constants are verbatim from `docs/tools/MONEY_JOBS_CONSTANTS_ATTESTATION.md` §6 (essentialsShare 0.62/0.61/0.56/0.47 Basis-A — the oft-quoted BR 72% is share-of-consumption, a unit error; never "correct" it back). The M4 reconcile invariant (floor + cushionContribution + workingMax === income outside dignity) is enforced in unit tests AND at stress-harness generation time (`tools-stress-test.mjs` throws).
- **Money Jobs gate persists the waitlist email — repairs the dream-mode gate (decision 5/2026-07-11):** `MoneyJobsGate` writes the normalized email to `POSITION_STORAGE_KEYS.email` on signup success. Before this, NOTHING wrote that key, so the dream-mode gate's persisted-membership check never fired. Any change to this key name or write must keep both gates working; the silent mount-unlock (persisted email → `onUnlocked(null)`, no re-ask) is deliberate cross-surface behavior, not a bug.
- **Money Jobs free surface is complete by design (row-15/2026-07-11):** the gate is NOT an artificial cliff — the promised result (the split + cost line + three jobs + band) renders fully pre-gate; the plan (timeline, projections, next steps) is added depth (anti-slop Part 3 row 15 reasoning, CLO-light pass Part 2 Q2). Do not move split elements behind the gate "to improve conversion" — that flips row 15 to FAIL and blocks merge.
- **Money Jobs runway mode is compliance-positive (decision 9/2026-07-11):** when a business is burning and runway < 12 months (strict `<` — exactly 12 is comfortable, boundary is founder-ratified), the UI leads with protection and SUPPRESSES the invest-the-excess framing (no band, no share, idle-cash comparison held in the plan). This is a deliberate suitability posture — never "fix" runway mode to show yield content.
- **Money Jobs `isAccessibleForFree: true` is correct (2026-07-11):** the SoftwareApplication JSON-LD keeps `isAccessibleForFree: true` even though the plan layer is email-gated — the calculator's core function is fully free with no login; the gate unlocks supplementary depth and is a lead capture, not a paywall (schema.org's flag concerns paywalled content). Don't flip it to false, and don't remove the gate's "free" framing.
- **Money Jobs waitlist source pair (2026-07-11):** `'tool_money_jobs'` exists in BOTH the `WaitlistSource` union (`lib/waitingList/store/types.ts`) and `KNOWN_SOURCES` (`lib/api/validators.ts`) — the API 400s any source missing from the validator set, so the pair must stay in sync (documented sync pair; add new tool sources to both or the gate submit breaks).
- **react-intl empty-string messages render the key ID (2026-07-11):** an empty string as a message value makes `formatMessage` fall back to the ID (caught live: the money-jobs `headline.personalPrefix: ""` rendered `tools-money-jobs.headline.personalPrefix` on the page). Never ship `""` as a translation value — restructure the markup instead of using empty-slot keys.
- **FAQ single source of truth = `faq.json` + `config/faqRegistry.ts` (2026-07-13 SSOT):** every FAQ surface (`/help`, `/`, `/business`, `/strategies`, `/protocols`) sources its content from the canonical `faq.json` store via `getFAQForSurface(surface)`; `FAQ_TOPICS` (the /help taxonomy) also lives in the registry. The old per-namespace FAQ blocks (`strategies.json#faq.items`, `protocols.json#faq.q1..q8`, and the orphan `marketing.faq.*` default) were **deleted** — only the section headers (`strategies.faq.header`, `protocols.faq.h2`) survive in those namespaces. **Any page rendering FAQ must load the `faq` namespace** (`loadPageNamespaces(locale, [..., 'faq'])`) or the accordion renders raw keys (caught live on `/strategies`; strategies + protocols pages now include it). The `safeStrategy.{answerA,answerB}` A/B (wallet-architecture) pair is resolved inside `getFAQForSurface` via `NEXT_PUBLIC_WALLET_ARCHITECTURE` — do not re-scatter that branch into page config. Strategies FAQ copy was reconciled to the canonical (backtest-free, pre-launch-honest) answers — do not restore the "we tested every strategy across nearly 4 years" framing. `faqRegistry.test.ts` is the drift anchor (every registry id exists in all 4 locales; per-surface counts/order; A/B resolution; kill-list on the retired stores).
- **`/help` FAQPage JSON-LD reads FLATTENED keys (E10 fix, 2026-07-13):** `loadPageNamespaces` returns a flattened `Record<string,string>` (keys like `faq.items.isBank.question`), NOT nested namespace objects. The `/help` `mainEntity` builder reads `pageMessages[\`faq.items.${id}.question\`]`for every`FAQ_TOPICS`id (43 total) via`buildFAQStructuredData`. The pre-fix code read `pageMessages['landing-help'].topics._.questions._`— a path that never existed AND was accessed as a nested object — so`mainEntity`always shipped`[]`. Never revert to nested-object access on `loadPageNamespaces` output.
- **card-fees hero figures are DERIVED from `CARD_FEES_DEFAULTS`, not free copy (founder-approved 2026-07-15):** the en hero "On a $75 sale, $2.18 never reaches you." = `avgTransactionAmount.en (75) × processorFeeRate.en (0.029)` → Intl-rounds to $2.18 (the float lands at 2.1750…03, rounding UP — verified against the live widget); pt-BR "Numa venda de R$250, R$7,50…" = `250 × 0.03`. **If `CARD_FEES_DEFAULTS` (lib/tools/constants.ts) changes for en/pt-BR, these two hero strings MUST be recomputed in the same PR.** es/de heroes intentionally do NOT carry the moment (post-IFR 0.4–1.0% reality per Decision Q3/D-MSG-6 — a 2.9% example would be false there and €0.48 is undramatic).
- **DB migrations MUST be tracked against production (incident 2026-07-17):** prod schema drifted because migrations were applied by hand without `schema_migrations` tracking, so a migration was silently missing (incident record deleted; this entry is the surviving summary). The tracking table now exists in prod (backfilled 2026-07-17). Rule: any PR adding a file under `lib/database/migrations/` ships only with the migration applied to prod (runner or console **+ tracking row**); run `pnpm --filter web db:status` against prod as part of any schema-touching deploy — it is now truthful.
- **DE register convention (founder ruling 2026-07-15): du everywhere EXCEPT `legal/{privacy,terms,cookies}.json` and the investor vertical (`investor.json` + `investor-docs.json`) — those stay formal Sie deliberately** (legal-German + VC-audience conventions). Do not "fix" the legal/investor Sie to du, and do not let Sie leak back into any other surface (the 2026-07-14/15 sweep converted the MiCA disclaimer on B2C/About, `/market` chrome, `tools-shared`, and `apps/web/data/market/shared/product-disclaimer.json` to du). Note: `product-disclaimer.json` mirrors the diBoaS-Analytics product's own methodology text — its German source on diboas-analytics.com should be synced to du to match (flagged at flip time).

- **Learn/Real Talk registry conventions (Phases 1–3, 2026-07-15/16, PRs #423–#426):** (a) **until-exhausted i18n arrays** — `readMessageArray` reads `intl.messages` until the first gap, so the JSON is the single source of truth for paragraph/option counts; never reintroduce count constants (the retired B-0 bug class). (b) **[lesson] 404 mechanism** = `dynamicParams=false` + `generateStaticParams` allowlist; in production force-dynamic streams metadata so announced/unknown slugs are SOFT-404s (404 UI over HTTP 200, founder-accepted known limitation) — do not remove the allowlist when touching force-dynamic; the real-status fix is a middleware slug allowlist or the D-4 static rework. (c) **Announced talks must NOT have `PAGE_SEO_CONFIG` entries** (they would leak into the sitemap; enforced by `registryInvariants.test.ts`). (d) **`learn.arc.*` strings are the approved talk titles/taglines verbatim** (one ratified exception: ES T1 = the live title-case h1); series order derives from the registry prev/next spine, never hardcoded. (e) **Quiz correctness lives registry-side** (`blocks.quiz.correctIndexes`, one source for all locales); i18n carries only display strings and translators must never reorder options (drift-guarded). (f) **OG `isValidPageType` must include every `PAGE_CONFIGS` key** — a missed entry silently serves the default template at HTTP 200 (the Phase-1 `/api/og/learn` miss; now drift-guarded by `lib/og/__tests__/templates.test.ts`).
- **CSP `frame-src https://www.youtube-nocookie.com` exists ONLY for the learn video facade (D-1, 2026-07-16):** widening it is a security review, not a copy change; `lib/security/__tests__/cspFrameSrc.test.ts` locks exactly one origin. The facade is click-to-load (no iframe before the click — locked by a VideoFacade unit test); watch-time completion is deliberately untracked (no IFrame API).

- **Learn talk template: ALL body-text arrays render via `renderInlineEmphasis` (Phase 4 F-1, 2026-07-16):** beat1.body, beat2.intro/outro, beat3.intro/wrap and vignettesIntro all route through the escape-first helper (`**bold**` + `*italic*`). Never add a plain-`{p}` paragraph array to the template — the approved copy carries emphasis markers and a plain render ships literal asterisks (caught live twice: V-4, F-1).
- **Learn toolCard tool-moment (Phase 4 RV-9):** talks with `beat3Tool: toolCard` render the approved `beat3.toolDeepLink` AS the prominent card (arc-card treatment) + `toolTagline` (brand callback) + `afterTool`; talk-1's embedded-calculator path renders `calculatorTagline`/`afterCalculator` + the quiet deep-link line. The two branches are mutually exclusive; both fire the same `learn_tool_deeplink_clicked` wire.
- **Learn flip pair is invariant-enforced:** a live talk MUST have its `PAGE_SEO_CONFIG['learn/<slug>']` entry and vice versa (`registryInvariants.test.ts`); flipping status without the SEO entry (or the reverse) fails tests loudly. All 7 talks live since 2026-07-16 (founder superseded the weekly drip).
- **i18n package must be rebuilt after `packages/i18n/src` changes** (`pnpm --filter @diboas/i18n build`) or `namespaces.test.ts` fails against the stale dist — the test imports the BUILT config.

## Financial-calc & currency-hedge (already in place — do not regress)

> Authoritative model: `docs/tech/financial-calculations.md`. The entries below are the implementation-wiring decisions.

- **Currency-hedge effective-rate model (Phase 7/2026-05-13):** for non-USD locales, the canonical formula is `effectiveLocalAPY = (1 + usdYield) × (1 + localDepreciation) − 1`. Consumed via `calculateWithCurrencyHedge` (FV-shape) or `calculateMonthlyWithCurrencyHedge` (annuity) from `@/lib/market-data`. The deprecated explicit-FX-out-then-FX-back model (`projectedExchangeRate()`, `futureValueWithCurrencyHedge()`) was removed; the old model produced ~7% higher results at 5yr / ~32% higher at 30yr horizons. NEVER reintroduce phrases like "convert at spot rate, grow in USD, convert back at year-N rate" in code, copy, or tests. Source-of-truth: `apps/web/src/lib/market-data/formulas/currencyHedge.ts` header + `docs/tech/financial-calculations.md` §"Currency Hedge Model".
- **Compound Interest engine split lesson vs tools (Phase 7 Q7a/2026-05-13):** `calculateCompoundProjection` (lib/compound-interest/calculator.ts) is the lesson engine — non-hedged, pure math demo, consumed by `/learn/compound-interest`. `calculateCompoundProjectionHedged` (calculatorHedged.ts) is the tools engine — hedge for non-USD locales, consumed by `/tools/compound-interest`, `/tools/retirement`, `/tools/goal-savings`. Both wrap canonical formulas. NEVER consolidate the two with a `hedge: boolean` flag — two distinct named functions per Q7a R1 discipline. The component layer uses `engine='lesson' | 'tool'` prop on `CompoundInterestCalculator` / `CalculatorDefault` / `CalculatorOutputs` to pick. Default `'lesson'` keeps lesson pristine; tool pages pass `engine="tool"`.
- **Two hedge-precedent patterns (Phase 7 L2/2026-05-13; precedent B repointed 2026-07-07 after MSG-07 prune):** for new currency-hedge wiring, the two verified-in-prod precedents are: **(A) FV-shaped tools** copy `apps/web/src/components/Sections/ComparisonTable/ComparisonTable.tsx:36-58` — uses `calculateWithCurrencyHedge`. **(B) Months-shaped tools** copy `apps/web/src/lib/emergency-fund/calculator.ts` (~line 120) — uses manual `(1+diboasUsdApy)*(1+depreciation)-1` (with `applyEffectiveRateClamp`) then `monthsToInflationAdjustedTarget`. (The former precedent-B file `GoalExampleCards/useGoalCardData.ts` was deleted 2026-07-07 with the orphaned GoalExampleCards component.) Do NOT create wrapper helpers in `lib/tools/` over these canonical functions (Phase 7 CC2 prohibition).
- **"Digital dollar" terminology + jargon ban (Phase 7 Q2a/Q4/2026-05-13):** body copy uses "digital dollar" / "dólar digital" / "Digital-Dollar" / "dólar digital" — never `USDC`, `stablecoin`, `DeFi`, `tokenized`, `yield farming`, `liquidity pool`, `blockchain` outside regulatory disclaimer keys (`*.disclosure*`, `*.regulatoryFootnote*`, `*.tilaDisclosure*`, `*.usDisclosure*`). PR review grep gate documented in the pre-Phase-7 tools-polish plan §5.3. APY may stay in TILA Reg DD compliance disclosure text but NOT body copy.
- **`digitalDollarSuffix` pattern (Phase 7 §5.2/2026-05-13):** `tools-shared.scenarios.digitalDollarSuffix` carries the "in digital dollar" qualifier per locale (empty for en; populated for pt-BR/de/es). Tool surfaces append this suffix to diBoaS scenario labels when `engine === 'tool'` AND `LOCALE_CURRENCY[locale] !== 'USD'`. Lesson surfaces NEVER append it (lesson is non-hedged, pedagogical math, per R2 reminder). Wired through `CalculatorOutputs` (engine-aware), `EmergencyFundCalculator` (depreciation>0 gate), `TimeToTargetCalculator` (non-bank scenarios + depreciation>0).
- **B2B card numbers: script RETIRED (Phase 7 M1+M2+NF1/2026-05-13; retired 2026-07-07, MSG-07):** `scripts/derive-b2b-card-numbers.mjs` _(⚠ NOT REACHABLE — see `5.458`)_ was deleted — its target keys (`diboasResult`/`bankResult`) no longer exist because the shipped Two-Worlds cards are qualitative (Bar 2026-06-30, no numbers). The underlying rule STANDS: if numeric B2B result figures ever return to `landing-b2b.json`, derive them from canonical rates via a script (restore from git history: `git show 24f8489:scripts/derive-b2b-card-numbers.mjs`) — NEVER hand-roll them. Phase 7 caught a `$11,556 = $10,800 × 1.07` stale-7%-era drift this way (M1 finding).
- **Dynamic lesson vignettes via canonical engine (Phase 7 L3a/2026-05-13):** Beat 2 vignettes in `learn-compound-interest.json` carry a `yearlyAmount` numeric field. `CalculatorVignettes.tsx` reads it and computes 12-year FV via `calculateMonthlyContributions(yearlyAmount/12, SCENARIO_RATES.historical/100, 0, 144)` at render time. NEVER hardcode a `twelveYear` string in translations — when scenario rates change, the vignettes auto-refresh. The lesson uses RAW Historical rate (no hedge) per Q7a/R2 — non-USD locales see the same pedagogical math, NOT effective-rate APY.
- **Inflation/depreciation rate unit convention:** `FALLBACK_MARKET_DATA.inflationRates.*` and `exchangeRates.*.annualDepreciation` are stored as **decimals** (0.045 = 4.5%, 0.03 = 3%). `bankRates.*.savings` and `scenarioRates.*` are stored as **percent** (4 = 4%, 0.32 = 0.32%). When passing to formulas, divide percent-shaped values by 100 first; pass decimal-shaped values directly. Phase-7 caught a pre-existing `inflation/100` double-conversion bug in `EmergencyFundCalculator` this way — the existing precedent is `apps/web/src/lib/inflation-impact/calculator.ts` (~line 73; `selectInflationRate` returns a decimal, no `/100`). (Former precedent file `useGoalCardData.ts` deleted 2026-07-07, MSG-07.)
- **Shared tool disclaimer carries currency-hedge sentence (Phase 7 Q5b/2026-05-13):** `tools-shared.disclaimer` (4 locales) includes the "diBoaS returns are shown in digital dollar; for non-US currencies, the local-currency total combines the dollar return with how your local currency typically moves against the US dollar over time" sentence. Renders on every `ToolPage`. MiCA Art. 13 / CVM 3 / FTC compliance — do not strip this without legal review.

## Asset History & data provenance (already in place — do not regress)

> Authoritative model: `docs/tech/financial-calculations.md` §"Path-Dependent FX Hedge". The entries below are the asset-history-specific wiring + data-source provenance.

- **Asset History monthly-precision FX path (Audit follow-up/2026-05-23):** for `/tools/asset-history` ONLY, cross-currency math uses monthly-precision FX from `monthlySeries.fx[CURRENCY]` via `buildFxLookup` in `lib/asset-history/calculator.ts`. Each month's contribution converts to asset-native currency at that month's `closeLocalPerUsd`; terminal converts back at end-month's rate. Forward-fill (largest `ym ≤ requested`) handles end-of-window gaps (e.g., ECB EUR lags asset price data by 1 month). This is DIFFERENT from `calculateMonthlyPathDependentHedge` (used by Goal Savings retrospective via `calculatorPathDependent.ts`) which walks 5-year `FxBucket` averages from `historicalAnchors.fxBuckets`. Both are path-dependent retrospective models; monthly-precision is required for asset-history because DCA buys real units at real prices and any FX smoothing biases the unit count. The `displayCurrency` arg on `calculateAssetHistoryDcaReplay`/`calculateAssetHistoryLumpSum` (`'USD' | 'BRL' | 'EUR'`, default USD) gates the FX path: same-currency cases skip the conversion entirely. NEVER reintroduce the prohibited forward-projection explicit-FX phrasing here either — this is retrospective using known historical rates, not projected forward rates. Source: `docs/tech/financial-calculations.md` §"Path-Dependent FX Hedge" → "When to use which".
- **Asset native currency map (Audit follow-up/2026-05-23):** `ASSET_NATIVE_CURRENCY` in `lib/asset-history/calculator.ts` defines each asset's pricing currency: USD for BTC/SP500/QQQ/MSCI_WORLD/GOLD/TLT; BRL for IBOVESPA; EUR for DAX. The UI's `displayCurrency` is derived from `localeKey` (en→USD, pt-BR→BRL, es/de→EUR) and passed to the calculator. Cross-rate composition handles all 9 combinations (3 display × 3 native) via USD as the pivot currency.
- **A8 MarketDataContextProvider SSR pre-warm (Audit follow-up/2026-05-23):** every calculator-bearing page server-side awaits `marketDataService.get()` and wraps children in `<MarketDataContextProvider initialSnapshot={snapshot}>`. The provider calls `marketDataService.primeCache(snapshot)` synchronously during render — before child components call `getSync()` — so calculators get live data on first paint. Eliminates the hydration-time depreciation flip (forward tools on `/`) AND the silently-stale-fallback issue (tool pages that never call `useMarketData`). Wired in `/tools/layout.tsx`, `/page.tsx`, `/business/page.tsx`, `/learn/compound-interest/page.tsx`. NEVER skip the wrap when adding a new calculator-bearing route. **Naming note:** intentionally `MarketDataContextProvider` (not `MarketDataProvider`) to avoid collision with the existing `IMarketDataProvider` interface (the SDK-adapter abstraction in `lib/market-data/types.ts`).
- **BTC pre-2014-09 backfill via CoinMetrics (Audit follow-up/2026-05-23):** `monthlyPrices.json` BTC series is spliced — CoinMetrics community-tier `PriceUSD` daily 2010-07 → 2014-08 (aggregated to monthly OHLC) + Yahoo Finance BTC-USD 2014-09 onwards. Splice point validated at 2014-08-31 → 2014-09-01 (2.6% day-to-day drop, within normal BTC volatility). BTC 2010 DCA $100/mo now produces ~$534M LOW-confidence result, INSIDE the research-anchored $500M–$1.5B legacy range — independent validation. Fetcher: `apps/web/scripts/data-fetchers/fetch-btc-coinmetrics.mjs`.
- **MSCI World 2010-2011 gap intentional (Audit follow-up/2026-05-23):** URTH ETF (the MSCI World tracker) launched January 2012; pre-2012 MSCI World data is gated behind MSCI Inc's licensed feed. Substituting a proxy (e.g., ACWI) would introduce ~1-2pp annualized methodology drift for 19 months. Decision: keep the 2012-01 data floor; calculator throws `AssetHistoryDataError` for `MSCI_WORLD` `startYear ∈ {2010, 2011}`; UI catches and renders no result panel.
- **TLT historical loss is real, not a calc bug (Audit follow-up/2026-05-23):** TLT 2016 DCA $100/mo produces -1.5%/yr annualized (terminal $10,632 from $12,500 contributed). This is historically accurate — long-duration (~17yr) Treasuries lost ~50% peak-to-trough during the 2022-2023 Fed rate-hike cycle (10y yield went from 0.5% to 5%). Coupons recovered some price loss but not all. NEVER assume a result that looks "wrong" is a bug — verify against the underlying price/FX path data first.
- **Gain/loss badge + asset-description tooltip (Audit follow-up/2026-05-23):** Asset History renders `(+N%)` green / `(−N%)` red gain badge next to terminal value, plus a `<sup>?</sup>` tooltip on the asset selector explaining the asset's character and risk dynamics (e.g., TLT's rate sensitivity). Per-asset descriptions live in `tools-asset-history.json` `inputs.assetDescriptions.{ASSET}` × 4 locales. `gainBadgeTooltip` lives in `tools-asset-history.inputs` (not `tools-shared` yet — if/when other tools add gain/loss badges, MOVE to `tools-shared.labels.gainBadgeTooltip` for DRY).
- **USD-equivalent badge on forward tools (Audit follow-up/2026-05-23):** non-USD-locale users on Compound Interest / Retirement / Goal Savings / Emergency Fund / Time-to-Target / Idle Cash see "≈ $X USD today" next to their amount input. Rendered by `UsdEquivalentBadge` from `@/components/UI` — pure presentation, no math change. The forward-tool math continues to use the effective-rate hedge model (`(1+usdYield)(1+depreciation)−1`) per the existing Phase 7 prohibition. Inflation Impact / Currency Depreciation / Card Fees intentionally do NOT receive the badge (those tools have no implicit USD step).
- **Test-vector schema v2 (Audit follow-up/2026-05-23):** `TEST_VECTORS.json` schema bumped from `tools-test-vectors-v1` → `v2`. Only difference: `assetHistory` `mode-comparison` scenario carries explicit `lumpSumAmount` + `dcaAmount` (replaces single `amount` field). Auditor implementations MUST key into each leg via the explicit fields. All other 139 scenarios byte-identical to v1. (Schema later bumped to `v3` + 140 vectors during FX-16 adoption — see `docs/audit/AUDIT_HISTORY.md`.)

---

- **Monthly market-data rows are TRUE month closes as of 2026-07-11 — do not "restore" the old May-2026 values:** the 2026-05-23 refresh had shipped partial mid-May candles as May closes (SP500 742.72, QQQ 714.51, IBOVESPA 177650, BRL 5.0134 …). They were corrected on the `data-hygiene` branch to the real closes (754.5361 / 737.4995 / 173788 / 5.0563 …, Alpha Vantage cross-verified) and June 2026 was appended. A diff that "reverts" these numbers is reintroducing the partial-candle bug, not fixing drift. Guard class: F-M2 gate in `compute-regime.mjs`; incident record deleted; this entry is the surviving record.

## Investor vertical / room (already in place — do not regress)

- **Room content locale (`roomContentLocale`) — EN + pt-BR only; DE/ES render EN (2026-07-04, founder decision).** The entire gated `/investor-room` (landing + doc sub-pages + chrome/badge + doc bodies) serves **EN + pt-BR native; DE/ES render the EN content**. Mechanism: `apps/web/src/lib/i18n/roomContentLocale.ts` (`locale === 'pt-BR' ? 'pt-BR' : 'en'`), used for ALL room content loads (`investor` **and** `investor-docs`) **and** `SetHtmlLang` (html `lang` = content locale, so AT pronounces the EN content correctly). EN is the single source; the de/es `room.*` keys carry the EN value for `validate:translations` key-parity only and are **never rendered**. **The `LocaleProvider`, `LanguageSwitcher`, and URL stay on the REAL locale** — never point the provider at the content locale (that reintroduces a language-switcher bug). The public `/investors` page is UNAFFECTED and stays 4-locale native (it reads the `page.*` sub-tree at the real locale; only the room reads `room.*` via the mapper). Unit-tested: `apps/web/src/lib/i18n/__tests__/roomContentLocale.test.ts`.
- **`InvestorReadingProgress` (client, doc pages):** thin top scroll-progress hairline; rAF-throttled passive scroll+resize listeners removed in cleanup (no `setState` thrash, no leaked listeners); **decorative** (`aria-hidden`, no `role="progressbar"`) — AT navigates by headings + the "On this page" ToC. Hidden in `@media print`. No CSS transition (width tracks scroll directly, so there is nothing to gate on `prefers-reduced-motion`).
- **`InvestorDocNav` (server, doc pages):** prev / back-to-room / next; order derived from `room.materials.docs` (fails safe to back-to-room only if the current slug isn't found). Landmark labelled via `room.docPage.docNavAria` ("Document navigation"), kept distinct from the ToC's "On this page" nav.
- **Doc-page analytics:** `PrintDocButton` fires `investor_pdf_download` (consent-gated via `analyticsService`, non-PII `{ doc: slug }`). **Doc-VIEW relies on auto page-views — do NOT add a duplicate `investor_doc_view`.** `investor_doc_nav` / `investor_contact_cta` are intentionally NOT wired (server-first nav; env-gated contact CTA). Request-form funnel = `investor_request_{submit,success,error}` in `InvestorRequestForm`.
- **Derived counts + framed layout:** "Document X of N" (N = 10 since A3 added `investment-summary` as doc 01) takes `total` from `room.materials.docs.length` (never a literal — the count updates automatically when docs are added/removed). The framed doc layout (`.docFrame`, "Option B") collapses to full-width on mobile; the frame + room chrome join the `@media print` reset so only the document body prints. The hardcoded `"Investor Room"` header badge is now i18n (`room.roomBadge`).
- **Figures registry — every settled investor number authored once (2026-07-06; plan record deleted).** `config/investor-figures.json` (+ `.schema.json`, design-tokens pattern) is the single source of truth for settled investor numbers (fees, raise terms, ARPU, D-003 validation targets). Room **source markdown** references them as `{{fig:id}}` tokens; `scripts/generate-investor-docs.mjs` resolves them via `scripts/lib/investor-figures.mjs` in a pre-`parse()` pass, then the generated `investor-docs.json` ships resolved (no tokens in committed JSON). **Rules that must not regress:** (1) never hand-transcribe a settled number into source or a component — add/edit the registry entry and re-run the generator; (2) `status:"pending"` figures **throw** on resolve — a flagged-wrong number cannot render (D-005 coupling mechanism); (3) resolution locale is `pt-BR` native, `en`/`de`/`es` all resolve as `en` (de/es are parity-only, never rendered — same rule as `roomContentLocale`); (4) the gate is two-layer — `validate:investor-figures` runs L2 (CI-safe: schema + no-token-residue + `forbidLiterals` bans superseded literals like the old `$2,500` + protected literals like the `2,500–5,000` users target stay present) always, and L1 (FEES.md / DECISION_LOG equality) only where those local-only docs are on disk (auto-skips in CI). `forbidLiterals` supports a lookbehind exemption (`(?<!former )\$2,500`) so an approved historical reference in an assumption label survives. Consistency is now a script, not a review pass.
- **Numbers layer — `stats` bands + `StatStrip` + deck layout (A3, 2026-07-06; addendum record deleted).** The scannable-KPI investor experience. (1) **Authoring:** a stat band is a ` ```stats ` fenced block of `label | value | note?` rows (first two pipes delimit; a note may contain `|`, a value may not); **first row = hero**, rest = secondaries. `{{fig:}}` tokens resolve pre-parse. The generator emits `{type:'stats', hero, items}`; `parseStatsRow`/`parseStatsBlock`/`checkStatsBlocks` live in `scripts/lib/investor-figures.mjs` (unit-tested + gate-enforced: 1 hero + 0–4 secondaries, non-empty label/value, ≤2 bands on `investment-summary`). (2) **Renderer:** ONE stat-grid implementation — `components/Investor/StatStrip` (`variant='page'` flat public band / `variant='doc'` hero+secondaries). `InvestorGlance` consumes it; **never reintroduce a parallel grid or bolt hero props onto InvestorGlance.** Hierarchy is typography+spacing (hero ~2× via `--font-size-3xl`), never colored boxes. Print CSS keeps bands as a compact row. (3) **Ownership rule (anti-repeat):** each number is hero on exactly one doc; the ask is the only cross-doc repeat (summary hero + faq secondary); validation-targets is the sanctioned shared secondary. **`regulatory-position` band (added 2026-07-06 per IR Session 013 audit) carries hero "Licenses required at launch: 0" ONLY because the CLO §75 qualifier travels as its note ("by design — software/interface layer; subject to legal review + launch gates per market") — the nuance is on the chip, mirroring the doc's own "No license needed" + qualifier structure. A BARE "0 licenses" chip without that rider WOULD regress red-team Fix 4 — never strip the qualifier note. `product-roadmap` stays UNbanded (milestone chip reads as a launch commitment — the doc is explicitly "not a public launch promise"; deliberate deferral). (4) **Deck:** `InvestorDocBody layout='slides'` (pitch-deck only) groups sections into numbered cards via the shared `renderBlock` (no duplicate switch); `groupIntoSlides` pairs blocks with original indices (no mutable render counter — React Compiler); print = one slide per page. (5) **`investment-summary`\*\* is the room's first doc (renumbered 01–10); it rides the existing `[doc]` route (F22 self-gate inherited — never a separate route).
- **B2B ramp rows render NO cap (D-005; wired 2026-07-07, messaging fix plan MSG-01).** `landing-b2b.fees.rows.{add,cashOut}.diboas` templates carry no `{max}` slot ("no cap" / "sem limite" / "sin límite" / "ohne Obergrenze"); `buildAllFeeValues` provides only `{rate,min}` for those rows. Never reintroduce a `maxFee` override (the deleted `B2B_DEPOSIT_MAX_FEE = 2500` was the superseded pre-D-005 cap; a bare override removal would silently fall back to the **B2C $250** cap — template and code change travel together). Scope note: the figures-registry `forbidLiterals` CI gate scans only `investor-docs.json`, NOT `landing-b2b.json` — the landing is protected by being fully service-driven (no cap literal exists to drift), not by the gate.
- **⚠️ CORRECTED 2026-08-31 (PENDING_ALL 5.104) — THERE ARE NO FEE CAPS. The entry that stood here recorded the per-market `$25 / €25 / R$25` sell/exit caps (D-MSG-6, 2026-07-07) as current; **FE-1 (2026-08-03, FEES.md v3.5) removed ALL caps** and Monetization re-confirmed it 2026-08-29 (`Q-MON-5`: the capped B2B example "must be retired/rebuilt"). Because this register is what CLAUDE.md tells you to read _before touching fee surfaces_, the stale entry meant the caps could be re-added FROM the register — that was the whole of 5.104. **Current truth: Add money 0.48% · Strategy exit / sell 0.39% · Cash out 0.48%, with a per-position minimum of $0.25 / €0.25 / R$0.25 and NO maximum.** A $10,000 sell costs **$39**, not $25. Per-market *minimums* remain per-currency; `formatCurrency(…, locale)` still renders the `{min}` slot. Do NOT reintroduce a `{max}`/cap slot, a "capped at" literal, or a capped worked example in any locale. Live copy still carrying the cap is tracked as 5.103. Investor-room USD notation (pt-BR "US$25") is a separate NUMBERS_REGISTER A2 convention and is unaffected. **Verified at source 2026-08-31:** `docs/full-view/FEES.md` v3.5 rows ("no cap", caps "removed by FE-1a") AND `config/investor-figures.json` `fees.cap.{exit,rampB2C,rampB2B}` — all three already read **"no cap" / "sem limite"** (status `active`). The superseded entry claimed `feesCanonical` _pinned_ the caps; it never did. Live copy still saying "capped at $25" therefore contradicts the canon, the figures registry and this register at once (5.103).**
- **EU card-fees copy is post-IFR (D-MSG-4/5, 2026-07-07).** es/de `tools-card-fees` hero + help state the honest effective range **0,4–1,0 %** (EU IFR; engine default `processorFeeRate` es/de = **0.008**). Never copy the US "2.5–3%" framing into the EU locales; the hook is fee _visibility_, not fee size. en (2.9%) and pt-BR (3.0%) keep their genuine market rates.
- **German marketing register is informal "du" (D-MSG-1, 2026-07-07).** All de marketing/product copy — including the Demo and Dream flows, common.json UI chrome, share, cookie consent — uses du/dein (lowercase). Formal "Sie" survives ONLY in legal disclosure keys (crypto/MiCA disclosures, `preDream.legalNotice`, tools-shared disclaimer) and in `de/investor.json` (IR register, deliberately formal). Beware 3rd-person false positives: "sie/Sie/Ihr(e)" meaning she/her (Adelaide), they/their (banks, protocols, the numbers, the simulation) must NOT be du-ified.
- **Spanish locale targets peninsular Spain (D-MSG-2, 2026-07-07).** cartera (not billetera), móvil (not celular), cartera de inversión (not portafolio), añadir (not agregar/ingresar in labels), importe (not monto), claves (not llaves), monitorización. LATAM vocabulary is a defect; sweep grep: `billetera|celular|portafolio|computadora|\bplata\b`.
- **Strategy-card content is dormant-by-design, NOT dead (2026-07-07).** `strategies.strategies.*` (~250 lines/locale of per-strategy copy) is fully translated but unrendered — the cards section is hidden in `strategies/page.tsx` "awaiting redesign". It deliberately SURVIVED the MSG-07 aggressive prune; do not delete it, and do not treat i18n keys as prunable without checking this register.
- **Currency-depreciation vintage labels derive from the anchor window (Data Vintage P-4/P-6; 2026-07-07, MSG-08).** `output.retrospectiveNowLabel` (`{asOfMonth}`) and `retrospectiveLossNote` (`{years}`) are fed from `CurrencyDepreciationRetrospectiveResult.anchorStart/anchorEnd` (the locked `historicalAnchorStart/End` constants). Never hand-type an end month or a year-span into these i18n strings — they rot when the series appends. Series-START year literals ("since 2010") are locked anchors (marked do-not-refresh) and stay literal. Protocols TVL vintage is single-dated (February 2026 across all three mentions — down-dated conservatively per P-4); when TVLs are actually re-verified, update ALL THREE strings (`tvlFreshness`, `tvl.source`, `footer→lastUpdated` equivalent) together.
- **Public `/investors` materials list mirrors the room's 10-doc list (D-MSG-9, 2026-07-07).** `page.materials.docs` = `room.materials.docs` minus `slug` (same numbering, Technical Architecture `in-preparation`). When a doc is added/renamed in the room list, update the public list in the same change — ×4 locales (the public page is natively localized, unlike the room).
- **`/market` editorial pt-BR/es/de is `claude-reviewed` (D-MSG-10, 2026-07-07).** `_translation_status` flags in `regime.json`/`signals.json` were upgraded from `machine-draft` after a full review pass. **[Superseded rider corrected 2026-08-13:** the professional-translator gate was COLLAPSED by the founder 2026-07-15 (native 4-locale approval ruled sufficient) and `MARKET_INDEXABLE=true` has been LIVE since 2026-07-17 (5.38 CLOSED; robots index,follow + hreflang + sitemap verified in prod) — the earlier sentence here claiming the translator pass "remains the gate" was stale. What survives = the discipline: new editorial edits keep the per-locale objects in sync, in-register, and re-run `pnpm validate:market-data` (jargon gate).**]
- **Investor-room pages self-gate — layout conditional is NOT an access gate (SECURITY, 2026-07-06, F22).** App Router pages render in parallel with their layout, so `{granted ? children : <Access/>}` in `(investor-room)/layout.tsx` does NOT stop a page from rendering — it only controls what the layout places in the tree. The page's full content still shipped in the RSC flight payload (confirmed a real prod leak). **Both `investor-room/page.tsx` and `investor-room/[doc]/page.tsx` MUST call `verifyInvestorGate(...)` themselves and `return null` when not granted**; the layout additionally filters the client i18n bundle to `investor.access.*` only when ungranted. Never remove either check. Regression-guarded by `investor-room/__tests__/pageGate.test.tsx`. General rule: **gate the data-producing component, not just the layout's display output.**
- **Conservative (7%) is the emphasized default scenario — a founder ruling, not a bug (P2-c, 2026-07-10).** `HIGHLIGHTED_DEFAULT = 'conservative'` in all three compound engines (`calculator.ts`, `calculatorHedged.ts`, `calculatorPathDependent.ts`) and TimeToTarget's card highlight. Historical (10%) stays visible but unhighlighted — under-promise with the canonical user-yield figure. Do NOT "fix" the highlight back to historical. The F-6 family is CLOSED (founder rulings 2026-07-11): `INFLATION_IMPACT_SCENARIO_USD_PERCENT = SCENARIO_RATES.conservative` (7 — do not "fix" back to historical; the stress-harness mirror uses 0.07 and the vectors are regenerated), and the preDream `wealthy` goal is named **"70/20/10 Goal"** (live on 70 / clear debts with 20 / always invest 10 — an allocation-rule name, not a return figure; the sim already contributes 10% of the reference salary). Only deliberately-historical contexts remain: the lesson Beat-2 vignettes (RAW Historical, locked above per Q7a/R2 — pedagogy). **Emergency-fund extended to Conservative-7% (A2, founder ruling 2026-07-13):** `EMERGENCY_FUND_SCENARIO_USD_PERCENT = SCENARIO_RATES.conservative` (was `.historical`), and the result card reads the `scenarios.conservative`/`conservativeTooltip` labels. The golden-path diBoaS timeline moves from ~57 to ~61 months (lower assumed yield = more months, strictly more honest). Do NOT revert emergency-fund to historical.
- **Dream Mode result honesty — data-viz honesty cluster (canon UX-60/61/63, 2026-07-19).** `apps/web/src/components/PreDream/screens/ResultsScreen.tsx`: (1) **UX-61 precision reduction** — every projected figure renders `formatCurrency(…, 0, …)` (0 decimals, not 2); do NOT "fix" the rounding back to cents (false precision on a projection reads as a promise). (2) **UX-63 assumed-APY label** — the growth figure is labelled via `results.assumedApy` ("at an assumed {apy}% a year"), never a bare "X% APY"; keep the "assumed" framing. (3) **UX-60 scenario spread** — the same money is also shown on the other two scenario paths (via `calculatePreDreamResult`) so the outcome reads as a _range_, not one deterministic line; do NOT delete the spread to show a single number. Paired with the `/market` server-side outage banner in `market/page.tsx` (robustness — full/partial fallback via `fallbackMessages.*`, `role="status"`). This lands with the same commit as the code; keep entry + code together.
- **The weekly `/market` workflow gates by GATE CLASS — bot-written output blocks BEFORE the PR, human-owned fields block ON the PR (2026-08-31, PENDING_ALL 5.151).** `generate.mjs` never writes the research-memo voice (`regime.summary.<locale>.{short,detailed,mixed_signals,key_*}` — its own docstring says "PRESERVED (editorial-owned, never touched here)"). On 2026-08-24 the memo-figure gate (5.128) was added into the **bot pre-flight** bundle; on 2026-08-31 — the first weekly cycle with it — a drifted figure failed the step, the job died at line 75, and **`Open refresh PR` never ran**. No PR meant the founder-ratified **AUTO-HOLD** policy had nothing to hold (it assumes a PR exists and simply waits) and the miss was invisible except a failure email. The rule now: a gate over output the bot WRITES (drift `--check`, jargon, market + analytics-sdk tests, prettier) blocks pre-PR, because the bot can always satisfy it by regenerating; a gate over a field a HUMAN owns is **reported** pre-PR (`continue-on-error`, `id: memo`) and enforced by the PR's own CI battery, where a human can actually fix it on the branch. **The honesty guarantee is unchanged — a stale memo still cannot MERGE** (`memoFigureReconciliation` runs in full CI via `MARKET_REFRESH_PR_TOKEN`). When the memo is stale the PR opens with the title "MEMO REWRITE REQUIRED", the `memo-rewrite-required` label and the orphaned figures quoted in the body. **The memo step must EXIT NON-ZERO when stale** (it renders as failed-but-continued): if it exits 0 the step looks green while the memo is drifted, and `continue-on-error` becomes dead configuration that can never fire — caught in this change's own self-audit. It also collects orphans across ALL locales (`sort -u`), never `head -1`, which would show one locale and hide the rest. **Do NOT "simplify" this back into one vitest invocation** — that re-creates the deadlock (bot pre-flight asserting an invariant only a human can satisfy). Sabotage-proven 2026-08-31: injecting a figure the engine does not publish leaves the pre-flight green (317 pass) and fails the memo gate naming the exact orphan. Paired change: the cron moved to `17 6 * * 1` and `market-refresh-watchdog.yml` alarms if no run started in 24h. **The 2026-08-31 run was NOT dropped — it fired 7h19m late (13:19 UTC) and failed at the same memo gate** (the "dropped" wording here and in `infrastructure.md` was corrected 2026-09-06). That correction matters twice: it is the accurate failure record, and it is why the watchdog sits at `0 22 * * 1` rather than mid-morning — **a check placed inside the delay envelope produces false alarms, which train people to ignore the alarm.** Do NOT move it earlier to "catch it sooner".
- **`/market` data_status panel is AUTO-GENERATED — never hand-edit (B3, 2026-08-11).** `regime.json#data_status` + `data-status.json` are both written by `generate.mjs` from ONE derivation (`apps/web/scripts/market-refresh/lib/data-status.mjs`: per-cadence-class status rules — weekly-friday F-M3 14-day laggard window, BTC doc-02 §5.1 expected-confirmed-month, M2 print-overdue, Polygon warm-up ledger — plus derived `overall_confidence` HIGH/MODERATE/LOW and ops-facing EN message templates). The F-M6 mirror holds by construction; `generate.mjs --check` + the golden test (`dataStatusDerivation.test.ts`, derive-from-committed-computed == committed panel) make a hand edit un-mergeable. A cycle-specific message nuance goes into the module's templates (or an editorial-override for rendered copy), NOT into the JSONs. The panel's ETF stale-fund guard (`STALE_FUND_DAYS` in `etf-flows.mjs`) is inert BY DATA LIMITATION — Polygon's ticker-detail endpoint carries no `last_updated_utc` (API-probed 2026-08-11); do not "fix" the null `lastUpdated` by wiring the list endpoint's stamp (it tracks record metadata, not share-count vintage).
- **Market pipeline FRED series are single-source BY ACCEPTED DECISION (data-chain parity audit, founder-ordered 2026-08-13).** BTC monthly closes get dual-source verification (Yahoo vs CoinGecko ≤0.5% divergence, `assertBtcCloseVerified`); the FRED series (DTWEXBGS, DGS10, NASDAQCOM, M2SL) deliberately do NOT — FRED is the official/primary publisher and no independent second publisher of these exact series exists. The compensating corruption net is the quality gate's per-series bounds: outlier limits (DTWEXBGS 8%/day, NASDAQCOM 16%, DGS10 0.6pp absolute, M2SL 10%/month since 2026-10-21, `5.626`) + recency windows (DTWEXBGS 14d, DGS10/NASDAQCOM 7d, M2SL 92d) + schema/monotonicity checks, all fail-closed (no files written on breach). Do NOT "complete" the symmetry by adding a scraped second source for FRED data (worse provenance than the primary), and do NOT remove the bounds because the source is official. New market views state their per-source dual-source policy explicitly per the program doc §4 go-live checklist row 7 (PENDING_ALL 5.95).
- **The weekly `/market` refresh must survive a legitimate data state, never assume one (Phase B, 2026-09-29, PENDING_ALL 5.462–5.469, 5.476).** Five of twelve scheduled runs failed since 2026-07-13, and the common cause was a BLOCKING test asserting a data STATE (the live panel is HIGH, the ETF ledger has no gap, the ETF row reads FRESH) instead of a RULE. Standing rules: (1) **tests in `market-data/__tests__` / `analytics-sdk/__tests__` run in the weekly workflow's blocking step, so a test reading committed data may assert only identities or consistency** (build-instant no-op, "gap ⇒ UNAVAILABLE/gapped, four weeks ⇒ scored", "row agrees with its signal") — rule tests own a frozen fixture (`PANEL_2026_09_07`). (2) **Run `pnpm market:simulate-next-week` for any pipeline change; all three scenarios (A normal/monthly not rolled · B skip week · C ETF leg failed) must pass** — A and B failed before this pass and are the executable form of rule 1. (3) **The weekly workflow refuses to run while a refresh PR is open** (first step, before checkout): `create-pull-request` force-rebuilds the branch from main, and an unmerged week's ETF collection is not known to be reconstructible (the route gives no observation date) — do NOT remove or move the guard, and do NOT "fix" a blocked run by closing the open PR unmerged. Remedy is always: rewrite its memo if required, merge it, re-dispatch. (4) **The ETF leg stays fail-open for the score but LOUD** (`status=failed` → `::warning::` + PR-body block); never restore `\|\| true`. (5) **The 14-day staleness backstop blocks only market changes** (founder-ruled; `lib/staleness.mjs` is the single rule; CI enforces via a `HEAD^1..HEAD` path diff, fail-closed). Do NOT move enforcement back into `pnpm test`: this repo's vitest reporter hides a passing test's console output, so the non-market WARNING would become invisible, and a failing one would freeze every lane again. (6) **`archiveSignals` merges its warm-up slots UNDER the engine's values, never replacing them** — replacing dropped `variant: 'gapped'` and would have published the warm-up sentence ("10 of 5 snapshots recorded") on a gap week (5.476); `etfFlows.test.ts` tests that seam. (7) **The PR body's memo findings come from `lib/memo-orphans.mjs`**, not a regex in YAML (the old one showed 1 of 39). Gates: `FLOW-GUARD-1`, `STALE-1`, `MEMO-3`, `SIM-1` in `engineering-gates.md`. **(8) 2026-10-06 (5.478): the same rule applies OUTSIDE the two directories.** Any test that reads the monthly series the pipeline writes (`marketDataService` without mocking it, or `monthly*.json`) gates the refresh PR's CI and must assert rules or values DERIVED from the same committed series — never a band on a moving number or a bounded month count (`asset-history`'s BTC band and DAX `<= 130` were both landmines). Declare it in `releaseGateBoundary.test.ts#PIPELINE_DATA_READERS`, keep it OUT of the bot's blocking step (a failure there kills the run and loses the week's ETF snapshot), and make sure `simulate-next-week` scenario D runs its directory.
- **Market view-voice standard — plain language leads, disclosures are native `<details>` (M3.5, founder-ruled 2026-08-14).** The binding cross-view composition every market view follows: (1) **the plain grandmother line leads** — umbrella cards render `summary.plain`'s first sentence (scored) / the macro group sentence (state) as the PRIMARY text with band/condition words demoted to a small meta row; do NOT re-promote the jargon grammar to the lead position. (2) **Card meta colors ride the warm editorial ramp** (teal-deep→teal→ink-soft→defensive→hostile via `data-band`), never the stoplight success/warning/error tokens (Q3-advisory grammar — same rule as the chart/gauge). (3) **All progressive disclosure is native `<details>/<summary>`** (analyst memo, signal-group rows, backdrop condition rows): server-rendered, no JS toggles, no ARIA re-implementations — and **`<summary>` children must be `<span>`s with CSS display** (phrasing-content spec; a `<div>` inside summary is non-conforming, caught by the 2026-08-14 audit). (4) **Only DEPTH collapses, never honesty surfaces** — disclaimers, the data-status panel, and outage banners stay permanently visible; the memo/per-signal detail are the only collapsible layers. (5) Signal-row mobile grid is `auto 1fr auto` — three children, three columns (2-col wrapped the chevron and clipped titles at 375px). (6) Memo openings are cadence-aware FROM DATA (`anchorKind`) — never hardcode week/month wording.
- **The analytics swap seam is the six `fetch*` functions in `mock-client.server.ts` — `RegimeDataProvider` never existed (swap-readiness audit 2026-08-13).** Older plans/memory referenced a "RegimeDataProvider interface"; the REAL seam (verified): `apps/web/src/lib/analytics-sdk/mock-client.server.ts` — six view-parameterized fetchers + the `fetchInitialAnalyticsData` composite + the `VIEW_DATA_LOADERS` static-import map. Exactly TWO runtime consumers (`MarketViewShell`, `UmbrellaView`); every `components/Analytics/*` import is types-only. A swap reimplements this one module's internals. Contract deltas to carry into that PR (registered on PENDING_ALL 5.90): doc-07 envelope unwrap (`{success,data,meta}` vs today's bare JSON), doc-09's server fetchers are `get*`-named with `{apiBaseUrl, apiKey, locale}` options (the host keeps its `fetch*` wrappers delegating to them — the old in-file comment claiming the names already matched was corrected 2026-08-13), `/product-disclaimer` + `synthetic_seed` exist host-side but entered doc-07 only as the v1.3 draft.
- **`HistoricalRegimeChart` point fills use the warm editorial ramp, not the stoplight tokens (B5 / F-2, 2026-07-13).** `POINT_FILL_BY_REGIME` maps VERY_FAVORABLE→`--editorial-teal-deep`, CONSTRUCTIVE→`--editorial-teal`, NEUTRAL_MIXED→`--editorial-ink-soft`, DEFENSIVE→`--editorial-defensive`, HOSTILE→`--editorial-hostile` (teal-deep → teal → ink-soft → deep-copper → rust — the same copper↔teal family as the RegimeScore gauge + RegimeLabel pills). Do NOT revert to the semantic `--text-success/warning/error-accessible` green/amber/red tokens — that grammar reads as buy/sell (Q3-advisory) and clashes with the warm `/market` palette. Token-only (no hex). The chart went LIVE with the 2026-08-04 cycle and the recolour was render-verified in production 2026-08-11 (Docker MCP, EN desktop — teal family / ink-soft / copper all correct, no stoplight grammar). **[Corrected 2026-08-24:** this entry previously recorded "`synthetic_seed: false`, 52 real snapshots" — that count was FALSE; 44 of those 52 were pre-engine seed, and PENDING_ALL 5.27's closure rested on the same false premise (superseded by 5.127). What the chart may publish is governed by the provenance entry below.**]**
- **`/market/backdrop`'s lead reports CHANGE or persistence, never a level, and carries no score (2026-08-24; PENDING_ALL 5.140 + 5.141).** The state view's lead is `signals.json` → `groups[macro_environment].state_view.lead`, generated from `templates/state-beats.json`: a points-free opening plus one BEAT per condition in the fixed order dollar, rates, liquidity. A beat selects on whether the signal's state DIFFERS FROM THE PREVIOUS RUN DAY in `run-archive.jsonl` — **never on the level**. A level-based lead says "the dollar has slipped below its trend" every week it happens to be below: on 2026-08-24 that would have been three weeks stale (MAC-01 crossed 2026-08-04 and had held for four runs). **With no prior run a beat resolves to HOLD, never MOVED** — claiming an unevidenced move is the failure that matters. Guarded by `stateLead.test.ts` (sabotage-verified on the fail-safe direction). **Do NOT reintroduce durations** ("for six weeks"): the archive starts 2026-07-11, so any duration is a floor, not a measurement; "still" and "keeps" carry persistence without asserting a length. **Do NOT put the points parenthetical on this view** — MM-2 gives state views no score, which is why the openings live in `state-beats.json` and `group-summaries.json` (rendered on the scored Bitcoin view via `SignalCardsGrid`) is left untouched. **MAC-02 copy stays change-relative** ("money has not got cheaper") because the signal measures the 10 year against its own 20 week trend, not the absolute cost of money. The depth sentences use the `*Precise` slots (2 decimals): the shared `scaleDigits` rule rounds >=100 to whole numbers, which is right for a BTC price but renders the dollar index as "119 against a 120 trend, 1% below" when the real distance is 0.69%.
- **Market pipeline writes are ATOMIC, and both JSONL ledgers tolerate a torn tail (2026-09-13; PENDING_ALL 5.302, gate PIPE-2).** Every whole-file write in `apps/web/scripts/market-refresh/` goes through `lib/atomic.mjs` (temp + `fsync` + `rename`) — `run.mjs`, `generate.mjs`, `tools-monthlies.mjs`, `providers/inrepo.mjs`. Do not reintroduce a bare `fs.writeFileSync` on a path: it truncates first and streams after, so a crash leaves a TRUNCATED `computed.json` that is not valid JSON and kills the NEXT weekly run, a week later. Three details are load-bearing and wrong in the naive version: the temp must sit in the **target's own directory** (cross-filesystem `rename` is not atomic — `EXDEV` — and `os.tmpdir()` is usually another mount); `fsync` precedes the rename; and the temp cleanup lives in its own `try/catch` so it cannot mask the caller's error. `lib/jsonl.mjs#readJsonlTolerant` is the single rule for reading an append-only ledger — both `run-archive.jsonl` and `etf-shares-weekly.jsonl` use it, after a torn tail in the second threw a bare `SyntaxError` out of the middle of a weekly run while the first absorbed identical damage.

- **The run archive stays APPEND-ONLY; duplicate run DAYS are collapsed on READ (2026-09-13; 5.302).** Making the ledger "idempotent" by rewriting same-day lines was considered and REJECTED: a correction re-run is a real event, and a provenance authority you edit is not one. The single collapse rule is `lib/archive.mjs#readArchiveRows` + `#runDayIndex` (later line wins for a day), which replaced three separate copies of the same parse loop in `priorRunSignals`, `realSnapshotCount` and the historical append. Add a reader here, not another copy.

- **A pipeline script must not run because someone imported it (2026-09-12; 5.313, gate PIPE-1).** All four writing entry points gate `main()` behind `lib/invocation.mjs#isDirectInvocation(import.meta.url)`. An `import()` of `run.mjs` once fetched live data and minted a phantom run day in `run-archive.jsonl` — the 5.137 defect class through a different door. Two footguns are recorded in that file because both were hit: `` `file://${argv[1]}` `` breaks on percent-encoded paths, and `pathToFileURL(undefined)` **throws** under `node -e`, so a guard that crashes instead of returning `false` is worse than none.

- **MM-2 "a state view carries no score" has ONE definition: `lib/market/viewRegistry.ts#MM2_SCORE_FRAGMENT` (2026-09-14; 5.174/5.318).** It was previously three regexes across two test files and nothing in shipped code, and the umbrella's fallback published `summary` — which ends with the points parenthetical by design — onto the backdrop card. `stateCardLine` now REFUSES a score-carrying fallback; a state card without a plain line still renders its conditions, so refusing is cheap. Do not re-inline the pattern, and do not "restore" the unconditional fallback.

- **`delayed_after` is shipped per source so freshness can be re-evaluated at READ time without a second copy of the cadence policy (2026-09-12; 5.173, gate PIPE-5).** The doc-02 rules stay in `apps/web/scripts/market-refresh/lib/data-status.mjs`; `src/lib/analytics-sdk/freshness.ts` does arithmetic against the shipped instant and nothing else, and is DOWNGRADE-ONLY (time never makes a stale source fresh). The two `overall_confidence` rules must stay exactly equivalent — they diverged once on a `null` `stale_after`, where the pipeline's `run > new Date(null)` compares against the epoch and reads "already stale". **`STALE` is reachable** and must stay so: it had an icon and a four-locale label and no producer, so a source past its threshold dropped the headline to LOW while its own row still said "Delayed" and nothing named the cause. The hero badge reads `dataStatus.overall_confidence`, never the frozen `summary.confidence_level` (5.131 in reverse).

- **An ETF "weekly aggregate" must actually span a week (2026-09-14; 5.301, gate PIPE-4).** `computeWeeklyFlows` stamps `spanDays` + `weekly` (7±1 days: a holiday-shifted Friday is a shifted week, a missed run is not), and a non-weekly interval inside the trailing-4 window takes ETF-01 to UNAVAILABLE with its own four-locale sentence. Two alternatives were rejected and must not be reintroduced: reaching further back for four clean weeks makes the score describe a window ending before the ledger's latest anchor while the panel reports that anchor, and failing the run closed blocks every other signal for the four weeks the gap takes to age out (a missed Polygon snapshot is not known to be reconstructible: the route gives no observation date). Cadence warnings live in `spacingWarnings`, never in `warnings`, which the detail string counts as fund-quality exclusions.

- **ETF-01 is SUSPENDED by an explicit rule, not by its data (2026-10-18; gates SUSP-1..3, COPY-VARIANT-1, UNAVAIL-1).** `lib/etf-suspension.mjs#ETF01_SUSPENSION` makes `resolveEtfSignals()` return ETF-01 `UNAVAILABLE`/`suspended` (0 points) on every route, the manual fallback included. Do not regress: (1) **nothing in the data may lift it** — not a healthy flow window, a new snapshot or a clean ledger; reactivation is a reviewed change to the constant, backed by a data route that supports a weekly evaluation; (2) the scale is **not** renormalised and methodology stays v1.1.0; (3) the data-status row reads the suspension off the SIGNAL (like the 5.301 gap) and is `UNAVAILABLE`, so confidence is capped at MODERATE through the shared rule while every LOW route survives at build AND read time; (4) a declared `values.variant` missing a locale **throws** (`lib/template-select.mjs`) — the old silent fallback would have published the warm-up sentence ("13 of 5 snapshots") in one language; the same fail-closed rule covers the group summary and the weekly opener; (5) on the cycle the suspension starts, the opener separates the data effect from the other signals (`lib/weekly-opener.mjs`) and the umbrella card shows no direction; (6) the reduced-coverage notes come from generator-owned `regime.coverage` (`lib/coverage.mjs`), never inferred in the page; (7) UNAVAILABLE never borrows the restrictive word on the Backdrop or the umbrella card (`lib/market/presentationState.ts`); (8) `simulate-next-week.mjs` calls `resolveEtfSignals`, the production route — calling `evaluateEtf01FromFlows` directly bypassed the suspension.
- **A signal group with nothing evaluated is UNAVAILABLE, not WEAK (2026-10-19; gate GROUP-UNAVAIL-1).** `lib/group-summaries.mjs#groupStatus` and `#groupSummary` decide from ONE predicate, `isGroupUnavailable` (every signal in the group UNAVAILABLE), so the status chip and the sentence cannot disagree again; from 2026-07-11 to this fix an unavailable ETF-01 shipped `status: WEAK` beside "unavailable, not weak". Do not regress: (1) an evaluated 0 stays WEAK; partial unavailability keeps the scored band; (2) the row (`SignalCard`) keeps the 0/2, shows the approved `dashboard.freshness.UNAVAILABLE` word instead of the bar, in the neutral ink, and its accessible name is the visible label ("0/2", the title) followed by the Unavailable word and the group sentence, which the generator words per cause, so a warm-up is never called a suspension and the 0/2 is never heard alone (WCAG 2.5.3 Label in Name); the open body's copy of that sentence is hidden from assistive tech on that row only, so it is read once; (3) `isSignalGroupUnavailable` also reads the signals, so a payload generated before the status existed cannot render as weak; (4) `UNAVAILABLE` is part of the SDK contract (`SIGNAL_GROUP_STATUSES` in `analytics-sdk/types.ts`) — a provider swap must emit it. No weight, threshold, band or scale changed.
- **The ETF ledger holds COMPLETE collections only; records, completeness and dates are kept apart (2026-10-19; gate LEDGER-COMPLETE-1).** `etf-flows.mjs#recordEtfSnapshot` appends a pull to `etf-shares-weekly.jsonl` only when every fund has a positive share count and price (`etf-coverage.mjs#isCompleteSnapshot`); an incomplete pull is refused and appended, with what came back, to `etf-snapshot-attempts.jsonl`, so the week can be collected again. Do not regress: (1) never fill in, delete or rewrite an existing record — the 2026-10-16 record (prices, no share counts) stays as written, is never collected over, and a re-run of its week is reported as not recorded; `appendSnapshot` stays unexported so nothing bypasses the check; (2) flows and the warm-up use complete records only, so an incomplete record is a gap, never a zero flow; (3) the panel row's dates follow the latest COMPLETE record's conventional anchor — an incomplete record or a refused attempt must never make the source look updated, and the confidence rule acts on it unchanged; (4) completeness is not currentness: never present complete records as usable weeks; (5) `deriveDataStatus` takes the attempts as its third input wherever it mirrors the generator (`dataStatusDerivation.test.ts`), or a week with a refused pull fails the weekly gate (caught by simulator scenario E); (6) no tracked text may claim that a missed week is unrecoverable — that is unknown (guarded in `workflowGuards.test.ts`); (7) the workflow words a failed collection from `run.mjs`'s exit code (`ETF_SNAPSHOT_EXIT`: 20 refused, 21 incomplete record already in the ledger, 22 recorded, then the step failed after writing it; with `--etf-snapshot` snapshot-only, only the step's closing report runs after the write) and one note shared by the log and the PR body: a retry is stated only for a refused pull, never for a week already recorded as incomplete; a generic error states nothing about what was recorded, in its note OR its title ("ETF-01 collection step ended with an error"; "did not record a complete snapshot" is reserved for 20 and 21); a recorded week is never reported as missing, and a record another writer appended during the collection counts as recorded only if it is COMPLETE (otherwise 21); an unreadable or inactive suspension state gets wording with no scoring verdict (`etfWorkflowMessages.test.ts`). Dated provider queries, a source change and reactivating ETF-01 are out of scope of this rule.
- **Every pipeline JSONL append goes through `appendJsonlLine` (2026-10-20; gate LEDGER-APPEND-1).** The tolerant reader already skipped a torn last line, but a row appended right after it fused with it and was skipped too: a NEW valid ledger week or refusal-evidence row was silently lost (#735 K01/N01). `lib/jsonl.mjs#appendJsonlLine` starts a fresh line when the file does not end in one, in the same write, never edits existing bytes, creates a missing file, and THROWS on any other failure, so `recordEtfSnapshot` cannot report `recorded`/`refused` for a write that did not happen. Used by the ETF ledger, the refused-attempts file, `run.mjs` (`publishRun.appendFile`), `compute-regime.mjs --archive` and the next-week simulator (which also reads the archive with `readJsonlTolerant`). Do not regress: no raw `appendFileSync` in a pipeline script (a test fails on it; no exemption). A failed `run.mjs` reports the files it had already written (`failureHeadline`), never "nothing written" after a BTC append or `computed.json`. It does not repair a damaged row and makes no fsync/power-loss or concurrent-writer claim.
- **A Money Tools series failure is that series' failure; Tuesday is the second attempt (2026-10-21; gates TOOLS-FAILOPEN-1, RETRY-TUESDAY-1; C1c + C1d).** Never let one tools series (a Yahoo error, a bad bar) stop the weekly run: it is reported in the PR and the run continues. Never make BTC's monthly candle fail-open (the score is never computed over a gap). The Tuesday schedule refreshes only when this week has no successful run and no refresh PR is open; never let it run over an open refresh PR (the 5.464 guard stays first in the refresh job).
- **A failed append is reported by how much reached the file, and the weekly PR checks the ledgers (2026-10-20; gates PARTIAL-APPEND-1, LEDGER-PR-CHECK-1).** `appendFileSync` can write part of a row and then throw. `appendJsonlLine` re-throws with `partialAppend` ({ path, bytesAdded }; `null` when the size cannot be read, never assumed 0) and never truncates: undoing our own bytes would still be editing an append-only file. The misleading case was the ETF ledger or refusal-evidence append in `--etf-snapshot` mode, where nothing is in `written` yet; the archive append comes after `computed.json` is already listed. Because the ETF leg is fail-open, a fragment can reach the PR, so `check-ledgers.mjs` runs before it and the PR title says `LEDGER CHECK FAILED`. Do not make that step blocking: a failed step loses the week's ETF collection, which is not known to be reconstructible. Do not make the check repair anything; the owner decides. Never turn a failed read of a committed ledger into an empty baseline (2026-10-21): only a file absent from the HEAD inventory is new; anything else that cannot be read is UNVERIFIED, reported as such, never as damage or as a valid append. A temporary file whose own cleanup failed is a stated limit, asserted as such in `partialWriteEntryPoint.test.ts` (d').

- **The daily-source ETF-01 route (`scripts/market-refresh/etf-daily/`, E1 2026-10-20; gates ETF-DAILY-1, ETF-REQ-1) is a CONTRACT, not yet the score.** Nothing in production imports it until E3; ETF-01 stays suspended. Do not regress: one provider per whole four-week window (never mix by day or week); the `> 0` positive-week rule and ≥3-of-4 live in ONE place (`ETF01_RULE`, `isPositiveWeek` in `lib/etf-flows.mjs`), shared with the share-count route; no override for a provider disagreement that changes the result; rounding sensitivity is reported, never used to change a score; insufficient or unreadable history is UNAVAILABLE + LOW with no invented or renewed dates; R is a calendar Friday, never an observation time; a window outside the calendar's coverage is UNAVAILABLE (`calendar-not-covering`, PR held), never a throw that stops the whole weekly run; a missing provider directory entry never removes a fund. Nothing received is dropped (2026-10-21): an invalid or contradictory value for an identifiable fund-day is an `invalid` observation in the ledger, the decision reads the ledger TEXT (not pre-filtered rows), and an older stable value is never reused after a newer invalid one. A provider response is complete only with its body; evidence-storage failures are their own error, never a retried request. The detailed per-fund ledger, raw responses and keys belong only in the private repository: no test or fixture may contain real provider values. The calendar's "coverage remaining" check belongs only in the collection workflow, never in a required test (a date-dependent test is a landmine).- **Market lane compliance pass (2026-10-18; gates SRC-ROUTE-1, METH-WEIGHT-1, SIM-PARITY-1, SVC-FALLBACK-1, A11Y-MKT-1, SEO-MKT-1, COPY-FALLBACK-1, SNAP-ONLY-1).** These are maintenance, accessibility and data-integrity fixes; none changes a weight, threshold, band or the 14-point scale. Do not regress: (1) **one route for the weekly sources** — `lib/market-sources.mjs` owns the six fetches and windows, the fail-closed gate (with the named `RECENCY_SLA_DAYS`) and the evaluation; `run.mjs` and `data-fetchers/compute-regime.mjs` both call it, so the manual check can never score or `--archive` data the pipeline would refuse (it used to skip the gate, and now refuses the same data the pipeline refuses); (2) `run.mjs --etf-snapshot` is **snapshot-only** and returns before the core run — the workflow runs it as its own fail-open step, and the old fall-through made a saved snapshot report as FAILED. Combined with `--append-btc` it is refused before any request or write (the pair would append the candle and then compute nothing); `--no-archive` stays allowed because the workflow passes it. Keep the two workflow steps: a single combined invocation is not how the snapshot runs; (3) ETF-01 routes outside the engine use `ETF01_WEIGHT`, the scale's top is `MAX_SCORE` (from `BANDS`), the generator's `regime_label` comes from `BANDS[].label`, and the ETF variants are `ETF_VARIANT` — no hand-copied twin of any of them; (4) `SHARED_DIR` / `MONTHLY_PRICES_PATH` are defined once in `providers/inrepo.mjs`; (5) `simulate-next-week.mjs#WEEKLY_BLOCKING_VITEST_ARGS` is the workflow's blocking command, pinned to the YAML; (6) `marketDataService.get()` logs a provider failure and the stale snapshot keeps already-loaded `monthlySeries`/`historicalAnchors`; (7) only ACTIVE and INACTIVE get a market word (`conditionWordSuffix`), and the umbrella model uses that helper rather than its own rule; (8) the chart's data table shows translated band labels and localized dates, formatted ONCE on the server (`historicalDateLabels`) and passed to the client chart as text, with the ISO day in `<time dateTime>` — do not move the `Intl` call back into the client component, where the server and the browser each format and can disagree; the gauge's accessible name carries the final score; (9) each view's Article JSON-LD uses its own path; (10) inline `t(key, fallback)` fallbacks in the /market views equal the `en` copy. Deleted as dead (zero consumers): `calculateFee`/`applyPlatformFees`/`FeeResult` (they carried the removed $25 cap and a test asserting it), `formatReturn`/`formatCompactCurrency`/`formatTimeDifference`/`getLocaleConfig`, `useFallbackMessages`.
- **Market views, round-3 rebuild (2026-10-21; gates RENDER-GUARD-1, SRC-LABEL-1, PAYLOAD-MKT-1, DATE-UTC-MKT-1, COND-MAP-1, METADATA-FALLBACK-1; register `5.631`, `5.390`).** Presentation-only; no weight, threshold, band, label, copy or emphasis change. Do not regress: (1) a client component is mounted with the fields its props declare, never with a whole loaded JSON object: those objects carry internal `_comment` / `_translation_status` notes that would ship in every page payload (`RegimeScore` takes `{score, max_score, regime_code}`, `HistoricalRegimeChart` takes `{snapshots}`); (2) `RegimeScore` and `SignalCard` skip the animation when IntersectionObserver is absent (R-9), keeping the final value they already render; (3) the Backdrop never uses a group `summary` that carries a score fragment (`MM2_SCORE_FRAGMENT`) as its lead, and renders no empty lead; (4) every date the market views format passes `timeZone: 'UTC'`; (5) `BACKDROP_CONDITIONS` is the one condition map; (6) the metadata fallbacks equal the approved `en` copy.
- **Market pipeline, round-3 rebuild (2026-10-21; gates INVOKE-2, FRIDAY-1, M2-CONTRACT-1, M2-GATE-1, TOOLS-CLOSE-1, TPL-COVER-1, RUN-CLOCK-1, FRESH-BOUNDARY-1; register `5.624`–`5.630`).** No weight, threshold, band, label or scale change; these rules change which data is accepted and can stop a run, never a score computed from valid data. Do not regress: (1) `isDirectInvocation` accepts the entry path as typed or resolved, so a symlinked checkout never exits 0 having done nothing; (2) **a Friday counts as a weekly close only once its UTC day is over** — the chosen conservative convention (K05), not proof of any provider's final close; the holiday fallback applies only to such Fridays; Monday and Tuesday runs are unaffected; (3) the engine refuses an M2 series that is not month starts in strictly ascending order with finite positive values, repeats a month, or skips a month within its last 13 (`assertMonthlyContract`, `M2_MONTHS_FOR_ROC`); the gate checks M2 with its own monthly check (`assertMonthlySeries`: 13 months minimum, not the daily 30; 10 % single-month bound, a corruption detector); (4) a Money Tools month whose stored close (the adjusted close for total-return series) is missing or invalid fails that series through the C1c path: reported in the PR, nothing written for it from that month on, `--check` exits 1; recovery on a later run is tested, not assumed (founder point 3, 2026-10-19); (5) the generator throws on a signal state with no template, and `signalTemplateCoverage.test.ts` derives the states from the engine source; a missing template is never filled by an invented sentence (new copy goes to the founder ×4); (6) `computed_at` is the run's single clock (`TODAY`), new runs only, archive lines never re-stamped; (7) a freshness `delayed_after` is the LAST fresh instant (read time is `now > delayed_after`); the monthly-close deadline is 1 ms before grace day 4 00:00 UTC, and `iso()` keeps milliseconds only when they are not zero.
- **Weekly wording, no client provider, tokenized badges (2026-10-21; gates WEEK-WORDING-1, NO-CLIENT-PROVIDER-1, ANALYTICS-TOKENS-1; owner decisions on the review-gate findings).** Never say "this week" / "a week earlier" against a previous run that is not 7±1 days back (`isWeekApart`): after a missed or extra run the ordinary openers are omitted and a changed condition reads "is now …". Never wrap the market views in a client component that takes the page data as a prop (every section renders on the server; the provider cost ~19-38 KB per page and nothing read it). Size text, spacing and radii in the Analytics badge/card modules with tokens.
- **Monthly series are contiguous; per-source pipeline messages are internal (2026-10-21; gates MONTH-CONTIG-1, FRESH-BADGE-1).** Never append a month that does not directly follow the last row (`assertNextMonth`): the tools leg backfills missing months from the same fetch, oldest first, and stops a series at a month the source lacks; BTC stays fail-closed on a gap (never compute the score over one). A month Yahoo has not closed is missing, never "nothing to do". The `message` of a `data-status.json` source is an ops note in English written at generation time; never render it to readers (the read-time overlay can change the status without changing the note).
- **/protocols TVL figures come from one pull and move only together (2026-10-21; gates TVL-DATA-1, FRESH-REF-1; founder decision on the TVL freshness proposal).** Refresh quarterly with `node apps/web/scripts/protocols-tvl/refresh.mjs` (owner: the founder; review the diff, open a PR), never by hand: the script writes the figures, the pull date and the copy ×4 together. **Never move `pulled_at` without new figures** (it would present an unverified figure as current), never restore an English constant over the localized `tvl.number`, and never re-add a wall-clock age assertion to a unit test (freshness is `scripts/data-freshness/check.mjs`: blocks a change to the data, warns elsewhere, the scheduled `data-freshness.yml` is the owner's alert). If the six headline protocols total less than the stated floor, the refresh refuses: the wording needs a founder copy decision. A card DeFiLlama does not report says so; it never keeps an old number.
- **A LOW badge explains itself from the read-time causes (2026-10-21; gate LOW-REASON-1; owner-approved copy ×4).** The reason under the confidence badge is built only from `low_confidence_causes`, which `applyReadTimeFreshness` writes at the same `now` and by the same rule as `overall_confidence`, and only when it is LOW. Never derive the reason separately (a second rule would let the badge and its reason disagree), never date the ETF sentence from a collection attempt or the clock (use the row's `last_updated_at`, the latest complete record), and never render the pipeline's per-source `message`. New causes (the E3 route's reasons) get their own approved sentence ×4.
- **Market lane compliance pass (2026-10-18; gates SRC-ROUTE-1, METH-WEIGHT-1, SIM-PARITY-1, SVC-FALLBACK-1, A11Y-MKT-1, SEO-MKT-1, COPY-FALLBACK-1, SNAP-ONLY-1).** These are maintenance, accessibility and data-integrity fixes; none changes a weight, threshold, band or the 14-point scale. Do not regress: (1) **one route for the weekly sources** — `lib/market-sources.mjs` owns the six fetches and windows, the fail-closed gate (with the named `RECENCY_SLA_DAYS`) and the evaluation; `run.mjs` and `data-fetchers/compute-regime.mjs` both call it, so the manual check can never score or `--archive` data the pipeline would refuse (it used to skip the gate, and now refuses the same data the pipeline refuses); (2) `run.mjs --etf-snapshot` is **snapshot-only** and returns before the core run — the workflow runs it as its own fail-open step, and the old fall-through made a saved snapshot report as FAILED. Combined with `--append-btc` it is refused before any request or write (the pair would append the candle and then compute nothing); `--no-archive` stays allowed because the workflow passes it. Keep the two workflow steps: a single combined invocation is not how the snapshot runs; (3) ETF-01 routes outside the engine use `ETF01_WEIGHT`, the scale's top is `MAX_SCORE` (from `BANDS`), the generator's `regime_label` comes from `BANDS[].label`, and the ETF variants are `ETF_VARIANT` — no hand-copied twin of any of them; (4) `SHARED_DIR` / `MONTHLY_PRICES_PATH` are defined once in `providers/inrepo.mjs`; (5) `simulate-next-week.mjs#WEEKLY_BLOCKING_VITEST_ARGS` is the workflow's blocking command, pinned to the YAML; (6) `marketDataService.get()` logs a provider failure and the stale snapshot keeps already-loaded `monthlySeries`/`historicalAnchors`; (7) only ACTIVE and INACTIVE get a market word (`conditionWordSuffix`), and the umbrella model uses that helper rather than its own rule; (8) the chart's data table shows translated band labels and localized dates, formatted ONCE on the server (`historicalDateLabels`) and passed to the client chart as text, with the ISO day in `<time dateTime>` — do not move the `Intl` call back into the client component, where the server and the browser each format and can disagree; the gauge's accessible name carries the final score; (9) each view's Article JSON-LD uses its own path; (10) inline `t(key, fallback)` fallbacks in the /market views equal the `en` copy. Deleted as dead (zero consumers): `calculateFee`/`applyPlatformFees`/`FeeResult` (they carried the removed $25 cap and a test asserting it), `formatReturn`/`formatCompactCurrency`/`formatTimeDifference`/`getLocaleConfig`, `useFallbackMessages`.

- **The `/market` history chart publishes ONLY snapshots a real pipeline run produced — provenance, never volume (audit remediation 2026-08-24, founder-ruled; PENDING_ALL 5.127).** Every object in `apps/web/data/market/shared/historical.json#snapshots` must correspond 1:1 to a `run_at` day in `apps/web/data/market/shared/run-archive.jsonl` — **8 points as of 2026-08-24** (2026-07-11 → 2026-08-24), growing one per weekly run. The series is SHORT BY DESIGN; that is the honest shape of a framework that went live in July. The 44 pre-engine ILLUSTRATIVE SEED points that previously padded it to 52 were pruned under founder ruling: they were never engine output, and a hand-edit (commit `37b23b20`) had flipped `synthetic_seed` `true→false` while they were still present — publishing seed as measured history on the product's core honesty axis. `synthetic_seed: false` is now true by construction, because nothing in the file is synthetic. **Do NOT backfill, seed, or hand-append this file — only the pipeline appends here**, and never hand-edit `synthetic_seed` (the generator preserves `true` below the flip threshold precisely so the flag can't outrun the data). **Do NOT reintroduce a minimum-LENGTH assertion:** the old `>= 50`-snapshot test is exactly what made inventing history the only way to go green — a count floor re-authorizes the defect that was removed. The durable guard is `apps/web/src/lib/analytics-sdk/__tests__/fixtures.test.ts` → `'should publish only snapshots backed by a real archived run'`, which reconciles every published chart point against `run-archive.jsonl` (no unbacked dates, and snapshot count == distinct run days).
- **Card-fees "annual savings" is net of diBoaS's own 0.48% movement fee (A3 / F-CF-1, 2026-07-13).** `lib/card-fees/calculator.ts`: `annualSavingsWithDiboas = Math.max(0, annualFeePaid − monthlyVolume × 12 × DIBOAS_MOVEMENT_FEE_RATE)` where `DIBOAS_MOVEMENT_FEE_RATE = 0.0048` (FEES.md Add Money, B2B no cap; mirrors `FALLBACK_MARKET_DATA.platformFees.deposit.rate`). Single Add Money leg only (not round-trip). The `Math.max(0, …)` clamp is load-bearing (keeps net at an honest floor of 0 when the processor rate is below 0.48%). Do NOT set savings back to the gross `annualFeePaid`. EU IFR-cap disclosure wiring (`disclaimers.euIfrCap`) is untouched.
- **≤5-option choice sets render as `SegmentedControl`, not `Select` (UX-36; F7-F11 design review, 2026-07-10).** `apps/web/src/components/UI/SegmentedControl/` (aria-pressed toggle-button group, house style = currency-depreciation mode toggle; segments flex-grow and wrap in narrow grid columns). Applied to asset-history mode + returns-basis and inflation-impact country. The cadence `Select` (7 options) legitimately stays a dropdown — its in-code rationale is a conscious application of the same rule. Label pairing: visible `<span id>` + `ariaLabelledby` (segments are not form controls; `htmlFor` doesn't apply).
- **Dead-code gate is scoped and GREEN — barrels are consumed-or-absent (knip Option A, founder 2026-07-11).** 35 unreferenced files deleted (33 unconsumed barrels + `lib/observability/correlation.ts` + `lib/market/{index,constants}.ts`); `pnpm check:dead-code` fails on files/dependencies/binaries only (`check:dead-code:full` shows the advisory exports/types classes — Category-4 residual: 317/344/19, review tracked in PENDING_ALL). **Kept as dormant-by-design with knip `ignore` entries, do NOT delete:** `lib/analytics-sdk/theme.ts` (mandated by the diboas-analytics MVP spec, docs/mvp 00-overview "SDK's default theme") and `lib/waitingList/domain/**` (documented DDD repository contract, Phase-2 scaffolding). `scripts/generate-investor-docs.mjs` is a LIVE manual pipeline tool — knip once flagged it unused; it is now wired as `pnpm generate:investor-docs`. Never delete by a dead-code report alone; trace importers/invocations first.
- **UX governance enforcement files are tracked in `docs/tech/ux-governance/` (G-1 revisited and accepted via relocation, founder 2026-07-10).** The anti-slop checklist, principles canon, and usage protocol moved from untracked paths; `validate:ux-canon` (11th `validate:all` gate) guards their structure and runs for real in CI — its dead-link check tolerates references into still-untracked doc areas only when that area is absent from the checkout. The retention rule (archive-with-status-header, never delete) still governs `docs/audit/` (local-only), `docs/ui-ux/` (local-only), and the Writing System.

---

## "Apply now" and "Apply post-launch" guidance

These forward-looking React performance rules remain in `CLAUDE.md` § React Performance Guidelines (they are prospective rules for new code, not historical do-not-regress notes, so they stay surfaced). See that section for the "Apply now (all new code)" and "Apply post-launch (product features)" lists.

## Cinematic hero: software-GL static-frame guard (PSI 2026-07-17 — do not regress)

`useWebGLScene` + `threeLoader.SceneController.softwareRenderer`: when the WebGL context reports a CPU rasterizer (SwiftShader/llvmpipe via `WEBGL_debug_renderer_info`), the hero renders exactly ONE static frame and never starts the rAF loop — same path as `prefers-reduced-motion`. Why: software-GL frames run ~100–200 ms each ON THE MAIN THREAD, which produced TBT 16.5 s on /learn and 22.7 s on /strategies in PageSpeed (headless Chromium has no GPU) and equally punishes real GPU-less devices (the F23 llvmpipe visitor). Removing this guard silently reverts /learn to a 38 performance score. The gradient/poster fallback keeps the visual. Related same-batch locks: hero poster `quality={70}` requires `70` in `next.config.js images.qualities`; `fetchPriority="high"` rides the priority poster; the `vitals.vercel-analytics.com` preconnect is deliberately gone (no Vercel Analytics in the stack); calculator `.range` inputs are 28 px tall with the 6 px track drawn by track pseudo-elements (WCAG 2.5.8 touch target) — don't "simplify" the height back onto the input.

## Domain map + the sandbox's public posture (2026-08-22 — do not regress)

- **`app.diboas.com` is the ONE product host.** `diboas.com` is marketing (including `/business`);
  `sandbox.diboas.com`, `apps.diboas.com` and `business.diboas.com` are **retired** — the last one
  does not resolve at all. Sandbox is a **MODE**, not a separate product (one account, two ledgers,
  a switch), so a `sandbox.` host would encode "separate product" into the URL _and_ force a
  cookie/localStorage migration at real-money launch — stranding every session and every practice
  ledger at the exact moment the product asks for real-money trust. **B2B is an account CONTEXT on
  the same host**, never a second domain: it runs the same money engine, fees and custody and
  differs only in shell. Three orthogonal axes — Mode (Sandbox ⇄ Real) · Context (Personal ⇄
  Business) · Role. Founder-ruled; full reasoning in PENDING_ALL `5.119`.
- **Sub-app URL fallbacks must be LOCAL ROUTES, not sub-domains.** `BUSINESS_URL` and `LEARN_URL`
  in `apps/web/src/config/env.ts` fall back to `/business` and `/learn`, matching `.env.example`.
  They previously fell back to `https://business.diboas.com` / `https://learn.diboas.com`, **neither
  of which resolves**, so any environment missing the env vars pointed the primary nav CTA and a
  footer link at a dead host. Do not "restore" the sub-domain forms.
- **`NEXT_PUBLIC_APP_URL` is overloaded — do not add to it.** In `config/env.ts` it means _this
  site's own origin_ and feeds the CSP/CSRF `baseOrigins`; in `config/hero.ts` it is read as _the
  product app's URL_. They only agree today because `WaitingListProvider` intercepts the hero CTA.
  When the waitlist retires, the CTA needs a **separately named** constant (e.g. `PRODUCT_APP_URL`)
  — overloading `APP_URL` further would corrupt the origin allowlist (PENDING_ALL `5.120`).
- **`SANDBOX_PUBLIC_ACCESS` is an EXPLICIT opt-in, strict `=== 'true'`.** It opens the sandbox
  without the shared-password gate. It must never be inferred from a missing password: the gate's
  fail-closed rule stands, because a misconfiguration that silently opened the app is precisely the
  accident that rule exists to prevent. `TRUE`, `1`, `' true'` all keep it shut — table-tested in
  `apps/sandbox/src/lib/auth/__tests__/authProvider.test.ts`. The check lives in
  `SimulatedAuthProvider.verifySession` so the "who may enter" seam stays single. Opening the app
  does **not** relax the CN/RU/KP geofence, `noindex`, or the R-4 play-money label.
- **A session is granted only to a request the provider already admits (P1, register `5.480`,
  2026-10-16).** `/welcome`, `/consent` and `/claim` sit OUTSIDE the gated `(app)` group, and
  `establishSession` used to grant a session to any caller — so in gated mode onboarding skipped
  the gate. `IAuthProvider.establishSession(method, currentSession)` now refuses unless public
  access is on or `currentSession` is a verified gate grant, and `startOnboarding` runs the same
  admission check BEFORE setting any cookie, sending an unadmitted visitor to `/gate`. ⚑ **Do not
  turn "no grant" into "redirect to the gate"**: in public mode with no password configured
  there is nothing to grant and the visitor is still admitted — that is the live public app.
  Walked on a local production build in both modes. `/consent` and `/claim` still RENDER without
  the gate in gated mode; they grant no session and write only the device-local ledger, and the
  interior stays gated (`5.522`).
- **The public market routes are CDN-cached; failures are not.** `/api/market` and
  `/api/market/history` send `public, max-age=0, s-maxage=300, stale-while-revalidate=3600` from the
  shared constant in `apps/sandbox/src/lib/marketCacheHeaders.ts`. They proxy a metered free-tier
  feed and the provider cache is **in-process**, so on serverless every cold instance starts empty —
  the CDN is the quota protection. `max-age=0` keeps browsers from pinning a stale rate into an open
  tab. **Error responses stay `no-store`:** a cached 503 would turn a momentary provider blip into a
  multi-minute outage for everyone behind that edge. Guarded by `marketCacheHeaders.test.ts`, which
  reads both route files — do not re-inline the header in either.

## Canon intake 2026-09-07 — ruled targets (registered now; built only in the authorized implementation phase; do not regress once built)

Each entry names its **current code state** and its **ruled target** separately, so this register never claims something the code does not do (the 5.104 lesson). Authorities: the six current packages + the Strategy Canon ruling + the Product targeted decisions P-Q1..P-Q3 + Legal `LC-TD-02` (all local-only in `docs/full-view/canon/`; reconciliation = `output/CANON_REPOSITORY_RECONCILIATION_REPORT_2026-09-07_r3.md`).

- **Geofence = exactly `CN / RU / KP`, unchanged.** _Current code:_ `apps/sandbox/src/config/geofence.ts:18` `BLOCKED_COUNTRIES = new Set(['CN','RU','KP'])`, pinned by `geofence.test.ts`. _Ruled:_ this exact set stays (LC-RR-01-03 as interpreted by LC-TD-02 §2, 2026-09-07); the six-country ledger input (PENDING_ALL 5.157) is **non-operative** for this control — do not infer, reconstruct or add countries; do not rename symbols or restructure the geofence for the ruling. _Meaning:_ an interim, IP-based, Practice-only risk control. Never label or comment it as residence verification, nationality determination, sanctions/watchlist screening, investor-type determination or Real eligibility; any Real capability resolves `feature × asset × provider × jurisdiction × user eligibility` separately at the backend and/or provider. _Gate:_ GF-1 (PLANNED) — an exact-set test citing LC-RR-01-03 + LC-TD-02.
- **Fees in Practice vs Real (F-12).** _Current code:_ `packages/banking/src/ledger/engine.ts` deducts `networkFees` and `exitFees` as conservation-formula terms in the one (Practice) scope. _Ruled target:_ FC-15 (every fee itemized before confirmation, all fees paid) governs **Real Money**; in **Practice** modeled fees are informational and visible where relevant but **not silently deducted** from the Goal allocation / Practice balance (Product handoff §18). The implementation phase makes `reconcile()` scope-aware **without** weakening replay integrity or existing ledger correctness; the conservation identity is re-proven per scope. **⚑ Presentation rule (`5.409`, ruled 2026-09-18): a Practice reference/modelled cost is rendered as INFORMATION, never as arithmetic.** No `U+2212` prefix on a cost row, no subtraction wording, and no subtotal construction implying the cost reduces the Practice amount. `previewExit` / `composeStop` return `net === gross` (`apps/sandbox/src/lib/ledger/journey.ts`), so the before-costs row and the comes-back row carry the SAME figure by construction — that equality is the EVIDENCE of non-deduction, not a defect to "fix" back. Guarded by `COST-1` (`ExitCeremony.test.tsx`), sabotage-proven, and verified against the built artefact. Real Money (FC-15, full deduction) is untouched.
- **Monthly plan = reminder / intention / proposal (F-13 = W-8).** _Current code:_ `RecurringSet` → `RecurringContributionApplied` auto-applies contributions (annuity replay). _Ruled target:_ no automatic deposit or application; any run needs per-run user approval; the producer retires, the event types stay in the union so existing ledgers replay totally.
- **`MoneyJobCandidate` is Product-atomic, technically composite (P-Q1).** _Ruled:_ `composition_type = SINGLE | BLENDED`, `technical_legs = 1..N` (leg = mechanism · protocol · network · asset · amount/weight · rate snapshot · market-data timestamp). Never type or model the Candidate so that it forces one protocol, network or mechanism; aggregate APY / risk / cost shown for a Candidate must describe the whole Candidate, with the aggregation methodology inspectable; `Consequence` evaluates the whole Candidate; `DecisionRecord` freezes the Candidate + composition + `methodology_version` at decision time and is never rewritten retroactively. The existing blended catalog in `packages/defi` is compatible; the FC-7 single-vs-blended tier split is no longer the Product boundary.
- **`SCENARIO_RATES` (7 / 10 / 14) is superseded as canonical Product truth (P-Q2 §2.9).** _Current code:_ `packages/investing/src/goals.ts:172`, consumed by `Projection.tsx` / `ExpenseImpactCard.tsx`. _Ruled:_ may remain test/fixture data; static values must never become production Product truth or an implied recommendation; the two components are `RETAIN EXPERIMENTAL / QUARANTINED` — never reinserted into Goal creation; Pay Myself First stays contribution-only. Any future projection must be modeled/illustrative, assumption-qualified, methodology-accessible, horizon- and uncertainty-aware, non-forecast, non-recommendatory, and excluded from actual Goal balance/progress.
- **Practice-depth capabilities keep the P-Q2 dispositions** (register: `docs/sandbox-app/R1_BUILD_INVENTORY_2026-08-21.md` _(⚠ NOT REACHABLE — see `5.458`)_ §6). Preserve; do not delete, re-home or redesign; Weekly cycle preserved under Growth authority; `/comprehension` stays doorless and is never a proof-of-reading gate; a Payment Handle is never exposed as Community identity.
- **Mode labels and colours (F-01 / F-05).** Label `PRACTICE • SIMULATED` (Practice = mode, Simulated = state qualifier) and `REAL MONEY`; Practice = violet/periwinkle family, Real = teal/aqua family per the Product handoff §34 (brand colour ≠ semantic colour; the approved visuals are **not** re-tinted into the masterbrand palette). Mode distinction never relies on colour alone — the label is the primary signal (R-4 stays under every screen); semantic tokens must pass accessibility validation. Public name **Practice**; "Sandbox" is internal only.
- **Sandbox token architecture (I-1d/I-1e, 2026-09-12 — do not regress).** _Current code:_ `apps/sandbox/src/styles/tokens.css` in three tiers — T0 `--palette-*` (every literal colour, once) → T1 `--sb-mode-{50…800}` (the active mode's ramp) → T2 `--sb-<family>-<role>` (what components use). Six themes = neutral / practice / real × light / dark. **TWO attributes, and the distinction is load-bearing:** `[data-palette]` on `<html>` is what re-points the ramp, and it is stamped only when the `modePalette` capability is on (`SANDBOX_MODE_PALETTE`, REQUIRES_CLEARANCE, default OFF); `data-mode` states the mode TRUTH on every in-app surface (I-1e's shell-family registry) and **paints nothing**. So the live app renders `neutral` because `data-palette` is absent, not because the mode is unknown. _Rules, enforced by `apps/sandbox/src/styles/__tests__/tokenArchitecture.test.ts`:_ component CSS references declared roles only — no palette values, ramp steps, literal colours or per-theme recolouring (image swaps and the Consent structural layout excepted); `financial.*` / `state.*` / `identity.*` never read the mode ramp, so a mode switch cannot recolour an outcome (Mode × Appearance §18); every foreground role sits in a contrast pair checked in all six themes (4.5:1 text, 3:1 graphics); the explicit-dark and system-dark copies stay identical; nothing declared is unused; comments name only tokens that exist; and **no mode block may select on `data-mode`**. The practice and real values are **provisional calibration**, not authority — enabling the palette re-tints every Practice screen teal → periwinkle, which is a Product/UIUX decision (register `5.282`). **Why the explicit guard:** for one commit in I-1e the ramp keyed off `data-mode` while the new shell stamped it everywhere, so the provisional palette went live and **720 tests passed over it** — each one asserting the ATTRIBUTE rather than the resolved colour. The guard now asserts the RESOLVED accent, which is the general rule for anything whose point is a rendered value. **⭐ Extended 2026-09-16 by the Error family (`5.365` · `5.377` · `5.378` · `5.379`) — two decisions that look like accidents and are not:** **(1) There is deliberately NO `--sb-state-error-icon`.** The ratified calibration gives the icon and the foreground _identical_ values in both appearances, so an Error icon consumes `--sb-state-error-foreground`; a fourth declared role would be a token with no consumer, which the dead-token rule correctly fails (`5.310`). Do not "complete the set". **(2) The gate renders the Error SURFACE in BOTH appearances, and the reason is the guard's shape, not taste.** `TEXT_PAIRS`/`GRAPHIC_PAIRS` are flat lists asserted across all six themes, so a combination rendered in only ONE appearance cannot be expressed — adding it fails the other. Measured: only `error-fg ↔ error-surface` (4.87–5.80) and `error-border ↔ error-surface` (3.51–3.66) hold in all six cells; `error-border ↔ inverse plate` (1.91–5.86) and `error-surface ↔ inverse plate` (1.46–14.14) swing across their floor by cell and are therefore **deliberately absent** from the matrices. Dark did not need the surface (bare foreground is 8.89:1 on the plate); it renders anyway so the asserted pair is uniform. **The boundary is the opposite case:** it sits on `--sb-canvas-base` where the foreground clears the floor directly (5.75 light / 8.89 dark), so it renders NO surface and NO border — and its `info` glyph was _removed_ rather than replaced, because the governed icon door ships no Error/failure glyph among its 57 keys. **Per-surface, the containing surface decides the treatment** — that is the whole lesson of `5.377`: contrast is a property of the local surface, never of the appearance.
- **Brand assets (F-02).** The logo / palm / glow inside the Product visuals is placeholder; implementation uses a Brand-controlled asset slot and migrates when Brand supplies the final wordmark / redrawn palm / token spec. Never a blocker for architecture.
- **Shell (F-04).** Five tabs — Home · Goals · Move · Learn · Community. An unavailable Learn or Community tab stays tappable and opens a truthful calm explainer / unavailable-state surface (W-9c) — never a dead or fake control, never a release date. Nothing of Community activates (content, profiles, interaction, data, Growth mechanisms).
- **Auth (F-06 / F-07).** Methods = Google · email · wallet (W-1; Apple deferred). Proof appropriate to the method: email → email verification; Google → provider-authenticated identity; wallet → proof of wallet control. W-14a (universal verified email) is **not** canonized. Wallet sign-in is authentication only: no funding, custody, KYC completion, Real readiness, execution readiness or Real activation is implied, and **no wallet is provisioned in Practice** (W-2 stands: provisioning belongs to the Real journey / Real-intent boundary). The EN-02 disclosure line ("connecting a wallet only signs you in; no funds move") ships with the screen.
- **Real Money entry (F-18 / P-Q3).** Real parity through pre-authorization is built behind a strict internal flag (`=== 'true'`, sabotage-tested like `SANDBOX_PUBLIC_ACCESS`), stops at "Continue to authorize", and is unreachable in production; **no public Practice ↔ Real switch exists or is invented** — future Product authority decides mode entry (guardrails: Practice permanent, Real opt-in and explicit, never a graduation, Practice state never silently becomes Real, Practice Credits never convert).
- **Persistent accounts (F-16).** May be built behind a server flag (`BUILD PERMISSION ≠ PUBLIC RELEASE PERMISSION`); public persistent release stays blocked pending the evidence in `docs/sandbox-app/legal-current/PRACTICE_LEGAL_RELEASE_CHECKLIST.md` _(⚠ NOT REACHABLE — see `5.458`)_.
- **Readiness controls (LC-TD-02 §4).** Four separate concepts — `LEGAL-TERMS` (required, unchecked) · `LEGAL-PRIVACY` (information, not consent) · `LEGAL-AGE` (required, unchecked, its own control) · `LEGAL-ANALYTICS` (optional, off) — with the exact approved four-locale strings in `docs/sandbox-app/legal-current/PRACTICE_UI_LEGAL_STRINGS.md` _(⚠ NOT REACHABLE — see `5.458`)_. Never bundle Terms with age or privacy; never require analytics to continue. _Current code:_ `components/Consent.tsx` bundles all three in one accept (PENDING_ALL 5.143 / r3 I-02) — an authorized-next-phase fix.
- **Instrumentation** follows `docs/tech/INSTRUMENTATION_CONTRACT.md` (documentation only until the runtime is authorized). _Current code:_ the app has no analytics.

## G8 time-machine replay: the anchoring and evidence contract (2026-09-15 — do not regress)

Added because the increment gate found this subsystem had **no** do-not-regress entry while batches D
and E changed its load-bearing behaviour. Every rule below describes code that exists today; none of
it creates Product authority. Register: `5.105` (open), `5.360`, `5.359`.

- **Within ONE advance every segment shares the advance's global `toDay` anchor.** _Current code:_
  `apps/sandbox/src/lib/advancePlanner.ts` passes `toDay` to `ratesForSpan` / `priceFactorsForSpan`
  for every boundary of the merged grid. _Why:_ letting a segment re-anchor to its own end overlaps
  windows and double-counts recent movement. `g8PriceReplay.test.ts` is a guard-rail test that PROVES
  per-segment re-anchoring diverges — do not "simplify" the anchor to `segEnd`.
- **ACROSS advances a `machine` replay consumes history sequentially.** _Current code:_ `TimeAdvanced`
  carries an optional `replayEpoch`, pinned on the FIRST machine advance and never rewritten
  (projection: first non-null wins, `packages/banking/src/ledger/projection/core.ts`); how far the
  next CALENDAR WINDOW starts is DERIVED as `simDay − realSettledDays`, never stored. _Why:_ a stored
  window cursor can disagree with the log. (Each POSITION's replay consumption is a separate fact,
  stored as `replayConsumedThroughSimDay` because a refusal makes days advanced ≠ days replayed. And
  **no position's walk starts before the advance's first day**, deposits included: the planner once
  started at `accruedThroughSimDay`, which only an accrual moves, so an unreplayed position re-fired
  its recurring deposits on every later advance. `5.360`: no catch-up, no retroactive replay. Lane
  audit 2026-10-21, B1; pinned by `recurringOncePerDay.test.ts`.) `real` advances pin nothing on purpose — real elapsed days genuinely
  correspond to the newest real days, so the historic newest-tail anchoring is correct for them, and
  `TimeAdvanced.source` is what discriminates the two modes. A uniform sequential context would make
  three real days replay days 91-93 of a historical window.
- **A leg with no history is UNAVAILABLE, never flat and never zero.** _Current code:_
  `apps/sandbox/src/lib/ledger/journey.ts` returns `null` for a leg whose price or APY series is
  absent, and the position is then omitted from `legsByPosition`. It previously substituted
  `points: [1]` (price) or `[0]` (APY), which silently held a leg's value — invented data wearing a
  `fixture` stamp, and worst exactly where it mattered, because a growth position whose price feed was
  missing could not FALL. Do not reintroduce a default series.
- **Replayability is ALL-OR-NOTHING per position.** Ruled by Strategy/M&E §7 (2026-09-15):
  `PARTIALLY-EVIDENCED POSITION = WHOLE-POSITION REPLAY UNAVAILABLE`; do not hold missing legs flat,
  and do not present evidenced minority legs as the whole-position result. `fullThrottle` is why: one
  15% lending leg plus 85% market, so replaying only the evidenced leg would report 15% of the
  position as the whole of it.
- **Deposits are NOT gated on replayability — the two questions are different.** _Current code:_
  `planAdvance` takes `catalogPositions` (the strategy resolved) beside `legsByPosition` (the history
  can be replayed). Phase 1's Working reservation gates on the CATALOG; the accrual gates on
  replayability; the recurring deposit fires on its own boundary inside neither gate. _Why:_ a monthly
  contribution is the user's own money moving on a calendar and depends on no market series. Gating
  both on one map made an honest replay refusal also swallow the deposit. The L1 rule still holds
  separately: a catalog-drift position reserves nothing, so it cannot starve a real position.
- **A refused accrual is safe for the conservation identity, by construction.** `reconcile()`
  (`packages/banking/src/ledger/engine.ts`) sums `earnings` from the EMITTED `AccrualApplied` events,
  and the projection applies those same events, so a refusal removes the term from both sides
  together. Do not re-derive earnings from positions independently of the event log.
- **Provenance never over-claims.** `apySource: 'defillama'` is reserved for a replay where EVERY leg
  was live; any fixture leg makes the whole emission `'fixture'`. `ratesUsed` is pinned only for a
  sole lending leg at 100% — no catalog strategy is shaped that way, so `legsReplayed` (per-leg
  multiples) is the live audit record.
- **An unusable calendar window is REFUSED and DISCLOSED — never replaced with another month.**
  _Current code:_ `advancePlanner.refusalFor` decides, and emits `ReplaySpanRefused` instead of an
  accrual; `accrual.windowCoverage` names the cause. Ruled by `5.105` §2/§3 and `5.360`:
  `MIXED-CALENDAR POSITION = WHOLE-POSITION REPLAY UNAVAILABLE`, a refused span is
  `CONSUMED AS A DISCLOSED EVIDENCE GAP`, and there is **no catch-up, no retroactive auto-replay and
  no backfill** when new provider data appears. _Why:_ `usableWindow` returning `undefined` used to
  fall through to `historicFactors`, which replayed a recent tail and presented it as the requested
  stretch. Do not restore that fallback for `machine`; it remains correct for `real`, where elapsed
  days genuinely are the newest days.
- **`windowCoverage` EXPLAINS a refusal; the windowed functions DECIDE one.** A test asserts
  `covered` ⟺ the real function returns non-null. Do not let the classifier become a second source
  of truth about the same fact — that is the `5.381`/`5.384` shape.
- **An evidence claim is an INPUT to the planner, never an inference.** `planAdvance` takes
  `calendarEvidence: 'none' | 'present'`; only `journey.ts` knows whether every date was filtered out
  of `oldestDate`. Inferring it from an absent `windowStartDate` refused six unit tests' spans,
  because a direct caller omitting the window is a harness choice, not an evidence statement.
- **The replay EPOCH is the oldest day the corpus can replay FROM, not the oldest date it mentions.**
  _Current code:_ `journey.ts#oldestDate` takes each APY series' first dated day and each PRICE
  series' **second**, then the LATEST of those. _Why:_ a price factor is `price[d] / price[d-1]`, so a
  price series cannot be replayed from its own first date; and §2 needs a window every economically
  material leg can cover, so the latest — never the earliest — is the only safe anchor. Anchoring to
  the oldest date made the first segment of every market replay uncoverable, which went unseen for as
  long as the fallback existed.
- **A fixture corpus has ONE calendar: `fixtureDateSeries` in `@diboas/defi`.** Any APY or price
  series describing the same stretch anchors there. _Why:_ several test corpora hand-built APY dates
  from a fixed `2026-01-01` while prices anchored to today, so one position's legs described
  different months. Measured once the refusal landed: of twelve monthly spans in one 360-day advance,
  **one refused as `window-outside-series` and four as `mixed-calendar`**. Do not re-introduce a
  hand-built date ladder beside `fixturePriceSeries`.
- **`5.105` is CLOSED by this increment; `5.360` is implemented.** What remains is only what the
  register says remains — read the row, not this line.

## Ledger dispositions: APPLIED vs REFUSED (2026-10-16 — do not regress)

Register: `5.485` (closed), `5.524` (founder), `5.525`, `5.526`, `5.529` (open, P8d). Gate: `LEDGER-1`.

- **The raw log is preserved; what it MEANS is a disposition.** _Current code:_
  `packages/banking/src/ledger/engine.ts` `project()` records one `EventDisposition` per event in
  `state.dispositions`, aligned with `state.events`. A refusal is recorded by calling
  `refuse(ctx, reason)` (`projection/context.ts`) in the branch that skips the event. _Why:_ the 31
  refusal branches used to be silent `break`s, so a cross-tab write the goal could not afford stayed in
  the log and every reader counted it (case 3: the ledger said 80 invested, the chart said 160). **A new
  skip branch must call `refuse()` AND get its own row in `SITES`** (`dispositions.test.ts`): the
  coverage check parses the projection sources and fails on a refusal site without a case. A sample
  of scenarios is not enough — an independent review removed nine `refuse()` calls against the first
  suite and all nine survived; with one case per site, all 32 removals fail.
- **A branch that forgets `refuse()` is caught without its own case.** A second audit removed each
  `refuse()` AND its `SITES` row together: 24 of 31 stayed green, because the coverage check only
  sees calls that exist. The mutation corpus in `dispositions.test.ts` is built independently of
  `SITES` — every event type × unknown/other ids, stale versions, and EVERY money field (`amount`,
  `grossAmount`, fees, `monthlyAmount`, `earnings`) set to zero, negative and oversized, once and
  repeated — with five oracles (the projection changed; `reconcile()` held; the amount was valid for
  its field; each goal's `invested` equals its own open positions' principal; no accrual span
  re-applied). Now 32 of 32 red. **Its pinned lists are today's known defects, exactly**, grouped by
  register (`5.525`, `5.526`, `5.529`): a new entry fails, and fixing one fails until it is
  unpinned. A third review caught the corpus mutating `amount` only (an exit's `grossAmount` minted
  money unnoticed) and `ReplaySpanRefused` misfiled as a pure marker — **a mutation corpus is only
  as wide as its field list; derive it from the event shapes, not from memory.**
- **A projected state owns a FROZEN SNAPSHOT of its log** (`Object.freeze(events.slice())`), and
  its dispositions are frozen; an in-place push throws instead of leaving the cached applied list
  stale. The sandbox appends to its live log in place; a state sharing that array
  would grow events without dispositions and silently re-project on every read.
- **Not every wrong event is refused yet.** Branches with no check at all still APPLY stale writes
  (`5.525`: a stale exit can leave `reconcile()` at −20.00; funding a dropped goal strands money) and
  no-op events (`5.526`). Adding those checks changes how existing logs replay — P8d, not P8a.
- **APPLIED is not "changed a balance".** `RuleApplied`, `TimeAdvanced`, a valid
  `ReplaySpanRefused` and every credit stay APPLIED. `RuleApplied` is the weekly-idempotency key
  (`weeklyCycle.ts` `appliedWeeks`); classifying it refused would re-propose a settled week.
- **Readers never walk `state.events`.** They use `appliedEvents` (and `refusedEvents` for
  diagnostics) from `@diboas/banking`, including `reconcile()` itself; `eventsWithDisposition` and a
  store's `getAll()` hand out the FULL log and are allowed only at their pinned places (the scanner
  flags any mention of the former, and any `getAll()` call — an unrelated one too: exempt it by name).
  `appliedEvents` is computed once per projected state and FROZEN — copy before sorting. A state's
  dispositions are matched to its log by IDENTITY: a projected state's dispositions describe exactly
  its snapshot, so a state spread over another log (`{ ...state, events }`) has them re-derived; a
  state built by hand has them DERIVED too — never assumed APPLIED — unless it declares them for
  every event (selector-test fixtures, `view/__tests__/home.test.ts` `base()`).
- **A refusal is logged, not shown.** `appendAll` logs each newly REFUSED event to the local
  console (`id`, `type`, `reason` — never the payload: a Goal's name is free text). That helps a
  developer reproducing a report; it is NOT production observability — no one sees a user's
  console, so R-14 stays with the error-sink decision (`reportError.ts`). History still omits it
  until DR-25.
- **`appendAll` projects before it persists, and takes an append back if projecting throws**
  (an event the code cannot handle): neither memory nor the store keeps an unprojectable log, and
  the caller's action fails instead (`lib/ledger/__tests__/core.test.ts`).
- **Screens ask the view layer, not the log.** Attribution over the applied log is
  `goalShowsCoinGeckoPrices(state, goalId)` / `ledgerShowsCoinGeckoPrices(state)`
  (`view/marketDataAttribution.ts`) — one place applies the rule, the test reaches it. Lifecycle events on an UNKNOWN goal or rule are refused as `stale-or-illegal-transition`
  (one helper refuses for three causes); DR-25 may want them split before wording keys off them.
- **A refused event is not shown as a success, and has no copy yet.** History omits it until DR-25
  rules the wording. Do not label it with improvised text.
- **A rule application whose money leg is refused stays settled** (marker APPLIED, leg REFUSED,
  credit left in Available). This is PINNED by `p8aCase3Agreement.test.ts`, not decided — the choice
  is `5.524`'s. Do not "fix" it either way without that ruling.

## Sandbox browser harness (Q0, 2026-10-17 — do not regress)

Register: `5.527` (closed), `5.528` (open). Gate: `HARNESS-1`. Code: `apps/sandbox/e2e/harness.ts`.

- **Only tabs from the `freezable` fixture can be frozen.** _Why:_ Playwright enables Chrome focus
  emulation (`Emulation.setFocusEmulationEnabled`) on every page it opens; Chrome treats such a page
  as captured, never hides it, and never freezes a visible page. `Page.setWebLifecycleState
{state:'frozen'}` then returns `{}` and does nothing — measured 2026-10-17 in Chrome 155 and
  Chromium 153, headless and headed: a 50 ms timer kept ticking and no `freeze` event fired, while the
  same command on raw CDP froze the page (0 ticks, `freeze`/`resume` fired) and stopped working the
  moment focus emulation was switched on. The documented opt-out is
  `connectOverCDP(endpoint, { noDefaults: true })` (`@playwright/test` ≥ 1.61, hence the sandbox's
  `^1.61.1`), which applies to the browser's DEFAULT context only — so the fixture spawns Chrome
  itself on a throwaway profile and uses that context. **Never connect by channel name**
  (`connectOverCDP('chrome')`): it resolves to the user's real Chrome profile.
- **`setLifecycle` fails closed on the browser's own signal.** It installs a listener for the event
  the transition must fire (`freeze` / `resume`), then throws unless it fired; a reading over CDP still
  works on a frozen page. Visibility is no proof (a background tab is hidden without being frozen) and a
  timer probe depends on a timing window — both were tried and rejected. Do not weaken it to "the
  command returned".
- **Two kinds of tab.** `tabs(n)` gives Playwright pages: focus-emulated, so always visible and
  focused — they cannot model a background tab. The freezable browser's tabs share ONE window, as a
  user's do: only the front tab paints, so a test calls `bringToFront()` before acting in one
  (Playwright's actionability check waits for a frame a background tab never draws). That browser does
  not carry the project's viewport or user agent, nor Playwright's `--disable-features` list.
- **The server env is hermetic.** `next start` also loads `.env.local`, which on a developer machine
  can point at a real database or carry a provider key; `@next/env` never overwrites a key the process
  already has, empty included, so every key the app reads is pinned. The market kill switch takes
  SOURCE IDS — `MARKET_SOURCES_DISABLED=defillama,coingecko`; the value `true` disables nothing (an
  independent review caught exactly that). A self-test asserts every `/api/market` stamp is `fixture`.
- **A build swap is a real deploy in CI.** The job builds twice (`--force`, so turbo does not hand
  back the first build) and the swap test fails in CI without `SANDBOX_E2E_SWAP_DIST`. The swap
  renames, never copies: the source must be on the same filesystem as `apps/sandbox`, must not be the
  served build, and a failed rename is rolled back; a leftover `.next.e2e-held` makes the next run
  refuse. **After a deploy, Next answers the open tab's first in-app navigation with a full document
  load** (deployment skew) — observed 0 or 1 loads per run; tests read through it, P8c must expect it.
- **The harness owns the server process** (Playwright's `webServer` cannot restart mid-run). Teardown
  always stops the server, is bounded (SIGTERM 10 s → SIGKILL), and warns on a slow step: a teardown
  that outlives the fixture timeout gets the worker killed, and a killed worker restores nothing — the
  next run then refuses (port taken / held build present) rather than test the wrong thing.

## Sandbox display truths (containment K2, 2026-10-18 — do not regress)

Register: `5.540`, `5.541`, `5.542`, `5.544`. Code: `apps/sandbox/src/view/home.ts`,
`components/ClaimCeremony.tsx`, `components/StrategyDetail.tsx`, `lib/monthReport.ts`.

- **A goal's percentage never reads 100 before the target is reached.** `selectGoalProgress.percentShown`
  is floored on the `Decimal` and capped at 99 until `targetReached`; the big figure and
  `aria-valuenow` both use it; the bar's fill keeps the exact `ratioPercent`. _Why:_ rounding made
  995.00 of 1,000.00 read "100%" with no milestone and no "Review and close".
- **`/claim` never promises the grant to a ledger that already has it.** The ceremony renders its
  promise only when the ledger is hydrated AND uninitialized, redirects an initialized ledger to Home,
  and the claim tap uses `router.replace` (with `push`, the tap and the guard raced and history kept a
  `/claim` entry only sometimes). `/claim` sits outside `(app)`, so it waits for hydration itself.
  _Limit:_ the ready flag also opens after a FAILED hydrate (`core.ts`), which leaves an uninitialized
  ledger and shows the ceremony as before; that false empty is the P8 unavailable-storage case, not
  this guard's.
- **Rate vs strategy availability follows one three-way rule everywhere** (picker, Simple, Detailed):
  a displayable rate shows the rate; an AVAILABLE strategy without a displayable rate (a market leg)
  states no rate; only an UNAVAILABLE strategy shows `common.optionUnavailable`.
- **"{count} weekly cycles settled" counts distinct WEEKS first settled inside the month**, the same
  distinct-week semantics as `appliedWeeks()` — never approvals, never the sum of `weekSet` lengths
  (a legacy log can repeat a week; the reducer treats `RuleApplied` as a marker and does not validate
  overlap), never a lifetime total. Display only. "Settled" keeps its meaning under the temporary
  Option A for `5.524`: the week's marker applied, not a claim that every funding leg succeeded.

## Sandbox lane audit — rules that must not regress (2026-10-18, corrected 2026-10-19)

Found by the whole-lane audit against the 12 principles (register `5.557`–`5.565`); each rule is
pinned by a test that was watched failing.

- **Middleware matcher — exclude static files at the ROOT only.** `apps/sandbox/src/middleware.ts`
  excludes `[^/]+\.(png|…)$`, never `.*\.(…)$`: the wider form let a page URL such as
  `/en/goals/x.png` skip the geofence, CSP and headers. Every public asset lives at the root; a
  nested asset folder needs its own explicit exclusion. Pinned by `middlewareMatcher.test.ts`,
  which compiles the matcher with Next's own `getMiddlewareMatchers` (an internal export — the
  test fails loudly if a Next upgrade moves it). Measured end to end: a refused country gets 451.
- **A decision is recorded when it is approved, not when the animation ends** (P06 §34.1).
  `GoalDetailScreen` commits entry/exit on approval; `Settlement` only
  orients. Never move a ledger command back into `onComplete`. Focus returns to the goal
  heading when the settlement ENDS (`endSettlement`), never on Confirm — the settlement sheet is
  a modal that takes focus itself, and the parent's effect runs after the child's. A second tap
  on Approve is stopped by three UI layers (Manifest gated on `!settling`, selection reset, the
  commit path's own refusal); domain idempotency for entry remains `5.483`.
- **No silent failure path — and client logs carry a BOUNDED reason.** Market routes log
  unexpected server errors (`Logger.error`, with stack; no request data reaches those catches).
  In the browser, the real-time settle, the time machine, the goal chart's history and the market
  hook log a reason from `lib/monitoring/failureReason.ts` (`http-503`, `timeout`,
  `malformed market response: apys[2].chain`, `unexpected:RangeError`) — never the error object,
  whose message is whatever text reached the catch. A request the screen no longer waits for is
  not logged. The rate limiter logs its fallback once per reason per window and NEVER the client
  identity. The sandbox has no external sink — attaching one is a Legal decision.
- **Parse at the market boundary — every nested field, structure only** (`5.353`, completed
  2026-10-19; the 2026-10-18 version checked only that `apys`/`gas` were lists, so `apys: [null]`
  reached `strategyRateDisplay` and threw). `lib/market/responseShape.ts` runs the domain's
  wire-format checks (`@diboas/defi` `marketShape.ts`): known protocol ids, chains, sources and
  origins; finite numbers; series points as real UTC calendar days (`Date.parse` alone turns
  `2026-02-30` into 2 March — days are round-tripped) in STRICTLY ascending order, the same
  `datesStrictlyAscending` the server's `buildHistoricalSeries` uses; stamp times as a day OR an
  ISO timestamp (reference stamps are day-only — a timestamp-only rule would reject every
  reference response); the requested currency; an FX rate and its stamp together or not at all.
  Unusable → the error state, never data; nothing is sorted, dropped or repaired. **Age and
  plausibility bounds are NOT checked here** — `freshness.ts` and `evidenceBounds.ts` own them, and
  a second copy would drift. Display-only `tvlUsd` may be absent (stored as `null` = unknown; the
  provider now serves `null`, never a missing key). An absent `priceHistories` stays accepted.
  Proven against the REAL routes' serialized output in live, fallback and reference modes
  (`routeSerialization.test.ts`, provider module caches reset per case).
- **Market data is bound to the currency it was fetched for.** `useMarket` exposes an answer
  only while its currency is the one asked for, and a failure only for the currency that failed —
  derived during render, so a switch hides the old answer at once. A same-currency answer is kept
  through a refresh on purpose: every value's age is judged from its own stamp before use.
- **A month counts a week once, in the month of its EARLIEST recorded settlement** (`5.544`, K2
  follow-up). `buildMonthReport` finds each week's earliest applied `recordedAt` over the whole
  log BEFORE counting, so the result cannot depend on log order (the device clock can step back).
  Display only: no event is sorted or rewritten, and Option A (`5.524`) is unchanged. One window
  rule, `inReportWindow`, serves every count in the file.
- **A bottom sheet renders into the app FRAME** (`5.566`). `BottomSheet` portals its overlay into
  `[data-sheet-root]` (AppShell's canvas, `position: relative; overflow: hidden`), so it covers
  header, content and tab bar; rendered inside the scrolling content it covered only that box, the
  tab bar stayed tappable behind a modal and the body scroll-lock locked the wrong element. The
  opener is captured ONCE on mount and refocused only on unmount; the trap re-runs if the frame
  appears after the first render (the move remounts the sheet's DOM). Outside the shell the sheet
  renders inline. Never render a modal overlay inside a scroll container.
- **Device-storage readers parse what they read and never destroy what they cannot read.**
  `simulatedEventStore` uses only well-formed records, keeps the rest on write (a newer build may
  have written them), and its first-record-wins check sees any entry naming the event.
- **Expected failure-path logs are asserted, not muted** (`src/test/expectedLogs.ts`): a file
  declares its expected messages; any other console output fails the test, named tests must log,
  and `strict: true` forbids a declared log anywhere else. The check runs in `onTestFinished`,
  after RTL's unmount cleanup.
- **Redirects interpolate only an allow-listed locale** (`isSandboxLocale`), as the server
  actions already did.
- **Hit areas: 44×44 via the tap token.** A control whose LOOK must not change gets a
  transparent `::after` sized `height: var(--sb-tap)` (Toggle, Home "View all", Comprehension
  "skip"); a block link gets `min-height: var(--sb-tap)`. Never `display: contents` on a link —
  it draws no box, so it has no focus ring and a shrunken target. Guarded by `tapTargets`,
  `Toggle`, `ProfileRowLink` tests.
- **A popover's container must not clip.** Settings cards carry no `overflow: hidden`; the
  LocaleSwitcher menu is absolutely positioned inside one (`settingsCardOverflow.test.ts`).
  The switcher is a DISCLOSURE (button + `aria-expanded`/`aria-controls`, plain buttons,
  `aria-current`), not a listbox.
- **Heading levels:** StrategyDetail renders only inside GoalDetail, so its title is an `h2`.
- **One list / one key:** `PROTOCOL_IDS` (`@diboas/defi`, exhaustive by a type check) feeds both
  market routes; `THEME_STORAGE_KEY` (`ThemeScript.tsx`) feeds both the pre-paint script and the
  provider — renaming it is a stored-choice migration, not a refactor.
- **Cross-package changes need a rebuild before the consumer's tests mean anything:** the
  sandbox resolves `@diboas/defi` from `dist/` (`5.413`). The first run after adding
  `PROTOCOL_IDS` failed with "not iterable" for exactly this reason.
- **Workspace test suites run ONE AT A TIME** (`"test": "turbo run test --concurrency=1"`,
  `5.578`). Each suite already uses every core, so five at once oversubscribed the machine and
  a rotating tail of tests that take 1–4 s under load crossed the 5 s budget (measured
  2026-10-20, 8-core Mac, uncached: 3/3 parallel runs red with 2–8 timeouts across ~10
  different tests; 3/3 serial runs green at about 10 % more wall time). Never answer such a
  timeout by raising budgets: find the waste first, as `5.578` did for `ciN1` (re-parsing every
  file once per class) and the market route tests (live network calls).
- **A refused visitor's state-changing request is a bare 451, never a rewrite** (`5.579`). For a
  geofenced country, any non-GET/HEAD or `Next-Action` request is answered in middleware with
  `451` + `no-store` and NO rewrite: a rewrite keeps the method, body and action header, and
  Next forwards an action the rewritten page does not own to the worker that does. A GET still
  renders the unavailable page. The matcher also runs on ANY path for every request Next may
  treat as a server action — a non-empty `next-action` header OR a form body (`multipart/form-data`,
  `application/x-www-form-urlencoded`), mirroring `server-action-request-meta.js` — because a
  `/x.png`-style path otherwise skips middleware and only the framework's "Failed to find
  Server Action" stood in the way (measured 2026-10-20). If Next adds another action
  encoding, add it here. Never route a refused mutation into a page. **Boundary (corrected 2026-10-21: LOCATION, not method):** middleware is skipped only at `/_next/static/*`, `/_next/image`, `/favicon.ico` and root single-segment paths with a static extension, except for the action requests the `has` entries pull back in. No route handler is mounted at those paths; all three are under `/api/`, which runs middleware for every method. GET is not side-effect-free here: `GET /api/market` schedules `ingestNetworkCosts` via `after()`, which can persist evidence. Mounting a route handler, or a metadata route with side effects, at a middleware-skipped path means extending the matcher first (scope measured 2026-10-20 and 2026-10-21). An EMPTY `next-action` header there skips middleware too; no `has` entry can select an empty value, and Next refuses it before lookup or forwarding (measured 2026-10-20).
- **History and current rate accept a pool by ONE rule** (`5.581`): `identityRefusal()` in the
  DeFiLlama adapter (network · declared identity · composition) gates both `getCurrentApys` and
  `getApyHistory`; a replay must never compound a chart the current rate would refuse. One
  history call keeps to ONE timeout budget (`5.582`). Plausibility bounds are exclusive at 0
  for prices and network cost, inclusive for APY (`5.583`).
- **Small device-storage stores read storage ∪ their memory fallback** (`5.580`), through the
  one `lib/deviceStorage.ts` probe: a record whose save failed must stay on record for the
  session. These stores are NOT money guards — the ledger's `resolvedEventInstances` is.
- **Unit tests never reach the network.** The market route tests fake the upstreams at
  `fetch` with `src/test/marketUpstream.ts` (DeFiLlama/CoinGecko wire shapes; an unknown URL
  answers 404), so the route, the factory and the adapters still run for real. Before
  `5.578` they sent 11 live requests per run.

## `/market` methodology + review-gate decisions (wave #614-#624, 2026-09-16)

- **`methodology.json` is v1.1.0 and the bump has a specific meaning — do not "tidy" it.** ETF-01's
  data route, universe, aggregation basis and window changed on 2026-07-11 (`6aadb3ca`): Polygon
  shares-outstanding × Yahoo price as NAV proxy, Friday-to-Friday, across **11** tickers, computed as
  `Σ (shares_t − shares_t−1) × price_t`. The 7±1 day week-span rule followed on 2026-09-14 (`5.301`).
  **MINOR, not MAJOR:** the 14-point scale, the eleven signals, the five bands and the four group
  ceilings are unchanged, so scores stay comparable across the boundary. **Not two retroactive
  bumps** — neither change was versioned at the time, and minting a `1.0.2` would invent a version
  history that never governed anything. Founder-ratified 2026-09-16.
- **Every run day in `run-archive.jsonl` predating that bump is PRE-VERSIONING and must never be
  retro-stamped** (`5.376`). We cannot know which method produced them, and stamping a version onto
  them would manufacture provenance. The forward stamp (`5.376` step 3) is still **blocked** on the
  diboas-analytics lane correcting doc 02 §9/§8.3.
- **The methodology document exists TWICE** — `data/market/shared/methodology.json` (published by the
  two view loaders) and `analytics-sdk/fixtures/methodology.json` (the swap-seam fixture). **Bump
  both or neither.** `fixtures.test.ts` checks each file's shape in its own `describe`, so both pass
  while the two disagree; `METH-3` in `methodologyAttestation.test.ts` is what actually holds them
  together (`5.384`).
- **`methodologyAttestation.test.ts` deliberately does NOT assert which version is correct.** It
  asserts a semver `version` and a parseable `published_at` EXIST, and that the doc agrees with the
  engine on the numbers. Which version is right is a methodology decision (`5.132(a)`); a test
  pinning it would assert authority it does not have. **Do not "strengthen" it by hardcoding a
  version.**
- **The published methodology comment attributes what it cannot verify.** Its description of doc 02's
  _prior_ text is marked as coming from `5.132(a)` and explicitly not re-verified, because doc 02 is
  not readable from this repository. Keep that attribution if you edit the comment — an unattributed
  claim inside a provenance artefact is the failure the artefact exists to prevent.
- **`scripts/review-gate.mjs` resolves the register repo-relative FIRST, then `REVIEW_REGISTER_PATH`,
  then FAILS — never SKIPs** (`5.382`, founder-ruled). Repo-relative is unchanged so the main
  checkout is unaffected; a worktree (where `docs/` is gitignored) must export the env var. The
  earlier SKIP made the id-collision guard inert in the one lane that writes from a worktree, and a
  SKIP reads as a pass in a green run. Safe to fail loudly because the runner is invoked by **no CI
  workflow** — verified, not assumed. Do not restore the SKIP.
- **`scripts/review-gate.mjs` is a TWO-LANE file.** The market lane owns `checkRegister` and
  `checkExports`; `checkCounts` is the webapp lane's (`5.323` + their `5.387`, same function).
  Announce in `docs/cc-sync/market-sandbox.md` before editing it.
- **Evidence persistence: identity, idempotency and activation are three different
  things, and each has a rule that must not be "simplified"** (`5.426`, F-A, 2026-09-21).
  **Identity** is `kind:subject:unit` with all three segments mandatory — the unit is
  identity because a value in EUR is not the same persisted fact as the same measure in
  USD; conversion is provenance. `source` is deliberately NOT identity: canon §19 means a
  provider swap must not sever the history of one real-world fact. Build keys only through
  `evidenceKey()`; an ad-hoc template literal is the second derivation of one fact (X1).
  **Idempotency** is `sha256` over identity + base observation identity + _conversion
  observation identity_, and **never the value** — dropping the conversion half lets a
  re-fetched FX rate collide with its own base, and adding the value makes every correction
  a new record instead of a reportable contradiction. **Activation** is one guarded
  statement; do NOT remove `WHERE evidence_active.record_seq < EXCLUDED.record_seq`, and do
  NOT re-add a second pointer field — an earlier draft carried `record_id` AND `record_seq`
  with only the id FK-bound, so the seq driving the CAS could disagree with the row it
  pointed at. ⚑ **The CAS orders INGESTION, not freshness**: a record observed earlier but
  ingested later becomes active, and that is correct for F — freshness is H's. Do not
  "fix" it here. **The LC-LIC-01 lane** (`evidence/eligibility.ts`) is an allow-list that
  fails safe: adding a source to `EVIDENCE_SOURCES` must never make it persistable.
  Migrations `005`/`006` are additive and one-statement; **rollback is stop-ingestion +
  delete the pointer row, never `DROP TABLE`** once real records exist. Guards: `EVID-1`..`EVID-6`.
- **`checkCounts` classifies by DOCUMENT CONTEXT as well as by sentence, and the ORDER is load-bearing**
  (`5.419`, 2026-09-21). `isDatedRecord` treats a dated filename **in a recognised record location**
  (`RECORD_LOCATIONS`, today `docs/audit/` alone) as a RECORD of what
  was measured then, never a live claim — the repository's own convention, measured: `docs/audit` 86/91
  dated, `docs/tech` 0/30, ROOT 0/3, tracked markdown 0/34. **Do not promote it above the ambiguity and
  marker tests.** It sits LAST on purpose, so it can only intercept what would otherwise become a live
  claim and can never convert an existing FAIL into a pass; moving it up would silently swallow the
  marker-plus-"current" ambiguity FAIL. **Do not replace it with a `docs/audit/` directory rule** — that
  was rejected by measurement, because the gate's own spec requires a count planted in an UNDATED
  `docs/audit` fixture to keep failing. **Do not restore `claims.size <= 1`**: the verdict is `=== 1`,
  because `<= 1` passed on ZERO and an over-broad classifier would then report green. The rule excludes
  **0** occurrences of the pre-existing corpus; its first real interception is `5.419`'s own increment
  record, which states the workspace total in plain prose. The bucket is printed every run, at 0 when
  idle — that is deliberate visibility, not dead code — and cases A–E in
  `apps/sandbox/src/lib/__tests__/authGate.test.ts` are what prove the behaviour.
- **Anything added under `apps/web/src/lib/market-data/__tests__` or `analytics-sdk/__tests__`
  becomes a WEEKLY RELEASE GATE**, because `market-refresh-weekly.yml` step 11 runs those directories
  whole. Declare it in `releaseGateBoundary.test.ts` with a class and a reason, and never assert a
  value that changes weekly. Four of the last five weekly failures came from exactly that
  (`5.363`/`GATE-BOUND-1`).
- **Run `pnpm market:simulate-next-week` AFTER committing**, not before: its dirty-tree guard refuses
  an ambiguous rollback while `data/market/` is modified.
- **An evidence ORIGIN is looked up, never typed** (Block A, 2026-09-24). `originOf(SOURCE, subject)`
  reads an exhaustive `Record<EvidenceSourceId, Record<EvidenceSubject, …>>` where every entry states
  its BASIS. **Do not reintroduce an origin literal in an adapter** and do not add a default — a
  default would restore the silence the table exists to remove, and canon states
  `EXTERNAL SOURCE ≠ AUTOMATICALLY OBSERVED` in five documents. ⚑ **Origin is not semantics:** the
  DeFiLlama APY entries carry `pendingSemantics` because what the rate COMPOSES is a separate
  question; do not read a truthful origin as evidence that the semantics were settled. Guards:
  `EVID-8`.
- **An out-of-bounds value is REFUSED, never clamped** (Block A). The bounds API returns a reason or
  a boolean and **structurally cannot hand back a repaired number** — keep it that way. A clamped
  value is a fabricated value. The ceilings are CORRUPTION thresholds set far above any catalogue
  protocol on purpose: tightening one turns it into an unratified economic opinion about what a rate
  is allowed to be. `VALIDATION ≠ ECONOMIC TRUTH GUARANTEE`. Guards: `EVID-9`.
- **Health is not eligibility, and it never reaches Product** (Blocks A/F). `sourceHealth` exists so
  nothing can CLAIM a failing source is fine; `fallbackFor` is untouched by it, and that is asserted.
  Do not let a health reading gate collection, select a fallback or refuse a value — that would make
  a reporting path into a control path. Same relationship freshness has to eligibility
  (`5.110`: _freshness grants nothing_). The module is deliberately **not** exported from the
  package barrel. Guards: `EVID-10`, `PROV-4`.
- **`PROVIDER ID ≠ DOMAIN IDENTITY`** (Block B). `ProtocolReturnModel`'s market arm carries `asset`
  (a `MarketAssetId` diBoaS owns); each source's spelling lives in the per-source map in
  `domainIdentity.ts`. **Do not put a vendor slug back on a domain type** — replacing a provider must
  add a row, never edit a type. `POOL_MATCHERS` LOCATES candidates broadly; the declared identity is
  what ACCEPTS. `USDC.E` must not satisfy `USDC` (different pool, different rate), and an
  `UNDETERMINED` composition is refused, not shown with a caveat. Guards: `EVID-11`. **Acceptance is
  applied WHILE ranking, not after** (`matchPool(…, accept)` via `acceptedPool`; lane audit 2026-10-21,
  `5.593`): ranking first let a refused, larger pool hide an acceptable one. Malformed `/pools` rows are
  skipped, never thrown on: one bad row must not take every leg down for the cache's 6 hours.
- **A replay series is validated once, in the contract** (Block C). Both adapters build through
  `buildHistoricalSeries` and project outward. **Never add a fill/pad/interpolate path**: a gap makes
  the SERIES unavailable (`5.105`). **"No gap" means one point per CONSECUTIVE real calendar day**
  (`datesAreConsecutiveDays`, applied by the server builder AND the client boundary; lane audit
  2026-10-21, `5.592`). "Ascending" alone let a missing day through, and the replay, which walks by
  position, then read every later day's value early. The replay also checks that each index holds the
  date it stands for (`indexFromDate`), so a gapped series refuses the span even if it arrives some
  other way. A parser must not DROP a bad point to keep the series: dropping it makes a gap. `via` records how the series was obtained; `STORED_SNAPSHOT` and
  `HIGH_FIDELITY` are declared with no producer so the plan's later paths need no Product-facing
  change. `derivedAt` is the THIRD timestamp and is **not defaulted** — never back-fill it from a
  clock, and never let scheduler time become `observedAt`. Guards: `EVID-12`.
- **FX is its own evidence class, and no eligible current source supplies a RATE** (Block C).
  `fxObservedRate` returns controlled-unavailable by design. **Do not manufacture a rate by dividing
  two denominated prices** — that is a fabricated FX observation, prohibited by name in the ratified
  plan §14.1. Guards: `EVID-12`.
- **Retention is per class, and required coverage vs permitted rights is a CONJUNCTION** (Block D).
  `REPLAY_HISTORY` is COVERAGE (365 + boundary), not a TTL, and a COVERAGE class is **never** expired
  by the elapsed-clock path — ageing it out makes a reachable replay silently unreachable. **Do not
  turn `reconcileRetention` into a `min()`**: a shorter-than-required window that calls itself
  compliant is the failure it exists to prevent; the refused verdict carries no usable window.
  Persistence is a DECLARED right per source — widening one is a Legal/Founder data change, because a
  material expansion of retention is an explicit review trigger (`03 §8`). Guards: `EVID-13`.
- **The Practice policy DECLARES; the seams ENFORCE** (Block E). `PRACTICE_REFERENCE_POLICY` asserts
  the ≤6h ceiling by **identity** with the constant the cache uses, never by copying it. **Do not add
  enforcement to it** (a second path to keep in agreement) and **do not key it on mode** — a policy
  branching on Practice/Real is exactly the collapse the four truth axes forbid. Real's policy differs
  in its values, not its shape. Guards: `EVID-14`.
- **A degradation must be visible, and observability must stay reporting-only** (Block G). Events
  carry subject, source, outcome and a CLOSED reason code — **never a value, payload, url, key or
  body** — the buffer is bounded (an unbounded buffer in a long-lived process is a leak with a helpful
  name), recording never throws, and the module performs no I/O. **Do not let it change a decision.**
  Guards: `OBS-2`.
- **`apps/sandbox/src/lib/__tests__/authGate.test.ts` exercises the REAL gate against the REAL
  repository.** A wording change in `CLAUDE.md` can turn 7 sandbox tests red: words like _historical_,
  _prior_, _baseline_ and _was_ are RESERVED in the sentence around a published test count, because
  `checkCounts` reads them as historical markers (`review-gate.mjs:393`). Prose in a living document
  is INPUT to a mechanical gate.
- **Two states that documentation must never be allowed to collapse** (Strategy release
  closure, 2026-09-24). Both are the intended current seam, not defects:
  - `BLOCK G = MINIMUM USEFUL OBSERVABILITY INCREMENT` **≠** a complete market-evidence
    observability system. Instrumented: the DeFiLlama current-APY degrade paths. **Not**
    instrumented: the CoinGecko price path, both history paths. No drain, no persistence;
    the buffer is process-local and restart-volatile. **Do not later describe this as full
    end-to-end observability** (`5.446`).
  - `PERSISTENCE ARCHITECTURE READY` **≠** `ALL HISTORICAL EVIDENCE IS CURRENTLY PERSISTED`.
    Per-class retention, the persistence rights model and the provider-neutral replay
    contract are implemented; real provider history is **not** persisted and **F-B**, the
    first real replay consumer, is **not built** (`5.447`).
- **`ECONOMIC IDENTITY ≠ SYMBOL SIMILARITY`** (`5.442`, closed 2026-09-24). `jupiterJlp` has
  **no valid current-rate source** in the DeFiLlama feed: every JLP-bearing pool is either
  JLP used as lending collateral (0 %), a two-sided JLP DEX pair (0.7–24 %), or the unnamed
  `project-0` pool. **Do not substitute any of them.** The leg is CONTROLLED UNAVAILABLE and
  the refusal is already enforced by Stage H — a 68-day-old fixture is `MISSING`, so every
  strategy containing the leg is `REFUSED_BY_CONTRACT` and renders as unavailable.
  ⚑ **Do not pull the refusal into the provider:** `5.355` rules that consumer enforcement
  belongs to H, which sits behind F/G. ⚑ **The JLP-substitution prohibition above is
  UNCHANGED and still binding.**
  ⛑ **SUPERSEDED FOR MARKET LEGS, 2026-09-24 (`5.444` RULED).** This paragraph used to end
  _"Open and NOT Engineering's to answer (`5.444`): whether a market/price-return leg needs a
  current APY at all. Until Strategy + M&E + Product rule, preserve the controlled-unavailable
  behaviour."_ That is now **false as an instruction** and is quoted rather than deleted so
  the change of state is legible. The ruling is
  **`LEG → ECONOMIC RETURN MECHANISM → REQUIRED EVIDENCE`, never `EVERY LEG → APY`** — see
  the `TYPED CATALOGUE EVIDENCE REQUIREMENT` entry below.

- **`THE INSTRUMENTS ARE GUARDED TOO`** (Pre-I2 Block D, 2026-09-25). Four gates now enforce
  discipline this repository previously kept only as prose. Read this before writing or
  narrowing any guard.
  - **`PROSE-1`** — a record must cite every requirement its own controlling plan asserts
    (heading-level `required`/`must`/`mandatory`/`minimum`). It exists because **three of the
    `5.444` lane's five defects were prose contradicting the plan or the code**, and no
    instrument could see any of them. ⚑ It proves a requirement was not skipped in SILENCE;
    it cannot judge whether prose is true. Do not widen it to plan BODIES — measured, that
    flags 19 of 25 sections and becomes noise. ⛑ **2026-10-16 (R4-6):** a record checked against
    zero headings is listed as a PROVEN N/A with its measured reason; ids match as whole numbers;
    a record's own numbered heading is not a citation; block labels are exact (`BLOCK_E_`,
    `BLOCKS_EFG_`). ⚙ **`DOC-1` is two layers (R4-5):** the verdict classifies a private
    reference by git's ignore policy — never by the local disk — so it is identical in every
    clone; `review:doc1-local` verifies private targets only where their area exists here, FAILS
    a missing target or an unknown area when a private corpus is present, and is a SKIP when none
    is. A marker excuses only the reference it follows. ⛑ **2026-10-15:** a citation is the § number,
    the heading's TITLE, or every register id the heading names — never one shared word (that
    let "observability unchanged" satisfy §16); an unresolvable controlling-plan citation FAILS.
    It is manual and local (it reads gitignored `docs/audit`), not a CI gate.
  - **`EVID-15`** — no production read of a provider FORECAST field, and the adapter's
    `LlamaPool` interface may not declare one. `predictions.predictedClass` is prohibited on
    a Product surface under Voice Q3 without new authority. Guard the doorway, not just the room.
    ⛑ **2026-10-15:** it scans `apps/sandbox/src` too (its header always claimed so) and bans
    the parent `predictions` object, so passing it along whole is caught.
  - **`VAC-1`** — every `it()` in `packages/{defi,banking,investing}` and `apps/sandbox` must
    assert something. ⚑ It caught a regression within minutes of being built, when a regex edit
    emptied an S1 test of every assertion. `apps/web` is excluded (WEBSITE lane). ⛑ **2026-10-15:**
    tests are read by the TypeScript PARSER — a body is exactly its callback and an assertion is a
    real call, never a word in a comment or string; `it.todo` is exempt.
    ⛑ **2026-10-16 (R4-4 + correction):** an assertion is a matcher call on `expect(…)`, an
    `assert…` / `expect<Helper>(…)` call or `expect.assertions` — not an identifier named
    `expected` or a bare `expect(x)`. It counts only where it RUNS: liveness spreads from the
    test body to functions passed to a call, invoked in place (an `async` one only if awaited or
    returned) or called by name from live code; `then` / `rejects` / `resolves` chains count only
    if awaited or returned; dead branches (`if (false)`, `while (false)`, `false && …`, loops over
    `[]`, code after `return`) never count. Skipped tests and suites are flagged, including
    `it.skipIf(true)` / `it.runIf(false)` (a non-constant condition counts as running); an `async`
    helper runs only through an awaited or returned call; a promise held in a variable is settled
    only by an `await` / `return` in REACHABLE code (R4-4, third review); aliases,
    `test.extend`, `import * as v` and `const spec = it` are recognised; a parse error FAILS.
    SCOPE LIMIT: a source reading, not an execution — a condition false only at runtime, or a
    helper that swallows its own failure, is not detected.
    ⚑ **Do not go back to scanning braces by hand** — the scanner could not see regex literals.
  - **`CUR-2`** — no bare 2-decimal amount in any locale string. Closes a blind spot that was
    **still live**: `CUR-1` filters currency SYMBOLS, so `"This costs 500.00 …"` passed the
    whole suite. ⚑ Excluding a trailing `%` is load-bearing — without it the rule flags the
    reference fee `0.39%` in 12 existing strings and would be abandoned. ⛑ **2026-10-15:** the
    integer part may be plain `\d+`, so `1000.00` / `12345.67` are caught (the first pattern
    could not see an ungrouped 4+-digit integer); still zero false positives in four catalogues.
  - **Source-scanning guards strip comments with the TypeScript PARSER** (`CI-N1`, `CI-N3`,
    `PRU-1` via `apps/sandbox/src/test/stripComments.ts`, 2026-10-15). A regex stripper deleted
    everything after `//`, so code following a URL in a string was never scanned. JSX text is
    not trivia: `<p> // docs</p>` is visible text, and a comment range starting inside it is kept.
    ⛑ **2026-10-16 (R4-3):** never walk INTO a JSDoc node — from inside `/** … // old */` the trivia
    scanner read the rest of the line as a comment and blanked the code after `*/`. A corpus
    test proves every code token survives. The same parser now backs `review-gate.mjs`'s exports
    row, whose regex copy hid a consumer that followed a URL string. CI-N3 and PRU-1 read
    imports through one shared parser, `apps/sandbox/src/test/importGraph.ts` (static, re-export,
    `import()`, `require()`, `import = require`, any `.js`/`.ts` suffix); CI-N3 judges REACH
    through the import graph, so a write behind a hook or a barrel is seen.
    ⚑ **Do not go back to a regex stripper.**
  - ⚑ **EVERY ONE carries a planted positive AND a negative control**, and each was MEASURED
    against the real corpus before being written. A guard that cannot fail, or that fires
    wrongly, is worse than no guard: the first lies, the second gets ignored.

- **`A FAKE RE-ENTRANCY FLAG IS WORSE THAN NONE`** (`5.108`, 2026-09-25). The `busy` flag in
  `WeeklyCycleScreen` / `RulesBuilderScreen` / `GoalDetailScreen` is **removed**. Each handler
  did `setBusy(true)` → a SYNCHRONOUS engine call → `setBusy(false)`, so React batched them and
  `busy` was never observed `true`: every `if (busy) return` was unreachable and every
  `disabled={busy}` a no-op. It could not be repaired — there is nothing to await.
  ⚑ **Do not reintroduce it.** ⛑ **Narrowed 2026-10-15 — the protection differs per action:**
  the WEEKLY cycle is guarded by engine-side idempotency (proven by `weeklyCycle.test.ts`
  _"harmless no-op on a double tap"_); a single EXIT refuses a position that is not open; STOP-ALL
  returns when nothing is open; RULE creation refuses a second active rule. **Strategy ENTRY has
  no domain idempotency** — `enterStrategy` mints a new `positionId` per call, and only UI state
  (the confirmation's reset) stands between a double tap and two positions. That is plan item
  P8d, not a solved case. Synchronous execution explains why `busy` was inert; it is not
  idempotency.

- **`TYPED CATALOGUE EVIDENCE REQUIREMENT`** (`5.444`, ruled + implemented 2026-09-24;
  `MERGED TO MAIN = NO`). A leg is asked only for what its **return mechanism** produces. An
  accrual (`lending`) leg owes a current rate, because the rate IS its return. A `market`
  leg owes nothing, because its return is its **price** — so a missing APY for it is not
  missing evidence, and it must never make a strategy unavailable.
  - **The single derivation is `legRequiresCurrentRate`** (`packages/defi/src/catalogueEvidence.ts`),
    resolved from `domainIdentityOf(...).kind`. Three production consumers read it:
    `rateAvailability.ts`, `provenance.ts`, `StrategyPicker.tsx`. ⚑ **Do not re-derive this
    question anywhere else, and never branch on a protocol id** — `jupiterJlp`, `sanctumInf`
    and `jito` behave identically because they are TYPED identically, not because any of them
    is named. `rateAvailability.ts` contains no protocol id at all, deliberately.
  - **AVAILABILITY and DISPLAYABILITY are two questions.** `strategyRateAvailability` decides
    whether a strategy may be offered; `strategyRateDisplay` decides whether a
    `Current pool rate` may be STATED. Collapsing them is what let a secondary representation
    gate a whole strategy. A heterogeneous strategy is **available with no rate**.
  - **Never renormalise a partial blend.** `strategyRateDisplay` returns on the FIRST
    non-accrual leg, before any arithmetic, so it structurally cannot emit a sum over weights
    that do not total 100. Measured: production blended `0.70 × skySsr + 0.30 × sanctumInf`
    and published it as one _"Current pool rate … (real, variable)"_ — a lending APY averaged
    with an LST leg's reported APY under a single label.
  - **`MISSING ≠ 0` at the blend.** The replaced `blendedApy` read `apyPercent ?? 0`; a guard
    (`rateUnavailableInvariants.test.ts`) now fails if that name returns.
  - **The separator needs a left operand.** The meta line is
    `<rate clause> · <growth exposure>`; when the rate clause is withheld the middot goes with
    it. Shipping it unconditionally rendered a leading orphan mark in all four locales, found
    only by a rendered-string check at 375 px.
  - ⚑ **Growth exposure is a property of the STRATEGY, not of today's rate** — it stays true
    and stays rendered on every card that loses a rate.

  - ⛑ **An unsupported leg kind THROWS** (2026-10-15). The switch is exhaustive at compile
    time; at runtime an unknown kind used to return nothing, which made `legRequiresCurrentRate`
    answer "needs no current rate" — a silent default towards requiring NO evidence. Neither
    default is acceptable; `s1.catalogueEvidence.test.ts` pins the throw.

- **`CATALOGUE DECISIONS ARE OBSERVABLE, AND BOUNDED`** (`5.444` §16, 2026-09-24).
  Two decisions are recorded through the existing bounded ring: a leg resolving to
  `NOT_REQUIRED` (naming the leg, `source: null` — no source was consulted), and a refusal
  naming **which** leg's required evidence was missing.
  - ⚑ **`leg` carries a diBoaS catalogue `ProtocolId` — a DOMAIN identity, never a provider
    id, pool id or vendor SKU** (`PROVIDER ID ≠ DOMAIN IDENTITY`).
  - ⚑ **Use `recordEvidenceEventOnce` for decisions reached in a RENDER path, and
    `recordEvidenceEvent` for provider outcomes.** Measured: one picker render at
    `horizon=any` evaluates 29 legs, 9 of them market legs, and the ring holds 500 — recording
    per call fills it in ~20 renders and evicts the provider-degradation events. **Provider
    events must never be de-duplicated:** a source failing five times is five pieces of
    information.
  - ⚑ **The de-duplication window and the ring live in ONE module and are cleared together.**
    An earlier revision split them, so `drainEvidenceEvents()` emptied the ring while the
    window survived — a host wiring the drain would have been silently starved. Do not move
    the window out of `evidenceObservability.ts`.

- **`A CROSS-PACKAGE TEST READS dist/, NOT SOURCE`** (Block G, 2026-09-25; register `5.452`).
  `@diboas/banking|defi|investing` resolve through `package.json#exports` to `dist/`. A test in
  `apps/sandbox` that imports one of them asserts against the **last build**.
  - ⚑ **CI is not affected** — `turbo.json` declares `test: dependsOn ['^build']`. A direct
    `pnpm --filter <ws> exec vitest` run IS affected, and **it silently defeated two Block G
    sabotages**: planting `projectedBalance` on `projectionDisplay` and planting a PRU field on
    the goal reducer both left the sandbox tests GREEN while the source was mutated.
  - ⚑ **A gate whose verdict depends on how it was invoked is not a gate.** Any assertion about
    a PACKAGE's source belongs in that package's own suite, where the import is source-relative.
    `CI-N3` and `PRU-1` are each split across two files for exactly this reason — the split is
    deliberate, not accidental duplication, and each file says so in its header.

- **`THE RATE LIMITER'S FALLBACK IS A LIMITER`** (`5.213`, 2026-09-25).
  `apps/sandbox/src/lib/security/rateLimiter.ts` is two-tier: Upstash Redis (a sliding window)
  when configured, a per-instance FIXED window when not.
  - ⚑ **Unconfigured Redis must degrade the limiter from DISTRIBUTED to PER-INSTANCE, never to
    ABSENT.** Sabotage-proven (fail-open fallback ⇒ 6 tests FAIL).
  - ⛑ **The Redis tier is the LIVE one** (2026-10-15: `UPSTASH_REDIS_REST_URL` /
    `UPSTASH_REDIS_REST_TOKEN` are set for Production and Preview — names measured, values never
    read). ⚑ **`@upstash/ratelimit` resolves `success: true, reason: 'timeout'` when Redis is
    slow** ("allow requests in case of network problems"), so a timed-out answer is NOT trusted:
    the local window decides. The call is bounded to 1 s (the library default was 5 s), and the
    in-memory window is capped at 10 000 clients. Proven through an injectable `RemoteLimiter`
    seam (refusal, allowance, timeout, throw), each sabotaged.
  - ⚑ **An unidentifiable caller collapses to ONE shared bucket (`'unknown'`), never to
    unlimited.** Otherwise the control is removable by deleting a header.
  - ⚑ **The fallback is PER INSTANCE — no global bound is demonstrated** (2026-10-16): during
    intermittent Redis failure a timed-out request is judged by its instance's own window and an
    answered one by Redis, so one client can be admitted by both tiers and several instances.
    An IPv6 client is keyed by its full address (documented by a unit test). Changing either is
    a rate-limit POLICY decision, not an engineering default.
  - ⚑ **The 429 is `no-store`.** The market routes are CDN-cached; a cached 429 would refuse
    every other client from the edge for the life of the entry.
  - ⚑ **The guard sits AHEAD of every provider call**, and a test asserts the provider count is
    zero on a limited request. A limiter after the fetch has limited nothing that costs
    anything. ⚑ **`/api/health` is deliberately NOT limited** — a liveness probe that can be
    rate-limited reports the limiter's state, not the service's.

- **`A DENIAL IS CLASSIFIED BY EXACT REVIEW, NEVER INFERRED BY THE DETECTOR`** (2026-10-16; was _"a compliance detector must tell an assertion from its denial"_, `CI-N4` / `CI-N2`, 2026-09-25;
  rewritten 2026-10-15 to keep ruling text out of this public file — requirement ids
  `LC-RR-01-02`, `LC-RR-01-10`, `LC-RR-01-11` are cited, their texts live in the private canon).
  Measured before either rule was chosen: a bare guarantee/promise token matches **12 sandbox
  strings**, and every one is a NEGATIVE statement the product deliberately carries
  (_"returns aren't guaranteed"_, _"No promises live here"_). A banned-word grep would have made
  the compliant catalogue red.
  - ⚑ **`CI-N4` blocks an UNQUALIFIED expectation of return**; a modelled / assumption-qualified
    phrasing passes by design. ⛑ **2026-10-15:** each CLAUSE is judged on its own — a denial or a
    qualifier anywhere in a string used to excuse every claim in it — and non-vacuity comes from
    in-test probes, never from website copy (fixing the website must not turn this gate red).
    ⛑ **2026-10-16 — PB-3 exact-text denial exceptions (founder decision).** Inferred negation
    and punctuation no longer pass anything (a qualifier WORD still satisfies rule 1, by its
    stated scope). A detected claim FAILS unless an exact, reviewed exception in
    `apps/sandbox/src/test/denialExceptions.ts` covers it (guard · rule · locale · key · sha256
    of the full text; a changed word, another key or another locale does not inherit it; a stale
    entry FAILS). Five review rounds each found claims the negation-attachment rule excused
    ("No return under 8%, guaranteed.", "No fees (bonus every week)."), so it was removed, not
    tightened again. The `?` exemption is gone (R4-12): punctuation never excuses a claim.
    Guarantee/return words match only at a word start ("compromisso", "Vertrag"); qualifier words
    are projection words only ("project" does not qualify); percentages written as words are
    figures, also directly after a guarantee word ("We guarantee eight percent a year."); `/` bounds a
    qualifier's reach like a dash, while rule 2 stays per sentence; `rentabilidad(e)` is a return word. Rule 2 still requires a figure — that scope is
    an engineering scope choice, and widening it needs its own authority.
    ⚑ **Never go back to inferring denials** (proximity or attachment). An exception is an
    ENGINEERING classification of one sentence, never a Legal clearance.
  - ⚑ **`CI-N2`'s copy scope is measured, not assumed.** ⛑ **2026-10-15:** its three framing
    patterns, run over the WHOLE catalogue in four locales, match one key — the disclaimer that
    DENIES credits are Rewards — so the five-namespace filter was dropped; es / pt-BR / de
    vocabulary was added (ten planted phrasings had slipped through), and German compounds
    ("Einzahlungsbonus", "Willkommensprämie") are detected since 2026-10-16. ⛑ **2026-10-16:** a
    matched term FAILS unless an exact-text exception covers it (see the `CI-N4` entry above);
    the only exceptions are `common.playDisclaimer` in four locales (measured: 4 of 2,412 strings).
    ⚑ **Portuguese "no" is "in the", not a denial** — the negation words (now only a HINT in the
    failure message) live ONCE in `apps/sandbox/src/test/negation.ts`, shared by `CI-N2` and
    `CI-N4`, because two copies drifted and the Brazil guard missed "No depósito receba um bônus".
  - ⚑ **`CI-N2`'s primary half is the MECHANISM:** a benefit that scales with funding is the
    violation whatever it is called. Hold the genesis grant at the real constant and vary only
    funding — varying the grant instead trips `creditCeilingReached` and proves nothing about
    deposits. The position-conditioned comparison credit (`5.453`) is NOT covered and awaits a
    Legal ruling; an `it.todo` names it.

- **`THE ROOT ERROR BOUNDARY HAS NO PROVIDERS, AND THAT SHAPES IT`** (`5.206`, 2026-09-25).
  `apps/sandbox/src/app/global-error.tsx` REPLACES the root layout, so there is no
  `IntlProvider`, no `params`, and no guarantee that `globals.css`/`tokens.css` have loaded.
  - ⚑ **`FormattedMessage` would THROW inside the boundary that exists to stop throwing.** Copy
    is resolved directly from the catalogue via `getMessages()`. ⛑ **2026-10-15:** the locale is
    read through `useSyncExternalStore` (server snapshot `en`, client snapshot from the URL), so a
    server-rendered path cannot hydrate mismatched. ⚑ Measured on a production build: a
    ROOT-LAYOUT crash sends an empty error shell and renders this screen client-only, so the old
    code showed no mismatch there — this is defensive, not the fix of an observed defect.
  - ⛑ **"Try again" calls `retry()` when Next provides it (stable since 16.3.0), else `reset()`**
    (both boundaries, 2026-10-15). `reset()` only re-renders the same children, so after a
    server-render error it usually fails again; `retry()` re-fetches.
  - ⚑ **NO TOKENS, deliberately.** A token reference here can resolve to nothing and render
    invisible text. The inline styles are the documented exception and are neutral greys — this
    surface must never be where a palette is re-stated.
  - ⚑ **NO new copy.** It renders the same `error.title` / `error.body` / `error.retry` keys
    `(app)/error.tsx` uses, live in all four locales. A guard asserts all three exist per locale.
  - ⚑ **Do NOT add `not-found.tsx` on the strength of a local test.** `5.267` chose a middleware
    rewrite to `/{locale}/missing` carrying a real 404; a `not-found.tsx` renders outside its own
    layout with no `<html lang>` and no locale. ⚠ **UNVERIFIED IN PRODUCTION (2026-10-15):**
    `next start` serves the branded page, but production answers `/en/missing` with Next's
    default 404 (`x-matched-path: /404`, cache HIT). Any change here is decided by evidence from
    a Vercel PREVIEW, not a local build (closure plan, Track R).

- **`BOTH BOUNDARIES REPORT THROUGH ONE SINK, AND THE EFFECT IS REF-GUARDED`** (`5.206`, R-4).
  `lib/monitoring/reportError.ts` is the single entry point; it is bounded (50), never throws,
  and carries **no PII** under an exact-key assertion. ⛑ **2026-10-15: the record carries the
  error's NAME (bounded to an identifier) and DIGEST only — never its free-text message**,
  because `project()` serialises the offending event into its message and an event can carry a
  Goal's free-text name. No pattern can redact free text reliably; leaving it out can. The full
  error still reaches the LOCAL console. The unused `'api'` surface was removed. ⛑ **2026-10-16
  (R4-14):** each field is read on its own and kept only in its shape — `name` only as an
  identifier STRING (an object `name` could later stringify to Goal text), `digest` only as a
  Next.js digest (a numeric hash or a `NEXT_…` code); a throwing getter costs only its field.
  - ⚑ **`reactStrictMode: true` double-invokes every effect in dev.** Unguarded, each crash
    reported TWICE — and a sink that duplicates is a sink you stop trusting. The ref is keyed on
    the error IDENTITY so a genuinely new error still reports. Same reason `useSettleToNow`
    carries a module-level lock.
  - ⚑ **The EXTERNAL sink stays deferred behind a CLO question.** `Logger.ts` flags `ownerKey`
    (the account `users.id`) the moment logs reach a third party. Attaching Sentry is a Legal
    decision, not an engineering default. **This seam does not mean errors reach a dashboard.**

- **`A PLANTED POSITIVE PROVES THE CASE IT EMBODIES, AND NOTHING ELSE`** (retro-audit 2026-09-25;
  `5.455` · `5.456` · `5.457`). Three gates already declared LIVE were found weaker than stated,
  and each failure survived because the one example anyone checked happened to miss it.
  - ⚑ **`VAC-1` scanned the test NAME as part of the body** — `it('should assert …', () => {})`
    read CLEAN. Its own fixture is called _"should look like protection"_, a name with no
    assertion word, so the defect was structurally invisible to the proof. **Give each pattern
    member its own control, and probe a case the fixture does NOT embody.**
  - ⚑ **A ONE-WAY SABOTAGE PROVES ONE WAY.** The register index's `AGREEMENT` check fired only
    on `row=CLOSED, index=other`; the reverse — the index claiming CLOSED over a live row —
    passed silently, which is how open work disappears from the open set.
  - ⚑ **A JS CHARACTER CLASS OF ASTRAL EMOJI NEEDS THE `u` FLAG.** Without it the class is
    UTF-16 code UNITS, so `[🔴🟠🟡🟢📋]` matched any emoji sharing the high surrogate `0xD83D`
    (`🔧 🚀 🔒 📌`). It made the gate miss a real defect AND invent a false one at the same time.

- **`A PROJECTION SURFACE DISCLOSES ITS BASIS AND ITS EXCLUSIONS`** (`F-R11`, founder-approved
  2026-08-31; promoted here 2026-09-25 by `5.460` because the ruling existed only in a register
  row — the invariant `documentation-lifecycle.md` §1 forbids).
  - **The rule:** a projection surface must disclose that the range is **7%–14% annual
    nominal** and that it **excludes fees, inflation, taxes and sequencing** —
    keyboard- and screen-reader reachable, in all four locales, adopting Legal's
    _"Illustrative projection"_ lexicon. Unparked from `CR-10` into the **Legal P0 batch**.
  - ⚑ **STATUS: the RANGE is disclosed, the QUALIFIER and EXCLUSIONS are not.**
    `SCENARIO_RATES = {conservative: 7, historical: 10, optimistic: 14}` and
    `projection.rangeLine` renders _"an assumed {low} to {high} percent"_. Measured across the
    sandbox catalogue: **0** strings carry nominal/fees/inflation/taxes/sequencing in an
    assumption context; **0** use the Legal lexicon.
  - ⚑ **Do NOT write this copy from engineering.** The wording is Legal's and rides the P0
    batch awaiting the founder's go. Recording the rule here is promotion, not implementation.
  - ⚑ `projection.caveat` (_"An assumption you can check, not a promise…"_) is honest and
    stays — it is **not** a substitute for this disclosure.
