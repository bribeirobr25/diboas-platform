# Principle 12: Monitoring & Observability -- Code Audit

**Auditor:** Claude Opus 4.6
**Date:** 2026-02-22
**Scope:** Full codebase audit of `apps/web/` against Principle 12 requirements from `docs/coding-standards.md`
**Platform Phase:** Pre-launch / Waitlist

---

## Principle Requirements (from docs/coding-standards.md)

1. Distributed tracing (OpenTelemetry)
2. Structured logging with correlation IDs
3. Custom business metrics
4. Health checks for all services
5. Real-time alerting
6. Error tracking (Sentry)

**What to Monitor:**
- Transaction success rates
- API latencies (p50, p95, p99)
- Error rates by type
- Provider availability
- Database performance
- Queue depths

---

## Findings

### 12.1 Structured Logging

**Status: Partial**

**Evidence:**

The Logger implementation at `/apps/web/src/lib/monitoring/Logger.ts` provides a centralized, multi-destination logging system:

- **Five log levels:** `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL` (lines 13-18)
- **Structured log entries:** Each entry includes `timestamp`, `level`, `message`, `context`, `error`, `source`, and `sessionId` (lines 22-30)
- **Sensitive data redaction:** The `sanitizeContext()` method redacts fields matching `password`, `token`, `key`, `secret`, `auth`, `credential`, `email`, `ssn` (lines 229-241)
- **Multi-destination output:** Console, localStorage buffer, and remote endpoint (batched, non-blocking via `setTimeout`) (lines 100-136)
- **Circular reference safety:** `safeStringify()` uses `WeakSet` to prevent `JSON.stringify` failures on cyclic objects (lines 167-176)
- **Call source tracking:** `getCallSource()` extracts the caller from the stack trace for debugging (lines 247-264)
- **Session ID generation:** Auto-generated per Logger instance lifetime (line 58)
- **Configurable:** `LoggerConfig` allows runtime changes to level, destinations, max storage entries, and remote endpoint (lines 33-40)
- **Remote logging:** Only sends WARN and above in production, gated by `NEXT_PUBLIC_LOGGING_ENDPOINT` env var (lines 133-135)

**Gaps:**

1. **No correlation IDs / request IDs.** The `LogEntry` interface has `sessionId` but no `correlationId`, `requestId`, or `traceId`. There is no mechanism to correlate logs across a single request lifecycle or across services. A search for `correlationId`, `requestId`, and `x-request-id` across all `.ts`/`.tsx` files returned zero matches.
2. **No JSON-structured output format.** Console output uses `console.debug/info/warn/error` with template strings rather than structured JSON. In production server environments, JSON-formatted log lines are essential for log aggregation tools (Datadog, ELK, CloudWatch).
3. **Session ID is client-only.** The `sessionId` is generated with `Date.now()` + random string, which is fine for client-side correlation but does not carry over to server-side API route logs.
4. **Remote logging sends individual entries.** The `logToRemote()` method sends one log entry per HTTP request. There is no batching for remote logs (unlike the local buffer). This could cause excessive network requests under high-warn/error conditions.
5. **No log level filtering for remote endpoint.** All WARN+ logs go to remote regardless of configuration. There is no way to configure the remote threshold independently.

**Recommendation:**
- Add `correlationId` (and optionally `requestId`) to `LogEntry`. Generate correlation IDs in middleware and propagate via headers or context.
- Implement a `toJSON()` method or structured formatter for production server logs.
- Batch remote log entries before sending (similar to analytics flush pattern).

---

### 12.2 Error Tracking (Sentry)

**Status: Compliant**

**Evidence:**

Sentry is fully integrated across all three Next.js runtimes:

**Client (`/apps/web/sentry.client.config.ts`):**
- DSN from `NEXT_PUBLIC_SENTRY_DSN` env var (line 11)
- Environment tagging via `process.env.NODE_ENV` (line 18)
- Traces sample rate: 10% production, 100% development (line 22)
- Session Replay: 10% sessions, 100% on error (lines 26-28)
- `beforeSend` filter: Removes hydration errors, browser extension errors, and PII (email, username, IP) in production (lines 34-55)
- Replay integration with `maskAllText` and `blockAllMedia` for privacy (lines 59-63)

