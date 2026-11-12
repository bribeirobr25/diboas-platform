/**
 * exceptions.mjs — the reviewed exceptions that may unblock a check
 * (`market/checks/accepted-exceptions.json` in the store).
 *
 * An exception is bound to the exact thing it resolves, so it can never cover
 * a different fault that later lands on the same day:
 *
 *   kind "check"         series, date, source (the check provider), and
 *                        primary: the stored value the person reviewed. A
 *                        different value on that day is NOT covered.
 *   kind "distribution"  series, date, and action "store" with an amount that
 *                        one of the sources reported, or action "drop" (a
 *                        distribution a source lists that did not happen).
 *   kind "revision"      series, date, stored and fetched values, decision
 *                        "keep": the stored value stays.
 *
 * Every entry needs `reviewed_on` (ISO date) and a written `reason` of at
 * least REASON_MIN_CHARS characters. A file that breaks any rule stops the
 * whole run (fail closed): an unreadable list of exceptions must never be read
 * as "no exceptions" or as "everything accepted".
 */

import { sameAmount } from './checks.mjs';

export const REASON_MIN_CHARS = 30;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const SAME = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a / b - 1) <= 1e-9;

/** @returns {object[]} validated entries; throws naming the first bad one. */
export function parseExceptions(text) {
  let list;
  try {
    list = JSON.parse(text);
  } catch (e) {
    throw new Error(`EXCEPTIONS: not valid JSON (${e.message})`, { cause: e });
  }
  if (!Array.isArray(list)) throw new Error('EXCEPTIONS: the file must hold an array');
  list.forEach((x, i) => {
    const bad = (why) => {
      throw new Error(`EXCEPTIONS: entry ${i} (${x?.series} ${x?.date}): ${why}`);
    };
    if (typeof x?.series !== 'string' || !x.series) bad('no series');
    if (!ISO.test(x.date ?? '')) bad('date must be YYYY-MM-DD');
    if (!ISO.test(x.reviewed_on ?? '')) bad('reviewed_on must be YYYY-MM-DD');
    if (typeof x.reason !== 'string' || x.reason.trim().length < REASON_MIN_CHARS)
      bad(`reason must be a sentence of at least ${REASON_MIN_CHARS} characters`);
    if (x.kind === 'check') {
      if (typeof x.source !== 'string' || !x.source) bad('a check exception names its source');
      if (!Number.isFinite(x.primary)) bad('a check exception states the reviewed primary value');
    } else if (x.kind === 'distribution') {
      if (x.action === 'store') {
        if (!Number.isFinite(x.amount) || x.amount <= 0)
          bad('a stored distribution needs a positive amount');
      } else if (x.action !== 'drop') bad('distribution action must be "store" or "drop"');
    } else if (x.kind === 'revision') {
      if (x.decision !== 'keep') bad('the only revision decision is "keep"');
      if (!Number.isFinite(x.stored) || !Number.isFinite(x.fetched))
        bad('a revision states stored and fetched');
    } else bad('kind must be "check", "distribution" or "revision"');
  });
  return list;
}

/** The exception that resolves one check outlier, if any. */
export function checkException(list, series, source, outlier) {
  return list.find(
    (x) =>
      x.kind === 'check' &&
      x.series === series &&
      x.date === outlier.date &&
      x.source === source &&
      SAME(x.primary, outlier.primary)
  );
}

/**
 * The exception that resolves one distribution outlier, if any. A "store"
 * amount must be one a source actually reported that day.
 */
export function distributionException(list, series, outlier) {
  const x = list.find(
    (e) => e.kind === 'distribution' && e.series === series && e.date === outlier.date
  );
  if (!x) return null;
  if (x.action === 'drop') return x;
  return outlier.seen?.some((s) => sameAmount(s.amount, x.amount) && SAME(s.amount, x.amount))
    ? x
    : null;
}

/** Dates of a series whose changed value a person reviewed and kept. */
export function keptRevisionDates(list, series, revisions) {
  return new Set(
    revisions
      .filter((r) =>
        list.some(
          (x) =>
            x.kind === 'revision' &&
            x.series === series &&
            x.date === r.date &&
            SAME(x.stored, r.stored) &&
            SAME(x.fetched, r.fetched)
        )
      )
      .map((r) => r.date)
  );
}
