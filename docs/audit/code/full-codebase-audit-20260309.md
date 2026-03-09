# Full Codebase Audit — diBoaS Platform

> **Date:** 2026-03-09
> **Revised:** 2026-03-09 (Rev 4 — CTO Board Fix Plan Review integrated, 3 execution risks + 4 improvements incorporated)
> **Scope:** Entire `diboas-platform` monorepo audited against the 12 Architectural Principles, `docs/*.md` coding standards, and project-specific conventions (CLAUDE.md).
> **Method:** Automated multi-agent scan of every `.tsx`, `.ts`, `.module.css`, `.json`, `.sql`, `.js`, `.sh` file in the repository. CTO Board independently verified CRIT-1 through CRIT-5 plus 15 additional findings — all confirmed. Cross-verification audit added 14 new findings.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 28 |
| MEDIUM | 45 |
| LOW | 45 |
| INFO | 19 |
| **Total** | **141** |

The codebase is well-architected with strong security patterns (AES-256-GCM encryption, HMAC blind indexes, CSRF protection, rate limiting, DOMPurify sanitization). The i18n system, error boundary layers, and SSR-safety patterns are solid. The main concerns are: (1) a **destructive design token generator** that would erase 2,500+ lines of production CSS if run, (2) **legacy dead code** (DualCtaSection, Cal.com integration, DreamMode alongside PreDream, **unused `proxy.ts` with insecure CSP**), (3) **insufficient test coverage** (10 test files for ~500+ source files), (4) **file size violations** throughout lib/ and components/, (5) several **accessibility bugs** (hardcoded English aria-labels, **49 hardcoded HTML IDs across components**, missing focus traps), (6) **legacy fee values** (0.09%/0.9%) in ~60 FAQ translation strings across 4 locales (compliance risk), (7) the entire **`(marketing)` route group** (40+ pages) contains Story A placeholder content, and (8) **SSR safety gaps** in analytics service singleton and consent utilities.

---

## Table of Contents