**Server (`/apps/web/sentry.server.config.ts`):**
- Same DSN and environment configuration (lines 13-18)
- Traces sample rate: 10% production, 100% development (line 21)
- `beforeSend` filter: Removes `NEXT_NOT_FOUND` errors (lines 28-35)

**Edge (`/apps/web/sentry.edge.config.ts`):**
- Minimal configuration with DSN, environment, and trace sampling (lines 13-23)

**Instrumentation (`/apps/web/src/instrumentation.ts`):**
- Registers Sentry for Node.js and Edge runtimes via `register()` function (lines 8-16)

**Build Integration (`/apps/web/next.config.js`, lines 347-378):**
- `withSentryConfig` wraps Next.js config when `NEXT_PUBLIC_SENTRY_DSN` is set
- Source map upload gated by `SENTRY_AUTH_TOKEN`
- Source maps hidden in production
- Tunnel route `/monitoring` to bypass ad-blockers
- Automatic Vercel monitors enabled
- Tree-shaking removes debug logging in production

**Supporting Services:**
- `ErrorReportingService` (`/apps/web/src/lib/errors/ErrorReportingService.ts`) provides additional error tracking with fingerprinting, occurrence counting, severity classification, breadcrumbs, and sample rate control.
- `MonitoringService` (`/apps/web/src/lib/monitoring/service.ts`) captures unhandled errors, unhandled rejections, and CSP violations via global event listeners, then delegates to ErrorReportingService.

**Gaps:**

1. **No explicit `release` tag in Sentry configs.** The client/server/edge configs do not set `release`. The `SENTRY_CONFIG` object in `monitoring.ts` includes `release: process.env.NEXT_PUBLIC_APP_VERSION` (line 194) but this config object is used only in the `initializeMonitoringServices()` helper, not in the actual Sentry config files. Sentry may auto-detect releases via the Webpack plugin, but explicit release tagging is best practice.
2. **Edge config has no `beforeSend`.** Unlike client and server configs, the edge config has no error filtering.

**Recommendation:**
- Add `release: process.env.NEXT_PUBLIC_APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA` to all three Sentry config files.
- Add a minimal `beforeSend` to the edge config for consistency.

---

### 12.3 Health Checks

**Status: Partial**

**Evidence:**

A health check endpoint exists at `/apps/web/src/app/api/health/route.ts`:

- **GET /api/health** returns structured `HealthStatus` JSON with: `status` (healthy/degraded/unhealthy), `timestamp`, `version`, `environment`, `uptime` (seconds), and `checks.memory` (used/total/percentage) (lines 15-29, 63-77)
- **HEAD /api/health** for simple uptime monitoring (lines 97-117)
- **Memory-based health classification:** healthy (<75%), degraded (75-90%), unhealthy (>90%) (lines 56-61)
- **HTTP status codes:** 200 for healthy/degraded, 503 for unhealthy (line 80)
- **Rate limiting:** Uses `RateLimitPresets.lenient` to prevent abuse while allowing frequent monitoring (lines 36-48)
- **Cache control:** `no-store, no-cache, must-revalidate` (line 85)

**Gaps:**

1. **No dependency checks.** The health endpoint only checks server availability and memory. It does not verify:
   - **Redis/Upstash connectivity** (used for rate limiting throughout the app)
   - **External service availability** (Kit.com API, Cal.com, email provider)
   - **DNS resolution** for critical external services
   - **Environment variable completeness** (are critical env vars set?)
2. **No readiness vs. liveness distinction.** Kubernetes-style deployments benefit from separate `/health/live` (is the process running?) and `/health/ready` (can it serve traffic?). The current endpoint conflates both.
3. **No disk usage or CPU metrics.** Memory is tracked but disk and CPU are not.
4. **Server start time is module-scoped.** The `serverStartTime` constant (line 32) resets on cold starts in serverless environments, so `uptime` may not be meaningful in all deployment contexts.

