/**
 * S1a (plan P12, D7): the event stamp, an exact mirror of `base()` in `core.ts`. The id is drawn,
 * then state is read (lazily, so a command whose first read is here keeps it after its id draws),
 * then the clock: same fields, same order.
 */
import type { DecisionContext } from './types';

export function stamp(correlationId: string, ctx: DecisionContext) {
  return {
    eventId: ctx.newId(),
    simDay: ctx.readState().simDay,
    recordedAt: ctx.clock(),
    correlationId,
  };
}
