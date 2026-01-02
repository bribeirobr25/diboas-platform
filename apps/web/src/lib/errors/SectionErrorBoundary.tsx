/**
 * Section Error Boundary
 * 
 * Error Handling & System Recovery: Comprehensive error boundary for sections
 * Monitoring & Observability: Error tracking and reporting
 * Domain-Driven Design: Section domain-specific error handling
 * Service Agnostic Abstraction: Reusable error handling across sections
 * User Experience: Graceful error recovery with fallback UI
 * Security & Audit Standards: Safe error handling without exposing internals
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';

interface SectionErrorBoundaryProps {
  /**
   * Section identifier for error tracking
   */
  sectionId: string;

  /**
   * Section type for categorizing errors
   */
  sectionType: string;

  /**
   * Children components to protect
   */
  children: ReactNode;

  /**
   * Custom fallback UI component
   */
  fallback?: React.ComponentType<SectionErrorFallbackProps>;

  /**
   * Enable error reporting to external services
   */
  enableReporting?: boolean;

  /**
   * Recovery attempt function
   */
  onRetry?: () => void;

  /**
   * Additional context for error reporting
   */
  context?: Record<string, unknown>;

  /**
   * i18n translations for error messages
   */
  translations?: Partial<SectionErrorTranslations>;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

/**
 * Translation strings for the section error boundary
 * Defaults provided for resilience when i18n is unavailable
 */
export interface SectionErrorTranslations {
  title: string;
  message: string;
  canRetry: string;
  tryAgain: string;
  reloadPage: string;
  devDetails: string;
  persistHelp: string;
}

const DEFAULT_SECTION_TRANSLATIONS: SectionErrorTranslations = {
  title: 'Something went wrong',
  message: "We're sorry, but this section couldn't load properly.",
  canRetry: 'You can try reloading it below.',
  tryAgain: 'Try Again',
  reloadPage: 'Reload Page',
  devDetails: 'Error Details (Development Only)',
  persistHelp: 'If this problem persists, please try refreshing the page or contact support.',
};

export interface SectionErrorFallbackProps {
  sectionId: string;
  sectionType: string;
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry?: () => void;
  retryCount: number;
  maxRetries: number;
  translations?: Partial<SectionErrorTranslations>;
}

