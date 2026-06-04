# Security Guide

> Security measures implemented in the Phase 1 pre-launch marketing site and waitlist API.

## 1. Overview

The current codebase is a Next.js marketing site with waitlist signup functionality. Security covers:

- **CSP**: Nonce-based Content Security Policy generated per request in middleware
- **Input sanitization**: DOMPurify for HTML, text sanitization for form fields, URL validation
- **Rate limiting**: Upstash Redis (sliding window) with in-memory fallback
- **CSRF protection**: Origin/Referer validation on all mutation endpoints
- **Encryption**: AES-256-GCM for PII at rest, HMAC-SHA256 blind index for searchable fields
- **Authentication**: API key validation (timing-safe comparison) for internal/admin endpoints
- **Analytics consent**: GDPR-compliant cookie consent gating PostHog and GA4
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Idempotency**: Duplicate request prevention via idempotency keys (database + in-memory)

All security utilities live in `apps/web/src/lib/security/` and are re-exported from its `index.ts` barrel.

## 2. Content Security Policy (CSP)

**File:** `apps/web/middleware.ts`

A per-request nonce is generated in Edge Middleware as the base64 encoding of 16 random bytes drawn from the Web Crypto API (`crypto.getRandomValues(new Uint8Array(16))` → `btoa(String.fromCharCode(...))`), producing a 24-character base64 string ending in `==`. Web Crypto is used because Next.js Middleware runs in the Edge Runtime, which does not expose `node:crypto`. The base64 charset (`A-Za-z0-9+/=`) matches the CSP Level 3 nonce-source grammar. The nonce is:

- Embedded in the `script-src` directive so only scripts with the matching nonce execute
- Forwarded to layout via the `x-nonce` request/response header
- Applied to every non-static route via the middleware matcher

The companion `x-request-id` header continues to use `crypto.randomUUID()` (UUID format) — only the CSP nonce has the base64 charset requirement; the two are kept separate to avoid coupling.

Key directives:

- `script-src 'self' 'nonce-<base64>'` where `<base64>` is the 24-char nonce per request (production removes `'unsafe-eval'`)
- `style-src 'self' 'unsafe-inline'` (CSS-in-JS requires inline styles)
- `frame-ancestors 'none'` (equivalent to X-Frame-Options DENY)
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self' https://diboas.com https://app.diboas.com`

The middleware fails open on error: if nonce generation fails, the request proceeds without CSP rather than returning a 500 for the entire site.

## 3. Input Sanitization

### HTML sanitization

**File:** `apps/web/src/lib/security/htmlSanitizer.ts`

Uses DOMPurify with a restricted allowlist. Default allowed tags: `strong`, `em`, `br`, `p`, `a`, `ul`, `li`, `ol`. Default allowed attributes: `href`, `target`, `rel`. Used for CMS/rich-text content rendered with `dangerouslySetInnerHTML` (e.g., FAQ answers).

### Text and email sanitization

**File:** `apps/web/src/lib/api/routeHelpers.ts`, `apps/web/src/lib/utils/sanitize.ts`

API routes sanitize text inputs via `sanitizeText()` and validate emails with `isValidEmail()` before processing. User names are sanitized with `sanitizeUserName()`.

### URL validation

**File:** `apps/web/src/lib/security/urlValidator.ts`

`isValidUrl()` checks URLs against an allowed scheme list (`https:`, `http:`, `mailto:`, `tel:`). `sanitizeUrl()` returns `'#'` for invalid URLs.

## 4. Rate Limiting

**File:** `apps/web/src/lib/security/rateLimiter.ts`

Uses `@upstash/ratelimit` with Upstash Redis for distributed sliding-window rate limiting. Falls back to an in-memory `Map`-based limiter when Redis credentials are not configured.

Three presets (configured via environment variables):

- **strict** -- for sensitive endpoints (waitlist signup)
- **standard** -- for general API endpoints (position lookup, referral)
- **lenient** -- for read-only endpoints

API routes apply rate limiting through `applyRateLimit()` in `apps/web/src/lib/api/routeHelpers.ts`, which returns a 429 response with `X-RateLimit-*` and `Retry-After` headers when the limit is exceeded.

Client IP is extracted from `x-forwarded-for` or `x-real-ip` headers.

In addition to the IP-keyed presets, two dedicated sliding-window limiters guard specific abuse vectors (added 2026-06-02):

