/**
 * archive.mjs — the ONE definition of a `run-archive.jsonl` line (PENDING_ALL 5.187a).
 *
 * WHY THIS EXISTS. Two entry points append to the run archive — the weekly
 * pipeline (`run.mjs`) and the manual verification CLI
 * (`data-fetchers/compute-regime.mjs`) — and they wrote DIFFERENT shapes. The
 * CLI destructured `{id, state, weight, detail, anchor, anchorKind}` and
 * silently dropped `points` and `values`.
 *
 * That is not cosmetic. `state-lead.mjs#priorRunSignals` reads this archive to
 * choose the /market/backdrop beats, and `signalSlots(sig, locale, prior)`
 * fills `{priorGapAbsPrecise}` / `{priorClosePrecise}` from `prior.values`.
 * `renderTemplate` THROWS on any slot resolving to '' (the 2026-07-11
 * empty-slot rule: never publish "the dollar closed at "). So a values-less
 * line as the most recent prior run day, on a week when a macro condition
 * flips, stops the weekly automation — fail-closed, but broken.
 *
 * It is not hypothetical drift either: the committed ledger already holds
 * three historical shapes (2026-07-11 line 1 has no `pipeline`, no `points`,
 * no `values`; line 2 gained `pipeline` + `points`; current has all three).
 *
 * Principle 4: one shape, one definition, both callers. Adding a field here
 * reaches every writer at once, which is the whole point.
 */

import { WARMUP_SNAPSHOTS } from './regime-engine.mjs';

/**
 * Canonical per-signal archive shape. Also the shape `computed.json#signals`
 * uses — they are the same record, and keeping one producer is what stops the
 * archive and the machine-truth file from drifting apart.
 *
 * @param {Array} signals — raw engine output (evaluate* results, concatenated)
 * @param {{etfSnapshotCount?: number}} io — ledger depth, for the ETF warm-up case
 */
export function archiveSignals(signals, { etfSnapshotCount = 0 } = {}) {
  return signals.map(
    ({ id, state, weight, detail, values = null, anchor = null, anchorKind = null }) => ({
      id,
      state,
      weight,
      points: state === 'ACTIVE' ? weight : 0,
      detail,
      // Structured values feed the Stage-4 template generator (never re-parsed
      // from `detail`). The ETF UNAVAILABLE branch carries no engine values, so
      // the warm-up slots its sentence templates reference are injected here —
      // without them `renderTemplate` throws (5.133).
      values:
        id === 'ETF-01' && state === 'UNAVAILABLE'
          ? { snapshots: etfSnapshotCount, warmupTarget: WARMUP_SNAPSHOTS }
          : values,
      anchor,
      anchorKind,
    })
  );
}

/** The canonical archive line. `btc_append` is null for entry points that never append. */
export function archiveLine({
  runAt,
  pipeline,
  score,
  regimeCode,
  groupTotals,
  published,
  anchorSpreadDays,
  anchorWarning,
  btcAppend = null,
  signals,
}) {
  return {
    run_at: runAt,
    pipeline,
    computed: { score, regime_code: regimeCode, group_totals: groupTotals },
    published: published ? { score: published.score, regime_code: published.regime_code } : null,
    anchor_spread_days: anchorSpreadDays,
    anchor_warning: anchorWarning,
    btc_append: btcAppend,
    signals,
  };
}
