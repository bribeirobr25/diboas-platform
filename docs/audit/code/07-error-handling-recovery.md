# Principle 7: Error Handling & System Recovery — Code Audit

**Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Branch:** waitlist-launch
**Scope:** apps/web/src/, packages/

---

## Principle Requirements (from docs/coding-standards.md)

1. Never let the system crash
2. Implement retry logic with exponential backoff
3. Use circuit breakers for external services
4. Provide fallback strategies
5. Queue operations for later retry when both primary and fallback fail
6. Log all errors with correlation IDs
7. Return degraded responses when appropriate

**Key Strategies:**
- Try-catch for all async operations
- Retry transient failures (network, timeout, rate limit)
- Fallback to secondary providers
- Graceful degradation with user feedback

---

## Findings

### 7.1 Error Boundaries (3-Layer System)

**Status: Compliant**

The codebase implements a comprehensive multi-layer error boundary system that exceeds the documented 3-layer requirement:

| Layer | File | Error Level | Sentry Tag |
|-------|------|-------------|------------|
| Root (Layer 1) | `apps/web/src/app/global-error.tsx` | `fatal` | `errorBoundary: 'global'` |
| Route (Layer 2) | `apps/web/src/app/error.tsx` | `error` | `errorBoundary: 'route'` |
| Landing Group (Layer 3a) | `apps/web/src/app/[locale]/(landing)/error.tsx` | `error` | `errorBoundary: 'landing-route-group'` |
| Marketing Group (Layer 3b) | `apps/web/src/app/[locale]/(marketing)/error.tsx` | `error` | `errorBoundary: 'marketing-route-group'` |
| Section (Layer 4) | `apps/web/src/lib/errors/SectionErrorBoundary.tsx` | Dynamic | `errorBoundary: 'section'` |
| Page (Layer 5) | `apps/web/src/components/ErrorBoundary/PageErrorBoundary.tsx` | N/A | Tracks via `monitoringService` |

**Evidence:**
- All error boundaries report to Sentry with appropriate severity levels.
- The `global-error.tsx` correctly wraps content in `<html>` and `<body>` tags (required by Next.js for root error boundaries).
- All boundaries display user-friendly messages ("Something went wrong") with recovery actions ("Try again", "Go to homepage").
- Stack traces are only shown in development mode via `process.env.NODE_ENV === 'development'`.
- The `SectionErrorBoundary` is the most sophisticated, supporting automatic retry with exponential backoff, custom fallback components, translation support, and event bus integration.

**Gaps:** None.

---

### 7.2 Loading States

**Status: Compliant**

Loading states are present in both route groups as required:

| Route Group | File | Accessible |
|-------------|------|-----------|
| `(marketing)` | `apps/web/src/app/[locale]/(marketing)/loading.tsx` | Yes (`role="status"`, `aria-label="Loading page"`) |
| `(landing)` | `apps/web/src/app/[locale]/(landing)/loading.tsx` | Yes (`role="status"`, `aria-label="Loading page"`) |

**Evidence:**
- Both loading states render a centered CSS-animated spinner.
- Both are server components (no `'use client'` directive), which is correct for loading.tsx.
- Both include accessibility attributes (`role="status"`, `aria-label`).

**Gaps:** None.

---

### 7.3 Try-Catch Coverage for Async Operations

**Status: Partial**

#### 7.3.1 API Routes

All primary API route handlers are wrapped in try-catch blocks that return structured JSON error responses:

| Route | Methods | Try-Catch | Error Response |
|-------|---------|-----------|----------------|
| `/api/waitlist/signup` | POST | Yes | JSON with `errorCode` |
| `/api/waitlist/signup` | GET | **No** | N/A |
| `/api/waitlist/position` | GET, POST | Yes | JSON with `error` |
| `/api/waitlist/referral` | GET, POST | Yes | JSON with `error` |
| `/api/waitlist/delete` | POST, DELETE | Yes | JSON with `error` |
| `/api/waitlist/stats` | GET | Yes | Returns fallback data on error |
| `/api/consent` | GET, POST, DELETE | Yes | JSON with `error` |
| `/api/webhooks/kit` | POST | Yes | JSON with `error` |
| `/api/health` | GET, HEAD | **No** | N/A |
| `/api/og/share` | GET | **No** | N/A |
| `/api/og/[page]` | GET | **No** | N/A |
| `/api/og/dream` | GET | **No** | N/A |