- **Per-email-address outbound limiter (F8):** `checkOutboundEmailRateLimit(emailHash)` — max 2 emails per address per 5 minutes, keyed by the email's HMAC hash (key prefix `signup:email:`). Gates all four outbound sends in `WaitlistApplicationService` (welcome, deletion-confirmation, deletion-complete, referral-success) via `allowOutboundEmail()` to prevent email-bombing. Only the HMAC hash reaches Upstash (never the raw email). Fail-closed in production; in-memory fallback in dev/test.
- **Monitoring-tunnel limiter (F9):** `checkMonitoringTunnelRateLimit(ip)` — permissive per-IP 1000/60s on `/api/monitoring`, high enough not to break the Sentry SDK (~40× its normal rate) but enough to cap a billing-amplification flood. Returns 429 + `Retry-After` so the SDK's offline buffer re-delivers. CSRF stays intentionally skipped (the SDK can't send a token).

## 5. CSRF Protection

**File:** `apps/web/src/lib/security/csrf.ts`

Origin/Referer-based validation for all mutation (POST/PUT/DELETE) requests. Safe methods (GET, HEAD, OPTIONS) are exempt.

Validation chain:

1. Check `Origin` header against allowed origins (configured via `getCsrfAllowedOrigins()` from env)
2. Fall back to `Referer` header if `Origin` is absent
3. In production, reject requests missing both headers
4. In development, allow requests without origin/referer for local testing

Uses `URL.origin` comparison to prevent subdomain spoofing (e.g., `https://diboas.com.attacker.com` does not match `https://diboas.com`).

Applied to waitlist mutation routes via `applyCsrf()` helper.

## 6. Encryption

**File:** `apps/web/src/lib/security/encryption.ts`

### AES-256-GCM encryption

Used for PII at rest (waitlist email addresses, names). Each encryption generates a random 12-byte IV. Output format: base64-encoded `IV + ciphertext + authTag`.

Key management:

- `ENCRYPTION_KEY` env var: 32-byte base64-encoded key
- In development without a key, plaintext passthrough for convenience
- In production, missing key logs an error and returns `null`

Provides `encryptFields()` / `decryptFields()` helpers for encrypting specific object fields.

### HMAC-SHA256 blind index

`hmacHash()` generates a deterministic hash for searchable encrypted fields (e.g., `email_hash` column for `WHERE email_hash = $1` queries). Uses a dedicated `HMAC_KEY` env var, separate from the encryption key for cryptographic separation. Falls back to `ENCRYPTION_KEY` in non-production environments.

### Deletion tokens

`generateDeletionToken()` creates a 32-byte random hex token. `hashToken()` stores the SHA-256 hash. `verifyToken()` compares using timing-safe comparison.

## 7. Authentication

**File:** `apps/web/src/lib/security/authentication.ts`

API key authentication for internal/admin endpoints (e.g., waitlist position lookup). Validates `x-api-key` header against `INTERNAL_API_KEY` env var using `crypto.timingSafeEqual` to prevent timing attacks.

Features:

- Constant-time comparison even when key lengths differ (compares buffer with itself to maintain timing)
- Auth failure logging with IP, path, user-agent, and timestamp
- Development mode allows requests without a key for local testing
- Helper `requireAuth()` returns `null` on success or a 401 `NextResponse` on failure

## 8. Analytics Consent (GDPR/ePrivacy)

### Cookie consent

**File:** `apps/web/src/lib/security/cookies.ts`

Consent is stored in an HttpOnly cookie (`sameSite: 'strict'`, `secure` in production). The cookie contains a JSON payload with `analytics` boolean, consent version, and timestamp. Version mismatch invalidates prior consent (for re-consent on policy changes).

### Consent-event channels

Two parallel channels for consent propagation, by deliberate design:

- **`applicationEventBus` `CONSENT_GIVEN` / `CONSENT_WITHDRAWN`** — the canonical channel for **all React components and JS modules**. `ConsentEventPayload` includes `consentType: 'analytics' | 'marketing' | 'all'` + `newState: boolean`. Subscribers filter on `consentType === 'analytics' || consentType === 'all'` to enable analytics behaviour.
- **`window.dispatchEvent(new CustomEvent('cookie-consent-changed', ...))`** — a DOM-event fallback that exists _only_ for the GA4 inline bootstrap in `apps/web/src/app/layout.tsx`. That script runs pre-hydration and has no access to the React module graph. **No other consumer should listen to this DOM event** — `consentUtils.ts -> dispatchConsentEvent` documents the rule explicitly.

