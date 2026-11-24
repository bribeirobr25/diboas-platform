/**
 * S1a PR-2 · each decision, called directly with a recording `ctx` (plan P12 §4.4, D3, D4, D7).
 *
 * Pins what the characterization suite cannot see once the state cache is warm: the ORDER of
 * `readState`, `newId` and `clock` calls, on emitting AND refusing paths, which must mirror today's
 * command (`stamp()` draws the id, then reads state, then the clock, exactly as `base()` did). The
 * state, the intent and the environment each decision gets are deep-frozen, so a decision that
 * mutates any of them throws here (sabotage (s); the lint cannot see a derived object).
 */
import { project, type LedgerEvent, type LedgerState } from '@diboas/banking';
import { describe, expect, it } from 'vitest';
import { decideCollectWeeklyCredits, decideGrantComparisonCredit } from '../credits';
import {
  decideAccomplishGoal,
  decideCreateGoal,
  decideEnterStrategy,
  decideExitPosition,
  decideGrantPlayMoney,
  decidePauseGoal,
  decideRaiseGoalTarget,
  decideResumeGoal,
  decideSetRecurring,
  decideStopGoalStrategies,
  decideTransferGoalCash,
} from '../journey';
import {
  decideApplyRuleProposal,
  decideCreateRule,
  decideDeclineProposal,
  decideUpdateRule,
  type ApplyEnv,
  type ApplyIntent,
} from '../rules';
import { decideResolveSimulatedExpense, type ExpenseEnv, type ExpenseIntent } from '../simEvents';
import { NOTHING, type DecisionContext } from '../types';

let n = 0;
const ev = (type: string, body: object): LedgerEvent =>
  ({
    eventId: `u-${++n}`,
    simDay: 0,
    recordedAt: '2026-07-24T00:00:00.000Z',
    correlationId: `uc-${n}`,
    type,
    ...body,
  }) as LedgerEvent;
const HISTORY: LedgerEvent[] = [
  ev('PlayMoneyGranted', { amount: '10000.00', currency: 'USD', mode: 'b2c' }),
  ev('GoalCreated', {
    goalId: 'g1',
    name: 'A',
    icon: 'x',
    targetAmount: '3000.00',
    horizonMonths: 12,
  }),
  ev('GoalFunded', { goalId: 'g1', amount: '1000.00' }),
  ev('GoalCreated', {
    goalId: 'g2',
    name: 'B',
    icon: 'x',
    targetAmount: '500.00',
    horizonMonths: 12,
  }),
  ev('StrategyEntered', {
    goalId: 'g1',
    positionId: 'p1',
    strategyId: 'safeHarbor',
    amount: '100.00',
    schemaVersion: 2,
    modeledNetworkFee: '0.50',
  }),
  ev('StrategyEntered', {
    goalId: 'g1',
    positionId: 'p2',
    strategyId: 'safeHarbor',
    amount: '50.00',
    schemaVersion: 2,
    modeledNetworkFee: '0.50',
  }),
  ev('RuleCreated', {
    ruleId: 'r1',
    split: [
      { goalId: 'g1', percent: 60 },
      { goalId: 'g2', percent: 40 },
    ],
  }),
];

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}
const frozen = <T>(value: T): T => deepFreeze(structuredClone(value));

function recordingContext(history: LedgerEvent[]) {
  const state: LedgerState = frozen(project(history));
  const calls: string[] = [];
  let id = 0;
  const ctx: DecisionContext = {
    readState: () => (calls.push('state'), state),
    newId: () => (calls.push('id'), `id-${++id}`),
    clock: () => (calls.push('clock'), '2026-11-24T00:00:00.000Z'),
  };
  return { ctx, calls };
}
const ready = () => recordingContext(HISTORY);
const fresh = () => recordingContext([]);
/** One stamp: the id, then state, then the clock (D7). */
const STAMP = ['id', 'state', 'clock'];

const applyIntent = (over: Partial<ApplyIntent> = {}): ApplyIntent =>
  frozen({ ruleId: 'r1', ruleVersion: 0, proposalId: 'pr1', weekSet: [1], ...over });
const applyEnv = (over: Partial<ApplyEnv> = {}): ApplyEnv =>
  frozen({
    lines: [
      { goalId: 'g1', amount: 60 },
      { goalId: 'g2', amount: 40 },
    ],
    repairNeeded: false,
    remainderToAvailable: 0,
    ...over,
  });
const expense = (via: ExpenseIntent['via'], amount = 50): [ExpenseIntent, ExpenseEnv] => [
  frozen({ via }),
  frozen({ eventInstanceId: 'e', eventType: 'x', amount }),
];

