# Principle 10: Product KPIs & Analytics - Audit Report

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Full codebase audit against Principle 10 requirements from `docs/coding-standards.md`

---

## Principle Requirements (from docs/coding-standards.md)

- Track all meaningful user interactions
- Enrich events with context (session, device, location)
- Multiple analytics providers
- Impression tracking with Intersection Observer
- Conversion funnel tracking

**Key Metrics:**
- User acquisition (signups, activations)
- Engagement (DAU, MAU, session duration)
- Transactions (volume, count, average size)
- Revenue (total, ARPU, LTV)
- Performance (latency, error rates, uptime)

---

## Findings

### 1. User Interaction Tracking

**Status: Compliant**

The platform tracks a comprehensive set of user interactions across all major features. Analytics tracking is implemented through two complementary systems:

1. **`analyticsService`** (`apps/web/src/lib/analytics/service.ts`) -- Client-side analytics service that batches events and forwards to GA4 / custom endpoint.
2. **`ApplicationEventBus`** (`apps/web/src/lib/events/ApplicationEventBus.ts`) -- Application-level event bus with audit trail, validation, and analytics bridging.

**Tracked interactions by feature:**

| Feature | Events Tracked | Evidence |
|---------|---------------|----------|
| **Waitlist signup** | Modal open/close, form submit, success, failure, validation errors | `apps/web/src/lib/waitingList/constants.ts` (14 event constants), `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts`, `apps/web/src/components/WaitingList/hooks/useWaitlistModalForm.ts` |
| **Referral** | Link copied, link shared (per platform: WhatsApp, Twitter, LinkedIn) | `apps/web/src/components/WaitingList/ReferralLink.tsx` |
| **Dream Mode** | Started, disclaimer accepted, path selected, amount set, timeframe changed, simulation started/completed, share, completed | `apps/web/src/lib/dream-mode/constants.ts` (13 event constants), `apps/web/src/components/DreamMode/DreamModeProvider.tsx` |
| **PreDemo** | Screen views, started, deposit/send/buy completed | `apps/web/src/components/PreDemo/PreDemoProvider.tsx`, `ApplicationEventBus` enum |
| **PreDream** | Started, share initiated/completed | `ApplicationEventBus` enum |
| **Calculator** | Input changed, timeframe changed, share result, CTA clicked | `apps/web/src/components/FutureYouCalculator/FutureYouCalculator.tsx` |
| **Share** | Card generated, share initiated/completed/failed/cancelled, link copied, image downloaded | `apps/web/src/components/Share/ShareModal.tsx`, `apps/web/src/lib/share/ShareManager.ts` |
| **Navigation** | Menu interactions (click, hover, open, close) | `apps/web/src/components/Layout/Navigation/Navigation.tsx` |
| **CTA clicks** | Hero CTA, section CTAs | `apps/web/src/components/Sections/HeroSection/HeroSectionFactory.tsx`, `apps/web/src/lib/patterns/useSectionAnalytics.ts` |
| **Consent** | Given, withdrawn, preferences updated | `ApplicationEventBus` enum |
| **Errors** | Application errors, navigation errors | `ApplicationEventBus`, `apps/web/src/components/ErrorBoundary/NavigationErrorBoundary.tsx` |

**Evidence:**
- Event constants are centralized in domain-specific constant files (e.g., `WAITING_LIST_EVENTS`, `DREAM_MODE_EVENTS`, `CALCULATOR_EVENTS`, `SHARE_EVENTS`)
- Comprehensive analytics integration guide exists at `docs/analytics-integration.md`
- 49 files reference `trackEvent`, `trackPageView`, or `track(` patterns

**Gaps:**
- None for pre-launch scope. All meaningful user interactions on the marketing/onboarding site are tracked.

---

### 2. Event Context Enrichment

**Status: Partial**

Events are enriched with context at multiple layers, but not all layers include the full recommended set (session, device, location).

**Context enrichment by layer:**