**Evidence (compliant):**
- The `POST /api/waitlist/signup` handler wraps the entire logic in try-catch and returns `{ success: false, error: 'Internal server error', errorCode: 'SERVER_ERROR' }` with status 500.
- All mutation routes emit `APPLICATION_ERROR` events in their catch blocks for monitoring.

**Evidence (gaps):**
- `GET /api/waitlist/signup` (line 309): No try-catch. The `checkRateLimit` call is async and could throw. The `await new Promise(...)` for timing attack prevention could also be interrupted. Risk: low (simple operations), but violates the "try-catch for all async operations" rule.
- `GET /api/health` and `HEAD /api/health` (lines 34, 97): No try-catch. `checkRateLimit` is async, and `process.memoryUsage()` could theoretically fail in edge cases. Risk: medium (health checks should be maximally resilient).
- All three OG image routes (`/api/og/share`, `/api/og/[page]`, `/api/og/dream`): No try-catch. These use edge runtime and `ImageResponse`, which could fail on malformed inputs or rendering errors. Risk: low (read-only image generation with input sanitization).

#### 7.3.2 Hooks with Async Operations

| Hook | File | Try-Catch | Status |
|------|------|-----------|--------|
| `useWaitlistForm` | `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts` | Yes + AbortController + finally block | Compliant |
| `useWaitlistModalForm` | `apps/web/src/components/WaitingList/hooks/useWaitlistModalForm.ts` | Yes + finally block | Compliant |

**Evidence:**
- `useWaitlistForm` uses `fetchWithRetry` with `AbortController` for cancellation, properly cleans up in `finally`, and emits `APPLICATION_ERROR` events on failure.
- `useWaitlistModalForm` uses plain `fetch` (not `fetchWithRetry`) but wraps in try-catch with error state management. See Finding 7.4.

#### 7.3.3 Services

| Service | File | Try-Catch | Status |
|---------|------|-----------|--------|
| `ErrorReportingService` | `apps/web/src/lib/errors/ErrorReportingService.ts` | Yes (double-wrapped: inner try for reporting, outer catch for meta-errors) | Compliant |
| `MonitoringServiceImpl` | `apps/web/src/lib/monitoring/service.ts` | Yes (flush wrapped in try-catch) | Compliant |
| `Logger` | `apps/web/src/lib/monitoring/Logger.ts` | Yes (storage and remote logging both wrapped) | Compliant |
| `AnalyticsResilientService` | `apps/web/src/lib/analytics/error-resilient-service.ts` | Yes (comprehensive retry with backoff) | Compliant |
| `ThemeManager` | `apps/web/src/lib/theme/theme-manager.ts` | Yes (every method wrapped, with fallback defaults) | Compliant |

**Recommendation:**
- Add try-catch to `GET /api/waitlist/signup`, `GET /api/health`, `HEAD /api/health`, and the three OG image routes.

---

### 7.4 Retry Logic (fetchWithRetry)

**Status: Partial**

#### 7.4.1 Implementation Quality

**File:** `apps/web/src/lib/utils/fetchWithRetry.ts`

The implementation is well-designed:
- Configurable max retries (default: 2) with exponential backoff (1s, 3s).
- Only retries 5xx server errors (never 4xx client errors).
- Properly respects `AbortSignal` for cancellation.
- Network errors (fetch throws) are also retried.
- Delay function cleanly handles abort during wait.

**Evidence:**
```typescript
const MAX_RETRIES = 2;
const BACKOFF_MS = [1000, 3000];
function isRetryable(status: number): boolean {
  return status >= 500;
}
```

#### 7.4.2 Usage Coverage

| Component | Uses fetchWithRetry | Uses plain fetch | Status |
|-----------|-------------------|-----------------|--------|
| `useWaitlistForm` | Yes | No | Compliant |
| `useWaitlistModalForm` | **No** | Yes (line 104) | **Non-compliant** |
| `SocialProofSection` | **No** | Yes (lines 83, 128) | Partial (has fallback) |
| `consentUtils.ts` | **No** | Yes (lines 28, 55) | Partial (has error handling) |
| `syncToKit` (signup route) | **No** | Yes (line 71) | Partial (server-side, non-blocking) |
| `ErrorReportingService.sendToExternalService` | **No** | Yes | Acceptable (error reporting should not retry aggressively) |
| `MonitoringServiceImpl.sendToMonitoringService` | **No** | Yes | Acceptable (monitoring infra) |
| `Logger.logToRemote` | **No** | Yes | Acceptable (logging infra) |

