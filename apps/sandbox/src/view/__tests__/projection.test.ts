/**
 * PR 2 · guards 2 and 9 (P3 §6) and the 7th audit's selector findings: routing Cases
 * 1/2/3/U/none in the order none → U → 3 → 2 → 1; the lines that need months left drop, never
 * the block; the pace is never false (founder 2026-11-06); a positive amount never reads as zero; several
 * strategies span lowest low → highest high, the shortest window, the oldest leg. The calendar
 * frame itself is `lib/__tests__/goalMonths.test.ts` (guard 8).
 */
import { describe, expect, it } from 'vitest';
import type { LedgerState } from '@diboas/banking';
import type { RateRangesPayload } from '@/lib/rateRangesContract';
import {
  selectGoalProjection,
  selectGoalProjectionFor,
  selectProjectionCanShow,
  whenOf,
  type ProjectionInput,
  type ProjectionView,
} from '../projection';

const okRange = (
  strategyId: string,
  low = 2.8,
  high = 3.7,
  over: Partial<{ observedDays: number; todayPercent: number; oldestLegAsOf: string }> = {}
) => ({
  strategyId,
  available: true as const,
  lowPercent: low,
  highPercent: high,
  windowStart: '2026-02-13',
  windowEnd: '2026-11-04',
  observedDays: 266,
  todayPercent: 3.5,
  oldestLegAsOf: '2026-11-04',
  ...over,
});
const RANGES: RateRangesPayload = {
  strategies: [okRange('safeHarbor'), okRange('goalKeeper', 3.0, 3.7)],
  aggregate: { available: true, lowPercent: 2.7, highPercent: 3.8, observedDays: 266 },
};
const base = (over: Partial<ProjectionInput> = {}): ProjectionInput => ({
  status: 'active',
  target: 10000,
  goalCash: 0,
  positions: [{ strategyId: 'safeHarbor', value: 2000 }],
  monthlyPlan: 200,
  monthsLeft: 48,
  ranges: RANGES,
  ...over,
});
const live = (v: ProjectionView) => {
  if (v.kind !== 'live') throw new Error(`expected live, got ${v.kind}`);
  return v;
};
const sim = (v: ProjectionView) => {
  if (v.kind !== 'simulated') throw new Error(`expected simulated, got ${v.kind}`);
  return v;
};
const CASE2 = { positions: [], goalCash: 2000, monthlyPlan: 0, monthsLeft: 36 };
const GROWTH = [{ strategyId: 'stableGrowth', value: 2000 }];

describe('Case 1 · the goal own range', () => {
  it('should show the measured Case 1 example (about 3 years, the approved range and window)', () => {
    const v = live(selectGoalProjection(base()));
    expect(v.when).toEqual({ kind: 'single', years: 3 });
    expect(v.range).toEqual({ lowPercent: 2.8, highPercent: 3.7, windowMonths: 8 });
    expect(v.today).toEqual({ kind: 'single', ratePercent: 3.5, asOf: '2026-11-04' });
    expect(v.withPlan).toEqual({ kind: 'modelled', amount: '200' });
  });

  it('should span several strategies: lowest low, highest high, shortest window, oldest leg, today low to high — each from a different strategy', () => {
    const ranges: RateRangesPayload = {
      ...RANGES,
      strategies: [
        okRange('safeHarbor', 3.0, 3.9, {
          observedDays: 300,
          todayPercent: 3.6,
          oldestLegAsOf: '2026-11-04',
        }),
        okRange('goalKeeper', 2.6, 3.5, {
          observedDays: 200,
          todayPercent: 3.1,
          oldestLegAsOf: '2026-11-01',
        }),
      ],
    };
    const v = live(
      selectGoalProjection(
        base({
          ranges,
          positions: [
            { strategyId: 'safeHarbor', value: 1000 },
            { strategyId: 'goalKeeper', value: 1000 },
          ],
        })
      )
    );
    expect(v.range).toEqual({ lowPercent: 2.6, highPercent: 3.9, windowMonths: 6 });
    expect(v.today).toEqual({
      kind: 'range',
      lowPercent: 3.1,
      highPercent: 3.6,
      asOf: '2026-11-01',
    });
  });

  it('should keep cash outside a strategy from growing (the method says so)', () => {
    const years = (v: ProjectionView) => {
      const w = live(v).when;
      return w.kind === 'range' ? w.maxYears : w.kind === 'single' ? w.years : 0;
    };
    const allInvested = selectGoalProjection(
      base({ positions: [{ strategyId: 'safeHarbor', value: 6000 }], monthlyPlan: 0 })
    );
    const halfCash = selectGoalProjection(
      base({
        goalCash: 3000,
        positions: [{ strategyId: 'safeHarbor', value: 3000 }],
        monthlyPlan: 0,
      })
    );
    // Same 6,000 held; with half of it as cash, less grows, so it takes longer.
    expect(years(halfCash)).toBeGreaterThan(years(allInvested));
  });
});