type Case = [
  string,
  () => ReturnType<typeof ready>,
  (c: DecisionContext) => { outcome: { kind: string } },
  string,
  string[],
];

describe("S1a PR-2 · each decision reads, draws and stamps in today's order", () => {
  it.each<Case>([
    [
      'grant',
      fresh,
      (c) =>
        decideGrantPlayMoney(frozen({ currency: 'USD' }), frozen({ amount: 1, mode: 'b2c' }), c),
      'emitted',
      ['state', 'id', ...STAMP],
    ],
    [
      'grant, already initialized',
      ready,
      (c) =>
        decideGrantPlayMoney(frozen({ currency: 'USD' }), frozen({ amount: 1, mode: 'b2c' }), c),
      'noop',
      ['state'],
    ],
    [
      'pause',
      ready,
      (c) => decidePauseGoal(frozen({ goalId: 'g1' }), NOTHING, c),
      'emitted',
      ['state', 'id', ...STAMP],
    ],
    [
      'pause, unknown goal',
      ready,
      (c) => decidePauseGoal(frozen({ goalId: 'nope' }), NOTHING, c),
      'noop',
      ['state'],
    ],
    [
      'accomplish',
      ready,
      (c) =>
        decideAccomplishGoal(frozen({ goalId: 'g1', disposition: 'kept-working' }), NOTHING, c),
      'emitted',
      ['state', 'id', ...STAMP],
    ],
    [
      'transfer with cash',
      ready,
      (c) => decideTransferGoalCash(frozen({ fromGoalId: 'g1', toGoalId: 'g2' }), NOTHING, c),
      'emitted',
      ['state', 'id', ...STAMP, ...STAMP, ...STAMP],
    ],
    [
      'transfer to itself',
      ready,
      (c) => decideTransferGoalCash(frozen({ fromGoalId: 'g1', toGoalId: 'g1' }), NOTHING, c),
      'noop',
      ['state'],
    ],
    [
      'raise target',
      ready,
      (c) => decideRaiseGoalTarget(frozen({ goalId: 'g1', newTarget: '5000' }), NOTHING, c),
      'emitted',
      ['state', 'id', ...STAMP],
    ],
    [
      'raise target, unparseable',
      ready,
      (c) => decideRaiseGoalTarget(frozen({ goalId: 'g1', newTarget: 'abc' }), NOTHING, c),
      'noop',
      ['state'],
    ],
    [
      'create goal, funded',
      ready,
      (c) =>
        decideCreateGoal(
          frozen({ name: 'C', icon: 'x', targetAmount: 1, horizonMonths: 1, fundAmount: 5 }),
          NOTHING,
          c
        ),
      'emitted',
      ['id', 'id', ...STAMP, 'state', ...STAMP],
    ],
    [
      'create goal, zero fund (no read)',
      ready,
      (c) =>
        decideCreateGoal(
          frozen({ name: 'C', icon: 'x', targetAmount: 1, horizonMonths: 1, fundAmount: 0 }),
          NOTHING,
          c
        ),
      'emitted',
      ['id', 'id', ...STAMP],
    ],
    [
      'enter',
      ready,
      (c) =>
        decideEnterStrategy(
          frozen({ goalId: 'g1', strategyId: 'safeHarbor', totalFromCash: 10 }),
          frozen({ networkFeeLocal: 0 }),
          c
        ),
      'emitted',
      ['id', 'id', ...STAMP],
    ],
    [
      'set recurring',
      ready,
      (c) =>
        decideSetRecurring(
          frozen({ goalId: 'g1', positionId: 'p1', monthlyAmount: 10 }),
          NOTHING,
          c
        ),
      'emitted',
      ['id', ...STAMP, 'state'],
    ],
    [
      'exit',
      ready,
      (c) => decideExitPosition(frozen({ positionId: 'p1' }), frozen({ networkFeeLocal: 0 }), c),
      'emitted',
      ['state', 'id', ...STAMP],
    ],
    [
      'exit, unknown position',
      ready,
      (c) => decideExitPosition(frozen({ positionId: 'nope' }), frozen({ networkFeeLocal: 0 }), c),
      'noop',
      ['state'],
    ],
    [
      'stop all',
      ready,
      (c) => decideStopGoalStrategies(frozen({ goalId: 'g1' }), { feeFor: () => 0.5 }, c),
      'emitted',
      ['state', 'id', ...STAMP, ...STAMP],
    ],
    [
      'stop all, nothing open',
      ready,
      (c) => decideStopGoalStrategies(frozen({ goalId: 'g2' }), { feeFor: () => 0.5 }, c),
      'noop',
      ['state'],
    ],
    [
      'create rule (after delete)',
      () =>
        recordingContext([...HISTORY, ev('RuleDeleted', { ruleId: 'r1', expectedRuleVersion: 0 })]),
      (c) => decideCreateRule(frozen({ split: [{ goalId: 'g1', percent: 10 }] }), NOTHING, c),
      'emitted',
      ['state', 'id', 'id', ...STAMP],
    ],
    [
      'create rule, one exists',
      ready,
      (c) => decideCreateRule(frozen({ split: [{ goalId: 'g1', percent: 10 }] }), NOTHING, c),
      'noop',
      ['state'],
    ],
    [
      'update rule',
      ready,
      (c) =>
        decideUpdateRule(
          frozen({ ruleId: 'r1', split: [{ goalId: 'g1', percent: 10 }], expectedRuleVersion: 0 }),
          NOTHING,
          c
        ),
      'emitted',
      ['id', ...STAMP],
    ],
    [
      'update rule, invalid split (no read)',
      ready,
      (c) =>
        decideUpdateRule(frozen({ ruleId: 'r1', split: [], expectedRuleVersion: 0 }), NOTHING, c),
      'noop',
      [],
    ],
    [
      'apply',
      ready,
      (c) => decideApplyRuleProposal(applyIntent(), applyEnv(), c),
      'emitted',
      ['state', 'id', ...STAMP, ...STAMP, ...STAMP],
    ],
    [
      'apply, repair needed (read first, as today)',
      ready,
      (c) => decideApplyRuleProposal(applyIntent(), applyEnv({ repairNeeded: true }), c),
      'noop',
      ['state'],
    ],
    [
      'decline (touches nothing)',
      ready,
      (c) => decideDeclineProposal(frozen({ weekSet: [3] }), NOTHING, c),
      'emitted',
      [],
    ],
    [
      'collect two weeks',
      ready,
      (c) => decideCollectWeeklyCredits(NOTHING, frozen({ nowIso: '2026-08-08T00:00:00.000Z' }), c),
      'emitted',
      ['state', 'id', ...STAMP, ...STAMP],
    ],
    [
      'collect, uninitialized',
      fresh,
      (c) => decideCollectWeeklyCredits(NOTHING, frozen({ nowIso: '2026-08-08T00:00:00.000Z' }), c),
      'noop',
      ['state'],
    ],
    [
      'comparison credit',
      ready,
      (c) => decideGrantComparisonCredit(NOTHING, NOTHING, c),
      'emitted',
      ['state', 'id', ...STAMP],
    ],
    [
      'resolve from the reserve',
      ready,
      (c) => decideResolveSimulatedExpense(...expense({ path: 'reserve', goalId: 'g1' }), c),
      'emitted',
      ['state', 'id', ...STAMP, ...STAMP],
    ],
    [
      'resolve, unaffordable after the id (as today)',
      ready,
      (c) => decideResolveSimulatedExpense(...expense({ path: 'reserve', goalId: 'g2' }), c),
      'noop',
      ['state', 'id'],
    ],
    [
      'resolve, not finite (before the id)',
      ready,
      (c) => decideResolveSimulatedExpense(...expense({ path: 'available' }, Number.NaN), c),
      'noop',
      ['state'],
    ],
  ])(
    'should call ctx in today\'s order when it decides "%s"',
    (_name, make, decide, kind, order) => {
      const { ctx, calls } = make();
      expect(decide(ctx).outcome.kind).toBe(kind);
      expect(calls).toEqual(order);
    }
  );

  it('should resume a paused goal in the same order when the goal is paused', () => {
    const { ctx, calls } = recordingContext([
      ...HISTORY,
      ev('GoalPaused', { goalId: 'g1', expectedVersion: 0 }),
    ]);
    expect(decideResumeGoal(frozen({ goalId: 'g1' }), NOTHING, ctx).outcome.kind).toBe('emitted');
    expect(calls).toEqual(['state', 'id', ...STAMP]);
  });

  it('should decline as an effect only when a proposal is declined (it reads no state today)', () => {
    const { ctx } = ready();
    const weekSet = [3];
    const d = decideDeclineProposal({ weekSet }, NOTHING, ctx);
    expect(d).toEqual({
      result: undefined,
      outcome: { kind: 'emitted' },
      append: null,
      effects: [{ type: 'ProposalDeclined', weekSet: [3] }],
    });
    // The caller's own array, as today's `recordDecline(proposal.weekSet)` received it.
    expect((d.effects[0] as { weekSet: number[] }).weekSet).toBe(weekSet);
  });

  it('should carry the correlation id on the resolution effect when an expense is resolved (D6)', () => {
    const { ctx } = ready();
    const d = decideResolveSimulatedExpense(...expense({ path: 'available' }), ctx);
    expect(d.effects).toEqual([
      {
        type: 'SimulatedEventResolved',
        eventInstanceId: 'e',
        eventType: 'x',
        choice: 'coverFromAvailable',
        correlationId: 'id-1',
      },
    ]);
    expect(d.append?.every((e) => e.correlationId === 'id-1')).toBe(true);
  });

  it('should call feeFor unbound when stopping a goal, as today', () => {
    const { ctx } = ready();
    const seen: unknown[] = [];
    const env = {
      feeFor(this: unknown) {
        seen.push(this);
        return 0;
      },
    };
    decideStopGoalStrategies(frozen({ goalId: 'g1' }), env, ctx);
    expect(seen).toEqual([undefined, undefined]);
  });
});

