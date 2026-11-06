/**
 * PR 2 · guards 2 and 9 (P3 §6): routing Cases 1/2/3/U/none; the pace and needed lines read ONE
 * months-left value (the calendar frame itself: lib/__tests__/goalMonths.test.ts, guard 8).
 */
import { describe, expect, it } from 'vitest';
import type { RateRangesPayload } from '@/lib/rateRangesContract';
import type { LedgerState } from '@diboas/banking';
import {
  selectGoalProjection,
  selectGoalProjectionFor,
  selectProjectionCanShow,
  type ProjectionInput,
} from '../projection';

const okRange = (strategyId: string, low = 2.8, high = 3.7) => ({
  strategyId,
  available: true as const,
  lowPercent: low,
  highPercent: high,
  windowStart: '2026-02-13',
  windowEnd: '2026-11-04',
  observedDays: 266,
  todayPercent: 3.5,
  oldestLegAsOf: '2026-11-04',
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

describe('PR 2 · selectGoalProjection — routing', () => {
  it('should show the goal own range in Case 1 (the measured example: about 3 years)', () => {
    const v = selectGoalProjection(base());
    expect(v.kind).toBe('live');
    if (v.kind !== 'live') return;
    expect(v.when).toEqual({ kind: 'single', years: 3 });
    expect(v.range).toEqual({ lowPercent: 2.8, highPercent: 3.7, windowMonths: 8 });
    expect(v.today).toEqual({ kind: 'single', ratePercent: 3.5, asOf: '2026-11-04' });
    expect(v.withPlan).toEqual({ kind: 'modelled', amount: '200' });
  });

  it('should span several strategies from the lowest low to the highest high', () => {
    const v = selectGoalProjection(
      base({
        positions: [
          { strategyId: 'safeHarbor', value: 1000 },
          { strategyId: 'goalKeeper', value: 1000 },
        ],
      })
    );
    expect(v.kind === 'live' && v.range.lowPercent === 2.8 && v.range.highPercent === 3.7).toBe(
      true
    );
    expect(v.kind === 'live' && v.today.kind).toBe('range');
  });

  it('should simulate the needed monthly amount in Case 2 (the measured example)', () => {
    const v = selectGoalProjection(
      base({
        positions: [],
        goalCash: 2000,
        monthlyPlan: 0,
        monthsLeft: 36,
      })
    );
    expect(v.kind).toBe('simulated');
    if (v.kind !== 'simulated') return;
    expect(v.growthNote).toBe(false);
    expect(v.line).toEqual({
      kind: 'needed',
      amounts: {
        min: { kind: 'modelled', amount: '204' },
        max: { kind: 'modelled', amount: '209' },
      },
      monthsLeft: 36,
    });
  });

  it('should say "already enough" when what the goal holds reaches the target at the low rate', () => {
    const v = selectGoalProjection(base({ positions: [], goalCash: 9900, monthlyPlan: 0 }));
    expect(v.kind === 'simulated' && v.line.kind).toBe('alreadyEnough');
  });

  it('should add the growth note and simulate in Case 3 (a growth-exposed position)', () => {
    const v = selectGoalProjection(
      base({ positions: [{ strategyId: 'stableGrowth', value: 2000 }] })
    );
    expect(v.kind === 'simulated' && v.growthNote && v.line.kind === 'withPlan').toBe(true);
  });

  it('should show nothing for a paused, dropped or accomplished goal, a reached target, or no target', () => {
    for (const status of ['paused', 'dropped', 'accomplished'] as const)
      expect(selectGoalProjection(base({ status })).kind).toBe('none');
    expect(selectGoalProjection(base({ goalCash: 9000 })).kind).toBe('none');
    expect(selectGoalProjection(base({ target: 0 })).kind).toBe('none');
  });

  it('should show nothing in Case 2 at 0 months left', () => {
    const v = selectGoalProjection(
      base({
        positions: [],
        goalCash: 100,
        monthsLeft: 0,
      })
    );
    expect(v.kind).toBe('none');
  });

  it('should be unavailable (Case U) when the goal strategy range is unavailable, or the fetch failed', () => {
    const ranges: RateRangesPayload = {
      ...RANGES,
      strategies: [{ strategyId: 'safeHarbor', available: false, reason: 'STALE' }],
    };
    expect(selectGoalProjection(base({ ranges })).kind).toBe('unavailable');
    expect(selectGoalProjection(base({ ranges: 'error' })).kind).toBe('unavailable');
    expect(
      selectGoalProjection(
        base({
          positions: [],
          goalCash: 100,
          ranges: { ...RANGES, aggregate: { available: false } },
        })
      ).kind
    ).toBe('unavailable');
  });

  it('should be loading while the ranges are not in yet', () => {
    expect(selectGoalProjection(base({ ranges: null })).kind).toBe('loading');
  });
});

describe('PR 2 · pace (guard 9)', () => {
  it('should drop the pace (not the block) when months left are unknown', () => {
    const v = selectGoalProjection(base({ monthsLeft: null }));
    expect(v.kind).toBe('live');
    expect(v.kind === 'live' && v.pace).toBeNull();
  });

  it('should compare the pace with the months LEFT, never the full horizon', () => {
    // 3 years shown; 24 months left -> beyond; 48 left -> within.
    const beyond = selectGoalProjection(base({ monthsLeft: 24 }));
    expect(beyond.kind === 'live' && beyond.pace).toEqual({ status: 'beyond', monthsLeft: 24 });
    const within = selectGoalProjection(base({ monthsLeft: 48 }));
    expect(within.kind === 'live' && within.pace).toEqual({ status: 'within', monthsLeft: 48 });
  });

  it('should state the needed amount over the SAME months left the pace reads', () => {
    const v = selectGoalProjection(
      base({ positions: [], goalCash: 2000, monthlyPlan: 0, monthsLeft: 20 })
    );
    expect(v.kind === 'simulated' && v.line.kind === 'needed' && v.line.monthsLeft).toBe(20);
  });
});

describe('PR 2 · the block from the ledger (selectGoalProjectionFor)', () => {
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

  it('should read open positions at principal + accrued and THIS goal plan only (the measured 3 years)', () => {
    const v = selectGoalProjectionFor(ledger(), 'g1', 48, RANGES);
    expect(v.kind === 'live' && v.withPlan).toEqual({ kind: 'modelled', amount: '200' });
    expect(v.kind === 'live' && v.when).toEqual({ kind: 'single', years: 3 });
  });

  it('should not count the plan while Available is 0 (the recurring control shows it paused)', () => {
    const v = selectGoalProjectionFor(
      ledger({ buckets: { working: '0.00', floor: '0.00', cushion: '0.00' } }),
      'g1',
      48,
      RANGES
    );
    expect(v.kind === 'live' && v.withPlan).toBeNull();
    expect(v.kind === 'live' && v.pace).toBeNull();
  });

  it('should gate the fetch on the same answer the block gives', () => {
    expect(selectProjectionCanShow(ledger(), 'g1')).toBe(true);
    expect(selectProjectionCanShow(ledger(), 'missing')).toBe(false);
    const paused = ledger({
      goals: [{ goalId: 'g1', status: 'paused', targetAmount: '10000.00', cash: '0.00' }],
    } as unknown as Partial<LedgerState>);
    expect(selectProjectionCanShow(paused, 'g1')).toBe(false);
    expect(selectGoalProjectionFor(paused, 'g1', 48, RANGES).kind).toBe('none');
  });
});
