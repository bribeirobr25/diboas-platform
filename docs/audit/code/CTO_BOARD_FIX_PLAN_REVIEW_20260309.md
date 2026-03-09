# CTO Board — Fix Plan Execution Review

**Date:** March 9, 2026
**Document Under Review:** Section 26 (Consolidated Fix Plan) of `full-codebase-audit-20260309.md` Rev 3
**Method:** Source code verification of key assumptions in the execution plan

---

## 1. Overall Assessment

The phasing is well-structured and the dependency chain is mostly correct. However, I found **3 execution risks that will cause breakage if not addressed**, **2 plan inaccuracies**, and **4 improvements** that would save time or prevent rework.

---

## 2. Execution Risks (Will Break If Not Addressed)

### RISK-1: Analytics Service Consolidation (DRY-1) — API Mismatch Will Break All Callers

**Plan says:** "Keep `error-resilient-service.ts` as canonical. Delete `service.ts`. Update all imports."

**Problem:** The two services have **incompatible APIs**:

- `service.ts` implements the `AnalyticsService` interface: `track({name, parameters})`, `trackPageView()`, `trackPerformance()`, `trackNavigation()`, `flush()`, `setUserId()`, `setSessionId()`
- `error-resilient-service.ts` has a completely different API: `trackEvent(eventName, properties)`, `getHealthStatus()`

The barrel `index.ts` exports from `./service`:
```typescript
export { analyticsService } from './service';
```

Every caller in the codebase uses the `service.ts` API:
```typescript
analyticsService.track({ name: 'dream_mode_entry', parameters: { source: 'direct_url', locale } });
```

If you delete `service.ts` and point the barrel to `error-resilient-service.ts`, **every single analytics call in the codebase breaks** — different method name (`track` vs `trackEvent`), different parameter shape (object vs two args).

**Fix:** The consolidation is not a "delete one, keep the other" task. It requires either:
- (a) Rewrite `error-resilient-service.ts` to implement the `AnalyticsService` interface (same method signatures as `service.ts`) while keeping its retry/resilience logic, OR
- (b) Create a new unified service that wraps the resilient error handling around the correct API, OR
- (c) Keep `service.ts`'s API as the public interface and add the retry/queue/offline logic from `error-resilient-service.ts` into it

**Effort correction:** 2-3 hrs is reasonable for the total work, but the plan description needs to explicitly call out the API migration, not just "delete and update imports."

### RISK-2: DreamMode → PreDream Swap (GAP-9) — Props Interface Mismatch

**Plan says:** "Update `/dream-mode` page to import PreDream instead of legacy DreamMode. Delete `components/DreamMode/` directory."

**Problem:** The components have different prop interfaces:

- `DreamMode` accepts: `onComplete`, `onClose`, `className`, `initialInput`
- `PreDream` accepts: `onClose`, `onBackToHome`

The `DreamModePageContent.tsx` currently passes:
```tsx
<DreamMode onComplete={handleComplete} onClose={handleClose} className={styles.dreamMode} />
```

Simply changing the import will produce TypeScript errors (`onComplete` doesn't exist on PreDream, `className` doesn't exist on PreDream).

Additionally, `DreamModePageContent.tsx` has significant wrapper logic (waitlist membership gating, analytics tracking, loading states, gate UI with CTA) that may or may not be compatible with PreDream's own flow. PreDream has its own DisclaimerScreen that serves a similar gating purpose.

**Fix:** This is a **rewrite of `DreamModePageContent.tsx`**, not a find-and-replace import swap. Effort should be 2-3 hrs, not 1 hr. Steps:
1. Map DreamMode props to PreDream equivalents (`onComplete` → `onBackToHome`)
2. Evaluate whether the waitlist gating logic should stay (PreDream may handle its own access control via its disclaimer)
3. Update the dynamic import
4. Test the flow end-to-end
5. THEN delete `components/DreamMode/`

### RISK-3: Hardcoded ID Pass (CTO-NEW-1) — Legal Pages Must NOT Use `useId()`

**Plan says:** "49 total — evaluate which are reusable vs legal/TOC anchors"

**Problem:** The plan says "evaluate" but doesn't define the evaluation rule. Without a clear rule, the developer will either:
- Skip the legal pages (missing ~31 of 49 IDs) and leave the task incomplete
- Convert ALL IDs to `useId()`, breaking in-page anchor navigation on legal pages (Privacy, Terms, Cookies all use `#section-*` URL fragments for table-of-contents navigation)

**Fix:** Add explicit rule to the plan:
- **Convert to `useId()`:** All component-level IDs in reusable components (ExpandableSection, CalculatorToggleSection, TreasuryCalculator, WaitlistModal, WaitlistForm, FAQAccordion, BenefitsCards, AppFeaturesCarousel, Hero variants, CookieConsent, MinimalNavigation, ShareModal)
- **Keep stable IDs:** Legal content pages (PrivacyPolicyContent, TermsOfUseContent, CookiePolicyContent) where IDs are anchor targets for in-page TOC navigation
- **Rule of thumb:** If the ID is used for `href="#..."` in-page navigation, keep it stable. If it's used for `aria-controls`/`aria-labelledby`, convert to `useId()`.

---

## 3. Plan Inaccuracies

### INACCURACY-1: Phase Dependency Error

**Plan says (Phase 7):** "Dependencies: After P2 (proxy.ts deletion)"

