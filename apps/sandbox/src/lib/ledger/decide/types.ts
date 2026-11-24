/**
 * S1a (plan P12, D2–D4, D6): the contract every ledger decision follows.
 *
 * A decision is a pure function `decideX(intent, env, ctx)`:
 * - `intent`: what the person asked for;
 * - `env`: values the environment supplies, which a server will source itself (plan Appendix A,
 *   the table S1c consumes);
 * - `ctx`: how it reads state, draws ids and reads the clock, at exactly the points today's
 *   command does.
 * It returns what to append and which effects to run; the adapter (the command under its old name
 * in `lib/ledger/*.ts`, through `applyDecision`) does the writing. The browser supplies `ctx` today
 * (`browserContext.ts`); a server will supply its own (S2b).
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

/** The intent or environment of a command that has none (rows 17 and 18: the tap is the intent). */
export type Nothing = Readonly<Record<string, never>>;
export const NOTHING: Nothing = {};

/**
 * What a decision withheld or dropped while still appending (D4). The names are the plan's.
 * - `fundingWithheld:insufficientAvailable` / `fundingWithheld:invalidAmount`: `createGoal` created
 *   the goal but not its funding leg (Available could not cover it / the amount was negative or
 *   not finite; a zero amount asks for no funding and gets no note).
 * - `weeksAppliedWithoutFunding`: `applyRuleProposal` marked the weeks applied with no funding leg
 *   (every line was zero, or there were none).
 * - `linesDropped`: `applyRuleProposal` funded some lines but not every line of the proposal (a
 *   paused diversion, or a line of zero).
 */
export type Note =
  | 'fundingWithheld:insufficientAvailable'
  | 'fundingWithheld:invalidAmount'
  | 'weeksAppliedWithoutFunding'
  | 'linesDropped';

/**
 * The decision's outcome (D4): `emitted` (it decided something happens: events to append, effects
 * to run, or both) or `noop` with the reason nothing happens. One naming style (camelCase); where a
 * command's result already carries a reason (rows 15 and 19), the outcome's reason is that value.
 */
export type Outcome<Reason extends string = string> =
  { kind: 'emitted'; notes?: readonly Note[] } | { kind: 'noop'; reason: Reason };

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
  /**
   * The events to append, or null when nothing is appended: on every `noop`, and on an `emitted`
   * decision whose whole effect is outside the ledger (the decline, row 16 — a server must not
   * read `append === null` as "nothing to save", D6).
   */
  append: LedgerEvent[] | null;
  effects: readonly Effect[];
}

export const emitted = <Result>(
  result: Result,
  append: LedgerEvent[] | null,
  effects: readonly Effect[] = [],
  notes?: readonly Note[]
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
