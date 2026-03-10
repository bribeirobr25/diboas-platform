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
  WAITLIST_REFERRAL_USED = 'waitlist:referralUsed',
  WAITLIST_POSITION_CHECKED = 'waitlist:positionChecked',

  // Share Events
  SHARE_INITIATED = 'share:initiated',
  SHARE_COMPLETED = 'share:completed',
  SHARE_FAILED = 'share:failed',
  SHARE_CANCELLED = 'share:cancelled',

  // Dream Mode Events
  DREAM_MODE_CALCULATION_STARTED = 'dreamMode:calculationStarted',
  DREAM_MODE_CALCULATION_COMPLETED = 'dreamMode:calculationCompleted',
  DREAM_MODE_PATH_SELECTED = 'dreamMode:pathSelected',
  DREAM_MODE_TIMEFRAME_CHANGED = 'dreamMode:timeframeChanged',
  DREAM_MODE_AMOUNT_CHANGED = 'dreamMode:amountChanged',
  DREAM_MODE_DISCLAIMER_ACCEPTED = 'dreamMode:disclaimerAccepted',

  // Consent Events
  CONSENT_GIVEN = 'consent:given',
  CONSENT_WITHDRAWN = 'consent:withdrawn',
  CONSENT_PREFERENCES_UPDATED = 'consent:preferencesUpdated',

  // Webhook Events
  WEBHOOK_RECEIVED = 'webhook:received',
  WEBHOOK_PROCESSED = 'webhook:processed',
  WEBHOOK_FAILED = 'webhook:failed',

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

export interface WaitlistReferralEventPayload extends ApplicationEventPayload {
  source: 'waitlist';
  referralCode: string;
  referrerEmail?: string;
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

// Dream Mode Event Payloads
export interface DreamModeEventPayload extends ApplicationEventPayload {
  source: 'dreamMode';
  amount?: number;
  path?: string;
  timeframe?: string;
  result?: {
    finalBalance: number;
    growthPercentage: number;
    bankComparison?: number;
  };
}

// Consent Event Payloads
export interface ConsentEventPayload extends ApplicationEventPayload {
  source: 'consent';
  consentType: 'analytics' | 'marketing' | 'all';
  previousState?: boolean;
  newState: boolean;
}

// Webhook Event Payloads
export interface WebhookEventPayload extends ApplicationEventPayload {
  source: 'webhook';
  provider: string;
  eventType: string;
  success: boolean;
  error?: string;
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
  | WaitlistReferralEventPayload
  | ShareEventPayload
  | DreamModeEventPayload
  | ConsentEventPayload
  | WebhookEventPayload
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
  [ApplicationEventType.WAITLIST_REFERRAL_USED]: ['source', 'referralCode'],
  [ApplicationEventType.WAITLIST_POSITION_CHECKED]: ['source'],
  [ApplicationEventType.SHARE_INITIATED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_COMPLETED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_FAILED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.SHARE_CANCELLED]: ['source', 'platform', 'locale'],
  [ApplicationEventType.DREAM_MODE_CALCULATION_STARTED]: ['source'],
  [ApplicationEventType.DREAM_MODE_CALCULATION_COMPLETED]: ['source', 'result'],
  [ApplicationEventType.DREAM_MODE_PATH_SELECTED]: ['source', 'path'],
  [ApplicationEventType.DREAM_MODE_TIMEFRAME_CHANGED]: ['source', 'timeframe'],
  [ApplicationEventType.DREAM_MODE_AMOUNT_CHANGED]: ['source', 'amount'],
  [ApplicationEventType.DREAM_MODE_DISCLAIMER_ACCEPTED]: ['source'],
  [ApplicationEventType.CONSENT_GIVEN]: ['source', 'consentType', 'newState'],
  [ApplicationEventType.CONSENT_WITHDRAWN]: ['source', 'consentType', 'newState'],
  [ApplicationEventType.CONSENT_PREFERENCES_UPDATED]: ['source', 'consentType', 'newState'],
  [ApplicationEventType.WEBHOOK_RECEIVED]: ['source', 'provider', 'eventType'],
  [ApplicationEventType.WEBHOOK_PROCESSED]: ['source', 'provider', 'eventType', 'success'],
  [ApplicationEventType.WEBHOOK_FAILED]: ['source', 'provider', 'eventType', 'success'],
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