| Layer | Session | Device | Location | Timestamp | Locale |
|-------|---------|--------|----------|-----------|--------|
| `analyticsService.track()` | Yes (auto-attached via `sessionId`) | No | No | Yes | Via parameters |
| `analyticsService.trackPageView()` | Yes | No | No (has referrer) | Yes | Yes |
| `useSectionAnalytics` | Yes (`getSessionId()`) | Yes (`navigator.userAgent`, viewport) | No | Yes | No |
| `ApplicationEventBus` | No (uses `source` field) | No | No | Yes | Via payload |
| `ConversionEvent` | Yes | Yes (`userAgent`) | No | Yes | Yes |
| `WebVitalsTracker` | No | Yes (`userAgent`, `connectionType`) | No | Yes | Yes (URL) |

**Evidence:**
- `apps/web/src/lib/analytics/service.ts` lines 30-35: Auto-attaches `userId` and `sessionId` to all events.
- `apps/web/src/lib/analytics/service.ts` lines 172-177: Session ID generated as `session_${Date.now()}_${Math.random()}`.
- `apps/web/src/lib/patterns/useSectionAnalytics.ts` lines 50-59: Enriches with `timestamp`, `section`, `sessionId`, `userAgent`, and `viewport` dimensions.
- `apps/web/src/lib/analytics/conversion-tracking.ts` lines 14-24: `ConversionEvent` includes `userAgent`, `referrer`, `locale`, `sessionId`.

**Gaps:**
- **Device info** is not consistently attached at the core `analyticsService.track()` level. Only `useSectionAnalytics` and `ConversionEvent` include `userAgent`.
- **Location/geography** is never explicitly attached to events. However, GA4 and PostHog both auto-detect geography from IP, which partially mitigates this.
- **Session ID** in the core analytics service is generated per-service-instantiation (effectively per page load), not persisted across navigation. PostHog handles cross-navigation session tracking separately.

**Recommendation:**
- Enrich the core `analyticsService.track()` method with `userAgent` and `viewport` dimensions at the service level, so all events automatically receive device context.
- Consider adding a `screen_resolution` or `device_type` (mobile/desktop/tablet) field for segmentation.

---

### 3. Multiple Analytics Providers

**Status: Compliant**

The platform integrates three distinct analytics providers plus a custom endpoint option:

| Provider | Status | Purpose | Evidence |
|----------|--------|---------|----------|
| **Google Analytics 4** | Active | Page views, custom events, consent mode | `apps/web/src/app/layout.tsx` lines 79-128: GA4 with consent mode v2, `afterInteractive` loading strategy |
| **PostHog** | Active | Product analytics, page views, page leave, session replay | `apps/web/src/components/Providers/PostHogProvider.tsx`: Lazy-loaded behind consent, `capture_pageview: true`, `capture_pageleave: true`, `respect_dnt: true` |
| **Sentry** | Active | Error tracking, performance monitoring, session replay | `apps/web/sentry.client.config.ts`: 10% trace sample rate in production, 10% session replay, 100% replay on errors |
| **Custom endpoint** | Configured | Batch event forwarding | `apps/web/src/lib/analytics/service.ts` lines 136-144: `NEXT_PUBLIC_ANALYTICS_ENDPOINT` support |

**Evidence:**
- GA4 consent mode is GDPR-compliant: defaults to `denied`, updates on user consent via `cookie-consent-changed` event.
- PostHog is lazy-loaded via dynamic `import('posthog-js')` after consent check, as required by CLAUDE.md.
- Sentry is configured with PII stripping in production (`beforeSend` filter removes email, username, IP).
- The `analyticsService` (core service) flushes events to GA4 via `window.gtag` and optionally to a custom endpoint.
- The `AnalyticsResilientService` (`apps/web/src/lib/analytics/error-resilient-service.ts`) provides retry with exponential backoff for GA4 events.

**Gaps:**
- PostHog is initialized as a separate provider but the core `analyticsService.track()` does not forward events to PostHog -- PostHog only captures its own auto-tracked events (page views, page leaves). Custom events sent via `analyticsService.track()` only reach GA4 and the custom endpoint, not PostHog.

**Recommendation:**
- Add PostHog event forwarding in the `analyticsService.flush()` method or in the `ApplicationEventBus.trackAnalytics()` bridge, so key conversion events also reach PostHog for funnel analysis. This would create a true unified tracking layer.

