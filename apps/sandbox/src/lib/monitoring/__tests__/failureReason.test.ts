import { describe, expect, it } from 'vitest';
import { BoundedFailure, failureReason } from '../failureReason';

/**
 * REQUIREMENT (2026-10-19 review, P12): a client log names WHY in a small known
 * vocabulary and never carries an error's own message — whatever text reached the catch.
 */
describe('failureReason', () => {
  it('should answer the reason a BoundedFailure was built with', () => {
    expect(failureReason(new BoundedFailure('http-503'))).toBe('http-503');
    expect(failureReason(new BoundedFailure('malformed market response: apys[0].chain'))).toBe(
      'malformed market response: apys[0].chain'
    );
  });

  it('should map a timeout and a network/type failure to fixed words', () => {
    const timeout = new Error('The operation was aborted due to timeout SECRET');
    timeout.name = 'TimeoutError';
    expect(failureReason(timeout)).toBe('timeout');
    expect(failureReason(new TypeError('fetch failed SECRET'))).toBe('type-error');
  });

  it('should name any other error by its class, never by its message', () => {
    expect(failureReason(new RangeError('SECRET goal name'))).toBe('unexpected:RangeError');
    const odd = new Error('x');
    odd.name = 'Name with spaces and SECRET';
    expect(failureReason(odd)).toBe('unexpected');
  });

  it('should answer a fixed word for a thrown non-error', () => {
    for (const thrown of ['SECRET string', 42, null, undefined, { message: 'SECRET' }])
      expect(failureReason(thrown)).toBe('unexpected');
  });
});
