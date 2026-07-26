import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import type { LedgerEvent, LedgerEventType } from '../ledger/events';
import { project, realDaysToSettle, recurringDepositDays, reconcile } from '../ledger/engine';
import { InMemoryLedgerStore } from '../ledger/store';

let counter = 0;
function base() {
  counter += 1;
  return {
    eventId: `evt-${counter}`,
    simDay: 0,
    recordedAt: '2026-07-18T00:00:00.000Z',
    correlationId: 'test',
  };
}

/** The founder's journey as an event log — the projection fixture. */
function journey(): LedgerEvent[] {
  return [
    { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'BRL', mode: 'b2c' },
    { ...base(), type: 'JobsSplitSet', floorPercent: 50, cushionPercent: 30, workingPercent: 20 },
    {
      ...base(),
      type: 'GoalCreated',
      goalId: 'g1',
      name: 'Recife em dezembro',
      icon: 'plane',
      targetAmount: '5000',
      horizonMonths: 18,
    },
    { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '1500' },
    {
      ...base(),
      type: 'StrategyEntered',
      goalId: 'g1',
      positionId: 'p1',
      strategyId: 'safeHarbor',
      amount: '1000',
      networkFee: '0.16',
    },
    {
      ...base(),
      type: 'AccrualApplied',
      positionId: 'p1',
      fromSimDay: 0,
      toSimDay: 30,
      earnings: '5.34',
      apySource: 'defillama',
    },
    { ...base(), type: 'TimeAdvanced', days: 30 },
  ];
}

describe('project (event-sourced state)', () => {
  it('should split granted money into jobs by the set percentages', () => {
    const state = project(journey().slice(0, 2));
    expect(state.buckets.floor).toBe('5000.00');
    expect(state.buckets.cushion).toBe('3000.00');
    expect(state.buckets.working).toBe('2000.00');
  });

  it('should move working money into the goal and then into the position', () => {
    const state = project(journey());
    const goal = state.goals[0];
    expect(state.buckets.working).toBe('500.00'); // 2000 − 1500
    expect(goal.cash).toBe('499.84'); // 1500 − 1000 principal − 0.16 network fee
    expect(goal.invested).toBe('1000.00');
    expect(goal.earnings).toBe('5.34');
    const position = state.positions[0];
    expect(position.open).toBe(true);
    expect(position.accrued).toBe('5.34');
    expect(state.simDay).toBe(30);
  });

  it('should reject a goal funding larger than working money (no negative balances, ever)', () => {
    const events = journey().slice(0, 3);
    events.push({ ...base(), type: 'GoalFunded', goalId: 'g1', amount: '99999' });
    const state = project(events);
    expect(state.buckets.working).toBe('2000.00');
    expect(state.goals[0].cash).toBe('0.00');
  });

  it('should close the position on exit, net of the exit fee and network fee', () => {
    const events = journey();
    events.push({
      ...base(),
      type: 'StrategyExited',
      positionId: 'p1',
      goalId: 'g1',
      grossAmount: '1005.34', // principal + accrued
      exitFee: '3.92', // 0.39% of 1005.34
      networkFee: '0.16',
    });
    const state = project(events);
    const goal = state.goals[0];
    expect(state.positions[0].open).toBe(false);
    expect(goal.invested).toBe('0.00');
    // 499.84 + (1005.34 − 3.92 − 0.16) = 1501.10
    expect(goal.cash).toBe('1501.10');
    expect(state.exitFeesPaid).toBe('3.92');
  });
});

describe('reconcile (the invariant gate: money never leaks)', () => {
  it('should reconcile to zero across the full journey', () => {
    expect(reconcile(project(journey()))).toBe('0.00');
  });

  it('should reconcile to zero after exit too', () => {
    const events = journey();
    events.push({
      ...base(),
      type: 'StrategyExited',
      positionId: 'p1',
      goalId: 'g1',
      grossAmount: '1005.34',
      exitFee: '3.92',
      networkFee: '0.16',
    });
    expect(reconcile(project(events))).toBe('0.00');
  });

  it('should reconcile at every prefix of the log (no intermediate leak)', () => {
    const events = journey();
    for (let i = 1; i <= events.length; i += 1) {
      expect(reconcile(project(events.slice(0, i))), `prefix ${i}`).toBe('0.00');
    }
  });
});

