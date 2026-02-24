# Principle 8: Security & Audit Standards

**Audit Date:** 2026-02-22
**Auditor:** Claude Opus 4.6
**Scope:** Full codebase security review against Principle 8 requirements
**Platform Phase:** Pre-launch / Waitlist

---

## Principle Requirements

From `docs/coding-standards.md`:

- Input validation on all endpoints
- Parameterized queries (prevent SQL injection)
- Output encoding (prevent XSS)
- Rate limiting per user
- Authentication & authorization on all operations
- Encryption at rest and in transit
- Audit logging for all sensitive operations
- PII masking in logs
- Fraud detection integration

---

## Findings

### 8.1 Input Validation

**Status: Compliant**

All API routes implement input validation before processing. Evidence by route:

| Route | Validation |
|-------|-----------|
| `POST /api/waitlist/signup` | Email required check, `isValidEmail()`, `sanitizeText()`, `sanitizeUserName()`, GDPR consent boolean check, `isValidReferralCode()` |
| `GET /api/waitlist/signup` | Email param required, `isValidEmail()` |
| `POST /api/consent` | `typeof body.analytics !== 'boolean'` type check |
| `GET /api/consent` | No user input (reads from cookie only) |
| `DELETE /api/consent` | No user input (clears cookie) |
| `POST /api/webhooks/kit` | HMAC-SHA256 signature verification, typed payload parsing |
| `GET /api/health` | No user input |
| `POST /api/waitlist/delete` | Email required, type check, regex validation, token validation on DELETE |
| `GET /api/waitlist/position` | Email param required, `sanitizeEmail()`, `isValidEmail()` |
| `POST /api/waitlist/position` | Email required, `requireAuth()` admin check |
| `GET /api/waitlist/referral` | Code param required, `isValidReferralCode()` |
| `POST /api/waitlist/referral` | referralCode + referredEmail required, `isValidReferralCode()`, referral mismatch check |
| `GET /api/waitlist/stats` | No user input |

**Client-side validation** is also present via `WaitingListService.validateInput()` which checks email format, name length, GDPR consent, and X account format before submitting to the API.

**Files:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/waitlist/signup/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/consent/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/webhooks/kit/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/waitlist/delete/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/waitlist/position/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/waitlist/referral/route.ts`
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/api/waitlist/stats/route.ts`

**Gaps:** None identified.

---

### 8.2 Parameterized Queries (SQL Injection Prevention)

**Status: N/A**

The platform currently uses file-based storage (`store.ts` with in-memory Map and JSON file persistence) rather than a SQL database. No SQL queries exist in the codebase. The `.env.example` contains a commented-out `DATABASE_URL` for future use.

**File:**
- `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/waitingList/store.ts`

**Recommendation:** When migrating to PostgreSQL (post-launch), ensure all queries use parameterized statements via an ORM (Prisma, Drizzle) or prepared statements. Add this as a pre-migration checklist item.

---

### 8.3 Output Encoding / XSS Prevention

**Status: Compliant**

Multiple layers of XSS prevention are in place:

**Server-side sanitization** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/utils/sanitize.ts`):
- `sanitizeText()` - HTML entity encoding for `<`, `>`, `"`, `'`, `&`
- `sanitizeEmail()` - lowercase + trim + HTML entity encoding
- `sanitizeUserName()` - trim + HTML entity encoding
- Comprehensive test suite at `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/__tests__/sanitize.test.ts` covering XSS attack vectors, edge cases, and idempotency

**Client-side DOMPurify usage** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/components/Sections/FAQAccordion/variants/FAQAccordionDefault/FAQAccordionDefault.tsx`):
- FAQ answers containing HTML are sanitized with `DOMPurify.sanitize()` using a strict allowlist:
  ```ts
  ALLOWED_TAGS: ['strong', 'em', 'br', 'p', 'a', 'ul', 'li', 'ol'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ```

**`dangerouslySetInnerHTML` usage audit** (3 files):

| File | Usage | Risk |
|------|-------|------|
| `FAQAccordionDefault.tsx` | DOMPurify-sanitized FAQ answers | Safe - sanitized with strict allowlist |
| `layout.tsx` | JSON-LD structured data + GA4 consent mode script | Safe - developer-controlled content, nonce-protected |
| `StructuredData.tsx` | JSON-LD structured data via `JSON.stringify()` | Safe - developer-controlled schema.org data |

**Client-side WaitingListService** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/waitingList/services/WaitingListService.ts`):
- Uses DOMPurify for client-side input sanitization before API submission