**Gaps:**
- `useWaitlistModalForm` uses plain `fetch('/api/waitlist/signup')` instead of `fetchWithRetry`. This is the modal variant of the waitlist signup form -- the same user-facing operation that `useWaitlistForm` correctly wraps in `fetchWithRetry`. This inconsistency means modal users get no retry on transient failures.
- `SocialProofSection` fetches `/api/waitlist/stats` with plain `fetch`, but has adequate fallback behavior (keeps configured values on error). This is acceptable for a non-critical display component.
- `consentUtils.ts` makes consent API calls without retry. Consent failures return `false`, which is handled gracefully downstream, but a retry could improve reliability.

**Recommendation:**
- Replace plain `fetch` with `fetchWithRetry` in `useWaitlistModalForm` for parity with `useWaitlistForm`.
- Consider wrapping `consentUtils.ts` calls in `fetchWithRetry` for improved consent reliability.

---

### 7.5 Circuit Breakers

**Status: Non-compliant**

**Requirement:** "Use circuit breakers for external services"

**Evidence:**
- A search for `circuit.?breaker` and `CircuitBreaker` found references only in documentation files (`docs/coding-standards.md`, `docs/integrations.md`, `docs/backend.md`, etc.).
- No circuit breaker implementation exists in the codebase.
- External service calls (Kit.com API in `syncToKit`, Upstash Redis, Sentry, PostHog) are made without circuit breaker protection.

**Mitigating Factors:**
- The codebase is in pre-launch/waitlist phase with limited external service dependencies.
- The rate limiter has a Redis-to-memory fallback pattern that provides similar degradation behavior.
- Kit.com sync is non-blocking (`syncToKit` is fire-and-forget).
- Analytics services use retry queues with bounded sizes.

**Recommendation:**
- Implement a generic `CircuitBreaker` utility class in `apps/web/src/lib/utils/` for use with external services.
- Priority: Post-launch when more external service integrations are added (payment providers, banking APIs).
- For pre-launch, the current fallback patterns are adequate.

---

### 7.6 Fallback Strategies

**Status: Compliant**

The codebase demonstrates strong fallback patterns across multiple services:

| Service | Primary | Fallback | Evidence |
|---------|---------|----------|----------|
| Rate Limiter | Upstash Redis | In-memory Map | `apps/web/src/lib/security/rateLimiter.ts` lines 96-114: catches Redis errors and falls through to `checkInMemoryRateLimit` |
| Waitlist Stats API | Live store data | Environment variables, then `WAITLIST_STATS_FALLBACK` | `apps/web/src/app/api/waitlist/stats/route.ts` lines 57-108: 3-tier priority (env -> store -> fallback) |
| SocialProofSection | API fetch | sessionStorage cache, then configured fallback values | `apps/web/src/components/Sections/SocialProofSection/SocialProofSection.tsx` lines 60-106 |
| Analytics | gtag tracking | Silent failure + queue for retry | `apps/web/src/lib/analytics/error-resilient-service.ts` lines 124-146: queues failed events, retries when online |
| Theme Manager | Stored/system preferences | Default theme config (`light` mode) | `apps/web/src/lib/theme/theme-manager.ts` lines 90-124: try-catch with hardcoded fallback state |
| Content Service | Locale-specific content | Default locale (`en`) | `apps/web/src/lib/content/service.ts` lines 35-37 |
| Consent | HttpOnly cookie API | localStorage | `apps/web/src/components/CookieConsent/consentUtils.ts` |
| Error Reporting | Sentry + custom endpoint | Logger.warn (silent degradation) | `apps/web/src/lib/errors/ErrorReportingService.ts` lines 389-394 |
| Kit.com Sync | API call | Silent failure (non-blocking) | `apps/web/src/app/api/waitlist/signup/route.ts` lines 62-101 |

**Evidence (rate limiter fallback):**
```typescript
// rateLimiter.ts line 107-114
} catch (error) {
  Logger.error('[RateLimiter] Redis rate limit failed, using fallback:', { ... });
  // Fall through to in-memory
}
// In-memory fallback
return checkInMemoryRateLimit(identifier, limit, windowMs);
```

**Gaps:** None. The fallback strategy coverage is thorough for the current pre-launch scope.

---

### 7.7 Correlation IDs in Error Logging

**Status: Partial**

