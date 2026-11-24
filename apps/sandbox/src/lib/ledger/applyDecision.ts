/**
 * S1a (plan P12, D6): the browser adapter's one job — write what a decision decided.
 *
 * Appends the decision's events, then runs its effects through today's stores, then returns its
 * result. Effects run only after the append returned: an append that throws leaves them unrun
 * (sabotage (k)). Every effect type is handled here; the `never` check makes a new one a compile
 * error until it is.
 */
import { recordDecline } from '../proposalStore';
import { recordResolution } from '../simulatedEventStore';
import { browserContext } from './browserContext';
import { appendAll } from './core';
import type { Decision, Effect } from './decide/types';

function runEffect(effect: Effect): void {
  switch (effect.type) {
    case 'ProposalDeclined':
      recordDecline(effect.weekSet);
      return;
    case 'SimulatedEventResolved':
      // The correlation id is for a server (D6); today's store keeps the record it always kept,
      // stamped at this moment.
      recordResolution({
        eventInstanceId: effect.eventInstanceId,
        eventType: effect.eventType,
        choice: effect.choice,
        resolvedAt: browserContext.clock(),
      });
      return;
    default: {
      const unhandled: never = effect;
      throw new Error(`Unhandled ledger effect: ${JSON.stringify(unhandled)}`);
    }
  }
}

export function applyDecision<Result>(decision: Decision<Result, string>): Result {
  if (decision.append) appendAll(decision.append);
  for (const effect of decision.effects) runEffect(effect);
  return decision.result;
}
