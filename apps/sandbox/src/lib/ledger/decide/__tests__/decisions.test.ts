/**
 * S1a PR-2 · each decision, called directly with a recording `ctx` (plan P12 §4.4, D3, D7).
 *
 * Pins what the characterization suite cannot see once the state cache is warm: the ORDER of
 * `readState`, `newId` and `clock` calls, which must mirror today's command (`stamp()` draws the
 * id, then reads state, then the clock, exactly as `base()` did). The state each decision gets is
 * deep-frozen, so a decision that mutates it throws here.
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
} from '../rules';
import { decideResolveSimulatedExpense } from '../simEvents';
import type { DecisionContext } from '../types';

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

function recordingContext(state: LedgerState) {
  const calls: string[] = [];
  let id = 0;
  const ctx: DecisionContext = {
    readState: () => (calls.push('state'), state),
    newId: () => (calls.push('id'), `id-${++id}`),
    clock: () => (calls.push('clock'), '2026-11-24T00:00:00.000Z'),
  };
  return { ctx, calls };
}
const ready = () => recordingContext(deepFreeze(structuredClone(project(HISTORY))));
const fresh = () => recordingContext(deepFreeze(structuredClone(project([]))));
/** One stamp: the id, then state, then the clock (D7). */
const STAMP = ['id', 'state', 'clock'];
const proposal = {
  proposalId: 'pr1',
  ruleId: 'r1',
  ruleVersion: 0,
  weekSet: [1],
  lines: [
    { goalId: 'g1', amount: 60 },
    { goalId: 'g2', amount: 40 },
  ],
  remainderToAvailable: 0,
  status: 'proposed',
  repairNeeded: false,
} as const;

describe("S1a PR-2 · each decision reads, draws and stamps in today's order", () => {
  it.each([
    [
      'grant',
      fresh,
      (c: DecisionContext) => decideGrantPlayMoney({ amount: 1, currency: 'USD', mode: 'b2c' }, c),
      ['state', 'id', ...STAMP],
    ],
    ['pause', ready, (c: DecisionContext) => decidePauseGoal('g1', c), ['state', 'id', ...STAMP]],
    [
      'accomplish',
      ready,
      (c: DecisionContext) =>
        decideAccomplishGoal({ goalId: 'g1', disposition: 'kept-working' }, c),
      ['state', 'id', ...STAMP],
    ],
    [
      'transfer with cash',
      ready,
      (c: DecisionContext) => decideTransferGoalCash({ fromGoalId: 'g1', toGoalId: 'g2' }, c),
      ['state', 'id', ...STAMP, ...STAMP, ...STAMP],
    ],
    [
      'raise target',
      ready,
      (c: DecisionContext) => decideRaiseGoalTarget({ goalId: 'g1', newTarget: '5000' }, c),
      ['state', 'id', ...STAMP],
    ],
    [
      'create goal, funded',
      ready,
      (c: DecisionContext) =>
        decideCreateGoal(
          { name: 'C', icon: 'x', targetAmount: 1, horizonMonths: 1, fundAmount: 5 },
          c
        ),
      ['id', 'id', ...STAMP, 'state', ...STAMP],
    ],
    [
      'create goal, zero fund (no read)',
      ready,
      (c: DecisionContext) =>
        decideCreateGoal(
          { name: 'C', icon: 'x', targetAmount: 1, horizonMonths: 1, fundAmount: 0 },
          c
        ),
      ['id', 'id', ...STAMP],
    ],
    [
      'enter',
      ready,
      (c: DecisionContext) =>
        decideEnterStrategy(
          { goalId: 'g1', strategyId: 'safeHarbor', totalFromCash: 10, networkFeeLocal: 0 },
          c
        ),
      ['id', 'id', ...STAMP],
    ],
    [
      'set recurring',
      ready,
      (c: DecisionContext) =>
        decideSetRecurring({ goalId: 'g1', positionId: 'p1', monthlyAmount: 10 }, c),
      ['id', ...STAMP, 'state'],
    ],
    [
      'exit',
      ready,
      (c: DecisionContext) => decideExitPosition({ positionId: 'p1', networkFeeLocal: 0 }, c),
      ['state', 'id', ...STAMP],
    ],
    [
      'stop all',
      ready,
      (c: DecisionContext) => decideStopGoalStrategies({ goalId: 'g1' }, { feeFor: () => 0.5 }, c),
      ['state', 'id', ...STAMP, ...STAMP],
    ],
    [
      'create rule (after delete)',
      () =>
        recordingContext(
          deepFreeze(
            structuredClone(
              project([...HISTORY, ev('RuleDeleted', { ruleId: 'r1', expectedRuleVersion: 0 })])
            )
          )
        ),
      (c: DecisionContext) => decideCreateRule([{ goalId: 'g1', percent: 10 }], c),
      ['state', 'id', 'id', ...STAMP],
    ],
    [
      'update rule',
      ready,
      (c: DecisionContext) =>
        decideUpdateRule(
          { ruleId: 'r1', split: [{ goalId: 'g1', percent: 10 }], expectedRuleVersion: 0 },
          c
        ),
      ['id', ...STAMP],
    ],
    [
      'apply',
      ready,
      (c: DecisionContext) =>
        decideApplyRuleProposal(
          { proposal: { ...proposal, lines: [...proposal.lines], weekSet: [1] } },
          c
        ),
      ['state', 'id', ...STAMP, ...STAMP, ...STAMP],
    ],
    [
      'collect two weeks',
      ready,
      (c: DecisionContext) => decideCollectWeeklyCredits({ nowIso: '2026-08-08T00:00:00.000Z' }, c),
      ['state', 'id', ...STAMP, ...STAMP],
    ],
    [
      'comparison credit',
      ready,
      (c: DecisionContext) => decideGrantComparisonCredit(c),
      ['state', 'id', ...STAMP],
    ],
    [
      'resolve from the reserve',
      ready,
      (c: DecisionContext) =>
        decideResolveSimulatedExpense(
          {
            eventInstanceId: 'e',
            eventType: 'x',
            amount: 50,
            via: { path: 'reserve', goalId: 'g1' },
          },
          c
        ),
      ['state', 'id', ...STAMP, ...STAMP],
    ],
  ] as const)(
    'should call ctx in today\'s order when it decides "%s"',
    (_name, make, decide, order) => {
      const { ctx, calls } = make();
      const decision = decide(ctx);
      expect(decision.outcome.kind).toBe('emitted');
      expect(calls).toEqual(order);
    }
  );

  it('should resume a paused goal in the same order', () => {
    const { ctx, calls } = recordingContext(
      deepFreeze(
        structuredClone(
          project([...HISTORY, ev('GoalPaused', { goalId: 'g1', expectedVersion: 0 })])
        )
      )
    );
    expect(decideResumeGoal('g1', ctx).outcome.kind).toBe('emitted');
    expect(calls).toEqual(['state', 'id', ...STAMP]);
  });

  it('should decline without touching ctx, as an effect only (it reads no state today)', () => {
    const d = decideDeclineProposal({ ...proposal, lines: [...proposal.lines], weekSet: [3] });
    expect(d).toEqual({
      result: undefined,
      outcome: { kind: 'emitted' },
      append: null,
      effects: [{ type: 'ProposalDeclined', weekSet: [3] }],
    });
  });

  it('should carry the correlation id on the resolution effect (D6)', () => {
    const { ctx } = ready();
    const d = decideResolveSimulatedExpense(
      { eventInstanceId: 'e', eventType: 'x', amount: 50, via: { path: 'available' } },
      ctx
    );
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
});