**Requirement:** "Log all errors with correlation IDs"

The coding standards (Principle 2) specify that events should include `correlationId` for tracing related operations across domains. The error handling system uses `errorId` extensively but does not implement cross-operation `correlationId`.

**What exists:**
- **errorId**: Generated per-error via `generateErrorId()` (format: `error-{timestamp}-{random}`). Used in `ErrorReportingService.reportError()`, `SectionErrorBoundary`, and `DefaultSectionErrorFallback`. Sent to Sentry as tags and displayed to users in development mode.
- **sessionId**: Generated per-session via `generateSessionId()`. Attached to all error reports in `ErrorReportingService`.
- **fingerprint**: Generated via `generateFingerprint()` for error deduplication.
- **Error ID in API responses**: Sentry digest shown only in development (`error.digest`).

**What is missing:**
- **correlationId**: No cross-operation correlation ID is generated or propagated. For example, a waitlist signup that triggers a Kit.com sync and an event bus emission has no shared identifier to correlate the three operations in logs.
- The `ApplicationEventPayload` interface (in `ApplicationEventBus.ts`) has `timestamp` and `source` but no `correlationId` field.
- API route error logging uses `Logger.error()` with contextual data but no correlation ID.

**Evidence:**
```typescript
// ApplicationEventBus.ts - No correlationId field
export interface ApplicationEventPayload {
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
}
```

**Recommendation:**
- Add `correlationId?: string` to `ApplicationEventPayload`.
- Generate a `correlationId` at the start of each API request (in middleware or route handler).
- Pass the `correlationId` through event emissions and Logger calls.
- Priority: Medium -- becomes critical when backend services are introduced post-launch.

---

### 7.8 Graceful Degradation & User-Friendly Error Messages

**Status: Compliant**

The codebase consistently returns user-friendly messages without exposing internal details:

#### API Routes
All API error responses use generic messages:
- `"Internal server error"` (500 responses)
- `"Too many requests. Please try again later."` (429 responses)
- `"Failed to process deletion request"` (generic operation failures)
- No stack traces, file paths, or internal identifiers are ever returned.

#### Error Boundaries
- `global-error.tsx`: "Something went wrong. We apologize for the inconvenience. Our team has been notified and is working to fix the issue."
- Route-level `error.tsx`: "We encountered an error loading this page. Please try again or return to the homepage."
- `DefaultSectionErrorFallback`: "We're sorry, but this section couldn't load properly. You can try reloading it below."
- Stack traces only visible via `<details>` in development mode.
- Error digest (`error.digest`) only shown in development mode.

#### Client-Side Hooks
- `useWaitlistForm`: Shows `t('error.network')` for network errors, `t('error.generic')` for server errors.
- `useWaitlistModalForm`: Shows `t('errors.submissionFailed')` for generic errors.

#### Health Endpoint Degradation
The `/api/health` endpoint returns `degraded` status when memory > 75% and `unhealthy` with 503 status when > 90%, enabling load balancers to route traffic away.

**Gaps:** None.

---

### 7.9 Queue Operations for Later Retry

**Status: Compliant**

Multiple services implement event/operation queuing for retry:

| Service | Queue | Max Size | Retry Mechanism |
|---------|-------|----------|-----------------|
| `AnalyticsResilientService` | `failedEvents[]` | 100 | `scheduleRetryFailedEvents()` with timeout; retries when online |
| `AnalyticsServiceImpl` | `eventQueue[]` | Batch size | Auto-flush timer; re-queues on flush failure |
| `MonitoringServiceImpl` | `errorQueue[]`, `performanceQueue[]`, `securityQueue[]` | `config.maxErrors` | Auto-flush interval with `startAutoFlush()` |

**Evidence (analytics queuing):**
```typescript
// error-resilient-service.ts lines 151-161
private queueFailedEvent(event: AnalyticsEvent): void {
  const MAX_QUEUE_SIZE = 100;
  if (this.failedEvents.length >= MAX_QUEUE_SIZE) {
    this.failedEvents.shift(); // Remove oldest
  }
  this.failedEvents.push(event);
}
```

The analytics service also monitors online/offline status and retries queued events when connectivity is restored:
```typescript
window.addEventListener('online', () => {
  this.isOnline = true;
  this.scheduleRetryFailedEvents();
});
```

**Gaps:** None for the current scope. Persistent queuing (surviving page reloads) is not implemented but is not necessary for a marketing/waitlist site.

---