**Recommendation:**
- Add dependency health checks: Redis ping, external API reachability (with timeout).
- Consider separating liveness and readiness probes.
- Add a `checks` object per dependency (e.g., `checks.redis: { status: 'up', latencyMs: 12 }`).

---

### 12.4 Alerting

**Status: Partial**

**Evidence:**

The alerting system is well-architected across multiple files:

**AlertingService (`/apps/web/src/lib/monitoring/AlertingService.ts`):**
- Supports four severity levels: `INFO`, `WARNING`, `ERROR`, `CRITICAL` (via `AlertSeverity` enum in `alertTypes.ts`)
- Five alert categories: `PERFORMANCE`, `ERROR`, `SECURITY`, `BUSINESS`, `INFRASTRUCTURE` (via `AlertCategory` enum)
- Fingerprint-based deduplication with suppression windows (1-10 minutes depending on severity) (lines 91-95, `alertConfig.ts` lines 34-39)
- Specialized alert methods: `sendPerformanceAlert()`, `sendErrorAlert()`, `sendBusinessAlert()` (lines 145-222)
- Threshold-based performance alerting: checks render time, memory usage, page load time, error rate against configurable thresholds (lines 227-271)
- Alert resolution tracking with `resolveAlert()` and resolution notifications (lines 276-291)
- Alert statistics: total, active, resolved counts by severity and category (lines 303-318)
- Automatic cleanup of alerts older than 24 hours (lines 324-332, `alertConfig.ts` line 49)

**Alert Delivery (`/apps/web/src/lib/monitoring/alertDelivery.ts`):**
- **Slack integration:** Sends formatted messages with severity colors, emojis, action buttons, and metadata fields to configured webhook URL (lines 45-82)
- **Email integration:** Generates styled HTML email alerts sent via configured endpoint (lines 87-153)
- **Resolution notifications** to Slack with duration tracking (lines 158-185)
- Delivery to all channels uses `Promise.allSettled` for resilience (line 39)

**Configuration (`/apps/web/src/config/monitoring.ts`):**
- Slack channel configurable via `SLACK_WEBHOOK_URL` and `SLACK_CHANNEL` env vars (lines 170-175)
- Email recipients configurable via `ALERT_EMAIL_ENDPOINT` and `ALERT_EMAIL_RECIPIENTS` env vars (lines 176-181)
- Alerts enabled via `PERFORMANCE_BUDGET_ALERTS` env var (line 167)

**Alert Thresholds (`/apps/web/src/lib/monitoring/alertConfig.ts`):**
- Performance: render time (100ms warn / 300ms critical), memory (50MB / 100MB), error rate (1% / 5%), page load (2s / 4s)
- Business: conversion rate drop (-10% / -25%), user engagement drop (-15% / -30%), error-impacted users (10 / 50)
- Infrastructure: uptime (99.9% / 99.5%), response time (500ms / 1000ms), error count (10/min / 50/min)

**Integration Points:**
- `usePerformanceMonitor` hook triggers alerts for "poor" and "needs improvement" performance (lines 182-198 in `usePerformanceMonitor.ts`)
- `ErrorReportingService` sends error alerts for HIGH and CRITICAL severity errors (lines 268-282 in `ErrorReportingService.ts`)

**Gaps:**

1. **Alerts are client-side only.** The `AlertingService` is a singleton instantiated in the browser. Server-side API errors, rate limit breaches, and server performance issues are not alerted on.
2. **No PagerDuty/OpsGenie integration.** For critical production alerts, webhook-based delivery to incident management platforms is standard.
3. **Business alerts are defined but not actively invoked.** `sendBusinessAlert()` exists but there is no code that calls it based on actual metric thresholds. The conversion rate drop and engagement thresholds are defined but not monitored.
4. **Cleanup interval creates a memory leak risk.** The `setInterval` in `initialize()` (line 68) is never cleared. There is no `destroy()` method on AlertingService.

