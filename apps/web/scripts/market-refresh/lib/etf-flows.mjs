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
import { appendJsonlLine, readJsonlTolerant } from './jsonl.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { SHARED_DIR } from '../providers/inrepo.mjs';
import {
  evaluateEtfManual,
  WARMUP_SNAPSHOTS,
  ETF01_WEIGHT,
  ETF_VARIANT,
} from './regime-engine.mjs';
import { ETF01_SUSPENSION, suspendedEtfSignal } from './etf-suspension.mjs';
import { isCompleteSnapshot, missingFields } from './etf-coverage.mjs';

export const ETF_SHARES_ARCHIVE = path.join(SHARED_DIR, 'etf-shares-weekly.jsonl');

/**
 * Collection attempts that came back INCOMPLETE (2026-10-19). Kept apart from
 * the ledger: an incomplete pull is evidence of what the provider returned,
 * never a ledger week, and never a zero flow. Append-only, like the ledger.
 */
export const ETF_SNAPSHOT_ATTEMPTS = path.join(SHARED_DIR, 'etf-snapshot-attempts.jsonl');

/**
 * Exit codes of `run.mjs --etf-snapshot` when the week is not added to the
 * ledger (2026-10-19). The weekly workflow maps them to the wording of its log
 * annotation and PR body, which differs by case: a REFUSED pull can still be
 * collected again that week; a week that already has an INCOMPLETE record is
 * preserved and not collected again. `recordedThenFailed`: this week's complete
 * snapshot IS in the ledger and the step failed after writing it. Since
 * `--etf-snapshot` is snapshot-only (it returns once the week is recorded), only
 * the step's closing report runs after the write; the core refresh is a separate
 * workflow step. Kept so that case is never reported as "not recorded". Outside
 * Node's reserved codes; any other non-zero exit is an error whose effect on
 * the ledger this run does not establish.
 */
export const ETF_SNAPSHOT_EXIT = Object.freeze({
  refused: 20,
  incompleteRecord: 21,
  recordedThenFailed: 22,
});

export const STALE_FUND_DAYS = 10;
// A "weekly aggregate" must actually span a week (PENDING_ALL 5.301). Anchors
// are confirmed Friday closes, so a clean cadence is exactly 7 days; ±1 admits
// a holiday-shifted Friday without admitting a missed run. The committed ledger
// already contains 2026-07-10 -> 2026-07-24 — a FORTNIGHT that was published as
// one of "the last 4 weekly aggregates", because the 07-17 snapshot was missed.
export const WEEK_SPAN_DAYS = 7;
export const WEEK_SPAN_TOLERANCE_DAYS = 1;
export const MAX_WEEKLY_SHARE_CHANGE = 0.5; // ±50%/week = corruption, not commerce

/**
 * The doc 02 §8.3 rule, ONE definition (2026-10-20): ACTIVE when at least
 * `minPositive` of the trailing `weeks` weekly aggregates are positive, and a
 * week is positive when its net flow is strictly above zero. Shared by this
 * share-count route and the daily-source route (etf-daily/), so the two can
 * never score the same weeks differently. Changing it is a methodology change.
 */
export const ETF01_RULE = Object.freeze({ weeks: 4, minPositive: 3 });
export const isPositiveWeek = (netFlowUsd) => netFlowUsd > 0;
// Single definition lives in regime-engine.mjs (the pure module) — re-exported
// here so existing importers (run.mjs) are unchanged. See its docblock.
export { WARMUP_SNAPSHOTS };

/**
 * One line of `etf-shares-weekly.jsonl`. Declared once here so readers are
 * typed against the writer's own shape — `readJsonlTolerant` returns plain
 * objects, and every consumer was otherwise re-asserting `.anchor` locally.
 *
 * @typedef {object} EtfFund
 * @property {number|null} shares
 * @property {number|null} price
 * @property {string|null} lastUpdated
 *
 * @typedef {object} EtfSnapshot
 * @property {string} anchor — the confirmed Friday this snapshot is anchored to
 * @property {Record<string, EtfFund>} funds
 */

/**
 * @param {string} [archivePath]
 * @returns {EtfSnapshot[]}
 */
