/**
 * jsonl.mjs — read an append-only ledger without letting its tail kill the run
 * (PENDING_ALL 5.302).
 *
 * The pipeline appends to two JSONL ledgers: `run-archive.jsonl` (provenance
 * for every published history point) and `etf-shares-weekly.jsonl` (the
 * warm-up ledger ETF-01's two points are scored from). Both are written by a
 * job that can be killed mid-append.
 *
 * They did not agree on what to do about that. The run archive skipped an
 * unparseable line — *"a truncated tail must not take the pipeline down"* —
 * while `readSnapshots` mapped `JSON.parse` over every line with no guard, so a
 * torn tail threw `SyntaxError: Unterminated string in JSON` out of the middle
 * of the weekly run. Proven by execution 2026-09-12, not by reading: appending
 * a partial line to a copy of the real ledger throws, where the same damage to
 * the run archive is absorbed.
 *
 * One rule, both ledgers. Skipping is the right behaviour rather than
 * repairing: the next run re-appends what it needs, and a reader must never
 * rewrite an append-only file it does not own.
 */

/**
 * Parse JSONL, skipping blank lines and any line that does not parse.
 *
 * @param {string} text — raw file contents ('' if absent)
 * @returns {object[]} the rows that parsed, in file order
 */
export function readJsonlTolerant(text) {
  if (!text) return [];
  const rows = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      continue; // torn tail, or a line some future writer mangled
    }
  }
  return rows;
}
