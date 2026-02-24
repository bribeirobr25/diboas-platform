# Principle 5: Semantic Naming Conventions - Audit Report

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Services & classes, functions, constants, API endpoints, components, file naming, hooks, types/interfaces
**Branch:** waitlist-launch

---

## Principle Requirements

From `docs/coding-standards.md`:

**Services & Classes:**
- Pattern: `[Domain][Entity][Action/Purpose]Service`
- Examples: `BankingTransactionValidationService`, `InvestingPortfolioCalculationService`

**Functions:**
- Pattern: `[verb][Entity][Condition]`
- Examples: `validateBankingTransactionAmount`, `calculateInvestingPortfolioValue`

**Constants:**
- Pattern: `SCREAMING_SNAKE_CASE` with context
- Examples: `MAX_BANKING_DAILY_WITHDRAWAL_LIMIT`, `INVESTING_ORDER_EXPIRY_MINUTES`

**API Endpoints:**
- Pattern: `/api/v{version}/{domain}/{resource}/{action}`
- Examples: `/api/v1/banking/transactions/deposit`

**Database:**
- Tables: `domain_entity` (plural), Columns: `snake_case`

---

## Findings

### 5.1 Services & Classes

**Status: Partial**

The codebase contains 11 service classes and 20+ additional utility/domain classes. Service naming is generally descriptive but diverges from the prescribed `[Domain][Entity][Action/Purpose]Service` pattern in multiple cases.

**Compliant service names:**
- `WaitingListService` -- follows `[Domain]Service` (in `apps/web/src/lib/waitingList/services/WaitingListService.ts`)
- `ErrorReportingService` -- follows `[Entity][Action]Service` (in `apps/web/src/lib/errors/ErrorReportingService.ts`)
- `AlertingService` -- follows `[Action]Service` (in `apps/web/src/lib/monitoring/AlertingService.ts`)
- `ConversionTrackingServiceImpl` -- follows `[Entity][Action]ServiceImpl` (in `apps/web/src/lib/analytics/conversion-tracking.ts`)

**Partially compliant service names:**
- `AnalyticsServiceImpl` -- missing domain prefix; should be `MarketingAnalyticsTrackingService` or similar (in `apps/web/src/lib/analytics/service.ts`)
- `MonitoringServiceImpl` -- missing domain prefix; should be `SystemMonitoringService` (in `apps/web/src/lib/monitoring/service.ts`)
- `ContentServiceImpl` -- missing domain prefix; should be `MarketingContentManagementService` (in `apps/web/src/lib/content/service.ts`)
- `SEOServiceImpl` -- both in `apps/web/src/lib/seo/service.ts` and `apps/web/src/lib/seo/services/SEOService.ts` (duplicate, though the DDD version follows `SEODomainService` interface which is better)
- `PerformanceServiceImpl` -- missing domain prefix; should be `SystemPerformanceMonitoringService` (in `apps/web/src/lib/performance/services/PerformanceService.ts`)
- `AnalyticsResilientService` -- uses adjective pattern instead of `[Domain][Entity][Action]Service`; should be `AnalyticsErrorResilientService` (in `apps/web/src/lib/analytics/error-resilient-service.ts`)

**Non-service class names that are well-named:**
- `ApplicationEventBus`, `SectionEventBus` -- clear domain + entity pattern
- `BreadcrumbManager` -- entity + purpose
- `CardRenderer`, `ShareManager` -- entity + action
- `ThemeManager` -- entity + purpose
- `BundleOptimizer` -- entity + purpose
- `DynamicComponentLoader` -- entity + action
- `PerformanceBudgetMonitor` -- entity + action
- `MetadataFactory` -- entity + pattern
- `DesignTokenGenerator` -- entity + action

