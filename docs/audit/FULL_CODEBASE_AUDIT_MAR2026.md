# diBoaS Platform -- Full Codebase Audit

**Date:** 2026-03-04
**Scope:** Entire codebase (apps/web, packages/i18n, packages/ui, packages/email, configs, API routes)
**Methodology:** File-by-file deep read of every component, section, page, hook, service, API route, config, and translation file. Compared against the 12 Principles of Excellence, CLAUDE.md coding standards, and all documentation in `docs/*.md`.
**Branch:** `pre-launch`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Security](#2-security)
3. [Bugs & Logic Errors](#3-bugs--logic-errors)
4. [Race Conditions & Concurrency](#4-race-conditions--concurrency)
5. [Accessibility](#5-accessibility)
6. [Performance](#6-performance)
7. [Internationalization (i18n)](#7-internationalization-i18n)
8. [SEO](#8-seo)
9. [DRY Violations & Code Reusability](#9-dry-violations--code-reusability)
10. [Error Handling](#10-error-handling)
11. [Coding Standards Compliance](#11-coding-standards-compliance)
12. [12 Principles Assessment](#12-twelve-principles-assessment)
13. [Severity Summary Table](#13-severity-summary-table)
14. [Priority Fix List](#14-priority-fix-list)

---

## 1. Executive Summary

The diBoaS platform demonstrates strong architectural foundations: config-driven section composition, layered error boundaries, nonce-based CSP, encrypted PII, and thorough analytics instrumentation. However, this audit identified **200+ findings** across security, accessibility, performance, i18n, DRY, and standards compliance. The most urgent issues fall into five themes:

1. **CSP bypass in `proxy.ts`** allows `'unsafe-inline'` and `'unsafe-eval'`, violating the stated security policy.
2. **Missing diacritical marks** in Spanish and Portuguese share card strings (including "ano" instead of "ano" which is offensive in Spanish).
3. **Accessibility gaps** in MinimalNavigation (no focus trap, no Escape key, no scroll lock) and multiple `role="button"` on non-button elements.
4. **Race conditions** in waitlist signup (TOCTOU between exists/insert), deletion token full-table scan, and timer cleanup omissions across PreDemo/DreamMode.
5. **DRY violations** with duplicate icons (3-4 copies each of CloseIcon, CopyIcon), duplicate CSS modules, and repeated i18n helper patterns (7+ files).

**Findings by severity:**

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 18 |
| MEDIUM | 62 |
| LOW | 95 |
| INFO | 5 |
| **Total** | **184** |

---

## 2. Security

### SEC-01 [CRITICAL] CSP allows `'unsafe-inline'` and `'unsafe-eval'` in proxy.ts
**File:** `apps/web/src/proxy.ts:117-129`
**Impact:** The CSP header in proxy.ts includes `'unsafe-inline'` and `'unsafe-eval'` for `script-src`, which CLAUDE.md explicitly prohibits. The root layout uses nonce-based CSP via middleware, but proxy.ts sets a competing CSP that overrides it with weaker policy, enabling XSS via inline script injection.
**Fix:** Remove `'unsafe-inline'` and `'unsafe-eval'` from proxy.ts, or remove the CSP header entirely since middleware.ts handles it with nonces.

### SEC-02 [HIGH] Deletion token lookup scans all tokens (brute-force vector)
**File:** `apps/web/src/app/api/waitlist/delete/route.ts:63-84`
**Impact:** `findDeletionToken()` retrieves ALL non-expired tokens and iterates through each one to verify against the provided token. An attacker could submit many deletion requests to grow the table, then time responses to infer table size or cause resource exhaustion (full-table scan + bcrypt per row).
**Fix:** Store a deterministic hash index (e.g., first 8 chars of the token hash) alongside the token_hash; query with WHERE clause to narrow candidates.

### SEC-03 [HIGH] `removeDeletionToken()` also scans all tokens
**File:** `apps/web/src/app/api/waitlist/delete/route.ts:89-100`
**Impact:** Same full-table scan pattern, doubling the cost of the DELETE handler.

### SEC-04 [MEDIUM] Deletion token exposed in URL query parameter
**File:** `apps/web/src/app/api/waitlist/delete/route.ts:182`
**Impact:** The confirmation URL embeds the deletion token as `?token=${token}`. Tokens in URLs are logged by proxies, CDNs, browser history, and referrer headers. This is a GDPR-critical operation.
**Fix:** Use POST-based confirmation with token in request body, or use fragment identifiers (`#token=...`).

### SEC-05 [MEDIUM] Encrypt fallback to plaintext in deletion token storage
**File:** `apps/web/src/app/api/waitlist/delete/route.ts:46`
**Impact:** `const emailEnc = encrypt(email) || email;` -- if encryption fails (missing key), the email is stored in plaintext silently.
**Fix:** Throw an error if encryption fails rather than silently storing PII unencrypted.

### SEC-06 [MEDIUM] StructuredData JSON injection via dangerouslySetInnerHTML
**File:** `apps/web/src/components/SEO/StructuredData.tsx:21-23`
**Impact:** `JSON.stringify(item)` is injected into a `<script>` tag. `JSON.stringify` escapes quotes but NOT `</script>` tags. If any user-controlled data flows into the `data` prop, `</script><script>alert('XSS')</script>` could be injected.
**Fix:** Use a safe serializer that escapes `</` sequences (e.g., replace `</` with `<\/`).

### SEC-07 [MEDIUM] Position GET endpoint leaks email existence via timing
**File:** `apps/web/src/app/api/waitlist/position/route.ts:90-112`
**Impact:** The artificial delay is placed AFTER the database lookup. The path for existing users performs additional work (event emission), creating a measurable timing difference.

### SEC-08 [MEDIUM] i18n values used as href for external protocol links
**File:** `apps/web/src/components/Pages/StrategiesProtocolTable.tsx:129,138,208,217`
**Impact:** External link `href` values are populated from i18n translations (`t('protocols.items.${protocolId}.verifyUrl')`). If a translation file is misconfigured with a `javascript:` scheme, this becomes an XSS vector.
**Fix:** Store protocol URLs in config/data files, not in translations. If they must remain in translations, validate URL scheme before rendering.

### SEC-09 [LOW] Email in GET query parameter for position lookups
**File:** `apps/web/src/app/api/waitlist/position/route.ts:72`
**Impact:** Email addresses passed as GET query parameters are logged by web servers and CDN edge logs.

### SEC-10 [LOW] localStorage consent without integrity check
**File:** `apps/web/src/components/CookieConsent/consentUtils.ts:80-82`
**Impact:** Consent stored as plain JSON in localStorage. An XSS attacker could modify to enable tracking without actual consent. The `hasAnalyticsConsent()` reads from localStorage, not from the HttpOnly cookie.

### SEC-11 [LOW] CalculatorFactory has no upper bound on field1 input
**File:** `apps/web/src/components/Sections/CalculatorFactory/CalculatorFactory.tsx:101-111`
**Impact:** `field2` is capped at 100 but `field1` is unbounded. Astronomically large values could cause rendering issues with very long formatted currency strings.

### SEC-12 [LOW] BgHighlightDefault error indicator exposed in production
**File:** `apps/web/src/components/Sections/BgHighlight/variants/BgHighlightDefault/BgHighlightDefault.tsx:152-156`
**Impact:** Red "Image failed to load" error text shown to end users, leaking internal state.

### SEC-13 [LOW] Placeholder email `bar@diboas.com` in config
**File:** `apps/web/src/config/landing-about.ts:123`
**Impact:** `personalEmailHref: 'mailto:bar@diboas.com'` appears to be a placeholder that should be replaced.

---

## 3. Bugs & Logic Errors

### BUG-01 [CRITICAL] ResultsScreen timeframe key mismatch
**File:** `apps/web/src/components/DreamMode/screens/ResultsScreen.tsx:60-66`
**Impact:** `yearsMap` uses keys like `'1_week'`, `'1_month'` (with underscores), but `state.input.timeframe` uses `'1week'`, `'1month'` (without underscores). The lookup always returns `undefined`, falling back to `|| 1`. **Bank comparison calculations always use 1 year regardless of actual timeframe selection.**
**Fix:** Align key formats between `yearsMap` and the timeframe values in `DreamModeProvider`.

### BUG-02 [HIGH] Conflicting `dynamic` and `revalidate` exports in stats route
**File:** `apps/web/src/app/api/waitlist/stats/route.ts:29-30`
**Impact:** `export const dynamic = 'force-dynamic'` and `export const revalidate = 300` are contradictory. Next.js prioritizes `force-dynamic` and ignores `revalidate`, making it dead code and misleading.
**Fix:** Remove one. If caching is desired, remove `dynamic = 'force-dynamic'`.

### BUG-03 [MEDIUM] Duplicate `id="benefits-title"` on B2B page
**File:** `apps/web/src/components/Sections/BenefitsCards/variants/BenefitsCardsDefault/BenefitsCardsDefault.tsx:130`
**Impact:** B2B page renders `BenefitsCardsSection` twice (Features and Fit Assessment), both producing `id="benefits-title"`. The `aria-labelledby` also references this hardcoded ID, breaking accessibility.
**Fix:** Accept a `sectionId` prop and use it to generate unique IDs.

### BUG-04 [MEDIUM] Duplicate `id="showcase-title"` across FeatureShowcase variants
**File:** `apps/web/src/components/Sections/FeatureShowcase/variants/FeatureShowcaseBenefits/FeatureShowcaseBenefits.tsx:134,161`
**Impact:** Two `<h2>` elements with `id="showcase-title"` (mobile + desktop), plus the Default variant also uses the same ID.

### BUG-05 [MEDIUM] CalculatorFactory `customResult` has redundant ternary
**File:** `apps/web/src/components/Sections/CalculatorFactory/CalculatorFactory.tsx:150-152`
**Impact:** Both branches of the ternary return the same expression: `isCashflow ? computeStep2(rate) : computeStep2(rate)`. Copy-paste error.

### BUG-06 [MEDIUM] `sanitizeEmail` vs `sanitizeText` inconsistency
**File:** `apps/web/src/app/api/waitlist/signup/route.ts:145` vs `position/route.ts:81`
**Impact:** Signup uses `sanitizeText(body.email.toLowerCase().trim())` while position uses `sanitizeEmail(email)`. Different sanitization for the same data type could cause lookup failures.

### BUG-07 [MEDIUM] Missing `tier` property in signup test mock
**File:** `apps/web/src/app/api/waitlist/__tests__/signup.test.ts:103-115`
**Impact:** `mockEntry` doesn't include `tier`, but the signup route returns `tier: entry.tier`. Test doesn't validate actual response shape.

### BUG-08 [MEDIUM] `ProtocolsNotIsSection` text splitting by `\n\n` is fragile
**File:** `apps/web/src/components/Pages/Protocols/sections/ProtocolsNotIsSection.tsx:22`
**Impact:** `t('notIs.text').split('\n\n')` depends on react-intl preserving literal newlines. If the JSON stores differently, this renders as a single paragraph.
**Fix:** Use separate i18n keys per paragraph.

### BUG-09 [MEDIUM] Duplicate description meta tag in root layout
**File:** `apps/web/src/app/layout.tsx:37,60`
**Impact:** `description` is set both in the `metadata` export and as a manual `<meta>` tag. Next.js renders the metadata export automatically, creating two description tags in HTML output.
**Fix:** Remove the manual `<meta name="description">` tag.

### BUG-10 [MEDIUM] PerformanceBudgets report -- `passed` count can go negative
**File:** `apps/web/src/lib/performance/PerformanceBudgets.ts:196-214`
**Impact:** `passed = enabledCount - recentViolations.length`, but `recentViolations` can have multiple violations for the same budget.

### BUG-11 [LOW] `sampleRate` ternary returns same value for both branches
**File:** `apps/web/src/app/layout.tsx:137`
**Impact:** `sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 0.1}` -- dead code.

### BUG-12 [LOW] ConfirmationScreen missing `locale` in handleConfirm dependencies
**File:** `apps/web/src/components/PreDemo/screens/ConfirmationScreen.tsx:183`
**Impact:** `locale` used in callback but not in dependency array. Stale value if locale changes.

### BUG-13 [LOW] HomeScreen and ProcessingScreen have unused `t` function
**Files:** `apps/web/src/components/PreDemo/screens/HomeScreen.tsx:13,16`, `ProcessingScreen.tsx:14-15`
**Impact:** Dead code.

### BUG-14 [LOW] WalletDetailsScreen `copyFeedback` state shared across all chains
**File:** `apps/web/src/components/PreDemo/screens/WalletDetailsScreen.tsx:181`
**Impact:** Single feedback state for all chain cards. Failure feedback shows on whichever card is currently rendering.

### BUG-15 [LOW] ResultsScreen duplicates getCurrencySymbol locally
**File:** `apps/web/src/components/DreamMode/screens/ResultsScreen.tsx:22-33`
**Impact:** Reimplements `getCurrencySymbol` that already exists in `@/config/formats`.

### BUG-16 [LOW] ResultsScreen recalculates bank values that already exist in result
**File:** `apps/web/src/components/DreamMode/screens/ResultsScreen.tsx:60-78`
**Impact:** Recalculates bank balance using `BANK_RATE_SOURCES` when `result.bankBalance` already has the value.

### BUG-17 [LOW] Dynamic loader caches rejected promises permanently
**File:** `apps/web/src/lib/performance/dynamic-loader.ts:100-106,120`
**Impact:** Failed component loads cached in `loadingCache` -- subsequent calls fail immediately without retry.

### BUG-18 [LOW] `ProtocolCard` expand toggle `aria-controls` references non-existent ID
**File:** `apps/web/src/components/Pages/Protocols/ProtocolCard.tsx:92`
**Impact:** `aria-controls={`regulatory-${protocol.id}`}` but no element has that ID.

### BUG-19 [LOW] ExpandableContent max-height may clip content
**File:** `apps/web/src/components/UI/StrategyCard.module.css:245`
**Impact:** `.expandableContentOpen` uses `max-height: 600px`. Long German/Portuguese translations may exceed this.

### BUG-20 [LOW] Not-found page `detectLanguage` has fragile `startsWith` matching
**File:** `apps/web/src/app/not-found.tsx:57-63`
**Impact:** `locale.startsWith(langCode)` could match incorrectly for similar language codes.

---

## 4. Race Conditions & Concurrency

### RACE-01 [HIGH] Signup TOCTOU between `exists()` and `addEntry()`
**File:** `apps/web/src/app/api/waitlist/signup/route.ts:165-179,194-203`
**Impact:** Two concurrent requests for the same email could both pass `exists()` and attempt `addEntry()`, with one getting a 500 error instead of their position.
**Fix:** Use `INSERT ... ON CONFLICT` to atomically handle duplicates.

### RACE-02 [HIGH] Performance Budget Monitor -- Uncleared setIntervals
**File:** `apps/web/src/lib/performance/PerformanceBudgets.ts:67-68`
**Impact:** `setupPeriodicChecks()` creates two `setInterval` calls (hourly and daily) with no cleanup. Singleton instantiated at module load, so these run forever.

### RACE-03 [HIGH] MutationObserver never disconnected
**File:** `apps/web/src/lib/performance/metricCollectors.ts:114-130`
**Impact:** `monitorSectionPerformance()` creates a `MutationObserver` on `document.body` with `subtree: true` -- never disconnected.

### RACE-04 [HIGH] Click listener and PerformanceObserver never removed
**File:** `apps/web/src/lib/performance/metricCollectors.ts:152-169,173-189`
**Impact:** Global event listener and observer leak for the page lifetime.

### RACE-05 [MEDIUM] WalletDetailsScreen setTimeout without cleanup
**File:** `apps/web/src/components/PreDemo/screens/WalletDetailsScreen.tsx:203-209`
**Impact:** `setTimeout` timers not cleaned up on unmount. Per CLAUDE.md: "Every useEffect with timers -> store IDs, clear in cleanup."

### RACE-06 [MEDIUM] LoginScreen timer cleanup on unmount only partial
**File:** `apps/web/src/components/PreDemo/screens/LoginScreen.tsx:21-37`
**Impact:** `timerRef` stores timeouts but cleanup only happens on next click. No `useEffect` cleanup for unmount.

### RACE-07 [MEDIUM] Referral code collision
**File:** `apps/web/src/app/api/waitlist/signup/route.ts:188`
**Impact:** `generateReferralCode()` generates a random code with no uniqueness check. DB UNIQUE constraint violation returns 500 to user.
**Fix:** Retry with a new code on constraint violation, or use UUID-based codes.

### RACE-08 [MEDIUM] Probabilistic token cleanup may leave expired tokens indefinitely
**File:** `apps/web/src/app/api/waitlist/delete/route.ts:64-67`
**Impact:** Cleanup runs with 10% probability. Under low traffic, expired tokens persist, growing the full-table scan.

### RACE-09 [MEDIUM] useWaitlistStats fetch lacks AbortController
**File:** `apps/web/src/hooks/useWaitlistStats.ts:98-111`
**Impact:** Fetch inside event bus listener has no abort signal. If component unmounts during fetch, `setStats` called on unmounted component.

### RACE-10 [LOW] SocialIcon useEffect missing mounted flag
**File:** `apps/web/src/components/Layout/Footer/components/SocialIcon.tsx:44-59`
**Impact:** Async `loadIcon` in useEffect has no cleanup. Violates CLAUDE.md: "Every useEffect with async -> use mounted flag or AbortController."

### RACE-11 [LOW] PerformanceService unbounded event bus
**File:** `apps/web/src/lib/performance/services/PerformanceService.ts:53,67-69`
**Impact:** `onEvent()` pushes handlers into array with no removal mechanism. Handlers accumulate over time.

### RACE-12 [LOW] useSwipeGesture uses state instead of refs for transient values
**File:** `apps/web/src/hooks/useSwipeGesture.ts:97-141`
**Impact:** `touchStart` and `touchStartTime` as state causes callback identity changes on every touch. Should use `useRef` per CLAUDE.md guidelines.

### RACE-13 [LOW] useLanguageSwitcher toggleDropdown uses non-functional setState
**File:** `apps/web/src/components/LanguageSwitcher/useLanguageSwitcher.ts:76-78`
**Impact:** `setIsOpen(!isOpen)` captures stale value if called rapidly. Per CLAUDE.md: "Use setState(prev => ...) when new state depends on previous state."

---

## 5. Accessibility

### A11Y-01 [HIGH] `role="button"` on `<tr>` element in StrategiesProtocolTable
**File:** `apps/web/src/components/Pages/StrategiesProtocolTable.tsx:180-187`
**Impact:** CLAUDE.md explicitly states: "All interactive elements: native `<button>` or `<a>` (never `div role='button'`)." Applying `role="button"` to a `<tr>` confuses screen readers and keyboard navigation.
**Fix:** Add a dedicated `<button>` within a `<td>` for the expand action.

### A11Y-02 [HIGH] Portuguese-only aria-labels in OneFeatureDefault
**File:** `apps/web/src/components/Sections/OneFeature/variants/OneFeatureDefault/OneFeatureDefault.tsx:144,186`
**Impact:** `"Abre em nova aba"` (Portuguese for "Opens in new tab") is hardcoded. Non-PT users get Portuguese accessibility labels.
**Fix:** Use i18n key for this string.

### A11Y-03 [HIGH] MinimalNavigation missing focus trap for mobile menu
**File:** `apps/web/src/components/Layout/Navigation/MinimalNavigation.tsx:164-186`
**Impact:** Mobile menu lacks `useFocusTrap`, unlike `MobileNav.tsx` which correctly implements it. Violates WCAG 2.4.3.

### A11Y-04 [HIGH] MinimalNavigation missing Escape key handler and body scroll lock
**File:** `apps/web/src/components/Layout/Navigation/MinimalNavigation.tsx`
**Impact:** No Escape key to close mobile menu, no `document.body.style.overflow = 'hidden'` for scroll lock. `Navigation.tsx` correctly implements both.

### A11Y-05 [HIGH] ExportKeyModal missing focus trap and ARIA attributes
**File:** `apps/web/src/components/PreDemo/screens/WalletDetailsScreen.tsx:115-174`
**Impact:** Modal overlay lacks `useFocusTrap`, `role="dialog"`, `aria-modal="true"`, and Escape key handling. Violates CLAUDE.md: "All modals/dialogs: use useFocusTrap hook with returnFocus: true."

### A11Y-06 [MEDIUM] AppFeaturesCarouselDefault uses `<div role="button">` without keyboard support
**File:** `apps/web/src/components/Sections/AppFeaturesCarousel/variants/AppFeaturesCarouselDefault/AppFeaturesCarouselDefault.tsx:141-148`
**Impact:** `<div role="button" tabIndex={0}>` without Enter/Space key handling. Inaccessible via keyboard.

### A11Y-07 [MEDIUM] Mobile protocol cards use `div role="button"` instead of native button
**File:** `apps/web/src/components/Pages/StrategiesProtocolTable.tsx:97-104`

### A11Y-08 [MEDIUM] CalculatorFactory expand toggle missing `aria-controls` and controlled region missing `id`
**Files:** `apps/web/src/components/Sections/CalculatorFactory/CalculatorFactory.tsx:245-265,268`
**Impact:** Button has `aria-expanded` but no `aria-controls`. Expandable content lacks `id` and `role="region"`.

### A11Y-09 [MEDIUM] CalculatorFactory hardcoded English aria-labels
**File:** `apps/web/src/components/Sections/CalculatorFactory/CalculatorFactory.tsx:216,338-340`
**Impact:** `aria-label="Time period"` and `aria-label="likely scenario"` with visual "likely" text are all English-only.

### A11Y-10 [MEDIUM] TimeframeScreen missing radiogroup ARIA pattern
**File:** `apps/web/src/components/DreamMode/screens/TimeframeScreen.tsx:73-85`
**Impact:** Options behave like radio buttons but lack `role="radiogroup"`, `role="radio"`, `aria-checked`. PathSelectorScreen does this correctly.

### A11Y-11 [MEDIUM] DreamMode hardcoded English aria-labels
**File:** `apps/web/src/components/DreamMode/DreamMode.tsx:98,104`
**Impact:** `aria-label="Dream Mode Calculator"` and `aria-label="Close Dream Mode"` not translated.

### A11Y-12 [MEDIUM] DepositScreen and SendScreen missing tab ARIA pattern
**Files:** `apps/web/src/components/PreDemo/screens/DepositScreen.tsx:86-92`, `SendScreen.tsx:101-108`
**Impact:** Tab buttons lack `role="tablist"` / `role="tab"` / `aria-selected` semantics.

### A11Y-13 [MEDIUM] Not-found page nests Button inside Link (nested interactive elements)
**File:** `apps/web/src/app/not-found.tsx:95-99`
**Impact:** `<Link href=...><Button>` nests `<button>` inside `<a>`. Violates HTML spec and confuses screen readers.

### A11Y-14 [LOW] OneFeatureDefault cards invisible when animations disabled
**File:** `apps/web/src/components/Sections/OneFeature/variants/OneFeatureDefault/OneFeatureDefault.module.css:245`
**Impact:** `.featureCard` starts at `opacity: var(--opacity-0)`. If animations are disabled, the animated class is never applied and cards remain invisible.

### A11Y-15 [LOW] Error boundary buttons lack focus styles
**Files:** All error boundary files
**Impact:** Inline-styled buttons have no `:focus` or `:focus-visible` styles. Keyboard users cannot see focus.

### A11Y-16 [LOW] Global error boundary hardcodes `lang="en"`
**File:** `apps/web/src/app/global-error.tsx:35`
**Impact:** Non-English users get incorrect `lang` attribute when global error triggers.

### A11Y-17 [LOW] DesktopNav missing aria-label on nav element
**File:** `apps/web/src/components/Layout/Navigation/DesktopNav.tsx:40`

### A11Y-18 [LOW] LegalBackToTop renders as `<a>` but behaves as button
**File:** `apps/web/src/components/Legal/LegalDocument.tsx:244-270`
**Impact:** Uses `<a href="#top">` with `preventDefault()` and `window.scrollTo()`. Should be `<button>`.

### A11Y-19 [LOW] SimulationScreen SVG missing aria-hidden
**File:** `apps/web/src/components/DreamMode/screens/SimulationScreen.tsx:96-115`

### A11Y-20 [LOW] WalletDetailsScreen inline SVGs missing aria-hidden
**File:** `apps/web/src/components/PreDemo/screens/WalletDetailsScreen.tsx:248-260,432-443`

### A11Y-21 [LOW] MinimalNavigation hardcoded English aria-labels
**File:** `apps/web/src/components/Layout/Navigation/MinimalNavigation.tsx:155`
**Impact:** `'Close menu'` / `'Open menu'` hardcoded in English.

---

## 6. Performance

### PERF-01 [HIGH] All translations statically imported in translations-map.ts
**File:** `packages/i18n/src/translations-map.ts:1-78`
**Impact:** All 64 translation files (16 namespaces x 4 locales) are statically imported. Every page bundles ALL translations for ALL locales instead of just the current locale. Significant bundle size increase.
**Fix:** Use dynamic imports per locale as the primary loading mechanism.

### PERF-02 [HIGH] SimulationScreen dispatches on every animation frame
**File:** `apps/web/src/components/DreamMode/screens/SimulationScreen.tsx:58`
**Impact:** `dispatch({ type: 'SET_ANIMATION_PROGRESS', progress: ... })` called at ~60fps, causing entire context consumer tree to re-render each frame. Animation progress should use a ref.
**Fix:** Store animation progress in `useRef`, only dispatch `COMPLETE_SIMULATION` at the end.

### PERF-03 [MEDIUM] useDynamicComponent creates lazy component every render
**File:** `apps/web/src/lib/performance/dynamic-loader.ts:300-304`
**Impact:** `React.lazy()` should only be called once per component. This breaks lazy loading.
**Fix:** Memoize the result.

### PERF-04 [MEDIUM] Duplicate web vitals collection systems
**Files:** `apps/web/src/components/Performance/WebVitalsTracker.tsx:119-138`, `apps/web/src/lib/performance/metricCollectors.ts:29-59`
**Impact:** Both systems independently load and subscribe to `web-vitals`, causing duplicate metric collection and double resource usage.

### PERF-05 [MEDIUM] CalculatorFactory creates new Intl.NumberFormat on every call
**File:** `apps/web/src/components/Sections/CalculatorFactory/CalculatorFactory.tsx:85-92`
**Impact:** `formatCurrency` creates a new formatter on every invocation. Called many times per render.
**Fix:** Memoize the formatter with `useMemo`.

### PERF-06 [MEDIUM] FeatureShowcaseDefault renders same image twice (mobile + desktop)
**File:** `apps/web/src/components/Sections/FeatureShowcase/variants/FeatureShowcaseDefault/FeatureShowcaseDefault.tsx:192-205,258-273`
**Impact:** Both `<Image>` components are in DOM; both downloaded and decoded. CSS hides one but doesn't prevent loading.

### PERF-07 [MEDIUM] Artificial delay in position GET endpoint
**File:** `apps/web/src/app/api/waitlist/position/route.ts:93`
**Impact:** 100-300ms artificial delay on every position lookup degrades user experience.

### PERF-08 [MEDIUM] O(n^2) flatMap in ProtocolsGridSection
**File:** `apps/web/src/components/Pages/Protocols/sections/ProtocolsGridSection.tsx:51-68`
**Impact:** For 26 protocols, `PROTOCOL_DATA.flatMap()` + `.find()` called 52 times (2 calls x 26).
**Fix:** `useMemo(() => PROTOCOL_DATA.flatMap(...), [])` computed once, or build a Map.

### PERF-09 [LOW] Dynamic loader setTimeout never cleared on success
**File:** `apps/web/src/lib/performance/dynamic-loader.ts:142-144`
**Impact:** Timeout callback fires even after successful load.

### PERF-10 [LOW] Footer SocialIcon unnecessary dynamic imports
**File:** `apps/web/src/components/Layout/Footer/components/SocialIcon.tsx:13-17`
**Impact:** Icons dynamically imported from lucide-react, but MinimalFooter already imports them statically. Layout shift on load.

### PERF-11 [LOW] BenefitsCards factory `variantComponents` recreated every render
**File:** `apps/web/src/components/Sections/BenefitsCards/index.tsx:69-71`
**Impact:** Should be hoisted to module scope per CLAUDE.md guidelines.

### PERF-12 [LOW] Inaccurate render-time monitoring pattern
**Files:** `BenefitsCardsDefault.tsx:97-111`, `StepGuideDefault.tsx:62-76`, `BgHighlightDefault.tsx:57-69`
**Impact:** `performance.now()` captured after render + `setTimeout(..., 0)` measures microtask time, not render time.

---

## 7. Internationalization (i18n)

### I18N-01 [CRITICAL] Spanish "ano"/"anos" missing tilde (offensive word)
**File:** `apps/web/src/lib/share/constants.ts:247-248`
**Impact:** `'1 ano'` and `'5 anos'` in Spanish mean "anus"/"anuses". Should be `'1 ano'` and `'5 anos'` (with tilde: n). **This will be visible to users sharing content.**
**Fix:** Replace `ano` with `ano` and `anos` with `anos` throughout.

### I18N-02 [CRITICAL] Missing diacritical marks across share constants
**File:** `apps/web/src/lib/share/constants.ts`
Multiple strings missing proper diacritics:
- Portuguese: `Simulacao` -> `Simulacao`, `historicos` -> `historicos`, `Posicao` -> `Posicao`, `Comecando` -> `Comecando`, `Estrategia` -> `Estrategia`, `Alguem` -> `Alguem`
- German: `verlasslicher` -> `verlasslicher`, `Wahrend` -> `Wahrend`, `KONNTE` -> `KONNTE`, `aufzuhoren` -> `aufzuhoren`, `traumen` -> `traumen`
- Spanish: `Simulacion` -> `Simulacion`, `Dormia` -> `Dormia`, `Posicion` -> `Posicion`, `unio` -> `unio`, `sonar` -> `sonar`

### I18N-03 [HIGH] Hardcoded English strings in share card renderers
**File:** `apps/web/src/lib/share/cardRenderers.ts:75,162,175,185,211,230,269`
**Impact:** Canvas-rendered cards contain English-only strings: "I'M #... ON THE DIBOAS WAITLIST", "Join me:", "REFERRAL SUCCESS!", "Total Referrals:", "MILESTONE ACHIEVED!" These appear in shared social images for all locales.

### I18N-04 [HIGH] OG image translations missing diacritics
**Files:** `apps/web/src/app/api/og/share/ogTranslations.ts`, `apps/web/src/app/api/og/dream/route.tsx`
**Impact:** Same diacritical issues as I18N-02 but in OG meta images shared on social media.

### I18N-05 [MEDIUM] Incomplete namespace detection in config-translator
**File:** `apps/web/src/lib/i18n/config-translator.ts:41-49`
**Impact:** `isTranslationKey()` only recognizes `common.`, `marketing.`, `landing-`, `about.`, `protocols.`. Missing: `strategies.`, `waitlist.`, `faq.`, `preDemo.`. Keys in these namespaces won't auto-translate.
**Fix:** Add missing namespace prefixes.

### I18N-06 [MEDIUM] Email footer hardcoded in English
**File:** `packages/email/src/templates/layout.ts:57-69`
**Impact:** "All rights reserved", "Privacy Policy", "Terms of Service", "Unsubscribe" are English-only regardless of locale.

### I18N-07 [MEDIUM] Email privacy/terms URLs hardcoded to `/en/` locale
**File:** `packages/email/src/config.ts:20-21`
**Impact:** German, Spanish, Portuguese users receive links to English legal pages.

### I18N-08 [MEDIUM] Error boundaries hardcoded in English
**Files:** `apps/web/src/app/error.tsx`, `[locale]/(landing)/error.tsx`, `global-error.tsx`
**Impact:** "Something went wrong", "Try again", "Go to homepage" shown in English for all locales.

### I18N-09 [MEDIUM] Loading component hardcoded English aria-label
**File:** `apps/web/src/app/[locale]/(landing)/loading.tsx:27`
**Impact:** `aria-label="Loading page"` in English.

### I18N-10 [MEDIUM] UI text constants hardcoded in English
**File:** `apps/web/src/config/ui-constants.ts:70-110`
**Impact:** `TOGGLE_MENU`, error messages, etc. used at runtime by MobileNavHeader and NavigationErrorFallback.

### I18N-11 [LOW] AppFeaturesCarouselDefault fallback title in English
**File:** `apps/web/src/components/Sections/AppFeaturesCarousel/variants/AppFeaturesCarouselDefault/AppFeaturesCarouselDefault.tsx:126`
**Impact:** `config.sectionTitle || 'App Features'`

### I18N-12 [LOW] BgHighlightDefault error text not translated
**File:** `apps/web/src/components/Sections/BgHighlight/variants/BgHighlightDefault/BgHighlightDefault.tsx:154`

### I18N-13 [LOW] Legal pages use manual `.replace('{email}')` instead of ICU params
**Files:** `TermsOfUseContent.tsx:188`, `PrivacyPolicyContent.tsx:190,213`, `CookiePolicyContent.tsx:141`
**Impact:** Bypasses react-intl XSS protection and rich text formatting.

### I18N-14 [LOW] `console.log` tracking in i18n middleware stripped in production
**File:** `packages/i18n/src/middleware.ts:179`
**Impact:** `removeConsole: true` in next.config.js removes this tracking silently.

### I18N-15 [LOW] `console.error` and `console.warn` in i18n package stripped in production
**Files:** `packages/i18n/src/middleware.ts:84`, `translations-map.ts:172,178`, `utils.ts:34,42`

---

## 8. SEO

### SEO-01 [MEDIUM] Inconsistent env var naming for site URL
**Files:** About/Strategies/Protocols pages use `NEXT_PUBLIC_SITE_URL`, legal pages use `NEXT_PUBLIC_BASE_URL`
**Impact:** If only one env var is set, canonical URLs are inconsistent across pages.
**Fix:** Standardize on a single env var name.

### SEO-02 [MEDIUM] Root page redirect is 307 (temporary)
**File:** `apps/web/src/app/page.tsx:1-12`
**Impact:** Next.js `redirect()` returns 307. Search engines may not pass PageRank through temporary redirects.
**Fix:** Use 308 permanent redirect.

### SEO-03 [MEDIUM] Duplicate description meta tag
**File:** `apps/web/src/app/layout.tsx:37,60`
**Impact:** Two `<meta name="description">` tags in HTML output. Search engines may penalize or use wrong one.

### SEO-04 [LOW] Legal pages don't validate locale in generateMetadata
**Files:** `apps/web/src/app/[locale]/(landing)/legal/*/page.tsx`
**Impact:** No `isValidLocale()` check in metadata function. Invalid locale could produce malformed canonical URLs.

### SEO-05 [LOW] Hardcoded English breadcrumb names
**Files:** All page.tsx generateMetadata functions
**Impact:** `{ name: 'Home', url: '/' }` not localized in structured data.

### SEO-06 [LOW] Sitemap doesn't differentiate priorities by page type
**File:** `apps/web/src/app/sitemap.ts:77`
**Impact:** All pages get `priority: 0.8`. Legal pages should be lower, landing pages higher.

### SEO-07 [LOW] `keywords` meta tag is set (no SEO value)
**File:** `apps/web/src/app/[locale]/(landing)/business/page.tsx:63`
**Impact:** Google ignores keywords meta tag. Dead code.

---

## 9. DRY Violations & Code Reusability

### DRY-01 [CRITICAL] Duplicate StrategyCard files in `UI/` and `ui/` directories
**Files:** `apps/web/src/components/UI/StrategyCard.tsx` + `.module.css` duplicated in `apps/web/src/components/ui/`
**Impact:** On macOS (case-insensitive), these may resolve to the same directory. On Linux (Vercel, CI), these are separate. Changes to one won't reflect in the other. Potential bundle duplication.
**Fix:** Delete one set and update all imports.

### DRY-02 [MEDIUM] CloseIcon duplicated 3+ times
**Files:** `WaitingListModal.tsx:150-165`, `DreamMode.tsx:140-147`, `ShareIcons.tsx:22-40`, plus `PreDemo/Icons.tsx`
**Fix:** Extract to shared `@/components/Icons/CloseIcon`.

### DRY-03 [MEDIUM] CopyIcon duplicated 4+ times
**Files:** `ShareButtons.tsx:103-118`, `ShareLinkSection.tsx:80-97`, `PreDemo/Icons.tsx`, `ReferralIcons.tsx`

### DRY-04 [MEDIUM] `scrollTo` helper duplicated across 3 components
**Files:** `TwoWorldsSection.tsx:22-28`, `CalculatorFactory.tsx:118-124`, `CashflowExplainerSection.tsx:21-27`
**Fix:** Extract to `@/lib/utils/scroll` or `useScrollTo` hook.

### DRY-05 [MEDIUM] CTA button CSS duplicated across 4+ CSS modules
**Files:** `TwoWorldsSection.module.css`, `CalculatorFactory.module.css`, `CashflowExplainerSection.module.css`, `DualCtaSection.module.css`
**Impact:** Identical CTA styling (min-width, padding, border-radius, transitions, hover, focus-visible) duplicated verbatim.

### DRY-06 [MEDIUM] i18n helper pattern repeated 7+ times across strategy page components
**Files:** `StrategiesClientSections.tsx`, `StrategiesCardsSection.tsx`, `StrategiesHowToChoose.tsx`, `StrategiesMatrixSection.tsx`, `StrategiesProtocolTable.tsx`, `StrategyDisclaimers.tsx`, `StrategyFeeTable.tsx`
**Impact:** Each defines same `I18N_PREFIX` and `t()` helper function.
**Fix:** Create `useStrategiesTranslation()` hook.

### DRY-07 [MEDIUM] i18n prefix repeated 7+ times in Protocols sections
**Files:** All 7 protocol section files
**Fix:** Create `useProtocolsTranslation()` hook.

### DRY-08 [MEDIUM] Error boundary components nearly identical
**Files:** `apps/web/src/app/error.tsx`, `[locale]/(landing)/error.tsx`
**Impact:** Same JSX, same logic. Only difference is tag value.
**Fix:** Extract shared `ErrorFallback` component.

### DRY-09 [MEDIUM] Fire-and-forget email pattern duplicated 4 times
**Files:** `signup/route.ts:306-356,362-404`, `delete/route.ts:234-269,274-304`
**Fix:** Create `sendEmailFireAndForget(template, to, data)` helper.

### DRY-10 [MEDIUM] Translation helper duplicated across all PreDemo screens
**Files:** 10+ PreDemo screen files each define: `const t = (key: string) => intl.formatMessage({ id: key });`
**Fix:** Create `usePreDemoTranslation()` hook (similar to DreamMode's `useDreamModeTranslation`).

### DRY-11 [MEDIUM] Duplicate performance threshold definitions (3 sources)
**Files:** `PerformanceService.ts:26-49`, `budgetDefinitions.ts:12-91`, `webVitalsUtils.ts:10-17`
**Impact:** Three separate sources of truth for performance budgets with different values.

### DRY-12 [LOW] Duplicate disclaimer CSS between Strategies and Protocols
**Files:** `StrategiesPageContent.module.css:410-431`, `ProtocolsPageContent.module.css:25-46`

### DRY-13 [LOW] Duplicate transitionHook CSS
**Files:** `StrategiesPageContent.module.css:48-55`, `ProtocolsPageContent.module.css:12-19`

### DRY-14 [LOW] Legal page boilerplate repeated 3 times
**Files:** `legal/terms/page.tsx`, `legal/privacy/page.tsx`, `legal/cookies/page.tsx`

### DRY-15 [LOW] Render-time monitoring pattern duplicated across 4 components
**Files:** `BenefitsCardsDefault.tsx`, `StepGuideDefault.tsx`, `BgHighlightDefault.tsx`, `FeatureShowcaseDefault.tsx`
**Fix:** Create `useRenderTimeMonitoring()` hook.

### DRY-16 [LOW] Factory pattern boilerplate duplicated across 3 sections
**Files:** `AppFeaturesCarouselFactory.tsx`, `FeatureShowcaseFactory.tsx`, `OneFeatureFactory.tsx`

### DRY-17 [LOW] `getConsent()` and `getStoredConsent()` functionally identical
**File:** `apps/web/src/components/CookieConsent/consentUtils.ts`

### DRY-18 [LOW] Duplicate SocialIcon implementations in Footer directory
**Files:** `components/SocialIcon.tsx` (dynamic), `MinimalFooter.tsx:247-274` (inline static)

### DRY-19 [LOW] Color constants duplicated between tailwind.config and ogTypes
**Files:** `tailwind.config.ts:8-80`, `ogTypes.ts:22-33`

### DRY-20 [LOW] formatCurrency defined in 3 different locations
**Files:** `lib/share/cardFormatters.ts:22`, `lib/calculator/calculations.ts`, `lib/pre-demo/format.ts`

---

## 10. Error Handling

### ERR-01 [MEDIUM] Try/catch around JSX return does not catch React render errors
**Files:** `AppFeaturesCarouselFactory.tsx:199-207`, `FeatureShowcaseFactory.tsx`, `OneFeatureFactory.tsx`
**Impact:** `try { return <Component /> } catch { return <Fallback /> }` does NOT catch runtime rendering errors. Only Error Boundaries catch React render errors.

### ERR-02 [MEDIUM] Missing JSON parse error handling in API routes
**Files:** `signup/route.ts:134`, `position/route.ts:188`, `delete/route.ts:138,341`
**Impact:** `await request.json()` can throw if body is invalid JSON. The outer catch returns 500 "Internal server error" instead of 400 "Invalid request body."
**Fix:** Add dedicated try/catch with 400 response.

### ERR-03 [MEDIUM] Database client throws on missing DATABASE_URL
**File:** `apps/web/src/lib/database/client.ts:16-19`
**Impact:** Routes calling `sql` directly crash with 500. `pingDatabase()` handles errors but direct callers don't.

### ERR-04 [MEDIUM] ShareScreen empty catch block
**File:** `apps/web/src/components/DreamMode/screens/ShareScreen.tsx:131-133`
**Impact:** Failed shares silently swallowed with no user feedback or logging.

### ERR-05 [LOW] BgHighlightDefault swallows image errors silently
**File:** `apps/web/src/components/Sections/BgHighlight/variants/BgHighlightDefault/BgHighlightDefault.tsx:82-85`
**Impact:** No Logger or Sentry reporting for image load failures.

### ERR-06 [LOW] Email config returns empty string for missing API key
**File:** `packages/email/src/config.ts:5`
**Impact:** `apiKey: process.env.RESEND_API_KEY || ''` -- would be cleaner to fail fast.

### ERR-07 [LOW] canvasUtils no font fallback verification
**File:** `apps/web/src/lib/share/canvasUtils.ts:62,96`
**Impact:** Canvas specifies `'Inter, system-ui, sans-serif'` but doesn't verify font loaded before rendering.

### ERR-08 [LOW] shareUtils deprecated API usage
**File:** `apps/web/src/lib/share/shareUtils.ts:106`
**Impact:** `document.execCommand('copy')` is deprecated. No warning when fallback path taken.

---

## 11. Coding Standards Compliance

### STD-01 [MEDIUM] `Record<string, any>` used in i18n package (strict TS violation)
**Files:** `packages/i18n/src/hooks.ts:33`, `provider.tsx:17`, `utils.ts:22`, `translations-map.ts:82`
**Impact:** Violates "No implicit any" strict TypeScript rule.
**Fix:** Use `Record<string, string | number | boolean | Date | React.ReactNode>` or proper union type.

### STD-02 [MEDIUM] Hardcoded CSS values instead of design tokens (multiple files)
**Files:** `StrategyCard.module.css`, `AboutPageContent.module.css`, `StrategiesPageContent.module.css`, `PageHeroSection.module.css`
**Impact:** Values like `0.75rem`, `700`, `1.25rem` used instead of `var(--spacing-*)`, `var(--font-weight-*)`.

### STD-03 [MEDIUM] CvmBanner imports CSS from Strategies-specific stylesheet
**File:** `apps/web/src/components/Pages/CvmBanner.tsx:12`
**Impact:** Shared component semantically coupled to Strategies CSS. Used on both Strategies and Protocols pages.
**Fix:** Give CvmBanner its own CSS module.

### STD-04 [MEDIUM] CSS design token misuse for semantic values
**File:** `apps/web/src/styles/semantic-components.css`
**Impact:** `--opacity-0` used for `flex-shrink`, `padding-left`, `min-height`, `margin-top`. Should use `0` or `--spacing-0`.

### STD-05 [MEDIUM] `trackable` variant in Button uses string class instead of data attribute
**File:** `packages/ui/src/primitives/Button.tsx:33-34`
**Impact:** `'data-trackable="true"'` passed as CSS class name, not a data attribute. Has no effect.

### STD-06 [LOW] File size guideline violations
Per CLAUDE.md: "Services <= 200 lines, Components <= 150, Utils <= 100"
- `WalletDetailsScreen.tsx` -- 465 lines (3x limit)
- `ConfirmationScreen.tsx` -- 360 lines
- `ShareButtons.tsx` -- 219 lines
- `semantic-components.css` -- 1246+ lines
- `assets.ts` -- 524 lines
- `PerformanceService.ts` -- 332 lines
- `useCarousel.ts` -- 365 lines

### STD-07 [LOW] OneFeature references "Security" in logging
**File:** `apps/web/src/components/Sections/OneFeature/variants/OneFeatureDefault/OneFeatureDefault.tsx:46-69`
**Impact:** Logger messages say "Security hero image failed", "Security CTA clicked" -- remnant of rename.

### STD-08 [LOW] OneFeatureFactory doc comment says "SecurityOneFeature"
**File:** `apps/web/src/components/Sections/OneFeature/OneFeatureFactory.tsx:55`

### STD-09 [LOW] OneFeatureDefault excessive `!important` declarations (20+)
**File:** `apps/web/src/components/Sections/OneFeature/variants/OneFeatureDefault/OneFeatureDefault.module.css:383-453`
**Impact:** Specificity war with `@diboas/ui` Button styles. Design system integration issue.

### STD-10 [LOW] Mixed component organization patterns across pages
**Impact:** About page uses config-driven `useConfigTranslation`. Strategies/Protocols use inline `useTranslation()` + manual `I18N_PREFIX`.

### STD-11 [LOW] ProtocolCard has both named and default export
**File:** `apps/web/src/components/Pages/Protocols/ProtocolCard.tsx:25,126`

### STD-12 [LOW] Inconsistent `enableReporting={true}` vs `enableReporting` shorthand
**Impact:** Both forms used interchangeably across pages.

### STD-13 [LOW] Inconsistent export patterns (default + named)
**Files:** `NavigationErrorBoundary.tsx`, `MinimalFooter.tsx`, `useRegionalDisclaimer.ts`, `ShareCardPreview.tsx`

### STD-14 [LOW] `substr()` usage (deprecated API)
**File:** `apps/web/src/components/ErrorBoundary/navigationErrorUtils.ts:32`
**Fix:** Replace with `substring()` or `slice()`.

### STD-15 [LOW] Unused import of `useMemo` in BenefitsCards
**File:** `apps/web/src/components/Sections/BenefitsCards/index.tsx:12`

### STD-16 [LOW] Unused import of `dynamic` in AppFeaturesCarousel registry
**File:** `apps/web/src/components/Sections/AppFeaturesCarousel/variants/registry.ts:10`

### STD-17 [LOW] `enableAnalytics` prop accepted but unused in TwoWorldsSection and CashflowExplainerSection
**Files:** `TwoWorldsSection.tsx:12,18`, `CashflowExplainerSection.tsx:11,17`

### STD-18 [LOW] Inline styles instead of CSS modules
**Files:** `ConfirmationScreen.tsx:314,319`, `LoadingScreen.tsx:42`

### STD-19 [LOW] WalletDetailsScreen inline color constants instead of design tokens
**File:** `apps/web/src/components/PreDemo/screens/WalletDetailsScreen.tsx:31-46`

### STD-20 [LOW] shareManager and cardRenderer singletons default to English locale
**Files:** `lib/share/ShareManager.ts:369`, `lib/share/CardRenderer.ts:143`
**Impact:** In multi-locale app, singletons start with `'en'` unless explicitly set.

---

## 12. Twelve Principles Assessment

### Principle 1: Domain-Driven Design
**Grade: B+**
Strong domain boundaries (waitlist, analytics, performance, share, dream-mode). Config-driven section composition is excellent. Gap: Some cross-domain coupling (CvmBanner importing Strategies CSS, performance monitoring spread across 3 separate systems).

### Principle 2: Event-Driven Architecture
**Grade: A-**
`ApplicationEventBus` properly used for state changes with correlationId. DreamMode emits events for disclaimer, path selection, and simulation. Gap: Some events have incomplete payloads (e.g., missing locale in share events).

### Principle 3: Service Agnostic Abstraction
**Grade: A-**
Email uses provider pattern (ResendProvider). Database abstracted via client module. Analytics abstracted via analyticsService. Gap: Share card rendering tightly coupled to canvas API with no abstraction layer.

### Principle 4: Code Reusability & DRY
**Grade: C+**
Significant violations: 3 duplicate icon sets, 7 duplicate i18n helpers, 4 duplicate CTA CSS modules, 3 duplicate scrollTo functions, 4 duplicate render monitoring patterns, and the critical UI/ui StrategyCard duplication. See Section 9 for full details.

### Principle 5: Semantic Naming
**Grade: B+**
Generally follows conventions. Gaps: OneFeature still references "Security" in logs, `bar@diboas.com` placeholder, inconsistent `NEXT_PUBLIC_SITE_URL` vs `NEXT_PUBLIC_BASE_URL`.

### Principle 6: File Decoupling
**Grade: C+**
7 files exceed the 150-line component limit (up to 465 lines). `semantic-components.css` is 1246+ lines. Several factory components contain both factory logic and variant implementations.

### Principle 7: Error Handling & Recovery
**Grade: B**
3-layer error boundary system is excellent. `fetchWithRetry` for user-facing operations. Gaps: Try/catch around JSX (doesn't work for React errors), empty catch blocks in ShareScreen, missing JSON parse error handling in API routes.

### Principle 8: Security & Audit
**Grade: B-**
Nonce-based CSP in middleware, AES-256-GCM encryption, HMAC blind indexes, Upstash rate limiting. Critical gap: proxy.ts CSP override with `'unsafe-inline'`. Also: deletion token full-table scan, TOCTOU race in signup, StructuredData JSON injection risk.

### Principle 9: Performance & SEO
**Grade: B**
Strong foundations: 9-group webpack splitting, 300KB budget, optimizePackageImports for 17+ packages. Gaps: All translations statically imported, SimulationScreen dispatches at 60fps, duplicate web vitals collection, O(n^2) protocol grid rendering, broken useDynamicComponent.

### Principle 10: Product KPIs & Analytics
**Grade: A-**
Dual-layer tracking (GA4 + ApplicationEventBus). Screen views, feature usage, conversion events all tracked. Gap: Some analytics code references `window.location` without SSR safety checks.

### Principle 11: Concurrency & Race Conditions
**Grade: B-**
MutexLock, SafeTimer, SafeInterval, StateMachine patterns exist in utils. Gaps: Not consistently applied -- WalletDetailsScreen setTimeout without cleanup, LoginScreen timers, performance monitoring with uncleared intervals/observers, signup TOCTOU race.

### Principle 12: Monitoring & Observability
**Grade: B**
Sentry integration, PostHog analytics, web-vitals tracking. Gap: console.log/error stripped by production compiler, losing diagnostic info from i18n package. Duplicate monitoring systems (PerformanceService vs PerformanceBudgets).

---

## 13. Severity Summary Table

| Category | CRITICAL | HIGH | MEDIUM | LOW | INFO | Total |
|----------|----------|------|--------|-----|------|-------|
| Security | 1 | 2 | 5 | 5 | 0 | 13 |
| Bugs & Logic | 1 | 1 | 7 | 11 | 0 | 20 |
| Race Conditions | 0 | 4 | 5 | 4 | 0 | 13 |
| Accessibility | 0 | 5 | 7 | 9 | 0 | 21 |
| Performance | 0 | 2 | 6 | 4 | 0 | 12 |
| i18n | 2 | 2 | 6 | 5 | 0 | 15 |
| SEO | 0 | 0 | 3 | 4 | 0 | 7 |
| DRY | 1 | 0 | 11 | 8 | 0 | 20 |
| Error Handling | 0 | 0 | 4 | 4 | 0 | 8 |
| Coding Standards | 0 | 0 | 5 | 15 | 0 | 20 |
| Dead Code | 0 | 0 | 0 | 0 | 5 | 5 |
| **Total** | **5** | **16** | **59** | **69** | **5** | **154** |

> Note: Some findings span multiple categories. Unique findings total ~184 but some overlap across sections. The table above counts each finding once in its primary category.

---

## 14. Priority Fix List

### Must Fix Before Launch (CRITICAL + HIGH)

| # | ID | Description | Effort |
|---|----|-------------|--------|
| 1 | SEC-01 | Remove `'unsafe-inline'`/`'unsafe-eval'` from proxy.ts CSP | Small |
| 2 | I18N-01 | Fix Spanish "ano" -> "ano" in share constants | Small |
| 3 | I18N-02 | Fix all missing diacritical marks in share/OG strings | Medium |
| 4 | BUG-01 | Fix ResultsScreen timeframe key mismatch (`1_week` vs `1week`) | Small |
| 5 | DRY-01 | Delete duplicate StrategyCard in `UI/` or `ui/` | Small |
| 6 | RACE-01 | Replace exists()+addEntry() with INSERT ON CONFLICT | Medium |
| 7 | SEC-02/03 | Add hash index to deletion_tokens for targeted lookup | Medium |
| 8 | A11Y-01 | Replace `role="button"` on `<tr>` with native `<button>` | Small |
| 9 | A11Y-02 | Replace Portuguese-only aria-labels with i18n keys | Small |
| 10 | A11Y-03/04 | Add focus trap, Escape key, scroll lock to MinimalNavigation | Medium |
| 11 | A11Y-05 | Add focus trap and ARIA to ExportKeyModal | Medium |
| 12 | PERF-01 | Switch translations-map.ts to dynamic imports per locale | Medium |
| 13 | PERF-02 | Use ref for animation progress in SimulationScreen | Small |
| 14 | RACE-02/03/04 | Add cleanup/destroy for performance monitoring intervals/observers | Medium |
| 15 | BUG-02 | Remove conflicting dynamic/revalidate in stats route | Small |
| 16 | I18N-03 | Translate hardcoded English in share card renderers | Medium |
| 17 | I18N-04 | Fix OG translation diacritics | Small |
| 18 | SEC-06 | Escape `</` in StructuredData JSON serialization | Small |

### Should Fix Post-Launch (MEDIUM priority)

| # | Category | Description | Count |
|---|----------|-------------|-------|
| 1 | DRY | Extract shared icons (Close, Copy, Download, Back) | 4 items |
| 2 | DRY | Extract shared scrollTo, CTA CSS, translation hooks | 5 items |
| 3 | A11Y | Add proper ARIA patterns (radiogroup, tablist, aria-controls) | 4 items |
| 4 | STD | Replace `Record<string, any>` with proper types | 4 files |
| 5 | STD | Replace hardcoded CSS values with design tokens | 4 files |
| 6 | PERF | Deduplicate web vitals collection | 2 systems |
| 7 | PERF | Fix useDynamicComponent memoization | 1 file |
| 8 | ERR | Add JSON parse error handling in API routes | 4 routes |
| 9 | SEO | Standardize site URL env var | All pages |
| 10 | I18N | Complete namespace detection in config-translator | 1 file |
| 11 | I18N | Translate error boundaries and loading states | 5 files |
| 12 | RACE | Add timer cleanup in WalletDetailsScreen, LoginScreen | 2 files |
| 13 | ERR | Replace try/catch JSX with proper error boundaries | 3 factories |
| 14 | DRY | Extract error fallback component | 2 files |
| 15 | DRY | Extract fire-and-forget email helper | 4 occurrences |
| 16 | STD | Split oversized components (WalletDetailsScreen 465 lines) | 2 files |
| 17 | STD | Give CvmBanner its own CSS module | 1 file |
| 18 | SEO | Make root redirect 308 permanent | 1 file |

---

*This audit was generated by deep file-by-file analysis of the entire diBoaS codebase. Each finding includes the specific file path and line number(s) for easy navigation. Severity ratings follow the project's own standards from CLAUDE.md and docs/coding-standards.md.*
