# Principle 6: File Decoupling & Organization - Audit Report

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Services (`lib/`), components, hooks, utilities, config files, barrel exports, module organization
**Branch:** waitlist-launch

---

## Principle Requirements

From `docs/coding-standards.md`:

- Single responsibility per file
- Services: Max 200 lines (prefer 100-150)
- Components: Max 150 lines (prefer 80-120)
- Utilities: Max 100 lines per file
- Break large files into focused modules

---

## Findings

### 6.1 Service File Line Limits (Max 200 Lines)

**Status: Non-compliant**

35 service/library files in `apps/web/src/lib/` exceed the 200-line limit. The worst offenders are more than 2x the limit. Several files have already been partially decomposed (e.g., `ErrorReportingService.ts` delegates to `errorTypes.ts`, `errorConfig.ts`, `errorInference.ts`, `breadcrumbManager.ts`), showing awareness of the standard, but the main orchestrator files remain oversized.

**Violations Table (Services > 200 lines):**

| File | Lines | Over By |
|------|------:|--------:|
| `lib/events/ApplicationEventBus.ts` | 524 | +324 |
| `lib/performance/PerformanceBudgets.ts` | 467 | +267 |
| `lib/errors/ErrorReportingService.ts` | 466 | +266 |
| `lib/analytics/conversion-tracking.ts` | 438 | +238 |
| `lib/theme/theme-manager.ts` | 424 | +224 |
| `lib/waitingList/store.ts` | 392 | +192 |
| `lib/share/constants.ts` | 377 | +177 |
| `lib/share/ShareManager.ts` | 369 | +169 |
| `lib/patterns/index.ts` | 364 | +164 |
| `lib/waitingList/services/WaitingListService.ts` | 355 | +155 |
| `lib/events/SectionEventBus.ts` | 354 | +154 |
| `lib/monitoring/performance-monitor.ts` | 352 | +152 |
| `lib/monitoring/AlertingService.ts` | 343 | +143 |
| `lib/performance/services/PerformanceService.ts` | 332 | +132 |
| `lib/analytics/error-resilient-service.ts` | 323 | +123 |
| `lib/seo/services/SEOService.ts` | 319 | +119 |
| `lib/monitoring/service.ts` | 308 | +108 |
| `lib/hooks/useIntersectionObserver.ts` | 308 | +108 |
| `lib/monitoring/Logger.ts` | 305 | +105 |
| `lib/seo/constants.ts` | 304 | +104 |
| `lib/performance/dynamic-loader.ts` | 304 | +104 |
| `lib/monitoring/performance/usePerformanceMonitor.ts` | 303 | +103 |
| `lib/seo/metadata-factory.ts` | 300 | +100 |
| `lib/share/cardRenderers.ts` | 286 | +86 |
| `lib/hooks/useSmoothScroll.ts` | 273 | +73 |
| `lib/calculator/calculations.ts` | 248 | +48 |
| `lib/security/encryption.ts` | 230 | +30 |
| `lib/security/rateLimiter.ts` | 225 | +25 |
| `lib/performance/budgetDefinitions.ts` | 218 | +18 |
| `lib/share/platformHandlers.ts` | 215 | +15 |
| `lib/i18n/config-translator.ts` | 215 | +15 |
| `lib/share/types.ts` | 213 | +13 |
| `lib/optimization/bundle/bundleAnalysis.ts` | 211 | +11 |
| `lib/seo/service.ts` | 207 | +7 |
| `lib/analytics/service.ts` | 203 | +3 |

All paths are relative to `apps/web/src/`.

