/**
 * ogUtils — tool-result share-card helpers (Phase 3).
 *
 * Validates the value-range guard and the currency formatter used by the
 * `tool-result` OG template: valid ISO codes format compactly, and any
 * unexpected/hostile currency falls back to the safe `$`-prefixed formatter
 * instead of throwing inside the edge renderer.
 */

import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatResultCurrency,
  isValidPosition,
  isValidToolResultValue,
  parseIntSafe,
  sanitizeInput,
} from '../ogUtils';

describe('isValidToolResultValue', () => {
  it('should accept a positive finite value within range', () => {
    expect(isValidToolResultValue(16105)).toBe(true);
    expect(isValidToolResultValue(1)).toBe(true);
  });

  it('should reject zero, negatives, non-finite, and out-of-range values', () => {
    expect(isValidToolResultValue(0)).toBe(false);
    expect(isValidToolResultValue(-5)).toBe(false);
    expect(isValidToolResultValue(Number.NaN)).toBe(false);
    expect(isValidToolResultValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidToolResultValue(2_000_000_000)).toBe(false);
  });
});

describe('formatResultCurrency', () => {
  it('should format a valid ISO currency compactly', () => {
    const out = formatResultCurrency(16105, 'USD');
    // Compact USD ($16K) — exact glyphs vary by ICU, so assert the magnitude token.
    expect(out).toMatch(/16K/);
  });

  it('should support non-USD ISO codes', () => {
    expect(formatResultCurrency(16105, 'BRL')).toMatch(/16/);
    expect(formatResultCurrency(16105, 'EUR')).toMatch(/16/);
  });

  it('should fall back to the plain formatter for a non-ISO currency', () => {
    // Lowercase / junk codes must not throw — they hit the K/M fallback.
    expect(formatResultCurrency(16105, 'brl')).toBe('$16K');
    expect(formatResultCurrency(16105, '<script>')).toBe('$16K');
  });
});

/**
 * 5.802 · a share card states the amount in the visitor's locale (German "Mio.", Portuguese "mi"),
 * never one English compact form for every language. Found on the Dream Mode calculator card,
 * which was retired with Dream Mode (plan P13 PR-2); the rule stands for the surviving
 * Money Tools result card, which formats through the same helper.
 */
describe('5.802 · a share amount in the visitor locale', () => {
  it.each([
    ['en', '$2M'],
    ['pt-BR', 'US$ 2 mi'],
    ['es', '2 M US$'],
    ['de', '2 Mio. $'],
  ])('should format 2,400,000 in %s as %s', (locale, expected) => {
    expect(formatResultCurrency(2_400_000, 'USD', locale).replace(/\u00a0/g, ' ')).toBe(expected);
  });

  it('should leave no hard-coded "$…M" / "$…K" formatter in the share title or card', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const share = join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '[locale]',
      '(landing)',
      'share',
      'page.tsx'
    );
    const card = join(__dirname, '..', 'ogTemplates.tsx');
    for (const file of [share, card])
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/toFixed\(\d\)\}[MK]`/);
  });
});

/* The card's remaining helpers. Their branches were reached only through the Dream Mode
   calculator card until P13 PR-2 retired it; each is pinned directly here. */
describe('sanitizeInput', () => {
  it('should strip tags and markup characters and cap the length when a name carries them', () => {
    expect(sanitizeInput('<script>alert(1)</script>Ana')).toBe('alert(1)Ana');
    expect(sanitizeInput('Tom & "Jerry" <b>')).toBe('Tom  Jerry ');
    expect(sanitizeInput('x'.repeat(80))).toHaveLength(50);
  });

  it('should return nothing when there is no input', () => {
    expect(sanitizeInput(null)).toBeUndefined();
    expect(sanitizeInput('')).toBeUndefined();
  });
});

describe('isValidPosition', () => {
  it('should accept a position from 1 to a million and refuse anything else', () => {
    expect(isValidPosition(1)).toBe(true);
    expect(isValidPosition(1_000_000)).toBe(true);
    for (const bad of [0, -1, 1_000_001, Number.NaN, Number.POSITIVE_INFINITY])
      expect(isValidPosition(bad), String(bad)).toBe(false);
  });
});

describe('parseIntSafe', () => {
  it('should parse an integer and fall back when the value is missing or not a number', () => {
    expect(parseIntSafe('247', 0)).toBe(247);
    expect(parseIntSafe(null, 5)).toBe(5);
    expect(parseIntSafe('junk', 5)).toBe(5);
  });
});

describe('the plain fallback formatter (an unusable currency code)', () => {
  it('should write millions, thousands and small amounts with a dollar sign', () => {
    expect(formatResultCurrency(2_400_000, 'usd')).toBe('$2.4M');
    expect(formatResultCurrency(16_105, 'XX')).toBe('$16K');
    expect(formatResultCurrency(950, '')).toBe('$950');
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('should fall back when Intl refuses a well-formed but unknown currency', () => {
    expect(formatResultCurrency(2_400_000, 'ZZZ', 'not-a-locale-!!')).toBe('$2.4M');
  });
});
