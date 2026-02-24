# Principle 4: Code Reusability & DRY - Audit Report

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Monorepo packages, shared hooks, shared utilities, API routes, config layer, component patterns
**Branch:** waitlist-launch

---

## Principle Requirements

From `docs/coding-standards.md`:

- Write code once, use everywhere
- Create shared utilities and components
- Extract common patterns to packages
- Avoid duplication across domains

---

## Findings

### 4.1 Monorepo Package Structure - @diboas/i18n

**Status: Compliant**

The `@diboas/i18n` package is well-structured with proper exports for different environments:

- **Client/server split exports** via `./client`, `./server`, and `./config` subpath exports prevent bundling React on the server.
- **145 consumer files** across `apps/web` import from `@diboas/i18n`, showing widespread adoption.
- **Hooks** (`useTranslation`, `useMessage`, `useCurrencyFormat`, etc.) are properly exported and used consistently.
- **Translation validation** scripts exist (`validate-translations.js`) to ensure parity across 4 locales.

**Evidence:**
- `packages/i18n/package.json` lines 7-27: Proper subpath exports configuration.
- `packages/i18n/src/index.ts`: Clean barrel export with client/server separation.
- 145 files across `apps/web/src/` import from `@diboas/i18n`.

**Gaps:** None.

---

### 4.2 Monorepo Package Structure - @diboas/ui

**Status: Partial**

The `@diboas/ui` package is properly configured but significantly underutilized. It currently exports only two items:

1. `Button` component (with CVA variants)
2. `cn()` utility (clsx + tailwind-merge)

The `Button` is imported in 22 files across the app, confirming it is actively used. The `cn` utility from `@diboas/ui` is imported in only 3 files (`Container.tsx`, `ContentCard.tsx`, `StrategyCard.tsx`).

**Evidence:**
- `packages/ui/src/index.ts`: Only exports `Button`, `ButtonProps`, `buttonVariants`, and `cn`.
- `packages/ui/src/primitives/`: Contains only `Button.tsx`.
- 22 files import `Button` from `@diboas/ui`.

**Gaps:**
- Many reusable UI primitives remain in `apps/web/src/components/UI/` that could be promoted to `@diboas/ui`: `Container`, `ContentCard`, `StrategyCard`, `FlexBetween`, `LucideIcon`, `CTAButtonLink`, `LocaleLink`.
- `SectionContainer` (used by 29+ section components) is a strong candidate for package extraction.
- The package has `@react-aria/button`, `@react-aria/focus`, `@react-aria/interactions` as dependencies but only uses them implicitly through CVA -- these primitives are not yet exposed.

**Recommendation:**
- **Post-launch:** Promote `SectionContainer`, `Container`, `LocaleLink`, and `CTAButtonLink` to `@diboas/ui`. This is not urgent since the app is the sole consumer, but it will pay off when additional apps are added.

---

### 4.3 Duplicated `cn()` Utility

**Status: Non-compliant**

There are two separate `cn()` implementations:

1. **`@diboas/ui` (`packages/ui/src/utils/cn.ts`):** Full implementation using `clsx` + `tailwind-merge`.
2. **`apps/web/src/lib/utils.ts`:** Simplified implementation using `Array.filter(Boolean).join(' ')` -- no Tailwind conflict resolution.

Two component files (`FlexBetween.tsx`, `LucideIcon.tsx`) import from the local `@/lib/utils` version instead of `@diboas/ui`.

**Evidence:**
- `packages/ui/src/utils/cn.ts`: `twMerge(clsx(inputs))` -- proper Tailwind-aware merge.
- `apps/web/src/lib/utils.ts` line 7: `classes.filter(Boolean).join(' ')` -- no Tailwind merge.
- `apps/web/src/components/UI/FlexBetween.tsx` line 2: `import { cn } from '@/lib/utils'`.
- `apps/web/src/components/UI/LucideIcon.tsx` line 2: `import { cn } from '@/lib/utils'`.

**Recommendation:**
- Remove the `cn` function from `apps/web/src/lib/utils.ts` and update `FlexBetween.tsx` and `LucideIcon.tsx` to import from `@diboas/ui`.

---

### 4.4 Duplicated `formatCurrency()` Functions

**Status: Non-compliant**

Three separate `formatCurrency` implementations exist:

1. **`apps/web/src/config/formats.ts`** (line 178): Uses `getCurrencyDecimals()` + `getCurrencySymbol()` + `Intl.NumberFormat` with manual symbol prefixing.
2. **`apps/web/src/lib/pre-demo/format.ts`** (line 11): Uses `Intl.NumberFormat` with `style: 'currency'` -- locale-aware, different signature.
3. **`apps/web/src/lib/pre-dream/format.ts`** (line 11): **Byte-for-byte identical** to `pre-demo/format.ts`.

Additionally, `apps/web/src/lib/utils.ts` (line 11) has yet another `formatCurrency` with a different signature (`currency: string, locale: string`).

**Evidence:**
- `apps/web/src/lib/pre-demo/format.ts`: 22 lines, `formatCurrency(amount, decimals, locale)`.
- `apps/web/src/lib/pre-dream/format.ts`: 22 lines, **identical** to pre-demo version.
- `apps/web/src/config/formats.ts` line 178: Different implementation with manual symbol handling.
- `apps/web/src/lib/utils.ts` line 11: Fourth implementation.
- 36 files total import `formatCurrency` from various sources.

**Recommendation:**
- Consolidate to a single `formatCurrency` in `config/formats.ts` using `Intl.NumberFormat` with `style: 'currency'` (the proper approach). Remove the three duplicates and update all 36 consumer files. The `pre-demo/format.ts` and `pre-dream/format.ts` versions already use the correct Intl approach and delegate to `config/formats.ts` for locale mapping -- they should simply re-export a single shared function.

---

### 4.5 Duplicated `translateValue` Logic in config-translator.ts

**Status: Non-compliant**

Within the same file (`apps/web/src/lib/i18n/config-translator.ts`), the `translateValue` recursive tree-walker is implemented twice:

1. **Lines 45-86** inside `useConfigTranslation()` hook (with `translationKeyMap` support).
2. **Lines 149-180** inside `withTranslations()` function (without `translationKeyMap` support).

Both contain identical `isTranslationKey` detection logic, identical null/array/object handling, and identical `intl.formatMessage` calls.

**Evidence:**
- `apps/web/src/lib/i18n/config-translator.ts` lines 45-86 vs lines 149-180: Same traversal pattern duplicated.

**Recommendation:**
- Extract a shared `translateConfigTree(intl, value, translationKeyMap?)` pure function and have both `useConfigTranslation` and `withTranslations` delegate to it.

---

### 4.6 Duplicated Locale Path Logic

**Status: Non-compliant**

The locale path prefixing logic is implemented twice with identical rules:

1. **`apps/web/src/hooks/useLocalePath.ts`** lines 51-64: `getLocalePath()` function.
2. **`apps/web/src/components/UI/LocaleLink.tsx`** lines 72-86: `getLocalizedHref()` function.

Both implement the same three rules: skip external URLs, skip if already has locale prefix, add locale prefix. The `useLocalePath` hook is **never imported** anywhere in the codebase -- it is dead code.

**Evidence:**
- `useLocalePath.ts` line 37: Exported but 0 consumer files.
- `LocaleLink.tsx` lines 72-86: Duplicated logic inline.

**Recommendation:**
- Have `LocaleLink` use `useLocalePath` internally, or remove `useLocalePath` as dead code since `LocaleLink` is the preferred API for locale-aware navigation.

---

### 4.7 Duplicated Email Validation in API Routes

**Status: Non-compliant**

