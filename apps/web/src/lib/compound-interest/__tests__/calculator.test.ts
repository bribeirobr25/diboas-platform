import { describe, it, expect } from 'vitest';
import { calculateCompoundProjection } from '../calculator';
import { InvalidCalculatorInputError } from '../types';
import { SCENARIO_RATES } from '../scenarios';
import { INPUT_BOUNDS } from '../constants';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';
import { calculateLumpSum } from '@/lib/market-data/formulas';

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

  it('should produce historical-scenario output close to the en vignette ($5/day → ~$42k at 10%/12y)', () => {
    const out = calculateCompoundProjection(baseInput);
    const historical = out.series.find((s) => s.scenario === 'historical')!;
    // At 10% with monthly geometric compounding: $152.08/mo × 144 months ≈ $42,030.
    // Lesson Beat 2 vignettes still cite the 7%-era numbers — they're
    // queued for refresh in PRE_PHASE_7_TOOLS_POLISH.md.
    expect(historical.finalValue).toBeGreaterThan(40_000);
    expect(historical.finalValue).toBeLessThan(44_000);
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

  it('should accept the maximum amount (INPUT_BOUNDS.amount.max)', () => {
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
      calculateCompoundProjection({ ...baseInput, amount: INPUT_BOUNDS.amount.max + 1 }),
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

describe('calculateCompoundProjection — extended cadences', () => {
  it.each([
    ['quarterly', 4 / 12],
    ['semiAnnual', 2 / 12],
    ['yearly', 1 / 12],
  ] as const)('should compute monthlyEquivalent for %s as amount * %d', (cadence, factor) => {
    const out = calculateCompoundProjection({ ...baseInput, cadence, amount: 120 });
    expect(out.monthlyEquivalent).toBeCloseTo(120 * factor, 5);
    expect(out.series).toHaveLength(4);
  });

  it.each(['quarterly', 'semiAnnual', 'yearly'] as const)(
    'should preserve bank < conservative < historical < optimistic ordering for %s cadence',
    (cadence) => {
      const out = calculateCompoundProjection({ ...baseInput, cadence, amount: 100 });
      const fv = (k: string) => out.series.find((s) => s.scenario === k)!.finalValue;
      expect(fv('bank')).toBeLessThan(fv('conservative'));
      expect(fv('conservative')).toBeLessThan(fv('historical'));
      expect(fv('historical')).toBeLessThan(fv('optimistic'));
    },
  );
});

describe('calculateCompoundProjection — oneTime cadence (lump sum)', () => {
  const oneTimeInput = {
    amount: 1000,
    cadence: 'oneTime' as const,
    years: 10,
    locale: 'en' as const,
  };

  it('should produce monthlyEquivalent = 0 (no recurring contributions)', () => {
    const out = calculateCompoundProjection(oneTimeInput);
    expect(out.monthlyEquivalent).toBe(0);
  });

  it('should seed yearlyValues[0] with the principal (not 0)', () => {
    const out = calculateCompoundProjection(oneTimeInput);
    out.series.forEach((s) => {
      expect(s.yearlyValues[0]).toBe(oneTimeInput.amount);
    });
  });

  it('should match calculateLumpSum nominalFV exactly per scenario per year', () => {
    const out = calculateCompoundProjection(oneTimeInput);
    out.series.forEach((s) => {
      for (let y = 1; y <= oneTimeInput.years; y++) {
        const expected = calculateLumpSum(
          oneTimeInput.amount,
          s.rate / 100,
          0,
          y,
        ).nominalFV;
        expect(s.yearlyValues[y]).toBeCloseTo(expected, 5);
      }
    });
  });

  it('should preserve bank < conservative < historical < optimistic ordering', () => {
    const out = calculateCompoundProjection(oneTimeInput);
    const fv = (k: string) => out.series.find((s) => s.scenario === k)!.finalValue;
    expect(fv('bank')).toBeLessThan(fv('conservative'));
    expect(fv('conservative')).toBeLessThan(fv('historical'));
    expect(fv('historical')).toBeLessThan(fv('optimistic'));
  });

  it('should produce $1000 at 10% for 10 years close to ~$2594 (sanity)', () => {
    const out = calculateCompoundProjection(oneTimeInput);
    const historical = out.series.find((s) => s.scenario === 'historical')!;
    // 1000 × 1.10^10 = 2593.74 (annual compounding via calculateLumpSum).
    expect(historical.finalValue).toBeGreaterThan(2500);
    expect(historical.finalValue).toBeLessThan(2700);
  });
});
