/**
 * Centralized Error Reporting Service
 * 
 * Error Handling & System Recovery: Comprehensive error tracking and recovery
 * Monitoring & Observability: Real-time error monitoring and alerting
 * Security & Audit Standards: Secure error reporting with data sanitization
 * Service Agnostic Abstraction: Platform-independent error reporting
 * Product KPIs & Analytics: Error metrics for business insights
 * Domain-Driven Design: Error reporting domain with proper boundaries
 */

import { Logger } from '@/lib/monitoring/Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';
import { alertingService, AlertSeverity } from '@/lib/monitoring/AlertingService';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  RENDERING = 'rendering',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USER_INTERACTION = 'user_interaction',
  THIRD_PARTY = 'third_party',
  UNKNOWN = 'unknown'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  sectionId?: string;
  sectionType?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: number;
  customData?: Record<string, unknown>;
  breadcrumbs?: ErrorBreadcrumb[];
}

/**
 * Error breadcrumb for tracking user actions leading to error
 */
export interface ErrorBreadcrumb {
  timestamp: number;
  message: string;
  category: 'navigation' | 'user_action' | 'http' | 'console' | 'custom';
  level: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

/**
 * Structured error report
 */
export interface ErrorReport {
  id: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    cause?: string;
  };
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  fingerprint: string;
  tags: string[];
  isRecoverable: boolean;
  affectedUsers?: number;
  firstSeen: number;
  lastSeen: number;
  occurrenceCount: number;
}

/**
 * Error reporting configuration
 */
interface ErrorReportingConfig {
  enableReporting: boolean;
  enableBreadcrumbs: boolean;
  maxBreadcrumbs: number;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  enableAutoRecovery: boolean;
  reportingEndpoint?: string;
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  sampleRate: number; // 0.0 to 1.0
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  onError?: (report: ErrorReport) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorReportingConfig = {
  enableReporting: process.env.NODE_ENV === 'production',
  enableBreadcrumbs: true,
  maxBreadcrumbs: 50,
  enablePerformanceTracking: true,
  enableUserTracking: false, // Privacy-conscious default
  enableAutoRecovery: true,
  environment: (process.env.NODE_ENV as any) || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0 // 10% sampling in production
};

/**
 * Centralized Error Reporting Service
 */
export class ErrorReportingService {
  private config: ErrorReportingConfig;
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private reportedErrors = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();
  private sessionId: string;
  private isInitialized = false;

  constructor(config?: Partial<ErrorReportingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize the error reporting service
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      // Unhandled JavaScript errors
      window.addEventListener('error', this.handleGlobalError.bind(this));
      
      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
      
      // Resource loading errors
      window.addEventListener('error', this.handleResourceError.bind(this), true);
    }

    // Set up breadcrumb collection
    if (this.config.enableBreadcrumbs) {
      this.initializeBreadcrumbs();
    }