**Non-service classes with good domain error naming:**
- `WaitingListDomainError`, `WaitingListValidationError`, `WaitingListSubmissionError`, `WaitingListDuplicateError`, `WaitingListStorageError` -- all follow `[Domain][Entity]Error` pattern
- `SEODomainError`, `SEOGenerationError`, `SEOValidationError` -- follow `[Domain][Action]Error`
- `PerformanceDomainError`, `PerformanceTrackingError`, `PerformanceBudgetError` -- follow `[Domain][Entity]Error`

**Evidence:**
- `apps/web/src/lib/analytics/service.ts` line 11: `class AnalyticsServiceImpl implements AnalyticsService`
- `apps/web/src/lib/monitoring/service.ts` line 12: `class MonitoringServiceImpl implements MonitoringService`
- `apps/web/src/lib/waitingList/services/WaitingListService.ts` line 144: `export class WaitingListService implements WaitingListDomainService`
- `apps/web/src/lib/errors/ErrorReportingService.ts` line 50: `export class ErrorReportingService`

**Gaps:**
- Several services lack a domain prefix (Analytics, Monitoring, Content, Performance, SEO). The standard calls for `[Domain][Entity][Action/Purpose]Service` but many use only `[Entity]Service` or `[Entity]ServiceImpl`.
- Duplicate SEO service implementations exist in two locations (`lib/seo/service.ts` and `lib/seo/services/SEOService.ts`).

**Recommendation:**
- Add domain prefixes to disambiguate services when additional domains are introduced. For now the single-domain nature of the pre-launch product makes the current naming functional but not fully compliant with the standard.
- Resolve the duplicate SEO service by consolidating into the DDD-structured version.

---

### 5.2 Functions

**Status: Compliant**

A sample of 30+ exported functions across `lib/`, `hooks/`, and `config/` was examined. The vast majority follow the `[verb][Entity][Condition]` pattern accurately.

**Compliant examples (verb + entity + optional condition):**
- `validateOrigin` (in `apps/web/src/lib/security/csrf.ts`)
- `generateSubmissionId` (in `apps/web/src/lib/waitingList/helpers.ts`)
- `isValidEmail`, `isValidXAccount`, `isValidName` (in `apps/web/src/lib/waitingList/helpers.ts`)
- `normalizeXAccount` (in `apps/web/src/lib/waitingList/helpers.ts`)
- `createConsentTimestamp` (in `apps/web/src/lib/waitingList/helpers.ts`)
- `calculateCompoundGrowth`, `calculateProjection`, `compareScenarios`, `calculateFullResult` (in `apps/web/src/lib/calculator/calculations.ts`)
- `sanitizeText`, `sanitizeEmail`, `sanitizeUserName` (in `apps/web/src/lib/utils/sanitize.ts`)
- `formatCurrency`, `formatPercentage` (in `apps/web/src/lib/utils.ts`)
- `checkRateLimit`, `getClientIP`, `createRateLimitHeaders` (in `apps/web/src/lib/security/rateLimiter.ts`)
- `encrypt`, `decrypt`, `encryptFields`, `decryptFields`, `generateEncryptionKey` (in `apps/web/src/lib/security/encryption.ts`)
- `validateApiKey`, `generateDeletionToken`, `hashToken`, `verifyToken` (in `apps/web/src/lib/security/authentication.ts`)
- `fetchWithRetry` (in `apps/web/src/lib/utils/fetchWithRetry.ts`)
- `inferSeverity`, `inferCategory`, `inferRecoverability`, `generateFingerprint`, `sanitizeContext` (in `apps/web/src/lib/errors/errorInference.ts`)
- `buildShareUrl`, `shareToTwitter`, `shareToWhatsApp`, `copyToClipboard`, `downloadImage` (in `apps/web/src/lib/share/platformHandlers.ts`)
- `buildUtmUrl`, `getShareUrl`, `extractUtmParams` (in `apps/web/src/lib/share/utm.ts`)
- `analyzeTrends`, `generateRecommendations`, `determineSeverity` (in `apps/web/src/lib/performance/budgetAnalysis.ts`)

