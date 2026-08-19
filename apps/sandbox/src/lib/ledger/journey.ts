/**
 * Core-journey actions (P2BD-4 extraction): grant, goals, strategy entry/exit,
 * the time machine, recurring. Composed over the `ledger/core` seam; consumed
 * via the `ledgerClient` barrel. Semantics unchanged.
 */

import Decimal from 'decimal.js';
import { computeExitFee, type LedgerEvent } from '@diboas/banking';
import { getStrategy, type ProtocolApyHistory } from '@diboas/defi';
import { blendSeries, type DailyApySeries } from '@diboas/investing';
import { planAdvance } from '../advancePlanner';
import { generateId } from '../ids';
import { appendAll, base, getLedgerState } from './core';

/**
 * The R1 claim grant (W-5a) — the ONE grant path. Emits `PlayMoneyGranted`
 * ALONE — the engine lands the full amount in `working` (= Available), so no
 * `JobsSplitSet` is needed; allocation into jobs happens later via the D-r
 * flow, not at the grant. (`grantAndSplit`, the MVP-0 first-run emitter of the
 * product-deprecated `JobsSplitSet`, was deleted with that chain in the R1
 * audit cleanup 2026-08-18 — the engine keeps its replay case forever, D-r §2.)
 *
 * One-grant guard (plan §7): once-per-ledger. `<LedgerReadyGate>` keeps `(app)`
 * screens from mounting before hydrate, but this closes the window
 * structurally — a double-fire (fast double-tap, a stray remount) can never
 * mint a second grant that `reconcile()` could not catch. Idempotent no-op
 * once initialized.
 */
export function grantPlayMoney(
  amount: number,
  currency: 'USD' | 'BRL' | 'EUR',
  mode: 'b2c' | 'b2b'
): void {
  if (getLedgerState().initialized) return;
  const correlationId = generateId();
  appendAll([
    {
      ...base(correlationId),
      type: 'PlayMoneyGranted',
      amount: new Decimal(amount).toFixed(2),
      currency,
      mode,
    },
  ]);
}

/**
 * Pause a goal's PLAN (G3, W-17d): zero-value D-e transition — the weekly
 * plan, proposals (D-r skips paused), and recurring deposits stop; invested
 * money keeps working. Optimistic version from current state; a stale event
 * is skipped by the projection (fail-safe re-present).
 */
export function pauseGoal(goalId: string): void {
  const goal = getLedgerState().goals.find((g) => g.goalId === goalId);
  if (!goal || goal.status !== 'active') return;
  appendAll([{ ...base(generateId()), type: 'GoalPaused', goalId, expectedVersion: goal.version }]);
}

/** Resume a paused goal's plan — the calm reverse of pause (reversibility). */
export function resumeGoal(goalId: string): void {
  const goal = getLedgerState().goals.find((g) => g.goalId === goalId);
  if (!goal || goal.status !== 'paused') return;
  appendAll([
    { ...base(generateId()), type: 'GoalResumed', goalId, expectedVersion: goal.version },
  ]);
}

/**
 * Close a reached goal by the user's disposition (G4 / D-e §3): "reached is a
 * fact, accomplished is a CHOICE — the moment belongs to the user, not to
 * arithmetic." Zero-value itself; any money rides its own events (below).
 * `kept-working` leaves positions working; `held-as-cash` follows an exit.
 */
export function accomplishGoal(
  goalId: string,
  disposition: 'kept-working' | 'held-as-cash' | 'transferred'
): void {
  const goal = getLedgerState().goals.find((g) => g.goalId === goalId);
  if (!goal || (goal.status !== 'active' && goal.status !== 'paused')) return;
  appendAll([
    {
      ...base(generateId()),
      type: 'GoalAccomplished',
      goalId,
      disposition,
      expectedVersion: goal.version,
    },
  ]);
}

/**
 * "Move to another goal" (G4, board §3.1): release this goal's CASH → fund the
 * destination → close as `transferred`, one correlationId. Invested positions
 * do NOT move (W-17e reassignment is its own act) — the surface discloses that.
 * Version sequencing matters: `GoalCashReleased` bumps the goal's version when
 * it really releases, so the closing event must expect version+1; with no cash
 * there is no release event and the version is unchanged.
 */