**Evidence:**
- `ApplicationEventBus.ts` (524 lines): Contains enum definitions, 8 payload interfaces, a union type, validation schema, the main class with emit/subscribe/validate/history/analytics methods, and development utilities. At least 3 responsibilities: type definitions, event bus logic, and analytics mapping.
- `PerformanceBudgets.ts` (467 lines): Contains the `PerformanceBudgetMonitor` class with web vitals monitoring, custom metrics monitoring, periodic checks, budget enforcement, violation handling, and daily report generation.
- `ErrorReportingService.ts` (466 lines): Already partially decomposed (imports from `errorTypes.ts`, `errorConfig.ts`, `errorInference.ts`, `breadcrumbManager.ts`), but the main class still contains 13 methods spanning initialization, error handling, reporting, alerting, occurrence tracking, statistics, and cleanup.
- `conversion-tracking.ts` (438 lines): Combines interface definitions, funnel configuration data, localStorage persistence, session management, analytics integration, and the main tracking class.

**Gaps:**
- 35 files exceed the 200-line service limit.
- 14 of those exceed 300 lines (1.5x the limit).
- 5 files exceed 400 lines (2x the limit).
- Some files (e.g., `patterns/index.ts` at 364 lines) are barrel exports that contain substantial logic, violating both the line limit and the barrel export convention.

**Recommendation:**
- **Priority 1 (> 400 lines, 5 files):** Split `ApplicationEventBus.ts` into `eventTypes.ts`, `eventValidation.ts`, `analyticsMapping.ts`, and a slimmer `ApplicationEventBus.ts`. Split `PerformanceBudgets.ts` monitoring methods into `webVitalsMonitor.ts`, `customMetricsMonitor.ts`, `periodicChecks.ts`. Decompose `conversion-tracking.ts` into `conversionTypes.ts`, `funnelDefinitions.ts`, `funnelPersistence.ts`, and a slimmer `ConversionTrackingService.ts`. Further slim `ErrorReportingService.ts` by extracting the send/log methods. Split `theme-manager.ts` by extracting DOM manipulation and preference storage methods.
- **Priority 2 (300-400 lines, 9 files):** Decompose into focused modules following the same patterns.
- **Priority 3 (200-300 lines, 21 files):** Review and split where natural seams exist.

---

### 6.2 Component File Line Limits (Max 150 Lines)

**Status: Non-compliant**

50 component files in `apps/web/src/components/` exceed the 150-line limit. The worst offenders are 3x the limit. PreDemo screen components are the most oversized category.

**Violations Table (Components > 150 lines):**