### 7.10 Section Error Boundary: Automatic Recovery

**Status: Compliant**

The `SectionErrorBoundary` implements the most comprehensive error recovery pattern in the codebase:

- **Automatic retry**: `shouldAttemptRecovery()` determines if an error is retryable (network errors, TypeErrors) and `scheduleRetry()` uses exponential backoff via `calculateRetryDelay()` (base: 1000ms, formula: `base * 2^retryCount`).
- **Max retry count**: 3 attempts (`MAX_RETRY_COUNT`).
- **Manual retry**: Users can click "Try Again" which cancels any pending automatic retry and immediately resets.
- **Cleanup**: `componentWillUnmount()` clears the retry timeout.
- **HOC wrapper**: `withSectionErrorBoundary()` enables easy integration with any component.
- **Event emission**: Error events are emitted to `sectionEventBus` for cross-cutting monitoring.

**Evidence:**
```typescript
// errorUtils.ts
export function calculateRetryDelay(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount);
}
```

**Gaps:** None.

---

## Summary

| # | Sub-Requirement | Status | Severity |
|---|----------------|--------|----------|
| 7.1 | Error Boundaries (3-layer system) | **Compliant** | -- |
| 7.2 | Loading States | **Compliant** | -- |
| 7.3 | Try-catch coverage (async operations) | **Partial** | Low |
| 7.4 | Retry Logic (fetchWithRetry) | **Partial** | Medium |
| 7.5 | Circuit Breakers | **Non-compliant** | Low (pre-launch) |
| 7.6 | Fallback Strategies | **Compliant** | -- |
| 7.7 | Correlation IDs in Error Logging | **Partial** | Medium |
| 7.8 | Graceful Degradation | **Compliant** | -- |
| 7.9 | Queue Operations for Retry | **Compliant** | -- |
| 7.10 | Section Error Boundary Recovery | **Compliant** | -- |

**Overall Assessment: Partial Compliance (Strong)**

The error handling infrastructure is mature and well-architected for a pre-launch application. The 5-layer error boundary system, comprehensive fallback strategies, and queue-based retry mechanisms exceed typical pre-launch requirements. The main gaps are: (a) missing try-catch on a few API route handlers, (b) inconsistent use of `fetchWithRetry` in the modal form hook, (c) no circuit breaker implementation, and (d) no cross-operation correlation IDs. Items (a) and (b) should be addressed before launch; items (c) and (d) can be deferred to post-launch when more external integrations are added.

---

## Action Items

### Pre-Launch (High Priority)

| ID | Finding | Action | File(s) |
|----|---------|--------|---------|
| 7-A | Missing try-catch on `GET /api/waitlist/signup` | Wrap handler body in try-catch, return 500 JSON on error | `apps/web/src/app/api/waitlist/signup/route.ts` |
| 7-B | Missing try-catch on `GET /api/health` and `HEAD /api/health` | Wrap handler bodies in try-catch, return appropriate error status | `apps/web/src/app/api/health/route.ts` |
| 7-C | Missing try-catch on OG image routes | Wrap handler bodies in try-catch, return fallback image or 500 | `apps/web/src/app/api/og/share/route.tsx`, `apps/web/src/app/api/og/[page]/route.tsx`, `apps/web/src/app/api/og/dream/route.tsx` |
| 7-D | `useWaitlistModalForm` uses plain `fetch` instead of `fetchWithRetry` | Replace `fetch('/api/waitlist/signup', ...)` with `fetchWithRetry('/api/waitlist/signup', ...)` | `apps/web/src/components/WaitingList/hooks/useWaitlistModalForm.ts` |

### Post-Launch (Medium Priority)

| ID | Finding | Action | File(s) |
|----|---------|--------|---------|
| 7-E | No circuit breaker implementation | Create `CircuitBreaker` utility class with configurable thresholds, half-open state, and failure counting | `apps/web/src/lib/utils/circuitBreaker.ts` (new) |
| 7-F | No cross-operation correlation IDs | Add `correlationId` to `ApplicationEventPayload`, generate in middleware, propagate through Logger and event emissions | `apps/web/src/lib/events/ApplicationEventBus.ts`, `apps/web/src/middleware.ts` |
| 7-G | Consent API calls lack retry | Wrap `syncConsentToApi` and `checkConsentFromApi` with `fetchWithRetry` for improved reliability | `apps/web/src/components/CookieConsent/consentUtils.ts` |