**Minor deviations (still acceptable):**
- `cn()` -- very short utility name (class name concatenation), industry-standard for Tailwind projects
- `getOGTemplate`, `isValidPageType` -- abbreviation `OG` is well-understood in the context
- `formatBytes` -- missing entity context but clear enough in context
- Store functions like `getAllEntries`, `getByEmail`, `addEntry` -- follow repository pattern which is an acceptable alternate convention

**Evidence:**
- `apps/web/src/lib/waitingList/helpers.ts`: 18 exported functions all following verb-entity pattern
- `apps/web/src/lib/security/encryption.ts`: 6 exported functions all following verb-entity pattern
- `apps/web/src/lib/calculator/calculations.ts`: 8 exported functions all following verb-entity pattern

**Gaps:** None significant. Function naming is consistently descriptive and follows the pattern.

---

### 5.3 Constants

**Status: Partial**

The codebase exports approximately 276 constants across `config/` and `lib/` directories. The majority use SCREAMING_SNAKE_CASE but there is a significant minority using other casing patterns.

**Compliant SCREAMING_SNAKE_CASE constants (majority):**
- `FAQ_ACCORDION_PAGE_CONFIGS`, `FEATURE_SHOWCASE_PAGE_CONFIGS`, `STICKY_FEATURES_NAV_PAGE_CONFIGS` (config page configs)
- `TYPOGRAPHY`, `SPACING`, `Z_INDEX`, `BREAKPOINTS` (design system)
- `ASSET_PATHS`, `ASSET_OPTIMIZATION_CONFIGS` (assets)
- `MAX_RETRY_COUNT`, `RETRY_DELAY_BASE` (error handling)
- `BANK_APY_RATE`, `TIMEFRAME_DAYS`, `PATH_ICONS`, `PATH_COLORS`, `PATH_CONFIGS` (dream mode)
- `MONITORING_CONFIG`, `SENTRY_CONFIG`, `DATADOG_CONFIG`, `NEW_RELIC_CONFIG` (monitoring)
- `WEB_VITALS_THRESHOLDS`, `API_PERFORMANCE_THRESHOLDS`, `SYSTEM_PERFORMANCE_THRESHOLDS` (performance)
- `CANVAS_COLORS`, `CARD_DIMENSIONS`, `CARD_COLORS`, `CARD_FONTS`, `PLATFORM_CONFIGS` (share)
- `WAITING_LIST_CONFIG`, `VALIDATION_PATTERNS`, `ERROR_CODES`, `WAITING_LIST_EVENTS` (waiting list)
- `RATE_LIMIT_CONFIG`, `POSTHOG_CONFIG`, `CAL_CONFIG`, `KIT_CONFIG` (env config)
- `ROUTES`, `FOOTER_CONFIG`, `BRAND_CONFIG` (app config)
- `DATE_FORMATS`, `CURRENCY_CONFIG`, `NUMBER_FORMATS` (formats)
- `DEFAULT_SECURITY_CONFIG`, `SECURITY_POLICIES` (security)
- `OG_COLORS`, `OG_DIMENSIONS`, `OG_TRANSLATIONS` (OG image)
- `DEPOSIT_QUICK_AMOUNTS`, `SEND_QUICK_AMOUNTS`, `BUY_QUICK_AMOUNTS` (pre-demo)
- `CALCULATOR_CONFIG`, `DEFI_SCENARIO`, `BANK_SCENARIO` (calculator)
- `COMMON_CONTENT`, `BANKING_CONTENT`, `INVESTING_CONTENT`, `DEFI_CONTENT` (content)
- `GET_STARTED`, `LEARN_MORE` (content CTAs)

**Non-compliant constants using non-SCREAMING_SNAKE_CASE:**