| File | Lines | Over By |
|------|------:|--------:|
| `PreDemo/screens/WalletDetailsScreen.tsx` | 464 | +314 |
| `PreDemo/screens/BuyScreen.tsx` | 365 | +215 |
| `PreDemo/screens/ConfirmationScreen.tsx` | 359 | +209 |
| `Sections/ProductCarousel/.../ProductCarouselDefault.tsx` | 352 | +202 |
| `Legal/LegalDocument.tsx` | 318 | +168 |
| `FutureYouCalculator/FutureYouCalculator.tsx` | 317 | +167 |
| `Icons/ProfessionalIcons.tsx` | 312 | +162 |
| `Sections/FeatureShowcase/.../FeatureShowcaseDefault.tsx` | 290 | +140 |
| `Pages/StrategiesPageContent.tsx` | 276 | +126 |
| `Layout/Footer/MinimalFooter.tsx` | 268 | +118 |
| `Share/ShareModal.tsx` | 263 | +113 |
| `Sections/FAQAccordion/.../FAQAccordionDefault.tsx` | 250 | +100 |
| `DreamMode/DreamModeProvider.tsx` | 237 | +87 |
| `Sections/AppFeaturesCarousel/.../AppFeaturesCarouselDefault.tsx` | 231 | +81 |
| `Sections/SocialProofSection/SocialProofSection.tsx` | 225 | +75 |
| `Sections/TreasuryCalculator/TreasuryCalculator.tsx` | 224 | +74 |
| `Sections/FeatureShowcase/.../FeatureShowcaseBenefits.tsx` | 222 | +72 |
| `Pages/AboutPageContent.tsx` | 222 | +72 |
| `Sections/HeroSection/.../HeroDefault.tsx` | 221 | +71 |
| `Legal/PrivacyPolicyContent.tsx` | 221 | +71 |
| `Share/ShareButtons.tsx` | 218 | +68 |
| `Sections/OneFeature/.../OneFeatureDefault.tsx` | 217 | +67 |
| `PreDemo/PreDemo.tsx` | 214 | +64 |
| `Layout/Navigation/MinimalNavigation.tsx` | 214 | +64 |
| `Sections/AppFeaturesCarousel/AppFeaturesCarouselFactory.tsx` | 210 | +60 |
| `WaitingList/WaitlistModalForm.tsx` | 208 | +58 |
| `Share/ShareableCard.tsx` | 208 | +58 |
| `Sections/ProductCarousel/ProductCarouselFactory.tsx` | 200 | +50 |
| `DreamMode/screens/ShareScreen.tsx` | 199 | +49 |
| `PreDemo/screens/SendScreen.tsx` | 197 | +47 |
| `Legal/TermsOfUseContent.tsx` | 196 | +46 |
| `DreamMode/screens/ResultsScreen.tsx` | 189 | +39 |
| `CookieConsent/CookieConsent.tsx` | 186 | +36 |
| `BookCall/CalEmbed.tsx` | 186 | +36 |
| `WaitingList/WaitlistPosition.tsx` | 180 | +30 |
| `Sections/FeatureShowcase/FeatureShowcaseFactory.tsx` | 180 | +30 |
| `WaitingList/ReferralLink.tsx` | 179 | +29 |
| `PreDemo/screens/DepositScreen.tsx` | 179 | +29 |
| `ErrorBoundary/NavigationErrorBoundary.tsx` | 179 | +29 |
| `PreDream/components/ShareDreamSection.tsx` | 178 | +28 |
| `BookCall/CalButton.tsx` | 178 | +28 |
| `Sections/OneFeature/OneFeatureFactory.tsx` | 175 | +25 |
| `Layout/Navigation/DesktopNav.tsx` | 169 | +19 |
| `WaitingList/WaitingListModal.tsx` | 163 | +13 |
| `PreDream/screens/SimulationScreen.tsx` | 160 | +10 |
| `InteractiveDemo/InteractiveDemo.tsx` | 160 | +10 |
| `Sections/BgHighlight/.../BgHighlightDefault.tsx` | 159 | +9 |
| `PreDemo/components/QuickActions.tsx` | 159 | +9 |
| `Sections/StickyFeaturesNav/StickyFeaturesNavFactory.tsx` | 158 | +8 |
| `Layout/Navigation/MobileNav/MobileMenuMain.tsx` | 153 | +3 |

All paths are relative to `apps/web/src/components/`.

**Evidence:**
- `WalletDetailsScreen.tsx` (464 lines): Contains 5 helper functions (`truncateAddress`, `getWalletTokens`, `getWalletTotalValue`), 2 sub-components (`ChevronIcon`, `ExportKeyModal`), color constant maps (`CHAIN_BG_COLORS`, `CHAIN_TEXT_COLORS`), and the main screen component with extensive JSX. At least 3 extractable concerns: data computation, sub-components, and the main screen.
- `ProfessionalIcons.tsx` (312 lines): Contains multiple SVG icon components in a single file. These should be individual files or at minimum grouped by category.
- Factory components (`AppFeaturesCarouselFactory.tsx` at 210, `ProductCarouselFactory.tsx` at 200, etc.) contain both the factory logic and configuration mapping, which could be separated.

**Gaps:**
- 50 component files exceed the 150-line limit.
- 7 components exceed 300 lines (2x the limit).
- The PreDemo screens are the worst category, with 6 files exceeding the limit.