describe('fee/amount split exactness (guards the A-2 float-drift bug)', () => {
  // The engine drops a StrategyEntered whose amount+networkFee exceeds goal
  // cash. With independent float rounding of (total−fee) and fee, the sum can
  // exceed the total by a cent. The ledgerClient's Decimal split prevents that;
  // here we prove the engine accepts any split where amount+fee == cash exactly.
  it('should keep the position when amount+fee equals goal cash to the cent', () => {
    const feeBoundaries = ['0.005', '0.015', '0.025', '0.0055', '0.125'];
    for (const feeRaw of feeBoundaries) {
      // mirror splitEntry: fee rounded to 2dp, invested = total − fee
      const fee = Decimal.min(new Decimal(feeRaw).toDecimalPlaces(2), new Decimal(1500));
      const invested = new Decimal(1500).minus(fee);
      const events: LedgerEvent[] = [
        { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
        {
          ...base(),
          type: 'JobsSplitSet',
          floorPercent: 0,
          cushionPercent: 0,
          workingPercent: 100,
        },
        {
          ...base(),
          type: 'GoalCreated',
          goalId: 'g',
          name: 'x',
          icon: 'plane',
          targetAmount: '5000',
          horizonMonths: 12,
        },
        { ...base(), type: 'GoalFunded', goalId: 'g', amount: '1500' },
        {
          ...base(),
          type: 'StrategyEntered',
          goalId: 'g',
          positionId: 'p',
          strategyId: 'safeHarbor',
          amount: invested.toFixed(2),
          networkFee: fee.toFixed(2),
        },
      ];
      const state = project(events);
      expect(
        state.positions.filter((p) => p.open),
        `fee ${feeRaw}`
      ).toHaveLength(1);
      expect(reconcile(state), `reconcile fee ${feeRaw}`).toBe('0.00');
    }
  });
});

describe('InMemoryLedgerStore (idempotency, Principle 11)', () => {
  it('should ignore replayed eventIds', async () => {
    const store = new InMemoryLedgerStore();
    const [grant] = journey();
    await store.append(grant);
    await store.append(grant);
    expect(await store.getAll()).toHaveLength(1);
  });
});

describe('WS-F real-time settle (SANDBOX_WSF_DESIGN_2026-07-20)', () => {
  const t0 = '2026-07-18T00:00:00.000Z';

  it('realDaysToSettle: whole elapsed days minus already-settled, floored, non-negative, idempotent', () => {
    expect(realDaysToSettle(null, 0, t0)).toBe(0); // no genesis
    expect(realDaysToSettle(t0, 0, '2026-07-18T18:00:00.000Z')).toBe(0); // < 1 full day (D-2 daily)
    expect(realDaysToSettle(t0, 0, '2026-07-21T06:00:00.000Z')).toBe(3); // 3 full days elapsed
    expect(realDaysToSettle(t0, 2, '2026-07-21T06:00:00.000Z')).toBe(1); // 3 elapsed − 2 settled
    expect(realDaysToSettle(t0, 3, '2026-07-21T06:00:00.000Z')).toBe(0); // fully settled → idempotent
    expect(realDaysToSettle(t0, 0, '2026-07-10T00:00:00.000Z')).toBe(0); // clock moved backward
    expect(realDaysToSettle('not-a-date', 0, t0)).toBe(0); // invalid input
  });

  it('project tracks genesis + realSettledDays; missing source ⇒ machine (D-3 backward-compat)', () => {
    const events: LedgerEvent[] = [
      { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'TimeAdvanced', days: 30 }, // pre-WS-F event, no source → machine
      { ...base(), type: 'TimeAdvanced', days: 7, source: 'real' },
      { ...base(), type: 'TimeAdvanced', days: 5, source: 'machine' },
    ];
    const state = project(events);
    expect(state.genesisRecordedAt).toBe(t0);
    expect(state.simDay).toBe(42); // 30 + 7 + 5 (all advance simDay)
    expect(state.realSettledDays).toBe(7); // only the source:'real' one
  });

  it('reconciles to 0.00 after a real-time settle — money never leaks (the F-A3 invariant)', () => {
    const events: LedgerEvent[] = [
      { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'EF',
        icon: 'shield',
        targetAmount: '5000',
        horizonMonths: 24,
      },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '2000' },
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '1000',
        networkFee: '0.16',
      },
      {
        ...base(),
        type: 'AccrualApplied',
        positionId: 'p1',
        fromSimDay: 0,
        toSimDay: 7,
        earnings: '1.23',
        apySource: 'defillama',
      },
      { ...base(), type: 'TimeAdvanced', days: 7, source: 'real' },
    ];
    const state = project(events);
    expect(reconcile(state)).toBe('0.00');
    expect(state.realSettledDays).toBe(7);
  });

  it('real + machine advances both move simDay; only real counts as settled (composition)', () => {
    const events: LedgerEvent[] = [
      { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'TimeAdvanced', days: 7, source: 'real' },
      { ...base(), type: 'TimeAdvanced', days: 30, source: 'machine' },
      { ...base(), type: 'TimeAdvanced', days: 7, source: 'real' },
    ];
    const state = project(events);
    expect(state.simDay).toBe(44);
    expect(state.realSettledDays).toBe(14);
  });
});

