import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import type { LedgerEvent, LedgerEventType, LedgerSource } from '../ledger/events';
import {
  collectibleWeeks,
  creditCeilingReached,
  project,
  realDaysToSettle,
  recurringDepositDays,
  reconcile,
  type LedgerState,
} from '../ledger/engine';
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
      // D-e goal lifecycle — none is value egress: cash "released"/"dropped"
      // moves INTERNALLY to Available (never leaves the system), the rest are
      // zero-value status/label transitions. C-P0 preserved.
      GoalPaused: true,
      GoalResumed: true,
      GoalDropped: true,
      GoalAccomplished: true,
      PositionReassigned: true,
      GoalTargetChanged: true,
      GoalCashReleased: true,
      // D-r rule CRUD — all zero-value (a rule holds no money; it only drafts
      // proposals the user must approve). None is value egress. C-P0 preserved.
      RuleCreated: true,
      RuleUpdated: true,
      RulePaused: true,
      RuleResumed: true,
      RuleDeleted: true,
      // §2.3 weekly cycle — both credits are INGRESS (play money entering, the
      // `credited` term), the opposite direction of egress; `RuleApplied` is a
      // zero-value approval marker (money rides its GoalFunded legs). None is
      // value egress. C-P0 preserved.
      WeeklyCreditGranted: true,
      ComparisonCreditGranted: true,
      RuleApplied: true,
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

  // Parallel tripwire to KNOWN_EVENT_TYPES (board §7b): the C-P0 covenant pins
  // event *type names*, but a payload discriminator can drift too. Pin the
  // `source` union so a new value (e.g. Phase-2 D-s `'system'` legs) is a
  // deliberate, reviewed change — and force the author to re-check the
  // `?? 'machine'` default in project() (only `'real'` may settle real days).
  it('should keep the LedgerSource union closed — a new source is deliberate + re-checked against the machine default', () => {
    // Exhaustive by type: a new LedgerSource will not compile until listed here.
    const KNOWN_SOURCES: Record<LedgerSource, true> = {
      real: true,
      machine: true,
      system: true,
    };
    // Only 'real' may increment realSettledDays; every other source (and a
    // missing one) must NOT — else a machine/system leg would fabricate real
    // elapsed time. Prove it for each known source.
    for (const source of Object.keys(KNOWN_SOURCES) as LedgerSource[]) {
      const days = 10;
      const settle = source === 'real';
      const events: LedgerEvent[] =
        source === 'system'
          ? // 'system' has no event carrying it yet (reserved for D-s); assert the
            // rule symbolically: a non-'real' source contributes 0 real days.
            [{ ...base(), type: 'TimeAdvanced', days, source: 'machine' }]
          : [{ ...base(), type: 'TimeAdvanced', days, source }];
      const state = project(events);
      expect(state.realSettledDays, `source "${source}"`).toBe(settle ? days : 0);
    }
  });

  // The runtime half of the P2R-13 guard. The COMPILE-time half is proven by the
  // switch compiling (assertNever narrows to never); this proves that if an
  // event whose type escaped the union ever reaches project() at runtime (e.g. a
  // forward-version event during replay), it surfaces LOUDLY — never silently
  // dropped, which was the pre-Step-0 failure mode.
  it('should throw, not silently drop, when project() meets an unknown event type', () => {
    const bogus = { ...base(), type: 'SomeFutureEventType' } as unknown as LedgerEvent;
    expect(() => project([bogus])).toThrow(/unhandled ledger event/);
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

describe('D-e goal lifecycle (spec: SANDBOX_SPEC_D-E)', () => {
  // A goal `g1` holding `cash` of uninvested money (100%-working split so the
  // math is clean), version 0, active.
  function fundedGoal(cash: string): LedgerEvent[] {
    return [
      { ...base(), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'Trip',
        icon: 'plane',
        targetAmount: '3000.00',
        horizonMonths: 24,
      },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: cash },
    ];
  }
  const g1 = (s: ReturnType<typeof project>) => s.goals.find((g) => g.goalId === 'g1')!;

  it('should pause then resume: active → paused → active, version increments each apply', () => {
    const paused = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalPaused', goalId: 'g1', expectedVersion: 0 },
    ]);
    expect(g1(paused).status).toBe('paused');
    expect(g1(paused).version).toBe(1);

    const resumed = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalPaused', goalId: 'g1', expectedVersion: 0 },
      { ...base(), type: 'GoalResumed', goalId: 'g1', expectedVersion: 1 },
    ]);
    expect(g1(resumed).status).toBe('active');
    expect(g1(resumed).version).toBe(2);
  });

  it('should skip an illegal transition (resume an active goal) with no version bump', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalResumed', goalId: 'g1', expectedVersion: 0 },
    ]);
    expect(g1(state).status).toBe('active');
    expect(g1(state).version).toBe(0);
  });

  it('should drop a goal: cash returns to Available (working), reconcile stays 0.00', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalDropped', goalId: 'g1', cashReleased: '1000.00', expectedVersion: 0 },
    ]);
    expect(g1(state).status).toBe('dropped');
    expect(g1(state).cash).toBe('0.00');
    expect(state.buckets.working).toBe('10000.00'); // 9000 remaining + 1000 returned
    expect(reconcile(state)).toBe('0.00');
  });

  it('should release partial goal cash to Available, guarded against over-release (no bump on reject)', () => {
    const evs: LedgerEvent[] = [
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalCashReleased', goalId: 'g1', amount: '400.00', expectedVersion: 0 },
    ];
    const st = project(evs);
    expect(g1(st).cash).toBe('600.00');
    expect(st.buckets.working).toBe('9400.00');
    expect(g1(st).version).toBe(1);
    expect(reconcile(st)).toBe('0.00');

    // Over-release (2000 > 600 remaining) is a clean no-op — no move, no bump.
    const st2 = project([
      ...evs,
      { ...base(), type: 'GoalCashReleased', goalId: 'g1', amount: '2000.00', expectedVersion: 1 },
    ]);
    expect(g1(st2).cash).toBe('600.00');
    expect(g1(st2).version).toBe(1);
    expect(reconcile(st2)).toBe('0.00');
  });

  it('should accomplish a goal by disposition (zero-value status flip, no money moves)', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      {
        ...base(),
        type: 'GoalAccomplished',
        goalId: 'g1',
        disposition: 'held-as-cash',
        expectedVersion: 0,
      },
    ]);
    expect(g1(state).status).toBe('accomplished');
    expect(g1(state).cash).toBe('1000.00');
    expect(reconcile(state)).toBe('0.00');
  });

  it('should change a target (old + new both retained in the event), staying active', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      {
        ...base(),
        type: 'GoalTargetChanged',
        goalId: 'g1',
        oldTarget: '3000.00',
        newTarget: '5000.00',
        expectedVersion: 0,
      },
    ]);
    expect(g1(state).targetAmount).toBe('5000.00');
    expect(g1(state).status).toBe('active');
    expect(g1(state).version).toBe(1);
  });

  it('should resolve a two-tab conflict by version: first write wins, the stale one re-presents (skipped)', () => {
    // Both tabs read version 0 then act — pause here, drop there.
    const state = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalPaused', goalId: 'g1', expectedVersion: 0 },
      { ...base(), type: 'GoalDropped', goalId: 'g1', cashReleased: '1000.00', expectedVersion: 0 },
    ]);
    expect(g1(state).status).toBe('paused'); // the stale drop did NOT apply
    expect(g1(state).version).toBe(1);
    expect(g1(state).cash).toBe('1000.00'); // cash was NOT released
    expect(reconcile(state)).toBe('0.00');
  });

  it('should keep reconcile indifferent to zero-value events (same residual with or without them)', () => {
    const bare = fundedGoal('1000.00');
    const withZeroValue: LedgerEvent[] = [
      ...bare,
      { ...base(), type: 'GoalPaused', goalId: 'g1', expectedVersion: 0 },
      { ...base(), type: 'GoalResumed', goalId: 'g1', expectedVersion: 1 },
      {
        ...base(),
        type: 'GoalTargetChanged',
        goalId: 'g1',
        oldTarget: '3000.00',
        newTarget: '4000.00',
        expectedVersion: 2,
      },
    ];
    expect(reconcile(project(bare))).toBe('0.00');
    expect(reconcile(project(withZeroValue))).toBe('0.00');
  });

  it('should replay deterministically, including zero-value lifecycle events', () => {
    const evs: LedgerEvent[] = [
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalPaused', goalId: 'g1', expectedVersion: 0 },
      { ...base(), type: 'GoalResumed', goalId: 'g1', expectedVersion: 1 },
    ];
    expect(project(evs)).toEqual(project(evs));
  });

  it('should reassign a position label-only: value moves between goals, reconcile indifferent', () => {
    const state = project([
      { ...base(), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'Trip',
        icon: 'plane',
        targetAmount: '3000.00',
        horizonMonths: 24,
      },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g2',
        name: 'Car',
        icon: 'car',
        targetAmount: '2000.00',
        horizonMonths: 24,
      },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '1000.00' },
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '990.00',
        networkFee: '10.00',
      },
      { ...base(), type: 'PositionReassigned', positionId: 'p1', fromGoalId: 'g1', toGoalId: 'g2' },
    ]);
    expect(state.positions.find((p) => p.positionId === 'p1')!.goalId).toBe('g2');
    expect(state.goals.find((g) => g.goalId === 'g1')!.invested).toBe('0.00');
    expect(state.goals.find((g) => g.goalId === 'g2')!.invested).toBe('990.00');
    expect(reconcile(state)).toBe('0.00');
  });

  it('should carry a reassigned position ACCRUED earnings to the new goal (both aggregates stay honest)', () => {
    const state = project([
      { ...base(), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 0, cushionPercent: 0, workingPercent: 100 },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g1',
        name: 'Trip',
        icon: 'plane',
        targetAmount: '3000.00',
        horizonMonths: 24,
      },
      {
        ...base(),
        type: 'GoalCreated',
        goalId: 'g2',
        name: 'Car',
        icon: 'car',
        targetAmount: '2000.00',
        horizonMonths: 24,
      },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '1000.00' },
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '990.00',
        networkFee: '10.00',
      },
      {
        ...base(),
        type: 'AccrualApplied',
        positionId: 'p1',
        fromSimDay: 0,
        toSimDay: 30,
        earnings: '50.00',
        apySource: 'defillama',
      },
      { ...base(), type: 'PositionReassigned', positionId: 'p1', fromGoalId: 'g1', toGoalId: 'g2' },
    ]);
    const g1After = state.goals.find((g) => g.goalId === 'g1')!;
    const g2After = state.goals.find((g) => g.goalId === 'g2')!;
    expect(g1After.earnings).toBe('0.00'); // the accrued earnings left with the position
    expect(g2After.earnings).toBe('50.00'); // and landed on the new goal
    expect(g2After.invested).toBe('990.00');
    expect(reconcile(state)).toBe('0.00');
  });

  it('should skip a transition on an unknown goal (no throw, no effect)', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalPaused', goalId: 'nope', expectedVersion: 0 },
    ]);
    expect(g1(state).status).toBe('active');
    expect(reconcile(state)).toBe('0.00');
  });

  it('should treat every transition on a TERMINAL (dropped) goal as a no-op — terminal is truly terminal', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalDropped', goalId: 'g1', cashReleased: '1000.00', expectedVersion: 0 },
      // All of these target the now-terminal g1 at its current version:
      { ...base(), type: 'GoalPaused', goalId: 'g1', expectedVersion: 1 },
      { ...base(), type: 'GoalResumed', goalId: 'g1', expectedVersion: 1 },
      {
        ...base(),
        type: 'GoalAccomplished',
        goalId: 'g1',
        disposition: 'held-as-cash',
        expectedVersion: 1,
      },
      {
        ...base(),
        type: 'GoalTargetChanged',
        goalId: 'g1',
        oldTarget: '3000.00',
        newTarget: '5000.00',
        expectedVersion: 1,
      },
      { ...base(), type: 'GoalCashReleased', goalId: 'g1', amount: '100.00', expectedVersion: 1 },
    ]);
    expect(g1(state).status).toBe('dropped'); // never revived
    expect(g1(state).version).toBe(1); // no further bumps
    expect(g1(state).targetAmount).toBe('3000.00'); // unchanged
    expect(reconcile(state)).toBe('0.00');
  });

  it('should no-op a PositionReassigned that is unknown, foreign, closed, or points to a missing goal', () => {
    const open: LedgerEvent[] = [
      ...fundedGoal('1000.00'),
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '990.00',
        networkFee: '10.00',
      },
    ];
    const goalOf = (s: LedgerState, id: string) =>
      s.positions.find((p) => p.positionId === id)!.goalId;

    // to-goal missing → break on `!to`
    const missingTo = project([
      ...open,
      { ...base(), type: 'PositionReassigned', positionId: 'p1', fromGoalId: 'g1', toGoalId: 'ghost' },
    ]);
    expect(goalOf(missingTo, 'p1')).toBe('g1');

    // wrong from-goal → break on the goalId guard
    const wrongFrom = project([
      ...open,
      { ...base(), type: 'PositionReassigned', positionId: 'p1', fromGoalId: 'x', toGoalId: 'g1' },
    ]);
    expect(goalOf(wrongFrom, 'p1')).toBe('g1');

    // unknown position → break on `!position`
    const unknownPos = project([
      ...open,
      { ...base(), type: 'PositionReassigned', positionId: 'ghost', fromGoalId: 'g1', toGoalId: 'g1' },
    ]);
    expect(reconcile(unknownPos)).toBe('0.00');

    // closed position → break on `!open`
    const closed = project([
      ...open,
      {
        ...base(),
        type: 'StrategyExited',
        positionId: 'p1',
        goalId: 'g1',
        grossAmount: '990.00',
        exitFee: '3.86',
        networkFee: '10.00',
      },
      { ...base(), type: 'PositionReassigned', positionId: 'p1', fromGoalId: 'g1', toGoalId: 'g1' },
    ]);
    expect(reconcile(closed)).toBe('0.00');
  });

  it('should reject a non-positive cash release (amount ≤ 0) as a clean no-op', () => {
    const state = project([
      ...fundedGoal('1000.00'),
      { ...base(), type: 'GoalCashReleased', goalId: 'g1', amount: '0.00', expectedVersion: 0 },
    ]);
    expect(g1(state).cash).toBe('1000.00');
    expect(g1(state).version).toBe(0);
    expect(reconcile(state)).toBe('0.00');
  });

  it('should keep money conserved even if a drop reaches the engine with an open position (UI blocks this; engine is fail-safe)', () => {
    // Spec D-e §4 blocks drop-with-open-positions in the UI (Stop/Reassign
    // first). This proves the engine's fail-safe: if such an event ever reached
    // projection, cash still only MOVES (goal → Available), the position stays
    // open + held, and NO money is created or lost.
    const state = project([
      ...fundedGoal('1000.00'),
      {
        ...base(),
        type: 'StrategyEntered',
        goalId: 'g1',
        positionId: 'p1',
        strategyId: 'safeHarbor',
        amount: '500.00',
        networkFee: '10.00',
      },
      { ...base(), type: 'GoalDropped', goalId: 'g1', cashReleased: '490.00', expectedVersion: 0 },
    ]);
    expect(g1(state).status).toBe('dropped');
    expect(g1(state).cash).toBe('0.00'); // remaining goal cash returned to Available
    expect(state.positions.find((p) => p.positionId === 'p1')!.open).toBe(true); // untouched
    expect(reconcile(state)).toBe('0.00'); // money conserved regardless
  });
});

