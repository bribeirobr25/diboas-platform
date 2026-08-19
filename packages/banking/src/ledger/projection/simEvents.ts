/**
 * §2.4 D-s simulated-event appliers: the `spent` term's producer + the
 * `source='system'` income leg. Semantics unchanged by the P2BD-4 extraction —
 * bodies verbatim from the former `project()` cases.
 */

import type { SimulatedExpensePaid, SimulatedIncomeReceived } from '../events';
import { d } from '../money';
import type { ProjectionContext } from './context';

export type SimulatedEvent = SimulatedExpensePaid | SimulatedIncomeReceived;

export function applySimulatedEvent(ctx: ProjectionContext, event: SimulatedEvent): void {
  switch (event.type) {
    case 'SimulatedExpensePaid': {
      // Idempotent per instance (D-s §3) + the affordability floor: a debit
      // larger than Available is skipped — no negative balances, ever. Money
      // leaves the system permanently (egress → `spent`, never in `held`).
      if (ctx.state.resolvedEventInstances.includes(event.eventInstanceId)) break;
      const amount = d(event.amount);
      if (amount.lte(0) || ctx.working.v.lt(amount)) break;
      ctx.state.resolvedEventInstances.push(event.eventInstanceId);
      ctx.working.v = ctx.working.v.minus(amount);
      ctx.totals.spent = ctx.totals.spent.plus(amount);
      break;
    }
    case 'SimulatedIncomeReceived': {
      // Idempotent per instance. Ingress → `credited`, lands in Available.
      // Never gated by the weekly-credit pauses (RD-9): its ceiling effect is
      // indirect — a raised base pauses FUTURE weekly credits, honestly.
      if (ctx.state.resolvedEventInstances.includes(event.eventInstanceId)) break;
      const amount = d(event.amount);
      if (amount.lte(0)) break;
      ctx.state.resolvedEventInstances.push(event.eventInstanceId);
      ctx.working.v = ctx.working.v.plus(amount);
      ctx.totals.credited = ctx.totals.credited.plus(amount);
      break;
    }
  }
}
