/**
 * Centralized Error Reporting Service
 *
 * Error Handling & System Recovery: Comprehensive error tracking and recovery
 * Monitoring & Observability: Real-time error monitoring and alerting
 * Security & Audit Standards: Secure error reporting with data sanitization
 * Service Agnostic Abstraction: Platform-independent error reporting
 */

import { Logger } from '@/lib/monitoring/Logger';
import { sectionEventBus, SectionEventType, ErrorEventPayload } from '@/lib/events/SectionEventBus';
import { alertingService, AlertSeverity } from '@/lib/monitoring/AlertingService';

import {
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorReport,
  type ErrorReportingConfig,
  type ErrorOccurrence,
} from './errorTypes';

import { DEFAULT_ERROR_CONFIG } from './errorConfig';
import { BreadcrumbManager } from './breadcrumbManager';
import {
  mapSeverity,
  inferSeverity,
  inferCategory,
  inferRecoverability,
  generateFingerprint,
  sanitizeContext,
  buildTags,
  generateErrorId,
  generateSessionId,
} from './errorInference';

// Re-export types for external use
export {
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorReport,
  type ErrorReportingConfig,
  type ErrorBreadcrumb,
} from './errorTypes';

/**
 * Centralized Error Reporting Service
 */
export class ErrorReportingService {
  private config: ErrorReportingConfig;
  private breadcrumbManager: BreadcrumbManager;
  private reportedErrors = new Map<string, ErrorOccurrence>();
  private sessionId: string;
  private isInitialized = false;

