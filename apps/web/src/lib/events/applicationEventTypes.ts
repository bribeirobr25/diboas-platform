/**
 * Application Event Types & Payloads
 *
 * Domain-Driven Design: Application domain event definitions
 * All event type enums, payload interfaces, and validation schemas.
 */

// Application Event Types following Domain-Driven Design
export enum ApplicationEventType {
  // Waitlist Events
  WAITLIST_SIGNUP_COMPLETED = 'waitlist:signupCompleted',
  WAITLIST_SIGNUP_FAILED = 'waitlist:signupFailed',
  WAITLIST_DELETION_REQUESTED = 'waitlist:deletionRequested',
  WAITLIST_DELETION_COMPLETED = 'waitlist:deletionCompleted',
  WAITLIST_POSITION_UPDATED = 'waitlist:positionUpdated',
  WAITLIST_REFERRAL_USED = 'waitlist:referralUsed',
  WAITLIST_POSITION_CHECKED = 'waitlist:positionChecked',

  // Share Events
  SHARE_INITIATED = 'share:initiated',
  SHARE_COMPLETED = 'share:completed',
  SHARE_FAILED = 'share:failed',
  SHARE_CANCELLED = 'share:cancelled',

  // Consent Events
  CONSENT_GIVEN = 'consent:given',
  CONSENT_WITHDRAWN = 'consent:withdrawn',

  // PreDemo Events
  PRE_DEMO_STARTED = 'preDemo:started',
  PRE_DEMO_DEPOSIT_COMPLETED = 'preDemo:depositCompleted',
  PRE_DEMO_SEND_COMPLETED = 'preDemo:sendCompleted',
  PRE_DEMO_BUY_COMPLETED = 'preDemo:buyCompleted',

  // PreDream Events
  PRE_DREAM_STARTED = 'preDream:started',
  PRE_DREAM_SHARE_INITIATED = 'preDream:shareInitiated',
  PRE_DREAM_SHARE_COMPLETED = 'preDream:shareCompleted',

  // General Application Events
  APPLICATION_ERROR = 'application:error',
  FEATURE_USED = 'feature:used',

  // Tools — per TOOLS_41_DEFECTS_FIX_PLAN.md §1.2 (C21 close, 2026-05-26).
  // Distinct from APPLICATION_ERROR so tool-suite unexpected errors can be
  // aggregated in dashboards without mixing with infra/runtime errors.
  CALCULATOR_UNEXPECTED_ERROR = 'tools:calculatorUnexpectedError',
  CALCULATOR_DEPRECIATION_CLAMPED = 'tools:calculatorDepreciationClamped',
}

/**
 * Application event domain — the bounded context the event belongs to (per
 * coding-standards §1 / §2). Required on every event payload as of Phase 2 M1.
 */
export type ApplicationDomain =
  | 'waitlist'
  | 'share'
  | 'consent'
  | 'preDemo'
  | 'preDream'
  | 'analytics'
  | 'monitoring'
  | 'application'
  | 'tools';

/**
 * Base event payload interface.
 *
 * Phase 2 M1 (audit/2026-05-08): `domain` is required at the call site;
 * `eventId` and `correlationId` are optional at the call site and auto-filled
 * by EventBus.emit before validation + dispatch (so listeners receive a
 * payload where all three are present).
 */
export interface ApplicationEventPayload {
  /** Required — bounded context this event belongs to */
  domain: ApplicationDomain;
  /** Required — epoch ms when the event occurred */
  timestamp: number;
  /** Required — component/module that emitted */
  source: string;
  /** Optional at call site; EventBus.emit auto-fills with crypto.randomUUID() */
  eventId?: string;
  /** Optional at call site; EventBus.emit pulls from x-request-id / AsyncLocalStorage / fallback UUID */
  correlationId?: string;
  /** Optional domain-specific structured data */
  metadata?: Record<string, unknown>;
}

// Waitlist Event Payloads
export interface WaitlistSignupEventPayload extends ApplicationEventPayload {
  domain: 'waitlist';
  source: 'waitlist';
  submissionId: string;
  locale: string;
  hasName: boolean;
  hasXAccount: boolean;
  referralCode?: string;
}

