'use client';

/**
 * Navigation Error Boundary
 * Error Handling & System Recovery: Specialized error boundary for navigation components
 * Semantic Naming: Clear purpose-driven naming for navigation-specific error handling
 * Code Reusability: Extends base error boundary with navigation-specific recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { analyticsService } from '@/lib/analytics/error-resilient-service';
import { UI_CONSTANTS } from '@/config/ui-constants';
import { NavigationErrorFallback } from './NavigationErrorFallback';
import {
  isRecoverableError,
  generateErrorId,
  calculateRetryDelay
} from './navigationErrorUtils';

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
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';

    this.setState({ errorInfo });

    if (process.env.NODE_ENV === 'development') {
      console.error(UI_CONSTANTS.LOG.NAVIGATION_ERROR_CAUGHT, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId,
        retryCount: this.state.retryCount
      });
    }

    this.trackNavigationError(error, errorInfo, errorId);

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.warn(UI_CONSTANTS.LOG.NAVIGATION_ERROR_HANDLER_FAILED, handlerError);
      }
    }

    if (isRecoverableError(error) && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry();
    }
  }

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
      console.warn(UI_CONSTANTS.LOG.ANALYTICS_TRACKING_FAILED, analyticsError);
    }
  };

  private scheduleAutoRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    const delay = calculateRetryDelay(
      this.state.retryCount,
      UI_CONSTANTS.ERROR.ERROR_BOUNDARY_RETRY_DELAY,
      UI_CONSTANTS.ERROR.ERROR_BOUNDARY_MAX_DELAY
    );

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

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

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

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
