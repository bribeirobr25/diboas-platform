/**
 * Concurrency Control Utilities
 *
 * MutexLock and StateMachine for preventing concurrent operations
 * and invalid state transitions
 */

import { Logger } from '@/lib/monitoring/Logger';

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