---

### 4. Intersection Observer / Impression Tracking

**Status: Compliant**

Impression tracking is implemented via IntersectionObserver at multiple levels:

**Implementation 1: ScrollDepthTracker (Section Visibility)**
- File: `apps/web/src/lib/analytics/useScrollDepthTracking.ts`
- Component wrapper: `apps/web/src/components/Layout/ScrollDepthTracker.tsx`
- Used in: `apps/web/src/app/[locale]/(landing)/layout.tsx` line 62
- Behavior: Observes all elements matching `[data-section-id], section[id]` with 30% threshold. Fires `section_viewed` event with `section`, `timestamp`, and `scroll_depth` percentage. Fires once per section per session (`fireOnce: true`).

**Implementation 2: Section data-section-id Attributes**
- All 11 sections on the B2C landing page have `data-section-id` attributes: `hero-section-b2c`, `origin-story-section-b2c`, `how-it-works-section-b2c`, `scenarios-section-b2c`, `features-section-b2c`, `fees-section-b2c`, `catch-section-b2c`, `demo-section-b2c`, `social-proof-section-b2c`, `waitlist-section-b2c`, `faq-section-b2c`.
- Evidence: `apps/web/src/app/[locale]/(landing)/page.tsx` lines 156-317.

**Implementation 3: Generic useIntersectionObserver Hook**
- File: `apps/web/src/lib/hooks/useIntersectionObserver.ts`
- Provides `useIntersectionObserver` (single element) and `useMultipleIntersectionObserver` (multiple elements) for component-level visibility tracking.

**Evidence:**
- Scroll depth tracking fires a `section_viewed` event with calculated scroll depth percentage.
- The cleanup function properly calls `observer.disconnect()` and clears timeouts.

**Gaps:**
- ScrollDepthTracker is only included in the `(landing)` layout. The `(marketing)` route group does not have scroll depth tracking.

**Recommendation:**
- Add `ScrollDepthTracker` to the `(marketing)` layout as well, or move it to a shared layout component.

---

### 5. Conversion Funnel Tracking

**Status: Partial**

**Funnel Service Implementation:**
A full-featured `ConversionTrackingServiceImpl` exists at `apps/web/src/lib/analytics/conversion-tracking.ts` with:
- Three predefined funnels: `navigation-engagement`, `page-exploration`, `conversion-intent`
- Funnel step matching with string and RegExp patterns
- Session-based progress tracking with localStorage persistence (24-hour TTL)
- Conversion rate calculation API
- GA4 event forwarding for conversion events

**However, the service is not wired into the application.** The `conversionTracker` singleton is exported on line 439 but is never imported by any other file. The conversion tracking service is effectively dead code.

**What IS tracked (ad-hoc funnel via discrete events):**

| Waitlist Signup Funnel Step | Event Name | Tracked? |
|----------------------------|------------|----------|
| Page view | `page_view` | Yes (via `analyticsService.trackPageView()`) |
| Modal opened | `waiting_list_modal_opened` | Yes |
| Form submitted | `waiting_list_form_submitted` | Yes |
| Submission success | `waiting_list_submission_success` | Yes |
| Submission failure | `waiting_list_submission_failure` | Yes |
| Referral link copied | `waitlist_referral_link_copied` | Yes |
| Referral link shared | `waitlist_referral_link_shared` | Yes |

| Dream Mode Funnel Step | Event Name | Tracked? |
|------------------------|------------|----------|
| Started | `dream_mode_started` | Yes |
| Disclaimer accepted | `dream_disclaimer_accepted` | Yes |
| Path selected | `dream_path_selected` | Yes |
| Simulation started | `dream_mode_simulation_started` | Yes |
| Completed (reached share screen) | `dream_mode_completed` | Yes |

| Demo Funnel Step | Event Name | Tracked? |
|-----------------|------------|----------|
| Screen view | `pre_demo_screen_view` | Yes |
| Started (login to home) | `preDemo:started` (via EventBus) | Yes |
| Deposit completed | `preDemo:depositCompleted` | Yes |
| Send completed | `preDemo:sendCompleted` | Yes |
| Buy completed | `preDemo:buyCompleted` | Yes |