The waitlist delete route (`apps/web/src/app/api/waitlist/delete/route.ts`) implements inline email validation with a raw regex on lines 98-100:

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(normalizedEmail)) { ... }
```

All other API routes use the shared `isValidEmail()` function from `@/lib/waitingList/helpers`. The delete route also skips the `sanitizeEmail()` utility, using manual `toLowerCase().trim()` instead.

**Evidence:**
- `apps/web/src/app/api/waitlist/delete/route.ts` lines 97-101: Inline regex validation.
- `apps/web/src/app/api/waitlist/signup/route.ts` line 167: Uses shared `isValidEmail()`.
- `apps/web/src/app/api/waitlist/position/route.ts` line 84: Uses shared `isValidEmail()` + `sanitizeEmail()`.
- `apps/web/src/app/api/waitlist/referral/route.ts` line 90: Uses shared `isValidReferralCode()`.

**Recommendation:**
- Replace inline regex in `delete/route.ts` with `isValidEmail()` from `@/lib/waitingList/helpers` and `sanitizeEmail()` from `@/lib/utils/sanitize`.

---

### 4.8 API Route Boilerplate Pattern

**Status: Partial**

Every API route repeats the same CSRF + rate-limiting + error-handling boilerplate:

1. CSRF protection check (6-8 lines)
2. Rate limit check with IP extraction (8-12 lines)
3. Rate limit response with headers (5-7 lines)
4. Error catch block with `applicationEventBus.emit(APPLICATION_ERROR, ...)` (8-12 lines)
5. Error coercion pattern: `error instanceof Error ? error : new Error(String(error))` (11 occurrences across 6 files)
6. Rate-limited error message: `'Too many requests. Please try again later.'` (10 occurrences across 5 files)

While each route imports from shared `@/lib/security`, the actual calling pattern is copy-pasted rather than abstracted into middleware or a wrapper.

**Evidence:**
- 123 total occurrences of rate-limit-related code across 9 API files.
- 16 total occurrences of `csrfProtection` across 6 API files (5 route files + 1 test).
- 11 total `applicationEventBus.emit(APPLICATION_ERROR, ...)` in API routes.
- 10 identical rate-limit error messages.

**Gaps:**
- No shared API route wrapper/middleware function that composes CSRF + rate-limiting + error handling.

**Recommendation:**
- **Post-launch:** Create a `withApiProtection(handler, options)` higher-order function or Next.js middleware pattern that wraps CSRF validation, rate limiting, and error event emission. This would reduce each route by ~25-30 lines and ensure consistency. Example:

```typescript
export const POST = withApiProtection(
  async (request, { rateLimitResult }) => { /* handler */ },
  { rateLimit: 'strict', csrf: true, source: 'waitlist' }
);
```

---

### 4.9 Marketing Page Template Duplication

**Status: Non-compliant**

39 marketing pages under `apps/web/src/app/[locale]/(marketing)/` follow a nearly identical template:

1. Same imports (12-18 lines)
2. Same `interface PageProps` definition (5 lines)
3. Same `generateMetadata` function (4 lines)
4. Same locale validation pattern (6 lines)
5. Same `loadPageNamespaces` call (1 line)
6. Same `MetadataFactory.generateServiceStructuredData` call (4 lines)
7. Same `MetadataFactory.generateBreadcrumbs` call (4 lines)
8. Same JSX structure: `PageI18nProvider > StructuredData > main > [SectionErrorBoundary > Section]...`

The only differences between pages are: page key string, breadcrumb names, service metadata, and which section configs are passed. Each page is ~133-135 lines. Total: ~4,013 lines of highly repetitive code.

A `StaticPageTemplate` component exists at `apps/web/src/components/Pages/StaticPageTemplate.tsx` but is **not imported by any file** -- it is dead code.

**Evidence:**
- `apps/web/src/app/[locale]/(marketing)/personal/banking/page.tsx`: 134 lines.
- `apps/web/src/app/[locale]/(marketing)/personal/cryptocurrency/page.tsx`: 134 lines, near-identical structure.
- `apps/web/src/app/[locale]/(marketing)/learn/overview/page.tsx`: 134 lines, near-identical structure.
- `apps/web/src/app/[locale]/(marketing)/careers/page.tsx`: 135 lines, near-identical structure.
- 39 total marketing pages at ~133 lines each = ~5,200 lines.
- `apps/web/src/components/Pages/StaticPageTemplate.tsx`: Defined but unused.
- `interface PageProps` is duplicated 41 times across page files.

**Recommendation:**
- Create a `MarketingPageTemplate` component or a `createMarketingPage(config)` factory that accepts a page configuration object (pageKey, breadcrumbs, sections, namespaces). Each page file would shrink from ~135 lines to ~20-30 lines of configuration. Estimated savings: ~3,500-4,000 lines. This is the single highest-impact DRY improvement available.

---

### 4.10 Shared Hooks Utilization

**Status: Compliant**

All shared hooks are properly used with no inline reimplementations:

| Hook | Consumers | Inline duplicates found |
|------|-----------|------------------------|
| `useCarousel` | 4 components (ProductCarousel, AppFeaturesCarousel, FeatureShowcase x2) | 0 |
| `useSwipeGesture` | 4 components (same as useCarousel) | 0 |
| `useImageLoading` | 4 components (same as useCarousel) | 0 |
| `useFocusTrap` | 4 components (MobileNav, DreamMode, ShareModal, WaitingListModal) | 0 |
| `useNavigation` | 1 component (Navigation) | 0 |
| `useLocalePath` | 0 components (**dead code**) | See finding 4.6 |

Touch gesture handling (`onTouchStart`/`onTouchEnd`) is only found in the 4 carousel components that use `useSwipeGesture` -- no inline implementations.

**Evidence:**
- 4 consumers of `useCarousel`, 4 of `useSwipeGesture`, 4 of `useImageLoading` -- all properly importing from `@/hooks/`.
- `useFocusTrap` has a test file (`__tests__/useFocusTrap.test.ts`).

**Gaps:**
- `useLocalePath` is dead code (0 consumers).

---

### 4.11 Shared Utility Utilization

**Status: Partial**

**fetchWithRetry:**
- Defined in `apps/web/src/lib/utils/fetchWithRetry.ts` with test coverage.
- Used in `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts`.
- **Not used** in API routes for server-to-server calls (Kit.com sync in signup route uses raw `fetch`).

**sanitize utilities:**
- `sanitizeText`, `sanitizeEmail`, `sanitizeUserName` in `apps/web/src/lib/utils/sanitize.ts`.
- Used in 4 files: `signup/route.ts`, `position/route.ts`, `SectionUtils.ts`, `patterns/index.ts`.
- **Not used** in `delete/route.ts` (uses inline `toLowerCase().trim()` -- see finding 4.7).

**RaceConditionPrevention:**
- `SafeInterval`, `SafeTimer`, `CleanupManager`, `MutexLock`, `StateMachine` in `RaceConditionPrevention.ts`.
- Used by `useCarousel` hook -- proper centralization.

**Evidence:**
- `fetchWithRetry.ts` has test file and 1 consumer.
- `sanitize.ts` has test file and 4 consumers (one API route missing).

**Gaps:**
- `fetchWithRetry` could be used for the Kit.com sync in `signup/route.ts` (currently raw `fetch` with no retry).
- `sanitizeEmail` not used in `delete/route.ts`.

---

### 4.12 Factory Pattern & SectionContainer Reuse

**Status: Compliant**

The Factory pattern is extensively and consistently applied:

- **8 section components** have dedicated Factory files: `HeroSectionFactory`, `FAQAccordionFactory`, `FeatureShowcaseFactory`, `ProductCarouselFactory`, `AppFeaturesCarouselFactory`, `OneFeatureFactory`, `StickyFeaturesNavFactory`, and `BenefitsCards/index.tsx`.
- All factories follow the same pattern: variant registry, config translation via `useConfigTranslation()`, error handling with fallback to default variant, logging.
- **SectionContainer** is used by 29+ components, eliminating ~300 lines of section/container boilerplate.
- **`useConfigTranslation()`** is shared across all 15 config-driven components.

**Evidence:**
- `SectionContainer` referenced in 29 files.
- `useConfigTranslation` referenced in 15 files.
- Factory pattern consistent across all 8 factory components.

**Gaps:** None.

---

### 4.13 Config Layer DRY-ness

**Status: Compliant**

The config layer follows DRY principles well:

- **Base configs** (`hero.ts`, `faqAccordion.ts`, `featureShowcase.ts`) define shared types and defaults.
- **Page configs** (`hero-pages.ts`, `faqAccordion-pages.ts`, etc.) extend base configs per page using `Partial<ConfigType>`.
- **Centralized asset helpers** (`config/assets.ts`) prevent hardcoded asset paths.
- **Config generation** for `benefitsCards-pages.ts` is auto-generated from translation files.
- Total page config: ~3,917 lines across 5 files -- this is proportional to the 39 pages they configure and does not contain structural duplication.

**Evidence:**
- `hero-pages.ts`: 1,065 lines for ~30+ page configs. Each entry uses `Partial<HeroVariantConfig>` extending the base type.
- `benefitsCards-pages.ts` header: "AUTO-GENERATED from English translation file."
- All configs reference translation keys rather than hardcoded strings.

**Gaps:** None significant. The page configs are inherently data-driven -- each page's content is unique.

---

### 4.14 Type Definition Duplication

**Status: Partial**

The `interface PageProps` type is defined identically 41 times across page files:

```typescript
interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}
```

This should be a shared type.

**Evidence:**
- 41 occurrences of `interface PageProps` across page files.

**Recommendation:**
- Extract to a shared `types/page.ts` file and import across all pages. This would be addressed automatically by the marketing page template recommendation in finding 4.9.

---

## Summary

| Finding | Area | Status | Impact |
|---------|------|--------|--------|
| 4.1 | @diboas/i18n package | **Compliant** | -- |
| 4.2 | @diboas/ui package | **Partial** | Low (single consumer app) |
| 4.3 | Duplicated `cn()` | **Non-compliant** | Low (2 files affected) |
| 4.4 | Duplicated `formatCurrency()` | **Non-compliant** | Medium (36 consumers, 4 implementations) |
| 4.5 | Duplicated `translateValue` | **Non-compliant** | Low (same file, internal) |
| 4.6 | Duplicated locale path logic | **Non-compliant** | Low (dead code + 1 duplicate) |
| 4.7 | Inline email validation | **Non-compliant** | Medium (security consistency) |
| 4.8 | API route boilerplate | **Partial** | Medium (~150 lines duplicated across 7 routes) |
| 4.9 | Marketing page template | **Non-compliant** | **High** (~4,000 lines duplicated across 39 pages) |
| 4.10 | Shared hooks utilization | **Compliant** | -- |
| 4.11 | Shared utility utilization | **Partial** | Low (2 missed usages) |
| 4.12 | Factory pattern & SectionContainer | **Compliant** | -- |
| 4.13 | Config layer | **Compliant** | -- |
| 4.14 | PageProps type duplication | **Partial** | Low (41 identical interfaces) |

**Overall Assessment: Partial Compliance**

The codebase demonstrates strong DRY practices at the architectural level (Factory pattern, SectionContainer, shared hooks, config-driven sections, useConfigTranslation). However, significant duplication exists at the application layer, particularly in marketing page templates (~4,000 lines) and utility functions (formatCurrency, cn, translateValue).

---

## Action Items

### Priority 1 - Fix Now (Pre-Launch)

| # | Finding | Action | Est. Effort | Est. Lines Saved |
|---|---------|--------|-------------|------------------|
| A1 | 4.7 | Replace inline email regex in `delete/route.ts` with `isValidEmail()` + `sanitizeEmail()` | 15 min | ~5 |
| A2 | 4.3 | Remove `cn()` from `lib/utils.ts`, update `FlexBetween.tsx` and `LucideIcon.tsx` to import from `@diboas/ui` | 10 min | ~5 |
| A3 | 4.6 | Remove dead `useLocalePath` hook or have `LocaleLink` consume it | 10 min | ~40 |

### Priority 2 - Fix Soon (Post-Launch Sprint 1)

| # | Finding | Action | Est. Effort | Est. Lines Saved |
|---|---------|--------|-------------|------------------|
| B1 | 4.4 | Consolidate 4 `formatCurrency` implementations to single source in `config/formats.ts` | 2 hours | ~60 |
| B2 | 4.5 | Extract shared `translateConfigTree()` from duplicated `translateValue` implementations | 30 min | ~30 |
| B3 | 4.14 | Extract shared `PageProps` type to `types/page.ts` | 30 min | ~80 |

### Priority 3 - Strategic Improvements (Post-Launch Sprint 2+)

| # | Finding | Action | Est. Effort | Est. Lines Saved |
|---|---------|--------|-------------|------------------|
| C1 | 4.9 | Create `MarketingPageTemplate` or `createMarketingPage(config)` factory for 39 marketing pages | 1-2 days | ~3,500-4,000 |
| C2 | 4.8 | Create `withApiProtection()` wrapper for API route CSRF + rate-limiting + error boilerplate | 4 hours | ~150-200 |
| C3 | 4.2 | Promote `SectionContainer`, `Container`, `LocaleLink`, `CTAButtonLink` to `@diboas/ui` | 1 day | Architectural (no line savings but better organization) |
| C4 | 4.11 | Use `fetchWithRetry` for Kit.com sync in signup route | 15 min | ~0 (reliability improvement) |
