/**
 * Quality-gate tests (audit remediation 2026-08-24, PENDING_ALL 5.134a).
 *
 * `quality-gate.mjs` is the ONLY thing standing between a corrupt upstream
 * series and published editorial — and until this file existed it had zero
 * coverage. Every assertion below is a SABOTAGE test: it feeds the gate the
 * exact corruption class the gate claims to stop and proves it throws, with
 * the right `check` tag. A widened tolerance or an inverted comparison must
 * fail here rather than ship green (engineering-gates.md § test integrity).
 */

import { describe, it, expect } from 'vitest';
import {
  assertDailySeries,
  assertRateSeries,
  assertRecency,
  assertOhlcBar,
  assertBtcCloseVerified,
  QualityGateError,
  BTC_CLOSE_TOLERANCE_PCT,
  OUTLIER_BOUNDS_PCT,
} from '../../../../scripts/market-refresh/lib/quality-gate.mjs';

const day = (iso: string, v: number): [Date, number] => [new Date(iso), v];

/** A clean 40-point ascending daily series (long enough to clear the min-length guard). */
function cleanSeries(start = 100, n = 40): [Date, number][] {
  const out: [Date, number][] = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date(Date.UTC(2026, 0, 1 + i));
    out.push([d, start + i * 0.1]);
  }
  return out;
}

describe('assertDailySeries — schema + monotonicity + finiteness', () => {
  it('should accept a clean series', () => {
    expect(() => assertDailySeries('test', cleanSeries(), { maxMovePct: 10 })).not.toThrow();
  });

  it('should throw on a series shorter than the minimum', () => {
    expect(() => assertDailySeries('test', cleanSeries(100, 5), { maxMovePct: 10 })).toThrow(
      QualityGateError
    );
  });

  it('should throw when dates are not strictly ascending (the duplicate/rewind class)', () => {
    const s = cleanSeries();
    s[20] = day('2026-01-05T00:00:00Z', 105); // jumps backwards
    expect(() => assertDailySeries('test', s, { maxMovePct: 50 })).toThrow(/monotonic/);
  });

  it('should throw on NaN and on non-positive values', () => {
    const nan = cleanSeries();
    nan[10] = [nan[10][0], Number.NaN];
    expect(() => assertDailySeries('test', nan, { maxMovePct: 50 })).toThrow(/non-finite/);

    const neg = cleanSeries();
    neg[10] = [neg[10][0], -1];
    expect(() => assertDailySeries('test', neg, { maxMovePct: 50 })).toThrow(/non-finite/);
  });

  it('should throw when a single-period move exceeds the outlier bound', () => {
    const s = cleanSeries();
    s[30] = [s[30][0], s[29][1] * 3]; // +200% in one day
    let err: unknown;
    try {
      assertDailySeries('test', s, { maxMovePct: OUTLIER_BOUNDS_PCT.dollarIndexDaily });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(QualityGateError);
    expect((err as { check: string }).check).toBe('outlier');
  });

  it('should hold the documented per-series bounds (a silent widening must fail here)', () => {
    expect(OUTLIER_BOUNDS_PCT.dollarIndexDaily).toBe(8);
    expect(OUTLIER_BOUNDS_PCT.equityIndexDaily).toBe(16);
    expect(OUTLIER_BOUNDS_PCT.yahooDaily).toBe(25);
    expect(OUTLIER_BOUNDS_PCT.btcMonthly).toBe(45);
  });
});

describe('assertRateSeries — absolute (percentage-point) bound', () => {
  it('should accept small rate moves', () => {
    const s = cleanSeries(4, 40).map(([d], i) => day(d.toISOString(), 4 + i * 0.01)) as [
      Date,
      number,
    ][];
    expect(() => assertRateSeries('DGS10', s)).not.toThrow();
  });

  it('should throw when a daily move exceeds the pp bound', () => {
    const s = cleanSeries(4, 40).map(([d], i) => day(d.toISOString(), 4 + i * 0.01)) as [
      Date,
      number,
    ][];
    s[30] = [s[30][0], s[29][1] + 5]; // +5pp in a day
    expect(() => assertRateSeries('DGS10', s)).toThrow(/pp/);
  });
});

describe('assertRecency — the stale-publisher guard', () => {
  const today = new Date('2026-08-24T06:00:00Z');

  it('should accept a series inside its window', () => {
    const s: [Date, number][] = [day('2026-08-21T00:00:00Z', 100)];
    expect(() => assertRecency('fresh', s, today, { maxAgeDays: 14 })).not.toThrow();
  });

  it('should throw once the last observation is older than the window', () => {
    const s: [Date, number][] = [day('2026-07-01T00:00:00Z', 100)];
    let err: unknown;
    try {
      assertRecency('stale', s, today, { maxAgeDays: 14 });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(QualityGateError);
    expect((err as { check: string }).check).toBe('freshness');
  });
});

describe('assertOhlcBar — candle sanity', () => {
  it('should accept a coherent bar', () => {
    expect(() => assertOhlcBar('BTC', { open: 100, high: 120, low: 90, close: 110 })).not.toThrow();
  });

  it('should throw when low > close, high < open, or any leg is non-finite', () => {
    expect(() => assertOhlcBar('BTC', { open: 100, high: 120, low: 115, close: 110 })).toThrow(
      /OHLC/
    );
    expect(() => assertOhlcBar('BTC', { open: 130, high: 120, low: 90, close: 110 })).toThrow(
      /OHLC/
    );
    expect(() =>
      assertOhlcBar('BTC', { open: 100, high: 120, low: 90, close: Number.NaN })
    ).toThrow(/finite/);
  });
});

describe('assertBtcCloseVerified — the dual-source divergence bound', () => {
  it('should accept sources inside the tolerance and return the divergence', () => {
    const d = assertBtcCloseVerified('2026-07-01', 62813.75, 62800);
    expect(d).toBeLessThan(BTC_CLOSE_TOLERANCE_PCT);
  });

  it('should throw when the two sources disagree beyond the bound — NO WRITE', () => {
    let err: unknown;
    try {
      assertBtcCloseVerified('2026-07-01', 62813.75, 50000);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(QualityGateError);
    expect((err as { check: string }).check).toBe('divergence');
  });

  it('should hold the documented tolerance (a widening must fail here)', () => {
    expect(BTC_CLOSE_TOLERANCE_PCT).toBe(0.5);
  });
});