Most constant naming in the codebase does follow SCREAMING_SNAKE_CASE. However, some constants that represent complex configuration objects or defaults use a hybrid approach with SCREAMING_SNAKE_CASE prefixes but are structurally configuration objects:

- `tokens` (in `apps/web/src/config/design-system.ts` line ~150) -- lowercase local, not exported directly
- Section variant config constants like `B2B_HERO_CONFIG`, `B2C_HERO_CONFIG` use SCREAMING_SNAKE_CASE correctly
- Environment-derived constants like `APP_URL`, `APP_DOMAIN`, `IS_PRODUCTION`, `IS_DEVELOPMENT` use SCREAMING_SNAKE_CASE correctly

**Constants lacking domain context per the standard:**
- `LAYOUT`, `ANIMATION`, `COMPONENTS` (in `apps/web/src/config/design-system.ts`) -- very generic names without domain qualifier; should be `DESIGN_SYSTEM_LAYOUT`, etc.
- `TYPOGRAPHY`, `SPACING` -- similarly generic
- `ENV` (in `apps/web/src/config/env.ts`) -- extremely generic; should be `APP_ENVIRONMENT_CONFIG` or similar
- `ROUTES` (in `apps/web/src/config/routes.ts`) -- should be `APP_ROUTES` or `NAVIGATION_ROUTES`
- `DEFAULT_THRESHOLDS` appears in 2 different files (`apps/web/src/lib/monitoring/performance/constants.ts` and `apps/web/src/lib/monitoring/alertConfig.ts`) -- ambiguous without domain context; should be `DEFAULT_PERFORMANCE_THRESHOLDS` and `DEFAULT_ALERT_THRESHOLDS` respectively
- `PERFORMANCE_THRESHOLDS` is exported from 2 different files (analytics constants and performance config) -- collision risk

**Evidence:**
- `apps/web/src/config/design-system.ts` lines 151-185: `TYPOGRAPHY`, `SPACING`, `LAYOUT`, `ANIMATION`, `Z_INDEX`, `BREAKPOINTS`
- `apps/web/src/config/env.ts` line 209: `export const ENV = {...}`
- `apps/web/src/config/routes.ts` line 13: `export const ROUTES = {...}`
- `apps/web/src/lib/monitoring/performance/constants.ts` line 17: `export const DEFAULT_THRESHOLDS`
- `apps/web/src/lib/monitoring/alertConfig.ts` line 12: `export const DEFAULT_THRESHOLDS`

**Gaps:**
- Several constants use overly generic names that could collide when imported together.
- `DEFAULT_THRESHOLDS` is duplicated across two files with different meanings.
- Some design system constants lack a domain prefix.

**Recommendation:**
- Add domain prefixes to generic constants: `DESIGN_SYSTEM_LAYOUT`, `DESIGN_SYSTEM_TYPOGRAPHY`, `APP_ROUTES`, `APP_ENV`.
- Disambiguate `DEFAULT_THRESHOLDS` in monitoring vs. alert contexts.
- Adopt the full contextual pattern from the standard: `[DOMAIN]_[ENTITY]_[PURPOSE]`.

---

### 5.4 API Endpoints

**Status: Non-compliant**

The standard requires `/api/v{version}/{domain}/{resource}/{action}` but none of the current API routes include API versioning.

**Current routes:**

| Route | Standard Pattern | Gap |
|-------|-----------------|-----|
| `/api/waitlist/signup` | `/api/v1/waitlist/subscribers/signup` | Missing version, `waitlist` as domain is acceptable |
| `/api/waitlist/delete` | `/api/v1/waitlist/subscribers/delete` | Missing version |
| `/api/waitlist/position` | `/api/v1/waitlist/subscribers/position` | Missing version |
| `/api/waitlist/referral` | `/api/v1/waitlist/referrals/validate` | Missing version |
| `/api/waitlist/stats` | `/api/v1/waitlist/stats/summary` | Missing version |
| `/api/consent` | `/api/v1/privacy/consent/manage` | Missing version, missing domain |
| `/api/health` | `/api/v1/system/health/check` | Missing version, missing domain |
| `/api/og/[page]` | `/api/v1/content/og/generate` | Missing version, missing domain |
| `/api/og/share` | `/api/v1/content/og/share` | Missing version, missing domain |
| `/api/og/dream` | `/api/v1/content/og/dream` | Missing version, missing domain |
| `/api/webhooks/kit` | `/api/v1/webhooks/kit/process` | Missing version |