describe('C-P0 · play-money invariant durability (CLO Board Session 024 — REQUIRED)', () => {
  // The single most important invariant: play money NEVER converts to real money,
  // a transfer out, or a prize — and it holds BY CONSTRUCTION (no such code path
  // exists), not merely by copy. This test pins the closed ledger event-type set
  // so that adding any value-egress event fails the build and forces a CLO review
  // (R-4 "never converts to anything of value"; the Q-2/paid-adjacency deferral
  // rests entirely on this). Do NOT relax without a CLO ruling.
  it('should keep the event-type set closed — no cash-out / transfer-out / prize / redeem / convert', () => {
    // Exhaustive by type: a new LedgerEventType will not compile until listed here,
    // which is the tripwire that forces the author to justify it against C-P0.
    const KNOWN_EVENT_TYPES: Record<LedgerEventType, true> = {
      PlayMoneyGranted: true,
      JobsSplitSet: true,
      GoalCreated: true,
      GoalFunded: true,
      StrategyEntered: true,
      AccrualApplied: true,
      StrategyExited: true,
      RecurringSet: true,
      RecurringContributionApplied: true,
      TimeAdvanced: true,
    };
    const VALUE_EGRESS =
      /withdraw|cash[-_ ]?out|payout|prize|reward|redeem|convert|transfer.*(out|external)/i;
    for (const type of Object.keys(KNOWN_EVENT_TYPES)) {
      expect(
        VALUE_EGRESS.test(type),
        `Event type "${type}" reads like value egress — this needs a CLO ruling (C-P0/R-4) before it ships`
      ).toBe(false);
    }
  });

  it('should conserve play money — reconcile holds, money only MOVES inside the system', () => {
    // The positive proof of the invariant: total held == granted + earnings − fees
    // at every prefix; money is never created, destroyed, or removed from the system.
    const events = journey();
    for (let i = 1; i <= events.length; i += 1) {
      expect(reconcile(project(events.slice(0, i))), `prefix ${i}`).toBe('0.00');
    }
  });
});

describe('recurringDepositDays (C3 cadence — pure, idempotent across split advances)', () => {
  it('should place the first deposit 30 days after the start anchor', () => {
    expect(recurringDepositDays(0, 0, 30)).toEqual([30]);
    expect(recurringDepositDays(0, 0, 29)).toEqual([]);
    expect(recurringDepositDays(0, 0, 90)).toEqual([30, 60, 90]);
  });

  it('should fire each due day exactly once when a month is split across advances', () => {
    // Advance 0→15 then 15→30: the day-30 deposit belongs only to the 2nd advance.
    expect(recurringDepositDays(0, 0, 15)).toEqual([]);
    expect(recurringDepositDays(0, 15, 30)).toEqual([30]);
    // Advance 30→60 must not re-fire day 30.
    expect(recurringDepositDays(0, 30, 60)).toEqual([60]);
  });

  it('should honor a non-zero start anchor and never emit past dues', () => {
    expect(recurringDepositDays(10, 0, 50)).toEqual([40]);
    expect(recurringDepositDays(10, 45, 90)).toEqual([70]); // 40 already past → skipped
  });

  it('should return nothing for a non-advancing or backward range', () => {
    expect(recurringDepositDays(0, 30, 30)).toEqual([]);
    expect(recurringDepositDays(0, 30, 10)).toEqual([]);
  });
});

