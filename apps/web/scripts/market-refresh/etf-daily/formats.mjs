/**
 * formats.mjs — the value formats the daily ETF route accepts, defined once (E1, 2026-10-21).
 *
 * The normaliser, the ledger validator and the calendar used to each carry
 * their own copy of these patterns, and two of them disagreed on what a valid
 * amount is. One definition each, here.
 */

/** A calendar day, `YYYY-MM-DD` (shape only; `isRealDay` checks it exists). */
export const ISO_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A fund ticker as the providers and the universe write it. */
export const TICKER_PATTERN = /^[A-Z]{2,6}$/;

/**
 * An instant in UTC with an explicit `Z`. A time without a zone is read as
 * LOCAL time by `Date.parse`, so the same ledger could decide differently on
 * two machines; it is refused instead.
 */
const UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** Milliseconds of a strict UTC instant, or NaN when it is not one. */
export function parseUtcInstant(text) {
  return typeof text === 'string' && UTC_INSTANT_PATTERN.test(text) ? Date.parse(text) : NaN;
}

/** A net flow the ledger can store exactly: a safe integer number of US dollars. */
export const isValidFlowUsd = (value) => Number.isSafeInteger(value);