describe('Cases 2 and 3 · the simulation at the stable aggregate', () => {
  it('should show the measured Case 2 example (the approved needed range over 36 months)', () => {
    const v = sim(selectGoalProjection(base(CASE2)));
    expect(v.growthNote).toBe(false);
    expect(v.range).toEqual({ lowPercent: 2.7, highPercent: 3.8, windowMonths: 8 });
    expect(v.line).toEqual({
      kind: 'needed',
      amounts: {
        min: { kind: 'modelled', amount: '204' },
        max: { kind: 'modelled', amount: '209' },
      },
      monthsLeft: 36,
    });
  });

  it('should say "already enough" only when the LOW rate reaches the target', () => {
    // 10000 / 1.027^3 ≈ 9,232: enough at the low rate → already enough.
    expect(sim(selectGoalProjection(base({ ...CASE2, goalCash: 9300 }))).line?.kind).toBe(
      'alreadyEnough'
    );
    // 10000 / 1.038^3 ≈ 8,941: enough at the high rate only → NOT already enough; "up to".
    expect(sim(selectGoalProjection(base({ ...CASE2, goalCash: 9000 }))).line?.kind).toBe(
      'neededUpTo'
    );
  });

  it('should say "up to" (never a range starting at zero) when the high end rounds to nothing', () => {
    const goalCash = 10000 / 1.038 ** 3 - 0.5;
    expect(sim(selectGoalProjection(base({ ...CASE2, goalCash }))).line?.kind).toBe('neededUpTo');
  });

  it('should never state a positive need as zero — at least one whole unit', () => {
    // 1 month left, under one unit needed at the low rate, nothing at the high rate → up to one unit.
    const goalCash = (10000 - 0.3) / 1.027 ** (1 / 12);
    const line = sim(selectGoalProjection(base({ ...CASE2, goalCash, monthsLeft: 1 }))).line;
    expect(line).toEqual({
      kind: 'neededUpTo',
      max: { kind: 'modelled', amount: '1' },
      monthsLeft: 1,
    });
  });

  it('should state ONE amount when both rates need the same whole amount (never a range whose ends match)', () => {
    const flat: RateRangesPayload = {
      ...RANGES,
      aggregate: { available: true, lowPercent: 3.0, highPercent: 3.0, observedDays: 266 },
    };
    const line = sim(selectGoalProjection(base({ ...CASE2, ranges: flat }))).line;
    expect(line?.kind === 'needed' && 'kind' in line.amounts).toBe(true);
  });

  it('should count the goal cash in Case 3 (everything is treated as stable in a simulation)', () => {
    const need = (v: ProjectionView) => {
      const line = sim(v).line;
      if (line?.kind !== 'needed') throw new Error('expected a needed line');
      return Number('kind' in line.amounts ? line.amounts.amount : line.amounts.max.amount);
    };
    const noCash = selectGoalProjection(base({ positions: GROWTH, monthlyPlan: 0 }));
    const withCash = selectGoalProjection(
      base({ positions: GROWTH, goalCash: 4000, monthlyPlan: 0 })
    );
    expect(need(withCash)).toBeLessThan(need(noCash));
  });

  it('should add the growth note in Case 3, with a plan (years) and without one (needed)', () => {
    const withPlan = sim(selectGoalProjection(base({ positions: GROWTH })));
    expect(withPlan.growthNote && withPlan.line?.kind === 'withPlan').toBe(true);
    const noPlan = sim(selectGoalProjection(base({ positions: GROWTH, monthlyPlan: 0 })));
    expect(noPlan.growthNote && noPlan.line?.kind === 'needed').toBe(true);
  });

  it('should keep the Case 3 block (growth note, no line) at 0 or unknown months left', () => {
    for (const monthsLeft of [0, null]) {
      const v = sim(selectGoalProjection(base({ positions: GROWTH, monthlyPlan: 0, monthsLeft })));
      expect(v.growthNote).toBe(true);
      expect(v.line).toBeNull();
    }
  });

  it('should treat an unknown strategy as growth-exposed (no rate is stated for it)', () => {
    const v = sim(
      selectGoalProjection(base({ positions: [{ strategyId: 'mystery', value: 2000 }] }))
    );
    expect(v.growthNote).toBe(true);
  });
});

