# Waiting List - Backend Architecture Proposal

> **Status**: Future Implementation
> **Created**: 2024-11-16
> **Purpose**: Backend integration guide for when frontend is complete

---

## Overview

This document outlines the backend architecture for the Waiting List feature, following DDD, Event-driven, and Service Agnostic Abstraction patterns. The frontend is designed to swap from LocalStorage to API with minimal changes.

---

## Domain Model

### Aggregates & Value Objects

```typescript
// Domain Types
interface WaitingListSubmission {
  id: string;
  email: string;
  name?: string;
  xAccount?: string;
  consent: ConsentRecord;
  locale: 'en' | 'pt-BR' | 'es' | 'de';
  submittedAt: Date;
  source: 'marketing_site' | 'app_intercept';
  metadata: SubmissionMetadata;
}

interface ConsentRecord {
  gdprAccepted: boolean;
  jurisdiction: 'EU' | 'US' | 'BR' | 'OTHER';
  timestamp: Date;
  ipCountry?: string;
  consentVersion: string;
  privacyPolicyVersion: string;
  consentText: string; // Exact text user agreed to
}

interface SubmissionMetadata {
  userAgent: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}
```

### Domain Events

```typescript
type WaitingListEvent =
  | { type: 'WAITING_LIST_SUBMISSION_CREATED'; payload: WaitingListSubmission }
  | { type: 'WAITING_LIST_EMAIL_VERIFIED'; payload: { id: string; verifiedAt: Date } }
  | { type: 'WAITING_LIST_CONSENT_RECORDED'; payload: ConsentRecord }
  | { type: 'WAITING_LIST_DUPLICATE_DETECTED'; payload: { email: string } };
```

---

## Repository Interface

```typescript
// This interface is already implemented in frontend
// Backend just needs to implement this contract

interface WaitingListRepository {
  submit(submission: WaitingListSubmission): Promise<SubmissionResult>;
  checkEmailExists(email: string): Promise<boolean>;
  getByEmail(email: string): Promise<WaitingListSubmission | null>;
}

interface SubmissionResult {
  success: boolean;
  id?: string;
  error?: string;
  isDuplicate?: boolean;
}
```

---

## API Endpoints

### POST /api/waiting-list

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "xAccount": "@johndoe",
  "consent": {
    "gdprAccepted": true,
    "jurisdiction": "EU",
    "timestamp": "2024-11-16T10:30:00Z",
    "consentVersion": "1.0.0",
    "privacyPolicyVersion": "2024.1"
  },
  "locale": "en",
  "source": "marketing_site"
}
```

**Response (Success):**
```json
{
  "success": true,
  "id": "wl_abc123",
  "message": "Successfully added to waiting list"
}
```

**Response (Duplicate):**
```json
{
  "success": false,
  "error": "EMAIL_ALREADY_EXISTS",
  "isDuplicate": true
}
```

### GET /api/waiting-list/check?email={email}

**Response:**
```json
{
  "exists": true
}
```

---

## Database Schema (PostgreSQL)

```sql
CREATE TABLE waiting_list_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  x_account VARCHAR(50),
  locale VARCHAR(10) NOT NULL,
  source VARCHAR(50) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES waiting_list_submissions(id),
  gdpr_accepted BOOLEAN NOT NULL,
  jurisdiction VARCHAR(10) NOT NULL,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_country VARCHAR(10),
  consent_version VARCHAR(20) NOT NULL,
  privacy_policy_version VARCHAR(20) NOT NULL,
  consent_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE submission_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES waiting_list_submissions(id),
  user_agent TEXT,
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_waiting_list_email ON waiting_list_submissions(email);
CREATE INDEX idx_waiting_list_locale ON waiting_list_submissions(locale);
CREATE INDEX idx_waiting_list_submitted_at ON waiting_list_submissions(submitted_at);
CREATE INDEX idx_consent_jurisdiction ON consent_records(jurisdiction);
```

---

## Backend Service Implementation

```typescript
// /api/services/WaitingListService.ts

import { EventBus } from '../events/EventBus';
import { WaitingListRepository } from '../repositories/WaitingListRepository';
import { EmailService } from '../services/EmailService';

class WaitingListService {
  constructor(
    private repository: WaitingListRepository,
    private eventBus: EventBus,
    private emailService: EmailService
  ) {}

