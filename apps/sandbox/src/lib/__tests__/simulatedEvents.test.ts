import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reconcile } from '@diboas/banking';
import {
  advanceTime,
  createGoal,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  resolveSimulatedExpense,
} from '@/lib/ledgerClient';
import {
  SIMULATED_EVENT_CATALOGUE,
  SIMULATED_EVENT_CATALOGUE_VERSION,
} from '@/config/simulatedEventCatalogue';
import {
  affordableExpenseOptions,
  dueSimulatedEvent,
  expenseImpacts,
  simulatedEventAmount,
} from '@/lib/simulatedEvents';
import { getResolutions } from '@/lib/simulatedEventStore';
import { SIM_EVENT_DEFAULT_MULTIPLE, SIM_EVENT_SIZING } from '@/lib/growthConstants';

/**
 * §2.4 D-s — the catalogue, the affordability filter, and the resolve commit
 * (node env; engine math proven in @diboas/banking, this is the wiring).
 */

const R1_EVENT = SIMULATED_EVENT_CATALOGUE.events[0];

describe('the simulated-event catalogue (RD-9: versioned config-as-data)', () => {
  it('should ship exactly the R1 unexpected-expense event, version-pinned', () => {
    expect(SIMULATED_EVENT_CATALOGUE.version).toBe(SIMULATED_EVENT_CATALOGUE_VERSION);
    expect(SIMULATED_EVENT_CATALOGUE.events).toHaveLength(1);
    expect(R1_EVENT.type).toBe('unexpected_expense');
    expect(R1_EVENT.direction).toBe('expense');
  });

  it('should size from the attested constants, never literals (the drift tripwire)', () => {
    expect(R1_EVENT.sizing).toEqual({
      basis: 'weeklyCredit',
      minMultiple: SIM_EVENT_SIZING.minWeeklyMultiple,
      maxMultiple: SIM_EVENT_SIZING.maxWeeklyMultiple,
      defaultMultiple: SIM_EVENT_DEFAULT_MULTIPLE,
    });
  });

  it('should derive the concrete amount from the weekly credit per mode', () => {
    expect(simulatedEventAmount('b2c', R1_EVENT)).toBe(1500); // 1000 × 1.5
    expect(simulatedEventAmount('b2b', R1_EVENT)).toBe(37500); // 25000 × 1.5
  });

  it('should offer 2–4 options including the reserve path (14.8), postpone excluded by design', () => {
    expect(R1_EVENT.optionKeys.length).toBeGreaterThanOrEqual(2);
    expect(R1_EVENT.optionKeys.length).toBeLessThanOrEqual(4);
    expect(R1_EVENT.optionKeys).toContain('useReserve');
    expect(R1_EVENT.optionKeys).not.toContain('postpone');
  });
});

describe('affordability filtering + the resolve commit (D-s §2/§3)', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should filter options by what the balances actually allow', () => {
    const goalId = createGoal({
      name: 'Emergency fund',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 2000,
    });
    const options = affordableExpenseOptions(getLedgerState(), 1500);
    expect(options.coverFromAvailable).toBe(true); // 8,000 working ≥ 1,500
    expect(options.reserveGoalIds).toEqual([goalId]); // 2,000 goal cash ≥ 1,500

    const tight = affordableExpenseOptions(getLedgerState(), 3000);
    expect(tight.coverFromAvailable).toBe(true);
    expect(tight.reserveGoalIds).toEqual([]); // the goal can't cover 3,000
  });

  it('should resolve via Available: debit, spent term, platform record, conserved', () => {
    const result = resolveSimulatedExpense({
      eventInstanceId: 'ev1',
      eventType: 'unexpected_expense',
      amount: 1500,
      via: { path: 'available' },
    });
    expect(result).toEqual({ ok: true });
    const state = getLedgerState();
    expect(state.buckets.working).toBe('8500.00');
    expect(state.spent).toBe('1500.00');
    expect(reconcile(state)).toBe('0.00');
    const records = getResolutions();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      eventInstanceId: 'ev1',
      choice: 'coverFromAvailable',
      catalogueVersion: SIMULATED_EVENT_CATALOGUE_VERSION,
    });
  });

  it('should resolve via the reserve: GoalCashReleased + the debit, one story, conserved', () => {
    const goalId = createGoal({
      name: 'Emergency fund',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    });
    const result = resolveSimulatedExpense({
      eventInstanceId: 'ev2',
      eventType: 'unexpected_expense',
      amount: 1500,
      via: { path: 'reserve', goalId },
    });
    expect(result).toEqual({ ok: true });
    const state = getLedgerState();
    expect(state.goals[0].cash).toBe('1500.00'); // 3,000 − 1,500 released
    expect(state.buckets.working).toBe('7000.00'); // 7,000 + 1,500 released − 1,500 spent
    expect(state.spent).toBe('1500.00');
    expect(reconcile(state)).toBe('0.00');
    expect(getResolutions()[0].choice).toBe('useReserve');
  });

  it('should be idempotent on the instance — a second resolve is refused and moves nothing', () => {
    resolveSimulatedExpense({
      eventInstanceId: 'ev3',
      eventType: 'unexpected_expense',
      amount: 1000,
      via: { path: 'available' },
    });
    const again = resolveSimulatedExpense({
      eventInstanceId: 'ev3',
      eventType: 'unexpected_expense',
      amount: 1000,
      via: { path: 'available' },
    });
    expect(again).toEqual({ ok: false, reason: 'alreadyResolved' });
    expect(getLedgerState().spent).toBe('1000.00');
    expect(getResolutions()).toHaveLength(1);
  });

  it('should refuse an unaffordable commit (re-validated at commit time, never a negative balance)', () => {
    const result = resolveSimulatedExpense({
      eventInstanceId: 'ev4',
      eventType: 'unexpected_expense',
      amount: 99_999,
      via: { path: 'available' },
    });
    expect(result).toEqual({ ok: false, reason: 'notAffordable' });
    expect(getLedgerState().buckets.working).toBe('10000.00');
    expect(getResolutions()).toHaveLength(0);
    // Reserve path against a goal that can't cover it: same refusal.
    const goalId = createGoal({
      name: 'Small goal',
      icon: 'target',
      targetAmount: 1000,
      horizonMonths: 6,
      fundAmount: 500,
    });
    const reserve = resolveSimulatedExpense({
      eventInstanceId: 'ev5',
      eventType: 'unexpected_expense',
      amount: 1500,
      via: { path: 'reserve', goalId },
    });
    expect(reserve).toEqual({ ok: false, reason: 'notAffordable' });
    expect(reconcile(getLedgerState())).toBe('0.00');
  });

  it('should treat postponement as pure absence — no record, no ledger trace, nothing to expire', () => {
    // Postponed-forever is the DEFAULT state: the event simply has no
    // resolution record and no money legs. Nothing to assert into existence —
    // prove the absence after other activity.
    expect(getResolutions()).toHaveLength(0);
    expect(getLedgerState().resolvedEventInstances).toEqual([]);
  });
});