**Recommendation:**
- **Priority 1 (> 300 lines, 7 files):** Extract sub-components from `WalletDetailsScreen.tsx` (`ExportKeyModal`, `WalletCard`, `TokenList`, `PortfolioCard`). Split `BuyScreen.tsx` and `ConfirmationScreen.tsx` similarly. Break `ProductCarouselDefault.tsx` into slide renderer + navigation + dots sub-components. Decompose `LegalDocument.tsx` rendering sections. Split `ProfessionalIcons.tsx` into individual icon files.
- **Priority 2 (200-300 lines, 21 files):** Extract sub-components and hooks where natural seams exist.
- **Priority 3 (150-200 lines, 22 files):** Review for extraction opportunities, but these are lower urgency.

---

### 6.3 Utility / Hook File Line Limits (Max 100 Lines)

**Status: Non-compliant**

8 utility/hook files exceed the 100-line limit. The `useCarousel` hook at 365 lines is the worst offender.

**Violations Table (Utilities/Hooks > 100 lines):**

| File | Lines | Over By |
|------|------:|--------:|
| `hooks/useCarousel.ts` | 365 | +265 |
| `lib/hooks/useIntersectionObserver.ts` | 308 | +208 |
| `lib/hooks/useSmoothScroll.ts` | 273 | +173 |
| `lib/utils/race-condition/SafeTimers.ts` | 169 | +69 |
| `hooks/useSwipeGesture.ts` | 157 | +57 |
| `hooks/useImageLoading.ts` | 149 | +49 |
| `hooks/useFocusTrap.ts` | 134 | +34 |
| `lib/hooks/useScrollPosition.ts` | 127 | +27 |
| `lib/utils/race-condition/ConcurrencyControl.ts` | 138 | +38 |
| `lib/utils/sanitize.ts` | 107 | +7 |
| `lib/utils/race-condition/CleanupManager.ts` | 104 | +4 |

All paths are relative to `apps/web/src/`.

**Evidence:**
- `useCarousel.ts` (365 lines): Contains the options interface, return interface, state machine definition, and the hook implementation with auto-play, keyboard navigation, swipe handling, and transition management. Multiple responsibilities bundled into a single hook.
- `useIntersectionObserver.ts` (308 lines): Contains observer pool management, configuration, and the hook -- could be split into observer management and hook.
- `useSmoothScroll.ts` (273 lines): Contains scroll utilities, easing functions, and the hook.

**Gaps:**
- 11 utility/hook files exceed the 100-line limit.
- 3 exceed 250 lines (2.5x the limit).
- Hooks in `apps/web/src/hooks/` and `apps/web/src/lib/hooks/` are scattered across two locations (see 6.6).

**Recommendation:**
- Split `useCarousel.ts` into `carouselTypes.ts`, `carouselStateMachine.ts`, and a slimmer `useCarousel.ts`.
- Split `useIntersectionObserver.ts` into `observerPool.ts` and the hook.
- Split `useSmoothScroll.ts` into `scrollUtils.ts` (easing functions, calculations) and the hook.

---

### 6.4 Config File Size

**Status: Partial**

Config files are a special category -- they are primarily data declarations rather than logic. However, several are extremely large and could benefit from splitting.

**Oversized Config Files:**

| File | Lines |
|------|------:|
| `config/benefitsCards-pages.ts` | 1,913 |
| `config/hero-pages.ts` | 1,065 |
| `config/dashboards.ts` | 650 |
| `config/landing-b2b.ts` | 579 |
| `config/landing-b2c.ts` | 533 |
| `config/assets.ts` | 523 |
| `config/featureShowcase-pages.ts` | 396 |
| `config/stickyFeaturesNav-pages.ts` | 369 |
| `config/monitoring.ts` | 347 |
| `config/performance-thresholds.ts` | 269 |
| `config/featureShowcase.ts` | 263 |
| `config/env.ts` | 235 |
| `config/formats.ts` | 231 |
| `config/design-system.ts` | 226 |
| `config/business-metrics.ts` | 202 |

All paths are relative to `apps/web/src/`.

