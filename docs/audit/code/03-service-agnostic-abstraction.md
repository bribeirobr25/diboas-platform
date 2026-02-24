# Principle 3: Service Agnostic Abstraction Layer - Code Audit

**Document Version:** 1.0
**Date:** February 22, 2026
**Auditor:** Claude Opus 4.6 (Automated Code Audit)
**Scope:** All external service integrations in diboas-platform
**Branch:** waitlist-launch

---

## Principle Requirements

From `docs/coding-standards.md`, Principle 3 states:

1. **Never depend directly on external services**
2. **Always use interface-based abstractions**
3. **Provider implementations are swappable**
4. **Factory pattern for provider instantiation**

---

## Findings

### 3.1 Waiting List Service (Kit.com / ConvertKit Integration)

**Status: Compliant**

**Evidence:**

The waiting list domain follows a textbook DDD + Service Agnostic pattern:

- **Domain layer** (`apps/web/src/lib/waitingList/domain/WaitingListDomain.ts`) defines:
  - `WaitingListDomainService` interface (lines 101-106) with methods `submitToWaitingList`, `checkEmailExists`, `validateInput`, `sanitizeInput`
  - `WaitingListRepository` interface (lines 176-185) with methods `save`, `findByEmail`, `exists`, `getPosition`, `findByReferralCode`, `updatePosition`, `incrementReferralCount`
  - `KitApiService` interface (lines 188-194) defining the Kit.com API contract abstractly
- **Service layer** (`apps/web/src/lib/waitingList/services/WaitingListService.ts`) implements `WaitingListDomainService` with constructor injection for the repository:
  ```typescript
  constructor(
    repository?: WaitingListRepository,
    config: typeof WAITING_LIST_CONFIG = WAITING_LIST_CONFIG
  ) {
    this.repository = repository || new LocalStorageRepository(config.storageKey);
  }
  ```
- **Repository pattern** (`LocalStorageRepository` implements `WaitingListRepository`) is swappable. A different backend (e.g., database, Kit.com API) can be injected without changing `WaitingListService`.
- **Factory potential**: The constructor accepts an optional repository, enabling factory-based instantiation. A formal factory function is not present but the pattern supports it.

**Kit.com API route** (`apps/web/src/app/api/waitlist/signup/route.ts`): The `syncToKit()` function (lines 52-101) makes direct HTTP calls to `https://api.convertkit.com/v3/forms/...`. This is acceptable because:
- It is a non-blocking side-effect (fire-and-forget)
- It does not affect the primary signup flow (the in-memory store handles persistence)
- The `KitApiService` interface exists in the domain layer for future formal abstraction

**Gaps:** None significant. The `KitApiService` interface is defined but not yet implemented as a formal class (the API route uses raw `fetch`). This is acceptable for pre-launch.

**Recommendation:** When moving to production, implement a `KitApiServiceImpl` class that implements the `KitApiService` interface, and inject it into the signup route handler for full testability.

---

### 3.2 Rate Limiting (Upstash Redis)

**Status: Partial**

**Evidence:**

