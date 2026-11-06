import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  PROJECTION_POLICY,
  monthlyNeeded,
  monthsToTarget,
  rangeSpan,
  rollingAverageRange,
  weightedSeries,
  windowMonths,
} from '../projection';

/** Month-by-month reference: value grows at r, then the month's amount is added (end of month). */
function simulateMonths(
  cash: number,
  value: number,
  monthly: number,
  annualPercent: number,
  target: number
) {
  const r = new Decimal(1)
    .plus(annualPercent / 100)
    .pow(new Decimal(1).div(12))
    .minus(1);
  let v = new Decimal(value);
  for (let m = 0; m <= 2000; m++) {
    if (v.plus(cash).gte(target)) return m;
    v = v.times(r.plus(1)).plus(monthly);
  }
  return null;
}

function days(start: string, count: number, valueAt: (i: number) => number): Map<string, number> {
  const out = new Map<string, number>();
  const t0 = Date.parse(`${start}T00:00:00Z`);
  for (let i = 0; i < count; i++)
    out.set(new Date(t0 + i * 86_400_000).toISOString().slice(0, 10), valueAt(i));
  return out;
}

describe('PROJECTION_POLICY — the five approved parameters (founder 2026-11-05)', () => {
  it('should hold exactly the approved values when read', () => {
    expect(PROJECTION_POLICY).toEqual({
      averagingDays: 30,
      historyDays: 365,
      minOverlapDays: 90,
      rateDecimals: 1,
      moneyDecimals: 0,
    });
  });
});

describe('monthsToTarget — closed form vs a month-by-month simulation', () => {
  it('should reproduce the measured Case 1 example (2,000 invested, 200 a month, 10,000)', () => {
    const at = (a: number) =>
      monthsToTarget({
        goalCash: 0,
        investedValue: 2000,
        monthly: 200,
        annualPercent: a,
        target: 10000,
      });
    expect(at(2.8)).toBeCloseTo(37.48, 2);
    expect(at(3.7)).toBeCloseTo(36.76, 2);
  });

  it.each([
    [0, 2000, 200, 2.8, 10000],
    [500, 2000, 150, 3.7, 9000],
    [0, 0, 300, 4.1, 12000],
    [1000, 5000, 0, 3.5, 7000],
    [250, 100, 50, 0, 1000],
  ])(
    'should agree with the simulation for cash %s, invested %s, monthly %s at %s%% to %s',
    (cash, value, monthly, a, target) => {
      const n = monthsToTarget({
        goalCash: cash,
        investedValue: value,
        monthly,
        annualPercent: a,
        target,
      });
      const sim = simulateMonths(cash, value, monthly, a, target);
      expect(n).not.toBeNull();
      expect(Math.ceil((n as number) - 1e-9)).toBe(sim);
    }
  );

  it('should return 0 when the goal already holds the target', () => {
    expect(
      monthsToTarget({
        goalCash: 4000,
        investedValue: 6000,
        monthly: 0,
        annualPercent: 3,
        target: 10000,
      })
    ).toBe(0);
  });

  it('should return null when nothing grows toward the target', () => {
    expect(
      monthsToTarget({
        goalCash: 100,
        investedValue: 0,
        monthly: 0,
        annualPercent: 3,
        target: 1000,
      })
    ).toBeNull();
    expect(
      monthsToTarget({ goalCash: 0, investedValue: 0, monthly: 0, annualPercent: 0, target: 1000 })
    ).toBeNull();
  });

  it('should keep cash outside a strategy from growing when cash is part of the goal', () => {
    const withCash = monthsToTarget({
      goalCash: 5000,
      investedValue: 0,
      monthly: 100,
      annualPercent: 3,
      target: 10000,
    }) as number;
    const allInvested = monthsToTarget({
      goalCash: 0,
      investedValue: 5000,
      monthly: 100,
      annualPercent: 3,
      target: 10000,
    }) as number;
    expect(withCash).toBeGreaterThan(allInvested);
  });
});

describe('monthlyNeeded — closed form vs a month-by-month simulation', () => {
  it('should reproduce the measured Case 2 example (2,000 held, 10,000, 36 months, rates 2.7 to 3.8 a year)', () => {
    const at = (a: number) =>
      monthlyNeeded({ value: 2000, target: 10000, months: 36, annualPercent: a });
    expect(at(3.8)).toBeCloseTo(204.12, 2);
    expect(at(2.7)).toBeCloseTo(209.25, 2);
  });

  it.each([
    [2000, 10000, 36, 3.8],
    [0, 5000, 12, 2.7],
    [100, 900, 7, 0],
  ])(
    'should reach the target in exactly the months given for value %s, target %s, %s months at %s%%',
    (value, target, months, a) => {
      const p = monthlyNeeded({ value, target, months, annualPercent: a }) as number;
      expect(simulateMonths(0, value, p + 1e-6, a, target)).toBe(months);
    }
  );

  it('should return 0 when what the goal holds already reaches the target (the "already enough" line)', () => {
    expect(monthlyNeeded({ value: 9800, target: 10000, months: 24, annualPercent: 3 })).toBe(0);
  });

  it('should return null when no months are left', () => {
    expect(monthlyNeeded({ value: 100, target: 1000, months: 0, annualPercent: 3 })).toBeNull();
  });
});

