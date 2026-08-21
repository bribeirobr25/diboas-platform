import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reconcile } from '@diboas/banking';
import {
  advanceTime,
  createGoal,
  createRule,
  collectWeeklyCredits,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
  resolveSimulatedExpense,
  transferGoalCash,
} from '@/lib/ledgerClient';
import { buildMonthReport, currentMonthWindow, playBalance } from '@/lib/monthReport';

/**
 * G12 (§4.12). The screen's promise is "every dollar is explained", so the one
 * property that matters is that the rows SUM to the change — not approximately,
 * and not only on the happy path.
 */

const GENESIS = '2026-08-03T09:00:00Z';
const WINDOW = { fromIso: '2026-08-01T00:00:00Z', toIso: '2026-09-01T00:00:00Z' };

describe('the month-report aggregator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(GENESIS));
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should return nothing before the ledger exists (never an empty-looking report)', () => {
    expect(buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)).toBeNull();
  });

  it('should sum its rows to EXACTLY the change in play balance', () => {
    // A ledger with every kind of movement in it: a grant, credits, a goal
    // funded (internal), a strategy entered (network fee), accrual, and a
    // simulated expense.
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Safety net',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    })!;
    enterStrategy({
      goalId,
      strategyId: 'stableGrowth',
      totalFromCash: 1000,
      networkFeeLocal: 0.1,
    });
    vi.setSystemTime(new Date('2026-08-20T09:00:00Z'));
    collectWeeklyCredits();
    advanceTime(30, [], 'machine');
    resolveSimulatedExpense({
      eventInstanceId: 'e1',
      eventType: 'unexpected_expense',
      amount: 500,
      via: { path: 'available' },
    });

    const state = getLedgerState();
    const report = buildMonthReport(state, WINDOW.fromIso, WINDOW.toIso)!;
    const summed = report.sources.reduce((s, r) => s + r.amount, 0);

    // The identity the footer asserts, held to the cent.
    expect(summed.toFixed(2)).toBe(report.totalChange.toFixed(2));
    expect((report.opening + summed).toFixed(2)).toBe(report.closing.toFixed(2));
    // And the ledger itself still balances, so the report describes a sane log.
    expect(reconcile(state)).toBe('0.00');
  });

  it('should NOT count funding a goal as a source — it moves nothing', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const before = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    });
    const after = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;

    // working → goal.cash: both live inside the play balance, so the total is
    // untouched and no row may claim otherwise.
    expect(after.closing).toBe(before.closing);
    expect(after.totalChange).toBe(before.totalChange);
    expect(after.sources.map((s) => s.key)).toEqual(before.sources.map((s) => s.key));
    // It is still reported — just not as a change in the total.
    expect(after.movedIntoGoals).toBe(3000);
  });

  it('should carry a NEGATIVE market row honestly rather than hide it', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Growth',
      icon: 'sprout',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 2000,
    })!;
    // fullThrottle is 85% growth: four MARKET legs that replay real prices,
    // so a falling series genuinely loses money (the §4.8 two-rule model).
    enterStrategy({ goalId, strategyId: 'fullThrottle', totalFromCash: 2000, networkFeeLocal: 0 });
    const falling = (protocolId: 'skySsr' | 'sanctumInf' | 'jupiterJlp' | 'jito') => ({
      protocolId,
      points: Array.from({ length: 40 }, (_, i) => ({
        date: `2026-08-${String(i + 1).padStart(2, '0')}`,
        priceUsd: 200 - i * 3,
      })),
      stamp: { source: 'fixture' as const, asOf: '2026-08-01' },
    });
    advanceTime(30, [], 'machine', [
      falling('skySsr'),
      falling('sanctumInf'),
      falling('jupiterJlp'),
      falling('jito'),
    ]);
    const report = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    const market = report.sources.find((s) => s.key === 'marketChange');
    // The row must EXIST and be negative — an absent row would mean the loss
    // was quietly dropped, which is the failure this test is for.
    expect(market).toBeDefined();
    expect(market!.amount).toBeLessThan(0);
    // And the identity still holds with a negative term in the sum.
    const summed = report.sources.reduce((s, r) => s + r.amount, 0);
    expect(summed.toFixed(2)).toBe(report.totalChange.toFixed(2));
    expect(report.totalChange).toBeLessThan(10_000);
    expect(reconcile(getLedgerState())).toBe('0.00');
  });

  it('should open at a PREFIX projection, not at zero, for a later window', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const september = { fromIso: '2026-09-01T00:00:00Z', toIso: '2026-10-01T00:00:00Z' };
    const report = buildMonthReport(getLedgerState(), september.fromIso, september.toIso)!;
    // August's grant is BEFORE the window, so it is the opening balance and
    // must not appear as September income.
    expect(report.opening).toBe(10_000);
    expect(report.sources.find((s) => s.key === 'grant')).toBeUndefined();
    expect(report.totalChange).toBe(0);
  });

  it('should suppress the percentage when the window opens at zero', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const report = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    // The genesis month opens at nothing; "+∞%" or a made-up 0% would both lie.
    expect(report.opening).toBe(0);
    expect(report.totalChangePercent).toBe(0);
  });

  it('should count goals and cycles, and expose no streak to render', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 0,
    })!;
    createRule([{ goalId, percent: 60 }]);
    const report = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    expect(report.goalsCreated).toBe(1);
    expect(report.cyclesCompleted).toBe(0);
    // WSG G7 is veto-class: nothing consecutive-chain shaped may exist to bind.
    expect(Object.keys(report)).not.toContain('streak');
    expect(Object.keys(report)).not.toContain('daysInARow');
  });

  it('should step the sparkline only where money actually moved', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    });
    const report = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    // Opening + the grant. Funding the goal moved nothing, so it adds no step:
    // a flat segment would imply a moment that did not happen.
    expect(report.series).toEqual([0, 10_000]);
  });

  it('should window on the current calendar month', () => {
    vi.setSystemTime(new Date('2026-08-21T14:00:00Z'));
    const w = currentMonthWindow(new Date().toISOString());
    expect(new Date(w.fromIso).getDate()).toBe(1);
    expect(new Date(w.fromIso).getMonth()).toBe(new Date(w.toIso).getMonth());
  });

  it('should agree with reconcile about what the play balance is', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    });
    const state = getLedgerState();
    // `playBalance` must be the same sum reconcile calls `held`, or the footer
    // and the invariant would describe different money.
    expect(reconcile(state)).toBe('0.00');
    expect(playBalance(state).toFixed(2)).toBe('10000.00');
  });

  it('should report the NET moved into goals, not every funding leg', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const g1 = createGoal({
      name: 'A',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 1000,
    })!;
    const g2 = createGoal({
      name: 'B',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 0,
    })!;
    // G4's "move to another goal" emits GoalCashReleased + GoalFunded together.
    // Counting only the funding leg claimed $2,000 moved into goals when
    // $1,000 went in and then travelled sideways.
    transferGoalCash(g1, g2);
    const report = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    const inGoals = getLedgerState().goals.reduce((s, g) => s + Number(g.cash), 0);
    expect(report.movedIntoGoals).toBe(1000);
    expect(report.movedIntoGoals).toBe(inGoals);
  });

  it('should NOT claim every dollar is explained when the rows do not sum', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const clean = buildMonthReport(getLedgerState(), WINDOW.fromIso, WINDOW.toIso)!;
    expect(clean.explained).toBe(true);

    // A log the PROJECTION skips but the row-walk counts: a second credit for
    // the same week (the engine's per-week idempotency guard). Reachable
    // because the ledger is user-editable localStorage.
    const state = getLedgerState();
    const credit = {
      ...state.events[0],
      eventId: 'dup-1',
      type: 'WeeklyCreditGranted' as const,
      week: 1,
      amount: '1000.00',
    };
    const doubled = {
      ...state,
      events: [...state.events, credit, { ...credit, eventId: 'dup-2' }],
    };
    const report = buildMonthReport(doubled, WINDOW.fromIso, WINDOW.toIso)!;
    const summed = report.sources.reduce((s, r) => s + r.amount, 0);
    // The rows over-count, the balance does not — so the screen must not claim
    // to explain every dollar. Honest degradation beats a confident lie.
    expect(summed).not.toBe(report.totalChange);
    expect(report.explained).toBe(false);
  });
});
