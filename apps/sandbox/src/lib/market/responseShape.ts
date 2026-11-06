/**
 * The market routes' RESPONSE shapes, parsed (`5.353`, completed 2026-10-19).
 *
 * Pure — no React, no fetch — so the hook only fetches and a test can feed the REAL
 * routes' serialized output straight through the same checks the browser applies.
 * Each answers the first failing path, or `null`; the nested checks are the domain's
 * wire-format contracts (`@diboas/defi` `marketShape.ts`).
 */
import {
  apyHistoryListIssue,
  dataStampIssue,
  gasQuoteListIssue,
  isPlainRecord as isRecord,
  priceHistoryListIssue,
  protocolApyListIssue,
  type DisplayCurrency,
} from '@diboas/defi';

/**
 * `5.353`: the market response is PARSED at this seam, not asserted — every NESTED field
 * a consumer reads, through the domain's wire-format checks (`@diboas/defi`
 * `marketShape.ts`), and the currency must be the one REQUESTED. Answers the first failing
 * path, or `null`. Completed 2026-10-19: the first version checked only that `apys` and
 * `gas` were lists, so `apys: [null]` reached `strategyRateDisplay` and threw.
 *
 * The FX rate and its stamp come from one quote in the route (`usdcQuotes[0]`), so they
 * are present together or absent together; one without the other is an unprovenanced rate.
 */
export function marketResponseIssue(body: unknown, requested: DisplayCurrency): string | null {
  if (!isRecord(body)) return 'body';
  const b = body;
  if (b.currency !== requested) return 'currency';
  const listIssue = protocolApyListIssue(b.apys, 'apys') ?? gasQuoteListIssue(b.gas, 'gas');
  if (listIssue) return listIssue;
  if (
    b.usdPriceLocal !== null &&
    !(typeof b.usdPriceLocal === 'number' && Number.isFinite(b.usdPriceLocal))
  )
    return 'usdPriceLocal';
  if (b.usdPriceStamp !== null) {
    const stampIssue = dataStampIssue(b.usdPriceStamp, 'usdPriceStamp');
    if (stampIssue) return stampIssue;
  }
  if ((b.usdPriceLocal === null) !== (b.usdPriceStamp === null)) return 'usdPriceStamp';
  return null;
}

/**
 * `GET /api/market/history`: every nested series checked (known protocol, real calendar
 * days in strictly ascending order — the server builder's rule — finite values, a valid
 * stamp). `priceHistories` may be ABSENT (a cached response from before §4.8 — documented
 * compatibility); when present it is checked like `histories`.
 */
export function historyResponseIssue(body: unknown): string | null {
  if (!isRecord(body)) return 'body';
  return (
    apyHistoryListIssue(body.histories, 'histories') ??
    (body.priceHistories === undefined
      ? null
      : priceHistoryListIssue(body.priceHistories, 'priceHistories'))
  );
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UNAVAILABLE_REASONS = new Set([
  'NO_HISTORY',
  'NOT_OBSERVED',
  'STALE',
  'BASE_SPLIT_MISSING',
  'TOO_LITTLE_HISTORY',
]);
const finiteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const wholeDays = (v: unknown) => finiteNumber(v) && Number.isInteger(v) && v > 0;
const day = (v: unknown) => typeof v === 'string' && DAY_RE.test(v);

/**
 * PR 2 · `GET /api/market/rate-ranges` (`lib/rateRangesContract.ts`): every field the
 * projection reads — finite rates with low ≤ high, whole positive day counts, calendar days,
 * a known unavailable reason. A shape this code cannot use is an error (Case U), never data.
 */
export function rateRangesResponseIssue(body: unknown): string | null {
  if (!isRecord(body)) return 'body';
  if (!Array.isArray(body.strategies)) return 'strategies';
  for (const [i, raw] of body.strategies.entries()) {
    const at = `strategies[${i}]`;
    if (!isRecord(raw) || typeof raw.strategyId !== 'string') return `${at}.strategyId`;
    if (raw.available === false) {
      if (!UNAVAILABLE_REASONS.has(raw.reason as string)) return `${at}.reason`;
      continue;
    }
    if (raw.available !== true) return `${at}.available`;
    for (const k of ['lowPercent', 'highPercent', 'todayPercent'] as const)
      if (!finiteNumber(raw[k])) return `${at}.${k}`;
    if ((raw.lowPercent as number) > (raw.highPercent as number)) return `${at}.highPercent`;
    if (!wholeDays(raw.observedDays)) return `${at}.observedDays`;
    for (const k of ['windowStart', 'windowEnd', 'oldestLegAsOf'] as const)
      if (!day(raw[k])) return `${at}.${k}`;
  }
  const a = body.aggregate;
  if (!isRecord(a) || typeof a.available !== 'boolean') return 'aggregate';
  if (a.available) {
    if (!finiteNumber(a.lowPercent)) return 'aggregate.lowPercent';
    if (!finiteNumber(a.highPercent) || a.highPercent < a.lowPercent)
      return 'aggregate.highPercent';
    if (!wholeDays(a.observedDays)) return 'aggregate.observedDays';
  }
  return null;
}