**Evidence:**
- Individual funnel steps are tracked as discrete analytics events, which allows funnel reconstruction in GA4 or PostHog.
- The `ConversionTrackingServiceImpl` is well-designed but unused.

**Gaps:**
- The `conversionTracker` is never imported or used anywhere in the application code. The three predefined funnels (`navigation-engagement`, `page-exploration`, `conversion-intent`) are effectively dead code.
- There is no explicit "form open" event separate from "modal opened" for waitlist -- the modal open IS the form open in this case, which is acceptable.
- Funnel analysis depends entirely on external tools (GA4 Funnel Exploration, PostHog Funnels) rather than a built-in funnel progression system.

**Recommendation:**
- Either integrate the `conversionTracker` service into the application (e.g., via the `ApplicationEventBus` or `analyticsService`), or remove it as dead code if external funnel tools (GA4, PostHog) are deemed sufficient.
- The ad-hoc event approach works well for pre-launch -- all funnel steps can be reconstructed in GA4/PostHog. However, the built-in service would add client-side funnel awareness (e.g., for triggering nudges when users stall in a funnel).

---

### 6. Pre-launch KPI Coverage

**Status: Partial**

Assessment of each required metric category for the pre-launch phase:

| Metric Category | Sub-metric | Implementation | Status |
|----------------|------------|----------------|--------|
| **User Acquisition** | Waitlist signups | `waiting_list_submission_success` event with position, referral data, locale | Compliant |
| **User Acquisition** | Referrals | `waitlist_referral_link_copied`, `waitlist_referral_link_shared` events with platform + referral code | Compliant |
| **User Acquisition** | Source attribution | `referrer` field in `trackPageView()`, GA4 UTM auto-tracking | Compliant |
| **Engagement** | Page views | `page_view` event via `analyticsService.trackPageView()` | Compliant |
| **Engagement** | Section views | `section_viewed` event via IntersectionObserver (scroll depth) | Compliant |
| **Engagement** | Session duration | PostHog `capture_pageleave: true` handles session duration; no custom implementation | Compliant (via PostHog) |
| **Engagement** | DAU / MAU | Derived from page view events in GA4/PostHog | Compliant (via GA4/PostHog) |
| **Engagement** | Scroll depth | Tracked per section with percentage calculation | Compliant |
| **Engagement** | Feature interactions | Dream Mode, calculator, demo, share events | Compliant |
| **Performance** | Core Web Vitals | `WebVitalsTracker` component tracking FCP, LCP, CLS, TTFB, INP | Compliant |
| **Performance** | Error rates | Sentry error tracking with 10% trace rate, 100% error replay | Compliant |
| **Performance** | Web Vitals to GA4 | `sendToGoogleAnalytics()` in `webVitalsUtils.ts` | Compliant |
| **Transactions** | Volume, count, avg size | N/A (pre-launch, no production transactions) | N/A |
| **Revenue** | Total, ARPU, LTV | N/A (pre-launch, no revenue) | N/A |

**Dashboard Configuration:**
A comprehensive dashboard configuration exists at `apps/web/src/config/dashboards.ts` with four predefined dashboards:
- **Business Metrics**: Active users, conversion rate, user acquisition, revenue, feature adoption, retention
- **Technical Performance**: Response time, error rate, throughput, Core Web Vitals, memory, bundle size
- **User Experience**: Page load time, bounce rate, session duration, user journey funnel, device breakdown, geographic distribution
- **Security Monitoring**: Security events, failed logins, CSP violations, suspicious activity, blocked requests

These dashboard definitions support Grafana, DataDog, and New Relic export formats, demonstrating forward-thinking monitoring architecture. However, these are configuration definitions only -- actual dashboard deployment depends on infrastructure setup.

**Evidence:**
- `apps/web/src/config/dashboards.ts`: 4 dashboards, 25+ widget definitions
- `apps/web/src/components/Performance/WebVitalsTracker.tsx`: Consent-gated, sample-rate controlled
- `apps/web/sentry.client.config.ts`: Production-ready error and performance monitoring