**Evidence:**
- `benefitsCards-pages.ts` (1,913 lines): Auto-generated file (header says "DO NOT EDIT MANUALLY"). Contains page-specific BenefitsCards configurations for all marketing pages. Being auto-generated, it is acceptable but could still be split per-page.
- `hero-pages.ts` (1,065 lines): Similar auto-generated page config.
- `dashboards.ts` (650 lines): Dashboard configuration data.
- `monitoring.ts` (347 lines): Contains monitoring configuration -- a mix of config data and logic that could be separated.

**Gaps:**
- Auto-generated configs (`benefitsCards-pages.ts`, `hero-pages.ts`) are acceptable as-is since they are machine-maintained.
- Hand-maintained configs over 300 lines (`dashboards.ts`, `landing-b2b.ts`, `landing-b2c.ts`, `assets.ts`) should be reviewed for splitting by page or domain.
- `config/` directory has no `index.ts` barrel export.

**Recommendation:**
- Accept auto-generated config files as-is.
- Split `dashboards.ts` by dashboard type.
- Split `landing-b2b.ts` and `landing-b2c.ts` into per-section configs if they grow further.
- Add barrel export (`index.ts`) to the `config/` directory.

---

### 6.5 Single Responsibility Assessment

**Status: Partial**

The top 5 largest files were analyzed for single responsibility violations:

1. **`ApplicationEventBus.ts` (524 lines):** Contains 3 distinct responsibilities:
   - Type/interface definitions (lines 1-159): 8 payload interfaces, enums, union types
   - Validation schema (lines 162-195): Event validation configuration
   - Event bus class with analytics mapping (lines 202-524): Subscribe, emit, validate, history, analytics
   - **Verdict:** Should be split into `eventTypes.ts`, `eventValidation.ts`, `eventAnalyticsMapping.ts`, and a slimmer `ApplicationEventBus.ts`.

2. **`PerformanceBudgets.ts` (467 lines):** Contains 3 distinct responsibilities:
   - Web vitals monitoring setup (lines 72-145)
   - Custom metrics monitoring (sections, carousels, images) (lines 150-249)
   - Budget enforcement, violation handling, and reporting (lines 297-467)
   - **Verdict:** Already imports from `budgetTypes.ts`, `budgetDefinitions.ts`, and `budgetAnalysis.ts`, showing partial decomposition. The monitor class itself should further extract observer setup and custom metrics into separate modules.

3. **`ErrorReportingService.ts` (466 lines):** Most decomposed of the large files:
   - Already delegates to `errorTypes.ts`, `errorConfig.ts`, `errorInference.ts`, `breadcrumbManager.ts`
   - Remaining class still has 13 methods across: initialization, error handling, external service reporting, alerting, occurrence tracking, and statistics
   - **Verdict:** Good decomposition pattern, but the orchestrator class should extract `sendToExternalService` and `getErrorStats` into separate modules.

4. **`conversion-tracking.ts` (438 lines):** Contains 4 distinct responsibilities:
   - Type/interface definitions (lines 14-55)
   - Funnel configuration data (lines 58-93)
   - localStorage persistence (lines 346-419)
   - Tracking service class with session management and analytics (lines 106-431)
   - **Verdict:** Should be split into `conversionTypes.ts`, `funnelDefinitions.ts`, `funnelPersistence.ts`, and a slimmer `ConversionTrackingService.ts`.

5. **`WalletDetailsScreen.tsx` (464 lines):** Contains 4 distinct responsibilities:
   - Utility functions (`truncateAddress`, `getWalletTokens`, `getWalletTotalValue`) (lines 25-97)
   - Color constant maps (lines 31-46)
   - Sub-components (`ChevronIcon`, `ExportKeyModal`) (lines 101-174)
   - Main screen component (lines 176-464)
   - **Verdict:** Extract `ExportKeyModal` to its own file, move color constants and wallet utility functions to `walletUtils.ts`, extract `ChevronIcon` to shared icons.