**Recommendation:**
- Add server-side alerting for API route errors and performance issues.
- Integrate with at least one incident management platform (PagerDuty, OpsGenie) for CRITICAL alerts.
- Wire up `sendBusinessAlert()` to actual metric tracking (e.g., when conversion rate drops detected by ConversionTrackingService).
- Add a `destroy()` method to AlertingService that clears the cleanup interval.

---

### 12.5 Performance Monitoring

**Status: Compliant**

**Evidence:**

Performance monitoring is comprehensive and multi-layered:

**Web Vitals Tracking (`/apps/web/src/lib/analytics/web-vitals.ts`):**
- Dynamically imports `web-vitals` library (SSR-safe) (line 21)
- Tracks all Core Web Vitals: CLS, FCP, LCP, TTFB, INP (lines 25-29)
- Batches metrics (sends every 3 collected) (lines 51-54)
- Sends remaining metrics on `beforeunload` with proper cleanup (lines 58-74)
- Rating evaluation against centralized thresholds from `performance-thresholds.ts` (lines 81-96)

**WebVitalsTracker Component (`/apps/web/src/components/Performance/WebVitalsTracker.tsx`):**
- GDPR-compliant: only tracks with analytics consent (lines 39-60)
- Configurable sample rate (line 33, default 1.0)
- Deduplicates metrics by ID (lines 78-82)
- Sends to Google Analytics and PerformanceService (lines 95-112)
- Tracks connection type for correlation (line 92)
- Error-resilient: individual metric failures don't break tracking (lines 114-116)

**PerformanceMonitor Service (`/apps/web/src/lib/monitoring/performance-monitor.ts`):**
- Singleton pattern with configurable thresholds (lines 59-80)
- Core Web Vitals observers: LCP, FID, FCP, CLS, TTFB via PerformanceObserver API (in `performanceObservers.ts`)
- Navigation timing: load time, render time, interactive time (lines 100-114 in observers)
- Resource timing: bundle sizes, section load times (lines 127-153 in observers)
- Custom metric recording API (line 248)
- Section render time tracking (line 257)
- Theme switch performance tracking (line 268)
- Batched metric flushing with configurable interval (30s default) and `keepalive` for page unload (lines 198-241)
- Proper cleanup with observer disconnection (lines 308-324)

**usePerformanceMonitor Hook (`/apps/web/src/lib/monitoring/performance/usePerformanceMonitor.ts`):**
- Component-level performance monitoring with real-time reporting (line 22)
- Memory usage monitoring via `performance.memory` API (lines 49-61)
- Custom metrics recording with `mark()` and `measure()` (lines 240-275)
- Performance severity analysis: good / needsImprovement / poor (lines 121-152)
- Auto-triggers alerts via AlertingService for poor performance (lines 182-198)
- Event bus integration for cross-component metrics (lines 169-176)

**Configurable Thresholds (`/apps/web/src/lib/monitoring/performanceConfig.ts`):**
- LCP: 2500ms good / 4000ms needs improvement
- FID: 100ms / 300ms
- CLS: 0.1 / 0.25
- FCP: 1800ms / 3000ms
- TTFB: 800ms / 1800ms
- Bundle size: 300KB target / 500KB max
- Render time: 16ms target / 100ms max

**Dashboard Configuration (`/apps/web/src/config/dashboards.ts`):**
- Pre-defined dashboard widgets including "Page Load Time (P95)" (line 345)
- Bounce rate, user engagement, and other UX metrics defined

**Gaps:**

1. **No server-side performance monitoring.** All performance monitoring is client-side (browser). Server-side API route response times are not measured or tracked.
2. **No p50/p95/p99 percentile calculation.** While the dashboard config references "P95" (line 345), there is no actual percentile aggregation logic. Individual metrics are sent but never aggregated into percentile distributions.
3. **`performance.memory` is Chrome-only.** The memory monitoring falls back gracefully but is not available on Firefox/Safari.

**Recommendation:**
- Add server-side timing middleware to measure and log API route latencies.
- Implement percentile aggregation (at minimum client-side or via the analytics backend).
- Document the Chrome-only limitation of memory monitoring.