  async submitToWaitingList(input: SubmissionInput): Promise<SubmissionResult> {
    // 1. Check for duplicates
    const exists = await this.repository.checkEmailExists(input.email);
    if (exists) {
      this.eventBus.publish({
        type: 'WAITING_LIST_DUPLICATE_DETECTED',
        payload: { email: input.email }
      });
      return { success: false, error: 'EMAIL_ALREADY_EXISTS', isDuplicate: true };
    }

    // 2. Create domain object
    const submission = this.createSubmission(input);

    // 3. Persist
    const result = await this.repository.submit(submission);

    // 4. Publish events
    this.eventBus.publish({
      type: 'WAITING_LIST_SUBMISSION_CREATED',
      payload: submission
    });

    this.eventBus.publish({
      type: 'WAITING_LIST_CONSENT_RECORDED',
      payload: submission.consent
    });

    // 5. Send confirmation email
    await this.emailService.sendWaitingListConfirmation(submission);

    return result;
  }
}
```

---

## GDPR/LGPD/CCPA Compliance

### Data Retention
- Submissions retained for 2 years max
- Consent records retained for 7 years (legal requirement)
- Automated deletion after retention period

### Right to Deletion (GDPR Article 17)
```typescript
async deleteUserData(email: string): Promise<void> {
  // Anonymize personal data, keep consent audit trail
  await this.repository.anonymizeSubmission(email);
}
```

### Data Export (GDPR Article 20)
```typescript
async exportUserData(email: string): Promise<UserDataExport> {
  return await this.repository.exportSubmissionData(email);
}
```

### Jurisdiction Detection
```typescript
// Use IP geolocation or Accept-Language header
const detectJurisdiction = (req: Request): Jurisdiction => {
  const country = req.headers['cf-ipcountry'] || geoip.lookup(req.ip);

  if (EU_COUNTRIES.includes(country)) return 'EU';
  if (country === 'BR') return 'BR';
  if (country === 'US') return 'US';
  return 'OTHER';
};
```

---

## Event Handlers

```typescript
// Email confirmation
eventBus.on('WAITING_LIST_SUBMISSION_CREATED', async (event) => {
  await emailService.sendConfirmation(event.payload);
});

// Analytics
eventBus.on('WAITING_LIST_SUBMISSION_CREATED', async (event) => {
  await analyticsService.track('waiting_list_signup', {
    locale: event.payload.locale,
    source: event.payload.source
  });
});

// CRM Integration
eventBus.on('WAITING_LIST_SUBMISSION_CREATED', async (event) => {
  await crmService.createLead(event.payload);
});
```

---

## Frontend Integration (When Ready)

**Current (LocalStorage):**
```typescript
// /lib/waitingList/infrastructure/index.ts
export const createRepository = () => new LocalStorageRepository();
```

**Future (API) - Change ONE line:**
```typescript
// /lib/waitingList/infrastructure/index.ts
export const createRepository = () => new APIRepository();
```

**API Repository Implementation:**
```typescript
class APIRepository implements WaitingListRepository {
  async submit(submission: WaitingListSubmission): Promise<SubmissionResult> {
    const response = await fetch('/api/waiting-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    return response.json();
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const response = await fetch(`/api/waiting-list/check?email=${encodeURIComponent(email)}`);
    const data = await response.json();
    return data.exists;
  }
}
```

---

## Security Considerations

1. **Rate Limiting**: Max 3 submissions per IP per hour
2. **Email Validation**: Send verification email with token
3. **Input Sanitization**: Server-side DOMPurify (frontend already does this)
4. **CSRF Protection**: Include CSRF token in form
5. **Honeypot Field**: Invisible field to catch bots
6. **Captcha**: Optional reCAPTCHA for high-traffic periods

---

## Monitoring & Analytics

- Submission count by locale
- Conversion rate (modal open → submit)
- Duplicate submission attempts
- Error rate tracking
- Consent type distribution by jurisdiction

---

## Next Steps (When Implementing Backend)

1. Set up PostgreSQL database with schema above
2. Implement API endpoints (POST /api/waiting-list, GET /api/waiting-list/check)
3. Add email service integration (SendGrid, AWS SES, etc.)
4. Implement event handlers for analytics/CRM
5. Add rate limiting middleware
6. Deploy and test
7. **Change ONE line in frontend** to swap LocalStorage → API