**Gaps:** None identified.

---

### 8.4 Rate Limiting

**Status: Compliant**

All API routes implement rate limiting via a distributed rate limiter (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/rateLimiter.ts`).

**Architecture:**
- Primary: Upstash Redis with sliding window algorithm (`@upstash/ratelimit`)
- Fallback: In-memory rate limiting when Redis is unavailable
- Configuration: Environment-variable-driven presets (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/env.ts`)

**Presets:**
| Preset | Limit | Window | Usage |
|--------|-------|--------|-------|
| `strict` | 5 req | 60s | Signup, deletion |
| `standard` | 30 req | 60s | Position updates, referral processing, consent |
| `lenient` | 100 req | 60s | Stats, referral lookup, health checks, consent read |

**Rate limiting by route:**

| Route | Handler | Preset |
|-------|---------|--------|
| `POST /api/waitlist/signup` | POST | strict |
| `GET /api/waitlist/signup` | GET | standard |
| `POST /api/consent` | POST | standard |
| `GET /api/consent` | GET | lenient |
| `DELETE /api/consent` | DELETE | standard |
| `POST /api/webhooks/kit` | POST | standard |
| `GET /api/health` | GET/HEAD | lenient |
| `POST /api/waitlist/delete` | POST/DELETE | strict |
| `GET /api/waitlist/position` | GET | standard |
| `POST /api/waitlist/position` | POST | standard |
| `GET /api/waitlist/referral` | GET | lenient |
| `POST /api/waitlist/referral` | POST | standard |
| `GET /api/waitlist/stats` | GET | lenient |

All responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. Rate-limited responses include `Retry-After` header.

**Gaps:** None identified.

---

### 8.5 CSRF Protection

**Status: Compliant**

CSRF protection is implemented via origin/referer validation (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/csrf.ts`):

- Safe methods (GET, HEAD, OPTIONS) are excluded from CSRF checks
- Origin header checked against URL-parsed allowed origins (prevents subdomain spoofing like `diboas.com.attacker.com`)
- Referer header used as fallback when Origin is absent
- Allowed origins loaded from environment configuration
- Development mode allows requests without origin/referer for testing
- Production mode rejects requests without origin or referer headers
- Returns 403 with `CSRF_VALIDATION_FAILED` error code on failure

**CSRF coverage by mutation endpoint:**

| Mutation Endpoint | CSRF Protected |
|-------------------|---------------|
| `POST /api/waitlist/signup` | Yes |
| `POST /api/consent` | Yes |
| `DELETE /api/consent` | Yes |
| `POST /api/webhooks/kit` | No (uses HMAC signature instead) |
| `POST /api/waitlist/delete` | Yes |
| `DELETE /api/waitlist/delete` | Yes |
| `POST /api/waitlist/position` | Yes |
| `POST /api/waitlist/referral` | Yes |

The webhook endpoint correctly uses HMAC-SHA256 signature verification instead of CSRF (webhooks are server-to-server calls without browser origin headers).

**Gaps:** None identified.

---

### 8.6 Authentication & Authorization

**Status: Compliant**

Zero-Trust authentication is implemented for admin endpoints (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/authentication.ts`):

- API key validation via `x-api-key` header with timing-safe comparison (`crypto.timingSafeEqual`)
- `requireAuth()` middleware helper returns 401 for failed authentication
- `POST /api/waitlist/position` requires `requireAuth(request, { requireAdmin: true })`
- GDPR deletion uses token-based two-step confirmation (token generated via `crypto.randomBytes(32)`, stored as SHA-256 hash, 15-minute TTL)
- Failed authentication attempts are logged with IP, path, and user-agent for audit trail