---

### 12.6 Distributed Tracing

**Status: Non-compliant**

**Evidence:**

- **OpenTelemetry packages are present in the dependency tree** (`pnpm-lock.yaml` shows `@opentelemetry/api@1.9.0`, `@opentelemetry/core@2.2.0`, and numerous instrumentation packages), but these are transitive dependencies pulled in by `@sentry/nextjs`, not directly used by the application.
- **No OpenTelemetry imports** exist in any `.ts` or `.tsx` source file. A search for `opentelemetry` across all TypeScript source files returned zero matches.
- **No trace context propagation.** There are no `traceId`, `spanId`, `correlationId`, or `x-request-id` headers set or read in middleware, API routes, or service calls.
- **The `instrumentation.ts` file** (lines 1-16) only initializes Sentry for Node.js and Edge runtimes. There is no OpenTelemetry SDK initialization, no `NodeSDK`, no `traceExporter`, no `spanProcessor`.
- **Sentry's built-in tracing** (`tracesSampleRate: 0.1`) provides some automatic transaction/span creation for Next.js pages and API routes, but this is not the same as distributed tracing with correlation across services.

**Gaps:**

1. **No distributed tracing whatsoever.** The coding standards explicitly require "Distributed tracing (OpenTelemetry)" but there is no OpenTelemetry SDK setup, no trace context propagation, and no span creation.
2. **No request ID propagation.** API routes do not generate or forward request IDs that would allow correlating logs across middleware, API handlers, and external service calls.
3. **Sentry traces are sampling-based (10%)** and do not provide correlation IDs for the Logger or other monitoring services.

**Recommendation (Post-launch priority):**
- Initialize OpenTelemetry SDK in `instrumentation.ts` with appropriate exporter (Sentry, Jaeger, or OTLP).
- Generate `x-request-id` in middleware and propagate through API routes and Logger context.
- Add `traceId` and `spanId` fields to `LogEntry` interface.
- For the pre-launch phase, at minimum add request ID generation and propagation through middleware.

---

### 12.7 Custom Business Metrics

**Status: Partial**

**Evidence:**

**Conversion Funnel Tracking (`/apps/web/src/lib/analytics/conversion-tracking.ts`):**
- Full `ConversionTrackingService` with three predefined funnels: `navigation-engagement`, `page-exploration`, `conversion-intent` (lines 58-89)
- Funnel progress tracking per session with step completion, conversion rate calculation, and persistence to localStorage (lines 228-280, 346-420)
- Sends events to Google Analytics via `gtag()` (lines 317-339)
- Session cleanup for data older than 24 hours (lines 298-315)

**Application Event Bus (`/apps/web/src/lib/events/ApplicationEventBus.ts`):**
- Comprehensive event taxonomy: Waitlist signup/deletion/referral, Share, Dream Mode calculations, Consent, Webhook, PreDemo interactions (lines 16-64)
- Analytics integration: Maps 15+ event types to analytics event names (lines 382-398)
- Enriches events with extracted parameters (locale, referral, platform, etc.) (lines 416-476)
- Event history maintained for audit trail (max 500 entries) (lines 204-209, 365-374)
- Event validation schema ensures payload correctness (lines 162-195)

**Business Metrics Configuration (`/apps/web/src/config/business-metrics.ts`):**
- Defines platform stats, growth metrics, and compliance metrics (lines 16-37)
- Environment-variable-driven values for users, volume processed, countries, uptime, TPS, etc. (lines 61-178)
- These are marketing display values, not actively measured operational metrics.

**Dashboard Configuration (`/apps/web/src/config/dashboards.ts`):**
- Defines dashboard widgets for page load time (P95), bounce rate, and other UX metrics (lines 335+)
- Widget definitions exist but there is no evidence of a running dashboard service that renders them.

**Gaps:**

