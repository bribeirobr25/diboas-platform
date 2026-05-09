import { describe, it, expect } from 'vitest';
import { calculateCompoundProjection } from '../calculator';
import { InvalidCalculatorInputError } from '../types';
import { SCENARIO_RATES } from '../scenarios';
import { INPUT_BOUNDS } from '../constants';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';

const baseInput = {
  amount: 5,
  cadence: 'daily' as const,
  years: 12,
  locale: 'en' as const,
};

describe('calculateCompoundProjection — happy path', () => {
  it('should return all 4 scenario series when given valid input', () => {
    const out = calculateCompoundProjection(baseInput);
    expect(out.series).toHaveLength(4);
    expect(out.series.map((s) => s.scenario)).toEqual([
      'bank',
      'conservative',
      'historical',
      'optimistic',
    ]);
  });

  it('should generate years+1 yearly values per series (year 0..N)', () => {
    const out = calculateCompoundProjection({ ...baseInput, years: 12 });
    out.series.forEach((s) => {
      expect(s.yearlyValues).toHaveLength(13);
      expect(s.yearlyValues[0]).toBe(0);
    });
  });

  it('should highlight historical as the default scenario', () => {
    const out = calculateCompoundProjection(baseInput);
    expect(out.highlightedScenario).toBe('historical');
  });

  it('should expose monthlyEquivalent and inputEcho on the output', () => {
    const out = calculateCompoundProjection(baseInput);
    expect(out.monthlyEquivalent).toBeCloseTo(152.083, 2);
    expect(out.inputEcho).toEqual(baseInput);
    expect(out.computedAt).toBeGreaterThan(0);
  });

  it('should produce historical-scenario output close to the en vignette ($5/day → ~$33k at 7%/12y)', () => {
    const out = calculateCompoundProjection(baseInput);
    const historical = out.series.find((s) => s.scenario === 'historical')!;
    // CMO en vignette: ~$32,840. Formula at 7% with monthly geometric compounding.
    expect(historical.finalValue).toBeGreaterThan(30_000);
    expect(historical.finalValue).toBeLessThan(36_000);
  });

  it('should rank finalValue strictly bank < conservative < historical < optimistic', () => {
    const out = calculateCompoundProjection(baseInput);
    const fv = (k: string) => out.series.find((s) => s.scenario === k)!.finalValue;
    expect(fv('bank')).toBeLessThan(fv('conservative'));
    expect(fv('conservative')).toBeLessThan(fv('historical'));
    expect(fv('historical')).toBeLessThan(fv('optimistic'));
  });

  it('should attach the per-locale bank rate from MarketDataService', () => {
    const out = calculateCompoundProjection({ ...baseInput, locale: 'en' });
    const expected = FALLBACK_MARKET_DATA.rates.bankRates.en.savings;
    expect(out.series.find((s) => s.scenario === 'bank')!.rate).toBe(expected);
  });

  it('should pull SCENARIO_RATES values into series.rate', () => {
    const out = calculateCompoundProjection(baseInput);
    expect(out.series.find((s) => s.scenario === 'conservative')!.rate).toBe(SCENARIO_RATES.conservative);
    expect(out.series.find((s) => s.scenario === 'historical')!.rate).toBe(SCENARIO_RATES.historical);
    expect(out.series.find((s) => s.scenario === 'optimistic')!.rate).toBe(SCENARIO_RATES.optimistic);
  });
});

describe('calculateCompoundProjection — locale variations', () => {
  it('should compute for pt-BR with R$25/working-day default', () => {
    const out = calculateCompoundProjection({
      amount: 25,
      cadence: 'daily',
      years: 12,
      locale: 'pt-BR',
    });
    expect(out.series).toHaveLength(4);
    expect(out.monthlyEquivalent).toBeCloseTo(25 * 365 / 12, 2);
  });

  it('should compute for de with €4/Tag default', () => {
    const out = calculateCompoundProjection({
      amount: 4,
      cadence: 'daily',
      years: 12,
      locale: 'de',
    });
    expect(out.series.find((s) => s.scenario === 'bank')!.rate).toBe(
      FALLBACK_MARKET_DATA.rates.bankRates.de.savings,
    );
  });

  it('should compute for es with €3/día default', () => {
    const out = calculateCompoundProjection({
      amount: 3,
      cadence: 'daily',
      years: 12,
      locale: 'es',
    });
    expect(out.series.find((s) => s.scenario === 'bank')!.rate).toBe(
      FALLBACK_MARKET_DATA.rates.bankRates.es.savings,
    );
  });
});

describe('calculateCompoundProjection — boundaries', () => {
  it('should accept the minimum amount of 0.01', () => {
    const out = calculateCompoundProjection({ ...baseInput, amount: INPUT_BOUNDS.amount.min });
    expect(out.series).toHaveLength(4);
  });

  it('should accept the maximum amount of 10,000', () => {
    const out = calculateCompoundProjection({ ...baseInput, amount: INPUT_BOUNDS.amount.max });
    expect(out.series).toHaveLength(4);
  });

  it('should accept years = 1 (minimum)', () => {
    const out = calculateCompoundProjection({ ...baseInput, years: 1 });
    expect(out.series[0].yearlyValues).toHaveLength(2);
  });

  it('should accept years = 40 (maximum)', () => {
    const out = calculateCompoundProjection({ ...baseInput, years: 40 });
    expect(out.series[0].yearlyValues).toHaveLength(41);
  });
});

describe('calculateCompoundProjection — validation errors', () => {
  it('should throw InvalidCalculatorInputError when amount is below the minimum', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, amount: 0 }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should throw InvalidCalculatorInputError when amount is above the maximum', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, amount: 10_001 }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should throw InvalidCalculatorInputError when amount is NaN', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, amount: NaN }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should throw InvalidCalculatorInputError when amount is Infinity', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, amount: Infinity }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should throw InvalidCalculatorInputError when years is below 1', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, years: 0 }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should throw InvalidCalculatorInputError when years is above 40', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, years: 41 }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should throw InvalidCalculatorInputError when years is non-integer', () => {
    expect(() =>
      calculateCompoundProjection({ ...baseInput, years: 12.5 }),
    ).toThrow(InvalidCalculatorInputError);
  });

  it('should expose the offending field on the thrown error', () => {
    try {
      calculateCompoundProjection({ ...baseInput, amount: -1 });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(InvalidCalculatorInputError);
      expect((e as InvalidCalculatorInputError).field).toBe('amount');
    }
  });
});