describe('S1a PR-2 · outcomes agree with the result unions (D4) and the apply notes', () => {
  const appliedWeek1 = () =>
    recordingContext([
      ...HISTORY,
      ev('RuleApplied', { ruleId: 'r1', ruleVersion: 0, proposalId: 'old', weekSet: [1] }),
    ]);
  it.each([
    ['repairNeeded', ready, applyIntent(), applyEnv({ repairNeeded: true })],
    ['staleRuleVersion', ready, applyIntent({ ruleVersion: 9 }), applyEnv()],
    ['alreadyApplied', appliedWeek1, applyIntent(), applyEnv()],
    [
      'destinationChanged',
      ready,
      applyIntent({ adjustedLines: [{ goalId: 'zz', amount: 1 }] }),
      applyEnv(),
    ],
    [
      'insufficientAvailable',
      ready,
      applyIntent(),
      applyEnv({ lines: [{ goalId: 'g1', amount: 99999 }] }),
    ],
  ] as const)(
    'should give outcome.reason = result.reason when apply refuses with %s',
    (reason, make, intent, env) => {
      const d = decideApplyRuleProposal(intent, env, make().ctx);
      expect(d.result).toEqual({ ok: false, reason });
      expect(d.outcome).toEqual({ kind: 'noop', reason });
    }
  );

  it.each([
    [
      'alreadyResolved',
      () =>
        recordingContext([
          ...HISTORY,
          ev('SimulatedExpensePaid', { eventInstanceId: 'e', amount: '1.00', source: 'system' }),
        ]),
      expense({ path: 'available' }),
    ],
    ['notAffordable', ready, expense({ path: 'available' }, -1)],
  ] as const)(
    'should give outcome.reason = result.reason when an expense is refused with %s',
    (reason, make, [intent, env]) => {
      const d = decideResolveSimulatedExpense(intent, env, make().ctx);
      expect(d.result).toEqual({ ok: false, reason });
      expect(d.outcome).toEqual({ kind: 'noop', reason });
    }
  );

  it.each([
    ['every line funded: no note', applyEnv(), undefined, undefined],
    [
      'a zero line: linesDropped',
      applyEnv(),
      [
        { goalId: 'g1', amount: 60 },
        { goalId: 'g2', amount: 0 },
      ],
      ['linesDropped'],
    ],
    [
      'a paused diversion: linesDropped',
      applyEnv({
        lines: [
          { goalId: 'g1', amount: 60 },
          { goalId: 'g2', amount: 40, pausedDiversion: true },
        ] as ApplyEnv['lines'],
      }),
      undefined,
      ['linesDropped'],
    ],
    [
      'every line zero: weeksAppliedWithoutFunding',
      applyEnv(),
      [
        { goalId: 'g1', amount: 0 },
        { goalId: 'g2', amount: 0 },
      ],
      ['weeksAppliedWithoutFunding'],
    ],
    ['no lines: weeksAppliedWithoutFunding', applyEnv(), [], ['weeksAppliedWithoutFunding']],
  ] as const)('should note %s when a proposal is applied', (_name, env, adjustedLines, notes) => {
    const d = decideApplyRuleProposal(
      applyIntent(
        adjustedLines
          ? { adjustedLines: adjustedLines as unknown as ApplyIntent['adjustedLines'] }
          : {}
      ),
      env,
      ready().ctx
    );
    expect(d.outcome).toEqual(notes ? { kind: 'emitted', notes } : { kind: 'emitted' });
  });
});
