/**
 * Race Condition Prevention Utilities
 * 
 * Concurrency & Race Condition Prevention: Comprehensive race condition prevention
 * Error Handling & System Recovery: Safe async operation handling
 * Performance & SEO Optimization: Efficient timer and animation management
 * Monitoring & Observability: Race condition tracking and debugging
 * Domain-Driven Design: Carousel domain-specific race prevention
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

/**
 * Debounced Function with race condition prevention
 * Prevents rapid successive calls that could cause race conditions
 */
export class DebouncedFunction<T extends (...args: any[]) => any> {
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
export class ThrottledFunction<T extends (...args: any[]) => any> {
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

/**
 * Mutual Exclusion Lock for preventing concurrent operations
 * Prevents race conditions in async operations
 */
export class MutexLock {
  private isLocked = false;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * Acquire lock - returns true if successful, false if already locked
   */
  acquire(): boolean {
    if (this.isLocked) {
      Logger.debug(`Mutex lock acquisition failed for ${this.label} - already locked`);
      return false;
    }
    
    this.isLocked = true;
    Logger.debug(`Mutex lock acquired for ${this.label}`);
    return true;
  }

  /**
   * Release lock
   */
  release(): void {
    this.isLocked = false;
    Logger.debug(`Mutex lock released for ${this.label}`);
  }

  /**
   * Execute function with lock protection
   */
  async withLock<T>(fn: () => Promise<T> | T): Promise<T | null> {
    if (!this.acquire()) {
      // Use debug level instead of warn since this is expected behavior for preventing race conditions
      Logger.debug(`Mutex lock busy for ${this.label} - operation skipped`);
      return null;
    }

    try {
      const result = await fn();
      return result;
    } catch (error) {
      Logger.error(`Mutex lock protected operation failed for ${this.label}`, { error });
      throw error;
    } finally {
      this.release();
    }
  }

  /**
   * Check if currently locked
   */
  get locked(): boolean {
    return this.isLocked;
  }
}

/**
 * Cleanup Manager for component unmounting
 * Prevents memory leaks and cleanup race conditions
 */
export class CleanupManager {
  private cleanupFunctions: Array<() => void> = [];
  private isDestroyed = false;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * Add a cleanup function to be called on destruction
   */
  add(cleanup: () => void): void {
    if (this.isDestroyed) {
      Logger.debug(`Cleanup function added to destroyed manager ${this.label}`);
      cleanup(); // Execute immediately if already destroyed
      return;
    }
    
    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Add a timer for automatic cleanup
   */
  addTimer(timer: SafeTimer): void {
    this.add(() => timer.clear());
  }

  /**
   * Add an interval for automatic cleanup
   */
  addInterval(interval: SafeInterval): void {
    this.add(() => interval.clear());
  }

  /**
   * Add an animation frame for automatic cleanup
   */
  addAnimationFrame(frame: SafeAnimationFrame): void {
    this.add(() => frame.cancel());
  }

  /**
   * Execute all cleanup functions and mark as destroyed
   */
  destroy(): void {
    if (this.isDestroyed) {
      Logger.warn(`Cleanup manager ${this.label} already destroyed`);
      return;
    }

    Logger.debug(`Cleaning up ${this.cleanupFunctions.length} items for ${this.label}`);
    
    this.cleanupFunctions.forEach((cleanup, index) => {
      try {
        cleanup();
      } catch (error) {
        Logger.error(`Cleanup function ${index} failed for ${this.label}`, { error });
      }
    });

    this.cleanupFunctions = [];
    this.isDestroyed = true;
    
    Logger.debug(`Cleanup manager ${this.label} destroyed`);
  }

  /**
   * Check if destroyed
   */
  get destroyed(): boolean {
    return this.isDestroyed;
  }
}

/**
 * React Hook for automatic cleanup management
 * Integrates cleanup manager with React component lifecycle
 */
export function useCleanupManager(componentName: string): CleanupManager {
  const managerRef = { current: new CleanupManager(componentName) };
  
  // This would be used in a React useEffect hook
  const cleanup = () => {
    managerRef.current.destroy();
  };
  
  return managerRef.current;
}

/**
 * State Machine for preventing invalid state transitions
 * Prevents race conditions in complex state changes
 */
export class StateMachine<T extends string> {
  private currentState: T;
  private readonly validTransitions: Record<T, T[]>;
  private readonly label: string;
  private readonly onStateChange?: (from: T, to: T) => void;

  constructor(
    initialState: T,
    validTransitions: Record<T, T[]>,
    label: string,
    onStateChange?: (from: T, to: T) => void
  ) {
    this.currentState = initialState;
    this.validTransitions = validTransitions;
    this.label = label;
    this.onStateChange = onStateChange;
    
    Logger.debug(`State machine ${this.label} initialized`, { initialState });
  }

  /**
   * Attempt to transition to a new state
   */
  transitionTo(newState: T): boolean {
    const validNextStates = this.validTransitions[this.currentState];
    
    if (!validNextStates || !validNextStates.includes(newState)) {
      Logger.debug(`Invalid state transition in ${this.label}`, {
        from: this.currentState,
        to: newState,
        validTransitions: validNextStates
      });
      return false;
    }

    const oldState = this.currentState;
    this.currentState = newState;
    
    Logger.debug(`State transition in ${this.label}`, {
      from: oldState,
      to: newState
    });

    this.onStateChange?.(oldState, newState);
    return true;
  }

  /**
   * Get current state
   */
  get state(): T {
    return this.currentState;
  }

  /**
   * Check if transition is valid
   */
  canTransitionTo(newState: T): boolean {
    const validNextStates = this.validTransitions[this.currentState];
    return validNextStates ? validNextStates.includes(newState) : false;
  }
}