describe('D-r rules engine (spec: SANDBOX_SPEC_D-R)', () => {
  const r1 = (s: LedgerState) => s.rules.find((r) => r.ruleId === 'r1')!;

  it('should create a rule: active, version 0, carrying the split (reconcile-indifferent)', () => {
    const state = project([
      {
        ...base(),
        type: 'RuleCreated',
        ruleId: 'r1',
        split: [
          { goalId: 'g1', percent: 50 },
          { goalId: 'g2', percent: 30 },
        ],
      },
    ]);
    expect(state.rules).toHaveLength(1);
    expect(r1(state)).toEqual({
      ruleId: 'r1',
      ruleVersion: 0,
      status: 'active',
      split: [
        { goalId: 'g1', percent: 50 },
        { goalId: 'g2', percent: 30 },
      ],
    });
    expect(reconcile(state)).toBe('0.00');
  });

  it('should update a rule (new split, version increments) and skip a stale-version update', () => {
    const evs: LedgerEvent[] = [
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      {
        ...base(),
        type: 'RuleUpdated',
        ruleId: 'r1',
        split: [{ goalId: 'g1', percent: 70 }],
        expectedRuleVersion: 0,
      },
    ];
    const state = project(evs);
    expect(r1(state).split).toEqual([{ goalId: 'g1', percent: 70 }]);
    expect(r1(state).ruleVersion).toBe(1);

    // A second update still quoting v0 is stale → skipped (version-safety).
    const stale = project([
      ...evs,
      {
        ...base(),
        type: 'RuleUpdated',
        ruleId: 'r1',
        split: [{ goalId: 'g1', percent: 99 }],
        expectedRuleVersion: 0,
      },
    ]);
    expect(r1(stale).split).toEqual([{ goalId: 'g1', percent: 70 }]);
    expect(r1(stale).ruleVersion).toBe(1);
  });

  it('should pause then resume, versioning each transition; deleted is terminal', () => {
    const pr = project([
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      { ...base(), type: 'RulePaused', ruleId: 'r1', expectedRuleVersion: 0 },
      { ...base(), type: 'RuleResumed', ruleId: 'r1', expectedRuleVersion: 1 },
    ]);
    expect(r1(pr).status).toBe('active');
    expect(r1(pr).ruleVersion).toBe(2);

    const del = project([
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      { ...base(), type: 'RuleDeleted', ruleId: 'r1', expectedRuleVersion: 0 },
      { ...base(), type: 'RulePaused', ruleId: 'r1', expectedRuleVersion: 1 }, // no-op: terminal
    ]);
    expect(r1(del).status).toBe('deleted');
    expect(r1(del).ruleVersion).toBe(1);
  });

  it('should enforce ONE active rule (overlap-forbid): a 2nd RuleCreated is rejected while one is live', () => {
    const state = project([
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      { ...base(), type: 'RuleCreated', ruleId: 'r2', split: [{ goalId: 'g2', percent: 40 }] },
    ]);
    expect(state.rules).toHaveLength(1);
    expect(state.rules[0].ruleId).toBe('r1');
  });

  it('should allow a fresh rule only AFTER the previous is deleted (history kept)', () => {
    const state = project([
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      { ...base(), type: 'RuleDeleted', ruleId: 'r1', expectedRuleVersion: 0 },
      { ...base(), type: 'RuleCreated', ruleId: 'r2', split: [{ goalId: 'g2', percent: 40 }] },
    ]);
    expect(state.rules).toHaveLength(2); // r1 (deleted, kept) + r2 (active)
    expect(state.rules.find((r) => r.ruleId === 'r1')!.status).toBe('deleted');
    expect(state.rules.find((r) => r.ruleId === 'r2')!.status).toBe('active');
  });

  it('should honor the version-safety invariant: a stale concurrent transition never applies', () => {
    // Two tabs read v0: one updates (v0→1), one pauses quoting the now-stale v0.
    const state = project([
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      {
        ...base(),
        type: 'RuleUpdated',
        ruleId: 'r1',
        split: [{ goalId: 'g1', percent: 60 }],
        expectedRuleVersion: 0,
      },
      { ...base(), type: 'RulePaused', ruleId: 'r1', expectedRuleVersion: 0 }, // stale → skipped
    ]);
    expect(r1(state).status).toBe('active'); // the stale pause did NOT apply
    expect(r1(state).split).toEqual([{ goalId: 'g1', percent: 60 }]);
    expect(r1(state).ruleVersion).toBe(1);
  });

  it('should keep rule CRUD reconcile-indifferent and replay-deterministic', () => {
    const money: LedgerEvent[] = [
      { ...base(), type: 'PlayMoneyGranted', amount: '10000.00', currency: 'USD', mode: 'b2c' },
      { ...base(), type: 'JobsSplitSet', floorPercent: 50, cushionPercent: 30, workingPercent: 20 },
    ];
    const withRule: LedgerEvent[] = [
      ...money,
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      { ...base(), type: 'RulePaused', ruleId: 'r1', expectedRuleVersion: 0 },
    ];
    expect(reconcile(project(money))).toBe('0.00');
    expect(reconcile(project(withRule))).toBe('0.00'); // rules add no residual
    expect(project(withRule)).toEqual(project(withRule));
  });

  it('should skip CRUD on an unknown rule (no throw, no effect)', () => {
    const state = project([
      { ...base(), type: 'RulePaused', ruleId: 'ghost', expectedRuleVersion: 0 },
    ]);
    expect(state.rules).toHaveLength(0);
    expect(reconcile(state)).toBe('0.00');
  });

  it('should no-op an illegal resume (rule already active) and a delete on an already-deleted rule', () => {
    const state = project([
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      { ...base(), type: 'RuleResumed', ruleId: 'r1', expectedRuleVersion: 0 }, // active → no-op
      { ...base(), type: 'RuleDeleted', ruleId: 'r1', expectedRuleVersion: 0 }, // deletes (v0→1)
      { ...base(), type: 'RuleDeleted', ruleId: 'r1', expectedRuleVersion: 1 }, // already deleted → no-op
    ]);
    expect(r1(state).status).toBe('deleted');
    expect(r1(state).ruleVersion).toBe(1); // only the real delete bumped the version
  });
});

