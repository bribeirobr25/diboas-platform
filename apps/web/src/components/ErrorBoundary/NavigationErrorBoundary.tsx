'use client';

/**
 * Navigation Error Boundary
 * Error Handling & System Recovery: Specialized error boundary for navigation components
 * Semantic Naming: Clear purpose-driven naming for navigation-specific error handling
 * Code Reusability: Extends base error boundary with navigation-specific recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import { UI_CONSTANTS, formatRetryMessage, formatErrorId } from '@/config/ui-constants';

interface NavigationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface NavigationErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface NavigationFallbackProps {
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
  errorId: string | null;
}

/**
 * Minimal navigation fallback UI
 */
function NavigationErrorFallback({ 
  onRetry, 
  retryCount, 
  maxRetries, 
  errorId 
}: NavigationFallbackProps) {
  return (
    <nav className="navigation-error-fallback border-b border-neutral-200 bg-white">
      <div className="navigation-error-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="navigation-error-content flex justify-between items-center h-16">
          {/* Minimal brand */}
          <div className="navigation-error-brand">
            <span className="text-xl font-bold text-primary-600">diBoaS</span>
          </div>
          
          {/* Error message and retry */}
          <div className="navigation-error-actions flex items-center space-x-4">
            <span className="text-sm text-neutral-600">
              {UI_CONSTANTS.TEXT.NAVIGATION_ERROR}
            </span>
            
            {retryCount < maxRetries && (
              <button
                onClick={onRetry}
                className="navigation-error-retry bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                aria-label={UI_CONSTANTS.TEXT.RETRY_LOADING}
              >
                {formatRetryMessage(retryCount, maxRetries)}
              </button>
            )}
            
            {process.env.NODE_ENV === 'development' && errorId && (
              <span className="text-xs text-neutral-400 font-mono">
                {formatErrorId(errorId)}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Navigation-specific error boundary with recovery mechanisms
 */
export class NavigationErrorBoundary extends Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private readonly maxRetries: number;

  constructor(props: NavigationErrorBoundaryProps) {
    super(props);
    
    this.maxRetries = props.maxRetries || UI_CONSTANTS.ERROR.ERROR_BOUNDARY_MAX_RETRIES;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<NavigationErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `nav_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';
    
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.error(UI_CONSTANTS.LOG.NAVIGATION_ERROR_CAUGHT, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId,
        retryCount: this.state.retryCount
      });
    }

    // Track error in analytics (non-blocking)
    this.trackNavigationError(error, errorInfo, errorId);

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.warn(UI_CONSTANTS.LOG.NAVIGATION_ERROR_HANDLER_FAILED, handlerError);
      }
    }

    // Schedule automatic retry for recoverable errors
    if (this.isRecoverableError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry();
    }
  }

  /**
   * Track navigation error in analytics
   */
  private trackNavigationError = async (
    error: Error, 
    errorInfo: ErrorInfo, 
    errorId: string
  ) => {
    try {
      await analyticsService.trackEvent('navigation_error', {
        error_id: errorId,
        error_message: error.message,
        error_name: error.name,
        component_stack: errorInfo.componentStack?.split('\n')[0] || 'unknown',
        retry_count: this.state.retryCount,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: new Date().toISOString()
      });
    } catch (analyticsError) {
      // Analytics should not prevent error boundary from working
      console.warn(UI_CONSTANTS.LOG.ANALYTICS_TRACKING_FAILED, analyticsError);
    }
  };

  /**
   * Determine if error is recoverable
   */
  private isRecoverableError = (error: Error): boolean => {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /loading/i,
      /chunk/i,
      /dynamic import/i,
      /temporarily/i
    ];

    return recoverablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  };

  /**
   * Schedule automatic retry with exponential backoff
   */
  private scheduleAutoRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    const delay = Math.min(
      UI_CONSTANTS.ERROR.ERROR_BOUNDARY_RETRY_DELAY * Math.pow(2, this.state.retryCount), 
      UI_CONSTANTS.ERROR.ERROR_BOUNDARY_MAX_DELAY
    );
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  /**
   * Handle manual retry
   */
  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn(UI_CONSTANTS.LOG.NAVIGATION_MAX_RETRY);
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // Clear any scheduled retries
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  };

  /**
   * Component cleanup
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default fallback UI
      return (
        <NavigationErrorFallback
          onRetry={this.handleRetry}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

export default NavigationErrorBoundary;