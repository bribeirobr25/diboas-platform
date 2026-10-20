/**
 * providers.mjs — the two daily ETF-flow providers and their normalisation (E1, 2026-10-20).
 *
 * Owner decision (2026-10-20): CryptoETF.today is the intended PRIMARY,
 * SoSoValue the BACKUP and cross-check. Which one a publication actually used
 * is decided per scoring window in window.mjs and always disclosed.
 *
 * NORMALISED ROW: { session: 'YYYY-MM-DD', ticker, observation: 'value' | 'pending' | 'invalid',
 *   netFlowUsd: integer USD | null, issue: null | string }.
 *   * CryptoETF reports USD MILLIONS rounded to 0.1, so its values carry up to
 *     US$50,000 of rounding each (`roundingUsd`).
 *   * SoSoValue reports USD (with fractions); values are rounded to whole USD.
 *     A day it has not settled comes back as `net_inflow: null` and is kept as
 *     `netFlowUsd: null` (pending), never as zero.
 *
 * Every response is checked before use. A non-finite value, a contradictory
 * duplicate (two different observations of one fund-day in one response) or
 * a row naming another fund becomes an INVALID observation for that fund-day
 * and goes into the ledger like any other observation, so the decision sees
 * it (2026-10-21: dropping it let an older value be reused unnoticed).
 * Identical repeats collapse to one. A bad payload, an unusable date or
 * ticker, and days that are not sessions (weekends, holidays, an uncovered
 * year) name no scorable fund-day and are reported in `problems`; nothing is
 * filled in, and nothing becomes zero.
 *
 * Endpoints are the ones exercised in pilot round 1. CryptoETF's calendar-day
 * aggregate (`/flows/btc`) reported unpublished days as 0 and is NOT used.
 */

import { fetchProviderJson } from './request.mjs';
import { isCovered, isSession } from './calendar.mjs';

export const ETF_PROVIDERS = Object.freeze({
  cryptoetf: Object.freeze({
    id: 'cryptoetf',
    label: 'CryptoETF.today',
    role: 'primary',
    origin: 'https://api.cryptoetf.today',
    base: 'https://api.cryptoetf.today/api/v1',
    keyEnv: 'CRYPTOETF_API_KEY',
    keyHeader: 'X-API-Key',
    paceMs: 1_000,
    roundingUsd: 50_000,
  }),
  sosovalue: Object.freeze({
    id: 'sosovalue',
    label: 'SoSoValue',
    role: 'backup',
    origin: 'https://openapi.sosovalue.com',
    base: 'https://openapi.sosovalue.com/openapi/v1',
    keyEnv: 'SOSOVALUE_API_KEY',
    keyHeader: 'x-soso-api-key',
    paceMs: 3_500,
    roundingUsd: 1,
  }),
});

const TICKER = /^[A-Z]{2,6}$/;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Shared checks. Anything that names a scorable fund-day becomes an
 * observation: a `value`, `pending` (null), or `invalid` with its issue (a
 * non-finite value, a contradictory duplicate, a row naming another fund).
 * Only rows with no usable session or fund, or a day that is not a session,
 * are left out, and they are reported in `problems`.
 */
function collect(candidates) {
  const problems = [];
  const byKey = new Map();
  for (const c of candidates) {
    if (typeof c.session !== 'string' || !ISO_DAY.test(c.session)) {
      problems.push({ kind: 'bad-date', session: c.session, ticker: c.ticker });
      continue;
    }
    if (typeof c.ticker !== 'string' || !TICKER.test(c.ticker)) {
      problems.push({ kind: 'bad-ticker', session: c.session, ticker: c.ticker });
      continue;
    }
    if (!isCovered(c.session)) {
      problems.push({ kind: 'calendar-not-covering', session: c.session, ticker: c.ticker });
      continue;
    }
    if (!isSession(c.session)) {
      problems.push({ kind: 'non-session', session: c.session, ticker: c.ticker });
      continue;
    }
    const base = { session: c.session, ticker: c.ticker };
    let row;
    if (c.issue) {
      row = { ...base, observation: 'invalid', netFlowUsd: null, issue: c.issue };
    } else if (c.netFlowUsd === null) {
      row = { ...base, observation: 'pending', netFlowUsd: null, issue: null };
    } else if (!Number.isFinite(c.netFlowUsd)) {
      problems.push({ kind: 'non-finite', ...base });
      row = { ...base, observation: 'invalid', netFlowUsd: null, issue: 'non-finite' };
    } else {
      row = { ...base, observation: 'value', netFlowUsd: c.netFlowUsd, issue: null };
    }
    const key = `${c.session}|${c.ticker}`;
    const prior = byKey.get(key);
    if (!prior) {
      byKey.set(key, row);
      continue;
    }
    const same =
      prior.observation === row.observation &&
      prior.netFlowUsd === row.netFlowUsd &&
      prior.issue === row.issue;
    if (same) continue; // an identical repeat says nothing new
    problems.push({ kind: 'duplicate-conflict', ...base });
    byKey.set(key, { ...base, observation: 'invalid', netFlowUsd: null, issue: 'contradictory' });
  }
  return { rows: [...byKey.values()], problems };
}

