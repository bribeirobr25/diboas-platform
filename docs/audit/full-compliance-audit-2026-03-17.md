# Full CLAUDE.md Compliance Audit — 2026-03-17

**Audit scope:** Every section of CLAUDE.md (347 lines) verified against the entire codebase.
**Categories covered:** Security, Performance, Accessibility, i18n, Race Conditions, File Size Limits (Principle #6), Error Handling, Testing, Anti-Slop, React Patterns, Event Architecture, Health Endpoints, Hardcoded Values.
**Source:** CTO Board review + independent exhaustive audit + automated pipeline.

---

## Pipeline Results

| Check | Status | Details |
|---|---|---|
| Type-check | **PASS** | 0 errors, 4 workspaces |
| Lint | **PASS** | 0 errors, 136 pre-existing warnings |
| Tests | **PASS** | 19 files, 358 tests, 0 failures |
| Build | **PASS** | Production build succeeds |
| Translations | **PASS** | 60 files, 4 locales in sync |
| Design tokens | **PASS** | 56 tokens validated against schema |
| Security audit | **WARN** | 2 vulnerabilities (1 high rollup in tsup dev dep, 1 low) |

---

## Test Coverage Results

CLAUDE.md requires: 80% for `lib/`, `hooks/`; 60% for components; 100% for security utilities.

### lib/ (80% required)

| Module | Stmts | Lines | Status |
|---|---|---|---|
| lib/security | 84.58% | 84.32% | PASS |
| lib/utils | 90.9% | 90.47% | PASS |
| lib/waitingList | 89.7% | 94.11% | PASS |
| lib/errors | 66.94% | 68.14% | **FAIL — below 80%** |

### hooks/ (80% required)

| Module | Stmts | Lines | Status |
|---|---|---|---|
| hooks/ | 97.67% | 100% | PASS |

### Components (60% required)

| Module | Stmts | Lines | Status |
|---|---|---|---|
| GoalCalculator | 86.36% | 85.54% | PASS |
| CookieConsent | 38% | 41.46% | **FAIL — below 60%** |

### Security utilities (100% required)

| File | Stmts | Lines | Status |
|---|---|---|---|
| cookies.ts | 100% | 100% | PASS |
| authentication.ts | 97.22% | 97.22% | **FAIL** |
| csrf.ts | 94.59% | 94.59% | **FAIL** |
| encryption.ts | 80.64% | 80.64% | **FAIL** |
| idempotency.ts | 81.81% | 77.77% | **FAIL** |
| rateLimiter.ts | 70.14% | 69.69% | **FAIL** |

---

## CATEGORY 1: File Size Violations (Principle #6)

CLAUDE.md: "Components ≤150 lines, Services ≤200 lines, Utils ≤100 lines."

**This is the single largest systemic gap.** The CTO board found 3-4 files. The full audit found **101 files** violating their size limits.

### Components over 150 lines (48 files)

Top offenders:

| File | Lines | Over by |
|---|---|---|
| PreDemo/screens/WalletDetailsScreen.tsx | 447 | 3x |
| PreDemo/screens/BuyScreen.tsx | 366 | 2.4x |
| PreDemo/screens/ConfirmationScreen.tsx | 359 | 2.4x |
| ProductCarouselDefault.tsx | 352 | 2.3x |
| CalculatorFactory.tsx | 336 | 2.2x |
| FutureYouCalculator.tsx | 317 | 2.1x |
| GoalCalculator/DepositRiskScreen.tsx | 311 | 2.1x |
| FeatureShowcaseDefault.tsx | 290 | 1.9x |
| MinimalFooter.tsx | 281 | 1.9x |
| GoalCalculator/ResultsScreen.tsx | 280 | 1.9x |
| LegalDocument.tsx | 272 | 1.8x |
| FAQAccordionDefault.tsx | 249 | 1.7x |
| AppFeaturesCarouselDefault.tsx | 231 | 1.5x |
| + 35 more files between 151-229 lines | | |

### Services over 200 lines (10 files)

| File | Lines | Over by |
|---|---|---|
| ErrorReportingService.ts | 491 | 2.5x |
| analytics/service.ts | 489 | 2.4x |
| waitingList/store.ts | 468 | 2.3x (util, 4.7x over 100) |
| share/constants.ts | 377 | 3.8x (util) |
| ShareManager.ts | 369 | 1.8x |
| AlertingService.ts | 358 | 1.8x |
| performance-monitor.ts | 352 | 3.5x (util) |
| Logger.ts | 340 | 1.7x |
| PerformanceService.ts | 332 | 1.7x |
| monitoring/service.ts | 308 | 1.5x |

### Utils over 100 lines (43 files)

43 utility files exceed the 100-line limit. Top offenders: `waitingList/store.ts` (468), `share/constants.ts` (377), `performance-monitor.ts` (352), `seo/constants.ts` (304), `metadata-factory.ts` (300), `encryption.ts` (296).

---

## CATEGORY 2: Hardcoded CSS Values (Anti-Slop + Design Tokens)

CLAUDE.md: "Always use existing design tokens — never hardcode colors, spacing, or font sizes."

**319 total violations across 15+ CSS module files.** The CTO board did not audit this.

| Category | Count | Primary Offenders |
|---|---|---|
| Hardcoded hex colors | 24 | PreDream.module.css (20), LegalDocument (3), ProductCarouselDefault (1) |
| Hardcoded pixel font sizes | 73 | PreDemo.module.css (42), PreDream (10), FeeTable (5), LanguageSwitcher (4) |
| Hardcoded pixel spacing | 222 | PreDemo.module.css (122), PreDream (35), FeeTable (16), ScenarioCards (11) |

**73% of all violations** are in just two files: `PreDemo.module.css` (164) and `PreDream.module.css` (65).

---

## CATEGORY 3: Race Condition Violations

CLAUDE.md: "Every useEffect with timers → store IDs, clear in cleanup. Every addEventListener → corresponding removeEventListener."

**7 violations found + 3 false positives corrected.** CTO board review identified that AlertingService, ErrorReportingService, and MonitoringService all have proper `destroy()` methods (fixed in original audit items #3, #4). Our agents missed these existing cleanups.

| # | File | Issue | Severity |
|---|---|---|---|
| 1 | `app/layout.tsx:114` | addEventListener in inline script, no cleanup | P2 |
| 2 | `monitoring/performance-monitor.ts:199` | setInterval ID not stored, cleanup impossible | P1 |
| 3 | ~~`monitoring/AlertingService.ts:69`~~ | ~~no destroy() method~~ | **FALSE POSITIVE** — destroy() exists at line 338 |
| 4 | `analytics/service.ts:462` | destroy() exists but no lifecycle guarantee it's called | P2 |
| 5 | ~~`errors/ErrorReportingService.ts:78`~~ | ~~no public destroy()~~ | **FALSE POSITIVE** — destroy() exists at line 468 |
| 6 | ~~`monitoring/service.ts:187-189`~~ | ~~no destroy()~~ | **FALSE POSITIVE** — destroy() exists at line 292 |
| 7 | `errors/breadcrumbManager.ts:114` | destroy() exists but no lifecycle guarantee it's called | P2 |
| 8 | `PreDemo/LoginScreen.tsx:17-36` | setTimeout in useCallback, no useEffect cleanup | P1 |
| 9 | `PreDemo/ConfirmationScreen.tsx:43-182` | Multiple setTimeouts in useCallback, no cleanup | P1 |
| 10 | `analytics/web-vitals.ts:63` | beforeunload listener cleanup only if used as hook | P2 |

**Note:** Items #3, #5, #6 were fixed in the original codebase audit (CLAUDE.md Audit Tracker items #3, #4, #5 — all "Done"). The remaining valid concern for services with destroy() is that no lifecycle mechanism guarantees destroy() is called on page unload — this is P2 architectural debt, not a missing implementation.

---

## CATEGORY 4: i18n Violations — Hardcoded English Strings

CLAUDE.md: "All new user-facing strings must be added to all 4 locales."

**20 total violations.** CTO board found 9 (wizard screens). Independent audit found 11 more.

### Wizard screens (CTO board findings — confirmed)

| File | Line | String |
|---|---|---|
| SimulationScreen.tsx | 78-80 | 'Christmas Bonus', 'Emergency Fund', 'Vacation' |
| SimulationScreen.tsx | 86 | 'Calculating your ... plan...' |
| GoalAmountScreen.tsx | 106, 114 | 'Back', 'Next' |
| TimelineScreen.tsx | 153, 161 | 'Back', 'Next' |
| ResultsScreen.tsx | 275 | 'Try a different goal' |

### Additional aria-label/title violations (new findings)

| File | Line | String |
|---|---|---|
| HeroFullBackground.tsx | 113 | `aria-label="Scroll down"` |
| CashflowExplainerSection.tsx | 66 | `aria-label="Example calculation"` |
| SiteFooter.tsx | 43 | `aria-label="Site footer"` |
| MinimalFooter.tsx | 144, 155, 201 | `"Site footer"`, `"Product navigation"`, `"Legal pages"` |
| MinimalNavigation.tsx | 80 | `aria-label="Main navigation"` |
| PreDream.tsx | 89, 94 | `"Dream Mode"`, `"Close Dream Mode"` |
| ShareDreamSection.tsx | 162 | `"Copy share text to clipboard"` |
| ProtocolCard.tsx | 41, 46 | `"Warning badge"`, `"Compliance badge"` |

### Skip-link (confirmed)

Both `(landing)/layout.tsx:62` and `(marketing)/layout.tsx:64` hardcode "Skip to main content" — translation keys exist in `common.json` (`accessibility.skipToMain`) but are unused.

---

## CATEGORY 5: Security

| Finding | Status | Ref |
|---|---|---|
| CSP `connect-src` missing PostHog domain | **FAIL** | middleware.ts:94 |
| CSP nonce-based, no unsafe-inline for scripts | PASS | |
| CSRF on all mutation endpoints | PASS | |
| Rate limiting on all API routes | PASS | |
| PostHog lazy-load behind consent | PASS | |
| Input sanitization (DOMPurify) | PASS | |
| PII encryption (AES-256-GCM) | PASS | |
| Anti-enumeration on waitlist | PASS | |
| Security headers (HSTS, X-Frame-Options, etc.) | PASS | |
| Production secret validation | PASS | |
| Sentry client config | PASS | Migrated to instrumentation-client.ts |

**CTO board claimed sentry.client.config.ts was missing — INCORRECT.** It was migrated to `instrumentation-client.ts` (Next.js v10+ pattern).

---

## CATEGORY 6: Accessibility

| Finding | Status |
|---|---|
| Skip-link HTML present in both layouts | PASS |
| Skip-link CSS defined (semantic-components.css:13-31) | PASS |
| Skip-link text hardcoded English (not using i18n key) | **FAIL** |
| Error boundaries 3-layer | PASS |
| loading.tsx in both route groups | PASS |
| Focus trap on modals (useFocusTrap) | PASS |

**CTO board claimed skip-link CSS was missing — INCORRECT.** CSS exists in `semantic-components.css` with proper focus styling using design tokens.

---

## CATEGORY 7: React Patterns

| Pattern | Status |
|---|---|
| Explicit conditional rendering (ternary, not &&) | PASS — all checked components use `: null` |
| Functional setState | PASS — proper `prev =>` pattern used |
| Extract default non-primitives | PASS — no inline default objects/arrays |
| SSR-safe localStorage | **WARN** — `layout.tsx:107` accesses localStorage in inline script (wrapped in try-catch but pattern is non-standard) |
| Derived state during render | PASS |

---

## CATEGORY 8: Remaining Confirmed CTO Board Findings

| Finding | Severity | Status |
|---|---|---|
| PT-BR hero subheadline missing "na diBoaS" qualifier | P1 | CONFIRMED |
| B2B DE footer duplicate crypto disclaimers | P1 | CONFIRMED — `getDisclosureKeysForLocale` adds both `crypto` (all locales) and `mica` (DE/ES) |
| faq.json guarantee/FDIC/military-grade language | P1 | CONFIRMED — q8, q9, q24 + more. Dormant but will surface with Help page |
| useWaitlistStats uses raw fetch() not fetchWithRetry | P2 | CONFIRMED |
| 8 inline styles in wizard screens | P1 | CONFIRMED — regression from audit #32 |
| PostHog import duplicated 4x in wizard screens | P1 | CONFIRMED — should use centralized trackEvent |
| GoalCalculator.module.css 851 lines (target 450) | P1 | CONFIRMED |

---

## CATEGORY 9: Verified Compliant

| Area | Status |
|---|---|
| Event-Driven Architecture (EventBus, 30+ types, validation) | PASS |
| Health endpoints (3-tier: /health, /live, /ready) | PASS |
| Bundle optimization (splitChunks, optimizePackageImports) | PASS |
| Production compiler (removeConsole, reactRemoveProperties) | PASS |
| Wizard focus management (aria-live, step indicator) | PASS |
| SSR-safe useReducer lazy initializer | PASS |
| Wizard rAF cleanup + prefers-reduced-motion | PASS |
| Icon migration (lucide-react → LucideIcon wrapper) | PASS |
| Design tokens validated (56 tokens) | PASS |
| Translation key parity (60 files, 4 locales) | PASS |
| Wizard reducer tests (29 cases) | PASS |

---

## Summary Comparison: CTO Board vs. Independent Audit

| Category | CTO Board Found | Independent Audit Found |
|---|---|---|
| File size violations (components) | 4 files | **48 files** |
| File size violations (services/utils) | 0 | **53 files** |
| Hardcoded CSS values | 0 | **319 violations** |
| Race condition violations | 0 (verified wizard only) | **7 violations** (3 false positives corrected by CTO board) |
| i18n hardcoded strings | 9 (wizard) | **20 total** (+11 aria-labels) |
| Security findings | 2 (CSP + Sentry) | 1 (CSP only — Sentry was wrong) |
| Test coverage gaps | Flagged but unverified | **Verified: 5/6 security files below 100%** |

**The CTO board's audit was accurate for what it examined** — primarily the wizard redesign and recent changes. However, it did not scan the systemic codebase-wide issues: file size violations across 101 files, 319 hardcoded CSS values, 10 race condition patterns in services, and 11 additional hardcoded English aria-labels.

---

## Priority-Ordered Fix Plan

### Tier 1: P0 (before deployment)
1. Skip-link i18n — wire `accessibility.skipToMain` from common.json (5 min)
2. CSP PostHog domain in connect-src (1 min)

### Tier 2: P1 Critical (this sprint)
3. Wizard i18n: 9 hardcoded strings across 4 screens (45 min)
4. PT-BR hero subheadline "na diBoaS" qualifier (5 min)
5. B2B DE footer conditional crypto key (15 min)
6. PreDemo LoginScreen/ConfirmationScreen timer cleanup (30 min)
7. Service destroy() methods: AlertingService, ErrorReportingService, MonitoringService (1 hr)
8. performance-monitor.ts setInterval fix (15 min)

### Tier 3: P1 Structural (next sprint)
9. DepositRiskScreen + ResultsScreen file splits (1 hr)
10. PostHog DRY: expose trackEvent via context (30 min)
11. Inline styles → CSS module classes (20 min)
12. 11 aria-label i18n violations (45 min)
13. useWaitlistStats → fetchWithRetry (5 min)
14. Test coverage: security utilities toward 100% (2 hrs)
15. Test coverage: lib/errors toward 80%, CookieConsent toward 60% (2 hrs)

### Tier 4: P1 Systemic (phased over multiple sprints)
16. File size refactoring: top 15 components over 200 lines (multi-sprint)
17. File size refactoring: top 10 services over 200 lines (multi-sprint)
18. Hardcoded CSS values: PreDemo.module.css (164 violations) (1-2 days)
19. Hardcoded CSS values: PreDream.module.css (65 violations) (1 day)
20. Remaining 90 hardcoded CSS violations across other files (1-2 days)

### Tier 5: P2 (cleanup cycle)
21. FAQAccordionDefault split (30 min)
22. GoalCalculator.module.css consolidation (1-2 hrs)
23. faq.json compliance language cleanup (Phase 1A)
24. Anti-slop checklist doc correction (2 min)
25. tsup/rollup vulnerability update (10 min)
26. layout.tsx localStorage access pattern (15 min)

---

## Final Totals

| Metric | Count |
|---|---|
| Total findings | **~447+** (101 file size + 319 CSS + 20 i18n + 7 race conditions + coverage gaps + security + content) |
| Verified compliant areas | 28 (25 original + 3 race condition false positives corrected) |
| CTO board findings confirmed | 16 of 19 |
| CTO board findings corrected by us | 2 (skip-link CSS exists, Sentry migrated) |
| Our findings corrected by CTO board | 3 (AlertingService, ErrorReportingService, MonitoringService all have destroy()) |
| Estimated P0+P1 Critical fix effort | ~6 hours |
| Estimated P1 Systemic fix effort | Multi-sprint (file sizes + CSS tokens) |

---

*Generated 2026-03-17. Full independent audit covering every CLAUDE.md section.*
*Previous version replaced — this version includes comprehensive file-size, CSS, race-condition, and i18n audits the CTO board did not cover.*