**Public endpoints** (signup, position GET, referral lookup, stats, health) are intentionally unauthenticated as they are public-facing pre-launch APIs. These are protected by rate limiting, input validation, and anti-enumeration measures.

**Anti-enumeration defenses:**
- Signup returns identical response structure for new and existing emails
- Position GET returns null values structure for non-existent emails
- Deletion always returns 202 regardless of email existence
- Artificial timing delays (100-300ms random) prevent timing attacks

**Gaps:** None identified for current pre-launch phase. Post-launch, user authentication (JWT/session) will be needed for authenticated endpoints.

---

### 8.7 Encryption at Rest

**Status: Compliant**

AES-256-GCM authenticated encryption is implemented (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/encryption.ts`):

- Algorithm: AES-256-GCM with 12-byte random IV per operation
- Key: 256-bit (32 bytes) from `ENCRYPTION_KEY` environment variable (base64-encoded)
- Authentication tag: 16 bytes for integrity verification
- Output format: Base64(IV + ciphertext + authTag)
- Graceful degradation: returns plaintext in development when `ENCRYPTION_KEY` not set; fails in production

**Encryption is applied to PII in the waitlist store** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/waitingList/store.ts`):

```typescript
// Encrypt PII for storage (line 135-136)
email: encrypt(entry.email) || entry.email,
name: entry.name ? (encrypt(entry.name) || entry.name) : undefined,

// Decrypt PII on load (line 103-105)
email: decrypt(entry.email) || entry.email,
name: entry.name ? (decrypt(entry.name) || entry.name) : undefined,
```

**Additional utilities:**
- `encryptFields()` / `decryptFields()` for bulk field encryption
- `isLikelyUnencrypted()` for backward compatibility with unencrypted legacy data
- `generateEncryptionKey()` for key generation

**Consent cookies** use `HttpOnly`, `Secure` (production), `SameSite: strict`, and `maxAge: 1 year` attributes (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/cookies.ts`).

**Gaps:**
1. The `ENCRYPTION_KEY` is not set in `.env.local` (empty in `.env.example`), meaning encryption may not be active in development/testing.
2. The fallback `|| entry.email` when encryption returns null means PII may be stored unencrypted if the key is misconfigured. This is by design for development but should be strictly enforced in production.

---

### 8.8 Encryption in Transit (HTTPS / TLS)

**Status: Compliant**

HSTS is configured in three locations for defense-in-depth:

1. **`next.config.js`** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/next.config.js`, line 142):
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```

2. **`proxy.ts`** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/proxy.ts`, line 147):
   Production-only HSTS header