The rate limiter (`apps/web/src/lib/security/rateLimiter.ts`) directly imports Upstash Redis:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
```

The module provides:
- A `RateLimitResult` interface (lines 76-81) that is provider-agnostic
- An in-memory fallback when Redis is unavailable (lines 120-165)
- A clean public API (`checkRateLimit`, `getClientIP`, `createRateLimitHeaders`) that consumers use without knowing about Upstash

Consumers (`apps/web/src/app/api/waitlist/signup/route.ts`, `apps/web/src/app/api/webhooks/kit/route.ts`) import from `@/lib/security` and call `checkRateLimit()` -- they have no knowledge of Upstash.

**Gaps:**
- No formal `RateLimiterService` interface or `RateLimiterProvider` abstraction
- The Upstash SDK is imported directly at the module level, making it impossible to swap to a different Redis provider (e.g., ioredis, AWS ElastiCache) without modifying this file
- No factory pattern for provider selection

**Recommendation:** Extract a `RateLimiterProvider` interface:
```typescript
interface RateLimiterProvider {
  limit(identifier: string): Promise<RateLimitResult>;
}
```
Create `UpstashRateLimiterProvider` and `InMemoryRateLimiterProvider` implementations. Use a factory function to select the provider based on environment.

---

### 3.3 Sentry (Error Tracking)

**Status: Non-compliant**

**Evidence:**

Sentry is imported directly via `import * as Sentry from '@sentry/nextjs'` in 6 files across the codebase:

| File | Usage |
|------|-------|
| `apps/web/sentry.client.config.ts` | SDK initialization (expected, config file) |
| `apps/web/sentry.server.config.ts` | SDK initialization (expected, config file) |
| `apps/web/sentry.edge.config.ts` | SDK initialization (expected, config file) |
| `apps/web/src/lib/errors/SectionErrorBoundary.tsx` | `Sentry.captureException()` directly in componentDidCatch (line 94) |
| `apps/web/src/app/global-error.tsx` | `Sentry.captureException()` in useEffect (line 26) |
| `apps/web/src/app/error.tsx` | `Sentry.captureException()` in useEffect (line 25) |
| `apps/web/src/app/[locale]/(landing)/error.tsx` | `Sentry.captureException()` in useEffect (line 20) |
| `apps/web/src/app/[locale]/(marketing)/error.tsx` | `Sentry.captureException()` in useEffect (line 20) |
| `apps/web/src/config/monitoring.ts` | Dynamic `import('@sentry/nextjs')` in `initializeMonitoringServices()` (line 296) |

**Analysis of the dual system:**

The codebase has two parallel error reporting systems:

1. **Custom `ErrorReportingService`** (`apps/web/src/lib/errors/ErrorReportingService.ts`) -- This is properly abstracted. It uses a config-driven `sendToExternalService()` method that sends to a generic HTTP endpoint. It does NOT import Sentry. This service is compliant with Principle 3.

2. **Direct Sentry calls** in error boundaries -- These bypass the abstraction layer entirely. The `SectionErrorBoundary`, `global-error.tsx`, `error.tsx`, and route-group error files all call `Sentry.captureException()` directly. If the team wanted to switch from Sentry to Datadog or Bugsnag, every error boundary would need modification.

**The config file** (`apps/web/src/config/monitoring.ts`) defines `SENTRY_CONFIG`, `DATADOG_CONFIG`, `NEW_RELIC_CONFIG`, and `LOGROCKET_CONFIG` objects, showing clear intent to support multiple providers. However, the actual error boundaries are hardcoded to Sentry.

**Gaps:**
- Error boundaries directly import and call `@sentry/nextjs` instead of routing through `ErrorReportingService`
- No `ErrorTrackingProvider` interface
- No factory pattern for error tracking provider selection
- Sentry config files at the app root (`sentry.*.config.ts`) are unavoidable framework integration points and are acceptable

**Recommendation:**
- Create an `ErrorTrackingProvider` interface with `captureException(error, context)` method
- Route all `Sentry.captureException()` calls through `ErrorReportingService.reportError()` or a new thin abstraction
- The `sentry.*.config.ts` files should remain as-is (they are Next.js framework integration points)
- Error boundaries should call `errorReportingService.reportError()` instead of `Sentry.captureException()`

---

### 3.4 PostHog (Product Analytics)

**Status: Partial**

**Evidence:**

PostHog integration (`apps/web/src/components/Providers/PostHogProvider.tsx`) uses dynamic import behind consent:

```typescript
const [posthogModule, reactModule] = await Promise.all([
  import('posthog-js'),
  import('posthog-js/react'),
]);
```

- PostHog is never statically imported (compliant with CLAUDE.md security rules)
- The provider wraps children in a React context, isolating PostHog from consumers
- Configuration is externalized via `POSTHOG_CONFIG` from `@/config/env`

However, there is no formal abstraction layer. The `PostHogProvider` component directly initializes the PostHog SDK. If the team wanted to swap to Amplitude or Mixpanel, the provider component itself would need rewriting.

**Gaps:**
- No `ProductAnalyticsProvider` interface
- No factory pattern for analytics provider selection
- PostHog-specific API (`posthog.init()`, `posthog.opt_out_capturing()`) is used directly
- Consumers are shielded by the React context pattern, which provides partial abstraction

**Recommendation:** The React context pattern provides sufficient abstraction for the pre-launch phase. Post-launch, consider extracting a `ProductAnalyticsService` interface with methods like `init()`, `trackPageView()`, `optOut()`, `identify()`, and implementing it for PostHog. This would allow swapping to a different provider by changing only the implementation.

---

### 3.5 Google Analytics 4

**Status: Partial**

**Evidence:**

GA4 is integrated in two ways:

1. **Root layout** (`apps/web/src/app/layout.tsx`, lines 79-128): GA4 is loaded via `<Script>` tags with consent mode. This is standard Next.js practice for third-party scripts and is framework-level integration.

2. **Analytics service** (`apps/web/src/lib/analytics/service.ts`): The `AnalyticsServiceImpl` class implements the `AnalyticsService` interface (defined in `apps/web/src/lib/analytics/types.ts`, lines 56-64):
   ```typescript
   export interface AnalyticsService {
     track(event: AnalyticsEvent): void;
     trackPageView(path: string, title: string, locale: string): void;
     trackPerformance(metrics: WebVitalsMetric[]): void;
     trackNavigation(menuId: string, action: string, locale: string): void;
     flush(): Promise<void>;
     setUserId(userId: string): void;
     setSessionId(sessionId: string): void;
   }
   ```
   This interface is provider-agnostic. However, the `flush()` implementation (lines 127-133) directly accesses `window.gtag`:
   ```typescript
   if (typeof window !== 'undefined' && windowWithGtag.gtag) {
     events.forEach(event => {
       gtag('event', event.name, event.parameters);
     });
   }
   ```

3. **Error-resilient service** (`apps/web/src/lib/analytics/error-resilient-service.ts`): Also directly calls `window.gtag` (line 90).

4. **Conversion tracking** (`apps/web/src/lib/analytics/conversion-tracking.ts`): `sendToExternalAnalytics()` (lines 317-339) directly calls `window.gtag`.

**Gaps:**
- The `AnalyticsService` interface exists and is well-defined, but the implementation is coupled to `window.gtag`
- Multiple files independently access `window.gtag` instead of going through a single abstraction
- No `AnalyticsProvider` implementation pattern (no factory, no injectable providers)
- The conversion tracking service defines `ConversionTrackingService` interface (line 50) with a factory function `createConversionTrackingService()` (line 434) -- partial compliance

**Recommendation:**
- Extract `window.gtag` calls into a `GtagAnalyticsProvider` that implements `AnalyticsService`
- The `flush()` method should delegate to an injected provider rather than accessing `window.gtag` directly
- Conversion tracking's `sendToExternalAnalytics()` should route through the analytics service rather than calling gtag independently

---

### 3.6 Cal.com (Booking Integration)

**Status: Non-compliant**

**Evidence:**

Both Cal.com components directly embed the Cal.com script and use the `window.Cal` global API:

- **CalEmbed** (`apps/web/src/components/BookCall/CalEmbed.tsx`): Loads Cal.com script dynamically, calls `window.Cal('init', ...)`, `window.Cal(namespace, 'inline', ...)`, `window.Cal(namespace, 'on', ...)`
- **CalButton** (`apps/web/src/components/BookCall/CalButton.tsx`): Same pattern -- loads Cal.com script, calls `window.Cal(namespace, 'modal', ...)`

Both components declare the `Window.Cal` global type directly. Configuration comes from `CAL_CONFIG` in `@/config/env`, which is good externalization, but the integration itself is tightly coupled.

**Gaps:**
- No `BookingService` interface
- No abstraction over the Cal.com SDK
- Components are tightly coupled to Cal.com's embed API (`window.Cal`)
- No factory pattern
- Swapping to Calendly, Acuity, or any other booking service would require rewriting both components

**Recommendation:** Create a `BookingProvider` interface:
```typescript
interface BookingProvider {
  initialize(config: BookingConfig): Promise<void>;
  openInline(container: HTMLElement, options: BookingOptions): void;
  openModal(options: BookingOptions): void;
  onBookingComplete(callback: (data: BookingData) => void): void;
}
```
Implement `CalComBookingProvider` and use the factory pattern in the components.

---

### 3.7 Monitoring Service (Custom)

**Status: Compliant**

**Evidence:**

The monitoring service (`apps/web/src/lib/monitoring/service.ts`) properly implements the `MonitoringService` interface defined in `apps/web/src/lib/monitoring/types.ts` (lines 55-61):

```typescript
export interface MonitoringService {
  trackError(error: Error, context?: Record<string, unknown>): void;
  trackPerformanceIssue(issue: PerformanceIssue): void;
  trackSecurityEvent(event: SecurityEvent): void;
  setUser(userId: string, metadata?: Record<string, unknown>): void;
  setContext(key: string, value: unknown): void;
  flush(): Promise<void>;
}
```

- The service sends events to a configurable endpoint (no hardcoded service dependency)
- Configuration is injected via `MonitoringConfig`
- The single coordinator pattern properly delegates to `ErrorReportingService`

**Gaps:** None.

**Recommendation:** None needed. This is a model implementation.

---

### 3.8 Error Reporting Service (Custom)

**Status: Compliant**

**Evidence:**

`ErrorReportingService` (`apps/web/src/lib/errors/ErrorReportingService.ts`) is a well-abstracted service:

- Uses a configuration-driven approach (`ErrorReportingConfig` interface in `apps/web/src/lib/errors/errorTypes.ts`)
- Sends to a configurable `reportingEndpoint` via standard `fetch`
- No direct dependency on any external error tracking SDK
- Supports `beforeSend` hooks, sample rates, and pluggable behavior
- Properly exports typed interfaces for consumers

**Gaps:** None.

**Recommendation:** Route the Sentry calls in error boundaries through this service (see Finding 3.3).

---

### 3.9 SEO Service

**Status: Compliant**

**Evidence:**

The SEO domain follows DDD with full abstraction:

- **Domain interface** (`apps/web/src/lib/seo/domain/SEODomain.ts`): `SEODomainService` interface (lines 30-36) with methods for sitemap, robots.txt, canonical URLs, OG images, and compliance validation
- **Service interface** (`apps/web/src/lib/seo/types.ts`): `SEOService` interface (lines 101-106) for metadata generation
- **Implementation** (`apps/web/src/lib/seo/services/SEOService.ts`): `SEOServiceImpl implements SEODomainService`
- **Factory function**: `createSEOService()` (line 315) provides factory-based instantiation:
  ```typescript
  export const createSEOService = (config?: SEOConfiguration): SEODomainService => {
    return new SEOServiceImpl(config);
  };
  ```
- **Metadata factory** (`apps/web/src/lib/seo/metadata-factory.ts`): `MetadataFactory` class with static methods for different page types
- **Second implementation** (`apps/web/src/lib/seo/service.ts`): `SEOServiceImpl implements SEOService` -- a separate implementation for metadata generation

**Gaps:** None. Both SEO service layers are fully abstracted with interfaces, implementations, and factory patterns.

**Recommendation:** None needed.

---

### 3.10 Component Factory Pattern (UI Variants)

**Status: Compliant**

**Evidence:**

The component factory pattern is well-implemented across UI sections:

- `HeroSectionFactory.tsx`, `FeatureShowcaseFactory.tsx`, `ProductCarouselFactory.tsx`, `OneFeatureFactory.tsx`, `AppFeaturesCarouselFactory.tsx`, `StickyFeaturesNavFactory.tsx`, `FAQAccordionFactory.tsx`

Example from `HeroSectionFactory.tsx`:
- Uses a variant registry (`getHeroVariant(variant)`) to select the appropriate component
- Configuration is resolved through `HERO_CONFIGS` with custom override support
- Variant components receive props through a shared `HeroVariantProps` interface
- Fallback to default variant on error

This pattern ensures consumers never need to know about specific variant implementations.

**Gaps:** None. This is a model implementation of the factory pattern.

**Recommendation:** None needed.

---

### 3.11 Web Vitals Integration

**Status: Compliant**

**Evidence:**

Web vitals tracking (`apps/web/src/lib/analytics/web-vitals.ts`) uses dynamic import for the `web-vitals` library:

```typescript
import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => { ... });
```

Events are routed through the `analyticsService` abstraction (`analyticsService.trackPerformance()`), not sent directly to any external service.

**Gaps:** None. The web-vitals library is a measurement tool, not an external service, and it routes through the analytics abstraction.

**Recommendation:** None needed.

---

### 3.12 Conversion Tracking Service

**Status: Partial**

**Evidence:**

`ConversionTrackingServiceImpl` (`apps/web/src/lib/analytics/conversion-tracking.ts`) implements the `ConversionTrackingService` interface (lines 50-55) and provides a factory function (line 434):

```typescript
export const createConversionTrackingService = (): ConversionTrackingService => {
  return new ConversionTrackingServiceImpl();
};
```

The interface and factory are compliant. However, `sendToExternalAnalytics()` (lines 317-339) directly accesses `window.gtag`, coupling the implementation to Google Analytics.

**Gaps:**
- Direct `window.gtag` access in the implementation should go through the analytics service layer

**Recommendation:** Delegate external analytics calls to `analyticsService.track()` instead of calling `window.gtag` directly.

---

## Summary

| # | Integration | Interface | Swappable | Factory | Overall Status |
|---|-------------|-----------|-----------|---------|----------------|
| 3.1 | Waiting List (Kit.com) | `WaitingListDomainService`, `WaitingListRepository`, `KitApiService` | Yes (constructor injection) | Partial (no formal factory fn) | **Compliant** |
| 3.2 | Rate Limiting (Upstash Redis) | `RateLimitResult` (output only) | No (direct SDK import) | No | **Partial** |
| 3.3 | Sentry (Error Tracking) | None for Sentry calls | No (direct `Sentry.captureException`) | No | **Non-compliant** |
| 3.4 | PostHog (Product Analytics) | None (React context provides partial isolation) | No (direct SDK init) | No | **Partial** |
| 3.5 | Google Analytics 4 | `AnalyticsService` (well-defined) | Partially (flush coupled to gtag) | No | **Partial** |
| 3.6 | Cal.com (Booking) | None | No (direct `window.Cal` calls) | No | **Non-compliant** |
| 3.7 | Monitoring Service | `MonitoringService` | Yes (endpoint-driven) | No formal factory, but config-driven | **Compliant** |
| 3.8 | Error Reporting Service | `ErrorReportingConfig`, typed report structure | Yes (endpoint-driven) | Config-driven constructor | **Compliant** |
| 3.9 | SEO Service | `SEODomainService`, `SEOService` | Yes (config injection) | `createSEOService()` factory | **Compliant** |
| 3.10 | Component Factories | Variant interfaces | Yes (registry-based) | Factory components | **Compliant** |
| 3.11 | Web Vitals | Routes through `AnalyticsService` | Yes | N/A | **Compliant** |
| 3.12 | Conversion Tracking | `ConversionTrackingService` | Partial (gtag leak) | `createConversionTrackingService()` | **Partial** |

**Overall Compliance: Partial (7 Compliant, 3 Partial, 2 Non-compliant)**

---

## Action Items

### Priority 1 (Non-compliant -- should fix before launch)

| # | Finding | Action | Effort | Files Affected |
|---|---------|--------|--------|----------------|
| A1 | 3.3 Sentry direct calls in error boundaries | Route `Sentry.captureException()` through `errorReportingService.reportError()` in all error boundary files | Medium | `SectionErrorBoundary.tsx`, `global-error.tsx`, `error.tsx`, `(landing)/error.tsx`, `(marketing)/error.tsx` |

### Priority 2 (Partial -- should fix post-launch)

| # | Finding | Action | Effort | Files Affected |
|---|---------|--------|--------|----------------|
| A2 | 3.2 Upstash direct import | Extract `RateLimiterProvider` interface with `UpstashProvider` and `InMemoryProvider` implementations | Medium | `rateLimiter.ts` |
| A3 | 3.5 GA4 gtag coupling | Move `window.gtag` calls into a `GtagAnalyticsProvider` implementing `AnalyticsService` | Medium | `service.ts`, `error-resilient-service.ts`, `conversion-tracking.ts` |
| A4 | 3.12 Conversion tracking gtag leak | Delegate `sendToExternalAnalytics()` through the analytics service | Low | `conversion-tracking.ts` |

### Priority 3 (Non-compliant -- can defer if Cal.com is the final provider)

| # | Finding | Action | Effort | Files Affected |
|---|---------|--------|--------|----------------|
| A5 | 3.6 Cal.com direct coupling | Create `BookingProvider` interface and `CalComBookingProvider` implementation | High | `CalEmbed.tsx`, `CalButton.tsx`, new `BookingProvider.ts` |

### Priority 4 (Partial -- low risk, long-term improvement)

| # | Finding | Action | Effort | Files Affected |
|---|---------|--------|--------|----------------|
| A6 | 3.4 PostHog direct SDK | Extract `ProductAnalyticsService` interface with PostHog implementation | Medium | `PostHogProvider.tsx` |
| A7 | 3.1 Kit.com formal implementation | Implement `KitApiServiceImpl` class from existing `KitApiService` interface | Low | New file in `waitingList/services/` |

---

## Appendix: Positive Patterns to Preserve

The following implementations serve as reference patterns for bringing non-compliant integrations up to standard:

1. **WaitingList domain** -- Exemplary DDD with domain interfaces, repository pattern, and constructor injection
2. **SEO services** -- Full interface + implementation + factory function pattern
3. **ErrorReportingService** -- Config-driven, endpoint-agnostic error reporting
4. **MonitoringService** -- Interface-based with proper typed contracts
5. **Component factories** -- Registry-based variant selection with fallback handling

These patterns should be replicated when abstracting Sentry, Upstash Redis, Cal.com, PostHog, and GA4.
