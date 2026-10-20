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
 *   { schema: 1, provider, session, ticker,
 *     observation: 'value' | 'pending' | 'invalid',
 *     net_flow_usd: integer (a 'value') | null (pending or invalid),
 *     issue: null | why the observation is invalid ('non-finite', 'contradictory', ...),
 *     retrieved_at: ISO instant, attempt_id, response_sha256,
 *     kind: 'pull' | 'import', universe_version }
 * One row per observation per retrieval. A later retrieval that returns
 * something different is a NEW row (a revision); nothing is ever rewritten.
 *
 * NOTHING RECEIVED IS DROPPED (2026-10-21, Codex audit of #739). An invalid or
 * contradictory value for an identifiable fund-day is recorded as an
 * `invalid` observation, so the decision sees it: before, it vanished in
 * normalisation and an older stable value was reused as if nothing happened.
 * A persisted row that is damaged but still names its provider, session,
 * fund and time counts as an invalid observation at that time; a line that
 * cannot be attributed safely is reported as DAMAGED for the whole ledger.
 *
 * STABILITY, NOT PROOF (owner decision 2026-10-20). A value is usable for
 * scoring as of a cutoff only when it is "stable in the observations made":
 * the latest retrieval at or before the cutoff is a value that agrees with
 * every retrieval back to one made at least 12 hours earlier. That is a
 * conservative operational condition, not a proof of accuracy or finality.
 *   * A one-off history import is ONE retrieval, so on its own it is never
 *     stable: a second retrieval 12 hours later is required.
 *   * A value still changing at the cutoff is unstable; a pending latest
 *     observation is pending; an invalid latest observation is invalid, and
 *     an invalid observation also breaks the agreeing run, so recovery needs
 *     two valid retrievals at least 12 hours apart AFTER it.
 *   * Retrievals after the cutoff are ignored, so a published cycle stays
 *     reproducible from the rows that existed at its cutoff.
 */

import { ETF_PROVIDERS } from './providers.mjs';
import { ISO_DAY_PATTERN, TICKER_PATTERN, isValidFlowUsd, parseUtcInstant } from './formats.mjs';

export const LEDGER_SCHEMA = 1;
export const STABILITY_MIN_GAP_MS = 12 * 60 * 60 * 1000;

const PROVIDERS = Object.keys(ETF_PROVIDERS);
const OBSERVATIONS = ['value', 'pending', 'invalid'];

/** Validate one ledger row; returns a list of problems (empty = valid). */
export function ledgerRowProblems(row) {
  const problems = [];
  if (row?.schema !== LEDGER_SCHEMA) problems.push('schema');
  if (!PROVIDERS.includes(row?.provider)) problems.push('provider');
  if (typeof row?.session !== 'string' || !ISO_DAY_PATTERN.test(row.session))
    problems.push('session');
  if (typeof row?.ticker !== 'string' || !TICKER_PATTERN.test(row.ticker)) problems.push('ticker');
  if (!OBSERVATIONS.includes(row?.observation)) problems.push('observation');
  if (
    row?.observation === 'value' ? !isValidFlowUsd(row?.net_flow_usd) : row?.net_flow_usd !== null
  ) {
    problems.push('net_flow_usd');
  }
  if (row?.observation === 'invalid' ? typeof row?.issue !== 'string' : row?.issue !== null) {
    problems.push('issue');
  }
  if (!Number.isFinite(parseUtcInstant(row?.retrieved_at))) problems.push('retrieved_at');
  if (!['pull', 'import'].includes(row?.kind)) problems.push('kind');
  for (const k of ['attempt_id', 'response_sha256', 'universe_version']) {
    if (typeof row?.[k] !== 'string' || row[k] === '') problems.push(k);
  }
  return problems;
}

/** Turn normalised provider rows (values, pending and invalid alike) into ledger rows for one retrieval. */
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
    observation: r.observation,
    net_flow_usd: r.observation === 'value' ? r.netFlowUsd : null,
    issue: r.observation === 'invalid' ? r.issue : null,
    retrieved_at: retrievedAt,
    attempt_id: attemptId,
    response_sha256: responseSha256,
    kind,
    universe_version: universeVersion,
  }));
}