**Actual:** `proxy.ts` deletion is in **P1** (XVER-1), not P2. P2 is dead code cleanup (DualCTA, Cal.com, phantom scripts). The dependency should read "After P1 (proxy.ts extraction + deletion)."

### INACCURACY-2: CTO-GAP-4 Still Marked "Decision Needed"

**Plan says (Phase 2):** "Decision needed: Remove, noindex, or feature-flag the entire `(marketing)` route group"

**Actual:** CEO Decision Record Q5 (March 4, 2026) confirmed: "Remove/hide for V1 — avoid confusion." This is the same issue as GAP-2 where the "if" qualifier was corrected. The marketing route group decision is already made — remove for V1.

---

## 4. Improvements

### IMPROVE-1: Split P0 Into "Immediate" and "Blocked"

P0 currently mixes items that can be done right now (CRIT-1, CRIT-2, CRIT-4, CRIT-5 — total ~1.5 hrs) with CTO-GAP-1 (FAQ fee compliance) which is **blocked on CMO delivery** and could be blocked for days or weeks.

**Recommendation:** Split into:
- **P0a (immediate, ~1.5 hrs):** CRIT-1, CRIT-2 + CTO-NEW-1, CRIT-4, CRIT-5
- **P0b (blocked, unblock = CMO delivery):** CTO-GAP-1

This lets Phase 0 be marked complete and Phase 1 can start immediately, rather than P0 sitting "in progress" indefinitely waiting on an external dependency.

### IMPROVE-2: Proxy.ts Locale Detection — Don't Port the Naive Implementation

The plan says "Port `detectUserLocale()` from `proxy.ts` to `middleware.ts`."

`proxy.ts`'s implementation uses a naive `includes()` check against Accept-Language:
```typescript
for (const locale of SUPPORTED_LOCALES) {
  if (acceptLanguage.includes(locale) || acceptLanguage.includes(locale.split('-')[0])) {
    return locale;
  }
}
```

This has quality issues — it doesn't respect Accept-Language quality values (q-factors), doesn't handle complex headers properly, and `pt-BR` matching via `includes('pt')` would match `pt-PT` too.

The project already has `@formatjs/intl-localematcher` and `negotiator` in dependencies (verified in earlier audit sessions). These were added specifically for proper locale negotiation.

**Recommendation:** Don't port the `proxy.ts` implementation. Instead, implement GAP-3 using the proper libraries:
```typescript
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
```

This is the same pattern documented in Next.js i18n middleware examples and produces correct results for edge cases.

### IMPROVE-3: Add Smoke Test After Each Phase

The plan doesn't include verification steps between phases. Given the interconnected nature of the changes (especially P0 → P1 → P2), each phase should end with a quick verification:

- **After P0:** Run `turbo build` to verify design token generator doesn't fire. Visually check B2C page renders two expandable sections with unique IDs.
- **After P1:** Run the test suite (`pnpm test`). Verify `/dream-mode` page loads PreDream. Check that analytics calls still fire in browser console.
- **After P2:** Run `pnpm check:dead-code` (knip) to verify no dangling imports from deleted files.

This catches cascade failures early rather than discovering them in Phase 9.

### IMPROVE-4: Consider Batching the `useId()` Pass with the Aria-Label Fix

Both CTO-NEW-1 (hardcoded IDs → `useId()`) and A11Y-ARIA (hardcoded English aria-labels → i18n) require touching many of the same component files. If done separately, the same files get modified twice. Batching them into a single pass per component would be more efficient and reduce merge conflicts.

The components overlap is significant: CalculatorToggleSection, FAQAccordionDefault, MinimalNavigation, SocialProofSection, ShareModal, HeroDefault, HeroFullBackground, AppFeaturesCarouselDefault — all need both ID fixes AND aria-label i18n.

**Recommendation:** Combine the CRIT-2 + CTO-NEW-1 task with the A11Y-ARIA task into a single "accessibility hardening pass" at the start of P1, immediately after P0. Touch each component once, fix both IDs and aria-labels in the same edit.

---

## 5. Time Estimate Corrections

| Task | Plan Estimate | Corrected Estimate | Reason |
|------|--------------|-------------------|--------|
| DRY-1 + CTO-NEW-2 + CTO-NEW-6 (analytics consolidation) | 2-3 hrs | 3-4 hrs | API mismatch requires rewrite, not just import update |
| CTO-GAP-9 (DreamMode → PreDream) | 1 hr | 2-3 hrs | Props interface mismatch, wrapper logic evaluation needed |
| CRIT-2 + CTO-NEW-1 (hardcoded IDs) | 1 hr | 1.5-2 hrs | Need to evaluate 49 IDs against legal/anchor exemption rule |
| CTO-GAP-4 (marketing route removal) | 1-2 hrs | 1-2 hrs | No change, but remove "Decision needed" label |

**Net impact:** ~3-4 additional hours on total estimate. Revised total: ~90-115 hrs.

---

## 6. Summary

| Category | Count |
|----------|-------|
| Execution risks (will break) | 3 |
| Plan inaccuracies | 2 |
| Improvements | 4 |
| Time estimate corrections | 4 |

**The plan structure and phasing are sound.** The three execution risks are the critical items — if Claude Code tries to "delete `service.ts` and update imports" without addressing the API mismatch, or swaps DreamMode for PreDream without handling the different props, both will produce immediate TypeScript compilation errors and runtime failures. The legal page ID exemption rule prevents a subtler bug where in-page navigation breaks silently.

Everything else is optimization — worth doing but not blocking.

---

*CTO Board — March 9, 2026*
