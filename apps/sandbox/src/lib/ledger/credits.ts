/**
 * §2.3 credit-economy actions: the explicit Collect tap (WG-1) + the one-time
 * W-5c comparison credit (P2BD-4 extraction). Composed over the `ledger/core`
 * seam; consumed via the `ledgerClient` barrel. Semantics unchanged.
 */

import { browserContext } from './browserContext';
import { appendAll } from './core';
import { decideCollectWeeklyCredits, decideGrantComparisonCredit } from './decide/credits';

/**
 * The explicit Collect tap (W-5b): grant every collectible week as its own
 * idempotent `WeeklyCreditGranted`. The ceiling is checked at the tap (calm
 * pause, FT-19); the engine's per-week guard makes a double-tap harmless even
 * beyond the synchronous in-memory log. Returns what happened so the surface
 * can narrate it honestly. The decision is `decideCollectWeeklyCredits` (S1a).
 */
export function collectWeeklyCredits(nowIso = new Date().toISOString()): {
  granted: number[];
  ceilingPaused: boolean;
} {
  const decision = decideCollectWeeklyCredits({ nowIso }, browserContext);
  if (decision.append) appendAll(decision.append);
  return decision.result;
}

/**
 * The one-time W-5c comparison credit. UNCONDITIONAL (founder B9, Q8; register 5.453): no entry
 * condition — a credit that required entering a strategy would be a funding incentive (CI-N2) —
 * and once per ledger. The engine enforces the once-per-ledger rule; this mirrors it so the caller
 * learns synchronously whether anything happened. Still unreachable: no screen offers it until a
 * separate product decision (E5); the offer framing rules (never pre-announced, never a reward)
 * bind that surface. The decision is `decideGrantComparisonCredit` (S1a).
 */
export function grantComparisonCredit(): boolean {
  const decision = decideGrantComparisonCredit(browserContext);
  if (decision.append) appendAll(decision.append);
  return decision.result;
}
