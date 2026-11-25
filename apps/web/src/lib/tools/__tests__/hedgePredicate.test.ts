/**
 * HEDGE-PRED-1 · a hedged marker shows exactly when the figure is hedged (market clean-up C2-S G3,
 * register `5.933`).
 *
 * The engines and the home table decided "hedged" four ways; the emergency fund computed on
 * `=== 0` and marked on `> 0`, so a negative depreciation (a currency that strengthens against the
 * dollar) changed the figure with no marker. One predicate now (`isHedgedDepreciation`). This test
 * is behavioural, not a text scan: each engine runs on a snapshot whose euro depreciation is set to
 * 0, a negative and a positive value, and its `hedged` flag must be true exactly when its result
 * differs from the unhedged one. It lives outside `src/lib/market-data` (not a weekly gate) and
 * reads the fallback constants, never the service.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';
import { FALLBACK_MARKET_DATA } from '@/lib/market-data/constants';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import { isHedgedCurrency, isHedgedDepreciation } from '@/lib/market-data/formulas/hedgePredicate';
import { calculateEmergencyFundTimeline } from '@/lib/emergency-fund/calculator';
import { calculateTimeToTargetTimeline } from '@/lib/time-to-target/calculator';
import { calculateIdleCashYield } from '@/lib/idle-cash/calculator';
import { calculateMoneyJobsPersonalPlan } from '@/lib/money-jobs/calculator';

/** The fallback snapshot with the euro's depreciation set to `d` (and no series to fall back on). */
function withEuro(d: number): MarketDataSnapshot {
  const rates = FALLBACK_MARKET_DATA.exchangeRates.rates;
  return {
    ...FALLBACK_MARKET_DATA,
    monthlySeries: undefined,
    exchangeRates: {
      ...FALLBACK_MARKET_DATA.exchangeRates,
      rates: { ...rates, EUR: { ...rates.EUR!, annualDepreciation: d } },
    },
  } as MarketDataSnapshot;
}

/** Each engine's result for the German (euro) locale, with its hedged flag split off. */
const ENGINES: Record<string, (s: MarketDataSnapshot) => { hedged: boolean; rest: string }> = {
  'emergency fund': (s) => {
    const r = calculateEmergencyFundTimeline(
      { monthlyExpenses: 2000, monthlySavings: 300, targetMultiplier: 6, locale: 'de' },
      s
    )!;
    const { hedged, ...rest } = r;
    return { hedged, rest: JSON.stringify(rest) };
  },
  'time to target': (s) => {
    const { hedged, ...rest } = calculateTimeToTargetTimeline(
      { target: 20000, initialAmount: 1000, contribution: 300, cadence: 'monthly', locale: 'de' },
      s
    );
    return { hedged, rest: JSON.stringify(rest) };
  },
  'idle cash': (s) => {
    const { hedged, ...rest } = calculateIdleCashYield(
      { idleCash: 10000, years: 5, bankYieldPct: 0.5, locale: 'de' },
      s
    )!;
    return { hedged, rest: JSON.stringify(rest) };
  },
  'Money Jobs plan': (s) => {
    const result = {
      emergencyFundTarget: 12000,
      emergencyFundCurrent: 2000,
      emergencyFundContribution: 300,
      inputEcho: { locale: 'de' },
    } as never;
    const { hedged, ...rest } = calculateMoneyJobsPersonalPlan(result, s)!;
    return { hedged, rest: JSON.stringify(rest) };
  },
};

describe('HEDGE-PRED-1: the marker shows exactly when the figure is hedged', () => {
  const unhedged = (engine: string) => ENGINES[engine](withEuro(0)).rest;

  for (const engine of Object.keys(ENGINES)) {
    it.each([0, -0.02, 0.03])(`${engine}: depreciation %s`, (d) => {
      const { hedged, rest } = ENGINES[engine](withEuro(d));
      expect(hedged, 'hedged flag').toBe(rest !== unhedged(engine));
      expect(hedged).toBe(d !== 0);
    });
  }

  it('should read one meaning: any finite, non-zero depreciation; any currency but the dollar', () => {
    expect(
      [0, -0, 0.02, -0.02, Number.NaN, Number.POSITIVE_INFINITY].map(isHedgedDepreciation)
    ).toEqual([false, false, true, true, false, false]);
    expect(['USD', 'EUR', 'BRL', undefined, ''].map(isHedgedCurrency)).toEqual([
      false,
      true,
      true,
      false,
      false,
    ]);
  });

  // The three display sites are components, outside the engine test above: they must take the
  // predicate from the shared module, with no hand-written test left (a scan, so it is the weaker
  // half; the engines carry the behaviour).
  it.each([
    'src/components/Sections/ComparisonTable/ComparisonTable.tsx',
    'src/components/Sections/CompoundInterestCalculator/variants/CalculatorDefault/CalculatorOutputs.tsx',
    'src/components/Sections/MoneyJobsCalculator/MoneyJobsCalculator.tsx',
  ])('should take the hedge predicate from the shared module in %s', (file) => {
    const code = stripComments(readFileSync(join(__dirname, '../../../..', file), 'utf8'), file);
    expect(code).toMatch(/from '@\/lib\/market-data\/formulas\/hedgePredicate'/);
    expect(code).not.toMatch(/!==\s*'USD'|depreciation\s*(?:>|===|!==)\s*0\b/);
  });
});
