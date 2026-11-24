/**
 * §2.3 credit-economy actions: the explicit Collect tap (WG-1) + the one-time
 * W-5c comparison credit (P2BD-4 extraction). Composed over the `ledger/core`
 * seam; consumed via the `ledgerClient` barrel. Since S1a (plan P12) each is an
 * adapter: the rule is in `decide/credits.ts`. Semantics unchanged.
 */

import { applyDecision } from './applyDecision';
import { browserContext } from './browserContext';
import {
  decideCollectWeeklyCredits,
  decideGrantComparisonCredit,
  type CollectResult,
} from './decide/credits';
import { NOTHING } from './decide/types';

/**
 * The explicit Collect tap (W-5b). Returns what happened so the surface can
 * narrate it honestly. Decision: `decideCollectWeeklyCredits`.
 */
export function collectWeeklyCredits(nowIso = new Date().toISOString()): CollectResult {
  return applyDecision(decideCollectWeeklyCredits(NOTHING, { nowIso }, browserContext));
}

/**
 * The one-time W-5c comparison credit (unconditional, once per ledger; CI-N2).
 * Still unreachable: no screen offers it until a separate product decision
 * (E5); the offer framing rules (never pre-announced, never a reward) bind that
 * surface. Decision: `decideGrantComparisonCredit`.
 */
export function grantComparisonCredit(): boolean {
  return applyDecision(decideGrantComparisonCredit(NOTHING, NOTHING, browserContext));
}