describe('the trigger (§4.11 — the seam D-s left to the challenge track)', () => {
  /** Genesis at a fixed instant; `nowIso` moves, never `simDay`. */
  function seedAt(genesis: string) {
    vi.setSystemTime(new Date(genesis));
    grantPlayMoney(10_000, 'USD', 'b2c');
  }
  const plus = (genesis: string, days: number) =>
    new Date(Date.parse(genesis) + days * 86_400_000).toISOString();

  const GENESIS = '2026-08-01T09:00:00Z';

  beforeEach(() => {
    vi.useFakeTimers();
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should hold the event back until the ruled personal week', () => {
    seedAt(GENESIS);
    const state = getLedgerState();
    // Weeks 1 and 2 — nothing is due, and nothing announces that anything will be.
    expect(dueSimulatedEvent(state, plus(GENESIS, 0))).toBeNull();
    expect(dueSimulatedEvent(state, plus(GENESIS, 13))).toBeNull();
    expect(dueSimulatedEvent(state, plus(GENESIS, 14))).not.toBeNull();
  });

  it('should size the event from the catalogue, with a stable instance id', () => {
    seedAt(GENESIS);
    const due = dueSimulatedEvent(getLedgerState(), plus(GENESIS, 20))!;
    expect(due.amount).toBe(simulatedEventAmount('b2c', R1_EVENT));
    // Stability is load-bearing: a fresh id per render would defeat the
    // engine's per-instance idempotency and let one event resolve twice.
    expect(due.eventInstanceId).toBe(
      dueSimulatedEvent(getLedgerState(), plus(GENESIS, 27))!.eventInstanceId
    );
  });

  it('should keep offering the event forever once postponed — no nag, no expiry', () => {
    seedAt(GENESIS);
    // RD-9 postponed-forever: postponement is the ABSENCE of a resolution, so
    // the same event is simply still there, unchanged, weeks later.
    const week3 = dueSimulatedEvent(getLedgerState(), plus(GENESIS, 14))!;
    const muchLater = dueSimulatedEvent(getLedgerState(), plus(GENESIS, 200))!;
    expect(muchLater.eventInstanceId).toBe(week3.eventInstanceId);
    expect(muchLater.amount).toBe(week3.amount);
  });

  it('should stop offering the event once it is resolved', () => {
    seedAt(GENESIS);
    const due = dueSimulatedEvent(getLedgerState(), plus(GENESIS, 14))!;
    resolveSimulatedExpense({
      eventInstanceId: due.eventInstanceId,
      eventType: due.definition.type,
      amount: due.amount,
      via: { path: 'available' },
    });
    expect(dueSimulatedEvent(getLedgerState(), plus(GENESIS, 21))).toBeNull();
  });

  it('should NOT be reachable by the time machine (D-s §5 dual-clock independence)', () => {
    seedAt(GENESIS);
    const goalId = createGoal({
      name: 'Reserve',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 2000,
    });
    expect(goalId).toBeTruthy();
    // Advance SIMULATED time far past week 3 without moving the wall clock.
    advanceTime(365, [], 'machine');
    expect(getLedgerState().simDay).toBeGreaterThanOrEqual(365);
    // Life did not happen: the event is still scheduled by the real calendar.
    expect(dueSimulatedEvent(getLedgerState(), plus(GENESIS, 1))).toBeNull();
  });

  it('should show what each option really does, and never invent a goal pace', () => {
    seedAt(GENESIS);
    const goalId = createGoal({
      name: 'Reserve',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    })!;
    const due = dueSimulatedEvent(getLedgerState(), plus(GENESIS, 14))!;
    const state = getLedgerState();
    const options = affordableExpenseOptions(state, due.amount);
    const impacts = expenseImpacts(state, due.amount, options);

    const cover = impacts.find((i) => i.option === 'coverFromAvailable')!;
    expect(cover.availableAfter).toBe(cover.availableBefore - due.amount);
    expect(cover.goalCashAfter).toBeUndefined();

    const reserve = impacts.find((i) => i.option === 'useReserve' && i.goalId === goalId)!;
    // The money passes THROUGH Available on this path — unchanged, by design.
    expect(reserve.availableAfter).toBe(reserve.availableBefore);
    expect(reserve.goalCashAfter).toBe(reserve.goalCashBefore! - due.amount);

    // Board §6a "absent over false": no pace field exists to be wrong.
    expect(Object.keys(cover)).not.toContain('goalPace');
  });
});
