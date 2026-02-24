# Tier 2 Implementation Plan: Replace Kit.com with In-House CRM + Transactional Email

**Date:** 2026-02-23
**Updated:** 2026-02-23 (v2 — added 12 Principles mapping + $0 budget constraints)
**Decision:** Implement Tier 2 inside `diboas-platform/` monorepo as `packages/email`
**Replaces:** Kit.com (ConvertKit) -- full removal, no dual-system phase

---

## Table of Contents

1. [Decision Record](#1-decision-record)
2. [Pre-Requirements (Owner Action Needed)](#2-pre-requirements-owner-action-needed)
3. [Budget & Infrastructure Constraints](#3-budget--infrastructure-constraints)
4. [12 Principles Compliance Map](#4-12-principles-compliance-map)
5. [Scope](#5-scope)
6. [Architecture](#6-architecture)
7. [Implementation Phases](#7-implementation-phases)
8. [Phase 1: Database Migration (Tier 1)](#8-phase-1-database-migration)
9. [Phase 2: Email Package](#9-phase-2-email-package)
10. [Phase 3: Integration](#10-phase-3-integration)
11. [Phase 4: Kit.com Removal](#11-phase-4-kitcom-removal)
12. [Phase 5: Testing & Validation](#12-phase-5-testing--validation)
13. [File Change Manifest](#13-file-change-manifest)
14. [Environment Variables](#14-environment-variables)
15. [Rollback Strategy](#15-rollback-strategy)
16. [Acceptance Criteria](#16-acceptance-criteria)
17. [Code Standards Enforcement](#17-code-standards-enforcement)

---

## 1. Decision Record

### Context

The current waitlist system uses Kit.com (ConvertKit) as an external CRM and email marketing tool. The integration is bi-directional:
- **Outbound:** `syncToKit()` sends subscriber data after signup (async, non-blocking, circuit breaker protected)
- **Inbound:** Webhook handler at `/api/webhooks/kit` receives subscriber state changes

The local file-based store (`.waitlist-data.json`) is the source of truth. Kit.com is already treated as non-critical -- the circuit breaker ensures the product works when Kit.com is unavailable.

### Decision

Replace Kit.com entirely with:
1. **Neon PostgreSQL (free tier)** replacing the file-based store — $0, serverless-compatible
2. **`packages/email`** monorepo package using **Resend (free tier)** as the email provider — $0
3. **4 transactional email templates** for lifecycle events
4. **Full removal** of all Kit.com code, config, and environment variables

### Why Inside the Monorepo

- Transactional emails are triggered directly from API route handlers (function calls, not cross-service)
- Email templates need access to shared types (`WaitlistEntry`, `WaitlistSource`)
- Email templates need `@diboas/i18n` for 4-locale support
- The database is shared with the waitlist API routes
- Turborepo already handles multi-package builds
- One deployment, no cross-service communication overhead

### Why Not a Separate Repository

- No independent scaling needed at pre-launch stage
- Cross-repo API calls add latency and failure modes for no benefit
- Type duplication or package publishing adds build complexity
- The `diboas-analytics/` separation precedent doesn't apply -- analytics is async/background, email is in the request path

---

## 2. Pre-Requirements (Owner Action Needed)

Before implementation can begin, the following **manual setup tasks** must be completed by the project owner. These are external service accounts that cannot be created programmatically.

### 2.1 Create Neon PostgreSQL Project (blocks Phase 1)

- **Where:** [neon.tech](https://neon.tech) (sign up with GitHub SSO)
- **Plan:** Free (Always Free tier)
- **Region:** `aws-eu-central-1` (closest to existing Sentry `de.sentry.io` region)
- **Project name:** `diboas` (or any preferred name)
- **Time:** ~2 minutes

**After setup, provide:**
```
DATABASE_URL=postgresql://user:pass@ep-xxxx.eu-central-1.aws.neon.tech/diboas?sslmode=require
```

This value goes into `apps/web/.env.local` and Vercel environment variables.

### 2.2 Create Resend Account (blocks Phase 2)

- **Where:** [resend.com](https://resend.com) (sign up with GitHub SSO)
- **Plan:** Free (3,000 emails/month, 100 emails/day, 1 custom domain)
- **Time:** ~2 minutes

**After setup, provide:**
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Optional (can be done later):**
- Verify a custom sending domain (e.g., `diboas.com`) for production emails
- Without domain verification, Resend provides a test domain (`onboarding@resend.dev`) that works for development
- Set up a webhook endpoint in Resend dashboard pointing to `https://yourdomain.com/api/webhooks/resend` for delivery tracking (provides `RESEND_WEBHOOK_SECRET`)

### Dependency Map

```
Pre-Req 2.1 (Neon) ──→ Phase 1 (Database Migration) ──→ Phase 3 (Integration) ──→ Phase 4 (Kit.com Removal)
Pre-Req 2.2 (Resend) ─→ Phase 2 (Email Package) ───────↗                          Phase 5 (Testing)
```

Phase 1 and Phase 2 can run **in parallel** once both pre-requirements are met.

---

## 3. Budget & Infrastructure Constraints

### $0 Budget Reality

Every service in this plan must have a **free tier that covers pre-launch volume**. No exceptions.

| Service | Free Tier | Limit | Sufficient? |
|---|---|---|---|
| **Neon PostgreSQL** | Always Free | 0.5 GB storage, 190 compute hours/mo, scale-to-zero | Yes — waitlist data is <1MB even at 10K entries |
| **Resend** | Free | 3,000 emails/month, 1 custom domain, 100 emails/day | Yes — pre-launch sends ~50-200 emails/month |
| **Upstash Redis** | Free (already in stack) | 10K commands/day, 256MB | Unchanged — keeps rate limiting |
| **Vercel** | Hobby (free) | 100GB bandwidth, serverless functions | Unchanged — already deployed here |
| **Sentry** | Developer (free) | 5K errors/month | Unchanged |
| **PostHog** | Free | 1M events/month | Unchanged |
| **GitHub Actions** | Free | 2,000 minutes/month | Unchanged — CI/CD already runs here |

### Vercel Serverless Constraints

These constraints directly impact database and service client choices:

1. **No persistent connections:** Vercel functions are stateless and cold-start frequently. Use HTTP-based database drivers, not TCP connection pools.
2. **10s default / 60s max function timeout (Hobby):** All DB queries + email sends must complete within this window. Email sends are fire-and-forget (non-blocking), so only DB writes are in the critical path.
3. **No filesystem persistence:** `.waitlist-data.json` already works via Vercel's writable `/tmp`, but it resets on each cold start. This is why we're migrating to a real database.
4. **No cron jobs:** Use Vercel Cron (free, 1/day on Hobby) or on-access cleanup for expired deletion tokens.

### Database Choice: Neon (not Supabase)

**Why Neon over Supabase:**
- Neon provides a **serverless HTTP driver** (`@neondatabase/serverless`) purpose-built for Vercel edge/serverless — no TCP connection pooling needed
- True scale-to-zero (no compute charges when idle)
- Direct PostgreSQL wire protocol over WebSocket when needed
- Supabase's free tier also works but requires `supabase-js` client which adds bundle size and auth complexity we don't need

**Why not extend Upstash Redis:**
- Redis is great for rate limiting and caching (already used), but waitlist data is relational (referral chains, position ordering, email logs with status tracking)
- SQL queries for "move all positions above X down by N" or "join email_delivery_logs with waitlist_entries" would be painful in Redis
- Upstash has a `@upstash/redis` REST client that works in serverless, but the data model doesn't fit

### GitHub Actions Integration

The existing CI pipeline (`pnpm validate:all`) already runs type-check, lint, test, and build across all workspaces. Adding `packages/email`:
- Turborepo auto-discovers it via `pnpm-workspace.yaml`
- `turbo.json` dependency graph handles build ordering (`@diboas/email` builds before `apps/web`)
- No new GitHub Actions workflow needed — the existing pipeline covers it
- Database migrations: run manually via Neon console or a one-time script (not via CI, since schema changes are rare and should be reviewed)

---

## 4. 12 Principles Compliance Map

Every implementation decision mapped to the 12 Principles of Excellence from `docs/coding-standards.md`.

### Principle 1: Domain-Driven Design (DDD)

| Decision | How It Complies |
|---|---|
| `packages/email` as a separate package | Clear domain boundary — email is its own bounded context |
| `apps/web/src/lib/database/` for DB layer | Database layer is co-located with the waitlist domain in `apps/web` |
| Email events communicated via `ApplicationEventBus` | Cross-domain communication via events, not direct coupling |
| No direct calls from email package to waitlist store | Email service receives pre-decrypted data, doesn't query the DB itself |

### Principle 2: Event-Driven Architecture

| Decision | How It Complies |
|---|---|
| **New event types** added to `ApplicationEventBus` | All email lifecycle state changes emit events |
| Email send success/failure logged as events | Audit trail for every email operation |
| Webhook delivery events emit through event bus | External state changes (bounces, complaints) flow through the event system |

**New `ApplicationEventType` entries to add:**

```typescript
// Email Events
EMAIL_SEND_INITIATED = 'email:sendInitiated',
EMAIL_SEND_SUCCESS = 'email:sendSuccess',
EMAIL_SEND_FAILED = 'email:sendFailed',
EMAIL_DELIVERED = 'email:delivered',
EMAIL_BOUNCED = 'email:bounced',
EMAIL_UNSUBSCRIBED = 'email:unsubscribed',
```

**New `EmailEventPayload` interface:**

```typescript
export interface EmailEventPayload extends ApplicationEventPayload {
  source: 'email';
  template: EmailTemplate;
  recipientHash: string; // SHA256 of email, not raw PII
  providerId?: string;   // Resend message ID
  error?: string;
}
```

**Validation schema entries:**

```typescript
[ApplicationEventType.EMAIL_SEND_INITIATED]: ['source', 'template', 'recipientHash'],
[ApplicationEventType.EMAIL_SEND_SUCCESS]: ['source', 'template', 'recipientHash', 'providerId'],
[ApplicationEventType.EMAIL_SEND_FAILED]: ['source', 'template', 'recipientHash'],
[ApplicationEventType.EMAIL_DELIVERED]: ['source', 'template', 'recipientHash', 'providerId'],
[ApplicationEventType.EMAIL_BOUNCED]: ['source', 'template', 'recipientHash', 'providerId'],
[ApplicationEventType.EMAIL_UNSUBSCRIBED]: ['source', 'recipientHash'],
```

### Principle 3: Service Agnostic Abstraction

| Decision | How It Complies |
|---|---|
| `IEmailService` interface | Swap Resend for SES, SendGrid, or Mailgun without changing call sites |
| `ResendProvider` implements the interface | Provider-specific code is isolated in one file |
| Factory function creates the singleton | Consumer code never imports the provider directly |
| `IWaitlistStore` interface for DB layer | Swap Neon for Supabase/Turso/file-store by changing one file |

### Principle 4: Code Reusability & DRY

| Decision | How It Complies |
|---|---|
| Shared `layout.tsx` template wrapper | Header, footer, legal text, brand colors written once |
| `EmailServiceConfig` reused across all templates | From address, reply-to, unsubscribe URL defined once |
| Reuse existing `CircuitBreaker` for Resend | Same utility already built for Kit.com — swap target, not code |
| Reuse existing encryption utils for DB PII | `encryptPII`/`decryptPII` already in `lib/security/` |

### Principle 5: Semantic Naming

| Item | Name | Pattern |
|---|---|---|
| Service | `EmailDeliveryService` | [Domain][Entity][Action]Service |
| Provider | `ResendEmailProvider` | [Provider][Domain]Provider |
| Interface | `IEmailService` | I[Domain]Service |
| Template | `WaitlistWelcomeEmailTemplate` | [Domain][Entity][Type]Template |
| DB table | `waitlist_entries` | domain_entity (snake_case, plural) |
| DB table | `email_delivery_logs` | domain_entity (snake_case, plural) |
| Constants | `MAX_EMAIL_RETRY_ATTEMPTS` | SCREAMING_SNAKE_CASE with context |
| Constants | `EMAIL_CIRCUIT_BREAKER_THRESHOLD` | SCREAMING_SNAKE_CASE with context |
| Event | `EMAIL_SEND_SUCCESS` | SCREAMING_SNAKE_CASE |

### Principle 6: File Decoupling & Organization

| Constraint | Enforcement |
|---|---|
| Services ≤ 200 lines | `EmailDeliveryService.ts` handles only orchestration (~80 lines). Provider logic in separate file. |
| Components ≤ 150 lines | Each email template is a single-purpose render function (~60-80 lines) |
| Utilities ≤ 100 lines | `client.ts` (DB client) ~50 lines, `config.ts` (email config) ~30 lines |
| Single responsibility per file | `types.ts` (types only), `config.ts` (config only), `ResendProvider.ts` (API calls only) |
| Template per file | One template per `.tsx` file, shared layout in `layout.tsx` |

**File size budget:**

```
packages/email/src/
  types.ts                  ~60 lines   (types only)
  config.ts                 ~30 lines   (config from env vars)
  EmailDeliveryService.ts   ~120 lines  (interface + factory + orchestration)
  providers/
    ResendProvider.ts       ~100 lines  (Resend SDK wrapper)
  templates/
    layout.tsx              ~80 lines   (shared wrapper)
    welcome.tsx             ~70 lines   (template + translations)
    position-update.tsx     ~60 lines   (template + translations)
    referral-success.tsx    ~60 lines   (template + translations)
    deletion-confirmation.tsx ~50 lines (template + translations)

apps/web/src/lib/database/
  client.ts                 ~50 lines   (Neon HTTP client + health check)
  schema.ts                 ~40 lines   (table type definitions)
  store.ts                  ~180 lines  (rewritten, was ~200 with file I/O)
```

### Principle 7: Error Handling & System Recovery

| Pattern | Implementation |
|---|---|
| **Circuit Breaker** | Reuse existing `CircuitBreaker` class for Resend API calls (3 failures → open, 60s timeout) |
| **Retry with backoff** | Resend provider retries transient failures (429, 5xx) with exponential backoff, max 2 retries |
| **Graceful degradation** | Email send failure does NOT block signup/referral/deletion — same pattern as current Kit.com sync |
| **Fallback strategy** | If Resend circuit opens, emails queue in `email_delivery_logs` with status `queued` for manual retry |
| **Correlation IDs** | Every email send carries `correlationId` from the originating API request for tracing |
| **Never crash** | All email operations wrapped in try-catch, errors emit `APPLICATION_ERROR` event |

**Circuit breaker instance for Resend:**

```typescript
const resendCircuitBreaker = new CircuitBreaker({
  name: 'resend-api',
  failureThreshold: 3,
  resetTimeoutMs: 60_000,
  successThreshold: 2,
});
```

### Principle 8: Security & Audit

| Requirement | Implementation |
|---|---|
| Input validation | Email addresses validated before send (regex + domain check) |
| Parameterized queries | All DB queries use `$1, $2` placeholders (Neon HTTP driver) — no string concatenation |
| PII encryption at rest | Email and name encrypted with AES-256-GCM before INSERT (reuse existing `encryptPII`) |
| PII masking in logs | Event bus receives `recipientHash` (SHA256), never raw email |
| Rate limiting | All new endpoints use existing Upstash rate limiter presets |
| CSRF protection | Mutation endpoints validate Origin header (existing middleware) |
| Audit logging | Every email send/delivery/bounce logged in `email_delivery_logs` + event bus history |
| Unsubscribe HMAC | Unsubscribe tokens signed with `EMAIL_UNSUBSCRIBE_SECRET` (HMAC-SHA256, timing-safe comparison) |
| Webhook verification | Resend webhook signature verified with `svix` library (Resend's signing method) |

### Principle 9: Performance & SEO

| Requirement | Implementation |
|---|---|
| No client-side bundle impact | `@diboas/email` is server-only — never imported in client components |
| DB queries < 100ms | Neon serverless with HTTP driver, indexed columns, simple queries |
| Fire-and-forget email sends | `sendWelcomeEmail().catch()` — doesn't block API response |
| No cold-start penalty | Neon HTTP driver doesn't maintain TCP connections, no pool warmup |
| Bundle size | `resend` SDK is ~5KB, only loaded server-side in API routes |

### Principle 10: Product KPIs & Analytics

| Metric | How Tracked |
|---|---|
| Email send success rate | `email_delivery_logs` status column + event bus events |
| Email open rate | Resend webhook `email.opened` → `email_delivery_logs.opened_at` |
| Email bounce rate | Resend webhook `email.bounced` → event bus `EMAIL_BOUNCED` |
| Unsubscribe rate | `email:unsubscribed` event count / total subscribers |
| Time-to-send | Event bus timestamp diff between `EMAIL_SEND_INITIATED` and `EMAIL_SEND_SUCCESS` |

### Principle 11: Concurrency & Race Conditions

| Scenario | Prevention |
|---|---|
| **Concurrent signups with same email** | `UNIQUE` constraint on `waitlist_entries.email` + `ON CONFLICT DO NOTHING` — DB handles atomically |
| **Concurrent referral processing** | `UPDATE ... SET position = GREATEST(1, position - $1) WHERE referral_code = $2 RETURNING *` — single atomic SQL statement |
| **Counter increment race** | `UPDATE waitlist_counters SET value = value + 1 WHERE key = 'position' RETURNING value` — atomic increment |
| **Concurrent deletion token creation** | `INSERT ... ON CONFLICT (token_hash) DO NOTHING` — idempotent |
| **Double email send** | Idempotency key in `email_delivery_logs` — check before send: `INSERT ... ON CONFLICT DO NOTHING` + `SELECT` |
| **File store concurrent writes** | Eliminated — PostgreSQL replaces file I/O entirely |

### Principle 12: Monitoring & Observability

| Requirement | Implementation |
|---|---|
| Health check | `/api/health/ready` checks DB connectivity (`SELECT 1`) + Redis ping |
| Structured logging | All email operations logged via `Logger.info/warn/error` with context objects |
| Error tracking | Sentry captures email send failures (existing integration, no new code) |
| Event bus audit trail | All 6 new email events stored in `ApplicationEventBus.eventHistory` (500-event rolling buffer) |
| Provider availability | Circuit breaker state exposed in health check: `emailProvider: circuitState` |

---

## 5. Scope

### What Gets Built

| Deliverable | Description |
|---|---|
| Database schema + client | `waitlist_entries` + `email_delivery_logs` tables, Neon serverless HTTP driver (raw SQL via tagged templates) |
| `packages/email` | Email service abstraction, Resend provider, 4 templates |
| API route updates | Trigger emails from signup, referral, deletion flows |
| Unsubscribe endpoint | `/api/email/unsubscribe` for CAN-SPAM/GDPR compliance |
| Health check update | Database connectivity in readiness probe |

### What Gets Removed

| Removal | Files Affected |
|---|---|
| `syncToKit()` function | `app/api/waitlist/signup/route.ts` |
| Kit.com webhook route | `app/api/webhooks/kit/route.ts` (delete) |
| `KIT_CONFIG` | `config/env.ts` |
| Kit.com env vars | `.env.example` |
| `kitSubscriberId` field | `WaitlistEntry` interface |
| Circuit breaker for Kit.com | **Repurposed** for Resend API (same `CircuitBreaker` class, new instance name `resend-api`) |

### What Stays Unchanged

| Feature | Reason |
|---|---|
| All API route signatures and responses | Zero client-side changes |
| Waitlist form components | Same POST endpoint, same response shape |
| Rate limiting, CSRF, encryption, idempotency | Security layer untouched |
| Event bus emissions | Audit trail stays intact |
| Referral system logic | Same business rules, different persistence |
| GDPR deletion flow | Same token-based approach, stored in DB instead of memory |
| Stats endpoint | Same response, reads from DB instead of file |

---

## 6. Architecture

### Before (Current)

```
User Signup
  → POST /api/waitlist/signup
    → Add to file store (.waitlist-data.json)
    → syncToKit() [async, circuit breaker]
      → Kit.com API [external]
        → webhook back to /api/webhooks/kit
          → update file store
```

### After (Tier 2)

```
User Signup
  → POST /api/waitlist/signup
    → Insert into PostgreSQL (waitlist_entries)
    → sendWelcomeEmail() [async, non-blocking]
      → Resend API [external, circuit breaker]
        → Log to email_delivery_logs table

Referral Credited
  → POST /api/waitlist/referral
    → Update PostgreSQL (position, referralCount)
    → sendReferralSuccessEmail() [async, non-blocking]
      → Resend API → email_delivery_logs

GDPR Deletion
  → DELETE /api/waitlist/delete
    → Delete from PostgreSQL
    → sendDeletionConfirmationEmail() [async, non-blocking]
      → Resend API → email_delivery_logs
```

### Package Structure

```
packages/email/
  package.json                          # @diboas/email
  tsup.config.ts                        # Build config (CJS + ESM + types)
  src/
    index.ts                            # Public API barrel export
    types.ts                            # EmailPayload, DeliveryResult, EmailTemplate
    config.ts                           # Provider config, from address, reply-to
    EmailService.ts                     # Interface + singleton factory
    providers/
      ResendProvider.ts                 # Resend API implementation
      index.ts                          # Provider barrel export
    templates/
      layout.tsx                        # Shared branding wrapper (header, footer, legal)
      welcome.tsx                       # Signup confirmation
      position-update.tsx               # Position change notification
      referral-success.tsx              # Referral credited
      deletion-confirmation.tsx         # GDPR erasure confirmation
      index.ts                          # Template barrel export
    __tests__/
      EmailService.test.ts             # Unit tests
      templates.test.ts                # Template render tests
```

### Database Schema

```
apps/web/src/lib/database/
  client.ts                             # Database client (connection pool)
  schema.ts                             # Table definitions
  migrations/
    001_waitlist_entries.sql             # Main waitlist table
    002_email_delivery_logs.sql                   # Email delivery tracking
    003_deletion_tokens.sql             # GDPR deletion tokens (replaces in-memory)
```

---

## 7. Implementation Phases

| Phase | Name | Effort | Dependencies |
|---|---|---|---|
| **Phase 1** | Database Migration | 1-2 days | Neon project created (free tier, ~5 min setup) |
| **Phase 2** | Email Package | 2-3 days | Resend account created |
| **Phase 3** | Integration | 1-2 days | Phase 1 + Phase 2 |
| **Phase 4** | Kit.com Removal | 0.5 day | Phase 3 verified |
| **Phase 5** | Testing & Validation | 1-2 days | Phase 4 complete |

**Total: 6-10 days**

---

## 8. Phase 1: Database Migration

### 8.1 Provision Database

**Neon PostgreSQL (free tier):**
- Create project at neon.tech (GitHub SSO)
- Free tier: 0.5 GB storage, 190 compute hours/month, scale-to-zero
- Region: `aws-eu-central-1` (closest to existing Sentry `de.sentry.io` region)
- Get connection string: `postgresql://user:pass@ep-xxxx.eu-central-1.aws.neon.tech/diboas?sslmode=require`

### 8.2 Create Database Client

**New file:** `apps/web/src/lib/database/client.ts`

```typescript
// Uses @neondatabase/serverless — HTTP-based driver, no TCP connections
// Perfect for Vercel serverless: no connection pooling needed
// Exports: sql (tagged template), neonClient, pingDatabase()
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function pingDatabase(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export { sql };
```

**Key requirements:**
- HTTP-based driver (no TCP pool, Vercel-compatible)
- SSL enforced via connection string (`sslmode=require`)
- Query timeout inherits from Vercel function timeout (10s default)
- Error handling with retry for transient failures (Neon cold-start can add ~200ms)

### 8.3 Create Schema

**New file:** `apps/web/src/lib/database/migrations/001_waitlist_entries.sql`

```sql
CREATE TABLE waitlist_entries (
  id                TEXT PRIMARY KEY,                -- Format: wl_{timestamp}_{counter}
  email             TEXT NOT NULL UNIQUE,             -- Encrypted (AES-256-GCM)
  name              TEXT,                              -- Encrypted (AES-256-GCM)
  x_account         TEXT,
  position          INTEGER NOT NULL,
  original_position INTEGER NOT NULL,
  referral_code     TEXT NOT NULL UNIQUE,
  referred_by       TEXT,                              -- Referral code of referrer
  referral_count    INTEGER NOT NULL DEFAULT 0,
  locale            TEXT NOT NULL DEFAULT 'en',
  source            TEXT NOT NULL DEFAULT 'direct',    -- WaitlistSource enum
  tags              TEXT[] DEFAULT '{}',
  gdpr_accepted     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist_entries(email);
CREATE INDEX idx_waitlist_referral_code ON waitlist_entries(referral_code);
CREATE INDEX idx_waitlist_position ON waitlist_entries(position);
CREATE INDEX idx_waitlist_created_at ON waitlist_entries(created_at DESC);

-- Position counter (replaces in-memory counter)
CREATE TABLE waitlist_counters (
  key               TEXT PRIMARY KEY,
  value             INTEGER NOT NULL DEFAULT 0
);

INSERT INTO waitlist_counters (key, value) VALUES ('position', 847);
INSERT INTO waitlist_counters (key, value) VALUES ('entry_id', 0);
```

**New file:** `apps/web/src/lib/database/migrations/002_email_delivery_logs.sql`

```sql
CREATE TABLE email_delivery_logs (
  id                TEXT PRIMARY KEY,                  -- Format: eml_{timestamp}_{random}
  recipient_email   TEXT NOT NULL,                      -- Encrypted (AES-256-GCM)
  template          TEXT NOT NULL,                      -- Template name
  subject           TEXT NOT NULL,
  locale            TEXT NOT NULL DEFAULT 'en',
  status            TEXT NOT NULL DEFAULT 'sent',       -- sent, delivered, bounced, failed
  provider_id       TEXT,                                -- Resend message ID
  error_message     TEXT,                                -- If failed
  metadata          JSONB DEFAULT '{}',                  -- Template-specific data
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at      TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ
);

CREATE INDEX idx_email_delivery_logs_recipient ON email_delivery_logs(recipient_email);
CREATE INDEX idx_email_delivery_logs_template ON email_delivery_logs(template);
CREATE INDEX idx_email_delivery_logs_status ON email_delivery_logs(status);
CREATE INDEX idx_email_delivery_logs_sent_at ON email_delivery_logs(sent_at DESC);
```

**New file:** `apps/web/src/lib/database/migrations/003_deletion_tokens.sql`

```sql
CREATE TABLE deletion_tokens (
  token_hash        TEXT PRIMARY KEY,                   -- SHA256 of token
  email             TEXT NOT NULL,                       -- Encrypted (AES-256-GCM)
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deletion_tokens_expires ON deletion_tokens(expires_at);

-- Auto-cleanup: delete expired tokens (run via cron or on-access)
```

### 8.4 Rewrite Store

**Modify:** `apps/web/src/lib/waitingList/store.ts`

Replace file I/O with database queries. The public API stays identical:

| Function | Current | After |
|---|---|---|
| `addEntry(input)` | Write to JSON file | `INSERT INTO waitlist_entries` |
| `getByEmail(email)` | In-memory Map lookup | `SELECT ... WHERE email = $1` |
| `getByReferralCode(code)` | In-memory scan | `SELECT ... WHERE referral_code = $1` |
| `exists(email)` | Map.has() | `SELECT 1 WHERE email = $1` |
| `updateEntry(email, updates)` | Map.set() + file write | `UPDATE waitlist_entries SET ...` |
| `processReferral(email, spots)` | Map.set() + counter | `UPDATE ... SET referral_count = referral_count + 1, position = GREATEST(1, position - $2)` |
| `deleteByEmail(email)` | Map.delete() + file write | `DELETE FROM waitlist_entries WHERE email = $1` |
| `getTotalCount()` | Map.size | `SELECT COUNT(*) FROM waitlist_entries` |
| `getCurrentPositionCounter()` | In-memory counter | `SELECT value FROM waitlist_counters WHERE key = 'position'` |

**Encryption stays the same:** Email and name encrypted with AES-256-GCM before INSERT, decrypted after SELECT.

### 8.5 Update Health Check

**Modify:** `apps/web/src/app/api/health/ready/route.ts`

Add database connectivity check alongside Redis:

```typescript
checks: {
  redis: boolean,
  database: boolean    // NEW
}
```

### 8.6 Migrate Deletion Tokens

**Modify:** `apps/web/src/app/api/waitlist/delete/route.ts`

Replace in-memory `pendingDeletions` Map with `deletion_tokens` table:
- `POST` (request deletion): INSERT token hash + encrypted email + expires_at
- `DELETE` (confirm deletion): SELECT by token_hash, check expiry, delete entry + token
- Auto-cleanup: DELETE expired tokens on each request (same 10% random trigger)

---

## 9. Phase 2: Email Package

### 9.1 Package Setup

**New file:** `packages/email/package.json`

```json
{
  "name": "@diboas/email",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "resend": "^4.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.2.0"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  }
}
```

**New file:** `packages/email/tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react'],
});
```

### 9.2 Types

**New file:** `packages/email/src/types.ts`

```typescript
export type EmailTemplate =
  | 'welcome'
  | 'position-update'
  | 'referral-success'
  | 'deletion-confirmation';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
  headers?: Record<string, string>;    // List-Unsubscribe
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  apiKey: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  unsubscribeUrl: string;
}

// Template-specific payloads
export interface WelcomeEmailData {
  name?: string;
  position: number;
  referralCode: string;
  referralUrl: string;
  locale: string;
}

export interface PositionUpdateEmailData {
  name?: string;
  oldPosition: number;
  newPosition: number;
  spotsGained: number;
  locale: string;
}

export interface ReferralSuccessEmailData {
  name?: string;
  referralCount: number;
  newPosition: number;
  locale: string;
}

export interface DeletionConfirmationEmailData {
  locale: string;
}
```

### 9.3 Email Service

**New file:** `packages/email/src/EmailService.ts`

```typescript
// Interface-based (Service Agnostic Abstraction principle)
export interface IEmailService {
  send(payload: EmailPayload): Promise<DeliveryResult>;
  sendWelcome(to: string, data: WelcomeEmailData): Promise<DeliveryResult>;
  sendPositionUpdate(to: string, data: PositionUpdateEmailData): Promise<DeliveryResult>;
  sendReferralSuccess(to: string, data: ReferralSuccessEmailData): Promise<DeliveryResult>;
  sendDeletionConfirmation(to: string, data: DeletionConfirmationEmailData): Promise<DeliveryResult>;
}
```

Factory function creates the singleton, injecting the provider. This follows the Service Agnostic Abstraction principle -- swap Resend for SES or SendGrid without changing any call sites.

### 9.4 Resend Provider

**New file:** `packages/email/src/providers/ResendProvider.ts`

- Wraps the Resend SDK
- Maps `EmailPayload` to Resend's API format
- Returns `DeliveryResult` with `messageId` on success
- Handles rate limits (Resend: 10 req/s on free tier)
- Logs errors without throwing (non-blocking pattern, same as current Kit.com sync)

### 9.5 Email Templates

All templates are **React components** rendered to HTML strings. They support all 4 locales via a simple translations object (not react-intl, since these render server-side outside of React context).

**New file:** `packages/email/src/templates/layout.tsx`

Shared wrapper:
- diBoaS logo header
- Content slot
- Footer with: unsubscribe link, physical address (CAN-SPAM), privacy policy link, copyright
- Inline CSS (email clients don't support external stylesheets)
- Brand colors from design tokens (#14b8a6 primary, #0f172a text)
- Responsive: single-column, 600px max-width

**New file:** `packages/email/src/templates/welcome.tsx`

Content:
- Subject: "Welcome to diBoaS -- You're #{position} on the waitlist"
- Greeting with name (or "there" if no name)
- Position number (prominent)
- Referral section: "Share your link, move up the list" with referral URL
- What to expect next
- CTA: "Check Your Position" linking to website

**New file:** `packages/email/src/templates/position-update.tsx`

Content:
- Subject: "You moved up! New position: #{newPosition}"
- Old position -> new position (visual)
- Spots gained via referral
- CTA: "Keep sharing to move up"

**New file:** `packages/email/src/templates/referral-success.tsx`

Content:
- Subject: "Someone joined through your link!"
- New referral count
- Current position
- CTA: "Share again" with referral URL

**New file:** `packages/email/src/templates/deletion-confirmation.tsx`

Content:
- Subject: "Your data has been deleted"
- Confirmation that all PII was removed
- What was deleted (email, name, position data)
- Contact link if questions
- No CTA (respect the user's decision to leave)

### 9.6 Locale Support

Each template has a translations object:

```typescript
const translations = {
  en: {
    subject: "Welcome to diBoaS -- You're #{position} on the waitlist",
    greeting: "Hey {name}",
    // ...
  },
  'pt-BR': {
    subject: "Bem-vindo ao diBoaS -- Voc\u00ea \u00e9 o #{position} na lista de espera",
    greeting: "Ol\u00e1 {name}",
    // ...
  },
  es: { /* ... */ },
  de: { /* ... */ },
};
```

This is intentionally simpler than the full `@diboas/i18n` system. Email templates are server-rendered strings -- they don't need React context, IntlProvider, or hooks. A flat translations object per template keeps it simple and self-contained.

### 9.7 Compliance Headers

Every email includes:
- `List-Unsubscribe: <https://diboas.com/api/email/unsubscribe?token={token}>`
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058)
- Physical address in footer (BRAND_CONFIG.ADDRESS)
- Privacy policy link

---

## 10. Phase 3: Integration

### 10.1 Add Email Sends to Signup

**Modify:** `apps/web/src/app/api/waitlist/signup/route.ts`

Replace `syncToKit()` with `sendWelcomeEmail()`:

```typescript
// BEFORE (current):
// Fire-and-forget Kit.com sync
syncToKit(entry).catch(() => {});

// AFTER:
// Fire-and-forget welcome email
import { emailService } from '@diboas/email';

emailService.sendWelcome(decryptedEmail, {
  name: decryptedName,
  position: entry.position,
  referralCode: entry.referralCode,
  referralUrl: generateReferralUrl(APP_URL, entry.referralCode),
  locale: entry.locale,
}).catch((error) => {
  // Log but don't fail the signup
  applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
    source: 'waitlist-signup',
    metadata: { error: 'welcome_email_failed', message: error.message },
  });
});
```

Same pattern as current Kit.com sync: async, non-blocking, errors logged but don't affect user response.

### 10.2 Add Email to Referral Processing

**Modify:** `apps/web/src/app/api/waitlist/referral/route.ts`

After `processReferral()` succeeds:

```typescript
// Send notification to the referrer
emailService.sendReferralSuccess(referrerEmail, {
  name: referrerName,
  referralCount: updatedEntry.referralCount,
  newPosition: updatedEntry.position,
  locale: updatedEntry.locale,
}).catch(() => {});

// Send position update to the referrer
emailService.sendPositionUpdate(referrerEmail, {
  name: referrerName,
  oldPosition: previousPosition,
  newPosition: updatedEntry.position,
  spotsGained: REFERRAL_SPOTS,
  locale: updatedEntry.locale,
}).catch(() => {});
```

### 10.3 Add Email to GDPR Deletion

**Modify:** `apps/web/src/app/api/waitlist/delete/route.ts`

After successful deletion confirmation:

```typescript
// Send deletion confirmation (use locale from the deleted entry, before it's gone)
emailService.sendDeletionConfirmation(decryptedEmail, {
  locale: deletedEntry.locale,
}).catch(() => {});
```

### 10.4 Log All Emails

Every `emailService.send*()` call logs to the `email_delivery_logs` table:
- Before send: INSERT with status `sent`
- On Resend success: UPDATE with `provider_id` (Resend message ID)
- On Resend failure: UPDATE with status `failed`, `error_message`
- On Resend webhook (delivery): UPDATE with `delivered_at` timestamp

### 10.5 Create Unsubscribe Endpoint

**New file:** `apps/web/src/app/api/email/unsubscribe/route.ts`

```
GET /api/email/unsubscribe?token={token}
```

- Validates unsubscribe token (HMAC-signed email)
- Adds `email_unsubscribed` tag to waitlist entry
- Returns confirmation page (HTML)
- Rate limited: standard preset
- Idempotent: multiple clicks return same confirmation

### 10.6 Optional: Resend Webhook for Delivery Tracking

**New file:** `apps/web/src/app/api/webhooks/resend/route.ts`

```
POST /api/webhooks/resend
```

- Verifies Resend webhook signature
- Handles: `email.delivered`, `email.bounced`, `email.complained`
- Updates `email_delivery_logs` table with delivery status
- Adds `bounced` or `complained` tag to waitlist entry (suppression)

This is optional but recommended. Without it, you only know the email was sent, not whether it was delivered.

---

## 11. Phase 4: Kit.com Removal

### 11.1 Delete Files

| File | Action |
|---|---|
| `apps/web/src/app/api/webhooks/kit/route.ts` | DELETE |
| `apps/web/src/app/api/webhooks/kit/` directory | DELETE |

### 11.2 Remove from Signup Route

**Modify:** `apps/web/src/app/api/waitlist/signup/route.ts`

- Remove `syncToKit()` function (lines ~58-113)
- Remove Kit.com circuit breaker instance
- Remove Kit.com-related imports
- Remove `kitSubscriberId` from any response handling

### 11.3 Remove from Store

**Modify:** `apps/web/src/lib/waitingList/store.ts`

- Remove `kitSubscriberId` field from `WaitlistEntry` interface
- Remove `updateKitSubscriberId()` function
- Remove any Kit.com-specific update logic

### 11.4 Remove Configuration

**Modify:** `apps/web/src/config/env.ts`

- Remove entire `KIT_CONFIG` export
- Remove Kit.com env var references
- Add `EMAIL_CONFIG` and `DATABASE_URL` instead

**Modify:** `apps/web/.env.example`

- Remove all `KIT_*` variables
- Add `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`

### 11.5 Update Event Types

**Modify:** `apps/web/src/lib/events/ApplicationEventBus.ts`

- **Repurpose** `WEBHOOK_RECEIVED`, `WEBHOOK_PROCESSED`, `WEBHOOK_FAILED` for the Resend webhook (change `provider: 'kit'` to `provider: 'resend'` in call sites)
- **Add** 6 new email event types (see Section 4, Principle 2 for full definitions):
  - `EMAIL_SEND_INITIATED`, `EMAIL_SEND_SUCCESS`, `EMAIL_SEND_FAILED`
  - `EMAIL_DELIVERED`, `EMAIL_BOUNCED`, `EMAIL_UNSUBSCRIBED`
- **Add** `EmailEventPayload` interface and validation schema entries

### 11.6 Update Documentation

**Modify:** `CLAUDE.md`

- Remove Kit.com references from tech stack
- Add database and Resend to tech stack
- Update environment variables section

**Modify:** `apps/web/README.md`

- Update external services section

**Modify:** `apps/web/.env.example`

- Remove Kit.com section, add database and email sections

---

## 12. Phase 5: Testing & Validation

### 12.1 Unit Tests

**New file:** `packages/email/src/__tests__/EmailService.test.ts`

- Test: welcome email renders correctly for all 4 locales
- Test: position-update email renders with old/new position
- Test: referral-success email renders with count
- Test: deletion-confirmation email renders minimal content
- Test: provider handles Resend API errors gracefully
- Test: unsubscribe token generation and validation
- Test: List-Unsubscribe header is present on all emails
- Test: physical address is in every email footer

**New file:** `packages/email/src/__tests__/templates.test.ts`

- Test: each template renders valid HTML
- Test: subject lines include expected dynamic values
- Test: footer contains unsubscribe link and physical address
- Test: templates don't include PII in plain text (only in encrypted references)

### 12.2 API Route Tests

**Modify:** `apps/web/src/app/api/waitlist/__tests__/signup.test.ts`

- Test: signup triggers welcome email (mock emailService)
- Test: signup succeeds even if email send fails
- Test: duplicate signup does NOT send another welcome email

**New file:** `apps/web/src/app/api/waitlist/__tests__/referral.test.ts`

- Test: successful referral triggers referral-success email
- Test: referral email includes correct position data

**New file:** `apps/web/src/app/api/waitlist/__tests__/delete.test.ts`

- Test: confirmed deletion triggers deletion-confirmation email
- Test: deletion succeeds even if email send fails

**New file:** `apps/web/src/app/api/email/__tests__/unsubscribe.test.ts`

- Test: valid token marks user as unsubscribed
- Test: invalid token returns 400
- Test: expired token returns 410
- Test: already unsubscribed returns success (idempotent)

### 12.3 Database Tests

**New file:** `apps/web/src/lib/database/__tests__/store.test.ts`

- Test: addEntry creates row with encrypted email
- Test: getByEmail decrypts and returns entry
- Test: processReferral updates position and count atomically
- Test: deleteByEmail removes all PII
- Test: getTotalCount returns accurate count
- Test: concurrent writes don't corrupt data (optimistic locking)

### 12.4 Integration Tests

- Test: full signup flow (form submit -> API -> DB insert -> email sent)
- Test: full referral flow (signup with referral code -> referrer email sent)
- Test: full deletion flow (request -> token -> confirm -> delete -> email sent)
- Test: health/ready returns healthy when DB is connected
- Test: health/ready returns 503 when DB is down

### 12.5 Validation Checklist

- [ ] All 4 locales render email templates correctly
- [ ] Unsubscribe link works in all emails
- [ ] Physical address appears in all email footers
- [ ] PII is encrypted in database at rest
- [ ] Rate limiting works on all endpoints
- [ ] CSRF protection works on all mutation endpoints
- [ ] Idempotency works on signup
- [ ] GDPR deletion removes all traces from both tables
- [ ] Email logs track delivery status
- [ ] Health check includes database connectivity
- [ ] No Kit.com references remain in codebase
- [ ] All existing tests still pass
- [ ] `pnpm validate:all` passes
- [ ] `pnpm build` succeeds

---

## 13. File Change Manifest

### New Files (17)

```
packages/email/
  package.json
  tsup.config.ts
  src/
    index.ts
    types.ts
    config.ts
    EmailService.ts
    providers/
      ResendProvider.ts
      index.ts
    templates/
      layout.tsx
      welcome.tsx
      position-update.tsx
      referral-success.tsx
      deletion-confirmation.tsx
      index.ts
    __tests__/
      EmailService.test.ts
      templates.test.ts

apps/web/src/lib/database/
  client.ts
  schema.ts
  migrations/
    001_waitlist_entries.sql
    002_email_delivery_logs.sql
    003_deletion_tokens.sql

apps/web/src/app/api/email/
  unsubscribe/route.ts

apps/web/src/app/api/webhooks/
  resend/route.ts                       (optional: delivery tracking)
```

### Modified Files (13)

```
apps/web/src/lib/waitingList/store.ts             # File I/O -> Neon DB queries
apps/web/src/app/api/waitlist/signup/route.ts     # syncToKit -> sendWelcomeEmail (circuit breaker reused for Resend)
apps/web/src/app/api/waitlist/delete/route.ts     # In-memory tokens -> DB + send email
apps/web/src/app/api/waitlist/referral/route.ts   # Add referral email
apps/web/src/app/api/waitlist/position/route.ts   # File store -> DB queries
apps/web/src/app/api/waitlist/stats/route.ts      # File store -> DB queries
apps/web/src/app/api/health/ready/route.ts        # Add DB check + circuit breaker state
apps/web/src/lib/events/ApplicationEventBus.ts    # Add 6 email event types + EmailEventPayload
apps/web/src/config/env.ts                         # Remove KIT_CONFIG, add EMAIL/DB config
apps/web/.env.example                              # Update env vars
apps/web/package.json                              # Add @diboas/email + @neondatabase/serverless
CLAUDE.md                                          # Update tech stack
turbo.json                                         # Add packages/email to build
```

### Deleted Files (1)

```
apps/web/src/app/api/webhooks/kit/route.ts      # Full Kit.com webhook handler
```

---

## 14. Environment Variables

### Remove

```
KIT_API_BASE_URL
KIT_API_KEY
KIT_API_SECRET
KIT_FORM_ID
KIT_WEBHOOK_SECRET
NEXT_PUBLIC_KIT_FORM_ID
NEXT_PUBLIC_KIT_TAG_WAITLIST
NEXT_PUBLIC_KIT_TAG_PRELAUNCH
```

### Add

```
# Database (Neon free tier — $0)
DATABASE_URL=postgresql://user:pass@ep-xxxx.eu-central-1.aws.neon.tech/diboas?sslmode=require

# Email (Resend free tier — $0, 3,000 emails/month)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx          # Optional: delivery tracking
EMAIL_FROM_ADDRESS=hello@diboas.com
EMAIL_FROM_NAME=diBoaS
EMAIL_REPLY_TO=support@diboas.com
EMAIL_UNSUBSCRIBE_SECRET=<32-byte-hex>             # HMAC key for unsubscribe tokens
```

### Keep (unchanged)

```
ENCRYPTION_KEY                  # Still used for PII encryption
INTERNAL_API_KEY                # Still used for admin endpoints
UPSTASH_REDIS_REST_URL          # Still used for rate limiting
UPSTASH_REDIS_REST_TOKEN        # Still used for rate limiting
```

---

## 15. Rollback Strategy

### If Database Migration Fails

- File-based store (`store.ts`) is not deleted until Phase 4 is verified
- Revert the store.ts changes to restore file-based persistence
- No data loss (database migration is additive, not destructive)

### If Email Sending Fails

- Email sends are async and non-blocking (same pattern as current Kit.com sync)
- Signup/referral/deletion flows succeed even if email fails
- Errors logged to event bus for monitoring
- Can re-enable Kit.com sync by restoring `syncToKit()` function

### If Full Rollback Needed

- Git revert to pre-migration commit
- Restore `.env` with Kit.com variables
- Restore `.waitlist-data.json` file
- No user-facing impact (client-side code is unchanged)

---

## 16. Acceptance Criteria

### Phase 1 Complete When

- [ ] Database provisioned and accessible
- [ ] All existing waitlist data migrated from file to database
- [ ] All 5 waitlist API routes work with database backend
- [ ] Health/ready endpoint checks database connectivity
- [ ] Encryption/decryption of PII works in database
- [ ] All existing tests pass with database backend

### Phase 2 Complete When

- [ ] `packages/email` builds successfully (`pnpm build`)
- [ ] All 4 email templates render valid HTML in all 4 locales
- [ ] Resend provider sends test emails successfully
- [ ] Unsubscribe tokens generate and validate correctly
- [ ] All email tests pass

### Phase 3 Complete When

- [ ] Signup triggers welcome email
- [ ] Referral triggers referral-success + position-update emails
- [ ] GDPR deletion triggers deletion-confirmation email
- [ ] Email delivery logged in email_delivery_logs table
- [ ] Unsubscribe endpoint works end-to-end
- [ ] All integration tests pass

### Phase 4 Complete When

- [ ] No Kit.com references in codebase (`grep -r "kit" --include="*.ts" --include="*.tsx"` returns only false positives)
- [ ] No Kit.com environment variables in `.env.example`
- [ ] Webhook route deleted
- [ ] `pnpm validate:all` passes
- [ ] `pnpm build` succeeds

### Phase 5 Complete When

- [ ] All unit, integration, and API tests pass
- [ ] Email renders verified in 4 locales
- [ ] Unsubscribe flow verified end-to-end
- [ ] GDPR deletion verified end-to-end (both tables cleared)
- [ ] Health checks verified (database + Redis)
- [ ] Documentation updated (CLAUDE.md, README, .env.example)
- [ ] No regressions in existing functionality
- [ ] `pnpm validate:all` passes (includes type-check, lint, test, build, tokens, translations)
- [ ] Circuit breaker for Resend verified (3 failures → open → 60s cooldown → half-open recovery)
- [ ] All 6 email events emitted and visible in ApplicationEventBus history
- [ ] Total monthly cost: $0

---

## 17. Code Standards Enforcement

Summary of specific coding standards from `CLAUDE.md` and `docs/coding-standards.md` that apply to this implementation, with enforcement rules.

### File Size Limits

| File | Max Lines | Actual (estimated) | Compliant |
|---|---|---|---|
| `EmailDeliveryService.ts` | 200 (service) | ~120 | Yes |
| `ResendProvider.ts` | 200 (service) | ~100 | Yes |
| `client.ts` | 100 (utility) | ~50 | Yes |
| `schema.ts` | 100 (utility) | ~40 | Yes |
| `store.ts` (rewritten) | 200 (service) | ~180 | Yes |
| Each template `.tsx` | 150 (component) | ~60-80 | Yes |
| `types.ts` | 100 (utility) | ~60 | Yes |
| `config.ts` | 100 (utility) | ~30 | Yes |

**Rule:** If any file exceeds its limit during implementation, split before merging.

### Naming Convention Verification

All names follow `docs/coding-standards.md` Principle 5:

- Services: `EmailDeliveryService` ✓ (`[Domain][Entity][Action]Service`)
- Provider: `ResendEmailProvider` ✓ (`[Provider][Domain]Provider`)
- DB tables: `waitlist_entries`, `email_delivery_logs`, `deletion_tokens` ✓ (`domain_entity`, snake_case, plural)
- Constants: `MAX_EMAIL_RETRY_ATTEMPTS`, `EMAIL_CIRCUIT_BREAKER_THRESHOLD` ✓ (`SCREAMING_SNAKE_CASE`)
- Functions: `sendWelcomeEmail`, `validateUnsubscribeToken` ✓ (`[verb][Entity][Condition]`)
- Events: `EMAIL_SEND_SUCCESS`, `EMAIL_BOUNCED` ✓ (`SCREAMING_SNAKE_CASE`)

### Dependencies Added

| Package | Purpose | Bundle Size | Server-only? |
|---|---|---|---|
| `@neondatabase/serverless` | DB client (HTTP driver) | ~8KB | Yes (API routes only) |
| `resend` | Email provider SDK | ~5KB | Yes (API routes only) |

**Note:** No client-side bundle impact. Both packages are only imported in `apps/web/src/app/api/` routes and `packages/email/` (server-side). Next.js tree-shakes them from the client bundle automatically.

### Race Condition Patterns Applied

Per `CLAUDE.md` Race Condition & Async Patterns section:

1. **No `useEffect` in this implementation** — all new code is server-side (API routes, DB client, email service)
2. **Atomic DB operations** — all counter increments and position updates use SQL `RETURNING` clause
3. **`ON CONFLICT` for idempotency** — duplicate email signup, duplicate deletion token, duplicate email send all handled at DB level
4. **No in-memory mutable state** — file-based store's `Map` + `positionCounter` replaced with DB queries (no shared mutable state between serverless invocations)
5. **Circuit breaker is instance-scoped** — safe in serverless (each cold start gets a fresh instance; worst case: slightly delayed circuit opening across invocations, which is acceptable)

### Security Checklist (Principle 8)

- [ ] All SQL queries parameterized (`$1`, `$2` — never string interpolation)
- [ ] PII encrypted before INSERT, decrypted after SELECT (AES-256-GCM via existing `encryptPII`)
- [ ] Email addresses in logs/events replaced with SHA256 hash
- [ ] Unsubscribe tokens HMAC-signed (timing-safe comparison)
- [ ] Resend webhook signature verified (svix library)
- [ ] Rate limiting on all new endpoints (existing Upstash presets)
- [ ] CSRF origin validation on all mutation endpoints (existing middleware)
- [ ] `DATABASE_URL` in `.env` only (never `NEXT_PUBLIC_`)
- [ ] `RESEND_API_KEY` in `.env` only (never `NEXT_PUBLIC_`)

### Testing Coverage Targets

Per `CLAUDE.md` Testing Requirements:

| Module | Target | Rationale |
|---|---|---|
| `packages/email/src/` (lib) | 80% | Core library code |
| `apps/web/src/lib/database/` (lib) | 80% | Database layer |
| `apps/web/src/lib/security/` (security) | 100% | Security utilities |
| Email templates (components) | 60% | Render tests for all 4 locales |
| API routes | 80% | Critical user-facing endpoints |

### Git Commit Convention

Per `docs/coding-standards.md`:

```
Phase 1: feat(database): migrate waitlist store from file to Neon PostgreSQL
Phase 2: feat(email): add @diboas/email package with Resend provider
Phase 3: feat(waitlist): integrate transactional emails into signup/referral/deletion
Phase 4: refactor(waitlist): remove Kit.com integration and all related code
Phase 5: test(email): add unit, integration, and e2e tests for email system
```
