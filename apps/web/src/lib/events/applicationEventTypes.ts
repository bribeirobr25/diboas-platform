/**
 * Application Event Types & Payloads
 *
 * Domain-Driven Design: Application domain event definitions
 * All event type enums, payload interfaces, and validation schemas.
 */

// Application Event Types following Domain-Driven Design
export enum ApplicationEventType {
  // Waitlist Events
  WAITLIST_SIGNUP_SUCCESS = 'waitlist:signup:success',
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
  FEATURE_USED = 'feature:used'
}

// Base event payload interface
export interface ApplicationEventPayload {
  timestamp: number;
  source: string;
  eventId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

// Waitlist Event Payloads
export interface WaitlistSignupEventPayload extends ApplicationEventPayload {
  source: 'waitlist';
  submissionId: string;
  locale: string;
  hasName: boolean;
  hasXAccount: boolean;
  referralCode?: string;
}

export interface WaitlistDeletionEventPayload extends ApplicationEventPayload {
  source: 'waitlist';
  email?: string; // Only included for internal audit, not exposed
  reason?: 'user_request' | 'gdpr' | 'admin';
}

// Share Event Payloads
export interface ShareEventPayload extends ApplicationEventPayload {
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

// Event validation schema — required fields per event type
export const EVENT_VALIDATION_SCHEMA: Record<ApplicationEventType, string[]> = {
  [ApplicationEventType.WAITLIST_SIGNUP_SUCCESS]: ['source'],
  [ApplicationEventType.WAITLIST_SIGNUP_COMPLETED]: ['source', 'submissionId', 'locale'],
  [ApplicationEventType.WAITLIST_SIGNUP_FAILED]: ['source'],
  [ApplicationEventType.WAITLIST_DELETION_REQUESTED]: ['source'],
  [ApplicationEventType.WAITLIST_DELETION_COMPLETED]: ['source'],
  [ApplicationEventType.WAITLIST_POSITION_UPDATED]: ['source'],
  [ApplicationEventType.WAITLIST_REFERRAL_USED]: ['source'],
  [ApplicationEventType.WAITLIST_POSITION_CHECKED]: ['source'],
  [ApplicationEventType.SHARE_INITIATED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_COMPLETED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_FAILED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_CANCELLED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.CONSENT_GIVEN]: ['source', 'consentType', 'newState'],
  [ApplicationEventType.CONSENT_WITHDRAWN]: ['source', 'consentType', 'newState'],
  [ApplicationEventType.PRE_DEMO_STARTED]: ['source'],
  [ApplicationEventType.PRE_DEMO_DEPOSIT_COMPLETED]: ['source'],
  [ApplicationEventType.PRE_DEMO_SEND_COMPLETED]: ['source'],
  [ApplicationEventType.PRE_DEMO_BUY_COMPLETED]: ['source'],
  [ApplicationEventType.PRE_DREAM_STARTED]: ['source'],
  [ApplicationEventType.PRE_DREAM_SHARE_INITIATED]: ['source'],
  [ApplicationEventType.PRE_DREAM_SHARE_COMPLETED]: ['source'],
  [ApplicationEventType.APPLICATION_ERROR]: ['source', 'error', 'severity'],
  [ApplicationEventType.FEATURE_USED]: ['source']
};
