/**
 * etf-suspension.mjs — the ETF-01 operational suspension (founder decision
 * 2026-10-18, the 2026-10-19 cycle package).
 *
 * WHY THIS EXISTS. The route that feeds ETF-01 cannot support a weekly reading.
 * The Polygon/Massive ticker-overview endpoint returns, for 10 of the 11 funds,
 * share counts that stay constant or move once a quarter (they match the SEC
 * report cover pages), and its documented contract carries no observation date
 * for the count at all. So "≥3 of the last 4 weekly aggregates positive" was in
 * practice measuring one fund (IBIT), and the per-fund age guard in
 * `etf-flows.mjs` could never fire because `last_updated_utc` is not a field of
 * that endpoint. Local, untracked evidence: `docs/audit/ADELAIDE_MARKET_
 * DIAGNOSTICO_FACTUAL_2026-10-17.md` §E.3.
 *
 * WHAT IT DOES. While `ETF01_SUSPENSION.active` is true, ETF-01 is UNAVAILABLE
 * with `values.variant: 'suspended'` and contributes 0 points, through the
 * engine's EXISTING treatment of UNAVAILABLE. Weights, thresholds, bands and
 * the 14-point scale are unchanged: methodology stays v1.1.0, and no
 * renormalisation happens anywhere.
 *
 * WHAT IT DOES NOT DO.
 *   * It does not stop collection. The weekly snapshot keeps being appended to
 *     the ledger, so the evidence keeps accumulating for a later decision.
 *   * It does not end by itself. A successful collection, a clean ledger or a
 *     healthy flow window never reactivates the signal. Reactivation is an
 *     explicit founder decision, made by changing this file in a reviewed PR,
 *     backed by a data route that can support a weekly evaluation.
 *   * It does not touch history. Earlier archive lines and published cycles keep
 *     the state they were computed with.
 */
import { WARMUP_SNAPSHOTS, ETF01_WEIGHT, ETF_VARIANT } from './regime-engine.mjs';

export const ETF01_SUSPENSION = Object.freeze({
  active: true,
  /** Date of the founder decision that introduced the suspension. */
  decidedOn: '2026-10-18',
  /** The first weekly cycle computed under it. */
  firstCycle: '2026-10-19',
  reason:
    'The data route cannot support a weekly evaluation: share counts for 10 of 11 funds are ' +
    'quarterly report figures and the endpoint provides no observation date for them.',
  endCondition:
    'An explicit founder decision to reactivate, backed by a data route that supports a ' +
    'weekly evaluation. A successful collection alone never reactivates ETF-01.',
  reference: 'docs/integrations/market-editorial.md § "ETF-01 suspension"',
});

/**
 * The ETF-01 record while the suspension is active.
 *
 * `snapshots`/`warmupTarget` stay populated for the same reason as the gapped
 * variant (5.133): every UNAVAILABLE record must carry the slots its fallback
 * sentence references. The generator no longer falls back silently (a declared
 * variant missing a locale now throws), but the slots keep the record shape
 * uniform for `archiveSignals` and the data-status panel.
 *
 * @param {Array<{anchor: string}>} snapshots — the ledger, as collected
 */
export function suspendedEtfSignal(snapshots) {
  const count = snapshots.length;
  return {
    id: 'ETF-01',
    state: 'UNAVAILABLE',
    weight: ETF01_WEIGHT,
    detail:
      `ETF-01 suspended since the ${ETF01_SUSPENSION.firstCycle} cycle (decision ` +
      `${ETF01_SUSPENSION.decidedOn}): the share-count route cannot support a weekly ` +
      `evaluation. Scored unavailable (0 points), not weak. Collection continues ` +
      `(${count} weekly snapshots on record); only an explicit decision reactivates it.`,
    values: {
      snapshots: count,
      warmupTarget: WARMUP_SNAPSHOTS,
      variant: ETF_VARIANT.SUSPENDED,
      suspendedSince: ETF01_SUSPENSION.firstCycle,
    },
    anchor: count ? snapshots[count - 1].anchor : null,
    anchorKind: 'weekly',
  };
}

/** True when a computed/archived ETF-01 record is the suspension record. */
export function isSuspendedEtf(signal) {
  return signal?.id === 'ETF-01' && signal?.values?.variant === ETF_VARIANT.SUSPENDED;
}