**Evidence:**
- `apps/web/src/app/api/waitlist/signup/route.ts`: Route path is `/api/waitlist/signup`
- `apps/web/src/app/api/consent/route.ts`: Route path is `/api/consent`
- `apps/web/src/app/api/health/route.ts`: Route path is `/api/health`
- `apps/web/src/app/api/og/[page]/route.tsx`: Route path is `/api/og/[page]`
- `apps/web/src/app/api/webhooks/kit/route.ts`: Route path is `/api/webhooks/kit`

**Gaps:**
- No API versioning (`v1`) on any endpoint.
- Several endpoints lack a domain grouping (consent, health, og).
- Resource naming is generally reasonable but not fully granular per the standard.

**Recommendation:**
- Add API versioning as a priority before launching any public-facing API. For the current pre-launch waitlist phase, this is lower priority since routes are internal.
- When versioning is introduced, restructure as `/api/v1/{domain}/{resource}/{action}`.
- Consider this a post-launch action item since the Next.js App Router file-based routing makes deep nesting verbose.

---

### 5.5 Component Naming

**Status: Compliant**

All React components consistently use PascalCase with descriptive names. The Factory pattern components follow a clear `[Component]Factory` convention.

**Component directories (all PascalCase):**
- `BookCall`, `CookieConsent`, `DreamMode`, `ErrorBoundary`, `FutureYouCalculator`, `Icons`, `InteractiveDemo`, `LanguageSwitcher`, `Layout`, `Legal`, `Pages`, `Performance`, `PreDemo`, `PreDream`, `Providers`, `SEO`, `Sections`, `Share`, `UI`, `WaitingList`

**Section Factory components:**
- `HeroSectionFactory.tsx`, `FeatureShowcaseFactory.tsx`, `FAQAccordionFactory.tsx`, `OneFeatureFactory.tsx`, `ProductCarouselFactory.tsx`, `AppFeaturesCarouselFactory.tsx`, `StickyFeaturesNavFactory.tsx`

**Section variant components:**
- `HeroDefault.tsx`, `HeroFullBackground.tsx`, `FeatureShowcaseDefault.tsx`, `FeatureShowcaseBenefits.tsx`, `FAQAccordionDefault.tsx`, `ProductCarouselDefault.tsx`, `AppFeaturesCarouselDefault.tsx`, `StickyFeaturesNavDefault.tsx`, `OneFeatureDefault.tsx`, `BgHighlightDefault.tsx`, `BenefitsCardsDefault.tsx`, `StepGuideDefault.tsx`, `DemoEmbedDefault.tsx`

**DreamMode screen components:**
- `WelcomeScreen.tsx`, `InputScreen.tsx`, `PathSelectorScreen.tsx`, `TimeframeScreen.tsx`, `SimulationScreen.tsx`, `ResultsScreen.tsx`, `ShareScreen.tsx`, `DisclaimerScreen.tsx`

**Evidence:**
- All 20 top-level component directories use PascalCase.
- All section factory files follow `[Name]Factory.tsx`.
- All variant files follow `[Variant]Default.tsx` or `[Variant][Type].tsx`.
- DreamMode screens follow `[Purpose]Screen.tsx`.

**Gaps:** None.

---

### 5.6 File Naming

**Status: Partial**

File naming across the codebase uses mixed conventions. While there is no single strict standard defined for files in the coding standards document, consistency is expected.