describe('rollingAverageRange — 30-day averages of observed days', () => {
  it('should give the lowest and highest 30-day average over the observed window', () => {
    const series = days('2026-01-01', 120, (i) => (i < 60 ? 3 : 4));
    const r = rollingAverageRange(series, '2026-05-01') as NonNullable<
      ReturnType<typeof rollingAverageRange>
    >;
    expect(r.lowPercent).toBeCloseTo(3, 10);
    expect(r.highPercent).toBeCloseTo(4, 10);
    expect(r.observedDays).toBe(120);
    expect(r.windowStart).toBe('2026-01-01');
    expect(windowMonths(r.observedDays)).toBe(4);
  });

  it('should not average across a gap (a 30-day average needs 30 consecutive days)', () => {
    const series = days('2026-01-01', 100, () => 3);
    series.set('2026-01-15', 30); // a spike inside the first 30 days
    for (const d of [...series.keys()].slice(29, 31)) series.delete(d); // a gap after it
    const r = rollingAverageRange(series, '2026-05-01') as NonNullable<
      ReturnType<typeof rollingAverageRange>
    >;
    // the only window holding the spike crosses the gap, so it is skipped: the high stays 3
    expect(r.highPercent).toBeCloseTo(3, 10);
  });

  it('should be null when fewer than 90 days are observed (Case U)', () => {
    expect(
      rollingAverageRange(
        days('2026-01-01', 89, () => 3),
        '2026-05-01'
      )
    ).toBeNull();
  });

  it('should read exactly 90 observed days (the minimum is inclusive)', () => {
    expect(
      rollingAverageRange(
        days('2026-01-01', 90, () => 3),
        '2026-05-01'
      )
    ).not.toBeNull();
  });

  it('should leave out a point dated after asOf, even a very different one', () => {
    // 2026-06-17 is day 899 of the series; the next day jumps to 50 and must not count.
    const series = days('2024-01-01', 899, () => 3);
    series.set('2026-06-18', 50);
    const r = rollingAverageRange(series, '2026-06-17') as NonNullable<
      ReturnType<typeof rollingAverageRange>
    >;
    expect(r.highPercent).toBeCloseTo(3, 10);
    expect(r.windowEnd).toBe('2026-06-17');
  });

  it('should leave out points older than 365 days and newer than asOf', () => {
    const series = days('2024-01-01', 900, (i) => (i < 400 ? 50 : 3));
    const r = rollingAverageRange(series, '2026-06-17') as NonNullable<
      ReturnType<typeof rollingAverageRange>
    >;
    expect(r.highPercent).toBeCloseTo(3, 10);
  });
});

describe('weightedSeries — a strategy is its legs on the days every leg has a value', () => {
  it('should weight each leg and drop a day any leg lacks', () => {
    const a = new Map([
      ['2026-01-01', 4],
      ['2026-01-02', 4],
    ]);
    const b = new Map([['2026-01-01', 2]]);
    const s = weightedSeries([
      { weight: 0.5, series: a },
      { weight: 0.5, series: b },
    ]);
    expect([...s.entries()]).toEqual([['2026-01-01', 3]]);
  });
});

describe('7th audit · non-finite inputs and the multi-strategy span', () => {
  it('should answer null, never NaN, when any input is not a finite number', () => {
    const ok = { goalCash: 0, investedValue: 2000, monthly: 200, annualPercent: 3, target: 10000 };
    for (const k of ['goalCash', 'investedValue', 'monthly', 'target'] as const) {
      expect(monthsToTarget({ ...ok, [k]: Number.NaN }), k).toBeNull();
      expect(monthsToTarget({ ...ok, [k]: Number.POSITIVE_INFINITY }), k).toBeNull();
    }
    const need = { value: 2000, target: 10000, months: 36, annualPercent: 3 };
    for (const k of ['value', 'target'] as const)
      expect(monthlyNeeded({ ...need, [k]: Number.NaN }), k).toBeNull();
  });

  it('should take the lowest low, the highest high and the SHORTEST window — each from a different strategy', () => {
    expect(
      rangeSpan([
        { lowPercent: 3.0, highPercent: 3.6, observedDays: 300 },
        { lowPercent: 2.7, highPercent: 3.5, observedDays: 365 },
        { lowPercent: 3.1, highPercent: 3.8, observedDays: 120 },
      ])
    ).toEqual({ lowPercent: 2.7, highPercent: 3.8, observedDays: 120 });
    expect(rangeSpan([])).toBeNull();
  });
});
