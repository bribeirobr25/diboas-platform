/**
 * S1a (plan P12): the core-journey decisions — grant (row 1), goals (2–7), entry (8), recurring
 * (10), exit (11) and stop-all (12). `advanceTime` (row 9) moves alone in PR-3. A mechanical
 * rewrite of `ledger/journey.ts` (D9): state, ids and the clock come through `ctx`, at the same
 * points and in the same order; object literals keep today's field order (it is the stored order).
 */
import Decimal from 'decimal.js';
import { computeExitFee, type LedgerEvent } from '@diboas/banking';
import { type StrategyId } from '@diboas/defi';
import { feeInCents, splitEntry } from './fees';
import { stamp } from './stamp';
import { emitted, noop, type Decision, type DecisionContext } from './types';

export function decideGrantPlayMoney(
  input: { amount: number; currency: 'USD' | 'BRL' | 'EUR'; mode: 'b2c' | 'b2b' },
  ctx: DecisionContext
): Decision<void, 'alreadyInitialized'> {
  if (ctx.readState().initialized) return noop(undefined, 'alreadyInitialized');
  const correlationId = ctx.newId();
  return emitted(undefined, [
    {
      ...stamp(correlationId, ctx),
      type: 'PlayMoneyGranted',
      amount: new Decimal(input.amount).toFixed(2),
      currency: input.currency,
      mode: input.mode,
    },
  ]);
}

export function decidePauseGoal(
  goalId: string,
  ctx: DecisionContext
): Decision<void, 'goalNotActive'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === goalId);
  if (!goal || goal.status !== 'active') return noop(undefined, 'goalNotActive');
  return emitted(undefined, [
    { ...stamp(ctx.newId(), ctx), type: 'GoalPaused', goalId, expectedVersion: goal.version },
  ]);
}

export function decideResumeGoal(
  goalId: string,
  ctx: DecisionContext
): Decision<void, 'goalNotPaused'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === goalId);
  if (!goal || goal.status !== 'paused') return noop(undefined, 'goalNotPaused');
  return emitted(undefined, [
    { ...stamp(ctx.newId(), ctx), type: 'GoalResumed', goalId, expectedVersion: goal.version },
  ]);
}

export function decideAccomplishGoal(
  input: { goalId: string; disposition: 'kept-working' | 'held-as-cash' | 'transferred' },
  ctx: DecisionContext
): Decision<void, 'goalClosed'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === input.goalId);
  if (!goal || (goal.status !== 'active' && goal.status !== 'paused'))
    return noop(undefined, 'goalClosed');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'GoalAccomplished',
      goalId: input.goalId,
      disposition: input.disposition,
      expectedVersion: goal.version,
    },
  ]);
}

export function decideTransferGoalCash(
  input: { fromGoalId: string; toGoalId: string },
  ctx: DecisionContext
): Decision<void, 'goalMissing' | 'sameGoal' | 'sourceClosed' | 'destinationNotActive'> {
  const { fromGoalId, toGoalId } = input;
  const state = ctx.readState();
  const from = state.goals.find((g) => g.goalId === fromGoalId);
  const to = state.goals.find((g) => g.goalId === toGoalId);
  if (!from || !to) return noop(undefined, 'goalMissing');
  if (from.goalId === to.goalId) return noop(undefined, 'sameGoal');
  if (from.status !== 'active' && from.status !== 'paused') return noop(undefined, 'sourceClosed');
  if (to.status !== 'active') return noop(undefined, 'destinationNotActive');
  const cash = new Decimal(from.cash);
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [];
  if (cash.gt(0)) {
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalCashReleased',
      goalId: fromGoalId,
      amount: cash.toFixed(2),
      expectedVersion: from.version,
    });
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalFunded',
      goalId: toGoalId,
      amount: cash.toFixed(2),
    });
  }
  events.push({
    ...stamp(correlationId, ctx),
    type: 'GoalAccomplished',
    goalId: fromGoalId,
    disposition: 'transferred',
    // A real release bumped the version; no release left it untouched.
    expectedVersion: cash.gt(0) ? from.version + 1 : from.version,
  });
  return emitted(undefined, events);
}