describe('none · decided BEFORE the rates (no fetch, no "loading", no false "can’t be read")', () => {
  it.each([
    ['paused', { status: 'paused' as const }],
    ['dropped', { status: 'dropped' as const }],
    ['accomplished', { status: 'accomplished' as const }],
    ['a reached target', { goalCash: 9000 }],
    ['no target', { target: 0 }],
    ['Case 2 at 0 months left', { ...CASE2, monthsLeft: 0 }],
    ['Case 2 with unknown months left', { ...CASE2, monthsLeft: null }],
    ['Case 2 with non-finite months left', { ...CASE2, monthsLeft: Number.NaN }],
    [
      'Case 1 where nothing grows',
      { positions: [{ strategyId: 'safeHarbor', value: 0 }], monthlyPlan: 0 },
    ],
  ])('should be none for %s — even while loading or after a failed fetch', (_label, over) => {
    for (const ranges of [RANGES, null, 'error' as const])
      expect(selectGoalProjection(base({ ...over, ranges })).kind).toBe('none');
  });
});

describe('U · loading and unavailable', () => {
  it('should be loading while the ranges are not in yet', () => {
    expect(selectGoalProjection(base({ ranges: null })).kind).toBe('loading');
  });

  it('should be unavailable when the goal strategy range is, the aggregate is, or the fetch failed', () => {
    const stale: RateRangesPayload = {
      ...RANGES,
      strategies: [{ strategyId: 'safeHarbor', available: false, reason: 'STALE' }],
    };
    expect(selectGoalProjection(base({ ranges: stale })).kind).toBe('unavailable');
    expect(selectGoalProjection(base({ ranges: 'error' })).kind).toBe('unavailable');
    const noAggregate: RateRangesPayload = { ...RANGES, aggregate: { available: false } };
    expect(selectGoalProjection(base({ ...CASE2, ranges: noAggregate })).kind).toBe('unavailable');
  });
});

