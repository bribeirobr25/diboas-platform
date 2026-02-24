# Kit.com (ConvertKit) Replacement Analysis

**Date:** 2026-02-23
**Status:** Analysis complete
**Current integration:** Bi-directional, event-driven sync with circuit breaker failsafe

---

## Table of Contents

1. [Current Kit.com Role](#current-kitcom-role)
2. [What Is Already Self-Contained](#what-is-already-self-contained)
3. [Tier 1: Replace the CRM/Sync Layer Only (Small)](#tier-1-replace-the-crmsync-layer-only)
4. [Tier 2: Replace CRM + Add Transactional Email (Medium)](#tier-2-replace-crm--add-transactional-email)
5. [Tier 3: Full Email Marketing Platform Replacement (Large)](#tier-3-full-email-marketing-platform-replacement)
6. [Current Integration Map](#current-integration-map)
7. [Recommendation](#recommendation)

---

## Current Kit.com Role

Kit.com serves **two functions** in the current implementation:

### 1. Subscriber CRM (lightweight usage)

- Stores email + custom fields (position, referral code, locale, source)
- Tag-based segmentation (waitlist, prelaunch)
- Subscriber state tracking (active, unsubscribed, bounced)

### 2. Email Marketing (not yet active, but planned)

- Newsletter campaigns to waitlist subscribers
- Onboarding email sequences
- Position update notifications

---

## What Is Already Self-Contained

The following features work **independently of Kit.com** and require no replacement:

| Feature | Status | Notes |
|---|---|---|
| Waitlist signup flow | Self-contained | Local store is the source of truth |
| Position assignment and tracking | Self-contained | In-memory counter + file store |
| Referral system | Self-contained | Code generation, validation, position bumps |
| GDPR deletion (Art. 17) | Self-contained | Token-based erasure with 15-min TTL |
| Stats endpoint (social proof) | Self-contained | Reads from local store with env overrides |
| User experience when Kit.com is down | Self-contained | Circuit breaker ensures zero impact |

The architecture already treats Kit.com as a **non-critical, fire-and-forget sync**. The `syncToKit()` call in `signup/route.ts` is async and non-blocking -- if it fails, the user still gets a successful signup response.

---

## Tier 1: Replace the CRM/Sync Layer Only

**Scope:** Swap the Kit.com API calls for a proper database. Stop syncing to Kit.com entirely. Optionally keep Kit.com (or another tool) for email campaigns only.

**Effort:** 2-3 days for an experienced developer

### What Changes

| Action | File | Details |
|---|---|---|
| **Replace** | `lib/waitingList/store.ts` | Swap file-based JSON store for database (PostgreSQL, Supabase, or PlanetScale) |
| **Create** | `lib/database/client.ts` | Database client initialization and connection pooling |
| **Create** | `lib/database/migrations/001_waitlist.sql` | `waitlist_entries` table matching existing `WaitlistEntry` interface |
| **Modify** | `app/api/waitlist/signup/route.ts` | Remove `syncToKit()` call and circuit breaker import |
| **Modify** | `app/api/waitlist/position/route.ts` | Point queries to database instead of file store |
| **Modify** | `app/api/waitlist/stats/route.ts` | Point count queries to database |
| **Modify** | `app/api/waitlist/delete/route.ts` | Point deletion to database |
| **Modify** | `app/api/waitlist/referral/route.ts` | Point referral queries to database |
| **Delete** | `app/api/webhooks/kit/route.ts` | No longer needed without Kit.com sync |
| **Modify** | `app/api/health/ready/route.ts` | Add database connectivity check |
| **Modify** | `config/env.ts` | Remove `KIT_CONFIG`, add `DATABASE_URL` |
| **Modify** | `.env.example` | Remove Kit.com variables, add database variables |

### Database Schema

```sql
CREATE TABLE waitlist_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,           -- Encrypted (AES-256-GCM)
  name          TEXT,                            -- Encrypted (AES-256-GCM)
  x_account     TEXT,
  position      INTEGER NOT NULL,
  original_position INTEGER NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by   TEXT,                            -- Referral code of referrer
  referral_count INTEGER DEFAULT 0,
  locale        TEXT NOT NULL DEFAULT 'en',
  source        TEXT DEFAULT 'website',
  tags          TEXT[] DEFAULT '{}',
  gdpr_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON waitlist_entries(email);
CREATE INDEX idx_waitlist_referral_code ON waitlist_entries(referral_code);
CREATE INDEX idx_waitlist_position ON waitlist_entries(position);
```

### Files Summary

- **Files to modify:** 7
- **Files to create:** 2-3 (database client, migration, optional seed)
- **Files to delete:** 1 (webhook route)

### What You Keep

- All existing API route signatures and responses (zero client-side changes)
- All existing security measures (rate limiting, CSRF, encryption, idempotency)
- All existing event bus emissions (audit trail intact)
- All existing error handling (circuit breaker removed since no external API)

### What You Lose

- Automatic subscriber sync to Kit.com CRM
- Tag-based segmentation in Kit.com
- Ability to send email campaigns via Kit.com (unless you keep it as a separate manual export)

---

## Tier 2: Replace CRM + Add Transactional Email

**Scope:** Everything in Tier 1, plus send transactional emails in-house for key lifecycle events.

**Effort:** 1-2 weeks for an experienced developer (on top of Tier 1)

### What Changes (on top of Tier 1)

| Action | File | Details |
|---|---|---|
| **Create** | `lib/email/EmailService.ts` | Email service abstraction (interface + implementation) |
| **Create** | `lib/email/providers/ResendProvider.ts` | Resend API integration (or AWS SES / SendGrid) |
| **Create** | `lib/email/templates/welcome.tsx` | Welcome/confirmation email template |
| **Create** | `lib/email/templates/position-update.tsx` | Position change notification template |
| **Create** | `lib/email/templates/referral-success.tsx` | Referral credited notification template |
| **Create** | `lib/email/templates/deletion-confirmation.tsx` | GDPR deletion confirmation template |
| **Create** | `lib/email/templates/layout.tsx` | Shared email layout (header, footer, branding) |
| **Create** | `lib/email/types.ts` | Email interfaces and types |
| **Create** | `lib/email/config.ts` | Email service configuration |
| **Create** | `app/api/email/unsubscribe/route.ts` | Unsubscribe endpoint (CAN-SPAM / GDPR) |
| **Modify** | `app/api/waitlist/signup/route.ts` | Add welcome email send after signup |
| **Modify** | `app/api/waitlist/referral/route.ts` | Add referral notification email |
| **Modify** | `app/api/waitlist/delete/route.ts` | Add deletion confirmation email |
| **Create** | `lib/database/migrations/002_email_logs.sql` | Email delivery log table |
| **Modify** | `config/env.ts` | Add email provider config (API key, from address) |
| **Modify** | `.env.example` | Add email provider variables |

### Email Service Architecture

```
lib/email/
  EmailService.ts              # Interface + factory
  types.ts                     # EmailPayload, DeliveryStatus, etc.
  config.ts                    # Provider config, from address, reply-to
  providers/
    ResendProvider.ts           # Resend API implementation
    SESProvider.ts              # AWS SES implementation (optional)
  templates/
    layout.tsx                  # Shared branding wrapper
    welcome.tsx                 # Signup confirmation
    position-update.tsx         # Position changed
    referral-success.tsx        # Referral credited
    deletion-confirmation.tsx   # GDPR deletion done
```

### Email Service Interface

```typescript
interface EmailService {
  send(payload: EmailPayload): Promise<DeliveryResult>;
  sendBatch(payloads: EmailPayload[]): Promise<DeliveryResult[]>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;            // Plain text fallback
  replyTo?: string;
  tags?: string[];           // For tracking
  metadata?: Record<string, string>;
}
```

### Transactional Emails to Build

| Email | Trigger | Content |
|---|---|---|
| **Welcome** | Successful signup | Position number, referral link, what to expect |
| **Position Update** | Referral bumps position | New position, how many spots gained |
| **Referral Success** | Someone uses your code | Who referred, new referral count |
| **Deletion Confirmation** | GDPR erasure complete | Confirmation that data was deleted |

### Email Delivery Log Schema

```sql
CREATE TABLE email_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient   TEXT NOT NULL,                -- Encrypted
  template    TEXT NOT NULL,                -- Template name
  subject     TEXT NOT NULL,
  status      TEXT DEFAULT 'sent',          -- sent, delivered, bounced, failed
  provider_id TEXT,                          -- External message ID
  metadata    JSONB DEFAULT '{}',
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_status ON email_logs(status);
```

### Compliance Requirements

- **CAN-SPAM:** Physical address in footer, unsubscribe link, honor opt-outs within 10 days
- **GDPR:** Consent-based sending only (gdprAccepted field), right to erasure includes email logs
- **Unsubscribe:** One-click unsubscribe header (`List-Unsubscribe`), `/api/email/unsubscribe` endpoint

### Recommended Provider: Resend

- Simple API (3 lines per email)
- React email templates (JSX-based, matches existing stack)
- $0.001/email (first 3,000/month free)
- Built-in delivery tracking
- Webhook for bounce/complaint handling

### Files Summary

- **Files to create:** 8-10
- **Files to modify:** 4-5 (on top of Tier 1 changes)
- **New database table:** 1 (email_logs)

### What You Gain

- Full control over email timing and content
- No third-party dependency for transactional emails
- Email delivery logs in your own database
- Consistent branding via shared template layout
- Audit trail for compliance

### What You Still Lose (vs. Kit.com)

- Campaign/newsletter builder (compose + schedule + send to segments)
- Audience segmentation UI
- Open/click analytics dashboard
- Automation sequences (drip campaigns)
- A/B testing

---

## Tier 3: Full Email Marketing Platform Replacement

**Scope:** Everything in Tier 1 and Tier 2, plus replace Kit.com's campaign, newsletter, automation, and analytics capabilities.

**Effort:** 2-4 months for a small team (2-3 developers). **Not recommended for a pre-launch product.**

### What Changes (on top of Tier 2)

| Feature | Complexity | Description |
|---|---|---|
| **Campaign Builder** | High | Compose, preview, schedule, send to audience segments |
| **Audience Segmentation Engine** | High | Tag-based, behavior-based, time-based filtering |
| **Email Template Editor** | High | Drag-and-drop or WYSIWYG editor for non-developers |
| **Open/Click Tracking** | Medium | Tracking pixels for opens, link wrapping for clicks |
| **Engagement Analytics Dashboard** | Medium | Open rate, click rate, unsubscribe rate, heatmaps |
| **Automation Sequences** | High | Drip campaigns, trigger-based flows, delay nodes |
| **Bounce/Complaint Handling** | Medium | SNS webhooks (SES), suppression lists, reputation monitoring |
| **List Management** | Medium | Subscribe/unsubscribe, preference center, import/export |
| **A/B Testing** | Medium | Subject line splits, content variants, winner selection |
| **Deliverability Monitoring** | Medium | SPF/DKIM/DMARC setup, inbox placement tracking |
| **Admin Dashboard** | High | UI for all of the above |

### Architecture (Conceptual)

```
lib/email-marketing/
  campaigns/
    CampaignService.ts          # CRUD, scheduling, sending
    CampaignScheduler.ts        # Cron-based send queue
    CampaignAnalytics.ts        # Open/click aggregation
  audiences/
    AudienceService.ts          # Segment builder
    SegmentEngine.ts            # Query builder for filtering
  automation/
    AutomationService.ts        # Workflow engine
    TriggerEngine.ts            # Event-based triggers
    DelayQueue.ts               # Timed delays between steps
  tracking/
    TrackingPixel.ts            # Open tracking
    LinkWrapper.ts              # Click tracking
    EngagementService.ts        # Aggregate metrics
  templates/
    TemplateService.ts          # CRUD for email templates
    TemplateRenderer.ts         # Variable interpolation
  admin/
    [Dashboard pages]           # React admin UI
```

### Database Schema (Additional Tables)

```sql
-- Campaigns
CREATE TABLE campaigns (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  html        TEXT NOT NULL,
  text        TEXT,
  segment_id  UUID REFERENCES segments(id),
  status      TEXT DEFAULT 'draft',       -- draft, scheduled, sending, sent, cancelled
  scheduled_at TIMESTAMPTZ,
  sent_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audience Segments
CREATE TABLE segments (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  rules       JSONB NOT NULL,             -- Filter rules
  count       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Email Events (opens, clicks)
CREATE TABLE email_events (
  id          UUID PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id),
  event_type  TEXT NOT NULL,               -- open, click, bounce, complaint
  metadata    JSONB DEFAULT '{}',          -- link URL for clicks, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Workflows
CREATE TABLE automations (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  trigger     JSONB NOT NULL,              -- Event trigger definition
  steps       JSONB NOT NULL,              -- Array of steps (email, delay, condition)
  status      TEXT DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Suppression List
CREATE TABLE suppressions (
  email       TEXT PRIMARY KEY,
  reason      TEXT NOT NULL,               -- bounce, complaint, unsubscribe
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Why This Is Not Recommended

| Concern | Details |
|---|---|
| **ROI** | Building a mini Mailchimp has zero ROI for a pre-launch fintech product |
| **Time** | 2-4 months of development time diverted from core product |
| **Maintenance** | Email deliverability requires ongoing monitoring, IP warming, reputation management |
| **Compliance** | CAN-SPAM, GDPR, CCPA compliance for email marketing is complex |
| **Alternatives** | Resend ($20/mo), SendGrid ($20/mo), or Mailchimp ($13/mo) handle all of this |
| **Focus** | Engineering effort should go toward the banking/crypto/DeFi product, not email infrastructure |

### Cost Comparison

| Approach | Dev Cost | Monthly Cost | Maintenance |
|---|---|---|---|
| **Keep Kit.com** | $0 | $29/mo (Creator plan) | None |
| **Switch to Resend** (Tier 2) | 1-2 weeks | $0-20/mo | Low |
| **Build in-house** (Tier 3) | 2-4 months | $50-200/mo (infrastructure) | High |

---

## Current Integration Map

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│ User Signup (Client)                                        │
│ WaitingListModal -> useWaitlistModalForm Hook               │
└──────────────────────┬──────────────────────────────────────┘
                       │ POST /api/waitlist/signup
                       v
┌─────────────────────────────────────────────────────────────┐
│ Signup Route (Server)                                       │
│ 1. Validate & sanitize input                                │
│ 2. Check email not duplicate                                │
│ 3. Add to local store (source of truth)                     │
│ 4. Generate referral code                                   │
│ 5. Return success + position + referral URL                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ syncToKit() [async, non-blocking]
                       v
┌─────────────────────────────────────────────────────────────┐
│ Kit.com API (ConvertKit)                                    │
│ POST /v3/forms/{formId}/subscribe                           │
│ Sends: email, position, referral_code, locale, source       │
│ Protected by: CircuitBreaker (3 failures = 60s timeout)     │
└──────────────────────┬──────────────────────────────────────┘
                       │ (later) subscriber.created webhook
                       v
┌─────────────────────────────────────────────────────────────┐
│ Webhook Route: POST /api/webhooks/kit                       │
│ 1. Verify HMAC-SHA256 signature                             │
│ 2. Parse event type                                         │
│ 3. Update local store (kitSubscriberId, tags, fields)       │
│ 4. Emit event to ApplicationEventBus                        │
└─────────────────────────────────────────────────────────────┘
```

### Kit.com Custom Fields Mapping

| Local Field | Kit.com Field | Direction |
|---|---|---|
| `position` | `waitlist_position` | Outbound (signup) + Inbound (webhook) |
| `referralCode` | `referral_code` | Outbound (signup) |
| `referredBy` | `referred_by` | Outbound (signup) |
| `referralCount` | `referral_count` | Inbound (webhook) |
| `locale` | `locale` | Outbound (signup) |
| `source` | `signup_source` | Outbound (signup) |
| `xAccount` | `x_account` | Outbound (signup) |

### Webhook Events Handled

| Kit.com Event | Local Action |
|---|---|
| `subscriber.created` | Set `kitSubscriberId` on local entry |
| `subscriber.updated` | Sync custom fields (position, referralCount) back |
| `form.subscribe` | Same as `subscriber.created` |
| `subscriber.tag_added` | Append tag to local entry's `tags[]` |
| `subscriber.unsubscribed` | Add `'unsubscribed'` tag (entry NOT deleted) |
| `subscriber.tag_removed` | Logged only (tags not removed locally) |

### Files Involved

| File | Role |
|---|---|
| `apps/web/src/config/env.ts` | `KIT_CONFIG` object (API URL, form ID, API key, tags) |
| `apps/web/.env.example` | Kit.com environment variables documentation |
| `apps/web/src/app/api/waitlist/signup/route.ts` | `syncToKit()` outbound call with circuit breaker |
| `apps/web/src/app/api/webhooks/kit/route.ts` | Inbound webhook handler (HMAC verification, event routing) |
| `apps/web/src/lib/utils/CircuitBreaker.ts` | Circuit breaker protecting Kit.com API calls |
| `apps/web/src/lib/utils/fetchWithRetry.ts` | Retry logic for Kit.com API calls |
| `apps/web/src/lib/events/ApplicationEventBus.ts` | `WEBHOOK_RECEIVED`, `WEBHOOK_PROCESSED`, `WEBHOOK_FAILED` events |

---

## Recommendation

**Go with Tier 1 now. Add Tier 2 at launch. Skip Tier 3 entirely.**

### Why

1. **The architecture already makes Kit.com optional.** The circuit breaker and local store mean the product works without Kit.com today. The real gap is the file-based store, which won't survive server restarts in production -- that needs a database regardless.

2. **Transactional emails (Tier 2) become essential at launch** but can use a simple API like Resend (3 lines of code per email, JSX templates matching the existing React stack, $0.001/email) rather than building infrastructure.

3. **Campaign/newsletter features (Tier 3) are better served by a SaaS tool.** Building this in-house diverts 2-4 months of engineering from the core fintech product for zero competitive advantage. Kit.com ($29/mo), Resend ($20/mo), or Mailchimp ($13/mo) handle this at a fraction of the cost.

### Execution Path

| Phase | Timing | Scope | Effort |
|---|---|---|---|
| **Tier 1** | Now (pre-launch) | Database + remove Kit.com sync | 2-3 days |
| **Tier 2** | At launch | Add transactional emails via Resend | 1-2 weeks |
| **Tier 3** | Never (use SaaS) | Keep Resend/Kit.com for campaigns | $20-29/mo |
