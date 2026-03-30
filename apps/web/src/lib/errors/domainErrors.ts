/**
 * Domain Error Types — Domain-Driven Design
 *
 * Typed error classes that replace generic `new Error()` throws
 * throughout the codebase. Consumers can use `instanceof` checks
 * instead of fragile string comparisons on `error.message`.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class DuplicateEntryError extends DomainError {
  constructor(message = 'Entry already exists') {
    super(message, 'DUPLICATE_ENTRY');
    this.name = 'DuplicateEntryError';
  }
}

export class ConcurrencyConflictError extends DomainError {
  constructor(message = 'Concurrent modification detected') {
    super(message, 'CONCURRENCY_CONFLICT');
    this.name = 'ConcurrencyConflictError';
  }
}

export class EncryptionUnavailableError extends DomainError {
  constructor(message = 'Encryption service unavailable') {
    super(message, 'ENCRYPTION_UNAVAILABLE');
    this.name = 'EncryptionUnavailableError';
  }
}

export class RateLimitExceededError extends DomainError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitExceededError';
  }
}
