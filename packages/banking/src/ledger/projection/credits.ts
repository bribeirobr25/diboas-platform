/**
 * §2.3 credit-economy appliers (WG-1 + W-5c): the `credited` term's producers.
 * Semantics unchanged by the P2BD-4 extraction — bodies verbatim from the
 * former `project()` cases.
 */

import type { ComparisonCreditGranted, WeeklyCreditGranted } from '../events';
import { d } from '../money';
import type { ProjectionContext } from './context';

export type CreditEvent = WeeklyCreditGranted | ComparisonCreditGranted;

export function applyCreditEvent(ctx: ProjectionContext, event: CreditEvent): void {
  switch (event.type) {
    case 'WeeklyCreditGranted': {
      // Idempotent per week (WG-1): a duplicate week is a clean no-op, so a
      // double-fired Collect tap can never mint a second credit for the same
      // week. Ingress → `credited`; lands in Available (working).
      if (ctx.state.collectedWeeks.includes(event.week)) break;
      ctx.state.collectedWeeks.push(event.week);
      ctx.totals.credited = ctx.totals.credited.plus(d(event.amount));
      ctx.working.v = ctx.working.v.plus(d(event.amount));
      break;
    }
    case 'ComparisonCreditGranted': {
      // Both W-5c guards live HERE, not only on the offer surface (P2BD-10):
      // once per ledger, and never before the first strategy entry (the
      // comparison-learning covenant — there is nothing to compare yet).
      if (ctx.state.comparisonCredited || ctx.positions.size === 0) break;
      ctx.state.comparisonCredited = true;
      ctx.totals.credited = ctx.totals.credited.plus(d(event.amount));
      ctx.working.v = ctx.working.v.plus(d(event.amount));
      break;
    }
  }
}