export function decideRaiseGoalTarget(
  input: { goalId: string; newTarget: string },
  ctx: DecisionContext
): Decision<void, 'goalClosed' | 'unparseable' | 'notARaise'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === input.goalId);
  if (!goal || (goal.status !== 'active' && goal.status !== 'paused'))
    return noop(undefined, 'goalClosed');
  let next: Decimal;
  try {
    next = new Decimal(input.newTarget);
  } catch {
    return noop(undefined, 'unparseable');
  }
  if (!next.isFinite() || next.lte(goal.targetAmount)) return noop(undefined, 'notARaise');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'GoalTargetChanged',
      goalId: input.goalId,
      oldTarget: goal.targetAmount,
      newTarget: next.toFixed(2),
      expectedVersion: goal.version,
    },
  ]);
}

export function decideCreateGoal(
  input: {
    name: string;
    icon: string;
    targetAmount: number;
    horizonMonths: number;
    fundAmount: number;
  },
  ctx: DecisionContext
): Decision<string, never> {
  const goalId = ctx.newId();
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [
    {
      ...stamp(correlationId, ctx),
      type: 'GoalCreated',
      goalId,
      name: input.name.trim(),
      icon: input.icon,
      targetAmount: new Decimal(input.targetAmount).toFixed(2),
      horizonMonths: input.horizonMonths,
    },
  ];
  // Never emit a leg the projection will refuse: the goal is still created, only the
  // unaffordable funding leg is withheld (D4: noted, so a server can say why).
  const fund = new Decimal(input.fundAmount);
  const finitePositive = Number.isFinite(input.fundAmount) && fund.gt(0);
  const affordable = finitePositive && new Decimal(ctx.readState().buckets.working).gte(fund);
  const notes: string[] = [];
  if (affordable) {
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalFunded',
      goalId,
      amount: fund.toFixed(2),
    });
  } else if (finitePositive) {
    notes.push('fundingWithheld:insufficientAvailable');
  } else if (!Number.isFinite(input.fundAmount) || fund.lt(0)) {
    notes.push('fundingWithheld:invalidAmount');
  }
  return emitted(goalId, events, [], notes);
}

export function decideEnterStrategy(
  input: { goalId: string; strategyId: StrategyId; totalFromCash: number; networkFeeLocal: number },
  ctx: DecisionContext
): Decision<string, never> {
  const positionId = ctx.newId();
  const { fee, invested } = splitEntry(input.totalFromCash, input.networkFeeLocal);
  return emitted(positionId, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'StrategyEntered',
      goalId: input.goalId,
      positionId,
      strategyId: input.strategyId,
      amount: invested.toFixed(2),
      schemaVersion: 2,
      modeledNetworkFee: fee.toFixed(2),
    },
  ]);
}

export function decideSetRecurring(
  input: { goalId: string; positionId: string; monthlyAmount: number },
  ctx: DecisionContext
): Decision<void, never> {
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'RecurringSet',
      goalId: input.goalId,
      positionId: input.positionId,
      monthlyAmount: new Decimal(input.monthlyAmount).toFixed(2),
      startSimDay: ctx.readState().simDay,
    },
  ]);
}

export function decideExitPosition(
  input: { positionId: string; networkFeeLocal: number },
  ctx: DecisionContext
): Decision<void, 'positionNotOpen'> {
  const state = ctx.readState();
  const position = state.positions.find((p) => p.positionId === input.positionId);
  if (!position || !position.open) return noop(undefined, 'positionNotOpen');
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'StrategyExited',
      positionId: position.positionId,
      goalId: position.goalId,
      grossAmount: gross.toFixed(2),
      schemaVersion: 2,
      modeledExitFee: exitFee.toFixed(2),
      modeledNetworkFee: feeInCents(input.networkFeeLocal).toFixed(2),
    },
  ]);
}

export function decideStopGoalStrategies(
  input: { goalId: string },
  env: { feeFor: (positionId: string) => number },
  ctx: DecisionContext
): Decision<void, 'nothingOpen'> {
  const state = ctx.readState();
  const open = state.positions.filter((p) => p.goalId === input.goalId && p.open);
  if (open.length === 0) return noop(undefined, 'nothingOpen');
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [];
  for (const position of open) {
    const gross = new Decimal(position.principal).plus(position.accrued);
    events.push({
      ...stamp(correlationId, ctx),
      type: 'StrategyExited',
      positionId: position.positionId,
      goalId: input.goalId,
      grossAmount: gross.toFixed(2),
      schemaVersion: 2,
      modeledExitFee: computeExitFee(gross, state.currency).toFixed(2),
      // `feeFor` runs once per position, inside the event, after that position's stamp (§1.4).
      modeledNetworkFee: feeInCents(env.feeFor(position.positionId)).toFixed(2),
    });
  }
  return emitted(undefined, events);
}