1. **No server-side business metric tracking.** Waitlist signup events are emitted from the API route (`signup/route.ts`) and client-side, but there is no aggregation of success rates, failure rates, or throughput metrics on the server.
2. **Business alert thresholds defined but never triggered.** `AlertingService.sendBusinessAlert()` exists with thresholds for conversion rate drops, user engagement drops, and error-impacted user counts, but no code invokes these alerts based on actual measured values.
3. **"What to Monitor" items are mostly unimplemented:**
   - Transaction success rates: Waitlist signup success/failure events are tracked but not aggregated into success rate metrics.
   - API latencies (p50, p95, p99): Not measured or tracked.
   - Error rates by type: `ErrorReportingService.getErrorStats()` provides counts by category/severity but these are in-memory and not exported to any monitoring system.
   - Provider availability: Not monitored (Kit.com, email provider, etc.).
   - Database performance: N/A (no database in current architecture; Upstash Redis is used but not monitored).
   - Queue depths: N/A (no queue system in current architecture).
4. **Dashboard configs are declarative only.** The dashboard definitions in `dashboards.ts` describe widgets but there is no rendering layer or data pipeline backing them.

**Recommendation:**
- Add server-side metric aggregation for waitlist signup success/failure rates.
- Wire `sendBusinessAlert()` to real-time metric tracking (e.g., if conversion rate drops below threshold in a rolling window).
- For post-launch: implement the dashboard rendering layer or integrate with an external dashboard service (Grafana, Datadog).

---

### 12.8 Real-time Alerting vs. Batch

**Status: Partial**

**Evidence:**

**Real-time alerting is implemented for:**
- **Critical errors:** `ErrorReportingService` immediately calls `alertingService.sendErrorAlert()` for HIGH and CRITICAL severity errors (line 278 in `ErrorReportingService.ts`). `MonitoringService` flushes immediately on critical errors (line 98 in `service.ts`).
- **Performance threshold breaches:** `usePerformanceMonitor` triggers alerts immediately when component performance is classified as "poor" or "needsImprovement" (lines 182-198 in `usePerformanceMonitor.ts`).
- **Security events:** `MonitoringService` flushes immediately on high/critical security events (lines 129-132 in `service.ts`).

**Batch processing is implemented for:**
- **Analytics events:** `analyticsService` batches events (batch size: 10, flush interval: 30s) (lines 45-47, 187-189 in analytics `service.ts`).
- **Monitoring events:** `MonitoringService` batches errors, performance issues, and security events with 60s flush interval (line 19 in `constants.ts`).
- **Performance metrics:** `PerformanceMonitor` buffers metrics (buffer size: 10, flush interval: 30s) with `keepalive` for page unload (lines 187-241 in `performance-monitor.ts`).
- **Logger remote logging:** Individual WARN+ logs sent immediately via `setTimeout` (non-blocking but not batched) (lines 206-223 in `Logger.ts`).

**Alert suppression** prevents alert storms:
- Fingerprint-based deduplication (lines 91-95 in `AlertingService.ts`)
- Severity-dependent suppression windows: INFO=10min, WARNING=5min, ERROR=2min, CRITICAL=1min (lines 34-39 in `alertConfig.ts`)

**Gaps:**

1. **All real-time alerting is client-side.** Server-side events (API route errors, rate limit breaches) are only logged, not alerted on in real-time.
2. **No WebSocket or SSE-based alerting.** Alerts are delivered via HTTP POST to Slack/email. There is no real-time push mechanism for an internal monitoring dashboard.
3. **Logger remote logging is not batched.** Each WARN+ log triggers an individual HTTP request, which could be problematic under high error conditions.

**Recommendation:**
- Implement server-side real-time alerting for API route errors.
- Batch Logger remote logging (similar to analytics flush pattern).

---

## Summary