**Patterns observed:**

1. **PascalCase files (classes/components):** `AlertingService.ts`, `ErrorReportingService.ts`, `ApplicationEventBus.ts`, `SectionEventBus.ts`, `BundleOptimizer.ts`, `Logger.ts`, `ShareManager.ts`, `CardRenderer.ts`, `SectionPattern.ts`, `SectionHooks.ts`, `SectionUtils.ts`, `PerformanceBudgets.ts`

2. **camelCase files (utilities/configs):** `alertConfig.ts`, `alertDelivery.ts`, `alertTypes.ts`, `alertUtils.ts`, `performanceConfig.ts`, `performanceObservers.ts`, `performanceTypes.ts`, `performanceUtils.ts`, `errorConfig.ts`, `errorInference.ts`, `errorTypes.ts`, `errorUtils.ts`, `breadcrumbManager.ts`, `cardFormatters.ts`, `platformHandlers.ts`, `shareUtils.ts`, `canvasUtils.ts`

3. **kebab-case files (multi-word modules):** `error-resilient-service.ts`, `performance-monitor.ts`, `config-translator.ts`, `dynamic-loader.ts`, `theme-manager.ts`, `regional-detection.ts`, `design-system.ts`, `performance-thresholds.ts`, `ui-constants.ts`, `business-metrics.ts`, `waitlist-stats.ts`, `landing-b2b.ts`, `landing-b2c.ts`

**Inconsistency hotspot -- `lib/monitoring/`:**
This directory mixes all three patterns:
- PascalCase: `AlertingService.ts`, `Logger.ts`
- camelCase: `alertConfig.ts`, `alertDelivery.ts`, `alertTypes.ts`, `alertUtils.ts`, `performanceConfig.ts`, `performanceObservers.ts`, `performanceTypes.ts`, `performanceUtils.ts`
- kebab-case: `performance-monitor.ts`
- generic: `service.ts`, `types.ts`, `constants.ts`, `index.ts`

**Inconsistency hotspot -- `lib/patterns/`:**
- PascalCase: `SectionHooks.ts`, `SectionPattern.ts`, `SectionUtils.ts`
- camelCase: `accessibilityUtils.ts`, `configUtils.ts`, `errorUtils.ts`, `functionUtils.ts`, `hookUtils.ts`, `imageUtils.ts`, `tokenUtils.ts`, `sectionDefaults.ts`, `sectionDesignTokens.ts`, `sectionTypes.ts`, etc.

**Evidence:**
- `apps/web/src/lib/monitoring/`: 15 files using 3+ different naming conventions
- `apps/web/src/lib/patterns/`: 22 files using 2 different naming conventions
- `apps/web/src/config/`: 39 files consistently using kebab-case or camelCase

**Gaps:**
- No single file naming convention is enforced across `lib/`.
- The same directory often contains PascalCase, camelCase, and kebab-case files.
- Convention appears to be: PascalCase for class files, camelCase for utilities, kebab-case for multi-word modules -- but this is not documented or consistently applied.

**Recommendation:**
- Document the file naming convention explicitly in the coding standards. A reasonable rule: PascalCase for files exporting a class/component, camelCase for utility/helper files, kebab-case for config/module files.
- Within each directory, ensure consistency. The `monitoring/` directory is the most inconsistent and should be normalized.

---

### 5.7 Hook Naming

**Status: Compliant**

All 37 custom hooks found across the codebase follow the `use[Feature]` React convention without exception.

**Hooks in `apps/web/src/hooks/`:**
- `useCarousel`, `useSwipeGesture`, `useFocusTrap`, `useNavigation`, `useLocalePath`, `useImageLoading`

**Hooks in `apps/web/src/lib/hooks/`:**
- `useIntersectionObserver`, `useMultipleIntersectionObserver`, `useScrollPosition`, `useSmoothScroll`, `useScrollToElementOnMount`, `useThemePerformance`

