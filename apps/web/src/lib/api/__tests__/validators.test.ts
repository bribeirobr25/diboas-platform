/**
 * Input validators — every API input passes through these before processing.
 *
 * Pins the SECURE outcome: anything outside the allow-lists or the size
 * bounds is rejected, including non-string values that reach the validators
 * through untyped JSON bodies and prototype-shaped keys.
 */

import { describe, it, expect } from 'vitest';
import { isValidLocale, isValidSource, isValidTags, isValidName } from '../validators';

/** Untyped JSON reaches these validators at runtime; cast to exercise the guards. */
const asString = (value: unknown) => value as string;

describe('isValidLocale', () => {
  it('should accept a locale when it is one of the four supported locales', () => {
    for (const locale of ['en', 'pt-BR', 'es', 'de']) {
      expect(isValidLocale(locale)).toBe(true);
    }
  });

  it('should reject a locale when it is unsupported, mis-cased, empty or prototype-shaped', () => {
    for (const locale of ['fr', 'EN', 'pt-br', '', ' en', '__proto__', 'constructor']) {
      expect(isValidLocale(locale)).toBe(false);
    }
  });

  it('should reject a locale when the value is not a string', () => {
    for (const value of [undefined, null, 1, ['en'], { en: true }]) {
      expect(isValidLocale(asString(value))).toBe(false);
    }
  });
});

describe('isValidSource', () => {
  it('should accept a source when it is a known waitlist source', () => {
    for (const source of [
      'landing_b2c',
      'landing_b2b',
      'interactive_demo',
      'dream_mode',
      'calculator',
      'tool_money_jobs',
      'referral',
      'direct',
    ]) {
      expect(isValidSource(source)).toBe(true);
    }
  });

  it('should reject a source when it is unknown, mis-cased or prototype-shaped', () => {
    for (const source of ['admin', 'DIRECT', '', '__proto__', 'direct; DROP TABLE']) {
      expect(isValidSource(source)).toBe(false);
    }
  });

  it('should reject a source when the value is not a string', () => {
    for (const value of [undefined, null, 0, ['direct']]) {
      expect(isValidSource(asString(value))).toBe(false);
    }
  });
});

describe('isValidTags', () => {
  it('should accept tags when there are at most ten non-empty strings of at most fifty chars', () => {
    expect(isValidTags([])).toBe(true);
    expect(isValidTags(Array.from({ length: 10 }, () => 'x'.repeat(50)))).toBe(true);
  });

  it('should reject tags when the value is not an array', () => {
    for (const value of ['a,b', null, undefined, { 0: 'a', length: 1 }]) {
      expect(isValidTags(value)).toBe(false);
    }
  });

  it('should reject tags when there are more than ten', () => {
    expect(isValidTags(Array.from({ length: 11 }, () => 'a'))).toBe(false);
  });

  it('should reject tags when any entry is empty, too long or not a string', () => {
    expect(isValidTags(['ok', ''])).toBe(false);
    expect(isValidTags(['ok', 'x'.repeat(51)])).toBe(false);
    expect(isValidTags(['ok', 1])).toBe(false);
    expect(isValidTags(['ok', { toString: () => 'x' }])).toBe(false);
  });
});

describe('isValidName', () => {
  it('should accept a name when it is non-empty after trim and at most one hundred chars', () => {
    expect(isValidName('Ana')).toBe(true);
    expect(isValidName('  Ana  ')).toBe(true);
    expect(isValidName('x'.repeat(100))).toBe(true);
    expect(isValidName(`  ${'x'.repeat(100)}  `)).toBe(true);
  });

  it('should reject a name when it is blank or longer than one hundred chars after trim', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('   \t\n ')).toBe(false);
    expect(isValidName('x'.repeat(101))).toBe(false);
  });

  it('should reject a name when the value is not a string', () => {
    for (const value of [undefined, null, 42, ['Ana']]) {
      expect(isValidName(asString(value))).toBe(false);
    }
  });
});