describe('plans and pace (guard 9; never false, founder 2026-11-06)', () => {
  it('should treat a plan under one whole unit as no plan (never a zero monthly amount)', () => {
    const v = live(selectGoalProjection(base({ monthlyPlan: 0.4 })));
    expect(v.withPlan).toBeNull();
    expect(v.pace).toBeNull();
  });

  it('should drop the pace (not the block) when months left are unknown or not finite', () => {
    for (const monthsLeft of [null, Number.NaN])
      expect(live(selectGoalProjection(base({ monthsLeft }))).pace).toBeNull();
  });

  it('should compare with the months LEFT: within, and beyond', () => {
    expect(live(selectGoalProjection(base({ monthsLeft: 48 }))).pace).toEqual({
      status: 'within',
      monthsLeft: 48,
    });
    expect(live(selectGoalProjection(base({ monthsLeft: 24 }))).pace).toEqual({
      status: 'beyond',
      monthsLeft: 24,
    });
  });

  it('should say "around" where the rounded years would make a false "fits inside" (29 months read as about 2 years)', () => {
    const v = live(
      selectGoalProjection(
        base({
          positions: [{ strategyId: 'safeHarbor', value: 1 }],
          monthlyPlan: 330,
          monthsLeft: 26,
        })
      )
    );
    expect(v.when).toEqual({ kind: 'single', years: 2 });
    expect(v.pace?.status).toBe('edge');
  });

  it('should say "around" where the rounded years would make a false "runs longer" (19 months read as about 2 years)', () => {
    const v = live(
      selectGoalProjection(
        base({
          positions: [{ strategyId: 'safeHarbor', value: 5800 }],
          monthlyPlan: 200,
          monthsLeft: 20,
        })
      )
    );
    expect(v.when).toEqual({ kind: 'single', years: 2 });
    expect(v.pace?.status).toBe('edge');
  });

  it('should say "around" where both the real months and the years shown straddle the months left', () => {
    const wide: RateRangesPayload = {
      ...RANGES,
      strategies: [okRange('safeHarbor', 1.0, 9.0)],
    };
    // The slow end is ~11 years, the fast end ~8; 100 months left sits between both readings.
    const v = live(selectGoalProjection(base({ target: 30000, ranges: wide, monthsLeft: 100 })));
    expect(v.when).toEqual({ kind: 'range', minYears: 8, maxYears: 11 });
    expect(v.pace?.status).toBe('edge');
  });

  it('should say "within a year" only when even the SLOW end is under a year', () => {
    const wide: RateRangesPayload = {
      ...RANGES,
      strategies: [okRange('safeHarbor', 0.1, 30.0)],
    };
    // Slow end just over 12 months, fast end under: "about 1 year", not "within a year".
    expect(live(selectGoalProjection(base({ ranges: wide, monthlyPlan: 650 }))).when).toEqual({
      kind: 'single',
      years: 1,
    });
    // Both ends under 12 months: "within a year".
    expect(live(selectGoalProjection(base({ ranges: wide, monthlyPlan: 800 }))).when).toEqual({
      kind: 'underYear',
    });
  });

  it('should cap the stated years at the longest goal horizon (5.804): a tiny goal reads "more than 40 years"', () => {
    const v = live(
      selectGoalProjection(
        base({ positions: [{ strategyId: 'safeHarbor', value: 1 }], monthlyPlan: 0 })
      )
    );
    expect(v.when).toEqual({ kind: 'overCap', years: 40 });
  });

  it('should state the fast end as the floor when only the slow end passes 40 years', () => {
    const wide: RateRangesPayload = {
      ...RANGES,
      strategies: [okRange('safeHarbor', 0.1, 9.0)],
    };
    // ~ (10000 − 1500) / 15 months at almost no growth (slow, > 40 years) vs far fewer at the high rate.
    const v = live(
      selectGoalProjection(
        base({
          ranges: wide,
          positions: [{ strategyId: 'safeHarbor', value: 1500 }],
          monthlyPlan: 15,
          monthsLeft: 480,
        })
      )
    );
    expect(v.when.kind).toBe('overCap');
    expect(v.when.kind === 'overCap' && v.when.years).toBeGreaterThan(1);
    expect(v.when.kind === 'overCap' && v.when.years).toBeLessThan(40);
  });

  it('should make "more than N years" TRUE for every fast end: N·12 < fast, N the largest such, never above 40 (8th audit)', () => {
    for (let fast = 0.25; fast <= 700; fast += 0.25)
      for (const slow of [481, 600, 5000]) {
        if (slow < fast) continue;
        const w = whenOf(fast, slow);
        if (fast <= 12) {
          expect(w, `fast ${fast}`).toEqual({ kind: 'underYearToOverCap', years: 40 });
          continue;
        }
        expect(w.kind, `fast ${fast}`).toBe('overCap');
        const n = w.kind === 'overCap' ? w.years : NaN;
        expect(n * 12, `fast ${fast}`).toBeLessThan(fast);
        expect(n, `fast ${fast}`).toBeLessThanOrEqual(40);
        if (n < 40) expect((n + 1) * 12, `fast ${fast}`).toBeGreaterThanOrEqual(fast);
      }
  });

  it('should never say "more than 1 year" when the high rate gets there in months (the audit case)', () => {
    const wide: RateRangesPayload = { ...RANGES, strategies: [okRange('safeHarbor', 0.001, 9.0)] };
    const v = live(
      selectGoalProjection(
        base({
          ranges: wide,
          positions: [{ strategyId: 'safeHarbor', value: 9500 }],
          monthlyPlan: 1,
          monthsLeft: 6,
        })
      )
    );
    expect(v.when).toEqual({ kind: 'underYearToOverCap', years: 40 });
  });

  it('should state the needed amount over the SAME months left the pace reads', () => {
    const line = sim(selectGoalProjection(base({ ...CASE2, monthsLeft: 20 }))).line;
    expect(line?.kind === 'needed' && line.monthsLeft).toBe(20);
  });
});

