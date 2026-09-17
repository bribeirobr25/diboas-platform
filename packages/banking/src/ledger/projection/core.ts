/**
 * Core-journey appliers (the original MVP-0 block): grant, jobs split, goal
 * create/fund, strategy enter/accrue/exit, recurring, time. Semantics are
 * UNCHANGED by the P2BD-4 extraction — each body is the former `project()`
 * case, verbatim, over the shared context.
 */

import { feeAccountingOf } from '../events';
import type {
  AccrualApplied,
  GoalCreated,
  GoalFunded,
  JobsSplitSet,
  PlayMoneyGranted,
  RecurringContributionApplied,
  RecurringSet,
  StrategyEntered,
  StrategyExited,
  ReplaySpanRefused,
  TimeAdvanced,
} from '../events';
import { d, ZERO } from '../money';
import type { ProjectionContext } from './context';

export type CoreEvent =
  | PlayMoneyGranted
  | JobsSplitSet
  | GoalCreated
  | GoalFunded
  | StrategyEntered
  | AccrualApplied
  | StrategyExited
  | RecurringSet
  | RecurringContributionApplied
  | TimeAdvanced
  | ReplaySpanRefused;

export function applyCoreEvent(ctx: ProjectionContext, event: CoreEvent): void {
  switch (event.type) {
    case 'PlayMoneyGranted': {
      ctx.state.initialized = true;
      ctx.state.mode = event.mode;
      ctx.state.currency = event.currency;
      // Genesis anchor for real-time settle (WS-F): the real moment the grant landed.
      if (ctx.state.genesisRecordedAt === null) ctx.state.genesisRecordedAt = event.recordedAt;
      // Granted money lands in "working" until the split assigns jobs.
      ctx.working.v = ctx.working.v.plus(d(event.amount));
      break;
    }
    case 'JobsSplitSet': {
      const total = ctx.floor.v.plus(ctx.cushion.v).plus(ctx.working.v);
      ctx.state.split = {
        floorPercent: event.floorPercent,
        cushionPercent: event.cushionPercent,
        workingPercent: event.workingPercent,
      };
      ctx.floor.v = total.mul(event.floorPercent).div(100).toDecimalPlaces(2);
      ctx.cushion.v = total.mul(event.cushionPercent).div(100).toDecimalPlaces(2);
      ctx.working.v = total.minus(ctx.floor.v).minus(ctx.cushion.v);
      break;
    }
    case 'GoalCreated': {
      ctx.goals.set(event.goalId, {
        s: {
          goalId: event.goalId,
          name: event.name,
          icon: event.icon,
          targetAmount: event.targetAmount,
          horizonMonths: event.horizonMonths,
          cash: '0',
          invested: '0',
          earnings: '0',
          createdSimDay: event.simDay,
          status: 'active',
          version: 0,
        },
        cash: ZERO,
        invested: ZERO,
        earnings: ZERO,
      });
      break;
    }
    case 'GoalFunded': {
      const goal = ctx.goals.get(event.goalId);
      if (!goal) break;
      const amount = d(event.amount);
      if (ctx.working.v.lt(amount)) break; // insufficient working money: reject silently at projection level
      ctx.working.v = ctx.working.v.minus(amount);
      goal.cash = goal.cash.plus(amount);
      break;
    }
    case 'StrategyEntered': {
      const goal = ctx.goals.get(event.goalId);
      if (!goal) break;
      const amount = d(event.amount);
      const fee = d(event.networkFee);
      /**
       * `5.403` — MODEL THE CONSEQUENCE ≠ APPLY IT TO PRACTICE MONEY.
       *
       * `'modeled'`: `amount` IS the whole committed total, so the goal parts
       * with exactly that and all of it reaches the strategy. The fee is
       * recorded beside it and moves nothing.
       *
       * `'deducted'` (legacy, and Real under FC-15): `amount` is already net, so
       * the cash leg is `amount + fee` exactly as it always was. The affordability
       * threshold is the same number in both branches — `amount + fee` then,
       * `amount` now, both equal the committed total — which is why no goal
       * becomes newly affordable or unaffordable.
       */
      const deducted = feeAccountingOf(event) === 'deducted';
      const cashLeg = deducted ? amount.plus(fee) : amount;
      if (goal.cash.lt(cashLeg)) break;
      goal.cash = goal.cash.minus(cashLeg);
      goal.invested = goal.invested.plus(amount);
      if (deducted) ctx.totals.networkFees = ctx.totals.networkFees.plus(fee);
      ctx.totals.modeledNetworkFees = ctx.totals.modeledNetworkFees.plus(fee);
      ctx.positions.set(event.positionId, {
        s: {
          positionId: event.positionId,
          goalId: event.goalId,
          strategyId: event.strategyId,
          principal: event.amount,
          accrued: '0',
          enteredSimDay: event.simDay,
          accruedThroughSimDay: event.simDay,
          replayConsumedThroughSimDay: event.simDay,
          open: true,
        },
        principal: amount,
        accrued: ZERO,
      });
      break;
    }
    case 'AccrualApplied': {
      const position = ctx.positions.get(event.positionId);
      if (!position || !position.s.open) break;
      position.accrued = position.accrued.plus(d(event.earnings));
      position.s.accruedThroughSimDay = event.toSimDay;
      /* An accrual both replays and accrues, so it advances both cursors. Only
         `ReplaySpanRefused` moves consumption without accrual (§9). */
      position.s.replayConsumedThroughSimDay = event.toSimDay;
      const goal = ctx.goals.get(position.s.goalId);
      if (goal) goal.earnings = goal.earnings.plus(d(event.earnings));
      break;
    }
    /**
     * `5.105` I-G1d / §9: the span is CONSUMED, nothing is earned.
     *
     * Only the replay cursor moves. `accrued`, `principal` and the goal's
     * earnings are untouched, and `accruedThroughSimDay` stays where it was —
     * which is the whole point: the accrual claim must not advance over days
     * whose economics nobody can evidence. `reconcile()` sums `earnings` from
     * `AccrualApplied` alone, so conservation never sees this event.
     */
    case 'ReplaySpanRefused': {
      const position = ctx.positions.get(event.positionId);
      if (!position || !position.s.open) break;
      position.s.replayConsumedThroughSimDay = event.toSimDay;
      break;
    }
    case 'StrategyExited': {
      const position = ctx.positions.get(event.positionId);
      if (!position || !position.s.open) break;
      position.s.open = false;
      const goal = ctx.goals.get(event.goalId);
      const exitFee = d(event.exitFee);
      const networkFee = d(event.networkFee);
      const deductedExit = feeAccountingOf(event) === 'deducted';
      if (goal) {
        /* `5.403`: modelled fees return the FULL gross — "MONEY RETURNED = gross
           Practice value". Legacy events keep booking `gross − both fees`, so a
           returning user's history still replays to the cent it always did. */
        const returned = deductedExit
          ? d(event.grossAmount).minus(exitFee).minus(networkFee)
          : d(event.grossAmount);
        goal.invested = goal.invested.minus(position.principal);
        goal.cash = goal.cash.plus(returned);
      }
      if (deductedExit) {
        ctx.totals.exitFees = ctx.totals.exitFees.plus(exitFee);
        ctx.totals.networkFees = ctx.totals.networkFees.plus(networkFee);
      }
      ctx.totals.modeledExitFees = ctx.totals.modeledExitFees.plus(exitFee);
      ctx.totals.modeledNetworkFees = ctx.totals.modeledNetworkFees.plus(networkFee);
      break;
    }
    case 'RecurringSet': {
      // Latest set per position wins; '0' clears the schedule (C3, A-7).
      if (d(event.monthlyAmount).lte(0)) {
        ctx.recurring.delete(event.positionId);
      } else {
        ctx.recurring.set(event.positionId, {
          goalId: event.goalId,
          positionId: event.positionId,
          monthlyAmount: d(event.monthlyAmount).toFixed(2),
          startSimDay: event.startSimDay,
        });
      }
      break;
    }
    case 'RecurringContributionApplied': {
      // A MOVE: Working → the position's principal (auto-invest). Guarded
      // against an over-budget deposit the same way GoalFunded is (A-10) —
      // the client already bounds it, so this is belt-and-suspenders.
      const position = ctx.positions.get(event.positionId);
      if (!position || !position.s.open) break;
      const amount = d(event.amount);
      if (amount.lte(0) || ctx.working.v.lt(amount)) break;
      ctx.working.v = ctx.working.v.minus(amount);
      position.principal = position.principal.plus(amount);
      const goal = ctx.goals.get(event.goalId);
      if (goal) goal.invested = goal.invested.plus(amount);
      break;
    }
    case 'TimeAdvanced': {
      ctx.state.simDay += event.days;
      // Missing source ⇒ 'machine' (backward-compat, D-3): old ledgers don't retro-accrue.
      if ((event.source ?? 'machine') === 'real') ctx.state.realSettledDays += event.days;
      /* I-G1c: FIRST pin wins and is never rewritten — a later advance cannot
         slide the window the earlier ones were replayed against, which is what
         makes the context stable under a provider refresh (§7). */
      if (ctx.state.replayEpoch === null && event.replayEpoch !== undefined) {
        ctx.state.replayEpoch = event.replayEpoch;
      }
      break;
    }
  }
}
