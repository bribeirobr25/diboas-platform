/**
 * Section Function Utilities
 *
 * Performance utilities: throttle, debounce, performance monitoring
 */

import { Logger } from '@/lib/monitoring/Logger';

/**
 * Throttle function to prevent rapid successive calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= limitMs) {
      lastCallTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, limitMs - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function to delay execution until calls stop
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delayMs);
  };
}

/**
 * Create a performance monitor for section operations
 */
export function createPerformanceMonitor(sectionName: string) {
  const marks = new Map<string, number>();

  return {
    /**
     * Start measuring an operation
     */
    start(operationName: string): void {
      const markName = `${sectionName}_${operationName}_start`;
      marks.set(operationName, performance.now());

      if (typeof performance.mark === 'function') {
        performance.mark(markName);
      }
    },

    /**
     * End measuring an operation and log duration
     */
    end(operationName: string): number {
      const startTime = marks.get(operationName);
      if (!startTime) {
        Logger.warn('Performance measurement not found', {
          sectionName,
          operationName
        });
        return 0;
      }

      const duration = performance.now() - startTime;
      marks.delete(operationName);

      const markName = `${sectionName}_${operationName}`;
      if (typeof performance.mark === 'function') {
        performance.mark(`${markName}_end`);

        if (typeof performance.measure === 'function') {
          performance.measure(markName, `${markName}_start`, `${markName}_end`);
        }
      }

      Logger.debug('Performance measurement completed', {
        sectionName,
        operationName,
        duration: Math.round(duration * 100) / 100 // Round to 2 decimal places
      });

      return duration;
    },

    /**
     * Get all performance entries for this section
     */
    getEntries(): PerformanceEntry[] {
      if (typeof performance.getEntriesByName !== 'function') {
        return [];
      }

      return performance.getEntriesByName(sectionName);
    }
  };
}
