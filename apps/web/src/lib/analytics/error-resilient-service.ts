/**
 * Analytics Error Resilient Service
 * Error Handling & System Recovery: Comprehensive error handling with fallback strategies
 * Code Reusability: Centralized analytics logic with retry mechanisms
 * Semantic Naming: Clear, descriptive service and method names
 */

import { Logger } from '@/lib/monitoring/Logger';
import { ANALYTICS_CONSTANTS } from './constants';

interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp?: Date;
  retryCount?: number;
}

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

class AnalyticsResilientService {
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: ANALYTICS_CONSTANTS.BASE_RETRY_DELAY,
    maxDelay: ANALYTICS_CONSTANTS.MAX_RETRY_DELAY,
    backoffMultiplier: ANALYTICS_CONSTANTS.BACKOFF_MULTIPLIER
  };

  private failedEvents: AnalyticsEvent[] = [];
  private isOnline = true;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeConnectionMonitoring();
  }

  /**
   * Track analytics event with comprehensive error handling
   */
  async trackEvent(
    event: string,
    properties: Record<string, unknown> = {},
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
      retryCount: 0
    };

    const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };

    try {
      await this.executeAnalyticsCall(analyticsEvent, config);
    } catch (error) {
      this.handleAnalyticsError(error as AnalyticsError, analyticsEvent, config);
    }
  }

  /**
   * Execute analytics call with retry mechanism
   */
  private async executeAnalyticsCall(
    analyticsEvent: AnalyticsEvent,
    config: RetryConfig,
    attempt: number = 0
  ): Promise<void> {
    try {
      // Check if analytics is available
      if (typeof window === 'undefined') {
        throw this.createAnalyticsError('Window undefined', 'WINDOW_UNDEFINED', false);
      }

      if (!window.gtag) {
        throw this.createAnalyticsError('Google Analytics not loaded', 'GTAG_UNAVAILABLE', true);
      }

      // Execute the analytics call
      window.gtag('event', analyticsEvent.event, analyticsEvent.properties);

      // If we had failed events and this succeeded, try to flush them
      if (this.failedEvents.length > 0) {
        this.scheduleRetryFailedEvents();
      }

    } catch (error) {
      const analyticsError = error as AnalyticsError;

      // Determine if error is retryable
      if (!this.isRetryableError(analyticsError) || attempt >= config.maxRetries) {
        throw analyticsError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * ANALYTICS_CONSTANTS.JITTER_MAX;

      await new Promise(resolve => setTimeout(resolve, jitteredDelay));

      // Retry the call
      return this.executeAnalyticsCall(analyticsEvent, config, attempt + 1);
    }
  }

  /**
   * Handle analytics errors with appropriate strategies
   */
  private handleAnalyticsError(
    error: AnalyticsError,
    analyticsEvent: AnalyticsEvent,
    config: RetryConfig
  ): void {
    // Log error for monitoring (non-blocking)
    this.logAnalyticsError(error, analyticsEvent);

    // Queue for retry if retryable
    if (this.isRetryableError(error)) {
      analyticsEvent.retryCount = (analyticsEvent.retryCount || 0) + 1;
      
      if (analyticsEvent.retryCount <= config.maxRetries) {
        this.queueFailedEvent(analyticsEvent);
        this.scheduleRetryFailedEvents();
      } else {
        // Max retries reached, log and drop
        Logger.warn('Analytics: Max retries reached for event', { event: analyticsEvent.event });
      }
    }

    // Don't throw - analytics failures should not break user experience
  }

  /**
   * Queue failed events for retry
   */
  private queueFailedEvent(event: AnalyticsEvent): void {
    // Limit queue size to prevent memory leaks
    const MAX_QUEUE_SIZE = 100;
    
    if (this.failedEvents.length >= MAX_QUEUE_SIZE) {
      // Remove oldest events
      this.failedEvents.shift();
    }
    
    this.failedEvents.push(event);
  }

  /**
   * Schedule retry of failed events
   */
  private scheduleRetryFailedEvents(): void {
    if (this.retryTimeoutId || this.failedEvents.length === 0) {
      return;
    }

    this.retryTimeoutId = setTimeout(async () => {
      await this.retryFailedEvents();
      this.retryTimeoutId = null;
    }, ANALYTICS_CONSTANTS.RETRY_DELAY);
  }

  /**
   * Retry failed events
   */
  private async retryFailedEvents(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    const eventsToRetry = [...this.failedEvents];
    this.failedEvents = [];

    for (const event of eventsToRetry) {
      try {
        await this.executeAnalyticsCall(event, this.DEFAULT_RETRY_CONFIG);
      } catch (error) {
        // Re-queue if still failing
        this.handleAnalyticsError(error as AnalyticsError, event, this.DEFAULT_RETRY_CONFIG);
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
      // Only log non-expected errors in development to reduce noise
      if (error.code !== 'GTAG_UNAVAILABLE') {
        Logger.warn('Analytics Error:', {
          error: error.message,
          code: error.code,
          event: event.event,
          retryable: error.retryable,
          timestamp: error.timestamp
        });
      }
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Send to monitoring service (non-blocking)
        this.sendToMonitoring({
          type: 'analytics_error',
          error: error.message,
          code: error.code,
          event: event.event,
          timestamp: error.timestamp
        });
      } catch (monitoringError) {
        // Fail silently - don't let monitoring errors break the app
      }
    }
  }

  /**
   * Initialize connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.scheduleRetryFailedEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.isOnline = navigator.onLine;
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoring(data: Record<string, unknown>): void {
    // Implementation would depend on monitoring service (Sentry, DataDog, etc.)
    // For now, we'll use a simple endpoint call with timeout
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

  /**
   * Get service health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    failedEventsCount: number;
    isOnline: boolean;
  } {
    return {
      isHealthy: this.failedEvents.length < 50, // Arbitrary threshold
      failedEventsCount: this.failedEvents.length,
      isOnline: this.isOnline
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsResilientService();

// Export types for external use
export type { AnalyticsEvent, RetryConfig, AnalyticsError };