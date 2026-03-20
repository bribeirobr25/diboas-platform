/**
 * Monitoring Service Implementation
 * Error Tracking: Centralized error and performance monitoring
 * Security: Track security events and violations
 */

import { Logger } from '@/lib/monitoring/Logger';
import { MonitoringService, ErrorEvent, PerformanceIssue, SecurityEvent, MonitoringConfig } from './types';
import { MONITORING_DEFAULTS } from './constants';
import { errorReportingService } from '@/lib/errors/ErrorReportingService';

class MonitoringCoordinatorService implements MonitoringService {
  private config: MonitoringConfig;
  private errorQueue: ErrorEvent[] = [];
  private performanceQueue: PerformanceIssue[] = [];
  private securityQueue: SecurityEvent[] = [];
  private userContext: Record<string, unknown> = {};
  private globalContext: Record<string, unknown> = {};
  private flushTimer?: NodeJS.Timeout;

  // Store bound handlers for proper cleanup
  // Single coordinator pattern: track locally then delegate to ErrorReportingService
  private boundHandleError = (event: globalThis.ErrorEvent) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message);
    this.trackError(error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'unhandled_error'
    });
    errorReportingService.handleError(error);
  };
  private boundHandleRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.trackError(error, {
      type: 'unhandled_promise_rejection'
    });
    errorReportingService.handleError(error);
  };
  private boundHandleCspViolation = (event: SecurityPolicyViolationEvent) => {
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
  };

  constructor(config: MonitoringConfig = MONITORING_DEFAULTS) {
    this.config = config;
    this.initializeGlobalHandlers();
    this.startAutoFlush();
  }

  /**
   * Track JavaScript errors
   * Error Handling: Centralized error tracking
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    if (!this.config.enabled || !this.config.trackErrors) return;

    const errorEvent: ErrorEvent = {
      id: this.generateId(),
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      userId: this.userContext.userId as string | undefined,
      sessionId: this.userContext.sessionId as string | undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      locale: this.globalContext.locale as string | undefined,
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
      Logger.error('Critical error tracked', { ...errorEvent });
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
      Logger.warn('Security event tracked', { ...event });
      this.flush();
    }
  }

  /**
   * Set user context for tracking
   * User Context: Associate events with users
   */
  setUser(userId: string, metadata?: Record<string, unknown>): void {
    this.userContext = {
      userId,
      ...metadata
    };
  }

  /**
   * Set global context
   * Context: Add metadata to all events
   */
  setContext(key: string, value: unknown): void {
    this.globalContext[key] = value;
  }

  /**
   * Flush all queued events
   * Performance: Batch events for efficiency
   */
  async flush(): Promise<void> {
    if (!this.hasEventsToFlush()) return;

    const errors = [...this.errorQueue];
    const performance = [...this.performanceQueue];
    const security = [...this.securityQueue];

    const payload = {
      errors,
      performance,
      security,
      timestamp: Date.now(),
      context: this.globalContext
    };

    // Clear queues before send to prevent duplicate flush
    this.errorQueue = [];
    this.performanceQueue = [];
    this.securityQueue = [];

    try {
      await this.sendToMonitoringService(payload);
    } catch (error) {
      // Re-add events to queues on failure to prevent data loss
      this.errorQueue.unshift(...errors);
      this.performanceQueue.unshift(...performance);
      this.securityQueue.unshift(...security);
      Logger.error('Failed to flush monitoring events:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Private: Initialize global error handlers
   */
  private initializeGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', this.boundHandleError);
    window.addEventListener('unhandledrejection', this.boundHandleRejection);
    window.addEventListener('securitypolicyviolation', this.boundHandleCspViolation);
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
  private async sendToMonitoringService(payload: {
    errors: ErrorEvent[];
    performance: PerformanceIssue[];
    security: SecurityEvent[];
    timestamp: number;
    context: Record<string, unknown>;
  }): Promise<void> {
    if (!this.config.endpoint) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
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

    // Remove global handlers
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.boundHandleError);
      window.removeEventListener('unhandledrejection', this.boundHandleRejection);
      window.removeEventListener('securitypolicyviolation', this.boundHandleCspViolation);
    }

    this.flush(); // Final flush
  }
}

// Export singleton instance
export const monitoringService = new MonitoringCoordinatorService();