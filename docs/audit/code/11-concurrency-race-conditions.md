# Principle 11: Concurrency & Race Condition Prevention

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Full codebase review against Principle 11 requirements
**Platform Phase:** Pre-launch / Waitlist

---

## Principle Requirements

From `docs/coding-standards.md`:

- Use distributed locks for critical operations
- Database transactions with proper isolation levels
- Optimistic locking with version fields
- Queue-based processing for high-load operations
- Idempotency keys for retryable operations

**Patterns:**
- Pessimistic locking (lock before access)
- Optimistic locking (check version before update)
- Queue-based serialization
- Idempotent operations

**Additional patterns from CLAUDE.md (Race Condition & Async Patterns):**
- Every `useEffect` with timers -> store IDs, clear in cleanup
- Every `useEffect` with async -> use `mounted` flag or `AbortController`
- Every `addEventListener` -> corresponding `removeEventListener` in cleanup
- Use refs (not state) for values that should not trigger re-renders
- Service classes with global listeners -> store bound references, remove in `destroy()`
- Never include state-setter output in same effect's dependency array if the effect sets that state

---

## Findings

### 11.1 Race Condition Prevention Utilities

**Status: Compliant**

The codebase provides a comprehensive, modular race condition prevention toolkit under `apps/web/src/lib/utils/race-condition/`:

| Utility | File | Purpose |
|---------|------|---------|
| `SafeTimer` | `SafeTimers.ts` | Timer wrapper that auto-clears previous timer on re-set and checks `isActive` flag before callback execution |
| `SafeInterval` | `SafeTimers.ts` | Interval wrapper with same protections as `SafeTimer` |
| `SafeAnimationFrame` | `SafeTimers.ts` | `requestAnimationFrame` wrapper with auto-cancel and active-check |
| `DebouncedFunction` | `FunctionWrappers.ts` | Debounce wrapper built on `SafeTimer`, includes `cancel()` and `pending` check |
| `ThrottledFunction` | `FunctionWrappers.ts` | Throttle wrapper built on `SafeTimer`, prevents rapid successive calls |
| `MutexLock` | `ConcurrencyControl.ts` | Non-blocking mutex with `acquire()`/`release()` and `withLock()` convenience method |
| `StateMachine` | `ConcurrencyControl.ts` | Typed state machine preventing invalid state transitions |
| `CleanupManager` | `CleanupManager.ts` | Component-lifecycle cleanup orchestrator; executes all registered cleanup functions on `destroy()` |
| `useCleanupManager` | `CleanupManager.ts` | React hook wrapper for `CleanupManager` |

**Evidence:**
- All timer classes check an `isActive` flag before executing callbacks, preventing post-cleanup execution.
- `MutexLock.withLock()` uses a try/finally pattern to guarantee lock release even on errors.
- `StateMachine` validates transitions against a declared transition map, rejecting invalid moves.
- `CleanupManager` wraps each cleanup function in try/catch to prevent a single failure from blocking others.
- Barrel re-export at `apps/web/src/lib/utils/RaceConditionPrevention.ts` for backward compatibility.

**Gaps:** None. The utilities are well-designed and comprehensive.

---

### 11.2 useEffect Cleanup Patterns -- Timers

**Status: Compliant (with 3 minor exceptions)**

The audit reviewed all 50 files that use `setTimeout` or `setInterval`. Cleanup patterns are categorized below.

#### Properly cleaned up timers