describe('the block from the ledger (selectGoalProjectionFor) and the fetch gate', () => {
  const ledger = (over: Partial<LedgerState> = {}): LedgerState =>
    ({
      currency: 'USD',
      buckets: { working: '500.00', floor: '0.00', cushion: '0.00' },
      goals: [
        {
          goalId: 'g1',
          status: 'active',
          targetAmount: '10000.00',
          cash: '0.00',
          horizonMonths: 48,
        },
      ],
      positions: [
        {
          goalId: 'g1',
          strategyId: 'safeHarbor',
          open: true,
          principal: '1900.00',
          accrued: '100.00',
        },
        {
          goalId: 'g1',
          strategyId: 'safeHarbor',
          open: false,
          principal: '5000.00',
          accrued: '0.00',
        },
      ],
      recurring: [
        { goalId: 'g1', monthlyAmount: '200.00' },
        { goalId: 'g2', monthlyAmount: '999.00' },
      ],
      events: [],
      ...over,
    }) as unknown as LedgerState;

  it('should read open positions at principal + accrued and THIS goal plan only', () => {
    const v = live(selectGoalProjectionFor(ledger(), 'g1', 48, RANGES));
    expect(v.withPlan).toEqual({ kind: 'modelled', amount: '200' });
    expect(v.when).toEqual({ kind: 'single', years: 3 });
  });

  it('should not count the plan while Available is 0 (the recurring control shows it paused)', () => {
    const v = live(
      selectGoalProjectionFor(
        ledger({ buckets: { working: '0.00', floor: '0.00', cushion: '0.00' } }),
        'g1',
        48,
        RANGES
      )
    );
    expect(v.withPlan).toBeNull();
    expect(v.pace).toBeNull();
  });

  it('should gate the fetch on the SAME routing (none before the rates → no fetch)', () => {
    expect(selectProjectionCanShow(ledger(), 'g1', 48)).toBe(true);
    expect(selectProjectionCanShow(ledger(), 'missing', 48)).toBe(false);
    const paused = ledger({
      goals: [{ goalId: 'g1', status: 'paused', targetAmount: '10000.00', cash: '0.00' }],
    } as unknown as Partial<LedgerState>);
    expect(selectProjectionCanShow(paused, 'g1', 48)).toBe(false);
    // Case 2 past its timeframe: nothing to say, so nothing to fetch.
    const noPositions = ledger({ positions: [] } as unknown as Partial<LedgerState>);
    expect(selectProjectionCanShow(noPositions, 'g1', 0)).toBe(false);
    expect(selectProjectionCanShow(noPositions, 'g1', 12)).toBe(true);
  });
});