export function transferGoalCash(fromGoalId: string, toGoalId: string): void {
  const state = getLedgerState();
  const from = state.goals.find((g) => g.goalId === fromGoalId);
  const to = state.goals.find((g) => g.goalId === toGoalId);
  if (!from || !to || from.goalId === to.goalId) return;
  if (from.status !== 'active' && from.status !== 'paused') return;
  if (to.status !== 'active') return;
  const cash = new Decimal(from.cash);
  const correlationId = generateId();
  const events: LedgerEvent[] = [];
  if (cash.gt(0)) {
    events.push({
      ...base(correlationId),
      type: 'GoalCashReleased',
      goalId: fromGoalId,
      amount: cash.toFixed(2),
      expectedVersion: from.version,
    });
    events.push({
      ...base(correlationId),
      type: 'GoalFunded',
      goalId: toGoalId,
      amount: cash.toFixed(2),
    });
  }
  events.push({
    ...base(correlationId),
    type: 'GoalAccomplished',
    goalId: fromGoalId,
    disposition: 'transferred',
    // A real release bumped the version; no release left it untouched.
    expectedVersion: cash.gt(0) ? from.version + 1 : from.version,
  });
  appendAll(events);
}

/**
 * "Raise the target" (G4, board §3.1): `GoalTargetChanged` ONLY — the goal
 * stays **active** and emits NO `GoalAccomplished` ("growing an ambition is
 * not completing-then-restarting", D-e §3). Because `target_reached` is
 * derived (`current >= target`, never stored), raising the target clears the
 * completion state automatically — no extra event, no stale flag.
 */
export function raiseGoalTarget(goalId: string, newTarget: number): void {
  const goal = getLedgerState().goals.find((g) => g.goalId === goalId);
  // active OR paused — matching the engine's allowed FROM states, so the
  // completion screen never offers a row that would silently do nothing.
  if (!goal || (goal.status !== 'active' && goal.status !== 'paused')) return;
  const next = new Decimal(newTarget);
  if (!next.isFinite() || next.lte(goal.targetAmount)) return; // raise only
  appendAll([
    {
      ...base(generateId()),
      type: 'GoalTargetChanged',
      goalId,
      oldTarget: goal.targetAmount,
      newTarget: next.toFixed(2),
      expectedVersion: goal.version,
    },
  ]);
}

export function createGoal(input: {
  name: string;
  icon: string;
  targetAmount: number;
  horizonMonths: number;
  fundAmount: number;
}): string {
  const goalId = generateId();
  const correlationId = generateId();
  const events: LedgerEvent[] = [
    {
      ...base(correlationId),
      type: 'GoalCreated',
      goalId,
      name: input.name.trim(),
      icon: input.icon,
      targetAmount: new Decimal(input.targetAmount).toFixed(2),
      horizonMonths: input.horizonMonths,
    },
  ];
  if (input.fundAmount > 0) {
    events.push({
      ...base(correlationId),
      type: 'GoalFunded',
      goalId,
      amount: new Decimal(input.fundAmount).toFixed(2),
    });
  }
  appendAll(events);
  return goalId;
}

/**
 * The exact Decimal split of a committed total into (fee, invested), so that
 * fee + invested == total to the cent. The manifest display and the ledger
 * event both use this — what you read is exactly what happens (no independent
 * float rounding that could drift and trip the engine's cash guard). Fee is
 * clamped so it never exceeds the total.
 */
export function splitEntry(
  totalFromCash: number,
  networkFeeLocal: number
): { total: Decimal; fee: Decimal; invested: Decimal } {
  const total = new Decimal(totalFromCash).toDecimalPlaces(2);
  const fee = Decimal.min(new Decimal(networkFeeLocal).toDecimalPlaces(2), total);
  return { total, fee, invested: total.minus(fee) };
}

/**
 * Enter a strategy. The caller passes the TOTAL committed from goal cash and
 * the network fee; the invested amount is derived in Decimal (see splitEntry),
 * so `amount + networkFee` equals the total EXACTLY.
 */
export function enterStrategy(input: {
  goalId: string;
  strategyId: string;
  totalFromCash: number;
  networkFeeLocal: number;
}): string {
  const positionId = generateId();
  const { fee, invested } = splitEntry(input.totalFromCash, input.networkFeeLocal);
  appendAll([
    {
      ...base(generateId()),
      type: 'StrategyEntered',
      goalId: input.goalId,
      positionId,
      strategyId: input.strategyId,
      amount: invested.toFixed(2),
      networkFee: fee.toFixed(2),
    },
  ]);
  return positionId;
}

/**
 * The time machine: advance simulated days, replaying real APY history onto
 * every open position (blended by the strategy's allocation weights).
 *
 * When a position carries a recurring schedule (C3), its accrual is replayed in
 * SEGMENTS split at each monthly deposit day, so each contribution compounds
 * from its own day (an annuity replay). Every segment passes the GLOBAL `toDay`
 * as `anchorDay` to `replayEarnings` (A-1) — segment slices are then contiguous
 * and their union equals the single-call slice. Deposits are bounded by the
 * shared Working pool, granted in strict day order across all positions (a
 * partial last deposit, then paused). A move within the reconciliation `held`
 * set → the invariant holds by construction.
 */