Both channels are emitted by `dispatchConsentEvent()` in `apps/web/src/components/CookieConsent/consentUtils.ts`. A schema-drift guard test (`__tests__/consentUtils.coverage.test.ts`) asserts the bus payload matches `EVENT_VALIDATION_SCHEMA[CONSENT_GIVEN]` / `[CONSENT_WITHDRAWN]` required fields, so a future refactor that drops `consentType` or `newState` surfaces as a test failure rather than silently disabling analytics across the codebase (Lighthouse Remediation Plan §8 risk #9).

### PostHog consent gating

**File:** `apps/web/src/components/Providers/PostHogProvider.tsx`

PostHog is never statically imported. The provider:

1. Checks `hasAnalyticsConsent()` before loading
2. Dynamically imports `posthog-js` only after consent is confirmed
3. Listens for `applicationEventBus` `CONSENT_GIVEN` events to initialize if consent arrives after mount
4. Calls `opt_out_capturing()` on `applicationEventBus` `CONSENT_WITHDRAWN` events
5. Sets `respect_dnt: true` to honor Do Not Track headers

### GA4 consent gating

**File:** `apps/web/src/components/Providers/GoogleAnalyticsLoader.tsx` (2026-05-22 — Lighthouse Remediation Plan Workstream D)

The GA4 `gtag/js` script (~67 KB) does NOT download until the user grants analytics consent. The flow has two layers:

1. **Consent Mode v2 bootstrap (inline in `layout.tsx`)** — sets `analytics_storage: 'denied'` by default. Listens to the `cookie-consent-changed` DOM event (the pre-hydration channel) to update Google's consent state and flush buffered events after grant.
2. **Script-loading gate (`GoogleAnalyticsLoader`)** — a `'use client'` component that subscribes to `applicationEventBus` `CONSENT_GIVEN`. Only after consent is granted does it mount the `<Script src=".../gtag/js?id=...">` tags. Honors existing consent on cold start via `hasAnalyticsConsent()`.

The two layers are complementary: Consent Mode v2 handles the _data-send_ contract with Google (legally required for EU); `GoogleAnalyticsLoader` handles the _script-loading_ gate (perf optimisation).

### Sentry consent gating

**File:** `apps/web/src/instrumentation-client.ts` (2026-05-22 — Lighthouse Remediation Plan Workstream B)

Sentry runs in two distinct modes:

1. **Error capture** — initialises unconditionally if `NEXT_PUBLIC_SENTRY_DSN` is set. Lawful basis: GDPR Article 6(1)(f) legitimate interest (site reliability + security). PII is scrubbed in `beforeSend` (user.email, user.username, user.ip_address; emails in `event.extra` and breadcrumb data replaced with `[EMAIL_REDACTED]`).
2. **Session Replay** — OFF at init (`replaysSessionSampleRate: 0`, empty `integrations`). Enabled via `client.addIntegration(Sentry.replayIntegration({maskAllText: true, blockAllMedia: true}))` **only after** `applicationEventBus` `CONSENT_GIVEN` arrives. On `CONSENT_WITHDRAWN`, `Sentry.getReplay()?.stop()` halts the active recording.

This closes the CTO Board GDPR finding from 2026-05-21 (Replay was previously recording 10% of all sessions pre-consent).

## 9. Security Headers

**File:** `apps/web/next.config.js` (headers function)

Applied to all routes via `next.config.js`:

| Header                      | Value                                                          |
| --------------------------- | -------------------------------------------------------------- |
| `X-Frame-Options`           | `DENY`                                                         |
| `X-Content-Type-Options`    | `nosniff`                                                      |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                              |
| `X-DNS-Prefetch-Control`    | `on`                                                           |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload`                 |
| `X-XSS-Protection`          | `1; mode=block`                                                |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |

CSP is excluded from `next.config.js` because it requires a per-request nonce and is set in middleware instead.

## 10. Dependency Security

- **Lockfile:** `pnpm-lock.yaml` ensures deterministic installs
- **Audit:** `pnpm security:audit` runs `pnpm audit` for known vulnerabilities
- **Pre-launch audit:** `pnpm audit:full` includes a 15-point check covering security headers, rate limiting, and more
- **No secrets in code:** All sensitive values use environment variables (documented in `apps/web/.env.example`)
- **Production compiler:** `removeConsole` strips `console.*` calls from production builds to prevent information leakage

## Additional Patterns

### Email enumeration prevention

The waitlist signup endpoint returns identical response structures for new and existing emails. The position-lookup GET endpoint adds an artificial random delay (100-300ms) and, for non-existent emails, returns a dummy position that **rotates daily** — seeded with `hmacHash(\`${todayUTC}|${email}\`)` (F13, 2026-06-02) so the value is no longer a stable per-email fingerprint across days, while staying within the real-position range (1-10000) to defeat range-based enumeration. The per-email outbound limiter (F8, §4) additionally caps abuse of the email-send path.

### Idempotency

**File:** `apps/web/src/lib/security/idempotency.ts`

Mutation endpoints accept an `idempotency-key` header. Responses are cached in PostgreSQL (when `DATABASE_URL` is set) and in-memory (5-minute TTL, 10K entry cap). Duplicate requests receive the cached response.

### Request correlation

Middleware generates a `x-request-id` UUID per request for end-to-end tracing through logs and audit events.