/**
 * Section Error Boundary with comprehensive error handling
 * Error Handling & System Recovery: Automatic recovery attempts with backoff
 * Monitoring & Observability: Detailed error logging and tracking
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  private static readonly MAX_RETRY_COUNT = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  /**
   * Static method to catch errors during rendering
   */
  static getDerivedStateFromError(error: Error): Partial<SectionErrorBoundaryState> {
    const errorId = `section-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  /**
   * Error handling with comprehensive logging and reporting
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { sectionId, sectionType, enableReporting = true, context } = this.props;
    const errorId = this.state.errorId || 'unknown';

    // Update state with error info
    this.setState({ errorInfo });

    // Log error with comprehensive context
    Logger.error('Section Error Boundary caught error', {
      sectionId,
      sectionType,
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      context,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });

    // Emit error event for monitoring
    sectionEventBus.emit(SectionEventType.SECTION_ERROR, {
      sectionId,
      sectionType,
      timestamp: Date.now(),
      error,
      severity: this.determineSeverity(error),
      recoverable: this.state.retryCount < SectionErrorBoundary.MAX_RETRY_COUNT
    });

    // Report to external error tracking service
    if (enableReporting && typeof window !== 'undefined') {
      this.reportError(error, errorInfo, errorId);
    }

    // Attempt automatic recovery for certain error types
    if (this.shouldAttemptRecovery(error)) {
      this.scheduleRetry();
    }
  }

  /**
   * Cleanup when component unmounts
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Determine error severity based on error type and context
   */
  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors that break core functionality
    if (error.name === 'ChunkLoadError' || 
        error.message.includes('Loading chunk') ||
        error.message.includes('Failed to fetch')) {
      return 'critical';
    }

    // High severity for rendering errors
    if (error.name === 'TypeError' && error.stack?.includes('render')) {
      return 'high';
    }

    // Medium severity for component errors
    if (error.name === 'ReferenceError' || error.name === 'TypeError') {
      return 'medium';
    }

    // Low severity for other errors
    return 'low';
  }

  /**
   * Determine if automatic recovery should be attempted
   */
  private shouldAttemptRecovery(error: Error): boolean {
    // Don't retry for syntax errors or other unrecoverable errors
    if (error.name === 'SyntaxError') return false;
    
    // Don't retry if we've already exceeded max retries
    if (this.state.retryCount >= SectionErrorBoundary.MAX_RETRY_COUNT) return false;
    
    // Retry for network-related errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.name === 'ChunkLoadError') {
      return true;
    }
    
    // Retry for certain rendering errors
    if (error.name === 'TypeError' && this.state.retryCount < 2) {
      return true;
    }
    
    return false;
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry() {
    const delay = SectionErrorBoundary.RETRY_DELAY_BASE * Math.pow(2, this.state.retryCount);
    
    Logger.info('Scheduling error recovery retry', {
      sectionId: this.props.sectionId,
      retryCount: this.state.retryCount + 1,
      delay
    });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  /**
   * Handle retry attempt
   */
  private handleRetry = () => {
    const { sectionId, sectionType, onRetry } = this.props;
    
    Logger.info('Attempting error recovery', {
      sectionId,
      sectionType,
      retryCount: this.state.retryCount + 1
    });

    // Clear error state and increment retry count
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // Call custom retry handler if provided
    onRetry?.();
  };

  /**
   * Manual retry triggered by user
   */
  private handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
    
    this.handleRetry();
  };

  /**
   * Report error to external monitoring service
   */
  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string) {
    // In a real implementation, this would report to services like Sentry, Bugsnag, etc.
    // For now, we'll use the browser's error reporting API if available
    
    try {
      if ('ReportingObserver' in window) {
        // Use Reporting API if available
        const observer = new ReportingObserver((reports) => {
          // Reports are automatically sent to configured endpoints
        });
        observer.observe();
      }
      
      // Send to custom error reporting endpoint if configured
      const errorEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;
      if (errorEndpoint) {
        fetch(errorEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            errorId,
            sectionId: this.props.sectionId,
            sectionType: this.props.sectionType,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack
            },
            errorInfo: {
              componentStack: errorInfo.componentStack
            },
            context: this.props.context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(() => {
          // Silent fail for error reporting to prevent error loops
        });
      }
    } catch (reportingError) {
      Logger.warn('Failed to report error to external service', { 
        originalError: error.message,
        reportingError: reportingError 
      });
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback: CustomFallback, sectionId, sectionType, translations } = this.props;

    if (hasError && error && errorInfo && errorId) {
      // Use custom fallback component if provided
      if (CustomFallback) {
        return (
          <CustomFallback
            sectionId={sectionId}
            sectionType={sectionType}
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            onRetry={this.handleManualRetry}
            retryCount={retryCount}
            maxRetries={SectionErrorBoundary.MAX_RETRY_COUNT}
            translations={translations}
          />
        );
      }

      // Default fallback UI
      return (
        <DefaultSectionErrorFallback
          sectionId={sectionId}
          sectionType={sectionType}
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          onRetry={this.handleManualRetry}
          retryCount={retryCount}
          maxRetries={SectionErrorBoundary.MAX_RETRY_COUNT}
          translations={translations}
        />
      );
    }

    return children;
  }
}

/**
 * Default Error Fallback Component
 * User Experience: Clean, accessible error UI
 * Security: No sensitive information exposed
 * i18n: Accepts translations with fallback defaults
 */
function DefaultSectionErrorFallback({
  sectionId,
  sectionType,
  error,
  errorId,
  onRetry,
  retryCount,
  maxRetries,
  translations
}: SectionErrorFallbackProps) {
  const canRetry = retryCount < maxRetries;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Merge translations with defaults
  const t = { ...DEFAULT_SECTION_TRANSLATIONS, ...translations };

  return (
    <section
      className="section-error-fallback"
      style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: 'var(--error-bg-light, #fef2f2)',
        border: '1px solid var(--error-border-light, #fecaca)',
        borderRadius: '0.5rem',
        margin: '1rem 0'
      }}
      role="alert"
      aria-labelledby={`error-title-${errorId}`}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2
          id={`error-title-${errorId}`}
          style={{
            color: 'var(--error-text-primary, #dc2626)',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '1rem'
          }}
        >
          ⚠️ {t.title}
        </h2>

        <p style={{
          color: 'var(--error-text-secondary, #374151)',
          marginBottom: '1.5rem',
          lineHeight: '1.5'
        }}>
          {t.message}
          {canRetry && ` ${t.canRetry}`}
        </p>

        {/* Development-only error details */}
        {isDevelopment && (
          <details style={{
            backgroundColor: 'var(--error-bg-code, #f9fafb)',
            border: '1px solid var(--error-border-code, #d1d5db)',
            borderRadius: '0.25rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              {t.devDetails}
            </summary>
            <pre style={{
              fontSize: '0.75rem',
              marginTop: '0.5rem',
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              Section: {sectionType} ({sectionId}){'\n'}
              Error: {error.name}: {error.message}{'\n'}
              Error ID: {errorId}{'\n'}
              Retry Count: {retryCount}/{maxRetries}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              style={{
                backgroundColor: 'var(--error-button-primary, #3b82f6)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error-button-primary-hover, #2563eb)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error-button-primary, #3b82f6)';
              }}
            >
              🔄 {t.tryAgain}
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'var(--error-button-secondary, #6b7280)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--error-button-secondary-hover, #4b5563)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--error-button-secondary, #6b7280)';
            }}
          >
            🔄 {t.reloadPage}
          </button>
        </div>

        {/* Help text */}
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--error-button-secondary, #6b7280)',
          marginTop: '1.5rem'
        }}>
          {t.persistHelp}
        </p>
      </div>
    </section>
  );
}

/**
 * Higher-Order Component for wrapping sections with error boundary
 * Service Agnostic Abstraction: Easy integration with any section component
 */
export function withSectionErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  sectionId: string,
  sectionType: string,
  options?: Omit<SectionErrorBoundaryProps, 'children' | 'sectionId' | 'sectionType'>
) {
  const WrappedWithErrorBoundary = (props: P) => {
    return (
      <SectionErrorBoundary
        sectionId={sectionId}
        sectionType={sectionType}
        {...options}
      >
        <WrappedComponent {...props} />
      </SectionErrorBoundary>
    );
  };

  WrappedWithErrorBoundary.displayName = `withSectionErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WrappedWithErrorBoundary;
}