| Component/Hook | Timer Type | Cleanup Method |
|---------------|-----------|---------------|
| `CookieConsent.tsx` | `setTimeout` (nested, x3) | Timer IDs pushed to `timers[]` array, all cleared in cleanup via `timers.forEach(clearTimeout)` |
| `useCarousel.ts` | `SafeInterval`, `SafeTimer` | `intervalRef.current?.clear()` in effect cleanup + `CleanupManager.destroy()` on unmount |
| `useScrollDepthTracking.ts` | `setTimeout` | `clearTimeout(timer)` in cleanup |
| `useRewardAnimation.ts` | `setTimeout` (multiple) | All pushed to `timeouts[]`, cleared via `timeouts.forEach(clearTimeout)` |
| `useAnimatedCounter.ts` | `requestAnimationFrame` | `cancelAnimationFrame(animationRef.current)` in cleanup |
| `WaitlistConfirmation.tsx` | `setInterval` | `clearInterval(timer)` in cleanup |
| `ScrollToHash.tsx` | `setTimeout` | `clearTimeout(timeout)` in cleanup |
| `useSectionLoading.ts` | `setTimeout` (per item) | Stored in `Map<string, Timeout>`, all cleared on unmount and per-item on completion |
| `usePerformanceMonitor.ts` | `setInterval` | `clearInterval(reportingTimer.current)` in `stopMonitoring()`, called from unmount cleanup |
| `useScrollPosition.ts` | `setTimeout` (throttle) | `clearTimeout(timeoutId)` in cleanup |
| `FeatureShowcaseDefault.tsx` | `setTimeout` | `clearTimeout(timeoutId)` in cleanup |
| `StepGuideDefault.tsx` | `setTimeout` | `clearTimeout(timeoutId)` in cleanup |
| `PreDream/SimulationScreen.tsx` | `requestAnimationFrame` | `cancelAnimationFrame(animFrameRef.current)` in cleanup |

#### Timers without explicit cleanup (minor risk)

| Component | Timer | Risk Assessment |
|-----------|-------|----------------|
| `CookieConsent.tsx` `closeBanner()` | `setTimeout(() => setShowBanner(false), 300)` | **Low risk.** Called from event handler (not `useEffect`), 300ms duration. State update on unmounted component would be a React no-op in modern React. |
| `ShareModal.tsx` `handleShare` | `setTimeout(() => setCopySuccess(false), 2000)` | **Low risk.** Called from event handler callback, 2-second delay. Setting state on unmounted component is harmless but technically imprecise. |
| `DreamMode/SimulationScreen.tsx` | `setTimeout(() => nextScreen(), 500)` inside `requestAnimationFrame` callback | **Medium risk.** The `setTimeout` is created inside the rAF callback after animation completes. The rAF is cleaned up, but if it fires before cleanup, the `setTimeout` is not tracked. The `PreDream/SimulationScreen.tsx` has the same pattern. |
| `MobileNav.tsx` | `setTimeout(() => { scrollTo... }, DELAY)` in `useEffect` | **Low risk.** No cleanup return. Only affects scroll position, no state updates. Short-lived effect with no memory leak potential. |

**Recommendation:** For the `SimulationScreen` setTimeout-inside-rAF pattern, store the timer ID in a ref and clear it in the useEffect cleanup. For `ShareModal` and `CookieConsent` event-handler timers, consider using a ref-tracked timer for strictness.

---

### 11.3 useEffect Cleanup Patterns -- Async Operations

**Status: Compliant**

All async operations in `useEffect` hooks use either a `mounted` flag or an `AbortController` to prevent state updates after unmount.

| Component/Hook | Async Pattern | Cancellation Method |
|---------------|--------------|-------------------|
| `CookieConsent.tsx` | `async checkConsent()` | `mounted` flag checked after each `await`; set to `false` in cleanup |
| `CalEmbed.tsx` | `async initializeEmbed()` | `AbortController` -- `signal.aborted` checked after `await loadCalScript()` and before `setIsLoaded()` |
| `SocialProofSection.tsx` | `async fetchStats()` | `AbortController` -- passed as `signal` to `fetch()`, `controller.abort()` in cleanup |
| `useWaitlistForm.ts` | `async handleSubmit()` | `AbortController` stored in `abortControllerRef`, aborted on unmount via `useEffect` cleanup |
| `PostHogProvider.tsx` | `async initPostHog()` | `isInitializedRef` prevents double-init; event listener removed in cleanup |
| `ShareModal.tsx` | `async renderer.render()` | `isRenderingRef` ref prevents duplicate renders; `.finally()` resets the ref |

**Evidence:**
- `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts` lines 77-84: `abortControllerRef` created per submission, aborted on unmount.
- `apps/web/src/components/BookCall/CalEmbed.tsx` lines 60, 91, 130, 136, 144-146: `AbortController` created, checked at two points, aborted in cleanup.
- `apps/web/src/lib/utils/fetchWithRetry.ts` lines 41-43, 57-70: Respects `AbortSignal` -- aborted requests throw immediately without retry. Backoff delay is also cancellable via signal.

**Gaps:** None.

---

### 11.4 useEffect Cleanup Patterns -- Event Listeners

**Status: Compliant**

All `addEventListener` calls in `useEffect` hooks have corresponding `removeEventListener` calls in cleanup functions.

| Component/Hook | Event | Cleanup |
|---------------|-------|---------|
| `useNavigation.ts` | `resize`, `keydown` | Removed in cleanup returns |
| `useLanguageSwitcher.ts` | `mousedown`, `keydown` | Conditionally added when `isOpen`, removed in cleanup |
| `useFocusTrap.ts` | `keydown` | Removed in cleanup, also restores previous focus |
| `DreamMode.tsx` | `keydown` (Escape) | Removed in cleanup |
| `ShareModal.tsx` | `keydown` (Escape) | Removed in cleanup |
| `WaitingListProvider.tsx` | `click` (capture), `keydown` | Both removed in cleanup returns |
| `PostHogProvider.tsx` | `cookie-consent-changed` | Removed in cleanup |
| `WebVitalsTracker.tsx` | `cookie-consent-changed` | Removed in cleanup |
| `useScrollPosition.ts` | `scroll` (passive) | Removed in cleanup along with throttle timer |

**Evidence:** All 24 files containing `addEventListener` were reviewed. Every instance within a `useEffect` has a matching removal in the cleanup function.

**Gaps:** None.

---

### 11.5 Service Class Cleanup (Bound Handler Pattern)

**Status: Compliant**

All service classes that register global event listeners store bound handler references as class properties and remove them in a `destroy()` method.

#### ErrorReportingService (`apps/web/src/lib/errors/ErrorReportingService.ts`)

- **Bound handlers:** `boundHandleGlobalError`, `boundHandleUnhandledRejection`, `boundHandleResourceError` (lines 58-60)
- **Registration:** Only `boundHandleResourceError` registered directly (lines 78-79); global error/rejection handlers delegated from MonitoringService (single coordinator pattern)
- **Cleanup:** `destroy()` method (lines 443-451) removes the resource error listener, clears breadcrumbs and error maps, resets `isInitialized`

#### MonitoringService (`apps/web/src/lib/monitoring/service.ts`)

- **Bound handlers:** `boundHandleError`, `boundHandleRejection`, `boundHandleCspViolation` (lines 23-54)
- **Registration:** All three added in `initializeGlobalHandlers()` (lines 184-189)
- **Cleanup:** `destroy()` method (lines 292-305) removes all three listeners, clears flush timer, performs final flush

#### ThemeManager (`apps/web/src/lib/theme/theme-manager.ts`)

- **Bound handler:** `boundHandleSystemPreferenceChange` (line 71)
- **Registration:** Added to 3 `MediaQueryList` objects (`colorScheme`, `contrast`, `reducedMotion`) in `setupMediaQueryListeners()` (lines 129-145)
- **Cleanup:** `destroy()` method (lines 405-417) iterates all `mediaQueries` and removes the listener, clears listener set

**Evidence:** The "single coordinator pattern" is correctly implemented -- `MonitoringService` is the sole registrant of global `error` and `unhandledrejection` handlers, delegating to `ErrorReportingService.handleError()` to avoid duplicate registrations.

**Gaps:** None.

---

### 11.6 MutexLock and StateMachine Usage

**Status: Compliant**

The `MutexLock` and `StateMachine` utilities are actively used in the `useCarousel` hook (`apps/web/src/hooks/useCarousel.ts`), which is the primary component requiring concurrency control on the client side.