**Gaps:**
- No explicit **bounce rate** tracking in custom analytics (GA4 handles this natively).
- **Session duration** relies entirely on PostHog/GA4 auto-tracking with no custom implementation.
- Dashboard configs are definitions only; no evidence of actual deployment to Grafana/DataDog/New Relic.

---

### 7. Analytics Error Resilience

**Status: Compliant**

A dedicated `AnalyticsResilientService` exists at `apps/web/src/lib/analytics/error-resilient-service.ts` with:

- Exponential backoff retry (base 1s, max 10s, 2x multiplier, 1s jitter)
- Failed event queue with 100-event cap
- Online/offline detection with automatic retry on reconnect
- Connection monitoring via `online`/`offline` events
- Silent failure pattern -- analytics errors never break the user experience
- Health status API (`getHealthStatus()`)
- Production error forwarding to monitoring endpoint

**Evidence:**
- The Navigation component uses the error-resilient service: `apps/web/src/components/Layout/Navigation/Navigation.tsx` line 7.
- Section factories (HeroSection, FeatureShowcase, etc.) also use the error-resilient service for CTA tracking.

---

### 8. Privacy and Consent Compliance

**Status: Compliant**

Analytics tracking is GDPR-compliant across all providers:

| Aspect | Implementation | Evidence |
|--------|---------------|----------|
| GA4 consent mode | Default `denied`, update on consent | `apps/web/src/app/layout.tsx` lines 87-112 |
| PostHog consent gate | Only initializes after `hasAnalyticsConsent()` | `apps/web/src/components/Providers/PostHogProvider.tsx` line 32 |
| PostHog DNT | `respect_dnt: true` | `PostHogProvider.tsx` line 45 |
| Web Vitals consent | Only tracks after consent check | `apps/web/src/components/Performance/WebVitalsTracker.tsx` line 63 |
| Sentry PII stripping | Removes email, username, IP in production | `apps/web/sentry.client.config.ts` lines 48-52 |
| Consent change listener | All providers respond to `cookie-consent-changed` event | Layout, PostHogProvider, WebVitalsTracker |
| No PII in analytics | Event parameters never include email or personal data | Verified across all `track()` calls |

---

### 9. Documentation

**Status: Compliant**

Comprehensive analytics documentation exists:

| Document | Content | Path |
|----------|---------|------|
| Analytics Integration Guide | Event naming, all tracked events, event details, how to add events, dashboard locations, privacy | `docs/analytics-integration.md` |
| CLAUDE.md | Analytics lazy-loading rules, PostHog consent-gating rules | `CLAUDE.md` |
| Coding Standards | Principle 10 requirements | `docs/coding-standards.md` |

The analytics integration guide includes:
- Event naming conventions (`{feature}_{action}` in `snake_case`)
- Complete event catalog (Dream Mode: 12 events, Waitlist: 10 events, Share: 7 events, Calculator: 5 events, Navigation: 5 events)
- Code examples for adding new events
- Dashboard monitoring locations
- Privacy and consent documentation

---

## Summary

| Sub-requirement | Status | Notes |
|----------------|--------|-------|
| 1. User Interaction Tracking | **Compliant** | 40+ events across all features |
| 2. Event Context Enrichment | **Partial** | Session ID auto-attached; device/location inconsistent across layers |
| 3. Multiple Analytics Providers | **Compliant** | GA4, PostHog, Sentry, custom endpoint |
| 4. Impression Tracking (IntersectionObserver) | **Compliant** | ScrollDepthTracker with section_viewed events on landing pages |
| 5. Conversion Funnel Tracking | **Partial** | All funnel steps tracked as discrete events; dedicated ConversionTrackingService exists but is unused (dead code) |
| 6. Pre-launch KPI Coverage | **Partial** | User acquisition and engagement metrics fully covered; transactions/revenue N/A; dashboard configs are definitions only |
| 7. Analytics Error Resilience | **Compliant** | Retry, queueing, silent failure, health monitoring |
| 8. Privacy & Consent | **Compliant** | GDPR-compliant across all providers |
| 9. Documentation | **Compliant** | Comprehensive analytics integration guide |

