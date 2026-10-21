import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  setRecurring,
} from '@/lib/ledgerClient';
import { planAdvance } from '@/lib/advancePlanner';

/**
 * REQUIREMENT (`5.360`: AUTOMATIC CATCH-UP = NO; `cadence.ts`: "each due-day fires
 * exactly once"): a recurring deposit is the user's own money moving on a calendar,
 * so one due day moves it ONCE — however many advances the span is split into.
 *
 * Lane audit 2026-10-21 (B1): the planner seeded the deposit days from
 * `accruedThroughSimDay`, which only an accrual moves. A position the replay cannot
 * evidence never accrues, so every later advance re-walked the span from day 0 and
 * re-emitted the deposits it had already made.
 */
const GENESIS = '2026-08-03T09:00:00Z';

function positionWithSchedule(monthlyAmount: number) {
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 24,
    fundAmount: 1000,
  });
  enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 1000, networkFeeLocal: 0 });
  const positionId = getLedgerState().positions[0].positionId;
  setRecurring({ goalId, positionId, monthlyAmount });
  return positionId;
}

function depositDays(positionId: string): number[] {
  return getLedgerState()
    .events.filter(
      (e): e is Extract<typeof e, { type: 'RecurringContributionApplied' }> =>
        e.type === 'RecurringContributionApplied' && e.positionId === positionId
    )
    .map((e) => e.onSimDay);
}

describe('a recurring deposit fires once per due day (5.360)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(GENESIS));
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should not re-emit a due day when a later advance cannot replay the position', () => {
    const positionId = positionWithSchedule(200);
    // No evidenced history: the position is not replayable, so nothing accrues.
    advanceTime(30, [], 'machine', []);
    advanceTime(30, [], 'machine', []);

    const days = depositDays(positionId);
    expect(days).toEqual([30, 60]);
    expect(new Set(days).size).toBe(days.length);
  });

  it('should move the user money once per due day, never twice', () => {
    const positionId = positionWithSchedule(200);
    advanceTime(30, [], 'machine', []);
    advanceTime(30, [], 'machine', []);
    advanceTime(30, [], 'machine', []);

    const position = getLedgerState().positions.find((p) => p.positionId === positionId)!;
    // 1,000 entered + three monthly deposits of 200 (days 30, 60, 90).
    expect(position.principal).toBe('1600.00');
  });
});

/**
 * The same rule at the planner, where the cursor is chosen: a position whose
 * accrual cursor LAGS (its last span was refused, or nothing could replay it) must
 * not have the lagging days walked again. `RETROACTIVE AUTO-REPLAY = NO` (`5.360`).
 */
describe('planAdvance never walks days before this advance (5.360)', () => {
  const stamp = () => ({
    eventId: 'e',
    simDay: 60,
    recordedAt: '2026-08-03T09:00:00.000Z',
    correlationId: 'plan',
  });
  const LENDING_100 = {
    kind: 'lending' as const,
    weightPercent: 100,
    apy: { points: Array(400).fill(5), source: 'defillama' as const },
  };

  it('should start the walk at the first day of this advance, not at a lagging cursor', () => {
    const events = planAdvance({
      // Accrued only through day 0, while days 1–30 were already advanced (refused).
      positions: [
        {
          positionId: 'p1',
          goalId: 'g1',
          principal: '1000.00',
          accrued: '0.00',
          accruedThroughSimDay: 0,
        },
      ],
      schedules: [{ goalId: 'g1', positionId: 'p1', monthlyAmount: '200.00', startSimDay: 0 }],
      workingStart: '5000.00',
      legsByPosition: new Map([['p1', [LENDING_100]]]),
      toDay: 60,
      days: 30,
      source: 'machine',
      stamp,
    });
    const spans = events.filter(
      (e): e is Extract<typeof e, { type: 'AccrualApplied' | 'ReplaySpanRefused' }> =>
        e.type === 'AccrualApplied' || e.type === 'ReplaySpanRefused'
    );
    expect(spans.length).toBeGreaterThan(0);
    expect(Math.min(...spans.map((e) => e.fromSimDay))).toBe(30);
    const deposits = events.filter(
      (e): e is Extract<typeof e, { type: 'RecurringContributionApplied' }> =>
        e.type === 'RecurringContributionApplied'
    );
    expect(deposits.map((e) => e.onSimDay)).toEqual([60]);
  });
});