/**
 * CryptoETF `/flows/btc/funds`: { days: [{ date, funds: [{ ticker, netFlowUsdM }] }] }.
 * A missing or null `netFlowUsdM` is pending, not zero.
 */
export function normalizeCryptoEtf(payload) {
  if (!payload || !Array.isArray(payload.days)) {
    return { rows: [], problems: [{ kind: 'bad-payload' }] };
  }
  const candidates = [];
  for (const day of payload.days) {
    for (const f of Array.isArray(day?.funds) ? day.funds : []) {
      const m = f?.netFlowUsdM;
      candidates.push({
        session: day?.date,
        ticker: f?.ticker,
        netFlowUsd:
          m === null || m === undefined ? null : typeof m === 'number' ? Math.round(m * 1e6) : NaN,
      });
    }
  }
  return collect(candidates);
}

/**
 * SoSoValue `/etfs/{ticker}/history`: { code, data: [{ date, ticker, net_inflow }] }.
 * `code` must be 0; a row's own ticker must be the one requested.
 */
export function normalizeSosoValue(ticker, payload) {
  if (!payload || payload.code !== 0 || !Array.isArray(payload.data)) {
    return { rows: [], problems: [{ kind: 'bad-payload', ticker }] };
  }
  const problems = [];
  const candidates = [];
  for (const r of payload.data) {
    if (r?.ticker !== ticker) {
      // The response for `ticker` contains a row naming another fund: an
      // invalid observation for the requested fund on that day, not a skip.
      problems.push({ kind: 'wrong-ticker', session: r?.date, ticker: r?.ticker });
      candidates.push({ session: r?.date, ticker, netFlowUsd: null, issue: 'wrong-ticker' });
      continue;
    }
    const v = r.net_inflow;
    candidates.push({
      session: r.date,
      ticker,
      netFlowUsd:
        v === null || v === undefined ? null : typeof v === 'number' ? Math.round(v) : NaN,
    });
  }
  const out = collect(candidates);
  return { rows: out.rows, problems: [...problems, ...out.problems] };
}

/**
 * Collect one provider's current rows (network). Keys come from `env` only and
 * travel only in the key header; evidence of every attempt goes to `evidence`.
 *
 * @param {'cryptoetf' | 'sosovalue'} providerId
 * @param {{env: Record<string, string | undefined>,
 *   evidence: ReturnType<typeof import('./request.mjs').createEvidenceStore>,
 *   tickers: string[], fetchImpl?: typeof fetch, sleep?: (ms: number) => Promise<void>}} options
 * @returns {Promise<{rows: object[], problems: object[], evidence: object[]}>}
 */
export async function collectProvider(providerId, { env, evidence, tickers, fetchImpl, sleep }) {
  const p = ETF_PROVIDERS[providerId];
  const key = env[p.keyEnv];
  if (!key) throw new Error(`${p.id}: ${p.keyEnv} is not set`);
  const request = (pathname) =>
    fetchProviderJson({
      provider: p.id,
      url: `${p.base}${pathname}`,
      allowedOrigin: p.origin,
      headers: { [p.keyHeader]: key, accept: 'application/json' },
      evidence,
      secrets: [key],
      fetchImpl,
      sleep,
    });
  const pace = sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  if (p.id === 'cryptoetf') {
    const { json, evidence: ev } = await request('/flows/btc/funds');
    return { ...normalizeCryptoEtf(json), evidence: [ev] };
  }
  const rows = [];
  const problems = [];
  const ev = [];
  for (const [i, t] of tickers.entries()) {
    if (i > 0) await pace(p.paceMs);
    const res = await request(`/etfs/${encodeURIComponent(t)}/history`);
    const n = normalizeSosoValue(t, res.json);
    rows.push(...n.rows);
    problems.push(...n.problems);
    ev.push(res.evidence);
  }
  return { rows, problems, evidence: ev };
}