**Overall Assessment: Partial (Strong)**

The analytics implementation is mature and well-architected for a pre-launch product. The dual-layer system (analyticsService + ApplicationEventBus) provides both client-side analytics and server-side audit trails. All meaningful user interactions are tracked with centralized event constants. The main gaps are the unused ConversionTrackingService, inconsistent device context enrichment, and the limitation of ScrollDepthTracker to the landing layout only.

---

## Action Items

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **High** | Wire `conversionTracker` into the application via ApplicationEventBus or analyticsService, OR remove as dead code | Medium | Enables client-side funnel awareness and nudging |
| **Medium** | Enrich core `analyticsService.track()` with `userAgent` and viewport dimensions at the service level | Low | Consistent device context on all events |
| **Medium** | Add ScrollDepthTracker to the `(marketing)` layout | Low | Scroll depth tracking on all pages, not just landing |
| **Medium** | Forward key custom events to PostHog (in addition to GA4) for unified funnel analysis | Medium | Single source of truth for product analytics |
| **Low** | Deploy dashboard configurations to actual monitoring platform (Grafana/DataDog/New Relic) | High | Operational monitoring readiness |
| **Low** | Add explicit `device_type` classification (mobile/desktop/tablet) to core event enrichment | Low | Easier segmentation in analytics |
| **Low** | Consider tracking explicit `form_field_focused` event for granular waitlist funnel analysis (form open vs. form interaction) | Low | More granular drop-off analysis |

---

## Key Files Referenced

| File | Purpose |
|------|---------|
| `apps/web/src/lib/analytics/service.ts` | Core analytics service (singleton, batching, GA4 forwarding) |
| `apps/web/src/lib/analytics/types.ts` | Analytics type definitions |
| `apps/web/src/lib/analytics/constants.ts` | Analytics configuration constants |
| `apps/web/src/lib/analytics/error-resilient-service.ts` | Error-resilient analytics with retry |
| `apps/web/src/lib/analytics/web-vitals.ts` | Web Vitals integration |
| `apps/web/src/lib/analytics/useScrollDepthTracking.ts` | Scroll depth tracking hook (IntersectionObserver) |
| `apps/web/src/lib/analytics/conversion-tracking.ts` | Conversion funnel service (UNUSED) |
| `apps/web/src/lib/events/ApplicationEventBus.ts` | Application event bus with analytics bridging |
| `apps/web/src/lib/events/SectionEventBus.ts` | Section-level event bus |
| `apps/web/src/lib/patterns/useSectionAnalytics.ts` | Section analytics hook with context enrichment |
| `apps/web/src/lib/patterns/sectionAnalyticsTypes.ts` | Section analytics type definitions |
| `apps/web/src/components/Providers/PostHogProvider.tsx` | PostHog integration (consent-gated) |
| `apps/web/src/components/Performance/WebVitalsTracker.tsx` | Web Vitals tracking component |
| `apps/web/src/components/Layout/ScrollDepthTracker.tsx` | Scroll depth tracker component |
| `apps/web/src/app/layout.tsx` | Root layout with GA4 and PostHog |
| `apps/web/sentry.client.config.ts` | Sentry client configuration |
| `apps/web/src/config/dashboards.ts` | Monitoring dashboard definitions |
| `apps/web/src/lib/waitingList/constants.ts` | Waitlist event constants |
| `apps/web/src/lib/dream-mode/constants.ts` | Dream Mode event constants |
| `apps/web/src/components/WaitingList/hooks/useWaitlistForm.ts` | Waitlist form analytics |
| `apps/web/src/components/DreamMode/DreamModeProvider.tsx` | Dream Mode analytics |
| `apps/web/src/components/FutureYouCalculator/FutureYouCalculator.tsx` | Calculator analytics |
| `apps/web/src/components/Share/ShareModal.tsx` | Share analytics |
| `apps/web/src/components/InteractiveDemo/hooks/useDemoAnalytics.ts` | Demo analytics |
| `docs/analytics-integration.md` | Analytics integration documentation |