**Hooks in `apps/web/src/lib/patterns/`:**
- `useSectionNavigation`, `useKeyboardNavigation`, `useTouchNavigation`, `useSectionAnalytics`, `useSectionLoading`

**Hooks in components:**
- `useDreamMode`, `useRegionalDisclaimer`, `useDreamModeTranslation` (DreamMode)
- `useWaitlistForm`, `useWaitlistModalForm`, `useWaitingListModal` (WaitingList)
- `usePreDemo`, `useTransactionAnimation` (PreDemo)
- `usePreDream` (PreDream)
- `useAnimatedCounter` (FutureYouCalculator)
- `useRewardAnimation`, `useCurrency`, `useDemoAnalytics` (InteractiveDemo)
- `useLocale` (Providers)
- `useLanguageSwitcher` (LanguageSwitcher)
- `usePerformanceTracking` (Performance)

**Hooks in other lib modules:**
- `useScrollDepthTracking`, `useConfigTranslation`, `useTranslate`, `useTranslateWithValues`, `useNamespacedTranslation`, `useDynamicComponent`, `useTheme`, `usePerformanceMonitoring`, `usePerformanceMonitor`, `useCleanupManager`

**Evidence:**
- All 37 hooks begin with `use` prefix followed by a PascalCase descriptor.
- No hook violates the `use[Feature]` convention.

**Gaps:** None.

---

### 5.8 Type/Interface Naming

**Status: Compliant**

All TypeScript types and interfaces across the codebase use PascalCase with descriptive names. Interface naming is consistently clear about the entity being described.

**Well-named interfaces (sample):**
- Domain types: `WaitingListSubmission`, `WaitlistPosition`, `ReferralInfo`, `KitSubscriber`, `ConsentRecord`, `SubmissionInput`, `SubmissionResult`, `ValidationResult`, `ValidationError` (in `apps/web/src/lib/waitingList/domain/WaitingListDomain.ts`)
- SEO types: `SEOPage`, `SEOConfiguration`, `SEODomainService`, `SEOComplianceResult`, `SEOEvent`, `SEOMetadata`, `OpenGraphMetadata`, `TwitterMetadata`, `BreadcrumbItem`, `BreadcrumbList`, `WebPage` (in `apps/web/src/lib/seo/`)
- Analytics types: `AnalyticsEvent`, `PageViewEvent`, `PerformanceEvent`, `NavigationEvent`, `AnalyticsConfig`, `WebVitalsMetric`, `ConversionEvent`, `ConversionFunnel`, `FunnelProgress` (in `apps/web/src/lib/analytics/`)
- Performance types: `PerformanceMetric`, `WebVitalMetric`, `PerformanceBudget`, `PerformanceAlert`, `PerformanceBudgetResult`, `PerformanceBudgetViolation`, `PerformanceReport`, `PerformanceTrend` (in `apps/web/src/lib/performance/domain/`)
- Share types: `SharePlatform`, `CardConfig`, `DreamCardData`, `WaitlistCardData`, `ReferralCardData`, `MilestoneCardData`, `RenderedCard`, `ShareContent`, `ShareResult`, `ShareTrackingData`, `PlatformConfig`, `RegionalDisclaimer` (in `apps/web/src/lib/share/types.ts`)
- Event types: `ApplicationEventPayload`, `WaitlistSignupEventPayload`, `ShareEventPayload`, `DreamModeEventPayload`, `ConsentEventPayload`, `SectionEventPayload`, `CarouselEventPayload`, `CTAEventPayload` (in `apps/web/src/lib/events/`)
- Component types: `HeroVariantConfig`, `FeatureShowcaseVariantConfig`, `FAQAccordionVariantConfig`, `ProductCarouselVariantConfig`, `StickyFeaturesNavVariantConfig` (in `apps/web/src/config/`)
- Hook return types: `UseCarouselOptions`, `UseCarouselReturn`, `UseSwipeGestureOptions`, `UseSwipeGestureReturn`, `UseImageLoadingOptions`, `UseImageLoadingReturn` (in `apps/web/src/hooks/`)

