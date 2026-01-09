/**
 * Error Utility Functions
 *
 * Shared utilities for error handling and severity determination
 */

import type { ErrorSeverity } from './types';

/**
 * Generate a unique error ID
 */
export function generateErrorId(): string {
  return `section-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine error severity based on error type and context
 */
export function determineSeverity(error: Error): ErrorSeverity {
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
export function shouldAttemptRecovery(error: Error, retryCount: number, maxRetries: number): boolean {
  // Don't retry for syntax errors or other unrecoverable errors
  if (error.name === 'SyntaxError') return false;

  // Don't retry if we've already exceeded max retries
  if (retryCount >= maxRetries) return false;

  // Retry for network-related errors
  if (error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.name === 'ChunkLoadError') {
    return true;
  }

  // Retry for certain rendering errors
  if (error.name === 'TypeError' && retryCount < 2) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, retryCount);
}
