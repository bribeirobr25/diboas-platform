/**
 * S1a (plan P12): the core-journey decisions — grant (row 1), goals (2–7), entry (8), recurring
 * (10), exit (11) and stop-all (12). `advanceTime` (row 9) moves alone in PR-3. A mechanical
 * rewrite of `ledger/journey.ts` (D9): state, ids and the clock come through `ctx`, at the same
 * points and in the same order; object literals keep today's field order (it is the stored order).
 */
import Decimal from 'decimal.js';
import { computeExitFee, type LedgerEvent, type LedgerState } from '@diboas/banking';
import { type StrategyId } from '@diboas/defi';
import { feeInCents, splitEntry } from './fees';
import { stamp } from './stamp';
import {
  emitted,
  noop,
  type Decision,
  type DecisionContext,
  type Note,
  type Nothing,
} from './types';

type Currency = 'USD' | 'BRL' | 'EUR';

/**
 * The R1 claim grant (W-5a) — the ONE grant path. Emits `PlayMoneyGranted` ALONE: the engine lands
 * the full amount in `working` (= Available), so no `JobsSplitSet` is needed; allocation into jobs
 * happens later via the D-r flow, not at the grant.
 *
 * One-grant guard (plan §7): once per ledger. `<LedgerReadyGate>` keeps `(app)` screens from
 * mounting before hydrate, but this closes the window structurally — a double-fire (a fast double
 * tap, a stray remount) can never mint a second grant that `reconcile()` could not catch.
 */
export function decideGrantPlayMoney(
  intent: { currency: Currency },
  env: { amount: number; mode: 'b2c' | 'b2b' },
  ctx: DecisionContext
): Decision<void, 'alreadyInitialized'> {
  if (ctx.readState().initialized) return noop(undefined, 'alreadyInitialized');
  const correlationId = ctx.newId();
  return emitted(undefined, [
    {
      ...stamp(correlationId, ctx),
      type: 'PlayMoneyGranted',
      amount: new Decimal(env.amount).toFixed(2),
      currency: intent.currency,
      mode: env.mode,
    },
  ]);
}

/**
 * Pause a goal's PLAN (G3, W-17d): a zero-value D-e transition — the weekly plan, proposals (D-r
 * skips paused) and recurring deposits stop; invested money keeps working. The version is taken
 * from current state; a stale event is refused by the projection (fail-safe re-present).
 */
export function decidePauseGoal(
  intent: { goalId: string },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, 'goalNotActive'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === intent.goalId);
  if (!goal || goal.status !== 'active') return noop(undefined, 'goalNotActive');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'GoalPaused',
      goalId: intent.goalId,
      expectedVersion: goal.version,
    },
  ]);
}

/** Resume a paused goal's plan — the calm reverse of pause (reversibility). */
export function decideResumeGoal(
  intent: { goalId: string },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, 'goalNotPaused'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === intent.goalId);
  if (!goal || goal.status !== 'paused') return noop(undefined, 'goalNotPaused');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'GoalResumed',
      goalId: intent.goalId,
      expectedVersion: goal.version,
    },
  ]);
}

/**
 * Close a reached goal by the user's disposition (G4 / D-e §3): "reached is a fact, accomplished
 * is a CHOICE — the moment belongs to the user, not to arithmetic." Zero-value itself; any money
 * rides its own events. `kept-working` leaves positions working; `held-as-cash` follows an exit.
 */
export function decideAccomplishGoal(
  intent: { goalId: string; disposition: 'kept-working' | 'held-as-cash' | 'transferred' },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, 'goalClosed'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === intent.goalId);
  if (!goal || (goal.status !== 'active' && goal.status !== 'paused'))
    return noop(undefined, 'goalClosed');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'GoalAccomplished',
      goalId: intent.goalId,
      disposition: intent.disposition,
      expectedVersion: goal.version,
    },
  ]);
}

/**
 * "Move to another goal" (G4, board §3.1): release this goal's CASH → fund the destination → close
 * as `transferred`, one correlationId. Invested positions do NOT move (W-17e reassignment is its
 * own act) — the surface discloses that. Version sequencing matters: `GoalCashReleased` bumps the
 * goal's version when it really releases, so the closing event must expect version+1; with no cash
 * there is no release event and the version is unchanged.
 */
