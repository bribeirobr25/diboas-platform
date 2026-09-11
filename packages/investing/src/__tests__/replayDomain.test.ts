import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  dailyFactorFromApyPercent,
  priceFactorsForSpan,
  ratesForSpan,
  replayEarnings,
  replayLegged,
  type DailyApySeries,
  type DailyPriceSeries,
} from '../accrual';

/**
 * `5.209` — the replay's input domain, and why it is guarded where it is.
 *
 * `(1 + apy)^(1/365)` exists only for apy > −100%. Below that `Decimal.pow`
 * returns NaN; the chain was NaN → factor → `replayLegged` →
 * `AccrualApplied.earnings === "NaN"` → appended to the APPEND-ONLY log →
 * `project()` reads `d("NaN")` → every balance and `reconcile()` NaN, persisted,
 * surviving reload, unable to self-heal. DeFiLlama `/chart` history is filtered
 * only by `typeof === 'number'`, so a negative reading is reachable.
 *
 * The rule (and the only one that invents nothing): a reading outside the domain
 * is NO reading — 0% that day, the position holds. Expectations below are
 * derived from that rule and from the compounding definition, not from output.
 */
describe('an APY outside the domain cannot poison the ledger (5.209)', () => {
  const series: DailyApySeries = { points: [5, 5, -150, 5, -100, 5], source: 'defillama' };

  it('should keep earnings finite and equal to compounding over the VALID days only', () => {
    const earnings = replayEarnings(1000, series, 0, 6);
    expect(earnings.isFinite()).toBe(true);
    // Four valid days at 5%/yr; the −150 and −100 days hold at 0%.
    const expected = new Decimal(1000)
      .mul(dailyFactorFromApyPercent(5).pow(4))
      .minus(1000)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    expect(earnings.toFixed(2)).toBe(expected.toFixed(2));
  });

  it('should pin the rate it actually used, so the audit trail still reproduces the earnings', () => {
    // §3 rate-pinning: `ratesUsed` must be the rates that produced the money.
    // Recording −150 while replaying 0 would make the trail a false witness.
    expect(ratesForSpan(series, 0, 6)).toEqual([5, 5, 0, 5, 0, 5]);
  });

  it('should keep a genuinely negative APY as a real, finite loss', () => {
    // Guarding the domain must not erase a real reading: −10% is inside it.
    const loss = replayEarnings(1000, { points: [-10, -10], source: 'defillama' }, 0, 2);
    expect(loss.isFinite()).toBe(true);
    expect(loss.lt(0)).toBe(true);
  });

  it('should move nothing for a non-finite factor at the last choke point', () => {
    // Defence in depth: whatever produced the factors, NaN / ±Infinity /
    // negative never reach the money. Only the valid 1.01 compounds.
    const earnings = replayLegged(1000, [
      { weightPercent: 100, factors: [NaN, Infinity, -1, 1.01] },
    ]);
    expect(earnings.toFixed(2)).toBe('10.00');
  });

  it('should treat an out-of-domain rate as no movement even when called directly', () => {
    expect(dailyFactorFromApyPercent(-150).toString()).toBe('1');
    expect(dailyFactorFromApyPercent(-100).toString()).toBe('1');
  });
});

/**
 * `5.209`'s sibling: a zero or non-finite price point used to produce a 0
 * factor, and every later factor multiplies that 0 — one bad point zeroed the
 * position permanently. The last valid price is carried forward instead.
 */
describe('a bad price point can never zero a position (5.209 sibling)', () => {
  it('should keep the span equal to end ÷ start of the REAL prices across a zero', () => {
    const s: DailyPriceSeries = { points: [100, 0, 102, 104], source: 'coingecko' };
    const factors = priceFactorsForSpan(s, 0, 3, 3);
    expect(factors.every((f) => f > 0)).toBe(true);
    expect(factors.reduce((a, b) => a * b, 1)).toBeCloseTo(104 / 100, 10);
  });

  it('should preserve the position through a gap rather than wipe it out', () => {
    const s: DailyPriceSeries = { points: [100, 0, Number.NaN, 100], source: 'coingecko' };
    const earnings = replayLegged(1000, [
      { weightPercent: 100, factors: priceFactorsForSpan(s, 0, 3, 3) },
    ]);
    // Price ended where it started, so nothing was earned and nothing was lost.
    expect(earnings.toFixed(2)).toBe('0.00');
  });

  it('should treat a leading bad point as the first real price', () => {
    const s: DailyPriceSeries = { points: [0, 50, 55], source: 'coingecko' };
    const product = priceFactorsForSpan(s, 0, 2, 2).reduce((a, b) => a * b, 1);
    expect(product).toBeCloseTo(55 / 50, 10);
  });
});
