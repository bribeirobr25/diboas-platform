/**
 * Safe Timer Utilities
 *
 * Timer, Interval, and AnimationFrame wrappers with automatic cleanup
 * Prevents memory leaks and race conditions
 */

import { Logger } from '@/lib/monitoring/Logger';

/**
 * Timer Reference with automatic cleanup
 * Prevents memory leaks and race conditions in timers
 */
export class SafeTimer {
  private timerId: NodeJS.Timeout | null = null;
  private isActive = false;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * Set a new timer, automatically clearing any existing one
   */
  set(callback: () => void, delay: number): void {
    this.clear();
    this.isActive = true;

    this.timerId = setTimeout(() => {
      if (this.isActive) {
        try {
          callback();
        } catch (error) {
          Logger.error(`Timer callback error in ${this.label}`, { error });
        }
      }
      this.isActive = false;
    }, delay);

    Logger.debug(`Timer set for ${this.label}`, { delay });
  }

  /**
   * Clear the timer and mark as inactive
   */
  clear(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isActive = false;
    Logger.debug(`Timer cleared for ${this.label}`);
  }

  /**
   * Check if timer is currently active
   */
  get active(): boolean {
    return this.isActive;
  }
}

/**
 * Interval Reference with automatic cleanup
 * Prevents memory leaks and race conditions in intervals
 */
export class SafeInterval {
  private intervalId: NodeJS.Timeout | null = null;
  private isActive = false;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * Set a new interval, automatically clearing any existing one
   */
  set(callback: () => void, delay: number): void {
    this.clear();
    this.isActive = true;

    this.intervalId = setInterval(() => {
      if (this.isActive) {
        try {
          callback();
        } catch (error) {
          Logger.error(`Interval callback error in ${this.label}`, { error });
        }
      }
    }, delay);

    Logger.debug(`Interval set for ${this.label}`, { delay });
  }

  /**
   * Clear the interval and mark as inactive
   */
  clear(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    Logger.debug(`Interval cleared for ${this.label}`);
  }

  /**
   * Check if interval is currently active
   */
  get active(): boolean {
    return this.isActive;
  }
}

/**
 * Animation Frame Reference with automatic cleanup
 * Prevents race conditions in animation loops
 */
export class SafeAnimationFrame {
  private frameId: number | null = null;
  private isActive = false;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * Request a new animation frame, automatically canceling any existing one
   */
  request(callback: () => void): void {
    this.cancel();
    this.isActive = true;

    this.frameId = requestAnimationFrame(() => {
      if (this.isActive) {
        try {
          callback();
        } catch (error) {
          Logger.error(`Animation frame callback error in ${this.label}`, { error });
        }
      }
      this.isActive = false;
    });

    Logger.debug(`Animation frame requested for ${this.label}`);
  }

  /**
   * Cancel the animation frame and mark as inactive
   */
  cancel(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isActive = false;
    Logger.debug(`Animation frame canceled for ${this.label}`);
  }

  /**
   * Check if animation frame is currently active
   */
  get active(): boolean {
    return this.isActive;
  }
}