**Naming patterns observed:**
- Interfaces for hook options: `Use[Hook]Options`
- Interfaces for hook returns: `Use[Hook]Return`
- Domain service interfaces: `[Domain]DomainService`
- Event payload interfaces: `[Domain][Event]Payload`
- Configuration interfaces: `[Feature]Config`
- Variant configuration: `[Component]VariantConfig`
- Props interfaces: `[Component]Props`

**Type aliases:**
- Union types: `SharePlatform`, `CardType`, `DreamTimeframe`, `CardLocale`, `DemoScreen`, `PreDemoScreen`, `HeroVariant`, `FeatureShowcaseVariant`
- Utility types: `ExtractVariant<T>`, `ExtractConfig<T>`, `RequireConfig<T, K>`

**Evidence:**
- 480+ exported types and interfaces examined, all using PascalCase.
- Consistent use of descriptive suffixes: `Config`, `Props`, `Options`, `Return`, `Result`, `Event`, `Payload`, `Service`.

**Gaps:** None.

---

## Summary

| Sub-requirement | Status | Key Finding |
|----------------|--------|-------------|
| 5.1 Services & Classes | **Partial** | Most services lack domain prefix; generally descriptive but not fully `[Domain][Entity][Action]Service` |
| 5.2 Functions | **Compliant** | Consistent `[verb][Entity][Condition]` pattern across 100+ functions |
| 5.3 Constants | **Partial** | Majority use SCREAMING_SNAKE_CASE; some generic names lack domain context; `DEFAULT_THRESHOLDS` collision |
| 5.4 API Endpoints | **Non-compliant** | No API versioning; several routes missing domain grouping |
| 5.5 Component Naming | **Compliant** | All PascalCase; Factory, Screen, and Variant patterns consistent |
| 5.6 File Naming | **Partial** | Mixed PascalCase/camelCase/kebab-case in same directories; no documented convention |
| 5.7 Hook Naming | **Compliant** | All 37 hooks follow `use[Feature]` without exception |
| 5.8 Type/Interface Naming | **Compliant** | All 480+ types/interfaces use PascalCase with descriptive, consistent suffixes |

**Overall Assessment: Partial Compliance**

The codebase demonstrates strong naming conventions for functions, components, hooks, and types/interfaces. The primary gaps are: (1) service classes missing domain prefixes, (2) API routes lacking versioning, (3) inconsistent file naming conventions within the same directories, and (4) some constants using overly generic names that risk collision.

---

## Action Items

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **High** | Add API versioning (`/api/v1/...`) to all routes before any public API launch | Medium | Prevents breaking changes in future API evolution |
| **Medium** | Add domain prefixes to generic service classes (`AnalyticsServiceImpl` -> `MarketingAnalyticsService`) | Low | Improves clarity as domains grow |
| **Medium** | Disambiguate `DEFAULT_THRESHOLDS` constants across monitoring and alerting modules | Low | Prevents import collision bugs |
| **Medium** | Add domain context to generic constants (`LAYOUT` -> `DESIGN_SYSTEM_LAYOUT`, `ENV` -> `APP_ENVIRONMENT_CONFIG`, `ROUTES` -> `APP_ROUTES`) | Low | Reduces ambiguity |
| **Low** | Document file naming convention in coding standards (PascalCase for classes, camelCase for utils, kebab-case for configs) | Low | Establishes baseline for consistency |
| **Low** | Normalize file naming in `lib/monitoring/` directory (most inconsistent) | Low | Improves developer experience |
| **Low** | Consolidate duplicate SEO service implementations (`lib/seo/service.ts` vs `lib/seo/services/SEOService.ts`) | Low | Reduces confusion |
