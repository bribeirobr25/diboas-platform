/**
 * etf-coverage.mjs — what the ETF-01 share-count ledger holds (2026-10-19).
 *
 * Pure helpers, kept apart from `etf-flows.mjs` so the suspension record and
 * the data-status panel can use them without an import cycle. They separate
 * three things a single "N snapshots on record" used to blur: how many RECORDS
 * the ledger has, how many are COMPLETE, and the conventional Friday ANCHOR of
 * the latest record and of the latest complete one. None of them is an
 * observation date: the route provides none for the share counts.
 */

/** @typedef {import('./etf-flows.mjs').EtfSnapshot} EtfSnapshot */

const isPositive = (x) => Number.isFinite(x) && x > 0;

/**
 * The funds a record lacks a usable share count or price for.
 *
 * @param {EtfSnapshot} snap
 * @returns {{shares: string[], price: string[]}}
 */
export function missingFields(snap) {
  const funds = Object.entries(snap?.funds ?? {});
  return {
    shares: funds.filter(([, f]) => !isPositive(f?.shares)).map(([t]) => t),
    price: funds.filter(([, f]) => !isPositive(f?.price)).map(([t]) => t),
  };
}

/**
 * COMPLETE = the record lists at least one fund, and every fund it lists has a
 * positive share count AND a positive price (2026-10-19). Completeness says the
 * fields are filled. It does NOT say the share counts are current (for most
 * funds this route returns figures that move once a quarter) or that the
 * method is fit for a weekly read: that is why ETF-01 is suspended.
 *
 * @param {EtfSnapshot} snap
 */
export function isCompleteSnapshot(snap) {
  const m = missingFields(snap);
  return Object.keys(snap?.funds ?? {}).length > 0 && !m.shares.length && !m.price.length;
}

/**
 * What the ledger holds, kept apart on purpose: how many RECORDS, how many are
 * COMPLETE, and the conventional Friday anchors of the latest record and of the
 * latest complete one. None of these is an observation date: the route
 * provides none for the share counts.
 *
 * @param {EtfSnapshot[]} snapshots
 */
export function ledgerCoverage(snapshots) {
  const complete = snapshots.filter(isCompleteSnapshot);
  const latest = snapshots[snapshots.length - 1] ?? null;
  return {
    records: snapshots.length,
    complete: complete.length,
    latestRecordAnchor: latest?.anchor ?? null,
    latestRecordComplete: latest ? isCompleteSnapshot(latest) : false,
    latestCompleteAnchor: complete.length ? complete[complete.length - 1].anchor : null,
  };
}
