import { describe, expect, it } from 'vitest';
import { findPercentFormatViolations, formatPercent } from '../percent';

/**
 * Requirement: founder ruling 2026-10-31 (DR-2026-10-31-practice-projection-live-rates-
 * and-percent-format, P8) — "%" immediately after the number, no space, every locale;
 * never a digit followed by the spelled-out word. Register `5.729`.
 */

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

describe('formatPercent · no space before % in any locale (P8)', () => {
  it.each(LOCALES)(
    'should write seven percent with the sign attached when the locale is %s',
    (locale) => {
      expect(formatPercent(0.07, locale)).toBe('7%');
    }
  );

  it("should keep each locale's own decimal separator while dropping the space", () => {
    const opts = { minimumFractionDigits: 2 };
    expect(formatPercent(0.0039, 'en', opts)).toBe('0.39%');
    expect(formatPercent(0.0039, 'pt-BR', opts)).toBe('0,39%');
    expect(formatPercent(0.0039, 'es', opts)).toBe('0,39%');
    expect(formatPercent(0.0039, 'de', opts)).toBe('0,39%');
  });

  it('should keep grouping and the sign exactly as Intl writes them', () => {
    expect(formatPercent(12.345, 'de')).toBe('1.235%');
    expect(formatPercent(12.345, 'en')).toBe('1,235%');
    expect(formatPercent(-0.05, 'es')).toBe('-5%');
    expect(formatPercent(-0.05, 'en')).toBe('-5%');
  });

  it('should equal Intl output with only the space at the percent sign removed', () => {
    /* The sabotage this protects against: a "fix" that rewrote digits or separators. */
    for (const locale of LOCALES) {
      for (const value of [0, 0.004, 0.1, 0.4567, 1, 2.5]) {
        const intl = new Intl.NumberFormat(locale, {
          style: 'percent',
          maximumFractionDigits: 2,
        }).format(value);
        expect(formatPercent(value, locale, { maximumFractionDigits: 2 })).toBe(
          intl.replace(/\s+%/u, '%')
        );
      }
    }
  });

  it('should prove the de/es space exists in Intl, so the tests above are not vacuous', () => {
    expect(new Intl.NumberFormat('de', { style: 'percent' }).format(0.07)).toMatch(/7\s%/u);
    expect(new Intl.NumberFormat('es', { style: 'percent' }).format(0.07)).toMatch(/7\s%/u);
  });
});

describe('findPercentFormatViolations · the one rule both catalogue guards apply', () => {
  it.each([
    ['0,39 %', 'space'],
    ['1,5 % bis 3,5 %', 'space'],
    ['{rate} %', 'space'],
    ['tasa del 7 %', 'space'],
    ['tasa del 7 %', 'space'],
    ['eine 25-%-Karte', 'space'],
    ['an assumed {low} to {high} percent', 'word'],
    ['angenommene {low} bis {high} Prozent', 'word'],
    ['un supuesto {low} a {high} por ciento', 'word'],
    ['de {low} a {high} por cento', 'word'],
    ['a credit card at 20-something percent', 'word'],
    ['el revolving del 20 y pico por ciento', 'word'],
    ['a 3 ou 4 por cento', 'word'],
  ] as const)('should flag %j as a %s violation', (text, kind) => {
    expect(findPercentFormatViolations(text).map((v) => v.kind)).toContain(kind);
  });

  it.each([
    '7%',
    '0,39%',
    '{rate}%',
    'Die 10%-Regel',
    'El 10%',
    "Ten percent isn't possible right now.",
    'zwanzig Prozent',
    'vinte e tantos por cento',
    'by 1–3 percentage points per year',
    'um 1–3 Prozentpunkte pro Jahr',
    'em 1–3 pontos percentuais por ano',
    'en 1–3 puntos porcentuales al año',
    'width="100%"',
  ])('should not flag %j', (text) => {
    expect(findPercentFormatViolations(text)).toEqual([]);
  });
});
