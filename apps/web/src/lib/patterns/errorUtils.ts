/**
 * Section Error Utilities
 *
 * Error handling and retry mechanisms
 */

import { Logger } from '@/lib/monitoring/Logger';
import type { SectionErrorConfig } from './SectionPattern';

/**
 * Create error boundary for section components
 */
export function createSectionErrorBoundary(
  sectionName: string,
  config: SectionErrorConfig
) {
  return class SectionErrorBoundary extends Error {
    constructor(
      public readonly originalError: Error,
      public readonly context: string,
      public readonly recovery?: () => void
    ) {
      super(`${sectionName} Error: ${originalError.message}`);
      this.name = 'SectionErrorBoundary';
    }

    /**
     * Handle the error with configured recovery strategy
     */
    handle(): boolean {
      Logger.error(`Section error boundary triggered`, {
        sectionName,
        context: this.context,
        error: this.originalError.message,
        stack: this.originalError.stack
      });

      // Attempt recovery if provided
      if (this.recovery && config.enableErrorBoundary) {
        try {
          this.recovery();
          Logger.info('Section error recovery successful', {
            sectionName,
            context: this.context
          });
          return true;
        } catch (recoveryError) {
          Logger.error('Section error recovery failed', {
            sectionName,
            context: this.context,
            recoveryError: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
          });
        }
      }

      return false;
    }
  };
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier, onRetry } = config;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();

      if (attempt > 1) {
        Logger.info('Operation succeeded after retry', {
          attempt,
          maxAttempts
        });
      }

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxAttempts) {
        Logger.error('Operation failed after all retry attempts', {
          attempt,
          maxAttempts,
          error: lastError.message
        });
        break;
      }

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      Logger.warn('Operation failed, retrying', {
        attempt,
        maxAttempts,
        nextRetryIn: delay,
        error: lastError.message
      });

      onRetry?.(attempt, lastError);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