**Evidence:**
- `mutexRef` (line 161): Prevents concurrent slide transitions via `mutexRef.current.acquire()` before `goToSlide` and `startAutoRotation`
- `carouselStateRef` (lines 166-173): Defines valid state transitions (`idle -> playing/paused`, `playing -> paused/transitioning`, etc.)
- `goToSlide` (lines 178-201): Acquires mutex, transitions to `transitioning`, schedules cleanup timer, releases mutex in `finally`
- Auto-rotation (lines 232-262): Checks `canTransitionTo('transitioning')` before advancing, preventing overlapping transitions

**Gap:** The `MutexLock` and `StateMachine` are only used in `useCarousel`. No other hooks or components use them. This is acceptable for the current pre-launch phase where `useCarousel` is the most complex client-side concurrency scenario.

**Recommendation:** As product features launch (transaction flows, multi-step forms), extend `MutexLock` usage to those critical paths.

---

### 11.7 Idempotency in API Routes

**Status: Partial**

#### Waitlist Signup (`POST /api/waitlist/signup`)

The signup route handles duplicate submissions through a check-then-insert pattern:

1. `exists(email)` check (line 184) before insertion
2. If email exists, returns the existing entry data with same response structure (lines 186-195)
3. Catch handler also handles the `'Email already exists'` error from the store's own check (lines 283-289)

This provides **behavioral idempotency** -- submitting the same email twice returns the same result without side effects.

**However:**

- **No formal idempotency keys.** The API does not accept or track `Idempotency-Key` headers per RFC/Stripe convention.
- **No distributed locking.** The `exists()` check and `addEntry()` are separate operations on an in-memory `Map`. Under concurrent requests, a TOCTOU (time-of-check-time-of-use) race exists between the `exists()` check and the `addEntry()` call.
- **Mitigation:** The store's `addEntry()` performs its own `store.has(email)` check (store.ts line 234), throwing `'Email already exists'`, which is caught by the route handler. This provides a second layer of defense. The in-memory `Map` is single-threaded in Node.js, so the TOCTOU window is extremely small but theoretically present if multiple event loop ticks interleave.

#### Client-Side Double-Submit Prevention

- `useWaitlistForm.ts` uses `isSubmittingRef` (line 77) as an immediate guard before the async operation begins
- The ref is checked synchronously at line 102, preventing double-clicks from queueing duplicate requests
- The ref is reset in the `finally` block (line 233)

**Gaps:**
1. No formal `Idempotency-Key` header support on any API route
2. No distributed lock around the check-then-insert pattern (acceptable for in-memory store in pre-launch, not for production database)

**Recommendation:**
- Add `Idempotency-Key` header support when migrating to a database backend
- Use database-level UNIQUE constraints and/or optimistic locking when transitioning away from in-memory store
- Document the current behavioral idempotency as intentional for the pre-launch phase

---

### 11.8 AbortController Usage

**Status: Compliant**

`AbortController` is used correctly in 5 locations across the codebase:

| Location | Usage |
|----------|-------|
| `CalEmbed.tsx` | Created per-effect, signal checked after async operations, aborted in cleanup |
| `SocialProofSection.tsx` | Created per-effect, passed to `fetch()` as signal, aborted in cleanup |
| `useWaitlistForm.ts` | Stored in ref, previous controller aborted before creating new one, aborted on unmount |
| `fetchWithRetry.ts` | Respects incoming `signal` -- aborted requests throw immediately, backoff delay is signal-aware |
| Test files | Used in test assertions |

**Evidence:** `fetchWithRetry` (lines 41-43) checks `signal.aborted` before retrying. The `delay()` helper (lines 57-70) registers an abort listener that clears the backoff timer and rejects the promise.

**Gaps:** None.

---

### 11.9 Refs for Transient Values

**Status: Compliant**

The codebase consistently uses `useRef` for values that should not trigger re-renders:

| Component/Hook | Ref | Purpose |
|---------------|-----|---------|
| `useCarousel.ts` | `cleanupManagerRef`, `mutexRef`, `intervalRef`, `timerRef`, `carouselStateRef` | Race condition utilities, timer references |
| `useWaitlistForm.ts` | `isSubmittingRef`, `abortControllerRef` | Double-submit guard, request cancellation |
| `ShareModal.tsx` | `isRenderingRef` | Prevents duplicate card rendering |
| `PostHogProvider.tsx` | `isInitializedRef`, `posthogRef` | Initialization guard, PostHog instance |
| `usePerformanceMonitor.ts` | `renderStartTime`, `mountTime`, `updateCount`, `customMetrics`, `reportingTimer` | Performance counters, timer IDs |
| `useAnimatedCounter.ts` | `previousTarget`, `animationRef` | Previous value comparison, rAF ID |
| `WebVitalsTracker.tsx` | `isTracking`, `trackedMetrics` | Tracking state, dedup set |
| `useFocusTrap.ts` | `previousActiveElement` | Focus return target |
| `PreDream/SimulationScreen.tsx` | `animFrameRef`, `startTimeRef`, `completedRef` | Animation frame ID, timing, completion flag |
| `PreDream/ResultsScreen.tsx` | `trackedRef` | Analytics dedup flag |
| `useSectionLoading.ts` | `timeoutRefs` | Timer ID map for per-item timeouts |

**Evidence:** 35 files use `useRef`. Transient values (timer IDs, flags, counters, mutable references) are consistently stored in refs rather than state, avoiding unnecessary re-renders.

**Gaps:** None.

---

### 11.10 Distributed Rate Limiting

**Status: Compliant**

The rate limiter (`apps/web/src/lib/security/rateLimiter.ts`) implements distributed rate limiting with a graceful fallback:

1. **Primary:** Upstash Redis with sliding window algorithm via `@upstash/ratelimit`
2. **Fallback:** In-memory sliding window with probabilistic cleanup (1% chance per request)
3. **Configuration:** Three presets (`strict`, `standard`, `lenient`) loaded from environment
4. **Lazy initialization:** Redis client created on first use, not at import time

