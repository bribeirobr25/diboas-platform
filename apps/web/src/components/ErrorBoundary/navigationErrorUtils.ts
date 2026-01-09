/**
 * Navigation Error Utilities
 *
 * Helper functions for navigation error handling
 */

/**
 * Patterns that indicate a recoverable error
 */
const RECOVERABLE_ERROR_PATTERNS = [
  /network/i,
  /timeout/i,
  /loading/i,
  /chunk/i,
  /dynamic import/i,
  /temporarily/i
];

/**
 * Determine if an error is recoverable (can be retried)
 */
export function isRecoverableError(error: Error): boolean {
  return RECOVERABLE_ERROR_PATTERNS.some(pattern =>
    pattern.test(error.message) || pattern.test(error.name)
  );
}

/**
 * Generate a unique error ID for tracking
 */
export function generateErrorId(): string {
  return `nav_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  retryCount: number,
  baseDelay: number,
  maxDelay: number
): number {
  return Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
}
