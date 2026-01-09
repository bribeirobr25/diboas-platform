/**
 * Section Error Boundary - Types
 *
 * Type definitions for error boundary components
 */

import { ErrorInfo, ReactNode } from 'react';

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

export interface SectionErrorBoundaryProps {
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

export interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

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

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