/**
 * Parse the persisted ledger text WITHOUT losing anything.
 *
 * @param {string} text — the whole JSONL file
 * @returns {{rows: object[], invalid: object[], damaged: {line: number, reason: string}[]}}
 *   `rows` are valid; `invalid` are damaged rows that still name their
 *   provider, session, fund and retrieval time (they count as invalid
 *   observations); `damaged` are lines that cannot be attributed safely.
 */
export function parseLedger(text) {
  if (typeof text !== 'string') throw new TypeError('parseLedger expects the ledger text');
  /** @type {{rows: object[], invalid: object[], damaged: {line: number, reason: string}[]}} */
  const out = { rows: [], invalid: [], damaged: [] };
  text.split('\n').forEach((line, i) => {
    if (line.trim() === '') return;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      out.damaged.push({ line: i + 1, reason: 'not JSON' });
      return;
    }
    const problems = ledgerRowProblems(row);
    if (problems.length === 0) {
      out.rows.push(row);
      return;
    }
    const attributable =
      PROVIDERS.includes(row?.provider) &&
      typeof row?.session === 'string' &&
      ISO_DAY_PATTERN.test(row.session) &&
      typeof row?.ticker === 'string' &&
      TICKER_PATTERN.test(row.ticker) &&
      Number.isFinite(parseUtcInstant(row?.retrieved_at));
    if (attributable) {
      out.invalid.push({
        provider: row.provider,
        session: row.session,
        ticker: row.ticker,
        retrieved_at: row.retrieved_at,
        issue: `invalid persisted row (${problems.join(', ')})`,
      });
    } else {
      out.damaged.push({ line: i + 1, reason: `unattributable row (${problems.join(', ')})` });
    }
  });
  return out;
}

/**
 * Index observations by provider|session|ticker, keeping only those retrieved
 * at or before `cutoffMs`, oldest first. Invalid persisted rows are indexed as
 * invalid observations, never skipped.
 *
 * @param {{rows: object[], invalid: object[]}} parsed — from `parseLedger`
 * @param {number} cutoffMs
 */
export function indexLedger(parsed, cutoffMs) {
  const index = new Map();
  const add = (row, entry) => {
    const t = parseUtcInstant(row.retrieved_at);
    if (t > cutoffMs) return;
    const key = `${row.provider}|${row.session}|${row.ticker}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ t, ...entry });
  };
  for (const row of parsed.rows) {
    add(row, { observation: row.observation, value: row.net_flow_usd, issue: row.issue });
  }
  for (const row of parsed.invalid) {
    add(row, { observation: 'invalid', value: null, issue: row.issue });
  }
  for (const list of index.values()) list.sort((a, b) => a.t - b.t);
  return index;
}

/**
 * The scoring status of one provider/session/fund as of the index's cutoff.
 *
 * @returns {{status: 'stable', value: number}
 *   | {status: 'invalid', issue: string}
 *   | {status: 'missing'|'pending'|'single-observation'|'too-close'|'changing'}}
 */
export function stableValue(index, provider, session, ticker) {
  const obs = index.get(`${provider}|${session}|${ticker}`);
  if (!obs || obs.length === 0) return { status: 'missing' };
  const latest = obs[obs.length - 1];
  if (latest.observation === 'invalid') return { status: 'invalid', issue: latest.issue };
  if (latest.observation === 'pending') return { status: 'pending' };
  const agrees = (o) => o.observation === 'value' && o.value === latest.value;
  let i = obs.length - 1;
  while (i > 0 && agrees(obs[i - 1])) i -= 1;
  if (latest.t - obs[i].t >= STABILITY_MIN_GAP_MS) {
    return { status: 'stable', value: latest.value };
  }
  if (obs.length === 1) return { status: 'single-observation' };
  // Agreeing retrievals less than 12 h apart, or a value that changed recently
  // (an invalid observation in between counts as a change).
  return { status: i === 0 ? 'too-close' : 'changing' };
}
