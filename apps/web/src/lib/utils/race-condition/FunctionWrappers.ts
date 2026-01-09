/**
 * Function Wrapper Utilities
 *
 * Debounce and Throttle wrappers with race condition prevention
 */

import { SafeTimer } from './SafeTimers';

/**
 * Debounced Function with race condition prevention
 * Prevents rapid successive calls that could cause race conditions
 */
export class DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  private timer: SafeTimer;
  private readonly fn: T;
  private readonly delay: number;

  constructor(fn: T, delay: number, label: string) {
    this.fn = fn;
    this.delay = delay;
    this.timer = new SafeTimer(`debounced-${label}`);
  }

  /**
   * Execute the debounced function
   */
  execute(...args: Parameters<T>): void {
    this.timer.set(() => {
      this.fn(...args);
    }, this.delay);
  }

  /**
   * Cancel pending execution
   */
  cancel(): void {
    this.timer.clear();
  }

  /**
   * Check if execution is pending
   */
  get pending(): boolean {
    return this.timer.active;
  }
}

/**
 * Throttled Function with race condition prevention
 * Limits function execution frequency to prevent race conditions
 */
export class ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  private lastExecution = 0;
  private timer: SafeTimer;
  private readonly fn: T;
  private readonly delay: number;

  constructor(fn: T, delay: number, label: string) {
    this.fn = fn;
    this.delay = delay;
    this.timer = new SafeTimer(`throttled-${label}`);
  }

  /**
   * Execute the throttled function
   */
  execute(...args: Parameters<T>): void {
    const now = Date.now();
    const timeSinceLastExecution = now - this.lastExecution;

    if (timeSinceLastExecution >= this.delay) {
      // Execute immediately
      this.lastExecution = now;
      this.fn(...args);
    } else {
      // Schedule for later execution
      const remainingTime = this.delay - timeSinceLastExecution;
      this.timer.set(() => {
        this.lastExecution = Date.now();
        this.fn(...args);
      }, remainingTime);
    }
  }

  /**
   * Cancel pending execution
   */
  cancel(): void {
    this.timer.clear();
  }

  /**
   * Check if execution is pending
   */
  get pending(): boolean {
    return this.timer.active;
  }
}
