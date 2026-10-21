import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appliedEvents, reconcile, refusedEvents } from '@diboas/banking';
import {
  createGoal,
  enterStrategy,
  getLedgerState,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { appendAll, base } from '@/lib/ledger/core';
import { generateId } from '@/lib/ids';
import { buildMonthReport } from '@/lib/monthReport';
import { createRule } from '@/lib/ledgerClient';
import { appliedWeeks, deriveStandingProposal } from '@/lib/weeklyCycle';
import { positionValueSeries } from '@/lib/positionSeries';
import { decomposePracticeValue } from '@/lib/practiceSeries';
import { selectGoalDetailView } from '@/view/home';
import {
  goalShowsCoinGeckoPrices,
  goalUsesCoinGeckoPrices,
  ledgerShowsCoinGeckoPrices,
} from '@/view/marketDataAttribution';
import { Logger } from '@/lib/monitoring/Logger';
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
expectedLogs({
  strict: true,
  warn: ['ledger refused an event'],
  requiredIn: /P8a · case 3 — every reader agrees with the applied state > (?!OBSERVABILITY)/,
});

/**
 * P8a acceptance (a) — the register `5.485` case 3. Two entries of 80 against a
 * goal holding 100: the projection applies the first and REFUSES the second.
 * The P0 review measured the ledger at cash 20 / invested 80 while the chart's
 * last value read 160, because every reader walked the raw log. Now every
 * reader agrees with the APPLIED state, each in its own metric (total value and
 * invested value need not be the same number).
 */

const GENESIS = '2026-08-01T09:00:00Z';

describe('P8a · case 3 — every reader agrees with the applied state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(GENESIS));
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  function case3() {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 1000,
      horizonMonths: 12,
      fundAmount: 100,
    })!;
    const p1 = enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: 80,
      networkFeeLocal: 0,
    });
    const p2 = enterStrategy({
      goalId,
      strategyId: 'safeHarbor',
      totalFromCash: 80,
      networkFeeLocal: 0,
    });
    return { goalId, p1, p2, state: getLedgerState() };
  }

  it('should keep the refused entry in the raw log and mark it REFUSED', () => {
    const { state } = case3();
    const refused = refusedEvents(state);
    expect(refused.map((r) => [r.event.type, r.reason])).toEqual([
      ['StrategyEntered', 'insufficient-goal-cash'],
    ]);
    expect(state.events.length - appliedEvents(state).length).toBe(1);
  });

  it('LEDGER: goal cash 20, invested 80, one open position, reconcile 0.00', () => {
    const { goalId, p1, state } = case3();
    const goal = state.goals.find((g) => g.goalId === goalId)!;
    expect([goal.cash, goal.invested]).toEqual(['20.00', '80.00']);
    expect(state.positions.filter((p) => p.open).map((p) => p.positionId)).toEqual([p1]);
    expect(reconcile(state)).toBe('0.00');
  });

  it('CHART: the practice value ends at the applied total, not 160 invested', () => {
    const { state } = case3();
    const d = decomposePracticeValue(state);
    expect(d.end, 'the chart counted the refused entry').toBeCloseTo(80, 2);
    expect(d.identityHolds).toBe(true);
  });

  it('POSITION SERIES: the refused position has no series; the applied one starts at 80', () => {
    const { p1, p2, state } = case3();
    expect(positionValueSeries(state, p2)).toEqual([]);
    expect(positionValueSeries(state, p1)[0]).toBe(80);
  });

  /* No case-3 MONTH REPORT leg: a v2 entry adds nothing to the report's rows, so it would
     pass with the fix reverted (second P8a audit). The duplicate-credit case below is the
     month report's oracle. */

  it('HOME / GOAL DETAIL: the goal is worth 100 (20 cash + 80 invested)', () => {
    const { goalId, state } = case3();
    expect(selectGoalDetailView(state, goalId).currentValue).toBeCloseTo(100, 2);
  });

  /** The goal detail's "you put in" walks the log; the raw walk counted a refused funding. */
  it('GOAL DETAIL: contributions count the applied funding, not a refused stale-tab one', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 1000,
      horizonMonths: 12,
      fundAmount: 100,
    })!;
    appendAll([{ ...base(generateId()), type: 'GoalFunded', goalId, amount: '999999.00' }]);
    const state = getLedgerState();
    expect(refusedEvents(state).map((r) => r.reason)).toEqual(['insufficient-available']);
    // Oracle control: the raw log DOES carry both fundings.
    const raw = state.events
      .filter((e) => e.type === 'GoalFunded')
      .reduce((sum, e) => sum + Number((e as { amount: string }).amount), 0);
    expect(raw).toBe(1_000_099);
    expect(selectGoalDetailView(state, goalId).contributionsTotal).toBe('100.00');
  });

  /** Attribution: a refused accrual must not credit CoinGecko for a goal's outcome. */
  it('ATTRIBUTION: a refused accrual on the refused position credits no price source', () => {
    const { goalId, p2 } = case3();
    appendAll([
      {
        ...base(generateId()),
        type: 'AccrualApplied',
        positionId: p2,
        fromSimDay: 0,
        toSimDay: 30,
        earnings: '1.00',
        apySource: 'fixture',
        legsReplayed: [
          { weightPercent: 100, kind: 'market', source: 'coingecko', multiple: '1.01' },
        ],
      },
    ]);
    const state = getLedgerState();
    expect(refusedEvents(state).map((r) => [r.event.type, r.reason])).toEqual([
      ['StrategyEntered', 'insufficient-goal-cash'],
      ['AccrualApplied', 'unknown-or-closed-position'],
    ]);
    // Oracle control: walking the raw log credits CoinGecko.
    expect(goalUsesCoinGeckoPrices(state.events, goalId)).toBe(true);
    // The screens' entry points (Goals list, Goal detail, Time Machine) do not.
    expect(goalShowsCoinGeckoPrices(state, goalId)).toBe(false);
    expect(ledgerShowsCoinGeckoPrices(state)).toBe(false);
  });

  /** R-14: a refusal is not shown (DR-25), so it is logged — id, type, reason; no payload. */
  it('OBSERVABILITY: each newly refused event is logged once, applied ones never', () => {
    const warn = vi.spyOn(Logger, 'warn').mockImplementation(() => {});
    try {
      const { p2 } = case3();
      const refusals = warn.mock.calls.filter(([message]) => message === 'ledger refused an event');
      expect(refusals).toHaveLength(1);
      const context = refusals[0]![1] as Record<string, unknown>;
      expect(Object.keys(context).sort()).toEqual(['eventId', 'reason', 'type']);
      expect([context.type, context.reason]).toEqual(['StrategyEntered', 'insufficient-goal-cash']);
      const entry = getLedgerState().events.find(
        (e) => e.type === 'StrategyEntered' && e.positionId === p2
      )!;
      expect(context.eventId).toBe(entry.eventId);
    } finally {
      warn.mockRestore();
    }
  });

  /**
   * A refused event that DOES move the play balance on the raw log: a duplicate
   * weekly credit, as a second tab would write it. The raw walk counted the
   * inflow twice, so the month report's rows could no longer sum to the change.
   */
  it('MONTH REPORT: a refused duplicate credit is not an inflow, so the report still explains every dollar', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const credit = { type: 'WeeklyCreditGranted' as const, week: 1, amount: '25.00' };
    appendAll([{ ...base(generateId()), ...credit }]);
    appendAll([{ ...base(generateId()), ...credit }]); // the second tab's duplicate
    const state = getLedgerState();
    expect(refusedEvents(state).map((r) => r.reason)).toEqual(['duplicate']);
    const report = buildMonthReport(state, '2026-08-01T00:00:00Z', '2026-09-01T00:00:00Z')!;
    expect(report.closing - report.opening).toBeCloseTo(10_025, 2); // the grant + ONE credit, both in the window
    expect(report.explained, 'the duplicate was counted as an inflow').toBe(true);
  });

  /** The weekly flow: a refused duplicate credit must not inflate the standing proposal. */
  it('WEEKLY: the standing proposal sums ONE week-1 credit, not the refused duplicate', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 1000,
      horizonMonths: 12,
      fundAmount: 0,
    })!;
    createRule([{ goalId, percent: 100 }]);
    const credit = { type: 'WeeklyCreditGranted' as const, week: 1, amount: '25.00' };
    appendAll([{ ...base(generateId()), ...credit }]);
    appendAll([{ ...base(generateId()), ...credit }]); // the second tab's duplicate
    const proposal = deriveStandingProposal(getLedgerState(), [], 'pr-1')!;
    const proposed =
      proposal.lines.reduce((sum, l) => sum + l.amount, 0) + proposal.remainderToAvailable;
    expect(proposed, 'the refused duplicate was proposed').toBe(25);
  });

  /**
   * ⚑ CORRELATION — recorded, NOT decided (register `5.524`, FOUNDER). A rule
   * application is a zero-value `RuleApplied` marker plus `GoalFunded` legs sharing
   * its correlationId. A single tab re-validates Available before appending, so its
   * legs apply; a SECOND tab working from a stale balance can append a leg the
   * projection refuses. The marker then stays APPLIED (contract: it drives weekly
   * idempotency) while its money leg is REFUSED — the week reads settled, and the
   * credit stays in Available. This pins TODAY's behaviour (Option A: never moves
   * money that is not there, never re-proposes a week twice) so a change is a
   * visible, decided change — not a silent one.
   */
  it('CORRELATION: a refused leg leaves the marker APPLIED, the week settled and the money in Available', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 1000,
      horizonMonths: 12,
      fundAmount: 0,
    })!;
    const ruleId = createRule([{ goalId, percent: 100 }])!;
    appendAll([{ ...base(generateId()), type: 'WeeklyCreditGranted', week: 1, amount: '25.00' }]);
    const before = getLedgerState();
    const correlationId = generateId();
    appendAll([
      {
        ...base(correlationId),
        type: 'RuleApplied',
        ruleId,
        ruleVersion: 0,
        proposalId: 'pr-x',
        weekSet: [1],
      },
      { ...base(correlationId), type: 'GoalFunded', goalId, amount: '999999.00' }, // stale-tab leg
    ]);
    const state = getLedgerState();
    expect(refusedEvents(state).map((r) => [r.event.type, r.reason])).toEqual([
      ['GoalFunded', 'insufficient-available'],
    ]);
    expect(appliedWeeks(state)).toEqual([1]);
    expect(deriveStandingProposal(state, [], 'pr-2')).toBeNull();
    expect(state.buckets.working).toBe(before.buckets.working);
    expect(state.goals.find((g) => g.goalId === goalId)!.cash).toBe('0.00');
    expect(reconcile(state)).toBe('0.00');
  });
});
