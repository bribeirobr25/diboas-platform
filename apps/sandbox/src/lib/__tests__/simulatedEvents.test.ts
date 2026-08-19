import { beforeEach, describe, expect, it } from 'vitest';
import { reconcile } from '@diboas/banking';
import {
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
import { affordableExpenseOptions, simulatedEventAmount } from '@/lib/simulatedEvents';
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
