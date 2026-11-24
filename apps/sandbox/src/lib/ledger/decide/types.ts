/**
 * S1a (plan P12, D2–D4, D6): the contract every ledger decision follows.
 *
 * A decision is a pure function `decideX(intent, env, ctx)`: the person's intent, the values the
 * environment supplies, and a context through which it reads state, draws ids and reads the clock
 * at exactly the points today's command does. It returns what to append and what effects to run;
 * the adapter (the command under its old name in `lib/ledger/*.ts`) does the writing. The browser
 * supplies `ctx` today (`browserContext.ts`); a server will supply its own (S2b).
 */
import type { LedgerEvent, LedgerState } from '@diboas/banking';

export interface DecisionContext {
  /** The current state; lazy, read where today's code reads it (D3). */
  readState(): LedgerState;
  /** A new id, drawn where today's code draws one. */
  newId(): string;
  /** The clock as an ISO instant, read where today's code reads it. */
  clock(): string;
}

/**
 * Why a decision appended nothing (D4), or the notes on what it withheld while still appending.
 * One naming style (camelCase); where a command's result already carries a reason (rows 15 and
 * 19), the outcome's reason is that same value.
 */
export type Outcome<Reason extends string = string> =
  { kind: 'emitted'; notes?: readonly string[] } | { kind: 'noop'; reason: Reason };

/** A domain fact the adapter records outside the ledger (D6), never a store call. */
export type Effect =
  | { type: 'ProposalDeclined'; weekSet: number[] }
  | {
      type: 'SimulatedEventResolved';
      eventInstanceId: string;
      eventType: string;
      choice: 'useReserve' | 'split' | 'coverFromAvailable';
      /** The action's correlation id, so S2b can tie the effect to the events (D6, P2). */
      correlationId: string;
    };

export interface Decision<Result, Reason extends string = string> {
  result: Result;
  outcome: Outcome<Reason>;
  /** The events to append, or null when nothing is appended. */
  append: LedgerEvent[] | null;
  effects: readonly Effect[];
}

export const emitted = <Result>(
  result: Result,
  append: LedgerEvent[] | null,
  effects: readonly Effect[] = [],
  notes?: readonly string[]
): Decision<Result, never> => ({
  result,
  outcome: notes?.length ? { kind: 'emitted', notes } : { kind: 'emitted' },
  append,
  effects,
});

export const noop = <Result, Reason extends string>(
  result: Result,
  reason: Reason
): Decision<Result, Reason> => ({
  result,
  outcome: { kind: 'noop', reason },
  append: null,
  effects: [],
});
