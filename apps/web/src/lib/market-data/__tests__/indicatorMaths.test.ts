/**
 * The indicator maths behind every published signal (PENDING_ALL 5.333).
 *
 * WHY THIS EXISTS. On 2026-09-15 a sabotage sweep changed, one at a time:
 * EMA's smoothing factor from `2/(p+1)` to `1/(p+1)`; EMA's seed from the first
 * observation to the last; SMA's divisor from the slice length to the nominal
 * period; and — worst — RSI from `100 - 100/(1+rs)` to `100/(1+rs)`, which
 * INVERTS it, so an RSI of 49 reads as 51 and a signal flips state. **All 413
 * tests passed every time.** These four functions produce every number on
 * `/market` — BTC against its 20-month EMA and 50-month SMA, the monthly RSI
 * and Stoch-RSI, the dollar against its 20-week EMA, both BTC ratios against
 * theirs — and not one of them had a test.
 *
 * `formulas.test.ts` (79 tests) is the Money Tools calculator suite and covers
 * none of this; the coincidence of the name is why the gap survived.
 *
 * The expectations below are chosen so they cannot be satisfied by a wrong
 * formula that happens to be self-consistent: an EXTERNAL reference vector, and
 * structural invariants that pin the specific constants a typo would change.
 */

import { describe, expect, it } from 'vitest';
import { ema, sma, rsi, stochRsiK } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';

describe('ema — exponential moving average', () => {
  it('should use a smoothing factor of 2/(period+1)', () => {
    // period 1 => alpha 1 => the EMA collapses onto the latest observation.
    // This single assertion pins the numerator: with alpha = 1/(p+1) the
    // result would be 52, not 99.
    expect(ema([5, 10, 99], 1)).toBe(99);
  });

  it('should seed from the FIRST observation and walk forward', () => {
    // Two steps by hand, period 2 (alpha = 2/3): e = 0 -> 2/3*3 = 2 -> 2/3*3 + 1/3*2 = 2.666…
    expect(ema([0, 3, 3], 2)).toBeCloseTo(2.6667, 4);
    // Seeding from the last observation would return 3 exactly.
    expect(ema([0, 3, 3], 2)).not.toBe(3);
  });

  it('should return the level itself for a flat series, at any period', () => {
    for (const p of [1, 5, 20, 50]) expect(ema([7, 7, 7, 7, 7], p)).toBe(7);
  });

  it('should lie between the extremes and lean toward the most recent value', () => {
    const rising = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const e = ema(rising, 5);
    expect(e).toBeGreaterThan(1);
    expect(e).toBeLessThan(10);
    expect(e).toBeGreaterThan(sma(rising, 10)); // recency-weighted, unlike the mean
  });
});

describe('sma — simple moving average', () => {
  it('should average the trailing `period` observations', () => {
    expect(sma([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5)).toBe(8); // (6+7+8+9+10)/5
  });

  it('should divide by what EXISTS when the series is shorter than the period', () => {
    // Dividing by the nominal period instead would return 1.2 — a fabricated
    // low that reads as "price far below its 50-month average" on a young series.
    expect(sma([2, 4], 5)).toBe(3);
  });

  it('should ignore observations older than the window', () => {
    expect(sma([1000, 1, 1, 1], 3)).toBe(1);
  });
});

describe('rsi — Wilder relative strength index', () => {
  it("should match Wilder's published 14-period worked example", () => {
    // The standard reference series (StockCharts' reproduction of Wilder's
    // table). An EXTERNAL number: no arrangement of our own code produces it by
    // accident, which is what makes it worth more than a self-derived fixture.
    const closes = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61,
      46.28, 46.28,
    ];
    expect(rsi(closes, 14)).toBeCloseTo(70.46, 2);
  });

  it('should return 100 when every period gained and 0 when every period lost', () => {
    const up = Array.from({ length: 15 }, (_, i) => i + 1);
    expect(rsi(up, 14)).toBe(100);
    expect(rsi([...up].reverse(), 14)).toBeCloseTo(0, 6);
  });

  it('should sit below 50 for a net decline and above 50 for a net advance', () => {
    // The orientation check the inversion sabotage breaks: `100/(1+rs)` returns
    // the complement, so a falling series would read as strength.
    const down = [50, 49, 48, 49, 47, 46, 45, 46, 44, 43, 42, 43, 41, 40, 39];
    const up = [...down].reverse();
    expect(rsi(down, 14)).toBeLessThan(50);
    expect(rsi(up, 14)).toBeGreaterThan(50);
  });

  it('should return the NEUTRAL midpoint for a flat window, not maximum strength', () => {
    // 5.364, founder-ruled 2026-09-15. Nothing moved, so there is no relative
    // strength to report; 100 would be a claim from no information, and the
    // same defect class as scoring a signal from an absent ledger. Matches
    // `stochRsiK`'s own degenerate answer so the two agree.
    expect(rsi(new Array(20).fill(10), 14)).toBe(50);
    expect(rsi(new Array(20).fill(0), 14)).toBe(50);
  });

  it('should still return 100 when every period genuinely gained', () => {
    // The distinction the fix turns on: all-gains is maximum strength and must
    // stay 100; only the no-movement case changes.
    expect(
      rsi(
        Array.from({ length: 15 }, (_, i) => i + 1),
        14
      )
    ).toBe(100);
  });

  it('should refuse to compute without period+1 observations', () => {
    expect(rsi([1, 2, 3], 14)).toBeNull();
    expect(
      rsi(
        Array.from({ length: 14 }, (_, i) => i),
        14
      )
    ).toBeNull();
    expect(
      rsi(
        Array.from({ length: 15 }, (_, i) => i),
        14
      )
    ).not.toBeNull();
  });
});

describe('stochRsiK — stochastic RSI %K', () => {
  const series = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));

  it('should stay within 0..100', () => {
    const k = stochRsiK(series(60, (i) => 100 + Math.sin(i / 3) * 10));
    expect(k).toBeGreaterThanOrEqual(0);
    expect(k).toBeLessThanOrEqual(100);
  });

  it('should return the NEUTRAL midpoint when the RSI window is flat, not an extreme', () => {
    // A monotonic series saturates RSI at 100 for every window, so min === max
    // and the stochastic is undefined. The engine answers 50 — "no position
    // within the range" — rather than inventing a saturated extreme from no
    // information. My first version of this test asserted 100 and was wrong
    // about the code, which is the right way round.
    expect(stochRsiK(series(60, (i) => i + 1))).toBe(50);
  });

  it('should sit high when RSI ends near the top of a range it actually moved through', () => {
    // A real range: a decline, then a rally that takes RSI back to its window high.
    const closes = [
      ...series(20, (i) => 100 - i * 2),
      ...series(20, (i) => 60 + i),
      ...series(20, (i) => 80 + i * 2),
    ];
    const k = stochRsiK(closes);
    expect(k).not.toBe(50); // the window genuinely varies
    expect(k).toBeGreaterThan(70);
  });

  it('should return null when the series is too short to form the window', () => {
    expect(stochRsiK(series(10, (i) => i + 1))).toBeNull();
  });
});
