'use client';

/**
 * Navigation Error Fallback Component
 *
 * Minimal UI displayed when navigation fails to load
 */

import { UI_CONSTANTS, formatRetryMessage, formatErrorId } from '@/config/ui-constants';

export interface NavigationFallbackProps {
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
  errorId: string | null;
}

/**
 * Minimal navigation fallback UI
 */
export function NavigationErrorFallback({
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
