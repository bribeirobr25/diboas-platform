/**
 * Analytics Service Implementation
 * Service Agnostic Abstraction: Centralized analytics logic
 * Privacy-First: Client-side tracking with user consent
 * Error Handling & Recovery: Retry with exponential backoff, offline queuing
 */

import { AnalyticsService, AnalyticsEvent, AnalyticsConfig, WebVitalsMetric } from './types';
import { ANALYTICS_DEFAULTS, ANALYTICS_CONSTANTS } from './constants';
import { Logger } from '@/lib/monitoring/Logger';
import {
  RetryQueue,
  DEFAULT_RETRY_CONFIG,
  logAnalyticsError,
  type RetryConfig,
  type AnalyticsError,
} from './retryQueue';
import { ConnectionMonitor } from './connectionMonitor';
import { type IAnalyticsBackend, type SendOptions, GA4Backend, PostHogBackend } from './backends';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import { getConsentedUtmParams } from './utmAttribution';

class AnalyticsTrackingService implements AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private userId?: string;
  private sessionId?: string;
  private flushTimer?: NodeJS.Timeout;
  private retryQueue = new RetryQueue();
  private connectionMonitor = new ConnectionMonitor();
  private backends: IAnalyticsBackend[] = [];

  /**
   * Hand the queue to the SDKs when the page is hidden or closed (founder 2026-11-11,
   * DR-2026-11-11-market-cleanup-c2-decisions D): a reader who leaves within the 30 s batch
   * window used to lose their events. Bound once, so `destroy()` removes the same functions
   * (race-condition rule). A second call finds the queue already empty.
   */
  private readonly onPageHide = (): void => {
    void this.flush({ unloading: true });
  };
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') void this.flush({ unloading: true });
  };

  constructor(config: AnalyticsConfig = ANALYTICS_DEFAULTS) {
    this.config = config;

    // Register default backends
    this.backends.push(new GA4Backend(), new PostHogBackend());

    // SSR guard: skip browser-only initialization on server
    if (typeof window === 'undefined') return;

    this.initializeSession();
    this.startAutoFlush();
    window.addEventListener('pagehide', this.onPageHide);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.listenForConsentWithdrawal();
    this.connectionMonitor.initialize(() => {
      if (this.retryQueue.hasPendingEvents()) {
        this.retryFailedEvents();
      }
    });
  }

  /**
   * Track generic analytics event
   * Event-Driven Architecture: Central event tracking
   */
  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;
    if (!hasAnalyticsConsent()) return;

    // The held campaign values, shaped, under analytics consent only (W-D1, MKT-EVENT-2).
    const utmParams = getConsentedUtmParams();

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      parameters: {
        ...event.parameters,
        ...(typeof window !== 'undefined'
          ? {
              user_agent: navigator.userAgent,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              language: navigator.language,
              locale: this.getLocaleFromPath(),
            }
          : {}),
        ...utmParams,
      },
    };

    this.eventQueue.push(enrichedEvent);
    // Consent exists here: let a backend that loads lazily get ready for a synchronous send.
    for (const backend of this.backends) backend.warm?.();

    if (this.config.debug) {
      Logger.debug('Analytics event tracked', { event: enrichedEvent });
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track event by name and properties (convenience API)
   * Delegates to track() with retry and error resilience
   */
  async trackEvent(
    eventName: string,
    properties: Record<string, unknown> = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<void> {
    const event: AnalyticsEvent = {
      name: eventName,
      parameters: properties,
    };

    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };

    try {
      this.track(event);
      await this.retryQueue.executeWithRetry(event, config);
    } catch (error) {
      this.handleTrackEventError(error as AnalyticsError, event);
    }
  }

  /**
   * Track Web Vitals performance metrics
   * Performance: Monitor real user metrics
   */
  trackPerformance(metrics: WebVitalsMetric[]): void {
    if (!this.config.trackPerformance) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    metrics.forEach((metric) => {
      this.track({
        name: 'page_performance',
        parameters: {
          page_path: currentPath,
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
          navigation_type: metric.navigationType,
        },
      });
    });
  }

  /**
   * Track navigation interactions
   * User Experience: Understand navigation patterns
   */
  trackNavigation(menuId: string, action: string, locale: string): void {
    if (!this.config.trackNavigation) return;

    this.track({
      name: 'navigation_interaction',
      parameters: {
        menu_id: menuId,
        action,
        locale,
        menu_path: typeof window !== 'undefined' ? window.location.pathname : '',
      },
    });
  }

  /**
   * Flush events to analytics service
   * Performance: Batch events for efficiency
   */
  async flush(options: SendOptions = {}): Promise<void> {
    if (this.eventQueue.length === 0) return;
    if (typeof window === 'undefined') return;
    if (!hasAnalyticsConsent()) {
      this.eventQueue = []; // Discard queued events if consent was withdrawn
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (this.config.debug) {
        Logger.debug('Flushing analytics events', { count: events.length, events });
      }

      // Dispatch to all registered backends
      const backendResults = this.backends.map(async (backend) => {
        try {
          await backend.sendEvents(events, options);
        } catch (err) {
          Logger.error(`Analytics backend "${backend.name}" failed:`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
      await Promise.all(backendResults);
      // The custom `NEXT_PUBLIC_ANALYTICS_ENDPOINT` sink was deleted 2026-11-11: never set in
      // production, and its host left the CSP with the analytics product (decision G-2).
    } catch (error) {
      Logger.error('Failed to flush analytics events:', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Re-queue events on failure (capped to prevent unbounded growth)
      const maxRequeue = ANALYTICS_CONSTANTS.MAX_QUEUE_SIZE - this.eventQueue.length;
      if (maxRequeue > 0) {
        this.eventQueue.unshift(...events.slice(0, maxRequeue));
      }
    }
  }

  /**
   * Set user identifier
   * Privacy: Only when user consents
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set session identifier
   * User Journey: Track session-based analytics
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Register an additional analytics backend.
   * Service Agnostic Abstraction: extend analytics without modifying core logic.
   */
  registerBackend(backend: IAnalyticsBackend): void {
    this.backends.push(backend);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.onPageHide);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    this.retryQueue.destroy();
    this.connectionMonitor.destroy();
    this.flush(); // Final flush
  }

  /**
   * Listen for consent withdrawal to stop tracking and clear queues.
   * GDPR: When consent is withdrawn, discard all pending events immediately.
   */
  private listenForConsentWithdrawal(): void {
    import('@/lib/events/ApplicationEventBus')
      .then(({ applicationEventBus, ApplicationEventType }) => {
        applicationEventBus.on(ApplicationEventType.CONSENT_WITHDRAWN, () => {
          this.eventQueue = [];
          this.retryQueue.clear();
          // The signup note's hold is the box's, not analytics': withdrawal stops the analytics
          // readers (they check consent) and leaves the hold alone (W-D1, spec §3.1).
          Logger.info('Analytics: consent withdrawn — queues cleared');
        });
      })
      .catch(() => {});
  }

  // ─── Private: Error Handling ───────────────────────────────────────

  /**
   * Handle errors from trackEvent with appropriate strategies
   */
  private handleTrackEventError(error: AnalyticsError, event: AnalyticsEvent): void {
    logAnalyticsError(error, event);
    this.retryQueue.queueFailedEvent(event);
    this.retryQueue.scheduleRetry(() => this.retryFailedEvents());
    // Don't throw - analytics failures should not break user experience
  }

  /**
   * Retry failed events
   */
  private async retryFailedEvents(): Promise<void> {
    if (!this.connectionMonitor.getIsOnline()) return;

    const eventsToRetry = this.retryQueue.drainFailedEvents();

    for (const event of eventsToRetry) {
      try {
        await this.retryQueue.executeWithRetry(event, DEFAULT_RETRY_CONFIG);
      } catch (error) {
        this.handleTrackEventError(error as AnalyticsError, event);
      }
    }
  }

  // ─── Private: Initialization ───────────────────────────────────────

  /**
   * Initialize session
   */
  private initializeSession(): void {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
  }

  /**
   * Derive locale from the current URL path segment.
   * Falls back to 'en' on the server or when no supported locale is found.
   */
  private getLocaleFromPath(): string {
    if (typeof window === 'undefined') return 'en';
    const pathParts = window.location.pathname.split('/');
    const supportedLocales = ['en', 'pt-BR', 'es', 'de'];
    return supportedLocales.find((l) => pathParts[1] === l) || 'en';
  }

  /**
   * Start automatic flush timer
   */
  private startAutoFlush(): void {
    if (typeof window === 'undefined') return;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }
}

// Export singleton instance (SSR-safe: constructor guards all browser APIs)
export const analyticsService = new AnalyticsTrackingService();
