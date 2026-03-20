/**
 * Analytics Retry Queue
 *
 * Handles queuing, retrying, and error classification for failed
 * analytics events. Extracted from AnalyticsTrackingService for
 * single-responsibility compliance.
 */

import type { AnalyticsEvent } from './types';
import { ANALYTICS_CONSTANTS } from './constants';
import { Logger } from '@/lib/monitoring/Logger';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface AnalyticsError extends Error {
  code?: string;
  retryable?: boolean;
  timestamp: Date;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: ANALYTICS_CONSTANTS.BASE_RETRY_DELAY,
  maxDelay: ANALYTICS_CONSTANTS.MAX_RETRY_DELAY,
  backoffMultiplier: ANALYTICS_CONSTANTS.BACKOFF_MULTIPLIER,
};

export class RetryQueue {
  private failedEvents: AnalyticsEvent[] = [];
  private retryTimeoutId: NodeJS.Timeout | null = null;

  /**
   * Queue a failed event for retry (bounded to prevent memory leaks)
   */
  queueFailedEvent(event: AnalyticsEvent): void {
    if (this.failedEvents.length >= ANALYTICS_CONSTANTS.MAX_QUEUE_SIZE) {
      this.failedEvents.shift();
    }
    this.failedEvents.push(event);
  }

  /**
   * Schedule retry of failed events
   */
  scheduleRetry(retryFn: () => Promise<void>): void {
    if (this.retryTimeoutId || this.failedEvents.length === 0) return;

    this.retryTimeoutId = setTimeout(async () => {
      this.retryTimeoutId = null;
      await retryFn();
    }, ANALYTICS_CONSTANTS.RETRY_DELAY);
  }

  /**
   * Drain failed events for retry (returns and clears the queue)
   */
  drainFailedEvents(): AnalyticsEvent[] {
    const events = [...this.failedEvents];
    this.failedEvents = [];
    return events;
  }

  /**
   * Check if there are failed events pending
   */
  hasPendingEvents(): boolean {
    return this.failedEvents.length > 0;
  }

  /**
   * Clear all pending events (used on consent withdrawal)
   */
  clear(): void {
    this.failedEvents = [];
  }

  /**
   * Execute analytics call with retry for gtag availability
   */
  async executeWithRetry(
    event: AnalyticsEvent,
    config: RetryConfig,
    attempt: number = 0
  ): Promise<void> {
    if (typeof window === 'undefined') return;

    const windowWithGtag = window as Window & {
      gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
    };

    if (!windowWithGtag.gtag) {
      if (attempt >= config.maxRetries) {
        throw createAnalyticsError('Google Analytics not loaded', 'GTAG_UNAVAILABLE', true);
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
      this.scheduleRetry(() => this.retryFailedEventsInternal(config));
    }
  }

  /**
   * Internal retry loop for failed events
   */
  private async retryFailedEventsInternal(config: RetryConfig): Promise<void> {
    const eventsToRetry = this.drainFailedEvents();

    for (const event of eventsToRetry) {
      try {
        await this.executeWithRetry(event, config);
      } catch (error) {
        this.handleRetryError(error as AnalyticsError, event);
      }
    }
  }

  /**
   * Handle errors from retry attempts
   */
  private handleRetryError(error: AnalyticsError, event: AnalyticsEvent): void {
    logAnalyticsError(error, event);

    if (isRetryableError(error)) {
      this.queueFailedEvent(event);
    } else {
      Logger.warn('Analytics: Non-retryable error for event', { event: event.name });
    }
  }

  /**
   * Cleanup timers
   */
  destroy(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AnalyticsError): boolean {
  const retryableErrors = [
    'GTAG_UNAVAILABLE',
    'NETWORK_ERROR',
    'TIMEOUT',
    'TEMPORARILY_UNAVAILABLE',
  ];

  return (
    error.retryable !== false &&
    (retryableErrors.includes(error.code || '') ||
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('temporarily'))
  );
}

/**
 * Create analytics error with proper typing
 */
export function createAnalyticsError(
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
export function logAnalyticsError(error: AnalyticsError, event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    if (error.code !== 'GTAG_UNAVAILABLE') {
      Logger.warn('Analytics Error:', {
        error: error.message,
        code: error.code,
        event: event.name,
        retryable: error.retryable,
        timestamp: error.timestamp,
      });
    }
  }

  if (process.env.NODE_ENV === 'production') {
    sendToMonitoring({
      type: 'analytics_error',
      error: error.message,
      code: error.code,
      event: event.name,
      timestamp: error.timestamp,
    });
  }
}

/**
 * Send error to monitoring service (non-blocking)
 */
function sendToMonitoring(data: Record<string, unknown>): void {
  const monitoringEndpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT;
  if (!monitoringEndpoint) return;

  fetch(monitoringEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(ANALYTICS_CONSTANTS.MONITORING_TIMEOUT),
  }).catch(() => {
    // Fail silently
  });
}