**Evidence:**
- `checkRateLimit()` (lines 91-115): Attempts Redis first, catches errors and falls through to in-memory
- In-memory store uses `Map<string, { count, resetAt }>` with expiry-based cleanup
- Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`) set on all rate-limited responses

**Gap:** The in-memory fallback is per-process, so multiple server instances would not share rate limit state. This is acceptable for the single-instance pre-launch deployment but must be addressed for production scale.

---

### 11.11 Waitlist Store Concurrency

**Status: Partial**

The waitlist store (`apps/web/src/lib/waitingList/store.ts`) uses an in-memory `Map` with file-based persistence:

**Strengths:**
- Node.js single-threaded execution model prevents true concurrent access to the in-memory `Map`
- `addEntry()` performs a `store.has(email)` check before insertion (line 234)
- File writes are synchronous (`fs.writeFileSync`), preventing partial write corruption
- PII fields are encrypted before persistence with `AES-256-GCM`
- Initialization guard (`isInitialized` flag) prevents double-loading

**Weaknesses:**
- **No optimistic locking / version fields.** The `WaitlistEntry` type has no `version` field. Updates use full-replace semantics without detecting concurrent modifications.
- **No distributed lock.** The check-then-insert in `addEntry()` relies on Node.js single-threading. Under clustered deployment (multiple workers), concurrent requests could create duplicate entries.
- **Synchronous file I/O.** `persistStore()` uses `writeFileSync` which blocks the event loop. Under high load, this would be a performance bottleneck.
- **No queue-based processing.** Writes go directly to the store without queueing.

**Mitigation:** These are acceptable for the pre-launch phase with low traffic. The in-memory `Map` is inherently thread-safe in single-process Node.js.

**Recommendation:** When migrating to a database:
- Add `version` field to `WaitlistEntry` for optimistic locking
- Use database UNIQUE constraints on `email` and `referralCode`
- Replace synchronous file I/O with database transactions
- Consider a write queue for high-load operations

---

### 11.12 Audit Tracker Items Verification

The CLAUDE.md audit tracker lists 8 race condition items (IDs 1-8) as "Done". Each is verified below.

#### Audit #1: CookieConsent setTimeout cleanup

**Status: Verified Done**

**File:** `apps/web/src/components/CookieConsent/CookieConsent.tsx`

**Evidence:** Lines 44-87 show:
- `mounted` flag (line 45) checked before every state update
- `timers` array (line 46) collects all `setTimeout` IDs
- Cleanup function (lines 83-86) sets `mounted = false` and clears all timers
- Nested timers (lines 61-68, 72-76) all push their IDs to the array

**Minor note:** The `closeBanner()` function (line 132) uses an uncleaned `setTimeout`. This is outside of `useEffect` (called from event handlers) and is low-risk, but was not part of the original audit finding.

#### Audit #2: CalEmbed script listener cleanup

**Status: Verified Done**

**File:** `apps/web/src/components/BookCall/CalEmbed.tsx`

**Evidence:** Lines 60, 91, 130, 136, 144-146 show:
- `AbortController` created at the top of the effect (line 60)
- `abortController.signal.aborted` checked after `await loadCalScript()` (line 91) and before `setIsLoaded()` (line 130)
- Cleanup aborts the controller (lines 144-146)
- Error handler also checks abort status (line 136)

#### Audit #3: ErrorReportingService bound handler cleanup

**Status: Verified Done**

**File:** `apps/web/src/lib/errors/ErrorReportingService.ts`

**Evidence:**
- Bound handlers stored as class properties (lines 58-60)
- Only `boundHandleResourceError` is registered directly (line 79) -- global error/rejection handlers are registered by MonitoringService (single coordinator pattern, documented in comment lines 75-77)
- `destroy()` method (lines 443-451) removes the resource error listener, clears data structures, resets initialization flag

#### Audit #4: MonitoringService bound handler cleanup

**Status: Verified Done**

**File:** `apps/web/src/lib/monitoring/service.ts`

**Evidence:**
- Three bound handlers stored as properties (lines 23-54): `boundHandleError`, `boundHandleRejection`, `boundHandleCspViolation`
- Registered in `initializeGlobalHandlers()` (lines 184-189)
- `destroy()` (lines 292-305) removes all three via `removeEventListener`, clears flush timer, performs final flush

#### Audit #5: ThemeManager bound handler cleanup

**Status: Verified Done**

**File:** `apps/web/src/lib/theme/theme-manager.ts`

**Evidence:**
- `boundHandleSystemPreferenceChange` stored as property (line 71)
- Added to three `MediaQueryList` objects in `setupMediaQueryListeners()` (lines 129-145)
- `destroy()` (lines 405-417) iterates all `mediaQueries` and removes the bound handler, clears listener set

#### Audit #6: web-vitals beforeunload cleanup

**Status: Verified Done**

**File:** `apps/web/src/lib/analytics/web-vitals.ts`

**Evidence:**
- `beforeUnloadHandler` variable declared (line 18)
- Handler assigned after `import('web-vitals')` resolves (lines 58-62)
- Listener added with `window.addEventListener('beforeunload', beforeUnloadHandler)` (line 63)
- Cleanup function returned (lines 70-74) that removes the listener if it was set
- The cleanup return handles the async timing correctly -- if the dynamic import hasn't resolved yet, `beforeUnloadHandler` is `null` and the cleanup is a no-op

#### Audit #7: ShareModal isRendering race condition

**Status: Verified Done**

**File:** `apps/web/src/components/Share/ShareModal.tsx`

**Evidence:**
- `isRenderingRef` (line 72) used as a ref (not state) for the rendering guard
- Check at line 100: `!isRenderingRef.current` prevents duplicate render calls
- Set to `true` at line 101 before async operation
- Reset in `.finally()` at lines 121-123, ensuring the flag is always cleared regardless of success/failure
- `isRendering` state (line 73) kept separately for UI display purposes only

#### Audit #8: PostHogProvider isInitialized race condition

**Status: Verified Done**

**File:** `apps/web/src/components/Providers/PostHogProvider.tsx`

**Evidence:**
- `isInitializedRef` (line 23) is a ref, not state
- Checked at line 32 before initialization: `isInitializedRef.current` prevents double-init
- Set to `true` at line 55 after successful initialization
- `posthogRef` (line 24) stores the PostHog instance as a ref
- Consent change handler (lines 64-69) checks `isInitializedRef.current` before calling `opt_out_capturing()`
- Event listener cleanup in return function (lines 74-76)

---

## Summary

### Compliance Matrix

| Sub-Requirement | Status | Risk |
|----------------|--------|------|
| 11.1 Race Condition Prevention Utilities | **Compliant** | None |
| 11.2 useEffect Timer Cleanup | **Compliant** (3 minor exceptions) | Low |
| 11.3 useEffect Async Cleanup | **Compliant** | None |
| 11.4 useEffect Event Listener Cleanup | **Compliant** | None |
| 11.5 Service Class Bound Handler Cleanup | **Compliant** | None |
| 11.6 MutexLock / StateMachine Usage | **Compliant** | None |
| 11.7 Idempotency in API Routes | **Partial** | Medium (post-launch) |
| 11.8 AbortController Usage | **Compliant** | None |
| 11.9 Refs for Transient Values | **Compliant** | None |
| 11.10 Distributed Rate Limiting | **Compliant** | Low |
| 11.11 Waitlist Store Concurrency | **Partial** | Low (pre-launch), High (production) |
| 11.12 Audit Tracker Items (8/8) | **Verified Done** | None |

### Overall Assessment

**Status: Compliant for pre-launch phase, with identified gaps for production.**

The codebase demonstrates strong race condition prevention practices on the client side. The race condition utility library (`SafeTimer`, `MutexLock`, `StateMachine`, `CleanupManager`) is well-designed and actively used. All 8 audit tracker items have been verified as resolved. Timer cleanup, async cancellation, event listener removal, and ref usage are consistently applied across 50+ components and hooks.

The two "Partial" findings (idempotency keys and store concurrency) are expected limitations of the pre-launch architecture that uses an in-memory store rather than a database. These must be addressed before production launch.

---

## Action Items

### Pre-Launch (Current Phase)

| Priority | Item | Files | Effort |
|----------|------|-------|--------|
| Low | Clean up `setTimeout` in `DreamMode/SimulationScreen.tsx` and `PreDream/SimulationScreen.tsx` -- store timer ID in ref, clear in useEffect cleanup | `apps/web/src/components/DreamMode/screens/SimulationScreen.tsx`, `apps/web/src/components/PreDream/screens/SimulationScreen.tsx` | Small |
| Low | Clean up `setTimeout` in `MobileNav.tsx` -- add cleanup return to the `useEffect` that calls `setTimeout` for scroll-to-top | `apps/web/src/components/Layout/Navigation/MobileNav.tsx` | Small |
| Low | Consider tracking the 2-second `setTimeout` in `ShareModal.tsx` `handleShare` with a ref for strictness | `apps/web/src/components/Share/ShareModal.tsx` | Small |

### Post-Launch (Production Readiness)

| Priority | Item | Files | Effort |
|----------|------|-------|--------|
| High | Add `version` field to `WaitlistEntry` for optimistic locking when migrating to database | `apps/web/src/lib/waitingList/store.ts` | Medium |
| High | Implement database UNIQUE constraints on `email` and `referralCode` | Database schema | Medium |
| High | Replace synchronous file I/O (`writeFileSync`) with async database operations | `apps/web/src/lib/waitingList/store.ts` | Medium |
| Medium | Add `Idempotency-Key` header support to mutation API routes | `apps/web/src/app/api/waitlist/signup/route.ts` | Medium |
| Medium | Implement database transactions with proper isolation for check-then-insert patterns | Store layer | Medium |
| Medium | Consider queue-based processing for high-load write operations | New infrastructure | Large |
| Low | Extend `MutexLock` usage to future transaction/payment flows | Future components | Small per component |
