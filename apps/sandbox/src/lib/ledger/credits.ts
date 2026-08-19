/**
 * §2.3 credit-economy actions: the explicit Collect tap (WG-1) + the one-time
 * W-5c comparison credit (P2BD-4 extraction). Composed over the `ledger/core`
 * seam; consumed via the `ledgerClient` barrel. Semantics unchanged.
 */

import Decimal from 'decimal.js';
import { comparisonCreditAmount, weeklyCreditAmount } from '../growthConstants';
import { generateId } from '../ids';
import { getCollectView } from '../weeklyCycle';
import { appendAll, base, getLedgerState } from './core';

/**
 * The explicit Collect tap (W-5b): grant every collectible week as its own
 * idempotent `WeeklyCreditGranted`. The ceiling is checked at the tap (calm
 * pause, FT-19); the engine's per-week guard makes a double-tap harmless even
 * beyond the synchronous in-memory log. Returns what happened so the surface
 * can narrate it honestly.
 */
export function collectWeeklyCredits(nowIso = new Date().toISOString()): {
  granted: number[];
  ceilingPaused: boolean;
} {
  const state = getLedgerState();
  if (!state.initialized) return { granted: [], ceilingPaused: false };
  const view = getCollectView(state, nowIso);
  if (view.ceilingPaused || view.weeks.length === 0)
    return { granted: [], ceilingPaused: view.ceilingPaused };
  const amount = new Decimal(weeklyCreditAmount(state.mode)).toFixed(2);
  const correlationId = generateId();
  appendAll(
    view.weeks.map((week) => ({
      ...base(correlationId),
      type: 'WeeklyCreditGranted' as const,
      week,
      amount,
    }))
  );
  return { granted: view.weeks, ceilingPaused: false };
}

/**
 * The one-time W-5c comparison credit. The engine enforces both covenant
 * guards (once per ledger, only after the first strategy entry); this mirrors
 * them so the caller learns synchronously whether anything happened. The offer
 * SURFACE (never pre-announced, never a reward — the binding framing rules)
 * rides the §4 screens.
 */
export function grantComparisonCredit(): boolean {
  const state = getLedgerState();
  if (!state.initialized || state.comparisonCredited || state.positions.length === 0) return false;
  appendAll([
    {
      ...base(generateId()),
      type: 'ComparisonCreditGranted',
      amount: new Decimal(comparisonCreditAmount(state.mode)).toFixed(2),
    },
  ]);
  return true;
}