1. [CRITICAL Findings](#1-critical-findings)
2. [Principle 1: Domain-Driven Design](#2-principle-1-domain-driven-design)
3. [Principle 2: Event-Driven Architecture](#3-principle-2-event-driven-architecture)
4. [Principle 3: Service Agnostic Abstraction](#4-principle-3-service-agnostic-abstraction)
5. [Principle 4: Code Reusability & DRY](#5-principle-4-code-reusability--dry)
6. [Principle 5: Semantic Naming Conventions](#6-principle-5-semantic-naming-conventions)
7. [Principle 6: File Decoupling & Organization](#7-principle-6-file-decoupling--organization)
8. [Principle 7: Error Handling & System Recovery](#8-principle-7-error-handling--system-recovery)
9. [Principle 8: Security & Audit Standards](#9-principle-8-security--audit-standards)
10. [Principle 9: Performance & SEO Optimization](#10-principle-9-performance--seo-optimization)
11. [Principle 10: Product KPIs & Analytics](#11-principle-10-product-kpis--analytics)
12. [Principle 11: Concurrency & Race Conditions](#12-principle-11-concurrency--race-conditions)
13. [Principle 12: Monitoring & Observability](#13-principle-12-monitoring--observability)
14. [Accessibility Audit](#14-accessibility-audit)
15. [Mobile-First / Desktop-Friendly Audit](#15-mobile-first--desktop-friendly-audit)
16. [Design System & Tokens Audit](#16-design-system--tokens-audit)
17. [Database & Migrations Audit](#17-database--migrations-audit)
18. [Tests & Coverage Audit](#18-tests--coverage-audit)
19. [Storybook Audit](#19-storybook-audit)
20. [Dead Code & Legacy Audit](#20-dead-code--legacy-audit)
21. [SEO Audit](#21-seo-audit)
22. [Scripts & Build Audit](#22-scripts--build-audit)
23. [Package & Monorepo Audit](#23-package--monorepo-audit)
24. [CTO Board Addendum — 9 Additional Findings](#24-cto-board-addendum--9-additional-findings)
25. [CTO Board Verification Audit — 6 New Findings + Cross-Verification](#25-cto-board-verification-audit--6-new-findings--cross-verification)
26. [CTO Board Fix Plan Review — Execution Risks & Improvements](#26-cto-board-fix-plan-review--execution-risks--improvements)
27. [Final Consolidated Fix Plan](#27-final-consolidated-fix-plan)

---

## 1. CRITICAL Findings

### CRIT-1: Design Token Generator Destroys Production CSS

| Field | Value |
|-------|-------|
| **Files** | `scripts/generate-design-tokens.js:271`, `turbo.json:8` |
| **Impact** | Running `pnpm generate:design-tokens` or `turbo build` overwrites `design-tokens.css` (2,585 lines of hand-maintained tokens) with a ~80-line auto-generated subset from `design-tokens.json` |
| **Root Cause** | Generator uses `fs.writeFileSync` to overwrite the entire file. The JSON source only has ~30 tokens; the CSS has hundreds of hand-added tokens. `turbo.json` declares `build` depends on `generate:design-tokens`. |
| **Fix** | Remove `generate:design-tokens` from `turbo.json` build dependencies. Either rewrite the generator to merge (not overwrite) or delete it and maintain CSS manually. |

### CRIT-2: Duplicate HTML IDs on B2C Landing Page

| Field | Value |
|-------|-------|
| **File** | `apps/web/src/components/Sections/ExpandableSection/ExpandableSection.tsx:45,55` |
| **Impact** | `id="expandable-content"` is hardcoded. B2C page renders 2 ExpandableSections (fees + under-the-hood), producing duplicate IDs. Breaks `aria-controls` association — screen readers link both toggle buttons to the first content region. HTML spec violation. |
| **Fix** | Use `React.useId()` to generate unique IDs per instance. |

### ~~CRIT-3~~ → Reclassified as HIGH (see A11Y-ARIA below)

> **CTO Board decision:** Hardcoded English aria-labels are a real WCAG 2.1 AA violation affecting ~10 components, but they don't break functionality for sighted users or cause data loss. The actual critical items (CRIT-1, CRIT-2, CRIT-4, CRIT-5) can cause CSS destruction, layout breakage, or screen reader misbehavior at a structural level. Reclassified to HIGH — systematic P1 accessibility fix.

| Field | Value |
|-------|-------|
| **ID** | A11Y-ARIA (moved to Accessibility Audit section) |
| **Severity** | HIGH (downgraded from CRITICAL) |
| **Files** | `FAQAccordionDefault.tsx:232` (`'Collapse'/'Expand' question`), `MinimalNavigation.tsx:145` (`'Close menu'/'Open menu'`), `PreDream/ShareDreamSection.tsx:161` (`'Copy to Clipboard'`), `DreamMode.tsx:97,104`, `PreDream.tsx:89,94`, `ShareableCard.tsx:112`, `SocialProofSection.tsx:77`, `PageHeroSection.tsx:49`, `CarouselDots.tsx:40,59` |
| **Impact** | Screen reader users in non-English locales receive English-only labels. Violates WCAG 2.1 AA (3.1.2 Language of Parts) and project i18n standards. |
| **Fix** | Replace all hardcoded aria-labels with `intl.formatMessage()` calls using i18n keys from `common.json`. |

### CRIT-4: CSS Variable in Media Query (Never Matches)

| Field | Value |
|-------|-------|
| **File** | `apps/web/src/styles/shared/carousel-controls.module.css:29` |
| **Impact** | `@media (min-width: var(--breakpoint-desktop))` — CSS custom properties cannot be used in media queries per spec. This media query **never matches**, meaning desktop-specific carousel styles never apply. |
| **Fix** | Replace with literal value: `@media (min-width: 1024px)`. |

### CRIT-5: Semantic Token Misuse in Production CSS

| Field | Value |
|-------|-------|
| **File** | `apps/web/src/styles/semantic-components.css:634,646,701,732` |
| **Impact** | `var(--opacity-0)` used for `flex-shrink`, `padding-left`, `min-height`, `margin-top`. If `--opacity-0` is ever changed from `0` to any other value, layout breaks silently across the app. |
| **Fix** | Replace with `0` or a dedicated `--value-zero` token. |

---

## 2. Principle 1: Domain-Driven Design

**Rating: GOOD**

- Code is organized around business domains: landing pages, waitlist, security, analytics, monitoring, share, calculator, dream-mode
- Each domain is self-contained with clear boundaries
- Config files cleanly separated from components
- Cross-domain communication uses `ApplicationEventBus`

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| DDD-1 | LOW | `WaitlistVersionA.tsx` had hardcoded `landing-b2c` namespace (fixed in this session). `WaitlistVersionB.tsx:46` still has hardcoded `landing-b2c.waitlist.versionB.` prefix. | `WaitlistVersionB.tsx:46` |
| DDD-2 | INFO | `@diboas/email` package not documented in CLAUDE.md architecture section | `packages/email/` |

---

## 3. Principle 2: Event-Driven Architecture

**Rating: GOOD**

- `ApplicationEventBus` and `SectionEventBus` properly emit events for state changes
- Events include `eventId`, `eventType`, `timestamp`, `correlationId`, `domain`, `payload`, `metadata`
- Waitlist signup emits `WAITLIST_SIGNUP_SUCCESS` via event bus

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| EDA-1 | MEDIUM | `CalculatorToggleSection` does not emit an analytics event when user switches tabs. This is a meaningful user interaction per the principle. | `CalculatorToggleSection.tsx` |
| EDA-2 | MEDIUM | Duplicate event bus pattern: `ApplicationEventBus` (420 lines) and `SectionEventBus` (322 lines) share ~80% identical code (listeners Map, eventHistory, on/emit/validate/history). Should extract a generic `EventBus<T>` base class. | `lib/events/` |

---

## 4. Principle 3: Service Agnostic Abstraction

**Rating: GOOD**

- Components consume config interfaces, not concrete implementations
- Factory pattern for calculator variants, hero variants, carousel variants
- `CalculatorFactory` selects provider based on config
- Rate limiter has Redis primary + in-memory fallback
- Analytics abstracted behind service interface

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| SAA-1 | LOW | `CalculatorToggleSection` has hardcoded `landing-b2b.calculator.toggle.*` i18n keys. Should accept label keys via config/props for reusability. | `CalculatorToggleSection.tsx:31-32` |

---

## 5. Principle 4: Code Reusability & DRY

**Rating: GOOD with issues**

- ExpandableSection properly reused for B2C/B2B fees via `children` prop
- SocialProofSection reused via namespace pattern
- WaitlistSection reused via config-driven props
- Shared hooks: `useCarousel`, `useImageLoading`, `useSwipeGesture`, `useFocusTrap`

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| DRY-1 | HIGH | Two separate `analyticsService` singletons: `lib/analytics/service.ts` exports `AnalyticsServiceImpl`, `lib/analytics/error-resilient-service.ts` exports `AnalyticsResilientService`. Different APIs, different behavior. 9 components import from one, barrel exports the other. Confusing dual analytics pipeline. | `lib/analytics/` |
| DRY-2 | MEDIUM | Duplicate event bus code (~300 lines identical between `ApplicationEventBus` and `SectionEventBus`). | `lib/events/` |
| DRY-3 | MEDIUM | Performance monitoring spread across 5+ files: `performance-monitor.ts`, `usePerformanceMonitor.ts`, `PerformanceService.ts`, `PerformanceBudgets.ts`, plus configs. Significant concept overlap. | `lib/monitoring/`, `lib/performance/` |
| DRY-4 | LOW | B2B and B2C page files both manually spread WaitlistSection config properties instead of passing the config object directly. | `page.tsx:310-317`, `business/page.tsx:333-341` |

---

## 6. Principle 5: Semantic Naming Conventions

**Rating: GOOD**

- Components follow `[Entity][Action]Section` pattern
- Configs use `SCREAMING_SNAKE_CASE` with context
- CSS class names are semantic
- Event types follow `[Domain][Entity][Action]Event` pattern

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| SNC-1 | LOW | `colorUsage` and `diBoasColors` in `lib/colors.ts` should be `COLOR_USAGE` and `DIBOAS_COLORS` per SCREAMING_SNAKE_CASE convention. | `lib/colors.ts:2,91` |

---

## 7. Principle 6: File Decoupling & Organization

**Rating: NEEDS WORK**

The codebase has significant file size violations across components, services, and utilities.

### Components exceeding 150-line limit (most severe):

| File | Lines | Over By |
|------|-------|---------|
| `PreDemo/screens/WalletDetailsScreen.tsx` | 465 | 315 |
| `Sections/CalculatorFactory/CalculatorFactory.tsx` | 376 | 226 |
| `PreDemo/screens/BuyScreen.tsx` | 366 | 216 |
| `PreDemo/screens/ConfirmationScreen.tsx` | 360 | 210 |
| `FutureYouCalculator/FutureYouCalculator.tsx` | 317 | 167 |
| `Icons/ProfessionalIcons.tsx` | 313 | 163 |
| `Legal/LegalDocument.tsx` | 272 | 122 |
| `Share/ShareModal.tsx` | 267 | 117 |
| `FAQAccordion/.../FAQAccordionDefault.tsx` | 251 | 101 |
| `DreamMode/DreamModeProvider.tsx` | 238 | 88 |
| `HeroSection/.../HeroDefault.tsx` | 222 | 72 |
| `Share/ShareButtons.tsx` | 219 | 69 |
| `PreDemo/PreDemo.tsx` | 215 | 65 |

### Services exceeding 200-line limit (most severe):

| File | Lines | Over By |
|------|-------|---------|
| `lib/errors/ErrorReportingService.ts` | 494 | 294 |
| `lib/events/ApplicationEventBus.ts` | 420 | 220 |
| `lib/share/ShareManager.ts` | 369 | 169 |
| `lib/monitoring/AlertingService.ts` | 358 | 158 |
| `lib/monitoring/performance-monitor.ts` | 352 | 152 |
| `lib/performance/services/PerformanceService.ts` | 332 | 132 |
| `lib/analytics/error-resilient-service.ts` | 324 | 124 |
| `lib/events/SectionEventBus.ts` | 322 | 122 |
| `lib/monitoring/Logger.ts` | 317 | 117 |
| `lib/monitoring/service.ts` | 309 | 109 |
| `lib/performance/dynamic-loader.ts` | 304 | 104 |
| `lib/seo/metadata-factory.ts` | 300 | 100 |

### CSS files exceeding reasonable bounds:

| File | Lines |
|------|-------|
| `PreDemo/PreDemo.module.css` | 2,012 |
| `DreamMode/screens/screens.module.css` | 1,259 |

### Utilities exceeding 100-line limit: 19 files (see Fix Plan for full list)

---

## 8. Principle 7: Error Handling & System Recovery

**Rating: GOOD**

- 3-layer error boundary: global > route group > section-level (`SectionErrorBoundary`)
- `fetchWithRetry` utility with exponential backoff
- Image error fallbacks in ProseSection, HeroDefault, BenefitsCards
- Circuit breaker pattern in rate limiter (Redis → in-memory fallback)
- All loading.tsx and error.tsx files present in route groups

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| ERR-1 | MEDIUM | `WaitlistVersionB.tsx:52` uses `fetch()` directly instead of `fetchWithRetry` for referral code validation. Per CLAUDE.md, user-facing API calls should use fetchWithRetry. | `WaitlistVersionB.tsx:52` |
| ERR-2 | LOW | `delete-confirm` page is `'use client'` with no `generateMetadata` export. No title, no robots directives. | `(landing)/delete-confirm/page.tsx` |

---

## 9. Principle 8: Security & Audit Standards

**Rating: STRONG**

Excellent security posture:
- AES-256-GCM encryption with separate HMAC key for PII
- Timing-safe comparison (`crypto.timingSafeEqual`) for API keys
- CSRF origin validation with `new URL().origin`
- Rate limiting on all mutation endpoints (Upstash Redis + in-memory fallback)
- DOMPurify sanitization with strict ALLOWED_TAGS for FAQ HTML
- Email enumeration prevention (timing attack mitigation, deterministic dummy responses)
- CSP nonce per request in middleware
- Idempotency support on waitlist signup
- PII masking in logs

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| SEC-1 | MEDIUM | OG image routes (`/api/og/*`) have no rate limiting. Image generation is CPU-intensive; attackable for DDoS. 1-hour cache helps but doesn't prevent novel parameter abuse. | `api/og/*/route.tsx` |
| SEC-2 | MEDIUM | `window.open()` without `noopener,noreferrer` in 4 locations. | `DreamMode/ShareScreen.tsx:124`, `PreDream/ShareDreamSection.tsx:70,77,89`, `WaitingList/shareUtils.ts:21` |
| SEC-3 | LOW | `consentUtils.ts:141` — `getStoredConsent()` accesses `localStorage` without `typeof window !== 'undefined'` guard, while sibling functions have the check. | `CookieConsent/consentUtils.ts:141` |
| SEC-4 | LOW | `Logger.ts:194` stores last 100 log entries in localStorage. If sensitive data slips past sanitizer, it persists client-side. | `lib/monitoring/Logger.ts:194` |
| SEC-5 | LOW | Health ready probe checks Redis but not database. Load balancer could route traffic to instance that can't reach PostgreSQL. | `api/health/ready/route.ts` |

---

## 10. Principle 9: Performance & SEO Optimization

**Rating: GOOD**

- `optimizePackageImports` for 17 packages
- 9-group webpack splitChunks with 300KB budget
- Production compiler: `removeConsole`, `reactRemoveProperties`
- `memo()` on all section components
- `useCallback` for event handlers
- `next/image` with AVIF/WebP, proper `sizes`, priority loading
- Lazy rendering in CalculatorToggleSection (only active panel mounted)
- Dynamic imports for heavy components (DreamMode, PreDemo)
- PostHog lazy-loaded behind consent

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| PERF-1 | MEDIUM | `StructuredData` component renders `<script type="application/ld+json">` without `nonce` attribute. Root layout's own JSON-LD has nonce, but pages using StructuredData don't. May cause CSP issues in strict environments. | `components/SEO/StructuredData.tsx` |
| PERF-2 | MEDIUM | `Logger.logToStorage()` writes to `localStorage` with `JSON.stringify` of 100 entries on every single log call. Should throttle/debounce. | `lib/monitoring/Logger.ts:194` |
| PERF-3 | LOW | `useSwipeGesture` stores `touchStart` and `touchStartTime` as React state (`useState`), causing re-renders on every touch start. Should be `useRef` per CLAUDE.md guidelines. | `hooks/useSwipeGesture.ts:76-77` |
| PERF-4 | LOW | Three different base URL env vars (`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`) for the same value. Risk of divergence. | Multiple page files |
| PERF-5 | LOW | Duplicate `<meta name="description">` — root `layout.tsx:60` manually adds one, and Next.js generates another from the `metadata` export on line 37. | `app/layout.tsx:60` |
| PERF-6 | LOW | `WebVitalsTracker` sampleRate ternary is redundant: `process.env.NODE_ENV === 'production' ? 0.1 : 0.1`. | `app/layout.tsx:137` |
| PERF-7 | LOW | `dynamic` and `revalidate` conflict: `api/waitlist/stats/route.ts` exports both `force-dynamic` and `revalidate = 300`. Former overrides latter. | `api/waitlist/stats/route.ts:29-30` |

---

## 11. Principle 10: Product KPIs & Analytics

**Rating: ADEQUATE**

- `enableAnalytics` prop threaded through all section components
- `SectionErrorBoundary` includes analytics context
- `data-section-id` on all section wrappers
- Event bus for waitlist signup tracking
- Intersection Observer for impression tracking in some components

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| KPI-1 | MEDIUM | `CalculatorToggleSection` doesn't emit analytics event on tab switch. Missing tracking of which calculator users prefer. | `CalculatorToggleSection.tsx` |
| KPI-2 | MEDIUM | `ExpandableSection` doesn't emit analytics event when user expands/collapses content. Fees section expand rate is a key conversion metric. | `ExpandableSection.tsx` |

---

## 12. Principle 11: Concurrency & Race Conditions

**Rating: GOOD**

- `useCallback` with stable references throughout
- `setState(prev => ...)` functional updater pattern in ExpandableSection
- `AbortController` in `useWaitlistStats` for fetch cleanup
- `CleanupManager.destroy()` in `useCarousel`
- Timer IDs stored and cleared properly in most hooks
- `SafeInterval` utility for safe timer management

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| RACE-1 | MEDIUM | `BreadcrumbManager` monkey-patches `history.pushState`, `history.replaceState`, and `console.error` but never restores originals. No `destroy()` method. | `lib/errors/breadcrumbManager.ts:45-84` |
| RACE-2 | MEDIUM | `BreadcrumbManager` click listener added to `document` but reference not stored — can never be removed. | `lib/errors/breadcrumbManager.ts:91` |
| RACE-3 | LOW | `PreDemo/LoginScreen.tsx:17-36` — timer refs stored but no cleanup on component unmount. | `PreDemo/screens/LoginScreen.tsx` |
| RACE-4 | LOW | `setTimeout` for copy feedback in `WalletDetailsScreen.tsx:203-209` and `ShareDreamSection.tsx:98` not cleaned up on unmount. | Multiple |
| RACE-5 | LOW | `AnalyticsResilientService` — online/offline listeners never removed, no `destroy()` method, `retryTimeoutId` not cleared. Singleton pattern mitigates but isn't clean. | `lib/analytics/error-resilient-service.ts:272-279` |
| RACE-6 | LOW | `Navigation.tsx:20` — `closeMenu` missing from useEffect dependency array. | `Layout/Navigation/Navigation.tsx:20` |

---

## 13. Principle 12: Monitoring & Observability

**Rating: GOOD**

- Sentry integration for error tracking
- `ErrorReportingService` with breadcrumbs and context
- `MonitoringService` with global error handlers
- Health checks at `/api/health`, `/api/health/live`, `/api/health/ready`
- Structured logging with `Logger` class
- `data-section-id` attributes for analytics correlation

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| MON-1 | LOW | `boundHandleGlobalError` and `boundHandleUnhandledRejection` in `ErrorReportingService` are created but never attached as listeners (private methods called via delegation). Wasted allocation. | `lib/errors/ErrorReportingService.ts:59-60` |

---

## 14. Accessibility Audit

### Hardcoded English in Aria Labels (see CRIT-3 for full list)

### Missing Focus Trap

| ID | Severity | Description | File |
|----|----------|-------------|------|
| A11Y-1 | HIGH | Mobile menu dropdown in `MinimalNavigation.tsx` lacks `useFocusTrap`. When open, focus can Tab to background elements. | `MinimalNavigation.tsx:154-176` |

### Missing `prefers-reduced-motion` on Animated CSS

These CSS files define `@keyframes` but do NOT include `@media (prefers-reduced-motion: reduce)`:

| File |
|------|
| `Share/ShareableCard.module.css` |
| `Share/ShareModal.module.css` |
| `PreDream/PreDream.module.css` |
| `PreDemo/PreDemo.module.css` |
| `WaitingList/WaitingListModal.module.css` |
| `WaitingList/WaitlistConfirmation.module.css` |
| `WaitingList/WaitlistForm.module.css` |
| `DreamMode/DreamMode.module.css` |

### Duplicate HTML IDs (see CRIT-2)

Additional: `TreasuryCalculator.tsx` has hardcoded `id="calculator"`, `id="calculator-title"`, `id="cash-input"`, `id="rate-input"` that would collide with `CalculatorFactory` on the same page.

---

## 15. Mobile-First / Desktop-Friendly Audit

**Rating: MOSTLY GOOD — Violations in older components**

Project standard: All media queries should use `min-width` (mobile-first, progressive enhancement).

### Files using `max-width` (violation):

| File | Lines with max-width |
|------|---------------------|
| `CookieConsent/CookieConsent.module.css` | 45, 66, 97, 117 |
| `DreamMode/DreamMode.module.css` | 70 |
| `DreamMode/screens/screens.module.css` | 755, 796, 943, 1113, 1139 |
| `DreamMode/components/SimulationWatermark.module.css` | 36 |
| `Share/ShareableCard.module.css` | multiple |
| `Share/ShareButtons.module.css` | multiple |
| `Share/ShareModal.module.css` | multiple |
| `PreDemo/PreDemo.module.css` | 1893 |
| `WaitingList/WaitingListModal.module.css` | 388 |
| `WaitingList/WaitlistConfirmation.module.css` | 226 |

All recently added components (CalculatorToggleSection, ExpandableSection updates, TwoWorldsSection, CashflowExplainerSection) correctly use `min-width` only.

---

## 16. Design System & Tokens Audit

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| DT-1 | CRITICAL | Generator script would destroy production CSS (see CRIT-1) | `scripts/generate-design-tokens.js` |
| DT-2 | CRITICAL | `var(--opacity-0)` misused for non-opacity properties (see CRIT-5) | `semantic-components.css:634,646,701,732` |
| DT-3 | MEDIUM | `design-tokens.json` has tokens not in CSS, and CSS has hundreds of tokens not in JSON. The JSON/CSS relationship is broken — they are effectively separate systems. | `config/design-tokens.json` vs `design-tokens.css` |
| DT-4 | MEDIUM | Duplicate `.skip-link` definition: lines 13-25 with tokens, then line 872-873 with `@apply` — second completely overrides first. | `semantic-components.css` |
| DT-5 | MEDIUM | `PreDemo.module.css` (2,012 lines) has ~200+ hardcoded hex colors (#0f172a, #64748b, #0d9488, etc.) instead of design tokens. | `PreDemo/PreDemo.module.css` |
| DT-6 | LOW | 13 `!important` declarations for nav CTA buttons — indicates specificity architecture problem. | `semantic-components.css:353-374` |
| DT-7 | LOW | Commented-out CSS with typo: `var(-spacing-3xl)` missing second hyphen. | `semantic-components.css:508-509` |
| DT-8 | LOW | `font-weight: 600` hardcoded in `CalculatorToggleSection.module.css:30` instead of `var(--font-weight-semibold)`. | `CalculatorToggleSection.module.css:30` |
| DT-9 | LOW | Version mismatch: `design-tokens.json` has `version: "1.1.0"` but generated header says `1.0.0`. | `config/design-tokens.json` |
| DT-10 | INFO | Generated utility classes (`.typography-title-hero`, `.typography-body-subtitle`) appear mostly unused. | `design-tokens.css` |

---

## 17. Database & Migrations Audit

**Database: Neon (PostgreSQL) — Raw SQL migrations with `@neondatabase/serverless`**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| DB-1 | MEDIUM | No migration runner or versioning mechanism. SQL files are manually numbered (001-004) but must be run manually against Neon. Risk of missed or double-applied migrations. | `lib/database/migrations/` |
| DB-2 | MEDIUM | `waitlist_entries.updated_at` has `DEFAULT NOW()` but no `ON UPDATE` trigger. Column stays at insert time unless application explicitly updates it. | `001_waitlist_entries.sql:31` |
| DB-3 | LOW | `deletion_tokens.email_hash` (added in migration 004) has no `NOT NULL` constraint. Some rows could lack the blind index. | `004_deletion_tokens_encrypt_email.sql` |
| DB-4 | LOW | Redundant index: `email_hash` has UNIQUE constraint (implicit index) plus explicit `CREATE INDEX idx_waitlist_email_hash`. | `001_waitlist_entries.sql:34` |
| DB-5 | INFO | No ORM — raw SQL with manual TypeScript interfaces. Schema drift risk exists since there's no automated type generation from SQL. | `lib/database/schema.ts` |

**Good:** Encryption pattern is solid (AES-256-GCM + HMAC blind index). Tier system well-designed. Atomic counter-based position tracking.

---

## 18. Tests & Coverage Audit

**Rating: INSUFFICIENT**

Only **10 test files** for an estimated **500+ source files**. CLAUDE.md requires 80% coverage for `lib/`, `hooks/` and 100% for security utilities.

### Current Coverage:

| Area | Test Files | Coverage |
|------|-----------|----------|
| `lib/security/sanitize` | 1 (310 lines) | Excellent XSS coverage |
| `lib/security/encryption` | 1 (297 lines) | Good |
| `lib/utils/fetchWithRetry` | 1 (195 lines) | Good |
| `lib/errors/ErrorReporting` | 1 (150 lines) | Broken (constructor TypeError) |
| `lib/waitingList/store` | 1 (573 lines) | Comprehensive |
| `hooks/useFocusTrap` | 1 (68 lines) | Trivial (tests existence only) |
| `hooks/useWaitlistForm` | 1 (167 lines) | Good |
| `components/CookieConsent` | 1 (106 lines) | Good |
| `components/PostHogProvider` | 1 (102 lines) | Tests mock patterns, not real component |
| `api/waitlist/signup` | 1 (555 lines) | 2 tests broken (pre-existing) |

### Missing Test Coverage (Critical Gaps):

| Area | Priority |
|------|----------|
| `lib/security/rateLimiter.ts` | **P0 — security-critical, 100% required** |
| `lib/security/csrf.ts` | **P0 — security-critical, 100% required** |
| `lib/security/authentication.ts` | **P0 — security-critical, 100% required** |
| `middleware.ts` (CSP, locale) | **P1** |
| `lib/database/client.ts` | **P1** |
| Any component rendering tests | **P1** (requires jsdom) |
| Navigation/Footer components | **P2** |
| Error boundaries | **P2** |
| `@diboas/ui` Button | **P2** |
| `@diboas/i18n` utilities | **P2** |

### Broken Tests:

| File | Issue |
|------|-------|
| `ErrorReportingService.test.ts` | `TypeError: () => ({...}) is not a constructor` — mock factory returns wrong shape |
| `signup.test.ts` | 2 of 20 tests fail — expected 200 but get 500. Pre-existing. |

### Environment Issue:

`jsdom` is **not** in any `devDependencies`. `vitest.config.mts` uses `environment: 'node'`, preventing DOM-based component tests. CLAUDE.md mentions adding jsdom but it hasn't been done.

---

## 19. Storybook Audit

**Rating: MINIMAL — 6 stories for 30+ components**

### Components WITH Stories (6):

- `HeroSection` — 3 stories (responsive, variants, accessibility)
- `AppFeaturesCarousel` — 3 stories
- `FeatureShowcase` — 4 stories
- `OneFeature` — 3 stories
- `ProductCarousel` — 3 stories
- `UI/StrategyCard` — 3 stories

### Components WITHOUT Stories (all others):

All section components added in recent work (ExpandableSection, CalculatorToggleSection, CashflowExplainerSection, TwoWorldsSection, DualCtaSection, FeeTable, ScenarioCards, ProseSection, FounderSection, SocialProofSection, FAQAccordion, DemoLauncher, SectionContainer, BenefitsCards, BgHighlight, StepGuide, StickyFeaturesNav, etc.), plus all Layout, Share, WaitingList, CookieConsent, Legal, PreDemo, PreDream, DreamMode, FutureYouCalculator, and `@diboas/ui` Button.

### Recommendation:

**Keep Storybook but expand coverage.** The 6 existing stories are well-structured with responsive, accessibility, and theme variants. The pattern is good; it just needs to be applied to more components. Priority: landing page section components used in B2C/B2B pages.

---

## 20. Dead Code & Legacy Audit

### Legacy: Safe to Delete

| Item | Files | Reason |
|------|-------|--------|
| **DualCtaSection** | `components/Sections/DualCtaSection/` (3 files), `config/dualCtaSection.ts`, export in `components/Sections/index.ts` | Not imported by any page. Replaced by SocialProof + Waitlist sections. |
| **Cal.com Integration** | `config/env.ts:211-220` (CAL_CONFIG), any CalEmbed component references | User confirmed legacy. Cal.com links in dualCtaSection config. No npm package installed. |
| **Kit.com References** | Only in `docs/`, `CLAUDE.md`, README files | No code integration — only documentation mentions. Update docs to remove. |
| **DreamMode** (non-PreDream) | `components/DreamMode/` directory | User confirmed: only PreDream and PreDemo are current. DreamMode is legacy. However, `dream-mode/DreamModePageContent.tsx` dynamically imports it. **Verify whether `/dream-mode` page should use PreDream instead before deleting.** |

### Potentially Unused Exports:

| Export | File | Notes |
|--------|------|-------|
| `performAdditionalValidation()` | `scripts/validate-design-tokens.js:179-211` | Exported but never called in validation flow |
| `PERFORMANCE_THRESHOLDS` re-export | `config/performance-thresholds.ts:262` | "Legacy backward compatibility" alias |
| `PERFORMANCE_THRESHOLDS` re-export | `lib/analytics/constants.ts:32` | Another legacy alias |
| `boundHandleGlobalError/Rejection` | `lib/errors/ErrorReportingService.ts:59-60` | Created but never attached |
| `requireAdmin` parameter | `lib/security/authentication.ts:30` | Accepted but never used differently |
| `getDateFormatForLocale` etc. | `config/formats.ts` | Not exported from barrel — may be unused |

### Phantom Scripts:

| Script | File | Issue |
|--------|------|-------|
| `dev:app` | `package.json:17` | Filters for workspace "app" which doesn't exist |
| `dev:business` | `package.json:18` | Filters for workspace "business" which doesn't exist |

---

## 21. SEO Audit

**Rating: GOOD**

- All landing pages have `generateMetadata` with title, description, OG, Twitter cards, alternates, canonical, hreflang
- Dynamic sitemap with all locales and alternates
- Static `robots.txt` with proper blocks
- Structured data (JSON-LD) on all landing and marketing pages
- OG image generation for B2C, B2B, strategies, dream, share

**Findings:**

| ID | Severity | Description | File |
|----|----------|-------------|------|
| SEO-1 | MEDIUM | StructuredData component missing nonce (see PERF-1) | `components/SEO/StructuredData.tsx` |
| SEO-2 | LOW | Placeholder pages (daily-market, help, security) have hardcoded English "Coming soon" text and missing hreflang alternates | `(landing)/daily-market,help,security/page.tsx` |
| SEO-3 | LOW | Root `/` redirect goes through `page.tsx redirect()` (307) instead of middleware redirect. Slightly suboptimal for SEO (two hops). | `middleware.ts:47` |
| SEO-4 | LOW | Three different base URL env vars for same purpose | Multiple pages |

---

## 22. Scripts & Build Audit

| ID | Severity | Description | File |
|----|----------|-------------|------|
| SCR-1 | CRITICAL | `generate-design-tokens.js` is destructive (see CRIT-1) | `scripts/generate-design-tokens.js` |
| SCR-2 | LOW | `validate-design-tokens.js` has exported but never-called `performAdditionalValidation()` | `scripts/validate-design-tokens.js:179` |
| SCR-3 | LOW | `validate-design-tokens.js` hard-requires `ajv` without try-catch (unlike generator which gracefully handles missing ajv) | `scripts/validate-design-tokens.js:15` |
| SCR-4 | LOW | `pre-launch-audit.sh` lint error detection uses fragile `grep -c "error"` matching any line with the word | `scripts/pre-launch-audit.sh:93-94` |
| SCR-5 | LOW | Phantom `dev:app` and `dev:business` scripts reference non-existent workspaces | `package.json:17-18` |

---

## 23. Package & Monorepo Audit

| ID | Severity | Description | File |
|----|----------|-------------|------|
| PKG-1 | MEDIUM | `@neondatabase/serverless` is in root `dependencies` AND `apps/web/dependencies`. Should only be in web. | `package.json:58` |
| PKG-2 | MEDIUM | No Prettier configuration anywhere. Code formatting relies on developer habits. | — |
| PKG-3 | LOW | `react` in `@diboas/ui` both as dependency AND peerDependency. Should only be peerDep + devDep. | `packages/ui/package.json:20` |
| PKG-4 | LOW | `@diboas/ui` has no `exports` field (uses legacy `main`/`types`). | `packages/ui/package.json` |
| PKG-5 | LOW | `@diboas/email` not in `knip.json` workspaces — dead code detection skips it. | `knip.json` |
| PKG-6 | LOW | `@diboas/ui` test script is `echo "No tests configured"`. | `packages/ui/package.json:15` |
| PKG-7 | LOW | `tsconfig.json` target mismatch: web targets ES2017, packages target ES2020. | `apps/web/tsconfig.json` vs `packages/*/tsconfig.json` |
| PKG-8 | LOW | Stories excluded from tsconfig type checking (`exclude: ["**/*.stories.ts*"]`). Type errors in stories won't be caught in CI. | `apps/web/tsconfig.json:40-41` |

---

## 24. CTO Board Addendum — 9 Additional Findings

> Added after CTO Board review on 2026-03-09. All claims verified against actual source files.

### GAP-1: FAQ Fee Values — Compliance Risk (P0)

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-1 |
| **Severity** | HIGH |
| **Files** | `packages/i18n/translations/{en,pt-BR,es,de}/faq.json` |
| **Impact** | ~60 FAQ translation strings across 4 locales contain legacy fee values (`0.09%`, `0.9%`, `2%`, `3%`). This is a **compliance issue** — user-facing fee information may not reflect current pricing. `pt-BR/faq.json` already has a `_TODO_fee_audit` marker flagging this as blocked on CMO delivery. |
| **Fix** | Blocked on CMO providing updated fee copy. Once received, update all fee references across all 4 locale FAQ files. See `docs/new-copy/CTO_FEE_AUDIT_CLAUDE_CODE_HANDOFF.md Issue K`. |

### GAP-2: Font System Dual-Font Decision Not Implemented

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-2 |
| **Severity** | MEDIUM |
| **Files** | `apps/web/src/app/layout.tsx`, `apps/web/src/styles/design-tokens.css` |
| **Impact** | `design-tokens.css` declares `--font-family-primary: 'Inter'` only. `layout.tsx` loads only Inter via `next/font/google`. Per confirmed CEO Decision Record (March 4, 2026), the system should use Geist Sans for display elements and Inter for body text. Neither the font loading nor the token system reflects this yet. |
| **Fix** | **Confirmed CEO decision — implement.** Add Geist Sans import to `layout.tsx`, create `--font-family-display` token, update heading styles. |

### GAP-3: Locale Detection — Path-Only, No Cookie/Accept-Language

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-3 |
| **Severity** | MEDIUM |
| **Files** | `apps/web/middleware.ts:13-20` |
| **Impact** | Middleware only detects locale from URL path segments. No cookie-based persistence and no `Accept-Language` header fallback. Returning users always default to `/en` unless they manually navigate to their locale. |
| **Fix** | Implement locale detection chain: (1) check `NEXT_LOCALE` cookie → (2) parse `Accept-Language` header → (3) default to `en`. Set cookie on locale selection. |

### GAP-4: `(marketing)` Route Group — 40+ Story A Placeholder Pages

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-4 |
| **Severity** | MEDIUM |
| **Files** | `apps/web/src/app/[locale]/(marketing)/` — 11 primary routes, 40+ nested sub-routes |
| **Impact** | The entire `(marketing)` route group contains pages for personal banking, investing, crypto, rewards, careers, help, and more — all Story A content that doesn't exist for V1. These pages are indexed by search engines, accessible via URL, and create a misleading impression of the product scope. |
| **Routes:** | `personal/` (7 sub-pages), `why-diboas/`, `learn/` (7 sub-pages), `security/` (3 sub-pages), `rewards/` (7 sub-pages), `business/` (7 sub-pages), `careers/`, `main/`, `help/` (5 sub-pages), `investors/` |
| **Fix** | For V1: either (a) delete the entire `(marketing)` route group, (b) add `robots: { index: false }` to all marketing pages, or (c) gate behind feature flag. Decision needed. |

### GAP-5: Founding Member Cap Hardcoded to 1200

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-5 |
| **Severity** | LOW |
| **Files** | `apps/web/src/config/waitlist-stats.ts:30,32`, `apps/web/src/lib/waitingList/store.ts:13,127`, `apps/web/src/lib/waitingList/__tests__/store.test.ts:32,35,36,57` |
| **Impact** | The founding member cap of 1200 is hardcoded in config, store logic, and tests. The database `waitlist_counters` table has the canonical value, but the display-side config doesn't read from it. If the cap changes, 3+ files need manual updates. |
| **Fix** | Read cap from `waitlist_counters` table at runtime (or from `FOUNDING_MEMBER_CAP` env var with DB as fallback). Remove hardcoded `1200` from `waitlist-stats.ts`. Update tests to use the configurable value. |

### GAP-6: `#dual-cta` Comment Reference in B2B Config

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-6 |
| **Severity** | INFO |
| **Files** | `apps/web/src/config/landing-b2b.ts:6` |
| **Impact** | File header comment references "Dual CTA" as section 12 in a 14-section layout. DualCTA has been removed and replaced by WaitlistSection. Comment is misleading. No actual `#dual-cta` href references found in config. |
| **Fix** | Update comment to reflect current 14-section layout (section 12 = Waitlist, not Dual CTA). |

### GAP-7: Smart Contract Audit Decision — Risk Acknowledgment

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-7 |
| **Severity** | INFO |
| **Files** | N/A (governance/compliance) |
| **Impact** | Smart contracts will launch without third-party audit. This is a conscious business decision that should be documented as a risk acknowledgment, not a code finding. |
| **Fix** | Add a `docs/risk-acknowledgments.md` documenting this decision with rationale and future audit timeline. |

### GAP-8: B2B Waitlist Shares B2C Database — Architectural Decision Pending

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-8 |
| **Severity** | INFO |
| **Files** | `apps/web/src/lib/waitingList/store.ts:53-60`, `apps/web/src/app/api/waitlist/signup/route.ts:168` |
| **Impact** | B2B and B2C waitlist signups share a single `waitlist` table with a `source` column (`'landing_b2c'` vs `'landing_b2b'`). Founding member tier, email flow, and counters are shared. No separate B2B cap, no B2B-specific email template, no separate counter tracking. |
| **Fix** | Decision needed: (a) keep shared with source-based filtering (simplest), (b) add B2B-specific counter row in `waitlist_counters`, or (c) separate tables. Document the decision regardless. |

### GAP-9: `/dream-mode` Page Uses Legacy DreamMode, Not PreDream

| Field | Value |
|-------|-------|
| **ID** | CTO-GAP-9 (verifying existing DEAD-CODE finding) |
| **Severity** | HIGH |
| **Files** | `apps/web/src/app/[locale]/(landing)/dream-mode/DreamModePageContent.tsx` |
| **Impact** | The `/dream-mode` page dynamically imports from `@/components/DreamMode` (legacy), not `@/components/PreDream`. Per project instructions, only PreDream and PreDemo are current. The live dream-mode URL serves legacy code. |
| **Fix** | Update `/dream-mode` page to import PreDream component. Then delete the entire `components/DreamMode/` directory (and its 1,259-line CSS file). |

---

## 25. CTO Board Verification Audit — 6 New Findings + Cross-Verification

> CTO Board executed an independent audit (`docs/audit/code/CTO_BOARD_AUDIT_VERIFICATION_20260309.md`) which independently verified 15 findings and added 6 new ones. All 6 new findings were cross-verified against source files below. Additionally, 5 findings from our own cross-verification scan are included.

### CTO-NEW-1: Systematic Hardcoded HTML IDs — 49 Instances Across Components

| Field | Value |
|-------|-------|
| **ID** | CTO-NEW-1 |
| **Severity** | HIGH (extends CRIT-2 to full scope) |
| **Impact** | 49 hardcoded `id="..."` attributes across component .tsx files. CRIT-2 only identified ExpandableSection; the pattern is systemic. Reusing any of these components on the same page produces duplicate IDs (HTML spec violation, broken aria-controls). |
| **Affected components** | `CalculatorToggleSection` (4 IDs: calculator-tab-cashflow, calculator-tab-treasury, calculator-panel-cashflow, calculator-panel-treasury), `TreasuryCalculator` (4 IDs: calculator, calculator-title, cash-input, rate-input), `WaitlistModalForm` (9 IDs), `WaitlistForm` (3 IDs), `FAQAccordionDefault` (1 ID), `BenefitsCardsDefault` (1 ID), `AppFeaturesCarouselDefault` (1 ID), `HeroDefault` (1 ID), `HeroFullBackground` (1 ID), `CookieConsent` (1 ID), `MinimalNavigation` (1 ID), `ShareModal` (1 ID), `LegalDocument` (1 ID), `CookiePolicyContent` (6 IDs), `PrivacyPolicyContent` (13 IDs), `TermsOfUseContent` (12 IDs), plus others. |
| **Fix** | Systematic pass: replace all component-level hardcoded `id` attributes with `useId()`. Legal/policy anchor IDs (used for in-page TOC navigation) may be exceptions — evaluate case-by-case. |

### CTO-NEW-2: `analytics/service.ts` SSR Timer Leak — setInterval at Import Time

| Field | Value |
|-------|-------|
| **ID** | CTO-NEW-2 |
| **Severity** | MEDIUM |
| **Files** | `apps/web/src/lib/analytics/service.ts:21,204-211,226` |
| **Impact** | Constructor calls `this.startAutoFlush()` which creates a `setInterval` unconditionally. Singleton is instantiated at module level (`export const analyticsService = new AnalyticsServiceImpl()`). On SSR, this creates a leaked interval timer. The `flush()` method accesses `window`/`gtag`/`posthog` which would throw in SSR. |
| **Fix** | Handle as part of DRY-1 (analytics consolidation). Add `typeof window === 'undefined'` guard in constructor before starting timer. |

### CTO-NEW-3: `consentUtils.ts` — THREE Functions Missing SSR Guard, Not One

| Field | Value |
|-------|-------|
| **ID** | CTO-NEW-3 (extends SEC-3) |
| **Severity** | LOW |
| **Files** | `apps/web/src/components/CookieConsent/consentUtils.ts:80,98,141` |
| **Impact** | SEC-3 only flagged `getStoredConsent()`. Actually THREE functions are unsafe: (1) `saveConsentToStorage():80` — `localStorage.setItem` without guard, (2) `dispatchConsentEvent():98` — `window.dispatchEvent` without guard, (3) `getStoredConsent():141` — `localStorage.getItem` without guard. Meanwhile `hasAnalyticsConsent()` and `getConsent()` correctly have the guard. Inconsistent within the same file. |
| **Fix** | Add `if (typeof window === 'undefined') return;` guard to all three functions. |

### CTO-NEW-4: Font System Clarification — Geist Is NOT in Codebase

| Field | Value |
|-------|-------|
| **ID** | CTO-NEW-4 |
| **Severity** | INFO (clarifies GAP-2) |
| **Impact** | Zero occurrences of "Geist" or "geist" anywhere in `apps/web/src/`. The codebase is currently consistent: Inter in code, Inter in design tokens. The dual-font decision (CEO Decision Record, March 4, 2026) is a **new implementation task**, not a fix for an existing conflict. GAP-2 description updated accordingly. |
| **Fix** | GAP-2 updated: remove "if" qualifier — this is a confirmed CEO decision. Implementation: add Geist Sans import to `layout.tsx`, create `--font-family-display` token, update heading styles. |

### CTO-NEW-5: Middleware Root Path Inconsistency

| Field | Value |
|-------|-------|
| **ID** | CTO-NEW-5 |
| **Severity** | LOW |
| **Files** | `apps/web/middleware.ts:47` |
| **Impact** | Condition `if (!localeInPath && pathname !== '/')` means `/` bypasses middleware locale enforcement while `/about` gets redirected to `/en/about`. Root path falls through to `page.tsx` which does its own redirect. This inconsistency will cause issues when implementing GAP-3's locale detection chain — `/` would bypass cookie/Accept-Language detection. |
| **Fix** | When implementing GAP-3, ensure root `/` also goes through the locale detection chain in middleware. |

### CTO-NEW-6: `analytics/service.ts` flush() — `window` Access Before Guard

| Field | Value |
|-------|-------|
| **ID** | CTO-NEW-6 |
| **Severity** | LOW |
| **Files** | `apps/web/src/lib/analytics/service.ts:135-136` |
| **Impact** | `const windowWithGtag = window as Window & {...}` on line 135 accesses `window` for type casting BEFORE the `typeof window !== 'undefined'` check on line 136. In strict SSR contexts, the `window` reference on the cast line could throw. |
| **Fix** | Move type assertion inside the `typeof window` guard block. Handle as part of DRY-1. |

### Cross-Verification Finding: `proxy.ts` — Dead Code with Insecure CSP

| Field | Value |
|-------|-------|
| **ID** | XVER-1 |
| **Severity** | HIGH |
| **Files** | `apps/web/src/proxy.ts:119` |
| **Impact** | `proxy.ts` is a **dead file** — never imported anywhere in the codebase. It contains a complete alternative middleware implementation with `'unsafe-inline'` and `'unsafe-eval'` in `script-src` CSP. This directly contradicts CLAUDE.md which states `'unsafe-inline' prohibited for scripts`. The active `middleware.ts` correctly uses nonce-based CSP. If anyone mistakenly imports or activates `proxy.ts`, the entire CSP security posture collapses. |
| **Fix** | **Delete `proxy.ts` entirely.** Note: `proxy.ts` contains a naive locale detection chain, but per IMPROVE-2, use `@formatjs/intl-localematcher` + `negotiator` (both already in `@diboas/i18n` deps) for proper locale negotiation in P7 instead. No extraction needed before deletion. |

### Cross-Verification: `proxy.ts` Has the Locale Detection That `middleware.ts` Needs

| Field | Value |
|-------|-------|
| **ID** | XVER-2 |
| **Severity** | INFO |
| **Files** | `apps/web/src/proxy.ts:57-80` vs `apps/web/middleware.ts:13-20` |
| **Impact** | The locale detection chain that GAP-3 says needs to be implemented **already exists** in the dead `proxy.ts` file: (1) check `NEXT_LOCALE` cookie → (2) parse `Accept-Language` header → (3) fall back to default. It also sets locale cookies on detection (lines 27-32, 45-50). `middleware.ts` only does path-based detection. |
| **Fix** | When implementing GAP-3 in P7, implement proper locale negotiation using `@formatjs/intl-localematcher` + `negotiator` (both already in `@diboas/i18n` deps). The `proxy.ts` naive implementation serves as a reference for the detection chain pattern (cookie → Accept-Language → default) but should NOT be ported directly due to missing q-factor support. `proxy.ts` is deleted in P0a. |

### Cross-Verification: Missing `NEXT_PUBLIC_LEARN_URL` from `.env.example`

| Field | Value |
|-------|-------|
| **ID** | XVER-3 |
| **Severity** | LOW |
| **Files** | `apps/web/src/config/env.ts:78`, `apps/web/.env.example` |
| **Impact** | `NEXT_PUBLIC_LEARN_URL` is used in code (`config/env.ts:78`) with fallback to `https://learn.diboas.com` in production and `http://localhost:3003` in dev. Not documented in `.env.example`. New developers won't know about it. |
| **Fix** | Add `NEXT_PUBLIC_LEARN_URL=http://localhost:3003` to `.env.example`. |

### Cross-Verification: GAP-2 Correction — Remove "If" Qualifier

| Field | Value |
|-------|-------|
| **ID** | XVER-4 |
| **Severity** | INFO |
| **Files** | This document, GAP-2 |
| **Impact** | GAP-2 says "If a decision was made..." — per CTO Board, this IS a confirmed CEO decision (March 4, 2026). The "if" is misleading. |
| **Fix** | *(Already corrected in CTO-NEW-4 above.)* |

### CTO Board Correction: GAP-6 `#dual-cta` Anchors Already Fixed

| Field | Value |
|-------|-------|
| **ID** | XVER-5 |
| **Severity** | INFO |
| **Files** | `apps/web/src/config/landing-b2b.ts` |
| **Impact** | CTO Board verified that the three `ctaHref` values that previously pointed to `#dual-cta` have already been updated. Only the file header comment (line 6) still mentions "Dual CTA" — confirmed as documentation-only issue, not a broken anchor. |

---

## 26. CTO Board Fix Plan Review — Execution Risks & Improvements

> Source: `docs/audit/code/CTO_BOARD_FIX_PLAN_REVIEW_20260309.md`. All 3 execution risks verified against source code. 4 improvements accepted.

### Execution Risks (verified)

**RISK-1: Analytics API Mismatch (DRY-1)**
`service.ts` implements `AnalyticsService` interface with `track({name, parameters})`. `error-resilient-service.ts` has incompatible `trackEvent(eventName, properties)`. Barrel exports from `service.ts`. Simply deleting `service.ts` would break every analytics call in the codebase. **Resolution:** Rewrite as API migration, not delete-and-swap. Option (c) preferred: keep `service.ts` API as public interface, merge resilience logic from `error-resilient-service.ts` into it, add SSR guards, then delete `error-resilient-service.ts`.

**RISK-2: DreamMode → PreDream Props Mismatch (GAP-9)**
`DreamMode` accepts `onComplete`, `onClose`, `className`. `PreDream` accepts `onClose`, `onBackToHome`. `DreamModePageContent.tsx` has wrapper logic (waitlist gating, analytics, loading states) that needs evaluation against PreDream's own disclaimer flow. **Resolution:** This is a page rewrite (~2-3 hrs), not a find-and-replace import swap (~1 hr).

**RISK-3: Legal Page IDs Must NOT Use `useId()` (CTO-NEW-1)**
Of 49 hardcoded IDs, ~31 are in legal pages (Privacy, Terms, Cookies) where IDs are anchor targets for in-page TOC navigation (`href="#section-*"`). Converting these to `useId()` would break TOC links. **Resolution:** Apply explicit exemption rule:
- **Convert to `useId()`:** Component-level IDs in reusable components used for `aria-controls`/`aria-labelledby`
- **Keep stable:** Legal content page IDs used as `href="#..."` anchor targets

### Improvements Accepted

- **IMPROVE-1:** Split P0 into P0a (immediate) and P0b (blocked on CMO)
- **IMPROVE-2:** Don't port naive `proxy.ts` locale detection — use `@formatjs/intl-localematcher` + `negotiator` (both already in `@diboas/i18n` dependencies with `@types/negotiator` in devDeps). Proper q-factor support out of the box.
- **IMPROVE-3:** Add smoke test verification after each phase
- **IMPROVE-4:** Batch `useId()` pass with aria-label i18n fix — same components touched, single pass more efficient

### Time Estimate Corrections

| Task | Original | Corrected | Reason |
|------|----------|-----------|--------|
| DRY-1 (analytics consolidation) | 2-3 hrs | 3-4 hrs | API migration, not just import update |
| CTO-GAP-9 (DreamMode → PreDream) | 1 hr | 2-3 hrs | Props mismatch, page rewrite needed |
| CRIT-2 + CTO-NEW-1 (hardcoded IDs) | 1 hr | 1.5-2 hrs | 49 IDs need legal/anchor exemption evaluation |

### Inaccuracies Corrected

- **Phase 7 dependency:** Was "After P2 (proxy.ts deletion)" — corrected to "After P0a (proxy.ts deletion)"
- **CTO-GAP-4:** Was "Decision needed" — corrected to "Confirmed CEO decision — remove for V1" (CEO Decision Record Q5)

---

## 27. Final Consolidated Fix Plan

> Integrates all findings: original audit (121), CTO Board Addendum (9), CTO Board Verification (11), and CTO Board Fix Plan Review (3 risks, 4 improvements). Total: **141 findings**.
> Revised total effort: **~90-115 hrs** (~2-3 weeks solo + Claude Code).

### Phase 0a: Critical — Immediate Fixes (~2 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0a | CRIT-1 | Remove `generate:design-tokens` from `turbo.json` build dependencies. Delete or rewrite `scripts/generate-design-tokens.js`. | 30 min |
| P0a | CRIT-4 | Replace `var(--breakpoint-desktop)` with `1024px` in `carousel-controls.module.css:29`. | 5 min |
| P0a | CRIT-5 | Replace `var(--opacity-0)` with `0` in `semantic-components.css:634,646,701,732`. | 10 min |
| P0a | XVER-1 | **Delete `proxy.ts`** — dead code with insecure CSP. No locale extraction needed yet (handled properly in P7 with `@formatjs/intl-localematcher`). | 15 min |

> **Smoke test:** Run `turbo build`. Verify no design token generator fires. Check CSP header in browser dev tools.

### Phase 0b: Critical — Blocked on CMO

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P0b | CTO-GAP-1 | **FAQ fee compliance** — blocked on CMO delivery. Once copy arrives, update ~60 fee strings across 4 locale FAQ files. Track as blocker. | 2-4 hrs (when unblocked) |

### Phase 1: Accessibility Hardening + Security + SSR Safety (~12 hrs)

> Per IMPROVE-4: Batch the `useId()` ID pass with the aria-label i18n fix. Touch each component once.

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P1 | CRIT-2 + CTO-NEW-1 + A11Y-ARIA | **Combined accessibility pass.** For each affected component: (1) replace hardcoded `id` with `useId()` where used for `aria-controls`/`aria-labelledby`, (2) replace hardcoded English aria-labels with `intl.formatMessage()`. Create `common.accessibility` i18n keys (~15 strings) across 4 locales. **Exemption rule:** Keep stable IDs in legal pages (Privacy, Terms, Cookies) where IDs are `href="#..."` anchor targets. | 3-4 hrs |
| P1 | DRY-1 + CTO-NEW-2 + CTO-NEW-6 | **Analytics service consolidation.** ⚠️ API migration required — services have incompatible APIs (`track({name, parameters})` vs `trackEvent(eventName, properties)`). Keep `service.ts` API as public interface, merge retry/resilience/offline logic from `error-resilient-service.ts` into it, add SSR guard in constructor (`typeof window === 'undefined'` → skip `startAutoFlush`), move `window` type cast inside `typeof window` guard in `flush()`. Delete `error-resilient-service.ts`. Update barrel. | 3-4 hrs |
| P1 | CTO-GAP-9 | **DreamMode → PreDream page rewrite.** ⚠️ Props mismatch — `DreamMode` has `onComplete`/`className`, PreDream has `onBackToHome`. Steps: (1) map props (`onComplete` → `onBackToHome`), (2) evaluate waitlist gating logic vs PreDream's disclaimer, (3) rewrite `DreamModePageContent.tsx`, (4) test flow end-to-end, (5) delete `components/DreamMode/` directory + 1,259-line CSS. | 2-3 hrs |
| P1 | A11Y-1 | Add `useFocusTrap` to `MinimalNavigation.tsx` mobile menu. | 30 min |
| P1 | A11Y reduced-motion | Add `@media (prefers-reduced-motion: reduce)` blocks to 8 CSS files with `@keyframes`. | 1 hr |
| P1 | SEC-1 | Add edge-compatible rate limiting to OG image routes. | 1 hr |
| P1 | SEC-2 | Add `noopener,noreferrer` to all `window.open()` calls. | 15 min |
| P1 | CTO-NEW-3 | Add SSR guards to 3 functions in `consentUtils.ts`: `saveConsentToStorage`, `dispatchConsentEvent`, `getStoredConsent`. | 15 min |

> **Smoke test:** Run `pnpm test`. Verify `/dream-mode` loads PreDream. Check analytics calls fire in browser console. Verify two expandable sections on B2C page have unique IDs.

### Phase 2: Dead Code & Legacy Cleanup (~3 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P2 | Dead code | Delete `DualCtaSection/` directory (3 files) + `config/dualCtaSection.ts` + remove from `Sections/index.ts` barrel | 15 min |
| P2 | Dead code | Remove `CAL_CONFIG` from `config/env.ts` and any CalEmbed references | 30 min |
| P2 | Dead code | Remove phantom scripts (`dev:app`, `dev:business`) from root `package.json` | 5 min |
| P2 | Dead code | Remove `boundHandleGlobalError/Rejection` from `ErrorReportingService.ts` | 10 min |
| P2 | Dead code | Remove legacy re-exports: `PERFORMANCE_THRESHOLDS` aliases in 2 files | 10 min |
| P2 | Dead code | Run `pnpm check:dead-code` (knip) and delete confirmed unused exports | 1 hr |
| P2 | CTO-GAP-4 | **Confirmed CEO decision (Q5) — remove for V1.** Delete or noindex the entire `(marketing)` route group (40+ pages). | 1-2 hrs |
| P2 | CTO-GAP-6 | Update B2B config header comment — replace "Dual CTA" with "Waitlist" | 5 min |

> **Smoke test:** Run `pnpm check:dead-code` (knip). Verify no dangling imports from deleted files.

### Phase 3: Mobile-First CSS Refactor (~8 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P3 | Mobile-first | Refactor `max-width` → `min-width` media queries in 8 CSS files (CookieConsent, Share, PreDemo, WaitingList). Note: DreamMode CSS files are deleted in P1 (GAP-9) — excluded from scope. | 3-5 hrs |
| P3 | DT-5 | Replace ~200 hardcoded hex colors in `PreDemo.module.css` with design token variables | 3-4 hrs |

### Phase 4: Tests & Quality (~16 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P4-a | Tests | Add `jsdom` as devDependency. Update `vitest.config.mts` to `environment: 'jsdom'`. | 15 min |
| P4-b | Tests | Write tests for `rateLimiter.ts`, `csrf.ts`, `authentication.ts` (security-critical, 100% required) | 4-6 hrs |
| P4-c | Tests | Write tests for `middleware.ts` (CSP, locale detection, redirects) | 2-3 hrs |
| P4-d | Tests | Fix broken tests: `ErrorReportingService.test.ts` mock shape, `signup.test.ts` 500 errors | 2 hrs |
| P4-e | Tests | Add component rendering tests for key sections (Hero, FAQ, ExpandableSection, CalculatorToggle) | 4-6 hrs |
| P4-f | Tests | Expand `useFocusTrap.test.ts` with actual DOM behavior tests | 1 hr |

### Phase 5: File Size Refactoring (~16 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P5 | File sizes | Split `ErrorReportingService.ts` (494→200): extract breadcrumb management, context enrichment, initialization | 2 hrs |
| P5 | File sizes | Split `ApplicationEventBus.ts` (420→200): extract generic `EventBus<T>` base class, share with `SectionEventBus` | 2 hrs |
| P5 | File sizes | Split `WalletDetailsScreen.tsx` (465→150): extract chain icons, copy button, address display | 2 hrs |
| P5 | File sizes | Split `CalculatorFactory.tsx` (376→150): extract result display, time period selector, input fields | 2 hrs |
| P5 | File sizes | Address remaining 30+ files over limit (prioritize by severity) | 8-12 hrs |

### Phase 6: Design System Cleanup (~5 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P6 | DT-3 | Decide: make `design-tokens.json` source of truth OR declare CSS manually maintained and delete generator | 2-4 hrs |
| P6 | DT-4 | Remove duplicate `.skip-link` at line 872-873 | 5 min |
| P6 | DT-6 | Refactor nav CTA specificity to eliminate 13 `!important` declarations | 1-2 hrs |
| P6 | DT-8 | Replace hardcoded `font-weight: 600` with `var(--font-weight-semibold)` | 5 min |
| P6 | CTO-GAP-2 | **Confirmed CEO decision (March 4, 2026):** Add Geist Sans import to `layout.tsx`, create `--font-family-display` token, update heading styles for dual-font system. | 1-2 hrs |

### Phase 7: Database, Infrastructure & i18n (~10 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P7 | DB-1 | Add a migration runner with idempotent execution tracking | 2-4 hrs |
| P7 | DB-2 | Create migration 005: `updated_at` trigger for `waitlist_entries` | 30 min |
| P7 | DB-4 | Create migration 006: drop redundant `idx_waitlist_email_hash` index | 15 min |
| P7 | SEC-5 | Add database connectivity check to health ready probe | 30 min |
| P7 | CTO-GAP-3 + CTO-NEW-5 | **Implement locale detection chain** in middleware using `@formatjs/intl-localematcher` + `negotiator` (both already in `@diboas/i18n` deps). Chain: cookie → Accept-Language (with q-factor support via negotiator) → default. Ensure root `/` path goes through detection. Set `NEXT_LOCALE` cookie on selection. | 2-3 hrs |
| P7 | CTO-GAP-5 | Read founding member cap from `waitlist_counters` table or `FOUNDING_MEMBER_CAP` env var. Remove hardcoded `1200`. | 1-2 hrs |
| P7 | CTO-GAP-8 | **Decision needed:** B2B waitlist separation — keep shared table, add B2B counter, or separate tables. | 1-4 hrs |

### Phase 8: Storybook Expansion (~10 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P8 | SB-01 | Add stories for landing page section components: ExpandableSection, FAQAccordion, FeeTable, ProseSection, FounderSection, SocialProofSection, CalculatorToggleSection, CashflowExplainerSection, TwoWorldsSection, ScenarioCards | 6-8 hrs |
| P8 | SB-01 | Add stories for Layout components: MinimalNavigation, MinimalFooter | 2 hrs |
| P8 | SB-01 | Add stories for `@diboas/ui` Button | 1 hr |

### Phase 9: Cleanup & Polish (~7 hrs)

| Priority | Finding | Action | Effort |
|----------|---------|--------|--------|
| P9 | PKG-1 | Remove `@neondatabase/serverless` from root `package.json` | 5 min |
| P9 | PKG-2 | Add Prettier configuration (`.prettierrc`) and format codebase | 1 hr |
| P9 | PKG-3 | Move `react` from `@diboas/ui` dependencies to devDependencies only | 5 min |
| P9 | PKG-5 | Add `@diboas/email` to `knip.json` workspaces | 5 min |
| P9 | PKG-7 | Align tsconfig targets (ES2020 everywhere) | 15 min |
| P9 | PERF-4 | Consolidate three base URL env vars into one | 1 hr |
| P9 | PERF-3 | Use `useRef` for touch tracking in `useSwipeGesture` | 15 min |
| P9 | RACE-1,2 | Add `destroy()` to BreadcrumbManager, restore monkey-patched originals, store click listener ref | 1 hr |
| P9 | ERR-1 | Replace `fetch()` with `fetchWithRetry` in `WaitlistVersionB.tsx` | 10 min |
| P9 | DDD-1 | Make `WaitlistVersionB.tsx` namespace configurable (same pattern as VersionA fix) | 15 min |
| P9 | PERF-2 | Throttle `Logger.logToStorage()` to batch writes | 30 min |
| P9 | SEO-2 | Replace hardcoded English in placeholder pages with i18n keys | 30 min |
| P9 | XVER-3 | Add `NEXT_PUBLIC_LEARN_URL` to `.env.example` | 5 min |
| P9 | Update docs | Update `docs/section-components-guide.md` with new components. Update CLAUDE.md architecture to include `@diboas/email`. Remove Kit.com references from docs. | 1 hr |
| P9 | CTO-GAP-7 | Create `docs/risk-acknowledgments.md` documenting smart contract launch-without-audit decision. | 30 min |

---

### Final Phase Summary

| Phase | Focus | Est. Effort | Dependencies |
|-------|-------|-------------|--------------|
| **P0a** | Critical fixes (immediate) | ~2 hrs | None |
| **P0b** | FAQ fee compliance (blocked) | 2-4 hrs | CMO delivery |
| **P1** | Accessibility + security + SSR safety | ~12 hrs | After P0a |
| **P2** | Dead code & legacy cleanup | ~3 hrs | After P1 |
| **P3** | Mobile-first CSS | ~7 hrs | Independent (DreamMode CSS deleted in P1) |
| **P4** | Tests & quality | ~16 hrs | After P1 (jsdom setup) |
| **P5** | File size refactoring | ~16 hrs | Independent |
| **P6** | Design system | ~5 hrs | Independent |
| **P7** | Database, infra, i18n | ~10 hrs | After P0a (proxy.ts deleted) |
| **P8** | Storybook | ~10 hrs | After P5 (split components) |
| **P9** | Polish & docs | ~7 hrs | After all |
| | **Total** | **~90-115 hrs** | |

```
Execution Flow:

P0a (2h) ──→ P1 (12h) ──→ P2 (3h) ──→ P9 (7h)
                │                          ↑
                ├──→ P4 (16h) ────────────┤
                │                          │
                └──→ P7 (10h) ────────────┘

Independent (can run in parallel with P1+):
  P3 (8h)  ──→ (continues)
  P5 (16h) ──→ P8 (10h)
  P6 (5h)  ──→ (continues)

Blocked:
  P0b ──→ (unblocked by CMO delivery)
```

---

## Appendix A: Files Audited

- **Components:** ~350 files (.tsx, .module.css, .ts) in `apps/web/src/components/`
- **Config:** 44 files in `apps/web/src/config/`
- **Hooks:** 8 files in `apps/web/src/hooks/`
- **Lib:** ~90 files in `apps/web/src/lib/`
- **Types:** 3 files in `apps/web/src/types/`
- **Pages:** ~60 page/layout/error/loading files in `apps/web/src/app/`
- **API Routes:** 12 route files in `apps/web/src/app/api/`
- **Styles:** 5 files in `apps/web/src/styles/`
- **Scripts:** 4 files in `scripts/`
- **Database:** 4 migration files + 3 source files
- **Tests:** 10 test files + 1 setup
- **Stories:** 6 story files
- **Package configs:** 15 config files (package.json, tsconfig, eslint, vitest, turbo, knip, etc.)
- **Packages:** `@diboas/i18n`, `@diboas/ui`, `@diboas/email` source files

**Total estimated files reviewed: ~600+**

## Appendix B: Audit Lineage

| Document | Date | Findings | Author |
|----------|------|----------|--------|
| `full-codebase-audit-20260309.md` (Rev 1) | 2026-03-09 | 121 | Claude Code (4 parallel agents) |
| CTO Board Feedback (Rev 2) | 2026-03-09 | +9 (→130) | CTO Board + Claude Code verification |
| `CTO_BOARD_AUDIT_VERIFICATION_20260309.md` (Rev 3) | 2026-03-09 | +6 new, 3 corrections (→141) | CTO Board independent verification + cross-verification |
| `CTO_BOARD_FIX_PLAN_REVIEW_20260309.md` (Rev 4) | 2026-03-09 | 3 risks, 4 improvements, 3 time corrections | CTO Board fix plan review |
| Final Consolidated Fix Plan (Rev 4 — this revision) | 2026-03-09 | 141 total, plan restructured | Claude Code integration of all feedback |
