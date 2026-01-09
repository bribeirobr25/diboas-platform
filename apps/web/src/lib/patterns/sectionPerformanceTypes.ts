/**
 * Section Performance Type Definitions
 *
 * Performance and error handling patterns
 */

/**
 * Performance configuration for sections
 */
export interface SectionPerformanceConfig {
  /** Enable lazy loading for non-critical content */
  enableLazyLoading?: boolean;

  /** Number of items to preload ahead */
  preloadCount?: number;

  /** Timeout for content loading (ms) */
  loadingTimeout?: number;

  /** Throttle time for user interactions (ms) */
  navigationThrottleMs?: number;

  /** Enable image optimization */
  enableImageOptimization?: boolean;

  /** Critical content that should load immediately */
  criticalContent?: string[];
}

/**
 * Loading state management interface
 */
export interface SectionLoadingState {
  /** Overall loading state */
  isLoading: boolean;

  /** Loading progress (0-100) */
  progress: number;

  /** Loading errors */
  errors: Set<string>;

  /** Successfully loaded items */
  loaded: Set<string>;

  /** Items currently being loaded */
  loading: Set<string>;
}

/**
 * Error handling configuration for sections
 */
export interface SectionErrorConfig {
  /** Enable error boundaries */
  enableErrorBoundary?: boolean;

  /** Retry configuration for failed operations */
  retry?: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  };

  /** Fallback content for critical failures */
  fallbackContent?: {
    title: string;
    message: string;
    action?: {
      text: string;
      href?: string;
      onClick?: () => void;
    };
  };

  /** Log error events to analytics */
  logToAnalytics?: boolean;
}

/**
 * Error handling utility interface
 */
export interface SectionErrorHandler {
  /**
   * Handle a recoverable error with fallback
   */
  handleRecoverableError(
    error: Error,
    context: string,
    fallback?: () => void
  ): void;

  /**
   * Handle a critical error that breaks functionality
   */
  handleCriticalError(
    error: Error,
    context: string,
    recovery?: () => void
  ): void;

  /**
   * Log error for monitoring
   */
  logError(
    error: Error,
    context: string,
    metadata?: Record<string, unknown>
  ): void;
}