3. **`config/security.ts`** (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/config/security.ts`, line 132):
   HSTS in additional security headers configuration

Cookies are set with `secure: IS_PRODUCTION` flag.

**Gaps:** None identified. Deployment on Vercel provides TLS by default.

---

### 8.9 Content Security Policy (CSP)

**Status: Compliant**

Nonce-based CSP is implemented in the middleware (`/Users/simonekugler/Desktop/diboas-platform/apps/web/middleware.ts`):

- Per-request nonce generated via `crypto.randomUUID()`
- Nonce forwarded to layout via `x-nonce` request/response header
- Layout reads nonce and applies to `<script>` tags and `<Script>` components
- Production CSP removes `'unsafe-eval'` (only allowed in development)
- `'unsafe-inline'` removed from `script-src` in production (nonce replaces it)
- `'unsafe-inline'` still present in `style-src` (required for CSS-in-JS)

**CSP directives:**

| Directive | Policy |
|-----------|--------|
| `default-src` | `'self'` |
| `script-src` | `'self' 'nonce-{uuid}' [analytics domains]` (prod) |
| `style-src` | `'self' 'unsafe-inline'` |
| `img-src` | `'self' data: blob: [brand domains]` |
| `font-src` | `'self' data:` |
| `connect-src` | `'self' [analytics/api domains]` |
| `frame-ancestors` | `'none'` (clickjacking protection) |
| `object-src` | `'none'` (plugin blocking) |
| `base-uri` | `'self'` |
| `form-action` | `'self' [brand domains]` |

**Additional security headers** (via `next.config.js`):
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `X-DNS-Prefetch-Control: on`

**Note:** There is a separate `config/security.ts` file that defines CSP with `'unsafe-inline'` in `script-src`. This file appears to be a legacy/reference configuration and is NOT used by the active middleware. The middleware correctly uses nonce-based CSP without `'unsafe-inline'` for scripts.

**Gaps:** None identified.

---

### 8.10 Secrets Management

**Status: Partial -- CRITICAL FINDING**

**Finding:** The file `/Users/simonekugler/Desktop/diboas-platform/apps/web/.env.local` exists on disk and contains real API keys and tokens:

```
NEXT_PUBLIC_SENTRY_DSN=https://dd8092edd9f1cb336571bc4c6259cfb8@o4510647498440704.ingest.de.sentry.io/4510647511810128
NEXT_PUBLIC_GA_ID=G-8TGT00PGQL
NEXT_PUBLIC_POSTHOG_KEY=phc_CUWDFVLeAwxybafuvTwjRbuzuYldPTghHhYRRer677G
KIT_API_KEY=LOfkwaQQgs_50z8KVWmCqQ
KIT_FORM_ID=8933981
```

**Mitigation already in place:**
- `.env.local` IS listed in `.gitignore` (line 15)
- `git ls-files` confirms `.env.local` is NOT tracked in version control
- `.env.example` contains empty placeholder values (no secrets)
- All secrets are accessed via `process.env` - no hardcoded secrets in source code
- No matches found for `apiKey = "`, `token = "`, `password = "`, `secret = "` patterns in `.ts`/`.tsx` files

**However:**
- `NEXT_PUBLIC_*` keys (Sentry DSN, GA ID, PostHog key) are inherently public (exposed in client bundle) and are acceptable to have in `.env.local`
- `KIT_API_KEY` is a server-side secret and should be managed via a secure secrets manager in production

**Gaps:**
1. No secrets rotation policy documented
2. No integration with a secrets manager (Vercel Environment Variables, AWS Secrets Manager, etc.) -- acceptable for pre-launch
3. The `KIT_WEBHOOK_SECRET`, `ENCRYPTION_KEY`, and `INTERNAL_API_KEY` are not set in `.env.local`, meaning webhook signature verification and encryption may be inactive in the development environment

---

### 8.11 PII Masking in Logs

**Status: Partial -- NEEDS IMPROVEMENT**

The Logger (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/monitoring/Logger.ts`) implements `sanitizeContext()` (line 229) which redacts sensitive keys:

```typescript
const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential', 'email', 'ssn'];
```

This correctly redacts any context property whose key contains these sensitive strings (e.g., `{ email: 'user@test.com' }` becomes `{ email: '[REDACTED]' }`).

**However, there are PII leakage patterns:**

Several log statements in the webhook handler pass email addresses as context values with the key `email`, which WILL be caught by the sanitizer. But the effectiveness depends on consistent key naming:

| File | Line | Log Statement | Status |
|------|------|--------------|--------|
| `kit/route.ts` | 96 | `Logger.info('[Kit.com] Successfully synced subscriber', { email })` | Redacted (key is 'email') |
| `kit/route.ts` | 181 | `Logger.info('[Kit Webhook] Tag removed', { tag, email })` | Redacted (key is 'email') |
| `kit/route.ts` | 245 | `Logger.info('[Kit Webhook] Updated subscriber ID', { email, subscriberId })` | Redacted (key is 'email') |
| `kit/route.ts` | 248 | `Logger.info('[Kit Webhook] New subscriber from Kit.com', { email })` | Redacted (key is 'email') |
| `kit/route.ts` | 277 | `Logger.info('[Kit Webhook] Updated fields', { email, updates })` | Redacted (key is 'email') |
| `kit/route.ts` | 296 | `Logger.info('[Kit Webhook] Added tag', { tag, email })` | Redacted (key is 'email') |
| `kit/route.ts` | 313 | `Logger.info('[Kit Webhook] Marked as unsubscribed', { email })` | Redacted (key is 'email') |
| `signup/route.ts` | 96 | `Logger.info('[Kit.com] Successfully synced subscriber', { email })` | Redacted (key is 'email') |