**Gaps:**
- Most large files have 3-4 responsibilities that could be separated.
- Some files (`ErrorReportingService.ts`, `PerformanceBudgets.ts`, `theme-manager.ts`, `performance-monitor.ts`) show evidence of prior decomposition efforts but the orchestrator files remain oversized.
- The `patterns/index.ts` barrel export (364 lines) contains substantial re-export logic and utility wrappers, violating the barrel-export-as-clean-passthrough convention.

---

### 6.6 Barrel Export Coverage

**Status: Partial**

The CLAUDE.md requirement states: "Every directory has `index.ts`." Many directories comply, but significant gaps exist.

**Directories WITH barrel exports (compliant):**
- All Section component directories (FeatureShowcase, ProductCarousel, HeroSection, etc.)
- All variant subdirectories within Sections
- `components/DreamMode/` and its subdirectories (`screens/`, `components/`, `hooks/`)
- `components/PreDemo/` and its subdirectories (`screens/`, `components/`)
- `components/PreDream/` and its subdirectories
- `components/ErrorBoundary/`, `components/CookieConsent/`, `components/BookCall/`
- `components/Share/`, `components/WaitingList/`, `components/InteractiveDemo/`
- `components/Icons/`, `components/FutureYouCalculator/`, `components/Legal/`
- `components/UI/`, `components/LanguageSwitcher/`, `components/Providers/`
- `components/Layout/Footer/`, `components/Layout/Navigation/`, `components/Layout/Navigation/MobileNav/`
- Most `lib/` domain directories (`analytics/`, `calculator/`, `content/`, `dream-mode/`, `errors/`, `events/`, `monitoring/`, `og/`, `patterns/`, `pre-demo/`, `pre-dream/`, `security/`, `seo/`, `share/`, `waitingList/`)

**Directories MISSING barrel exports (non-compliant):**

| Directory | File Count | Impact |
|-----------|-----------|--------|
| `components/Pages/` | 5 .tsx files | Missing -- files imported directly |
| `components/Performance/` | 3 files | Missing |
| `components/SEO/` | 1 .tsx file | Missing |
| `components/Layout/` (root) | 2 .tsx files + 2 subdirs | Missing |
| `lib/constants/` | 1 .ts file | Missing |
| `lib/data/` | 1 .json file | N/A (JSON only) |
| `lib/hooks/` | 4 .ts files | Missing |
| `lib/i18n/` | 2 .ts files | Missing |
| `lib/theme/` | 4 .ts files | Missing |
| `lib/utils/` (root) | 3 .ts files | Missing |
| `lib/optimization/` (root) | 1 .ts file + 1 subdir | Missing |
| `lib/performance/` (root) | 6 files + 1 subdir | Missing |
| `hooks/` (top-level) | 6 .ts files | Missing |
| `config/` | 20+ .ts files | Missing |

**Gaps:**
- 14 directories with source files are missing `index.ts` barrel exports.
- The `config/` and `hooks/` (top-level) directories are the most impactful gaps, as they contain many files imported throughout the codebase.
- `lib/hooks/` and `hooks/` are separate directories, which is itself a module organization issue (see 6.7).

**Recommendation:**
- Add `index.ts` barrel exports to all 14 missing directories.
- Prioritize `config/`, `hooks/`, `lib/hooks/`, `lib/theme/`, `components/Pages/`, and `components/Layout/`.

---

### 6.7 Module Organization

**Status: Partial**