export interface WaitlistDeletionEventPayload extends ApplicationEventPayload {
  domain: 'waitlist';
  source: 'waitlist';
  // E-4: no `email` field — deletion events flow to analytics doors; a
  // PII-shaped field here invites a future caller to leak an address into a
  // tracked payload. The three emit sites never set it. Keep PII out by type.
  reason?: 'user_request' | 'gdpr' | 'admin';
}

// Share Event Payloads
export interface ShareEventPayload extends ApplicationEventPayload {
  domain: 'share';
  source: 'share';
  platform: string;
  cardType?: string;
  locale: string;
  hasImage: boolean;
  success?: boolean;
  error?: string;
}

// Consent Event Payloads
export interface ConsentEventPayload extends ApplicationEventPayload {
  domain: 'consent';
  source: 'consent';
  consentType: 'analytics' | 'marketing' | 'all';
  previousState?: boolean;
  newState: boolean;
}

// Application Error Event Payload
export interface ApplicationErrorEventPayload extends ApplicationEventPayload {
  source: string;
  error: Error | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

// Union type for all event payloads
export type AppEventPayload =
  | ApplicationEventPayload
  | WaitlistSignupEventPayload
  | WaitlistDeletionEventPayload
  | ShareEventPayload
  | ConsentEventPayload
  | ApplicationErrorEventPayload;

// Event listener function type
export type AppEventListener<T extends AppEventPayload = AppEventPayload> = (
  payload: T
) => void | Promise<void>;

// Event validation schema — required fields per event type.
// Phase 2 M1 (audit/2026-05-08): `domain` is universally required;
// `eventId`, `correlationId`, `timestamp` are auto-filled by EventBus.emit
// before validation runs, so they don't need to appear in the per-event
// required-fields list (the EventBus enriches before validating).
export const EVENT_VALIDATION_SCHEMA: Record<ApplicationEventType, string[]> = {
  [ApplicationEventType.WAITLIST_SIGNUP_COMPLETED]: ['domain', 'source'],
  [ApplicationEventType.WAITLIST_SIGNUP_FAILED]: ['domain', 'source'],
  [ApplicationEventType.WAITLIST_DELETION_REQUESTED]: ['domain', 'source'],
  [ApplicationEventType.WAITLIST_DELETION_COMPLETED]: ['domain', 'source'],
  [ApplicationEventType.WAITLIST_POSITION_UPDATED]: ['domain', 'source'],
  [ApplicationEventType.WAITLIST_REFERRAL_USED]: ['domain', 'source'],
  [ApplicationEventType.WAITLIST_POSITION_CHECKED]: ['domain', 'source'],
  [ApplicationEventType.SHARE_INITIATED]: ['domain', 'source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_COMPLETED]: ['domain', 'source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_FAILED]: ['domain', 'source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_CANCELLED]: ['domain', 'source', 'platform', 'locale'],
  [ApplicationEventType.CONSENT_GIVEN]: ['domain', 'source', 'consentType', 'newState'],
  [ApplicationEventType.CONSENT_WITHDRAWN]: ['domain', 'source', 'consentType', 'newState'],
  [ApplicationEventType.PRE_DEMO_STARTED]: ['domain', 'source'],
  [ApplicationEventType.PRE_DEMO_DEPOSIT_COMPLETED]: ['domain', 'source'],
  [ApplicationEventType.PRE_DEMO_SEND_COMPLETED]: ['domain', 'source'],
  [ApplicationEventType.PRE_DEMO_BUY_COMPLETED]: ['domain', 'source'],
  [ApplicationEventType.PRE_DREAM_STARTED]: ['domain', 'source'],
  [ApplicationEventType.PRE_DREAM_SHARE_INITIATED]: ['domain', 'source'],
  [ApplicationEventType.PRE_DREAM_SHARE_COMPLETED]: ['domain', 'source'],
  [ApplicationEventType.APPLICATION_ERROR]: ['domain', 'source', 'error', 'severity'],
  [ApplicationEventType.FEATURE_USED]: ['domain', 'source'],
  [ApplicationEventType.CALCULATOR_UNEXPECTED_ERROR]: ['domain', 'source', 'error', 'severity'],
  [ApplicationEventType.CALCULATOR_DEPRECIATION_CLAMPED]: ['domain', 'source'],
};