export function readSnapshots(archivePath = ETF_SHARES_ARCHIVE) {
  if (!fs.existsSync(archivePath)) return [];
  // 5.302: a torn tail used to throw a bare SyntaxError out of the middle of
  // the weekly run. The run archive had always tolerated it; this ledger — the
  // one ETF-01's two points are scored from — had not. Same rule for both now.
  return /** @type {EtfSnapshot[]} */ (readJsonlTolerant(fs.readFileSync(archivePath, 'utf8')));
}

/** @param {string} [attemptsPath] */
export function readAttempts(attemptsPath = ETF_SNAPSHOT_ATTEMPTS) {
  if (!fs.existsSync(attemptsPath)) return [];
  return readJsonlTolerant(fs.readFileSync(attemptsPath, 'utf8'));
}

/**
 * Record this week's collection (2026-10-19). A COMPLETE snapshot is appended
 * to the ledger. An INCOMPLETE one is refused as ledger data: the attempt, what
 * came back and what was missing go to the attempts file as evidence, and the
 * ledger is untouched, so the same week can be collected again (a later
 * complete pull for that anchor is still accepted). A week already in the
 * ledger is never collected twice.
 *
 * @param {EtfSnapshot} snap
 * @param {{attemptedAt: string, source: string, ledgerPath?: string, attemptsPath?: string}} io
 * @returns {{outcome: 'recorded' | 'already-recorded' | 'refused', missing?: {shares: string[], price: string[]}}}
 */
export function recordEtfSnapshot(
  snap,
  { attemptedAt, source, ledgerPath = ETF_SHARES_ARCHIVE, attemptsPath = ETF_SNAPSHOT_ATTEMPTS }
) {
  if (readSnapshots(ledgerPath).some((s) => s.anchor === snap.anchor)) {
    return { outcome: 'already-recorded' };
  }
  if (!isCompleteSnapshot(snap)) {
    const missing = missingFields(snap);
    const evidence = {
      anchor: snap.anchor,
      attempted_at: attemptedAt,
      outcome: 'refused-incomplete',
      source,
      missing,
      funds: snap.funds,
    };
    appendJsonlLine(attemptsPath, JSON.stringify(evidence));
    return { outcome: 'refused', missing };
  }
  const res = appendSnapshot(snap, ledgerPath);
  return { outcome: res.appended ? 'recorded' : 'already-recorded' };
}

/**
 * Append this week's snapshot. Refuses a second snapshot for the same anchor
 * (idempotent weekly runs). NOT exported (2026-10-19): it does not check
 * completeness, so the only way in is `recordEtfSnapshot`.
 *
 * @param {{anchor: string, funds: Record<string,{shares:number|null, price:number|null, lastUpdated:string|null}>}} snap
 */
function appendSnapshot(snap, archivePath = ETF_SHARES_ARCHIVE) {
  const existing = readSnapshots(archivePath);
  if (existing.some((s) => s.anchor === snap.anchor)) {
    return { appended: false, reason: `snapshot for ${snap.anchor} already recorded` };
  }
  if (existing.length && existing[existing.length - 1].anchor >= snap.anchor) {
    throw new Error(
      `etf snapshot ${snap.anchor} is not after the last recorded ${existing[existing.length - 1].anchor}`
    );
  }
  appendJsonlLine(archivePath, JSON.stringify(snap));
  return { appended: true };
}

/**
 * Compute weekly net flows (USD) between consecutive snapshots.
 * Returns { flows: [{from, to, spanDays, weekly, netFlowUsd, excluded}], warnings,
 * spacingWarnings } — `warnings` is fund-quality only; see below.
 */
export function computeWeeklyFlows(snapshots, today = new Date()) {
  const flows = [];
  // `warnings` means FUND-QUALITY exclusions and nothing else — the detail
  // string counts it as "N fund-week(s) excluded by quality guards". Cadence
  // problems are a different kind of fact about a different subject (the
  // interval, not a fund), so they get their own list. Mixing them made the
  // published record claim a fund exclusion that had not happened (caught in
  // this increment's own audit, 5.301).
  const warnings = [];
  const spacingWarnings = [];
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
    const spanDays = Math.round((new Date(cur.anchor) - new Date(prev.anchor)) / 86400000);
    const weekly = Math.abs(spanDays - WEEK_SPAN_DAYS) <= WEEK_SPAN_TOLERANCE_DAYS;
    if (!weekly) {
      spacingWarnings.push(
        `${prev.anchor} → ${cur.anchor}: ${spanDays}-day interval is not a week — ` +
          `a snapshot is missing, so this is not a weekly aggregate`
      );
    }
    flows.push({
      from: prev.anchor,
      to: cur.anchor,
      spanDays,
      weekly,
      netFlowUsd: Math.round(net),
      excluded,
    });
  }
  return { flows, warnings, spacingWarnings };
}