export function advanceTime(
  days: number,
  histories: ProtocolApyHistory[],
  source: 'real' | 'machine' = 'machine'
): void {
  const state = getLedgerState();
  const toDay = state.simDay + days;
  const byProtocol = new Map(histories.map((h) => [h.protocolId, h]));
  const correlationId = generateId();
  const open = state.positions.filter((p) => p.open);

  // Blended real-APY series per open position (built once, reused per segment).
  const blendedByPosition = new Map<string, DailyApySeries>();
  for (const position of open) {
    const strategy = getStrategy(position.strategyId);
    if (!strategy) continue;
    const legs = strategy.allocation.map((leg) => {
      const history = byProtocol.get(leg.protocolId);
      const series: DailyApySeries = {
        points: history ? history.points.map((p) => p.apyPercent) : [0],
        source: history?.stamp.source === 'defillama' ? 'defillama' : 'fixture',
      };
      return { weightPercent: leg.weightPercent, series };
    });
    blendedByPosition.set(position.positionId, blendSeries(legs));
  }

  // The money-moving logic lives in the pure planner (unit tested); this layer
  // only supplies the store-derived inputs and the event stamps.
  const events = planAdvance({
    positions: open.map((p) => ({
      positionId: p.positionId,
      goalId: p.goalId,
      principal: p.principal,
      accrued: p.accrued,
      accruedThroughSimDay: p.accruedThroughSimDay,
    })),
    // G3/W-17d: a paused goal's schedules are INERT while paused (the pause
    // sheet says "stops your weekly plan" — auto-deposits must honor that or
    // the copy lies). Derived, not stored: resume re-activates them untouched.
    schedules: state.recurring.filter((r) => {
      const goal = state.goals.find((g) => g.goalId === r.goalId);
      return goal ? goal.status === 'active' : false;
    }),
    workingStart: state.buckets.working,
    blendedByPosition,
    toDay,
    days,
    source,
    stamp: () => base(correlationId),
  });
  appendAll(events);
}

/**
 * Set, change, or clear (monthlyAmount = 0) a recurring monthly contribution on
 * an open position. Real play money from Working, auto-invested each due month
 * as the shared clock advances (C3). `startSimDay` = today's sim day → the first
 * deposit lands 30 sim-days later.
 */
export function setRecurring(input: {
  goalId: string;
  positionId: string;
  monthlyAmount: number;
}): void {
  appendAll([
    {
      ...base(generateId()),
      type: 'RecurringSet',
      goalId: input.goalId,
      positionId: input.positionId,
      monthlyAmount: new Decimal(input.monthlyAmount).toFixed(2),
      startSimDay: getLedgerState().simDay,
    },
  ]);
}

export function exitPosition(input: { positionId: string; networkFeeLocal: number }): void {
  const state = getLedgerState();
  const position = state.positions.find((p) => p.positionId === input.positionId);
  if (!position || !position.open) return;
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  appendAll([
    {
      ...base(generateId()),
      type: 'StrategyExited',
      positionId: position.positionId,
      goalId: position.goalId,
      grossAmount: gross.toFixed(2),
      exitFee: exitFee.toFixed(2),
      networkFee: new Decimal(input.networkFeeLocal).toFixed(2),
    },
  ]);
}

/**
 * Preview the full exit numbers for the manifest (no event appended). The
 * shared exit-preview primitive for BOTH the goal-detail exit manifest and
 * G3's "also stop" / G7's ceremony (Step-0 item 7). `previewExit` has no
 * market/gas access of its own (board §8.1a), so the caller passes the network
 * fee it computes via `networkFeeLocal(market.gas, entryChain, usdPriceLocal)`;
 * this returns the whole itemization incl. `net` (what actually lands back in
 * the goal after both fees).
 */
export function previewExit(
  positionId: string,
  networkFeeLocal: number
): { gross: string; exitFee: string; networkFee: string; net: string } | null {
  const state = getLedgerState();
  const position = state.positions.find((p) => p.positionId === positionId);
  if (!position || !position.open) return null;
  const gross = new Decimal(position.principal).plus(position.accrued);
  const exitFee = computeExitFee(gross, state.currency);
  const networkFee = new Decimal(networkFeeLocal);
  const net = gross.minus(exitFee).minus(networkFee);
  return {
    gross: gross.toFixed(2),
    exitFee: exitFee.toFixed(2),
    networkFee: networkFee.toFixed(2),
    net: net.toFixed(2),
  };
}
