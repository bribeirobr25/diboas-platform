import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { project, reconcile, type LedgerEvent, type RecurringSchedule } from '@diboas/banking';
import type { DailyApySeries } from '@diboas/investing';
import { planAdvance, type AdvancePositionInput } from '../advancePlanner';

let counter = 0;
function stamp() {
  counter += 1;
  return {
    eventId: `evt-${counter}`,
    simDay: 0,
    recordedAt: '2026-07-20T00:00:00.000Z',
    correlationId: 'plan',
  };
}

const FLAT: DailyApySeries = { points: Array(400).fill(5), source: 'defillama' };

function pos(overrides: Partial<AdvancePositionInput> = {}): AdvancePositionInput {
  return {
    positionId: 'p1',
    goalId: 'g1',
    principal: '2000.00',
    accrued: '0.00',
    accruedThroughSimDay: 0,
    ...overrides,
  };
}

function schedule(overrides: Partial<RecurringSchedule> = {}): RecurringSchedule {
  return { goalId: 'g1', positionId: 'p1', monthlyAmount: '500.00', startSimDay: 0, ...overrides };
}

describe('planAdvance (C3 annuity replay — pure orchestration)', () => {
  it('should emit one accrual per span and no contribution when there is no schedule', () => {
    const events = planAdvance({
      positions: [pos()],
      schedules: [],
      workingStart: '8000.00',
      blendedByPosition: new Map([['p1', FLAT]]),
      toDay: 30,
      days: 30,
      source: 'machine',
      stamp,
    });
    const accruals = events.filter((e) => e.type === 'AccrualApplied');
    const contribs = events.filter((e) => e.type === 'RecurringContributionApplied');
    expect(accruals).toHaveLength(1);
    expect(contribs).toHaveLength(0);
    expect(events.at(-1)!.type).toBe('TimeAdvanced');
  });

  it('should interleave a deposit at each monthly boundary (segmented accrual)', () => {
    const events = planAdvance({
      positions: [pos()],
      schedules: [schedule()],
      workingStart: '8000.00',
      blendedByPosition: new Map([['p1', FLAT]]),
      toDay: 90,
      days: 90,
      source: 'machine',
      stamp,
    });
    const accruals = events.filter((e) => e.type === 'AccrualApplied');
    const contribs = events.filter((e) => e.type === 'RecurringContributionApplied');
    // Deposits at 30/60/90 → 3 contributions; segments [0,30][30,60][60,90]. The
    // final [90,90] span is zero (last deposit landed on toDay) and is skipped
    // (L3), so 3 accruals — no "earned 0.00" noise line.
    expect(contribs).toHaveLength(3);
    expect(accruals).toHaveLength(3);
    // Deposits land on the right days.
    expect(contribs.map((e) => (e as { onSimDay: number }).onSimDay)).toEqual([30, 60, 90]);
  });

  it('should fire ~12 monthly deposits over a +1-year jump (WS-D) and reconcile to 0.00', () => {
    const setup: LedgerEvent[] = [
      { ...stamp(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...stamp(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...stamp(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'F',
        icon: 'sprout',
        targetAmount: '99999',
        horizonMonths: 120,
      },
      { ...stamp(), type: 'GoalFunded', goalId: 'g1', amount: '2000' },
      {
        ...stamp(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '2000',
        networkFee: '0',
      },
      {
        ...stamp(),
        type: 'RecurringSet',
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '500',
        startSimDay: 0,
      },
    ];
    const before = project(setup); // working = 8000
    const p = before.positions.find((x) => x.positionId === 'p1')!;
    const advance = planAdvance({
      positions: [
        {
          positionId: p.positionId,
          goalId: p.goalId,
          principal: p.principal,
          accrued: p.accrued,
          accruedThroughSimDay: p.accruedThroughSimDay,
        },
      ],
      schedules: before.recurring,
      workingStart: before.buckets.working,
      blendedByPosition: new Map([['p1', FLAT]]),
      toDay: 365,
      days: 365,
      source: 'machine',
      stamp,
    });
    const contribs = advance.filter((e) => e.type === 'RecurringContributionApplied');
    // Deposits at 30,60,...,360 = 12 within a 365-day jump.
    expect(contribs).toHaveLength(12);
    expect((contribs.at(-1) as { onSimDay: number }).onSimDay).toBe(360);
    // 12 x 500 = 6000 moved from Working (8000) into principal (2000 -> 8000).
    const state = project([...setup, ...advance]);
    expect(reconcile(state)).toBe('0.00');
    expect(new Decimal(state.buckets.working).toFixed(2)).toBe('2000.00');
  });

  it('should bound deposits by the shared Working pool and pause when exhausted', () => {
    // 900 working, 500/mo → full 500 at day 30, partial 400 at day 60, nothing at 90.
    const events = planAdvance({
      positions: [pos()],
      schedules: [schedule()],
      workingStart: '900.00',
      blendedByPosition: new Map([['p1', FLAT]]),
      toDay: 90,
      days: 90,
      source: 'machine',
      stamp,
    });
    const amounts = events
      .filter((e) => e.type === 'RecurringContributionApplied')
      .map((e) => (e as { amount: string }).amount);
    expect(amounts).toEqual(['500.00', '400.00']); // then paused — no third deposit
  });

  it('should deplete Working in strict day order across two positions (fairness)', () => {
    // 700 working, two positions each 500/mo. Day-30 deposits compete: p1 first
    // (500), p2 gets the remaining 200; day-60 gets nothing.
    const events = planAdvance({
      positions: [pos({ positionId: 'p1' }), pos({ positionId: 'p2' })],
      schedules: [schedule({ positionId: 'p1' }), schedule({ positionId: 'p2' })],
      workingStart: '700.00',
      blendedByPosition: new Map([
        ['p1', FLAT],
        ['p2', FLAT],
      ]),
      toDay: 60,
      days: 60,
      source: 'machine',
      stamp,
    });
    const byPos = (id: string) =>
      events
        .filter(
          (e) =>
            e.type === 'RecurringContributionApplied' &&
            (e as { positionId: string }).positionId === id
        )
        .map((e) => (e as { amount: string }).amount);
    expect(byPos('p1')).toEqual(['500.00']);
    expect(byPos('p2')).toEqual(['200.00']);
  });

  it('should reconcile to 0.00 for the two-position bounded advance (emit-order vs guard)', () => {
    // The fragile interaction (M4): deposits bounded in global (day, positionId)
    // order but EMITTED grouped by position. Run the full log through reconcile.
    const setup: LedgerEvent[] = [
      { ...stamp(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...stamp(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...stamp(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'A',
        icon: 'sprout',
        targetAmount: '99999',
        horizonMonths: 120,
      },
      {
        ...stamp(),
        type: 'GoalCreated',
        goalId: 'g2',
        name: 'B',
        icon: 'sprout',
        targetAmount: '99999',
        horizonMonths: 120,
      },
      { ...stamp(), type: 'GoalFunded', goalId: 'g1', amount: '3000' },
      { ...stamp(), type: 'GoalFunded', goalId: 'g2', amount: '3000' },
      {
        ...stamp(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '3000',
        networkFee: '0',
      },
      {
        ...stamp(),
        type: 'StrategyEntered',
        goalId: 'g2',
        positionId: 'p2',
        strategyId: 'safeHarbor',
        amount: '3000',
        networkFee: '0',
      },
      {
        ...stamp(),
        type: 'RecurringSet',
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '500',
        startSimDay: 0,
      },
      {
        ...stamp(),
        type: 'RecurringSet',
        goalId: 'g2',
        positionId: 'p2',
        monthlyAmount: '500',
        startSimDay: 0,
      },
    ];
    const before = project(setup); // working = 10000 − 6000 = 4000
    const advance = planAdvance({
      positions: before.positions.map((p) => ({
        positionId: p.positionId,
        goalId: p.goalId,
        principal: p.principal,
        accrued: p.accrued,
        accruedThroughSimDay: p.accruedThroughSimDay,
      })),
      schedules: before.recurring,
      workingStart: before.buckets.working,
      blendedByPosition: new Map([
        ['p1', FLAT],
        ['p2', FLAT],
      ]),
      toDay: 120, // deposits at 30/60/90/120 per position = 8 total × 500 = 4000 → exact drain
      days: 120,
      source: 'machine',
      stamp,
    });
    const state = project([...setup, ...advance]);
    expect(reconcile(state)).toBe('0.00');
    expect(new Decimal(state.buckets.working).toFixed(2)).toBe('0.00'); // drained exactly
  });

  it('should produce a full ledger that reconciles to 0.00 (money is only moved)', () => {
    // Build a real prefix log, then append the planned advance and reconcile.
    const setup: LedgerEvent[] = [
      { ...stamp(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...stamp(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...stamp(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'Freedom',
        icon: 'sprout',
        targetAmount: '50000',
        horizonMonths: 120,
      },
      { ...stamp(), type: 'GoalFunded', goalId: 'g1', amount: '2000' },
      {
        ...stamp(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '2000',
        networkFee: '0',
      },
      {
        ...stamp(),
        type: 'RecurringSet',
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '500',
        startSimDay: 0,
      },
    ];
    const before = project(setup);
    const p = before.positions.find((x) => x.positionId === 'p1')!;
    const advance = planAdvance({
      positions: [
        {
          positionId: p.positionId,
          goalId: p.goalId,
          principal: p.principal,
          accrued: p.accrued,
          accruedThroughSimDay: p.accruedThroughSimDay,
        },
      ],
      schedules: before.recurring,
      workingStart: before.buckets.working,
      blendedByPosition: new Map([['p1', FLAT]]),
      toDay: 60,
      days: 60,
      source: 'machine',
      stamp,
    });
    const state = project([...setup, ...advance]);
    expect(reconcile(state)).toBe('0.00');
    // Two 500 deposits landed → principal 3000 + earnings; working 10000−2000−1000 = 7000.
    expect(new Decimal(state.buckets.working).toFixed(2)).toBe('7000.00');
    expect(state.positions.find((x) => x.positionId === 'p1')!.principal).toBe('3000.00');
  });
});

describe('§3 rate-pinning — every emitted AccrualApplied is self-auditing (board §3.7)', () => {
  it('should pin ratesUsed that recompound to the emitted earnings EXACTLY, across segmented advances', () => {
    const varied: DailyApySeries = {
      points: Array.from({ length: 400 }, (_, i) => 3 + (i % 5)),
      source: 'defillama',
    };
    const events = planAdvance({
      positions: [pos({ principal: '1000.00', accrued: '0.00', accruedThroughSimDay: 0 })],
      schedules: [
        { goalId: 'g1', positionId: 'p1', monthlyAmount: '100.00', startSimDay: 0 },
      ] as RecurringSchedule[],
      workingStart: '5000.00',
      blendedByPosition: new Map([['p1', varied]]),
      toDay: 65, // spans two deposit days → 3 accrual segments
      days: 65,
      source: 'machine',
      stamp,
    });
    const accruals = events.filter((e) => e.type === 'AccrualApplied');
    expect(accruals.length).toBeGreaterThan(1); // segmented, not one span
    // Rebuild each segment's earnings from ITS OWN pinned rates on the running
    // value — the "would have" claim audited from the event alone.
    let value = new Decimal('1000.00');
    for (const event of events) {
      if (event.type === 'AccrualApplied') {
        expect(event.ratesUsed, 'every accrual carries its rates').toBeDefined();
        expect(event.ratesUsed).toHaveLength(event.toSimDay - event.fromSimDay);
        let recomputed = value;
        for (const rate of event.ratesUsed!) {
          recomputed = recomputed.mul(
            new Decimal(rate).div(100).plus(1).pow(new Decimal(1).div(365))
          );
        }
        expect(recomputed.minus(value).toDecimalPlaces(2).toFixed(2)).toBe(event.earnings);
        value = value.plus(event.earnings);
      }
      if (event.type === 'RecurringContributionApplied') value = value.plus(event.amount);
    }
  });
});
