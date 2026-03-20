/**
 * Circuit Breaker (Task 61)
 *
 * Error Handling & Recovery: Prevents cascading failures by tracking
 * consecutive errors and temporarily disabling calls to failing services.
 *
 * States:
 *   CLOSED    — normal operation, requests pass through
 *   OPEN      — too many failures, requests are rejected immediately
 *   HALF_OPEN — after resetTimeout, a limited number of probe requests are allowed
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold?: number;
  /** Milliseconds to wait before transitioning from OPEN to HALF_OPEN */
  resetTimeout?: number;
  /** Max requests allowed in HALF_OPEN before deciding to close or re-open */
  halfOpenMaxAttempts?: number;
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_TIMEOUT = 30_000;
const DEFAULT_HALF_OPEN_MAX = 1;

export class CircuitBreakerError extends Error {
  constructor(message = 'Circuit breaker is OPEN — request rejected') {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private halfOpenAttempts = 0;
  private nextAttemptAt = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.resetTimeout = options.resetTimeout ?? DEFAULT_RESET_TIMEOUT;
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts ?? DEFAULT_HALF_OPEN_MAX;
  }

  /**
   * Execute an async operation through the circuit breaker.
   * Throws CircuitBreakerError when the circuit is OPEN.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Evaluate state transitions based on time
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() >= this.nextAttemptAt) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError();
      }
    }

    if (this.state === CircuitBreakerState.HALF_OPEN && this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
      throw new CircuitBreakerError('Circuit breaker is HALF_OPEN — max probe attempts reached');
    }

    try {
      if (this.state === CircuitBreakerState.HALF_OPEN) {
        this.halfOpenAttempts++;
      }

      const result = await fn();

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /** Current circuit state */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /** Manually reset to CLOSED */
  reset(): void {
    this.transitionTo(CircuitBreakerState.CLOSED);
  }

  // ─── Private ────────────────────────────────────────────────────────

  private onSuccess(): void {
    // A successful call in HALF_OPEN means the service recovered
    this.transitionTo(CircuitBreakerState.CLOSED);
  }

  private onFailure(): void {
    this.failureCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Probe failed — re-open
      this.transitionTo(CircuitBreakerState.OPEN);
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.transitionTo(CircuitBreakerState.OPEN);
    }
  }

  private transitionTo(newState: CircuitBreakerState): void {
    this.state = newState;

    switch (newState) {
      case CircuitBreakerState.CLOSED:
        this.failureCount = 0;
        this.halfOpenAttempts = 0;
        break;
      case CircuitBreakerState.OPEN:
        this.nextAttemptAt = Date.now() + this.resetTimeout;
        this.halfOpenAttempts = 0;
        break;
      case CircuitBreakerState.HALF_OPEN:
        this.halfOpenAttempts = 0;
        break;
    }
  }
}
