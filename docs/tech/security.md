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

A per-request nonce is generated via `crypto.randomUUID()` in Edge Middleware. The nonce is:
- Embedded in the `script-src` directive so only scripts with the matching nonce execute
- Forwarded to layout via the `x-nonce` request/response header
- Applied to every non-static route via the middleware matcher

Key directives:
- `script-src 'self' 'nonce-{uuid}'` (production removes `'unsafe-eval'`)
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

### PostHog consent gating
**File:** `apps/web/src/components/Providers/PostHogProvider.tsx`

PostHog is never statically imported. The provider:
1. Checks `hasAnalyticsConsent()` before loading
2. Dynamically imports `posthog-js` only after consent is confirmed
3. Listens for `CONSENT_GIVEN` events to initialize if consent arrives after mount
4. Calls `opt_out_capturing()` on `CONSENT_WITHDRAWN` events
5. Sets `respect_dnt: true` to honor Do Not Track headers

GA4 uses Next.js `afterInteractive` strategy and is also gated behind consent.

## 9. Security Headers

**File:** `apps/web/next.config.js` (headers function)

Applied to all routes via `next.config.js`:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-DNS-Prefetch-Control` | `on` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-XSS-Protection` | `1; mode=block` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |

CSP is excluded from `next.config.js` because it requires a per-request nonce and is set in middleware instead.

## 10. Dependency Security

- **Lockfile:** `pnpm-lock.yaml` ensures deterministic installs
- **Audit:** `pnpm security:audit` runs `pnpm audit` for known vulnerabilities
- **Pre-launch audit:** `pnpm audit:full` includes a 15-point check covering security headers, rate limiting, and more
- **No secrets in code:** All sensitive values use environment variables (documented in `apps/web/.env.example`)
- **Production compiler:** `removeConsole` strips `console.*` calls from production builds to prevent information leakage

## Additional Patterns

### Email enumeration prevention
The waitlist signup endpoint returns identical response structures for new and existing emails. The GET check endpoint adds an artificial random delay (100-300ms) and returns a generic message regardless of email existence.

### Idempotency
**File:** `apps/web/src/lib/security/idempotency.ts`

Mutation endpoints accept an `idempotency-key` header. Responses are cached in PostgreSQL (when `DATABASE_URL` is set) and in-memory (5-minute TTL, 10K entry cap). Duplicate requests receive the cached response.

### Request correlation
Middleware generates a `x-request-id` UUID per request for end-to-end tracing through logs and audit events.