describe('recurring contributions (C3 — real play money, reconcile-safe)', () => {
  /** A journey with an open position, then a recurring schedule + two deposits. */
  function recurringJourney(): LedgerEvent[] {
    return [
      { ...base(), type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'Freedom',
        icon: 'sprout',
        targetAmount: '50000',
        horizonMonths: 120,
      },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '2000' },
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '2000',
        networkFee: '0',
      },
      {
        ...base(),
        type: 'RecurringSet',
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '500',
        startSimDay: 0,
      },
      {
        ...base(),
        type: 'AccrualApplied',
        positionId: 'p1',
        fromSimDay: 0,
        toSimDay: 30,
        earnings: '10.00',
        apySource: 'defillama',
      },
      {
        ...base(),
        type: 'RecurringContributionApplied',
        goalId: 'g1',
        positionId: 'p1',
        amount: '500',
        onSimDay: 30,
      },
      {
        ...base(),
        type: 'AccrualApplied',
        positionId: 'p1',
        fromSimDay: 30,
        toSimDay: 60,
        earnings: '12.00',
        apySource: 'defillama',
      },
      {
        ...base(),
        type: 'RecurringContributionApplied',
        goalId: 'g1',
        positionId: 'p1',
        amount: '500',
        onSimDay: 60,
      },
      { ...base(), type: 'TimeAdvanced', days: 60 },
    ];
  }

  it('should move Working into the position principal (auto-invest), not create money', () => {
    const state = project(recurringJourney());
    const pos = state.positions.find((p) => p.positionId === 'p1')!;
    // 2000 entered + 500 + 500 contributed = 3000 principal; accrued 10+12 = 22.
    expect(pos.principal).toBe('3000.00');
    expect(pos.accrued).toBe('22.00');
    // Working: 10000 − 2000 funded − 500 − 500 = 7000.
    expect(state.buckets.working).toBe('7000.00');
    const goal = state.goals.find((g) => g.goalId === 'g1')!;
    expect(goal.invested).toBe('3000.00');
  });

  it('should keep reconcile at 0.00 across every prefix (contributions are a move)', () => {
    const events = recurringJourney();
    for (let i = 1; i <= events.length; i += 1) {
      expect(reconcile(project(events.slice(0, i))), `prefix ${i}`).toBe('0.00');
    }
  });

  it('should expose an active schedule for the open position and drop it when cleared', () => {
    const base0 = recurringJourney();
    expect(project(base0).recurring).toHaveLength(1);
    // Clearing with amount 0 removes it.
    const cleared: LedgerEvent[] = [
      ...base0,
      {
        ...base(),
        type: 'RecurringSet',
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '0',
        startSimDay: 60,
      },
    ];
    expect(project(cleared).recurring).toHaveLength(0);
  });

  it('should drop the schedule (derived-paused) once the position closes', () => {
    const withExit: LedgerEvent[] = [
      ...recurringJourney(),
      {
        ...base(),
        type: 'StrategyExited',
        positionId: 'p1',
        goalId: 'g1',
        grossAmount: '3022.00',
        exitFee: '11.79',
        networkFee: '0',
      },
    ];
    const state = project(withExit);
    expect(state.recurring).toHaveLength(0); // inert once closed
    expect(reconcile(state)).toBe('0.00');
  });

  it('should skip an over-budget contribution defensively (guards a leak)', () => {
    const events: LedgerEvent[] = [
      { ...base(), type: 'PlayMoneyGranted', amount: '1000', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'X',
        icon: 'sprout',
        targetAmount: '9999',
        horizonMonths: 12,
      },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '800' },
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '800',
        networkFee: '0',
      },
      // Only 200 working left; a 500 contribution must be rejected wholesale by the guard.
      {
        ...base(),
        type: 'RecurringContributionApplied',
        goalId: 'g1',
        positionId: 'p1',
        amount: '500',
        onSimDay: 30,
      },
    ];
    const state = project(events);
    expect(state.buckets.working).toBe('200.00'); // untouched
    expect(state.positions.find((p) => p.positionId === 'p1')!.principal).toBe('800.00');
    expect(reconcile(state)).toBe('0.00');
  });
});