While the Logger's `sanitizeContext()` does catch these because the key name contains "email", this pattern is fragile. If a developer uses a different key name (e.g., `{ user: email }` or `{ address: email }`), PII would leak.

**Gaps:**
1. **Fragile pattern:** PII redaction relies on key naming conventions rather than value-pattern matching. An email passed under a non-sensitive key name would not be redacted.
2. **No value-based PII detection:** The sanitizer does not scan for email patterns, phone numbers, or other PII patterns in values -- only key names.
3. **Log storage in localStorage:** The Logger stores up to 100 log entries in `localStorage` (`diboas_logs`). While context is sanitized, the `message` field could theoretically contain PII if developers embed it in log messages directly (not observed currently, but no guard).
4. **Remote logging endpoint:** Logs sent to `NEXT_PUBLIC_LOGGING_ENDPOINT` include the full `LogEntry` object. Ensure the remote endpoint also masks PII.

---

### 8.12 Audit Logging for Sensitive Operations

**Status: Compliant**

All sensitive operations emit events via `ApplicationEventBus` (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/events/ApplicationEventBus.ts`):

| Operation | Event Type | Route |
|-----------|-----------|-------|
| Waitlist signup success | `WAITLIST_SIGNUP_COMPLETED` | signup/route.ts |
| Waitlist signup failure | `WAITLIST_SIGNUP_FAILED` | signup/route.ts |
| GDPR deletion request | `WAITLIST_DELETION_REQUESTED` | delete/route.ts |
| GDPR deletion confirmed | `WAITLIST_DELETION_COMPLETED` | delete/route.ts |
| Referral used | `WAITLIST_REFERRAL_USED` | referral/route.ts |
| Position checked | `WAITLIST_POSITION_CHECKED` | position/route.ts |
| Consent given | `CONSENT_GIVEN` | consent/route.ts |
| Consent withdrawn | `CONSENT_WITHDRAWN` | consent/route.ts |
| Webhook received | `WEBHOOK_RECEIVED` | kit/route.ts |
| Webhook processed | `WEBHOOK_PROCESSED` | kit/route.ts |
| Webhook failed | `WEBHOOK_FAILED` | kit/route.ts |
| Application error | `APPLICATION_ERROR` | all routes |

Events include structured metadata: `source`, `timestamp`, `correlationId` (via event bus), and operation-specific fields.

Authentication failures are logged via `logAuthFailure()` in `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/authentication.ts` with IP, path, user-agent, and timestamp.

CSRF failures are logged via `Logger.warn()` in `/Users/simonekugler/Desktop/diboas-platform/apps/web/src/lib/security/csrf.ts` with error details, method, URL, and IP.

**Gaps:**
1. Events are emitted to an in-memory event bus. For production, these should be persisted to a durable audit log (database, external logging service).
2. No event persistence layer is currently configured -- events are processed in-memory and forwarded to analytics (gtag) but not stored for compliance retrieval.

---

### 8.13 PostHog Consent-Gating

**Status: Compliant**

PostHog is properly lazy-loaded behind consent (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/components/Providers/PostHogProvider.tsx`):

1. PostHog is NEVER imported at module level -- only via dynamic `import('posthog-js')` inside an async function
2. Initialization is gated on `hasAnalyticsConsent()` check (line 32)
3. Uses `useRef` (`isInitializedRef`) to prevent double initialization
4. Listens for `cookie-consent-changed` custom event to react to consent changes
5. Calls `posthog.opt_out_capturing()` when consent is withdrawn
6. Respects `Do Not Track` via `respect_dnt: true` configuration
7. Renders children without PostHog wrapper when not initialized