export function decideTransferGoalCash(
  intent: { fromGoalId: string; toGoalId: string },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, 'goalMissing' | 'sameGoal' | 'sourceClosed' | 'destinationNotActive'> {
  const { fromGoalId, toGoalId } = intent;
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

/**
 * "Raise the target" (G4, board §3.1): `GoalTargetChanged` ONLY — the goal stays active and emits
 * NO `GoalAccomplished` ("growing an ambition is not completing-then-restarting", D-e §3). Because
 * `target_reached` is derived (`current >= target`, never stored), raising the target clears the
 * completion state automatically.
 *
 * ⚑ AUD-E01: this takes the RAW input string and parses it once, here, with the same exactness the
 * acceptance test uses. It used to take a `number` the screen built with `Number(newTarget) || 0`,
 * so at the float boundary a raise to 9007199254740993 arrived as 9007199254740992, equal to the
 * existing target, and the command silently did nothing while the CTA had been enabled.
 */
export function decideRaiseGoalTarget(
  intent: { goalId: string; newTarget: string },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, 'goalClosed' | 'unparseable' | 'notARaise'> {
  const goal = ctx.readState().goals.find((g) => g.goalId === intent.goalId);
  // active OR paused — matching the engine's allowed FROM states, so the completion screen never
  // offers a row that would silently do nothing.
  if (!goal || (goal.status !== 'active' && goal.status !== 'paused'))
    return noop(undefined, 'goalClosed');
  let next: Decimal;
  try {
    next = new Decimal(intent.newTarget);
  } catch {
    return noop(undefined, 'unparseable');
  }
  if (!next.isFinite() || next.lte(goal.targetAmount)) return noop(undefined, 'notARaise');
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'GoalTargetChanged',
      goalId: intent.goalId,
      oldTarget: goal.targetAmount,
      newTarget: next.toFixed(2),
      expectedVersion: goal.version,
    },
  ]);
}

/**
 * Create a goal, optionally funded from Available.
 *
 * Never emit a leg the PROJECTION will refuse: `projection/core.ts` refuses a `GoalFunded` it
 * cannot afford (`insufficient-available`), so an over-budget funding used to append an event that
 * moved nothing — the goal appeared with 0 cash while History showed the money arriving (measured:
 * fundAmount 5000 against 100 Available gave `fundedEvents=1, goalCash=0.00, working=100.00`).
 * That is the defect the 2026-08-19 audit fixed for `applyRuleProposal` ("an approval must never
 * emit legs Available can't cover"), which had not reached this path. The goal is still created —
 * only the unaffordable funding leg is withheld, and the outcome notes why (D4).
 */
export function decideCreateGoal(
  intent: {
    name: string;
    icon: string;
    targetAmount: number;
    horizonMonths: number;
    fundAmount: number;
  },
  _env: Nothing,
  ctx: DecisionContext
): Decision<string, never> {
  const goalId = ctx.newId();
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [
    {
      ...stamp(correlationId, ctx),
      type: 'GoalCreated',
      goalId,
      name: intent.name.trim(),
      icon: intent.icon,
      targetAmount: new Decimal(intent.targetAmount).toFixed(2),
      horizonMonths: intent.horizonMonths,
    },
  ];
  const fund = new Decimal(intent.fundAmount);
  const finitePositive = Number.isFinite(intent.fundAmount) && fund.gt(0);
  // Read state only for a positive amount, exactly where today's code read it.
  const affordable = finitePositive && new Decimal(ctx.readState().buckets.working).gte(fund);
  const notes: Note[] = [];
  if (affordable) {
    events.push({
      ...stamp(correlationId, ctx),
      type: 'GoalFunded',
      goalId,
      amount: fund.toFixed(2),
    });
  } else if (finitePositive) {
    notes.push('fundingWithheld:insufficientAvailable');
  } else if (!Number.isFinite(intent.fundAmount) || fund.lt(0)) {
    notes.push('fundingWithheld:invalidAmount');
  }
  return emitted(goalId, events, [], notes);
}