    // Register with section event bus for section-specific errors
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
        customData: {
          rejectionType: 'unhandled_promise_rejection'
        }
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
            resourceSrc: (target as any).src || (target as any).href,
            resourceLoadError: true
          }
        }
      });
    }
  }

  /**
   * Handle section-specific errors
   */
  private handleSectionError(payload: any): void {
    this.reportError(payload.error, {
      severity: this.mapSeverity(payload.severity),
      category: ErrorCategory.RENDERING,
      context: {
        sectionId: payload.sectionId,
        sectionType: payload.sectionType,
        customData: {
          recoverable: payload.recoverable
        }
      }
    });
  }

  /**
   * Map string severity to enum
   */
  private mapSeverity(severity: string): ErrorSeverity {
    switch (severity) {
      case 'critical': return ErrorSeverity.CRITICAL;
      case 'high': return ErrorSeverity.HIGH;
      case 'medium': return ErrorSeverity.MEDIUM;
      case 'low': return ErrorSeverity.LOW;
      default: return ErrorSeverity.MEDIUM;
    }
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
      // Generate error ID
      const errorId = this.generateErrorId();
      
      // Create fingerprint for deduplication
      const fingerprint = options.fingerprint || this.generateFingerprint(error, options.context);
      
      // Build complete context
      const context: ErrorContext = {
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        breadcrumbs: [...this.breadcrumbs],
        ...options.context
      };

      // Sanitize context for security
      const sanitizedContext = this.sanitizeContext(context);

      // Create error report
      const report: ErrorReport = {
        id: errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause ? String(error.cause) : undefined
        },
        severity: options.severity || this.inferSeverity(error),
        category: options.category || this.inferCategory(error),
        context: sanitizedContext,
        fingerprint,
        tags: this.buildTags(options.tags, context),
        isRecoverable: options.isRecoverable ?? this.inferRecoverability(error),
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
        Logger.debug('Error report skipped due to sampling', { errorId, sampleRate: this.config.sampleRate });
        return errorId;
      }

      // Log error locally
      this.logError(processedReport);

      // Send to external service
      if (this.config.enableReporting) {
        this.sendToExternalService(processedReport);
      }

      // Update occurrence tracking
      this.updateOccurrenceTracking(fingerprint);

      // Call error callback
      this.config.onError?.(processedReport);

      // Send alert for critical errors
      if (processedReport.severity === ErrorSeverity.CRITICAL) {
        alertingService.sendErrorAlert(error, AlertSeverity.CRITICAL, {
          errorId,
          sectionId: processedReport.context.sectionId,
          sectionType: processedReport.context.sectionType,
          fingerprint: processedReport.fingerprint,
          occurrenceCount: processedReport.occurrenceCount
        });
      } else if (processedReport.severity === ErrorSeverity.HIGH) {
        alertingService.sendErrorAlert(error, AlertSeverity.ERROR, {
          errorId,
          sectionId: processedReport.context.sectionId,
          sectionType: processedReport.context.sectionType,
          fingerprint: processedReport.fingerprint,
          occurrenceCount: processedReport.occurrenceCount
        });
      }

      // Add breadcrumb for this error
      this.addBreadcrumb({
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
   * Add breadcrumb for tracking user actions
   */
  public addBreadcrumb(breadcrumb: ErrorBreadcrumb): void {
    if (!this.config.enableBreadcrumbs) return;

    this.breadcrumbs.push(breadcrumb);

    // Maintain breadcrumb limit
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    Logger.debug('Breadcrumb added', { breadcrumb });
  }

  /**
   * Set user context for error reports
   */
  public setUserContext(context: { userId?: string; email?: string; username?: string }): void {
    if (!this.config.enableUserTracking) return;

    // Store sanitized user context
    // Implementation would depend on privacy requirements
    Logger.debug('User context updated', { hasUserId: !!context.userId });
  }

  /**
   * Set custom tags for error reports
   */
  public setTags(tags: Record<string, string>): void {
    // Implementation for setting global tags
    Logger.debug('Global tags updated', { tagCount: Object.keys(tags).length });
  }

  /**
   * Initialize breadcrumb collection
   */
  private initializeBreadcrumbs(): void {
    if (typeof window === 'undefined') return;

    // Track navigation changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.addBreadcrumb({
        timestamp: Date.now(),
        message: `Navigation to ${args[2]}`,
        category: 'navigation',
        level: 'info',
        data: { url: args[2] }
      });
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.addBreadcrumb({
        timestamp: Date.now(),
        message: `Navigation replaced to ${args[2]}`,
        category: 'navigation',
        level: 'info',
        data: { url: args[2] }
      });
      return originalReplaceState.apply(history, args);
    };

    // Track console messages
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.addBreadcrumb({
        timestamp: Date.now(),
        message: args.join(' '),
        category: 'console',
        level: 'error'
      });
      return originalConsoleError.apply(console, args);
    };

    // Track user interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.addBreadcrumb({
        timestamp: Date.now(),
        message: `User clicked ${target.tagName}`,
        category: 'user_action',
        level: 'info',
        data: {
          tagName: target.tagName,
          className: target.className,
          id: target.id
        }
      });
    }, true);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for deduplication
   */
  private generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
    const components = [
      error.name,
      error.message,
      context?.sectionId,
      context?.sectionType
    ].filter(Boolean);

    return btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  /**
   * Infer error severity from error type
   */
  private inferSeverity(error: Error): ErrorSeverity {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return ErrorSeverity.HIGH;
    }
    
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * Infer error category from error type
   */
  private inferCategory(error: Error): ErrorCategory {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return ErrorCategory.NETWORK;
    }
    
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return ErrorCategory.JAVASCRIPT;
    }
    
    if (error.message.includes('render') || error.message.includes('React')) {
      return ErrorCategory.RENDERING;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  /**
   * Infer if error is recoverable
   */
  private inferRecoverability(error: Error): boolean {
    // Syntax errors are typically not recoverable
    if (error.name === 'SyntaxError') return false;
    
    // Network errors might be recoverable
    if (error.message.includes('fetch') || error.message.includes('network')) return true;
    
    // Most other errors are potentially recoverable
    return true;
  }

  /**
   * Build tags array from context
   */
  private buildTags(customTags: string[] = [], context: ErrorContext): string[] {
    const tags = [...customTags];
    
    if (context.sectionType) tags.push(`section:${context.sectionType}`);
    if (context.sectionId) tags.push(`section-id:${context.sectionId}`);
    tags.push(`environment:${this.config.environment}`);
    
    return tags;
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
   * Sanitize context to remove sensitive information
   */
  private sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized = { ...context };
    
    // Remove sensitive keys from custom data
    if (sanitized.customData) {
      const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential', 'ssn', 'email'];
      
      Object.keys(sanitized.customData).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized.customData![key] = '[REDACTED]';
        }
      });
    }
    
    return sanitized;
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
      Logger.debug('No reporting endpoint configured, skipping external reporting');
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
      Logger.warn('Failed to send error report to external service', { 
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

    // Initialize counters
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
    this.breadcrumbs = [];
    Logger.info('Error history cleared');
  }
}

// Singleton instance
export const errorReportingService = new ErrorReportingService({
  enableReporting: process.env.NODE_ENV === 'production',
  reportingEndpoint: process.env.ERROR_REPORTING_ENDPOINT,
  // API key is server-only - never expose to client
  apiKey: process.env.ERROR_REPORTING_API_KEY
});

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).errorReportingService = errorReportingService;
  }
}