describe('§2.3 weekly cycle (WG-1 + D-r §3) — the credited term goes live', () => {
  const genesis = '2026-08-01T00:00:00.000Z';
  const day = (n: number, hour = 0) =>
    new Date(Date.parse(genesis) + n * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000).toISOString();

  function grantAt(iso: string): LedgerEvent {
    return { ...base(), recordedAt: iso, type: 'PlayMoneyGranted', amount: '10000', currency: 'USD', mode: 'b2c' };
  }
  function weekly(week: number, at?: string): LedgerEvent {
    return { ...base(), ...(at ? { recordedAt: at } : {}), type: 'WeeklyCreditGranted', week, amount: '1000.00' };
  }

  it('should land a weekly credit in Available AND the credited term, and reconcile to 0.00', () => {
    const state = project([grantAt(genesis), weekly(1)]);
    expect(state.buckets.working).toBe('11000.00');
    expect(state.credited).toBe('1000.00');
    expect(state.collectedWeeks).toEqual([1]);
    expect(reconcile(state)).toBe('0.00');
  });

  it('should be idempotent per week — a duplicate week event is a clean no-op', () => {
    const state = project([grantAt(genesis), weekly(3), weekly(3)]);
    expect(state.credited).toBe('1000.00');
    expect(state.collectedWeeks).toEqual([3]);
    expect(reconcile(state)).toBe('0.00');
  });

  it('should grant the comparison credit once, and only after a strategy entry exists (P2BD-10)', () => {
    const before: LedgerEvent[] = [
      grantAt(genesis),
      { ...base(), type: 'ComparisonCreditGranted', amount: '1000.00' }, // no position yet → no-op
    ];
    expect(project(before).credited).toBe('0.00');
    expect(project(before).comparisonCredited).toBe(false);

    const after: LedgerEvent[] = [
      grantAt(genesis),
      { ...base(), type: 'GoalCreated', goalId: 'g1', name: 'Trip', icon: 'plane', targetAmount: '3000', horizonMonths: 12 },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '2000' },
      { ...base(), type: 'StrategyEntered', goalId: 'g1', positionId: 'p1', strategyId: 'safeHarbor', amount: '1990', networkFee: '10' },
      { ...base(), type: 'ComparisonCreditGranted', amount: '1000.00' },
      { ...base(), type: 'ComparisonCreditGranted', amount: '1000.00' }, // second → no-op
    ];
    const state = project(after);
    expect(state.comparisonCredited).toBe(true);
    expect(state.credited).toBe('1000.00');
    expect(reconcile(state)).toBe('0.00');
  });

  it('should treat RuleApplied as zero-value — reconcile indifferent, money rides its GoalFunded legs', () => {
    const state = project([
      grantAt(genesis),
      { ...base(), type: 'GoalCreated', goalId: 'g1', name: 'Trip', icon: 'plane', targetAmount: '3000', horizonMonths: 12 },
      { ...base(), type: 'RuleCreated', ruleId: 'r1', split: [{ goalId: 'g1', percent: 50 }] },
      weekly(1),
      { ...base(), type: 'RuleApplied', ruleId: 'r1', ruleVersion: 0, proposalId: 'pr1', weekSet: [1] },
      { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '500' },
    ]);
    expect(state.goals[0].cash).toBe('500.00');
    expect(state.buckets.working).toBe('10500.00'); // grant + 1000 credit − 500 to the goal
    expect(reconcile(state)).toBe('0.00');
  });

  describe('collectibleWeeks (real-calendar accrual + the pause-at-cap meter)', () => {
    it('should return [] with no genesis, an invalid now, or a zero cap', () => {
      expect(collectibleWeeks(null, [], day(30), 2)).toEqual([]);
      expect(collectibleWeeks(genesis, [], 'not-a-date', 2)).toEqual([]);
      expect(collectibleWeeks(genesis, [], day(30), 0)).toEqual([]);
    });

    it('should bank nothing before the first boundary and week 1 exactly at genesis+7d', () => {
      expect(collectibleWeeks(genesis, [], day(6, 23), 2)).toEqual([]);
      expect(collectibleWeeks(genesis, [], day(7), 2)).toEqual([1]);
    });

    it('should pause accrual at the cap — 10 idle weeks bank only the first 2, never loss of the banked', () => {
      expect(collectibleWeeks(genesis, [], day(70), 2)).toEqual([1, 2]);
    });

    it('should resume at the NEXT calendar boundaries after a collect (pause, not backfill)', () => {
      // Collected weeks 1+2 on day 71; boundaries 11 and 12 re-fill the meter, then pause again.
      const collected = [day(71), day(71)];
      expect(collectibleWeeks(genesis, collected, day(71, 1), 2)).toEqual([]);
      expect(collectibleWeeks(genesis, collected, day(78), 2)).toEqual([11]);
      expect(collectibleWeeks(genesis, collected, day(120), 2)).toEqual([11, 12]);
    });

    it('should keep the weekly rhythm for a prompt collector — one new week per boundary', () => {
      expect(collectibleWeeks(genesis, [day(8)], day(15), 2)).toEqual([2]);
      expect(collectibleWeeks(genesis, [day(8), day(15)], day(22), 2)).toEqual([3]);
    });
  });

  describe('the WG-1 refill ceiling (board §2b — bidirectional dual-clock invariant)', () => {
    const CEILING = '20000.00'; // 2× the 10,000 grant

    it('should not pause below the ceiling and pause at it', () => {
      const below = project([grantAt(genesis), weekly(1)]);
      expect(creditCeilingReached(below, CEILING)).toBe(false);
      // 10 collected weeks → base 20,000 = the ceiling → paused.
      const weeks = Array.from({ length: 10 }, (_, i) => weekly(i + 1));
      const at = project([grantAt(genesis), ...weeks]);
      expect(creditCeilingReached(at, CEILING)).toBe(true);
    });

    it('should NOT suppress credits when machine time inflates earnings (the §2b starving direction)', () => {
      // A machine-era accrual big enough that held net worth crosses 2× the
      // grant — the ceiling base must ignore it (earnings excluded, P2BD-9).
      const state = project([
        grantAt(genesis),
        { ...base(), type: 'GoalCreated', goalId: 'g1', name: 'Trip', icon: 'plane', targetAmount: '3000', horizonMonths: 12 },
        { ...base(), type: 'GoalFunded', goalId: 'g1', amount: '9000' },
        { ...base(), type: 'StrategyEntered', goalId: 'g1', positionId: 'p1', strategyId: 'safeHarbor', amount: '9000', networkFee: '0.00' },
        { ...base(), type: 'TimeAdvanced', days: 365, source: 'machine' },
        { ...base(), type: 'AccrualApplied', positionId: 'p1', fromSimDay: 0, toSimDay: 365, earnings: '15000.00', apySource: 'fixture' },
      ]);
      // Held net worth (10,000 + 15,000 earnings) is far past 2× the grant…
      expect(new Decimal(state.buckets.working).plus('9000').plus('15000').gte('20000')).toBe(true);
      // …but the real-calendar ceiling base is still 10,000 → collection stays open.
      expect(creditCeilingReached(state, CEILING)).toBe(false);
    });

    it('should NOT grant credits from machine time either (the farming direction) — weeks come from the real calendar only', () => {
      // A year of machine time, but only 8 real days since genesis → exactly week 1 is collectible.
      expect(collectibleWeeks(genesis, [], day(8), 2)).toEqual([1]);
      // collectibleWeeks takes no sim-time input AT ALL — machine advances cannot
      // reach it; this pins the API-level independence both directions rely on.
    });
  });
});
