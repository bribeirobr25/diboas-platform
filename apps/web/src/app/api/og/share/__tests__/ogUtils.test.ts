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
