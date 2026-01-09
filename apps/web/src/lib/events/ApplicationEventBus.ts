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

import { analyticsService } from '@/lib/analytics';
import { Logger } from '@/lib/monitoring/Logger';

// Application Event Types following Domain-Driven Design
export enum ApplicationEventType {
  // Waitlist Events
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

  // General Application Events
  APPLICATION_ERROR = 'application:error',
  FEATURE_USED = 'feature:used'
}

// Base event payload interface
export interface ApplicationEventPayload {
  timestamp: number;
  source: string;
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

      // Enrich payload with timestamp
      const enrichedPayload = {
        ...payload,
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
        // Still track analytics even without listeners
        this.trackAnalytics(eventType, enrichedPayload);
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

      // Track analytics
      this.trackAnalytics(eventType, enrichedPayload);

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
   * Track analytics for application events
   */
  private trackAnalytics(eventType: ApplicationEventType, payload: AppEventPayload): void {
    // Map event types to analytics event names
    const analyticsEventMap: Partial<Record<ApplicationEventType, string>> = {
      [ApplicationEventType.WAITLIST_SIGNUP_COMPLETED]: 'waitlist_signup',
      [ApplicationEventType.WAITLIST_REFERRAL_USED]: 'waitlist_referral_used',
      [ApplicationEventType.SHARE_COMPLETED]: 'share_completed',
      [ApplicationEventType.DREAM_MODE_CALCULATION_COMPLETED]: 'dream_mode_calculation',
      [ApplicationEventType.DREAM_MODE_PATH_SELECTED]: 'dream_mode_path_selected',
      [ApplicationEventType.DREAM_MODE_DISCLAIMER_ACCEPTED]: 'dream_mode_disclaimer_accepted',
      [ApplicationEventType.CONSENT_GIVEN]: 'consent_given',
      [ApplicationEventType.CONSENT_WITHDRAWN]: 'consent_withdrawn',
      [ApplicationEventType.WEBHOOK_PROCESSED]: 'webhook_processed'
    };

    const analyticsEvent = analyticsEventMap[eventType];
    if (analyticsEvent) {
      analyticsService.track({
        name: analyticsEvent,
        parameters: {
          event_type: eventType,
          source: payload.source,
          ...this.extractAnalyticsParams(eventType, payload)
        }
      });
    }
  }

  /**
   * Extract analytics parameters from payload
   */
  private extractAnalyticsParams(
    eventType: ApplicationEventType,
    payload: AppEventPayload
  ): Record<string, unknown> {
    switch (eventType) {
      case ApplicationEventType.WAITLIST_SIGNUP_COMPLETED: {
        const p = payload as WaitlistSignupEventPayload;
        return {
          locale: p.locale,
          has_name: p.hasName,
          has_x_account: p.hasXAccount,
          has_referral: !!p.referralCode
        };
      }
      case ApplicationEventType.WAITLIST_REFERRAL_USED: {
        const p = payload as WaitlistReferralEventPayload;
        return {
          referral_code: p.referralCode
        };
      }
      case ApplicationEventType.SHARE_COMPLETED: {
        const p = payload as ShareEventPayload;
        return {
          platform: p.platform,
          card_type: p.cardType,
          locale: p.locale
        };
      }
      case ApplicationEventType.DREAM_MODE_CALCULATION_COMPLETED: {
        const p = payload as DreamModeEventPayload;
        return {
          path: p.path,
          timeframe: p.timeframe,
          growth_percentage: p.result?.growthPercentage
        };
      }
      case ApplicationEventType.DREAM_MODE_PATH_SELECTED: {
        const p = payload as DreamModeEventPayload;
        return {
          path: p.path
        };
      }
      case ApplicationEventType.CONSENT_GIVEN:
      case ApplicationEventType.CONSENT_WITHDRAWN: {
        const p = payload as ConsentEventPayload;
        return {
          consent_type: p.consentType,
          new_state: p.newState
        };
      }
      case ApplicationEventType.WEBHOOK_PROCESSED: {
        const p = payload as WebhookEventPayload;
        return {
          provider: p.provider,
          webhook_event_type: p.eventType,
          success: p.success
        };
      }
      default:
        return {};
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
