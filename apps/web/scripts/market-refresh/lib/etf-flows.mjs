/**
 * etf-flows.mjs — ETF-01 shares-outstanding flow ledger (P4, founder-approved
 * Polygon route 2026-07-11).
 *
 * Weekly snapshot: per-fund shares outstanding (Polygon) × NAV proxy (Yahoo
 * close) → net creation/redemption flow vs the prior snapshot. Snapshots are
 * APPEND-ONLY (`etf-shares-weekly.jsonl`); ETF-01 activates on the doc 02
 * §8.3 rule — **≥3 of the trailing 4 weekly aggregates positive → ACTIVE**.
 *
 * Warm-up honesty: computing 4 weekly flows needs 5 snapshots. Until then
 * the signal stays UNAVAILABLE with an explicit warming-up detail — never a
 * guessed backfill (candle-lock spirit: only observed deltas count).
 *
 * Per-fund quality guards:
 *  - shares must be finite and positive;
 *  - a Polygon `last_updated_utc` older than STALE_FUND_DAYS marks the fund
 *    DELAYED — excluded from the aggregate, named in the warning (the plan's
 *    AUM cross-check caught exactly this class: a stale GBTC share count);
 *  - a week-over-week share change beyond MAX_WEEKLY_SHARE_CHANGE is treated
 *    as corrupt (excluded + warned), not as a real flow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../providers/inrepo.mjs';
import { evaluateEtfManual, WARMUP_SNAPSHOTS } from './regime-engine.mjs';

export const ETF_SHARES_ARCHIVE = path.join(
  REPO_ROOT,
  'apps/web/data/market/shared/etf-shares-weekly.jsonl'
);

export const STALE_FUND_DAYS = 10;
export const MAX_WEEKLY_SHARE_CHANGE = 0.5; // ±50%/week = corruption, not commerce
// Single definition lives in regime-engine.mjs (the pure module) — re-exported
// here so existing importers (run.mjs) are unchanged. See its docblock.
export { WARMUP_SNAPSHOTS };

export function readSnapshots(archivePath = ETF_SHARES_ARCHIVE) {
  if (!fs.existsSync(archivePath)) return [];
  return fs
    .readFileSync(archivePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/**
 * Append this week's snapshot. Refuses a second snapshot for the same anchor
 * (idempotent weekly runs).
 *
 * @param {{anchor: string, funds: Record<string,{shares:number|null, price:number|null, lastUpdated:string|null}>}} snap
 */
export function appendSnapshot(snap, archivePath = ETF_SHARES_ARCHIVE) {
  const existing = readSnapshots(archivePath);
  if (existing.some((s) => s.anchor === snap.anchor)) {
    return { appended: false, reason: `snapshot for ${snap.anchor} already recorded` };
  }
  if (existing.length && existing[existing.length - 1].anchor >= snap.anchor) {
    throw new Error(
      `etf snapshot ${snap.anchor} is not after the last recorded ${existing[existing.length - 1].anchor}`
    );
  }
  fs.appendFileSync(archivePath, JSON.stringify(snap) + '\n');
  return { appended: true };
}

/**
 * Compute weekly net flows (USD) between consecutive snapshots.
 * Returns { flows: [{from, to, netFlowUsd, excluded: string[]}], warnings }.
 */
export function computeWeeklyFlows(snapshots, today = new Date()) {
  const flows = [];
  const warnings = [];
  for (let i = 1; i < snapshots.length; i += 1) {
    const prev = snapshots[i - 1];
    const cur = snapshots[i];
    let net = 0;
    const excluded = [];
    for (const [t, f] of Object.entries(cur.funds)) {
      const p = prev.funds[t];
      if (!p || !Number.isFinite(f.shares) || !Number.isFinite(p.shares) || f.shares <= 0) {
        excluded.push(t);
        continue;
      }
      if (f.lastUpdated && (today - new Date(f.lastUpdated)) / 86400000 > STALE_FUND_DAYS) {
        excluded.push(t);
        warnings.push(`${cur.anchor}: ${t} share count stale (${f.lastUpdated}) — excluded`);
        continue;
      }
      const change = Math.abs(f.shares - p.shares) / p.shares;
      if (change > MAX_WEEKLY_SHARE_CHANGE) {
        excluded.push(t);
        warnings.push(
          `${cur.anchor}: ${t} share change ${(change * 100).toFixed(0)}%/wk exceeds corruption bound — excluded`
        );
        continue;
      }
      if (!Number.isFinite(f.price) || f.price <= 0) {
        excluded.push(t);
        continue;
      }
      net += (f.shares - p.shares) * f.price;
    }
    flows.push({ from: prev.anchor, to: cur.anchor, netFlowUsd: Math.round(net), excluded });
  }
  return { flows, warnings };
}

