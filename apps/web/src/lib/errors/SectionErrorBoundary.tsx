/**
 * Section Error Boundary
 *
 * Error Handling & System Recovery: Comprehensive error boundary for sections
 * Monitoring & Observability: Error tracking and reporting
 * Domain-Driven Design: Section domain-specific error handling
 * Service Agnostic Abstraction: Reusable error handling across sections
 * User Experience: Graceful error recovery with fallback UI
 * Security & Audit Standards: Safe error handling without exposing internals
 *
 * Refactored: Types, constants, and fallback component extracted for maintainability
 */

'use client';

import React, { Component, ErrorInfo } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import { sectionEventBus, SectionEventType } from '@/lib/events/SectionEventBus';
import type { SectionErrorBoundaryProps, SectionErrorBoundaryState } from './types';
import { MAX_RETRY_COUNT, RETRY_DELAY_BASE } from './constants';
import { DefaultSectionErrorFallback } from './DefaultSectionErrorFallback';
import { generateErrorId, determineSeverity, shouldAttemptRecovery, calculateRetryDelay } from './errorUtils';

// Re-export types for backwards compatibility
export type { SectionErrorTranslations, SectionErrorFallbackProps } from './types';

/**
 * Section Error Boundary with comprehensive error handling
 * Error Handling & System Recovery: Automatic recovery attempts with backoff
 * Monitoring & Observability: Detailed error logging and tracking
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
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
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
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
      severity: determineSeverity(error),
      recoverable: this.state.retryCount < MAX_RETRY_COUNT
    });

    // Report to external error tracking service
    if (enableReporting && typeof window !== 'undefined') {
      this.reportError(error, errorInfo, errorId);
    }

    // Attempt automatic recovery for certain error types
    if (shouldAttemptRecovery(error, this.state.retryCount, MAX_RETRY_COUNT)) {
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
   * Schedule retry with exponential backoff
   */
  private scheduleRetry() {
    const delay = calculateRetryDelay(this.state.retryCount, RETRY_DELAY_BASE);

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
    try {
      if ('ReportingObserver' in window) {
        const observer = new ReportingObserver(() => {
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
            maxRetries={MAX_RETRY_COUNT}
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
          maxRetries={MAX_RETRY_COUNT}
          translations={translations}
        />
      );
    }

    return children;
  }
}
