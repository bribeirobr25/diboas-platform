import { describe, expect, it } from 'vitest';
import {
  apyFactorsForSpanWindowed,
  dailyFactorFromApyPercent,
  priceFactorsForSpan,
  priceFactorsForSpanWindowed,
  ratesForSpan,
  ratesForSpanWindowed,
  type DailyApySeries,
  type DailyPriceSeries,
} from '../accrual';

/**
 * I-G1b (toward `5.105`) — the CALENDAR-anchored replay window.
 *
 * The defect these exist to remove: the provider's series always ends TODAY, and
 * the historic mapping pins its newest point to the advance's end. So every
 * advance re-anchors a fresh recent tail, and repeated +1mo jumps replay the
 * same month forever while the screen claims to "replay what the market
 * actually did".
 *
 * The historic mode is NOT a bug and stays the default: for a `source:'real'`
 * settle, three real days elapsed SHOULD consume the last three real days.
 */
const DATES = Array.from({ length: 10 }, (_, i) => `2026-01-${String(i + 1).padStart(2, '0')}`);
/** Distinct per day, so a wrong index is visible in the value itself. */
const apy: DailyApySeries = {
  points: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  dates: DATES,
  source: 'defillama',
};

describe('ratesForSpanWindowed — sequential calendar consumption', () => {
  it('should read the window forward from its start date, not from the newest point', () => {
    // fromDay+1 maps to 2026-01-03 (index 2) → values 3,4,5.
    expect(ratesForSpanWindowed(apy, 0, 3, '2026-01-03')).toEqual([3, 4, 5]);
  });

  it('should make consecutive advances consume DIFFERENT, adjacent history', () => {
    // This is the 5.105 property: advance 1 then advance 2 must not overlap.
    const first = ratesForSpanWindowed(apy, 0, 3, '2026-01-01');
    const second = ratesForSpanWindowed(apy, 3, 6, '2026-01-04');
    expect(first).toEqual([1, 2, 3]);
    expect(second).toEqual([4, 5, 6]);
    expect(second).not.toEqual(first);
  });

  it('should make 90 = 30+30+30 over one contiguous window (§7)', () => {
    const long: DailyApySeries = {
      points: Array.from({ length: 90 }, (_, i) => i + 1),
      dates: Array.from({ length: 90 }, (_, i) =>
        new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
      ),
      source: 'defillama',
    };
    const whole = ratesForSpanWindowed(long, 0, 90, '2026-01-01')!;
    const a = ratesForSpanWindowed(long, 0, 30, '2026-01-01')!;
    const b = ratesForSpanWindowed(long, 30, 60, '2026-01-31')!;
    const c = ratesForSpanWindowed(long, 60, 90, '2026-03-02')!;
    expect([...a, ...b, ...c]).toEqual(whole);
    expect(new Set([...a, ...b, ...c]).size).toBe(90); // no day consumed twice
  });

  /**
   * The guard-rail: if the windowed path ever silently degraded to the historic
   * mapping, every test above would still pass. This proves the two modes
   * genuinely differ when the window is not the series tail.
   */
  it('should DIFFER from the historic mapping when the window is not the tail', () => {
    const historic = ratesForSpan(apy, 0, 3, 3); // newest point → day 3
    const windowed = ratesForSpanWindowed(apy, 0, 3, '2026-01-01');
    expect(historic).toEqual([8, 9, 10]);
    expect(windowed).toEqual([1, 2, 3]);
    expect(windowed).not.toEqual(historic);
  });
});

describe('an uncoverable window is UNAVAILABLE, never padded', () => {
  it('should refuse a series carrying no dates', () => {
    const undated: DailyApySeries = { points: [1, 2, 3], source: 'defillama' };
    expect(ratesForSpanWindowed(undated, 0, 2, '2026-01-01')).toBeNull();
  });

  it('should refuse a start date the series does not contain', () => {
    expect(ratesForSpanWindowed(apy, 0, 3, '2025-12-31')).toBeNull();
  });

  it('should refuse a window that runs past the end of history', () => {
    // Starting at the 9th of 10 points cannot cover three days.
    expect(ratesForSpanWindowed(apy, 0, 3, '2026-01-09')).toBeNull();
  });

  it('should refuse when dates and points are misaligned in length', () => {
    const skewed: DailyApySeries = {
      points: [1, 2, 3],
      dates: ['2026-01-01'],
      source: 'defillama',
    };
    expect(ratesForSpanWindowed(skewed, 0, 2, '2026-01-01')).toBeNull();
  });
});

describe('the factor variants inherit the contract', () => {
  const price: DailyPriceSeries = {
    points: [100, 110, 121, 133.1, 146.41],
    dates: DATES.slice(0, 5),
    source: 'coingecko',
  };

  it('should compound APY factors from the windowed rates', () => {
    const f = apyFactorsForSpanWindowed(apy, 0, 2, '2026-01-03')!;
    expect(f).toHaveLength(2);
    expect(f[0]).toBeCloseTo(dailyFactorFromApyPercent(3).toNumber(), 12);
    expect(f[1]).toBeCloseTo(dailyFactorFromApyPercent(4).toNumber(), 12);
  });

  it('should propagate null rather than pad', () => {
    expect(apyFactorsForSpanWindowed(apy, 0, 3, '2025-12-31')).toBeNull();
    expect(priceFactorsForSpanWindowed(price, 0, 2, '2025-12-31')).toBeNull();
  });

  it('should need the day BEFORE the window opens, and refuse when it is absent', () => {
    // `price[d]/price[d-1]` — opening on the first point would report a flat
    // first day that never happened, so the span refuses instead.
    expect(priceFactorsForSpanWindowed(price, 0, 2, '2026-01-01')).toBeNull();
    const f = priceFactorsForSpanWindowed(price, 0, 2, '2026-01-02')!;
    expect(f).toHaveLength(2);
    expect(f[0]).toBeCloseTo(110 / 100, 12);
    expect(f[1]).toBeCloseTo(121 / 110, 12);
  });

  it('should leave the HISTORIC price mapping exactly as it was', () => {
    // Regression guard: the default path is untouched by I-G1b.
    const product = priceFactorsForSpan(price, 0, 4, 4).reduce((a, b) => a * b, 1);
    expect(product).toBeCloseTo(146.41 / 100, 10);
  });
});
