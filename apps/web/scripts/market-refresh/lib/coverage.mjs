/**
 * coverage.mjs — which signals this cycle could not assess, and since when.
 *
 * Written to `regime.json#coverage` by the generator so the page can say, next
 * to the score and the chart, that coverage is reduced and that a score change
 * caused by it is not a market change. It is a statement about THIS cycle and
 * the run days the archive already holds; it never rewrites an earlier record.
 *
 * `since` is the first archived run day computed under the suspension, read
 * from the archive rather than from the constant, so a cycle that slips (or a
 * contingency re-run) dates the note to the run that actually applied it.
 */
import { isSuspendedEtf } from './etf-suspension.mjs';
import { readArchiveRows, runDayIndex } from './archive.mjs';

/**
 * @param {Array<object>} signals — this run's computed signals
 * @param {string} archiveText — raw run-archive.jsonl ('' if absent)
 * @param {string} computedAt — this run's ISO timestamp
 * @returns {{suspended: Array<{signal_id: string, points: number, since: string}>}}
 */
export function cycleCoverage(signals, archiveText, computedAt) {
  const etf = signals.find((s) => s.id === 'ETF-01');
  if (!isSuspendedEtf(etf)) return { suspended: [] };

  const byDay = runDayIndex(readArchiveRows(archiveText));
  const today = String(computedAt).slice(0, 10);
  const suspendedDays = [...byDay.entries()]
    .filter(([, row]) => (row.signals ?? []).some((s) => isSuspendedEtf(s)))
    .map(([day]) => day);
  // This run counts even if its archive line was skipped (--no-archive).
  if (!suspendedDays.includes(today)) suspendedDays.push(today);
  suspendedDays.sort();

  return {
    suspended: [{ signal_id: 'ETF-01', points: etf.weight, since: suspendedDays[0] }],
  };
}