/**
 * Enter a strategy with the TOTAL committed from goal cash (`5.403`): all of it reaches the
 * strategy — the goal parts with exactly what the user approved — and the modelled network fee is
 * recorded beside it as information. The event is written at **schema v2** (D-06), so replay can
 * never confuse it with a legacy v1 event whose `amount` is already net; the field is named
 * `modeledNetworkFee` so no reader can mistake it for money that moved.
 */
export function decideEnterStrategy(
  intent: {
    goalId: string;
    /** A CATALOGUE id, not a free string: an unresolvable id would enter a position that
     *  `getStrategy` can never resolve, so it would silently earn nothing forever. */
    strategyId: StrategyId;
    totalFromCash: number;
  },
  env: { networkFeeLocal: number },
  ctx: DecisionContext
): Decision<string, never> {
  const positionId = ctx.newId();
  const { fee, invested } = splitEntry(intent.totalFromCash, env.networkFeeLocal);
  return emitted(positionId, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'StrategyEntered',
      goalId: intent.goalId,
      positionId,
      strategyId: intent.strategyId,
      amount: invested.toFixed(2),
      schemaVersion: 2,
      modeledNetworkFee: fee.toFixed(2),
    },
  ]);
}

/**
 * Set, change, or clear (monthlyAmount = 0) a recurring monthly contribution on an open position:
 * real play money from Working, auto-invested each due month as the shared clock advances (C3).
 * `startSimDay` = today's sim day, so the first deposit lands 30 sim-days later.
 */
export function decideSetRecurring(
  intent: { goalId: string; positionId: string; monthlyAmount: number },
  _env: Nothing,
  ctx: DecisionContext
): Decision<void, never> {
  return emitted(undefined, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'RecurringSet',
      goalId: intent.goalId,
      positionId: intent.positionId,
      monthlyAmount: new Decimal(intent.monthlyAmount).toFixed(2),
      startSimDay: ctx.readState().simDay,
    },
  ]);
}

/**
 * Exit one open position. Both fees are modelled information (`5.403`): the whole gross returns to
 * the goal; the exit fee (with its per-position floor) and the network fee are recorded beside it.
 */
export function decideExitPosition(
  intent: { positionId: string },
  env: { networkFeeLocal: number },
  ctx: DecisionContext
): Decision<void, 'positionNotOpen'> {
  const state = ctx.readState();
  const position = state.positions.find((p) => p.positionId === intent.positionId);
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
      modeledNetworkFee: feeInCents(env.networkFeeLocal).toFixed(2),
    },
  ]);
}

/** Open positions of a goal, in ledger order (the stop set; the previews use it too). */
export function openPositionsOf(state: LedgerState, goalId: string) {
  return state.positions.filter((p) => p.goalId === goalId && p.open);
}

/**
 * Stop every open position of a goal — N `StrategyExited` events under ONE correlationId (they are
 * one user decision). The money returns to the GOAL as cash (the engine's exit leg), never to
 * Available: releasing goal cash is a separate, explicit act (D-e `GoalCashReleased`/`GoalDropped`).
 */
export function decideStopGoalStrategies(
  intent: { goalId: string },
  env: { feeFor: (positionId: string) => number },
  ctx: DecisionContext
): Decision<void, 'nothingOpen'> {
  // Called unbound, as today's code called the caller's callback.
  const { feeFor } = env;
  const state = ctx.readState();
  const open = openPositionsOf(state, intent.goalId);
  if (open.length === 0) return noop(undefined, 'nothingOpen');
  const correlationId = ctx.newId();
  const events: LedgerEvent[] = [];
  for (const position of open) {
    const gross = new Decimal(position.principal).plus(position.accrued);
    events.push({
      ...stamp(correlationId, ctx),
      type: 'StrategyExited',
      positionId: position.positionId,
      goalId: intent.goalId,
      grossAmount: gross.toFixed(2),
      schemaVersion: 2,
      modeledExitFee: computeExitFee(gross, state.currency).toFixed(2),
      // `feeFor` runs once per position, inside the event, after that position's stamp (§1.4).
      modeledNetworkFee: feeInCents(feeFor(position.positionId)).toFixed(2),
    });
  }
  return emitted(undefined, events);
}
