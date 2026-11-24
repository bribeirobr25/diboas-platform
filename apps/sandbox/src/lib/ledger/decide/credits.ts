/**
 * S1a (plan P12): the credit-economy decisions — the Collect tap (row 17) and the one-time
 * comparison credit (row 18). Pure: state, ids and the clock come through `ctx`; the time of the
 * tap comes through `env` (a server supplies its own clock, Appendix A row 17).
 */
import Decimal from 'decimal.js';
import { comparisonCreditAmount, weeklyCreditAmount } from '../../growthConstants';
import { getCollectView } from '../../weeklyCycle';
import { stamp } from './stamp';
import { emitted, noop, type Decision, type DecisionContext, type Nothing } from './types';

export type CollectResult = { granted: number[]; ceilingPaused: boolean };

/**
 * The explicit Collect tap (W-5b): every collectible week as its own idempotent
 * `WeeklyCreditGranted`. The ceiling is checked at the tap (a calm pause, FT-19); the engine's
 * per-week guard makes a double tap harmless even beyond the synchronous in-memory log.
 */
export function decideCollectWeeklyCredits(
  _intent: Nothing,
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

/**
 * The one-time W-5c comparison credit. UNCONDITIONAL (founder B9, Q8; register 5.453): no entry
 * condition — a credit that required entering a strategy would be a funding incentive (CI-N2) —
 * and once per ledger, mirroring the engine's rule so the caller learns synchronously whether
 * anything happened.
 */
export function decideGrantComparisonCredit(
  _intent: Nothing,
  _env: Nothing,
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
