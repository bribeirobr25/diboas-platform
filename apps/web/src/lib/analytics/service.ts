/**
 * Analytics Service Implementation
 * Service Agnostic Abstraction: Centralized analytics logic
 * Privacy-First: Client-side tracking with user consent
 * Error Handling & Recovery: Retry with exponential backoff, offline queuing
 */

import { AnalyticsService, AnalyticsEvent, AnalyticsConfig, WebVitalsMetric } from './types';
import { ANALYTICS_DEFAULTS, ANALYTICS_CONSTANTS } from './constants';
import { Logger } from '@/lib/monitoring/Logger';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface AnalyticsError extends Error {
  code?: string;
  retryable?: boolean;
  timestamp: Date;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: ANALYTICS_CONSTANTS.BASE_RETRY_DELAY,
  maxDelay: ANALYTICS_CONSTANTS.MAX_RETRY_DELAY,
  backoffMultiplier: ANALYTICS_CONSTANTS.BACKOFF_MULTIPLIER,
};

class AnalyticsServiceImpl implements AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private failedEvents: AnalyticsEvent[] = [];
  private userId?: string;
  private sessionId?: string;
  private flushTimer?: NodeJS.Timeout;
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private isOnline = true;
  private boundOnline: (() => void) | null = null;
  private boundOffline: (() => void) | null = null;

  constructor(config: AnalyticsConfig = ANALYTICS_DEFAULTS) {
    this.config = config;
    this.initializeSession();
    this.startAutoFlush();
    this.initializeConnectionMonitoring();
  }

  /**
   * Track generic analytics event
   * Event-Driven Architecture: Central event tracking
   */
  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      parameters: {
        ...event.parameters,
        ...(typeof window !== 'undefined' ? {
          user_agent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
        } : {}),
      },
    };

    this.eventQueue.push(enrichedEvent);

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
      await this.executeWithRetry(event, config);
    } catch (error) {
      this.handleTrackEventError(error as AnalyticsError, event, config);
    }
  }

  /**
   * Track page view events
   * SEO: Important for understanding user journey
   */
  trackPageView(path: string, title: string, locale: string): void {
    if (!this.config.trackPageViews) return;

    this.track({
      name: 'page_view',
      parameters: {
        page_path: path,
        page_title: title,
        page_location: typeof window !== 'undefined' ? window.location.href : '',
        locale,
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      }
    });
  }

  /**
   * Track Web Vitals performance metrics
   * Performance: Monitor real user metrics
   */
  trackPerformance(metrics: WebVitalsMetric[]): void {
    if (!this.config.trackPerformance) return;

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    metrics.forEach(metric => {
      this.track({
        name: 'page_performance',
        parameters: {
          page_path: currentPath,
          metric_name: metric.name,
          metric_value: metric.value,
          metric_rating: metric.rating,
          navigation_type: metric.navigationType
        }
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
        menu_path: typeof window !== 'undefined' ? window.location.pathname : ''
      }
    });
  }

  /**
   * Flush events to analytics service
   * Performance: Batch events for efficiency
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Future: Send to actual analytics service
      if (this.config.debug) {
        Logger.debug('Flushing analytics events', { count: events.length, events });
      }

      // Send to Google Analytics 4
      if (typeof window !== 'undefined') {
        const windowWithGtag = window as Window & { gtag?: (command: string, action: string, params?: Record<string, unknown>) => void };
        if (windowWithGtag.gtag) {
          const gtag = windowWithGtag.gtag;
          events.forEach(event => {
            gtag('event', event.name, event.parameters);
          });
        }
      }

      // Send to PostHog (lazy-loaded behind consent)
      if (typeof window !== 'undefined') {
        try {
          const posthog = (await import('posthog-js')).default;
          if (posthog.__loaded) {
            events.forEach(event => {
              posthog.capture(event.name, event.parameters);
            });
          }
        } catch {
          // PostHog not available or not consented — silently skip
        }
      }

      // Send to custom analytics endpoint
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events })
        });
      }

    } catch (error) {
      Logger.error('Failed to flush analytics events:', { error: error instanceof Error ? error.message : String(error) });
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
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
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    if (typeof window !== 'undefined') {
      if (this.boundOnline) {
        window.removeEventListener('online', this.boundOnline);
      }
      if (this.boundOffline) {
        window.removeEventListener('offline', this.boundOffline);
      }
    }
    this.flush(); // Final flush
  }

  // ─── Private: Retry & Resilience ────────────────────────────────────

  /**
   * Execute analytics call with retry for gtag availability
   */
  private async executeWithRetry(
    event: AnalyticsEvent,
    config: RetryConfig,
    attempt: number = 0
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    const windowWithGtag = window as Window & { gtag?: (command: string, action: string, params?: Record<string, unknown>) => void };

    if (!windowWithGtag.gtag) {
      if (attempt >= config.maxRetries) {
        throw this.createAnalyticsError('Google Analytics not loaded', 'GTAG_UNAVAILABLE', true);
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );
      const jitteredDelay = delay + Math.random() * ANALYTICS_CONSTANTS.JITTER_MAX;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      return this.executeWithRetry(event, config, attempt + 1);
    }

    // If we had failed events and gtag is now available, retry them
    if (this.failedEvents.length > 0) {
      this.scheduleRetryFailedEvents();
    }
  }

  /**
   * Handle errors from trackEvent with appropriate strategies
   */
  private handleTrackEventError(
    error: AnalyticsError,
    event: AnalyticsEvent,
    config: RetryConfig
  ): void {
    this.logAnalyticsError(error, event);

    if (this.isRetryableError(error)) {
      this.queueFailedEvent(event);
      this.scheduleRetryFailedEvents();
    } else {
      Logger.warn('Analytics: Non-retryable error for event', { event: event.name });
    }

    // Don't throw - analytics failures should not break user experience
  }

  /**
   * Queue failed events for retry (bounded to prevent memory leaks)
   */
  private queueFailedEvent(event: AnalyticsEvent): void {
    if (this.failedEvents.length >= ANALYTICS_CONSTANTS.MAX_QUEUE_SIZE) {
      this.failedEvents.shift();
    }
    this.failedEvents.push(event);
  }

  /**
   * Schedule retry of failed events
   */
  private scheduleRetryFailedEvents(): void {
    if (this.retryTimeoutId || this.failedEvents.length === 0) return;

    this.retryTimeoutId = setTimeout(async () => {
      this.retryTimeoutId = null;
      await this.retryFailedEvents();
    }, ANALYTICS_CONSTANTS.RETRY_DELAY);
  }

  /**
   * Retry failed events
   */
  private async retryFailedEvents(): Promise<void> {
    if (!this.isOnline) return;

    const eventsToRetry = [...this.failedEvents];
    this.failedEvents = [];

    for (const event of eventsToRetry) {
      try {
        await this.executeWithRetry(event, DEFAULT_RETRY_CONFIG);
      } catch (error) {
        this.handleTrackEventError(error as AnalyticsError, event, DEFAULT_RETRY_CONFIG);
      }
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AnalyticsError): boolean {
    const retryableErrors = [
      'GTAG_UNAVAILABLE',
      'NETWORK_ERROR',
      'TIMEOUT',
      'TEMPORARILY_UNAVAILABLE'
    ];

    return error.retryable !== false && (
      retryableErrors.includes(error.code || '') ||
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('temporarily')
    );
  }

  /**
   * Create analytics error with proper typing
   */
  private createAnalyticsError(
    message: string,
    code: string,
    retryable: boolean
  ): AnalyticsError {
    const error = new Error(message) as AnalyticsError;
    error.code = code;
    error.retryable = retryable;
    error.timestamp = new Date();
    return error;
  }

  /**
   * Log analytics errors for monitoring
   */
  private logAnalyticsError(error: AnalyticsError, event: AnalyticsEvent): void {
    if (process.env.NODE_ENV === 'development') {
      if (error.code !== 'GTAG_UNAVAILABLE') {
        Logger.warn('Analytics Error:', {
          error: error.message,
          code: error.code,
          event: event.name,
          retryable: error.retryable,
          timestamp: error.timestamp
        });
      }
    }

    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring({
        type: 'analytics_error',
        error: error.message,
        code: error.code,
        event: event.name,
        timestamp: error.timestamp
      });
    }
  }

  /**
   * Send error to monitoring service (non-blocking)
   */
  private sendToMonitoring(data: Record<string, unknown>): void {
    const monitoringEndpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT;
    if (!monitoringEndpoint) return;

    fetch(monitoringEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(ANALYTICS_CONSTANTS.MONITORING_TIMEOUT)
    }).catch(() => {
      // Fail silently
    });
  }

  // ─── Private: Initialization ────────────────────────────────────────

  /**
   * Initialize session
   */
  private initializeSession(): void {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
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

  /**
   * Initialize connection monitoring for offline resilience
   */
  private initializeConnectionMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.boundOnline = () => {
      this.isOnline = true;
      this.scheduleRetryFailedEvents();
    };

    this.boundOffline = () => {
      this.isOnline = false;
    };

    window.addEventListener('online', this.boundOnline);
    window.addEventListener('offline', this.boundOffline);
    this.isOnline = navigator.onLine;
  }
}

// Export singleton instance (SSR-safe: constructor guards all browser APIs)
export const analyticsService = new AnalyticsServiceImpl();