| # | Sub-requirement | Status | Key File(s) |
|---|----------------|--------|-------------|
| 12.1 | Structured Logging | **Partial** | `lib/monitoring/Logger.ts` |
| 12.2 | Error Tracking (Sentry) | **Compliant** | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `instrumentation.ts` |
| 12.3 | Health Checks | **Partial** | `app/api/health/route.ts` |
| 12.4 | Alerting | **Partial** | `lib/monitoring/AlertingService.ts`, `alertDelivery.ts`, `alertConfig.ts` |
| 12.5 | Performance Monitoring | **Compliant** | `lib/analytics/web-vitals.ts`, `lib/monitoring/performance-monitor.ts`, `usePerformanceMonitor.ts`, `WebVitalsTracker.tsx` |
| 12.6 | Distributed Tracing | **Non-compliant** | `instrumentation.ts` (Sentry only, no OpenTelemetry) |
| 12.7 | Custom Business Metrics | **Partial** | `lib/analytics/conversion-tracking.ts`, `lib/events/ApplicationEventBus.ts`, `config/business-metrics.ts` |
| 12.8 | Real-time Alerting | **Partial** | `lib/monitoring/AlertingService.ts`, `lib/monitoring/service.ts`, `lib/errors/ErrorReportingService.ts` |

**Overall Assessment: Partial Compliance**

The codebase has a strong foundation for monitoring and observability with well-architected services for error tracking (Sentry), performance monitoring (Web Vitals + custom metrics), alerting (multi-channel with thresholds), and structured logging. The weakest areas are distributed tracing (completely absent), correlation ID propagation (absent), and dependency health checks (not implemented). Given the pre-launch/waitlist phase, many of the "What to Monitor" items (transaction success rates, database performance, queue depths) are not yet applicable, but the infrastructure to support them post-launch is partially in place.

---

## Action Items

### Priority 1 -- Pre-launch (Required)

| # | Action | Effort | Files to modify |
|---|--------|--------|-----------------|
| A1 | Add `release` tag to all three Sentry config files (`process.env.NEXT_PUBLIC_APP_VERSION`) | Low | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |
| A2 | Add Redis health check to `/api/health` endpoint (ping Upstash) | Medium | `app/api/health/route.ts` |
| A3 | Add `destroy()` method to `AlertingService` to clear cleanup interval | Low | `lib/monitoring/AlertingService.ts` |
| A4 | Add `beforeSend` filter to `sentry.edge.config.ts` for consistency | Low | `sentry.edge.config.ts` |

### Priority 2 -- Post-launch (Recommended)

| # | Action | Effort | Files to modify |
|---|--------|--------|-----------------|
| B1 | Add `correlationId` / `requestId` to `LogEntry`; generate in middleware; propagate via headers | Medium | `Logger.ts`, `middleware.ts`, API routes |
| B2 | Implement JSON-structured log output for production (server-side) | Medium | `Logger.ts` |
| B3 | Batch Logger remote logging (replace individual `setTimeout` sends with buffer+flush) | Medium | `Logger.ts` |
| B4 | Wire `sendBusinessAlert()` to actual metric tracking (conversion rate drops, engagement) | Medium | `AlertingService.ts`, `conversion-tracking.ts` |
| B5 | Add server-side API route timing middleware for latency tracking | Medium | New middleware or `instrumentation.ts` |
| B6 | Add external service health checks (Kit.com, Cal.com, email) to health endpoint | Medium | `app/api/health/route.ts` |
| B7 | Implement server-side alerting for API errors and rate limit breaches | Medium | `AlertingService.ts`, API routes |

### Priority 3 -- Growth Phase (When needed)

| # | Action | Effort | Files to modify |
|---|--------|--------|-----------------|
| C1 | Initialize OpenTelemetry SDK in `instrumentation.ts` with OTLP or Sentry exporter | High | `instrumentation.ts`, new config files |
| C2 | Implement percentile aggregation (p50/p95/p99) for API latencies and page load times | High | New analytics backend service |
| C3 | Integrate incident management platform (PagerDuty/OpsGenie) for CRITICAL alerts | Medium | `alertDelivery.ts`, `alertConfig.ts` |
| C4 | Build or integrate dashboard rendering for declared dashboard configs | High | New UI or Grafana integration |
| C5 | Add provider availability monitoring (circuit breaker status, uptime checks) | Medium | New monitoring service |
| C6 | Add separate liveness (`/health/live`) and readiness (`/health/ready`) probes | Low | `app/api/health/` |
