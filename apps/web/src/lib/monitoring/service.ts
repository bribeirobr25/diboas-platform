/**
 * Monitoring Service Implementation
 * Error Tracking: Centralized error and performance monitoring
 * Security: Track security events and violations
 */

import { MonitoringService, ErrorEvent, PerformanceIssue, SecurityEvent, MonitoringConfig } from './types';
import { MONITORING_DEFAULTS } from './constants';

class MonitoringServiceImpl implements MonitoringService {
  private config: MonitoringConfig;
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceIssue[] = [];
  private securityQueue: SecurityEvent[] = [];
  private userContext: Record<string, any> = {};
  private globalContext: Record<string, any> = {};
  private flushTimer?: NodeJS.Timeout;

  constructor(config: MonitoringConfig = MONITORING_DEFAULTS) {
    this.config = config;
    this.initializeGlobalHandlers();
    this.startAutoFlush();
  }

  /**
   * Track JavaScript errors
   * Error Handling: Centralized error tracking
   */
  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.config.enabled || !this.config.trackErrors) return;

    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userId: this.userContext.userId,
      sessionId: this.userContext.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      locale: this.globalContext.locale,
      severity: this.classifyErrorSeverity(error),
      category: this.classifyErrorCategory(error),
      metadata: {
        ...this.globalContext,
        ...context
      }
    };

    this.errorQueue.push(errorEvent);

    // Limit queue size to prevent memory issues
    if (this.errorQueue.length > this.config.maxErrors) {
      this.errorQueue.shift();
    }

    // Log critical errors immediately
    if (errorEvent.severity === 'critical') {
      console.error('Critical error tracked:', errorEvent);
      this.flush();
    }
  }

  /**
   * Track performance issues
   * Performance: Monitor app performance problems
   */
  trackPerformanceIssue(issue: PerformanceIssue): void {
    if (!this.config.enabled || !this.config.trackPerformance) return;

    this.performanceQueue.push({
      ...issue,
      id: issue.id || this.generateId(),
      timestamp: issue.timestamp || Date.now()
    });
  }

  /**
   * Track security events
   * Security: Monitor security violations and attempts
   */
  trackSecurityEvent(event: SecurityEvent): void {
    if (!this.config.enabled || !this.config.trackSecurity) return;

    this.securityQueue.push({
      ...event,
      id: event.id || this.generateId(),
      timestamp: event.timestamp || Date.now()
    });

    // Log high/critical security events immediately
    if (event.severity === 'high' || event.severity === 'critical') {
      console.warn('Security event tracked:', event);
      this.flush();
    }
  }

  /**
   * Set user context for tracking
   * User Context: Associate events with users
   */
  setUser(userId: string, metadata?: Record<string, any>): void {
    this.userContext = {
      userId,
      ...metadata
    };
  }

  /**
   * Set global context
   * Context: Add metadata to all events
   */
  setContext(key: string, value: any): void {
    this.globalContext[key] = value;
  }

  /**
   * Flush all queued events
   * Performance: Batch events for efficiency
   */
  async flush(): Promise<void> {
    if (!this.hasEventsToFlush()) return;

    const payload = {
      errors: [...this.errorQueue],
      performance: [...this.performanceQueue],
      security: [...this.securityQueue],
      timestamp: Date.now(),
      context: this.globalContext
    };

    // Clear queues
    this.errorQueue = [];
    this.performanceQueue = [];
    this.securityQueue = [];

    try {
      await this.sendToMonitoringService(payload);
    } catch (error) {
      console.error('Failed to flush monitoring events:', error);
    }
  }

  /**
   * Private: Initialize global error handlers
   */
  private initializeGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'unhandled_error'
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'unhandled_promise_rejection'
      });
    });

    // Handle CSP violations
    window.addEventListener('securitypolicyviolation', (event) => {
      this.trackSecurityEvent({
        id: this.generateId(),
        type: 'csp_violation',
        description: `CSP violation: ${event.violatedDirective}`,
        url: event.documentURI,
        timestamp: Date.now(),
        severity: 'medium',
        metadata: {
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          originalPolicy: event.originalPolicy
        }
      });
    });
  }

  /**
   * Private: Classify error severity
   */
  private classifyErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }

    if (message.includes('security') || message.includes('cors')) {
      return 'high';
    }

    if (message.includes('memory') || message.includes('stack overflow')) {
      return 'critical';
    }

    return 'low';
  }

  /**
   * Private: Classify error category
   */
  private classifyErrorCategory(error: Error): 'javascript' | 'network' | 'security' | 'performance' | 'user' {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return 'network';
    }

    if (message.includes('security') || message.includes('cors') || message.includes('csp')) {
      return 'security';
    }

    if (message.includes('performance') || message.includes('memory') || message.includes('slow')) {
      return 'performance';
    }

    return 'javascript';
  }

  /**
   * Private: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Private: Check if there are events to flush
   */
  private hasEventsToFlush(): boolean {
    return this.errorQueue.length > 0 ||
      this.performanceQueue.length > 0 ||
      this.securityQueue.length > 0;
  }

  /**
   * Private: Send events to monitoring service
   */
  private async sendToMonitoringService(payload: any): Promise<void> {
    if (!this.config.endpoint) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`);
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
export const monitoringService = new MonitoringServiceImpl();