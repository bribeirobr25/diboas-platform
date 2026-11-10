/**
 * ogUtils — tool-result share-card helpers (Phase 3).
 *
 * Validates the value-range guard and the currency formatter used by the
 * `tool-result` OG template: valid ISO codes format compactly, and any
 * unexpected/hostile currency falls back to the safe `$`-prefixed formatter
 * instead of throwing inside the edge renderer.
 */

import { describe, it, expect } from 'vitest';
import { formatResultCurrency, isValidToolResultValue } from '../ogUtils';

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
 * 5.802 · the calculator share title and card state the amount in the visitor's locale
 * (German "Mio.", Portuguese "mi", a decimal comma), never one English compact form for every language.
 */
describe('5.802 · the calculator amount in the visitor locale', () => {
  it.each([
    ['en', '$1.5M'],
    ['pt-BR', 'US$ 1,5 mi'],
    ['es', '1,5 M US$'],
    ['de', '1,5 Mio. $'],
  ])('should format 1,500,000 in %s as %s', (locale, expected) => {
    expect(formatResultCurrency(1_500_000, 'USD', locale, 1).replace(/\u00a0/g, ' ')).toBe(
      expected
    );
  });

  it('should never print a trailing ".0" on a whole compact figure', () => {
    expect(formatResultCurrency(150_000, 'USD', 'en', 1)).toBe('$150K');
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
