/**
 * Application Event Bus
 *
 * Event-Driven Architecture: Centralized event system for application/service events
 * Domain-Driven Design: Application domain events with proper boundaries
 * Service Agnostic Abstraction: Platform-independent event system
 * Error Handling & System Recovery: Event error handling and recovery
 * Monitoring & Observability: Event tracking and metrics
 * Security & Audit Standards: Event validation and audit trail
 */

import { Logger } from '@/lib/monitoring/Logger';

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

// Event validation schema
const EVENT_VALIDATION_SCHEMA: Record<ApplicationEventType, string[]> = {
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

/**
 * Application Event Bus
 *
 * Centralized event system for application/service-level events
 */
export class ApplicationEventBus {
  private listeners = new Map<ApplicationEventType, Set<AppEventListener>>();
  private eventHistory: Array<{
    type: ApplicationEventType;
    payload: AppEventPayload;
    timestamp: number;
  }> = [];
  private maxHistorySize = 500;
  private isDebugMode = process.env.NODE_ENV === 'development';

  /**
   * Subscribe to application events
   */
  on<T extends AppEventPayload>(
    eventType: ApplicationEventType,
    listener: AppEventListener<T>
  ): () => void {
    try {
      if (typeof listener !== 'function') {
        throw new Error(`Invalid listener for event ${eventType}: must be a function`);
      }

      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }

      const listenersSet = this.listeners.get(eventType)!;
      listenersSet.add(listener as AppEventListener);

      if (this.isDebugMode) {
        Logger.debug('ApplicationEventBus: Listener registered', {
          eventType,
          listenerCount: listenersSet.size
        });
      }

      return () => {
        listenersSet.delete(listener as AppEventListener);
        if (listenersSet.size === 0) {
          this.listeners.delete(eventType);
        }
      };
    } catch (error) {
      Logger.error('Failed to register application event listener', { eventType, error });
      throw error;
    }
  }

  /**
   * Emit application events
   */
  async emit<T extends AppEventPayload>(
    eventType: ApplicationEventType,
    payload: T
  ): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate payload
      this.validateEventPayload(eventType, payload);

      // Enrich payload with eventId and timestamp
      const enrichedPayload = {
        ...payload,
        eventId: payload.eventId || crypto.randomUUID(),
        timestamp: payload.timestamp || Date.now()
      };

      // Store in history for audit trail
      this.addToHistory(eventType, enrichedPayload);

      // Get listeners
      const listeners = this.listeners.get(eventType);
      if (!listeners || listeners.size === 0) {
        if (this.isDebugMode) {
          Logger.debug('ApplicationEventBus: No listeners for event', { eventType });
        }
        return;
      }

      // Execute listeners with error isolation
      const listenerPromises = Array.from(listeners).map(async (listener) => {
        try {
          await listener(enrichedPayload);
        } catch (error) {
          Logger.error('Application event listener error', {
            eventType,
            error,
            source: payload.source
          });

          // Emit error event for monitoring (avoid infinite loop)
          if (eventType !== ApplicationEventType.APPLICATION_ERROR) {
            this.emit(ApplicationEventType.APPLICATION_ERROR, {
              source: payload.source,
              timestamp: Date.now(),
              error: error as Error,
              severity: 'medium',
              context: { eventType }
            });
          }
        }
      });

      await Promise.allSettled(listenerPromises);

      // Performance monitoring
      const duration = performance.now() - startTime;
      if (duration > 50) {
        Logger.warn('Slow application event processing', {
          eventType,
          duration: `${duration.toFixed(2)}ms`,
          listenerCount: listeners.size
        });
      }

      // Debug logging
      if (this.isDebugMode) {
        Logger.debug('ApplicationEventBus: Event emitted', {
          eventType,
          source: payload.source,
          listenerCount: listeners.size
        });
      }
    } catch (error) {
      Logger.error('Failed to emit application event', { eventType, error });
    }
  }

  /**
   * Validate event payload
   */
  private validateEventPayload(
    eventType: ApplicationEventType,
    payload: AppEventPayload
  ): void {
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Invalid payload for event ${eventType}: must be an object`);
    }

    if (!payload.source || typeof payload.source !== 'string') {
      throw new Error(`Invalid payload for event ${eventType}: missing source`);
    }

    const schema = EVENT_VALIDATION_SCHEMA[eventType];
    if (schema) {
      for (const field of schema) {
        if (!(field in payload)) {
          throw new Error(
            `Invalid payload for event ${eventType}: missing required field ${field}`
          );
        }
      }
    }
  }

  /**
   * Add event to history for audit trail
   */
  private addToHistory(eventType: ApplicationEventType, payload: AppEventPayload): void {
    this.eventHistory.push({
      type: eventType,
      payload,
      timestamp: Date.now()
    });

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get event history for debugging/audit
   */
  getEventHistory(
    eventType?: ApplicationEventType
  ): Array<{ type: ApplicationEventType; payload: AppEventPayload; timestamp: number }> {
    if (eventType) {
      return this.eventHistory.filter((event) => event.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Get listener count for monitoring
   */
  getListenerCount(eventType?: ApplicationEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size || 0;
    }
    return Array.from(this.listeners.values()).reduce(
      (total, set) => total + set.size,
      0
    );
  }

  /**
   * Clear all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
    if (this.isDebugMode) {
      Logger.debug('ApplicationEventBus: All listeners removed');
    }
  }
}

// Singleton instance
export const applicationEventBus = new ApplicationEventBus();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as Window & { applicationEventBus?: ApplicationEventBus }).applicationEventBus =
      applicationEventBus;
  }
}
