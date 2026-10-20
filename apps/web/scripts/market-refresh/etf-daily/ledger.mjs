/**
 * ledger.mjs — the PRIVATE daily ledger's row format and the stability rule (E1, 2026-10-20).
 *
 * WHERE IT LIVES. Rows hold provider × session × fund values, so they belong
 * ONLY in the private repository (owner decision 2026-10-20). Nothing in the
 * public repository writes or reads a real ledger: this module defines the
 * format and the rules, and the tests use synthetic rows. The public weekly
 * workflow will later read only an approved summary at a pinned revision (E2).
 *
 * ROW (schema 1), append-only (write with `appendJsonlLine`):
 *   { schema: 1, provider, session, ticker, net_flow_usd: integer | null,
 *     retrieved_at: ISO instant, attempt_id, response_sha256,
 *     kind: 'pull' | 'import', universe_version }
 * One row per value per retrieval. A later retrieval that returns a different
 * value is a NEW row (a revision); nothing is ever rewritten.
 *
 * STABILITY, NOT PROOF (owner decision 2026-10-20). A value is usable for
 * scoring as of a cutoff only when it is "stable in the observations made":
 * the latest retrieval at or before the cutoff agrees with every retrieval
 * back to one made at least 12 hours earlier. That is a conservative
 * operational condition, not a proof that the provider will not revise it.
 *   * A one-off history import is ONE retrieval, so on its own it is never
 *     stable: a second retrieval 12 hours later is required.
 *   * A value still changing at the cutoff is unstable; a null is pending.
 *   * Retrievals after the cutoff are ignored, so a published cycle stays
 *     reproducible from the rows that existed at its cutoff.
 */

export const LEDGER_SCHEMA = 1;
export const STABILITY_MIN_GAP_MS = 12 * 60 * 60 * 1000;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Validate one ledger row; returns a list of problems (empty = valid). */
export function ledgerRowProblems(row) {
  const problems = [];
  if (row?.schema !== LEDGER_SCHEMA) problems.push('schema');
  if (!['cryptoetf', 'sosovalue'].includes(row?.provider)) problems.push('provider');
  if (typeof row?.session !== 'string' || !ISO_DAY.test(row.session)) problems.push('session');
  if (typeof row?.ticker !== 'string' || !/^[A-Z]{2,6}$/.test(row.ticker)) problems.push('ticker');
  if (row?.net_flow_usd !== null && !Number.isSafeInteger(row?.net_flow_usd)) {
    problems.push('net_flow_usd');
  }
  if (!Number.isFinite(Date.parse(row?.retrieved_at))) problems.push('retrieved_at');
  if (!['pull', 'import'].includes(row?.kind)) problems.push('kind');
  for (const k of ['attempt_id', 'response_sha256', 'universe_version']) {
    if (typeof row?.[k] !== 'string' || row[k] === '') problems.push(k);
  }
  return problems;
}

/** Turn normalised provider rows into ledger rows for one retrieval. */
export function toLedgerRows(
  provider,
  normalized,
  { retrievedAt, attemptId, responseSha256, kind, universeVersion }
) {
  return normalized.map((r) => ({
    schema: LEDGER_SCHEMA,
    provider,
    session: r.session,
    ticker: r.ticker,
    net_flow_usd: r.netFlowUsd,
    retrieved_at: retrievedAt,
    attempt_id: attemptId,
    response_sha256: responseSha256,
    kind,
    universe_version: universeVersion,
  }));
}

/**
 * Index ledger rows by provider|session|ticker, keeping only valid rows
 * retrieved at or before `cutoffMs`, oldest first.
 */
export function indexLedger(rows, cutoffMs) {
  const index = new Map();
  for (const row of rows) {
    if (ledgerRowProblems(row).length) continue;
    const t = Date.parse(row.retrieved_at);
    if (t > cutoffMs) continue;
    const key = `${row.provider}|${row.session}|${row.ticker}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ t, value: row.net_flow_usd, kind: row.kind });
  }
  for (const list of index.values()) list.sort((a, b) => a.t - b.t);
  return index;
}

/**
 * The scoring status of one provider/session/fund value as of the index's cutoff.
 *
 * @returns {{status: 'stable', value: number}
 *   | {status: 'missing'|'pending'|'single-observation'|'too-close'|'changing'}}
 */
export function stableValue(index, provider, session, ticker) {
  const obs = index.get(`${provider}|${session}|${ticker}`);
  if (!obs || obs.length === 0) return { status: 'missing' };
  const latest = obs[obs.length - 1];
  if (latest.value === null) return { status: 'pending' };
  let i = obs.length - 1;
  while (i > 0 && obs[i - 1].value === latest.value) i -= 1;
  const earliestAgreeing = obs[i];
  if (latest.t - earliestAgreeing.t >= STABILITY_MIN_GAP_MS) {
    return { status: 'stable', value: latest.value };
  }
  if (obs.length === 1) return { status: 'single-observation' };
  // Agreeing retrievals less than 12 h apart, or a value that changed recently.
  return { status: i === 0 ? 'too-close' : 'changing' };
}