/**
 * ETF-01 from the flow ledger (doc 02 §8.3): ≥3 of trailing 4 weekly
 * aggregates positive → ACTIVE. UNAVAILABLE while warming up.
 */
export function evaluateEtf01FromFlows(ledger, today = new Date()) {
  // 2026-10-19: flows come from COMPLETE records only. An incomplete record is
  // not a usable week and never a zero flow: dropping it leaves a gap between
  // the complete records around it, which the spacing rule below already
  // scores UNAVAILABLE (gapped). Warm-up counts complete records too.
  const snapshots = ledger.filter(isCompleteSnapshot);
  if (snapshots.length < WARMUP_SNAPSHOTS) {
    return {
      id: 'ETF-01',
      state: 'UNAVAILABLE',
      weight: ETF01_WEIGHT,
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
  const last4 = flows.slice(-ETF01_RULE.weeks);

  // 5.301: the doc 02 §8.3 rule is "≥3 of the trailing 4 WEEKLY aggregates".
  // A fortnight is not a weekly aggregate, so when one lands in the window the
  // rule cannot be evaluated — and the published sentence would say "the last
  // 4 weeks" about a span of five.
  //
  // Two alternatives were rejected. Reaching further back for 4 clean weeks
  // makes the score describe a window ending before the ledger's own latest
  // anchor, while the freshness panel reports that anchor — the exact class of
  // dishonesty 5.173/5.176 are about. Failing the whole run closed would block
  // every other signal too, and a missed Polygon snapshot is not known to be
  // reconstructible (the route gives no observation date), so the pipeline
  // would stay blocked for four weeks until the gap left the window.
  //
  // UNAVAILABLE is the state that already means "this cannot be measured", and
  // it costs the 2 points rather than inventing them. Warm-up uses it for the
  // same reason.
  const gap = last4.find((f) => !f.weekly);
  if (gap) {
    return {
      id: 'ETF-01',
      state: 'UNAVAILABLE',
      weight: ETF01_WEIGHT,
      detail:
        `ETF flow ledger has a ${gap.spanDays}-day gap (${gap.from} → ${gap.to}) inside the ` +
        `trailing-4 window — a missing weekly snapshot. Scored unavailable rather than ` +
        `counting it as one week. Spans: [${last4.map((f) => `${f.spanDays}d`).join(', ')}]`,
      // `snapshots`/`warmupTarget` stay populated: the warm-up sentence is the
      // FALLBACK if the gapped variant is ever missing for a locale, and 5.133
      // is the standing reminder that an unslotted UNAVAILABLE stops the
      // generator dead. `variant` selects the gapped wording.
      values: {
        snapshots: snapshots.length,
        warmupTarget: WARMUP_SNAPSHOTS,
        variant: ETF_VARIANT.GAPPED,
        gapDays: gap.spanDays,
      },
      anchor: snapshots[snapshots.length - 1].anchor,
      anchorKind: 'weekly',
    };
  }

  const positives = last4.filter((f) => isPositiveWeek(f.netFlowUsd)).length;
  const state = positives >= ETF01_RULE.minPositive ? 'ACTIVE' : 'INACTIVE';
  const fmt = (n) =>
    `${n < 0 ? '-' : '+'}$${Math.abs(Math.round(n / 1e6)).toLocaleString('en-US')}M`;
  return {
    id: 'ETF-01',
    state,
    weight: ETF01_WEIGHT,
    detail:
      `Spot-ETF net flows via Δshares×NAV (Polygon primary): last 4 weekly aggregates ` +
      `(spans [${last4.map((f) => `${f.spanDays}d`).join(', ')}], all verified 7±1d) ` +
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
  // The 2026-10-18 suspension (lib/etf-suspension.mjs) wins over every route,
  // the manual fallback included: while it is active, no ledger state and no
  // successful collection can produce an ACTIVE or INACTIVE ETF-01.
  if (ETF01_SUSPENSION.active) return [suspendedEtfSignal(snapshots)];
  return snapshots.length > 0
    ? [evaluateEtf01FromFlows(snapshots, today)]
    : evaluateEtfManual(manual, today);
}
