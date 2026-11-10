import { describe, it, expect } from 'vitest';
import { isValidReferralCode } from '../helpers';

/**
 * Twelfth audit: `RegExp.test` coerces its argument, so an array such as `['REFABCD']` matched
 * and then reached `.toUpperCase()` in the signup service (a 500). A request body's fields are
 * unchecked JSON; every non-string is invalid.
 */
describe('isValidReferralCode', () => {
  it('should accept a well-formed code when it is a string', () => {
    expect(isValidReferralCode('REFABCD')).toBe(true);
    expect(isValidReferralCode('refabcd12')).toBe(true);
  });

  it('should reject a malformed or empty string', () => {
    expect(isValidReferralCode('')).toBe(false);
    expect(isValidReferralCode('REFAB')).toBe(false);
    expect(isValidReferralCode('XYZABCD')).toBe(false);
  });

  it.each([
    ['an array holding a valid code', ['REFABCD']],
    ['a number', 1234],
    ['null', null],
    ['an object', { code: 'REFABCD' }],
  ])('should reject %s when the value is not a string', (_l, value) => {
    expect(isValidReferralCode(value)).toBe(false);
  });
});