/**
 * ETF-01 from the flow ledger (doc 02 §8.3): ≥3 of trailing 4 weekly
 * aggregates positive → ACTIVE. UNAVAILABLE while warming up.
 */
export function evaluateEtf01FromFlows(snapshots, today = new Date()) {
  if (snapshots.length < WARMUP_SNAPSHOTS) {
    return {
      id: 'ETF-01',
      state: 'UNAVAILABLE',
      weight: 2,
      detail:
        `Polygon shares-outstanding ledger warming up: ${snapshots.length}/${WARMUP_SNAPSHOTS} ` +
        `weekly snapshots recorded — 4 weekly flows need ${WARMUP_SNAPSHOTS}. No guessed backfill.`,
      // 5.133 (audit 2026-08-24): the UNAVAILABLE sentence templates reference
      // {snapshots} and {warmupTarget}. Without these the generator's empty-slot
      // guard THROWS and the weekly automation stops — fail-closed, but broken.
      // Latent today (ledger > warm-up) and guaranteed to bite any future view
      // that starts its own ledger from zero.
      values: { snapshots: snapshots.length, warmupTarget: WARMUP_SNAPSHOTS },
      anchor: snapshots.length ? snapshots[snapshots.length - 1].anchor : null,
      anchorKind: 'weekly',
    };
  }
  const { flows, warnings } = computeWeeklyFlows(snapshots, today);
  const last4 = flows.slice(-4);
  const positives = last4.filter((f) => f.netFlowUsd > 0).length;
  const state = positives >= 3 ? 'ACTIVE' : 'INACTIVE';
  const fmt = (n) =>
    `${n < 0 ? '-' : '+'}$${Math.abs(Math.round(n / 1e6)).toLocaleString('en-US')}M`;
  return {
    id: 'ETF-01',
    state,
    weight: 2,
    detail:
      `Spot-ETF net flows via Δshares×NAV (Polygon primary): last 4 weekly aggregates ` +
      `[${last4.map((f) => fmt(f.netFlowUsd)).join(', ')}] → ${positives}/4 positive ` +
      `(threshold ≥3)${warnings.length ? `; ${warnings.length} fund-week(s) excluded by quality guards` : ''}`,
    values: { positives, weeks: 4, lastFlowUsd: last4[last4.length - 1]?.netFlowUsd ?? null },
    anchor: snapshots[snapshots.length - 1].anchor,
    anchorKind: 'weekly',
  };
}

/**
 * THE single ETF-01 route decision — Polygon ledger first, manual file as the
 * auto-expiring fallback (doc 02 §10.1).
 *
 * Extracted 2026-08-24 (audit) because this choice previously existed ONLY
 * inside `run.mjs`, while `compute-regime.mjs` — the CLI that CLAUDE.md
 * documents as the "manual score check" — still called `evaluateEtfManual`
 * directly against a file that expired 2026-07-18. The verification tool
 * therefore scored ETF-01 UNAVAILABLE and reported 8/14 against a published
 * 10/14: an operator checking the site would have concluded the SITE was
 * wrong. Principle 4 (DRY) is the whole reason the engine was extracted, so
 * the route decision lives here, once, and both entry points call it.
 *
 * @param {object} io
 * @param {Array} io.snapshots — the Polygon weekly shares ledger
 * @param {object|null} io.manual — parsed etf01-manual.json, or null
 * @param {Date} today
 * @returns {Array} ETF signal array (always length 1)
 */
export function resolveEtfSignals({ snapshots, manual }, today) {
  return snapshots.length > 0
    ? [evaluateEtf01FromFlows(snapshots, today)]
    : evaluateEtfManual(manual, today);
}