**Well-organized areas:**
- **Section components** follow the Factory pattern with `variants/` subdirectories consistently. Each variant has its own directory with `index.ts`.
- **DreamMode, PreDemo, PreDream** are well-organized with `screens/`, `components/`, and `hooks/` subdirectories.
- **Error reporting** (`lib/errors/`) has been decomposed into `errorTypes.ts`, `errorConfig.ts`, `errorInference.ts`, `breadcrumbManager.ts`, and the main service.
- **Theme management** (`lib/theme/`) is split into `themeTypes.ts`, `themeUtils.ts`, `useTheme.ts`, and `theme-manager.ts`.
- **Performance budgets** (`lib/performance/`) split into `budgetTypes.ts`, `budgetDefinitions.ts`, `budgetAnalysis.ts`, and the main monitor.
- **Monitoring** (`lib/monitoring/`) has `performanceTypes.ts`, `performanceConfig.ts`, `performanceObservers.ts`, `performanceUtils.ts`, and the main monitor.
- **Share library** (`lib/share/`) is organized into `types.ts`, `constants.ts`, `ShareManager.ts`, `cardRenderers.ts`, `platformHandlers.ts`.
- **Race condition utilities** (`lib/utils/race-condition/`) properly split into `SafeTimers.ts`, `ConcurrencyControl.ts`, `CleanupManager.ts`, `FunctionWrappers.ts` with barrel export.

**Poorly organized areas:**
1. **Hooks are scattered across two locations:**
   - `apps/web/src/hooks/` (6 files): `useCarousel.ts`, `useSwipeGesture.ts`, `useImageLoading.ts`, `useFocusTrap.ts`, `useNavigation.ts`, `useLocalePath.ts`
   - `apps/web/src/lib/hooks/` (4 files): `useIntersectionObserver.ts`, `useSmoothScroll.ts`, `useScrollPosition.ts`, `useThemePerformance.ts`
   - Additionally, component-specific hooks exist in `components/*/hooks/` directories (DreamMode, FutureYouCalculator, WaitingList, InteractiveDemo).
   - **Issue:** No clear organizational principle distinguishes which hooks go in `hooks/` vs `lib/hooks/`. Both contain general-purpose hooks.

2. **Config files are flat:**
   - `apps/web/src/config/` contains 20+ files in a flat structure with no subdirectories.
   - Could be organized into `config/pages/`, `config/monitoring/`, `config/landing/`, `config/ui/`.

3. **Components without the Factory pattern:**
   - `components/Pages/` has 5 `.tsx` files directly in the directory with no pattern structure.
   - `components/Performance/` has 3 files with no `index.ts`.
   - `components/SEO/` has a single file with no `index.ts`.

4. **`lib/patterns/index.ts` as logic-heavy barrel:**
   - At 364 lines, this barrel export contains substantial re-export logic, wrapper functions, and utilities. It should be a clean pass-through, not a logic module.

**Gaps:**
- Hook files split across `hooks/` and `lib/hooks/` with no clear boundary.
- `config/` flat structure with 20+ files.
- `lib/patterns/index.ts` barrel export contains logic.
- No `components/` root-level barrel export.

**Recommendation:**
- Consolidate `hooks/` and `lib/hooks/` into a single `hooks/` directory, or establish a clear naming convention (e.g., `hooks/` for UI hooks, `lib/hooks/` for non-UI utility hooks).
- Organize `config/` into subdirectories by domain (`pages/`, `monitoring/`, `landing/`, `ui/`).
- Refactor `lib/patterns/index.ts` to be a clean barrel export; move logic to dedicated files.

---

## Summary

| Sub-Section | Requirement | Status | Severity |
|-------------|------------|--------|----------|
| 6.1 Service Line Limits | Max 200 lines | **Non-compliant** | High |
| 6.2 Component Line Limits | Max 150 lines | **Non-compliant** | High |
| 6.3 Utility/Hook Line Limits | Max 100 lines | **Non-compliant** | Medium |
| 6.4 Config File Size | Reasonable size | **Partial** | Low |
| 6.5 Single Responsibility | One concern per file | **Partial** | High |
| 6.6 Barrel Exports | Every directory has index.ts | **Partial** | Medium |
| 6.7 Module Organization | Related files grouped | **Partial** | Medium |

**Overall Principle Status: Non-compliant**

The codebase shows awareness of the file decoupling principle -- several services have been partially decomposed (ErrorReporting, ThemeManager, PerformanceMonitor, PerformanceBudgets), and the Section components follow the Factory pattern well. However, the raw numbers are stark: 35 service files, 50 component files, and 11 utility/hook files exceed their respective line limits. The total violation count of 96 files indicates this is a systemic issue rather than isolated incidents.

