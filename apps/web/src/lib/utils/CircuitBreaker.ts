/**
 * Circuit Breaker
 *
 * Protects external service calls from cascading failures.
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery).
 *
 * Usage:
 *   const breaker = new CircuitBreaker({ name: 'kit-api' });
 *   const response = await breaker.execute(() => fetch(url));
 */

import { Logger } from '@/lib/monitoring/Logger';

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export interface CircuitBreakerOptions {
  /** Identifier for logging */
  name: string;
  /** Failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Milliseconds before attempting recovery (default: 30000) */
  resetTimeoutMs?: number;
  /** Successes in half-open before closing (default: 2) */
  successThreshold?: number;
}

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit breaker "${name}" is open — request rejected`);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.successThreshold = options.successThreshold ?? 2;
  }

  getState(): CircuitState {
    return this.state;
  }

  /**
   * Execute a function through the circuit breaker.
   * Throws CircuitBreakerOpenError if the circuit is open and recovery timeout hasn't elapsed.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failureCount >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }

    Logger.info(`CircuitBreaker [${this.name}] ${previousState} → ${newState}`, {
      failureCount: this.failureCount,
    });
  }
}
