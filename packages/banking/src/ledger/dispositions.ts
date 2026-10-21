/**
 * ⚙ P8a · the ONLY sanctioned way to read the ledger's event log.
 *
 * `state.events` is the raw log — preserved exactly as recorded, refused events
 * included. Readers used to walk it directly, so an event the projection refused
 * (a cross-tab write the goal could not afford — register `5.485`, case 3) was
 * still counted by History, the charts, the month report, Home and the weekly
 * flow. Every reader now goes through these functions, and a guard test forbids
 * raw `state.events` reads anywhere else.
 *
 * APPLIED is not "changed a balance": valid zero-value markers stay APPLIED.
 */

import type { LedgerEvent } from './events';
import { dispositionsOf } from './engine';
import type { EventDisposition, RefusalReason, LedgerState } from './state';

export interface DispositionedEvent {
  event: LedgerEvent;
  disposition: EventDisposition;
}

/* `appliedEvents` and `dispositionsOf` live in `engine.ts` — `reconcile()` needs them there,
   and one definition serves both. */

/** Every event with its disposition, in log order. */
export function eventsWithDisposition(state: LedgerState): DispositionedEvent[] {
  const dispositions = dispositionsOf(state);
  return state.events.map((event, i) => ({ event, disposition: dispositions[i]! }));
}

/** The events the projection REFUSED, with the reason — diagnostics only, never shown as success. */
export function refusedEvents(state: LedgerState): { event: LedgerEvent; reason: RefusalReason }[] {
  return eventsWithDisposition(state).flatMap(({ event, disposition }) =>
    disposition.status === 'REFUSED' ? [{ event, reason: disposition.reason }] : []
  );
}