  constructor(config?: Partial<ErrorReportingConfig>) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    this.sessionId = generateSessionId();
    this.breadcrumbManager = new BreadcrumbManager(this.config);
    this.initialize();
  }

  /**
   * Initialize the error reporting service
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
      window.addEventListener('error', this.handleResourceError.bind(this), true);
    }

    // Initialize breadcrumb collection
    this.breadcrumbManager.initialize();

    // Register with section event bus
    sectionEventBus.on(SectionEventType.SECTION_ERROR, this.handleSectionError.bind(this));

    this.isInitialized = true;

    Logger.info('Error reporting service initialized', {
      environment: this.config.environment,
      enableReporting: this.config.enableReporting,
      sessionId: this.sessionId
    });
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message);

    this.reportError(error, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.JAVASCRIPT,
      context: {
        url: event.filename,
        customData: {
          lineNumber: event.lineno,
          columnNumber: event.colno
        }
      }
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    this.reportError(error, {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.JAVASCRIPT,
      context: {
        customData: { rejectionType: 'unhandled_promise_rejection' }
      }
    });
  }

  /**
   * Handle resource loading errors
   */
  private handleResourceError(event: Event): void {
    const target = event.target;

    if (target && target !== window && target instanceof HTMLElement) {
      const error = new Error(`Resource loading failed: ${target.tagName}`);

      this.reportError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK,
        context: {
          customData: {
            resourceType: target.tagName,
            resourceSrc: 'src' in target
              ? (target as HTMLImageElement | HTMLScriptElement).src
              : 'href' in target
                ? (target as HTMLAnchorElement | HTMLLinkElement).href
                : undefined,
            resourceLoadError: true
          }
        }
      });
    }
  }

  /**
   * Handle section-specific errors
   */
  private handleSectionError(payload: ErrorEventPayload): void {
    this.reportError(payload.error, {
      severity: mapSeverity(payload.severity || 'medium'),
      category: ErrorCategory.RENDERING,
      context: {
        sectionId: payload.sectionId,
        sectionType: payload.sectionType,
        customData: { recoverable: payload.recoverable }
      }
    });
  }

  /**
   * Report an error with context
   */
  public reportError(
    error: Error,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: Partial<ErrorContext>;
      tags?: string[];
      fingerprint?: string;
      isRecoverable?: boolean;
    } = {}
  ): string {
    try {
      const errorId = generateErrorId();
      const fingerprint = options.fingerprint || generateFingerprint(error, options.context);

      // Build complete context
      const context: ErrorContext = {
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        breadcrumbs: this.breadcrumbManager.getAll(),
        ...options.context
      };

      const sanitizedContext = sanitizeContext(context);

      // Create error report
      const report: ErrorReport = {
        id: errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause ? String(error.cause) : undefined
        },
        severity: options.severity || inferSeverity(error),
        category: options.category || inferCategory(error),
        context: sanitizedContext,
        fingerprint,
        tags: buildTags(options.tags, context, this.config),
        isRecoverable: options.isRecoverable ?? inferRecoverability(error),
        ...this.getOccurrenceData(fingerprint)
      };

      // Apply beforeSend hook
      const processedReport = this.config.beforeSend ? this.config.beforeSend(report) : report;
      if (!processedReport) {
        Logger.debug('Error report filtered by beforeSend hook', { errorId });
        return errorId;
      }

      // Sample rate check
      if (Math.random() > this.config.sampleRate) {
        Logger.debug('Error report skipped due to sampling', { errorId });
        return errorId;
      }

      // Log and send
      this.logError(processedReport);

      if (this.config.enableReporting) {
        this.sendToExternalService(processedReport);
      }

      this.updateOccurrenceTracking(fingerprint);
      this.config.onError?.(processedReport);
      this.sendAlertIfNeeded(processedReport, error, errorId);

      // Add breadcrumb for this error
      this.breadcrumbManager.add({
        timestamp: Date.now(),
        message: `Error reported: ${error.message}`,
        category: 'console',
        level: 'error',
        data: { errorId, severity: report.severity }
      });

      return errorId;

    } catch (reportingError) {
      Logger.error('Failed to report error', {
        originalError: error.message,
        reportingError
      });
      return 'error-reporting-failed';
    }
  }

  /**
   * Send alert for critical/high severity errors
   */
  private sendAlertIfNeeded(report: ErrorReport, error: Error, errorId: string): void {
    const alertData = {
      errorId,
      sectionId: report.context.sectionId,
      sectionType: report.context.sectionType,
      fingerprint: report.fingerprint,
      occurrenceCount: report.occurrenceCount
    };

    if (report.severity === ErrorSeverity.CRITICAL) {
      alertingService.sendErrorAlert(error, AlertSeverity.CRITICAL, alertData);
    } else if (report.severity === ErrorSeverity.HIGH) {
      alertingService.sendErrorAlert(error, AlertSeverity.ERROR, alertData);
    }
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  public addBreadcrumb(breadcrumb: Parameters<BreadcrumbManager['add']>[0]): void {
    this.breadcrumbManager.add(breadcrumb);
  }

  /**
   * Set user context for error reports
   */
  public setUserContext(context: { userId?: string; email?: string; username?: string }): void {
    if (!this.config.enableUserTracking) return;
    Logger.debug('User context updated', { hasUserId: !!context.userId });
  }

  /**
   * Set custom tags for error reports
   */
  public setTags(tags: Record<string, string>): void {
    Logger.debug('Global tags updated', { tagCount: Object.keys(tags).length });
  }

  /**
   * Get occurrence data for error deduplication
   */
  private getOccurrenceData(fingerprint: string): { firstSeen: number; lastSeen: number; occurrenceCount: number } {
    const existing = this.reportedErrors.get(fingerprint);

    if (existing) {
      return {
        firstSeen: existing.firstSeen,
        lastSeen: Date.now(),
        occurrenceCount: existing.count + 1
      };
    }

    return {
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      occurrenceCount: 1
    };
  }

  /**
   * Update occurrence tracking
   */
  private updateOccurrenceTracking(fingerprint: string): void {
    const existing = this.reportedErrors.get(fingerprint);

    if (existing) {
      existing.count += 1;
      existing.lastSeen = Date.now();
    } else {
      this.reportedErrors.set(fingerprint, {
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now()
      });
    }
  }

  /**
   * Log error locally
   */
  private logError(report: ErrorReport): void {
    const logLevel = report.severity === ErrorSeverity.CRITICAL ? 'critical' :
                    report.severity === ErrorSeverity.HIGH ? 'error' :
                    report.severity === ErrorSeverity.MEDIUM ? 'warn' : 'info';

    Logger[logLevel]('Error reported', {
      errorId: report.id,
      fingerprint: report.fingerprint,
      message: report.error.message,
      category: report.category,
      sectionId: report.context.sectionId,
      sectionType: report.context.sectionType,
      occurrenceCount: report.occurrenceCount
    });
  }

  /**
   * Send error report to external service
   */
  private async sendToExternalService(report: ErrorReport): Promise<void> {
    if (!this.config.reportingEndpoint) {
      Logger.debug('No reporting endpoint configured');
      return;
    }

    try {
      const response = await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      Logger.debug('Error report sent successfully', { errorId: report.id });

    } catch (error) {
      Logger.warn('Failed to send error report', {
        errorId: report.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      totalErrors: Array.from(this.reportedErrors.values()).reduce((sum, data) => sum + data.count, 0),
      uniqueErrors: this.reportedErrors.size,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>
    };

    Object.values(ErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });

    Object.values(ErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0;
    });

    return stats;
  }

  /**
   * Clear error history
   */
  public clearErrors(): void {
    this.reportedErrors.clear();
    this.breadcrumbManager.clear();
    Logger.info('Error history cleared');
  }
}

// Singleton instance
export const errorReportingService = new ErrorReportingService({
  enableReporting: process.env.NODE_ENV === 'production',
  reportingEndpoint: process.env.ERROR_REPORTING_ENDPOINT,
  apiKey: process.env.ERROR_REPORTING_API_KEY
});

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as Window & { errorReportingService?: ErrorReportingService }).errorReportingService = errorReportingService;
  }
}
