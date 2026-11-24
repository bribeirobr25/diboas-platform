/**
 * S1a (plan P12): the credit-economy decisions — the Collect tap (row 17) and the one-time
 * comparison credit (row 18). Pure: state, ids and the clock come through `ctx`, the time the tap
 * happened through `env` (a server supplies its own clock, Appendix A row 17).
 */
import Decimal from 'decimal.js';
import { comparisonCreditAmount, weeklyCreditAmount } from '../../growthConstants';
import { getCollectView } from '../../weeklyCycle';
import { stamp } from './stamp';
import { emitted, noop, type Decision, type DecisionContext } from './types';

export type CollectResult = { granted: number[]; ceilingPaused: boolean };

export function decideCollectWeeklyCredits(
  env: { nowIso: string },
  ctx: DecisionContext
): Decision<CollectResult, 'notInitialized' | 'ceilingPaused' | 'nothingDue'> {
  const state = ctx.readState();
  if (!state.initialized) return noop({ granted: [], ceilingPaused: false }, 'notInitialized');
  const view = getCollectView(state, env.nowIso);
  if (view.ceilingPaused || view.weeks.length === 0)
    return noop(
      { granted: [], ceilingPaused: view.ceilingPaused },
      view.ceilingPaused ? 'ceilingPaused' : 'nothingDue'
    );
  const amount = new Decimal(weeklyCreditAmount(state.mode)).toFixed(2);
  const correlationId = ctx.newId();
  return emitted(
    { granted: view.weeks, ceilingPaused: false },
    view.weeks.map((week) => ({
      ...stamp(correlationId, ctx),
      type: 'WeeklyCreditGranted' as const,
      week,
      amount,
    }))
  );
}

export function decideGrantComparisonCredit(
  ctx: DecisionContext
): Decision<boolean, 'notInitialized' | 'alreadyCredited'> {
  const state = ctx.readState();
  if (!state.initialized) return noop(false, 'notInitialized');
  if (state.comparisonCredited) return noop(false, 'alreadyCredited');
  return emitted(true, [
    {
      ...stamp(ctx.newId(), ctx),
      type: 'ComparisonCreditGranted',
      amount: new Decimal(comparisonCreditAmount(state.mode)).toFixed(2),
    },
  ]);
}
