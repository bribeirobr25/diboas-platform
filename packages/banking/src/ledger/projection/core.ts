/**
 * Core-journey appliers (the original MVP-0 block): grant, jobs split, goal
 * create/fund, strategy enter/accrue/exit, recurring, time. Semantics are
 * UNCHANGED by the P2BD-4 extraction — each body is the former `project()`
 * case, verbatim, over the shared context.
 */

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
  | TimeAdvanced;

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
      if (goal.cash.lt(amount.plus(fee))) break;
      goal.cash = goal.cash.minus(amount).minus(fee);
      goal.invested = goal.invested.plus(amount);
      ctx.totals.networkFees = ctx.totals.networkFees.plus(fee);
      ctx.positions.set(event.positionId, {
        s: {
          positionId: event.positionId,
          goalId: event.goalId,
          strategyId: event.strategyId,
          principal: event.amount,
          accrued: '0',
          enteredSimDay: event.simDay,
          accruedThroughSimDay: event.simDay,
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
      const goal = ctx.goals.get(position.s.goalId);
      if (goal) goal.earnings = goal.earnings.plus(d(event.earnings));
      break;
    }
    case 'StrategyExited': {
      const position = ctx.positions.get(event.positionId);
      if (!position || !position.s.open) break;
      position.s.open = false;
      const goal = ctx.goals.get(event.goalId);
      if (goal) {
        const net = d(event.grossAmount).minus(d(event.exitFee)).minus(d(event.networkFee));
        goal.invested = goal.invested.minus(position.principal);
        goal.cash = goal.cash.plus(net);
      }
      ctx.totals.exitFees = ctx.totals.exitFees.plus(d(event.exitFee));
      ctx.totals.networkFees = ctx.totals.networkFees.plus(d(event.networkFee));
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
      break;
    }
  }
}