**Google Analytics 4** is also consent-gated (`/Users/simonekugler/Desktop/diboas-platform/apps/web/src/app/layout.tsx`):
- Default consent mode: `analytics_storage: 'denied'`, `ad_storage: 'denied'`
- Consent updated only when localStorage consent record exists and is valid
- Listens for `cookie-consent-changed` event for runtime consent changes
- GA4 script loaded via `next/script` with `strategy="afterInteractive"`

**Gaps:** None identified.

---

### 8.14 Fraud Detection Integration

**Status: N/A**

Fraud detection is listed as a Principle 8 requirement but is not applicable to the current pre-launch/waitlist phase. There are no financial transactions or user accounts to protect.

**Recommendation:** Implement fraud detection as part of the post-launch banking feature rollout. Consider:
- Rate limiting is already in place (foundational anti-abuse)
- Anti-enumeration measures already prevent account probing
- Add behavioral analysis, device fingerprinting, and transaction monitoring when financial features are introduced

---

## Summary

| Sub-Requirement | Status | Severity |
|----------------|--------|----------|
| 8.1 Input Validation | Compliant | -- |
| 8.2 Parameterized Queries | N/A | -- |
| 8.3 XSS Prevention | Compliant | -- |
| 8.4 Rate Limiting | Compliant | -- |
| 8.5 CSRF Protection | Compliant | -- |
| 8.6 Authentication & Authorization | Compliant | -- |
| 8.7 Encryption at Rest | Compliant | -- |
| 8.8 Encryption in Transit | Compliant | -- |
| 8.9 Content Security Policy | Compliant | -- |
| 8.10 Secrets Management | Partial | Critical |
| 8.11 PII Masking in Logs | Partial | Medium |
| 8.12 Audit Logging | Compliant | -- |
| 8.13 PostHog Consent-Gating | Compliant | -- |
| 8.14 Fraud Detection | N/A | -- |

**Overall Compliance: 10/12 applicable requirements compliant, 2 partial**

---

## Action Items

### Critical (Pre-Launch)

| # | Finding | Action | File(s) |
|---|---------|--------|---------|
| 1 | Secrets management lacks rotation policy | Document secrets rotation procedure; configure production secrets via Vercel Environment Variables or equivalent | `.env.example`, deployment docs |
| 2 | `KIT_WEBHOOK_SECRET`, `ENCRYPTION_KEY`, `INTERNAL_API_KEY` not configured | Ensure all security-critical environment variables are set before production deployment; add startup validation that errors if critical secrets are missing in production | `apps/web/src/config/env.ts` |

### Medium (Pre-Launch)

| # | Finding | Action | File(s) |
|---|---------|--------|---------|
| 3 | PII masking relies on key naming convention | Add value-pattern scanning to `Logger.sanitizeContext()` to detect email patterns (regex), phone numbers, and other PII in values regardless of key name | `apps/web/src/lib/monitoring/Logger.ts` |
| 4 | Audit events not persisted to durable storage | Implement an event persistence subscriber that writes audit-critical events to a durable store (database or external logging service) before production launch | `apps/web/src/lib/events/ApplicationEventBus.ts` |
| 5 | Logger stores entries in localStorage | Ensure `localStorage` log entries are cleared on session end or consent withdrawal; consider removing client-side log persistence in production | `apps/web/src/lib/monitoring/Logger.ts` |

### Low (Post-Launch)

| # | Finding | Action | File(s) |
|---|---------|--------|---------|
| 6 | No database yet | When migrating to PostgreSQL, ensure all queries use parameterized statements; add SQL injection tests | Future migration |
| 7 | Fraud detection not implemented | Implement fraud detection alongside banking features launch | Future feature |
| 8 | `config/security.ts` contains legacy CSP with `'unsafe-inline'` in script-src | Remove or annotate legacy CSP config to prevent accidental use; middleware.ts is the source of truth | `apps/web/src/config/security.ts` |
