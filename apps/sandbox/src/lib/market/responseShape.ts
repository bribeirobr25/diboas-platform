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
