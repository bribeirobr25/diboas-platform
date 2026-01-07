/**
 * Analytics Service Implementation
 * Service Agnostic Abstraction: Centralized analytics logic
 * Privacy-First: Client-side tracking with user consent
 */

import { AnalyticsService, AnalyticsEvent, AnalyticsConfig, WebVitalsMetric } from './types';
import { ANALYTICS_DEFAULTS } from './constants';
import { Logger } from '@/lib/monitoring/Logger';

class AnalyticsServiceImpl implements AnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private userId?: string;
  private sessionId?: string;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: AnalyticsConfig = ANALYTICS_DEFAULTS) {
    this.config = config;
    this.initializeSession();
    this.startAutoFlush();
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
      sessionId: this.sessionId
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

      // Example: Send to Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        events.forEach(event => {
          (window as any).gtag('event', event.name, event.parameters);
        });
      }

      // Example: Send to custom analytics endpoint
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
      console.error('Failed to flush analytics events:', error);
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
   * Private: Initialize session
   */
  private initializeSession(): void {
    // Generate session ID if not provided
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
  }

  /**
   * Private: Start automatic flush timer
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsServiceImpl();