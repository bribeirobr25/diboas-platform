/**
 * IErrorReporter Interface
 *
 * Public API contract for error reporting services.
 * Allows swapping the concrete implementation (e.g. for testing or
 * switching from Sentry to another provider) without changing consumers.
 */

import type { ErrorSeverity, ErrorCategory, ErrorContext } from './errorTypes';

export interface IErrorReporter {
  reportError(
    error: Error,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: Partial<ErrorContext>;
      tags?: string[];
      fingerprint?: string;
      isRecoverable?: boolean;
    }
  ): string;

  captureException(
    error: Error,
    context?: {
      tags?: Record<string, string | undefined>;
      extra?: Record<string, unknown>;
      level?: 'fatal' | 'error' | 'warning' | 'info';
    }
  ): void;

  handleError(error: Error, context?: Partial<ErrorContext>): string;

  addBreadcrumb(breadcrumb: {
    timestamp: number;
    message: string;
    category: 'navigation' | 'user_action' | 'http' | 'console' | 'custom';
    level: 'info' | 'warning' | 'error';
    data?: Record<string, unknown>;
  }): void;

  setUserContext(context: { userId?: string; email?: string; username?: string }): void;

  setTags(tags: Record<string, string>): void;

  getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  };

  clearErrors(): void;

  destroy(): void;
}