The barrel export coverage is roughly 75-80% complete, with 14 directories still missing `index.ts` files. Module organization is generally good for domain-focused directories but has significant fragmentation in hooks and config files.

---

## Action Items

### Priority 1 -- Critical (Files > 2x Limit)

| # | Action | File(s) | Estimated Effort |
|---|--------|---------|-----------------|
| 1 | Split `ApplicationEventBus.ts` into types, validation, analytics mapping, and slim bus | `lib/events/ApplicationEventBus.ts` (524 lines) | Medium |
| 2 | Further decompose `PerformanceBudgets.ts` monitoring methods | `lib/performance/PerformanceBudgets.ts` (467 lines) | Medium |
| 3 | Extract send/stats from `ErrorReportingService.ts` | `lib/errors/ErrorReportingService.ts` (466 lines) | Small |
| 4 | Split `conversion-tracking.ts` into types, funnels, persistence, service | `lib/analytics/conversion-tracking.ts` (438 lines) | Medium |
| 5 | Extract sub-components from `WalletDetailsScreen.tsx` | `components/PreDemo/screens/WalletDetailsScreen.tsx` (464 lines) | Medium |
| 6 | Split `BuyScreen.tsx` and `ConfirmationScreen.tsx` into sub-components | `components/PreDemo/screens/` (365, 359 lines) | Medium |
| 7 | Break `ProductCarouselDefault.tsx` into slide/nav/dots sub-components | `components/Sections/ProductCarousel/variants/` (352 lines) | Medium |
| 8 | Split `ProfessionalIcons.tsx` into individual icon files | `components/Icons/ProfessionalIcons.tsx` (312 lines) | Small |
| 9 | Split `useCarousel.ts` into types, state machine, and hook | `hooks/useCarousel.ts` (365 lines) | Medium |
| 10 | Split `useIntersectionObserver.ts` into observer pool and hook | `lib/hooks/useIntersectionObserver.ts` (308 lines) | Small |

### Priority 2 -- High (Missing Barrel Exports)

| # | Action | Directory |
|---|--------|-----------|
| 11 | Add `index.ts` barrel export | `apps/web/src/config/` |
| 12 | Add `index.ts` barrel export | `apps/web/src/hooks/` |
| 13 | Add `index.ts` barrel export | `apps/web/src/lib/hooks/` |
| 14 | Add `index.ts` barrel export | `apps/web/src/lib/theme/` |
| 15 | Add `index.ts` barrel export | `apps/web/src/lib/i18n/` |
| 16 | Add `index.ts` barrel export | `apps/web/src/lib/utils/` |
| 17 | Add `index.ts` barrel export | `apps/web/src/lib/performance/` |
| 18 | Add `index.ts` barrel export | `apps/web/src/lib/optimization/` |
| 19 | Add `index.ts` barrel export | `apps/web/src/lib/constants/` |
| 20 | Add `index.ts` barrel export | `apps/web/src/components/Pages/` |
| 21 | Add `index.ts` barrel export | `apps/web/src/components/Performance/` |
| 22 | Add `index.ts` barrel export | `apps/web/src/components/SEO/` |
| 23 | Add `index.ts` barrel export | `apps/web/src/components/Layout/` |

### Priority 3 -- Medium (Module Organization)

| # | Action |
|---|--------|
| 24 | Consolidate or clearly delineate `hooks/` vs `lib/hooks/` directories |
| 25 | Organize `config/` into subdirectories by domain (`pages/`, `monitoring/`, `landing/`, `ui/`) |
| 26 | Refactor `lib/patterns/index.ts` from logic-heavy barrel to clean pass-through |
| 27 | Review and split remaining 21 service files (200-300 lines) where natural seams exist |
| 28 | Review and split remaining 22 component files (150-200 lines) as opportunities arise |
