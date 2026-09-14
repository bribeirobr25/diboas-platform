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
import { readJsonlTolerant } from './jsonl.mjs';

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

/**
 * One line of `run-archive.jsonl`, as `archiveLine()` below produces it.
 * Declared once here so every reader is typed against the writer's own shape
 * rather than each consumer asserting locally what it hopes is in the file.
 *
 * @typedef {object} ArchiveSignal
 * @property {string} id
 * @property {string} state
 * @property {number} weight
 * @property {number} points
 * @property {string} detail
 * @property {Record<string, number>|null} values
 * @property {string|null} anchor
 * @property {string|null} anchorKind
 *
 * @typedef {object} ArchiveRow
 * @property {string} run_at
 * @property {string} [pipeline]
 * @property {{score: number, regime_code: string, group_totals: Record<string, number>}} computed
 * @property {{score: number, regime_code: string}|null} published
 * @property {number} anchor_spread_days
 * @property {string|null} anchor_warning
 * @property {object|null} [btc_append]
 * @property {ArchiveSignal[]} signals
 */

/**
 * Parse the run ledger. ONE definition of "what a readable archive row is"
 * (PENDING_ALL 5.302).
 *
 * Three call sites used to re-implement this loop: `priorRunSignals` (which
 * beat the /market/backdrop lead gets), `realSnapshotCount` (whether enough
 * real history exists to flip `synthetic_seed`), and the historical append.
 * All three had their own copy of "split, skip blanks, JSON.parse in a
 * try/catch, read `run_at.slice(0,10)`" — the same rule written three times,
 * which is three chances for it to drift and three places to fix when the
 * ledger format moves.
 *
 * A truncated final line is SKIPPED, not thrown on. The archive is appended to
 * by a job that can be killed mid-write, and a half-written tail must never
 * take the next run down — the same reasoning as the atomic-write helper next
 * door, from the other end.
 *
 * @param {string} text — raw `run-archive.jsonl` contents ('' if absent)
 * @returns {Array<{day: string, row: ArchiveRow}>} in file order
 */
export function readArchiveRows(text) {
  const rows = [];
  for (const row of readJsonlTolerant(text)) {
    const day = row.run_at?.slice(0, 10);
    if (!day) continue; // 2026-07-11 line 1 predates several fields; be tolerant
    rows.push({ day, row });
  }
  return rows;
}

/**
 * Run DAYS, not archive lines — the distinction 5.127 was about.
 *
 * The ledger legitimately holds same-day doubles: a correction re-run, or a
 * manual verification, is a real event and append-only means we keep it. The
 * committed file currently holds 12 lines across 10 days. Counting lines
 * overstates how much measured history exists, which was one half of why 44
 * seed points once shipped as if they had been observed.
 *
 * LATER LINE WINS for a given day: a same-day re-run is a correction, so the
 * most recent one is the one that stands.
 *
 * @param {Array<{day: string, row: ArchiveRow}>} rows — from `readArchiveRows`
 * @returns {Map<string, ArchiveRow>} day -> the run that stands for that day
 */
export function runDayIndex(rows) {
  const byDay = new Map();
  for (const { day, row } of rows) byDay.set(day, row);
  return byDay;
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
