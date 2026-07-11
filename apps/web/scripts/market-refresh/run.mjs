#!/usr/bin/env node
/**
 * run.mjs — market-refresh pipeline orchestrator (P2: stages 1–3).
 *
 *   [1 FETCH] → [2 QUALITY GATE] → [3 ANALYZE] → computed.json + archive
 *
 * Stage 4 (template generator → editorial JSONs) is P3; until it ships, the
 * editorial files stay hand-written against THIS script's output, and the
 * reconciliation vitest (computedReconciliation.test.ts) makes regime.json
 * ↔ computed.json divergence unmergeable (F-M4).
 *
 * Usage:
 *   node apps/web/scripts/market-refresh/run.mjs                # compute + write computed.json
 *   node apps/web/scripts/market-refresh/run.mjs --append-btc   # also append the due BTC candle
 *                                                               # (dual-source verified, gated)
 *   node apps/web/scripts/market-refresh/run.mjs --no-archive   # skip the run-archive line
 *
 * Fail-closed: any QualityGateError or STALE INPUT exits non-zero and writes
 * NOTHING — the last-good committed data keeps serving.
 *
 * Plan: docs/audit/MARKET_REFRESH_AUDIT_AND_AUTOMATION_PLAN_2026-07-11.md §B.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateBtcStructure,
  evaluateMacro,
  evaluateRelativeStrength,
  evaluateEtfManual,
  scoreSignals,
  anchorCoherence,
  expectedConfirmedMonthYM,
} from './lib/regime-engine.mjs';
import {
  assertDailySeries,
  assertRateSeries,
  assertRecency,
  assertOhlcBar,
  assertBtcCloseVerified,
  OUTLIER_BOUNDS_PCT,
} from './lib/quality-gate.mjs';
import { fetchFredSeries } from './providers/fred.mjs';
import { fetchEtfSharesOutstanding, SPOT_BTC_ETFS } from './providers/polygon.mjs';
import {
  readSnapshots,
  appendSnapshot,
  evaluateEtf01FromFlows,
  WARMUP_SNAPSHOTS,
} from './lib/etf-flows.mjs';
import { fetchYahooDaily, fetchYahooMonthlyBars } from './providers/yahoo.mjs';
import { fetchBtcMonthCloseVerifier } from './providers/coingecko.mjs';
import { btcMonths, appendBtcMonth, REPO_ROOT } from './providers/inrepo.mjs';

const MARKET_DIR = path.join(REPO_ROOT, 'apps/web/data/market');
const COMPUTED_PATH = path.join(MARKET_DIR, 'computed.json');
const REGIME_PATH = path.join(MARKET_DIR, 'regime.json');
const ARCHIVE_PATH = path.join(MARKET_DIR, 'run-archive.jsonl');
const ETF_MANUAL_PATH = path.join(MARKET_DIR, 'etf01-manual.json');

const TODAY = new Date();

async function maybeAppendBtc() {
  const expectedYm = expectedConfirmedMonthYM(TODAY);
  if (btcMonths().some((m) => m.ym === expectedYm)) {
    console.log(`[append-btc] ${expectedYm} already present — nothing to do.`);
    return null;
  }
  console.log(`[append-btc] ${expectedYm} missing — fetching with dual-source verification…`);
  const { bars } = await fetchYahooMonthlyBars('BTC-USD', '1y');
  const bar = bars.get(expectedYm);
  if (!bar) throw new Error(`[append-btc] Yahoo has no closed monthly bar for ${expectedYm}`);
  assertOhlcBar(`BTC ${expectedYm}`, bar);
  const verifier = await fetchBtcMonthCloseVerifier(expectedYm);
  const divergencePct = assertBtcCloseVerified(expectedYm, bar.close, verifier.price);
  const row = appendBtcMonth(bar);
  console.log(
    `[append-btc] appended ${expectedYm} close ${row.close} ` +
      `(Yahoo vs CoinGecko ${verifier.price.toFixed(2)} — divergence ${divergencePct.toFixed(3)}% ≤ 0.5%)`
  );
  return { ym: expectedYm, row, verifier: verifier.price, divergencePct };
}

/**
 * Weekly ETF-01 leg (P4, Polygon route): snapshot per-fund shares outstanding
 * + NAV proxy (Yahoo close), append to the append-only ledger. Idempotent per
 * Friday anchor. Paced for the free tier (~2.4 min for 11 tickers).
 */
async function maybeSnapshotEtfShares() {
  // Anchor = the most recent past Friday (strict-Friday spirit; the snapshot
  // describes the week that closed on that Friday).
  const anchorDate = new Date(TODAY);
  while (anchorDate.getUTCDay() !== 5) anchorDate.setUTCDate(anchorDate.getUTCDate() - 1);
  const anchor = anchorDate.toISOString().slice(0, 10);
  const existing = readSnapshots();
  if (existing.some((snap) => snap.anchor === anchor)) {
    console.log(`[etf-snapshot] ${anchor} already recorded — nothing to do.`);
    return;
  }
  console.log(`[etf-snapshot] fetching ${SPOT_BTC_ETFS.length} funds (paced, ~2.4 min)…`);
  const { funds } = await fetchEtfSharesOutstanding();
  const snap = { anchor, funds: {} };
  for (const t of SPOT_BTC_ETFS) {
    let price = null;
    try {
      const { series } = await fetchYahooDaily(t, '5d');
      price = series.length ? series[series.length - 1][1] : null;
    } catch (e) {
      console.log(`[etf-snapshot] NAV proxy fetch failed for ${t}: ${e.message}`);
    }
    snap.funds[t] = { shares: funds[t].shares, price, lastUpdated: funds[t].lastUpdated };
  }
  const res = appendSnapshot(snap);
  console.log(
    res.appended
      ? `[etf-snapshot] recorded ${anchor} (${readSnapshots().length}/${WARMUP_SNAPSHOTS} toward ETF-01 warm-up)`
      : `[etf-snapshot] ${res.reason}`
  );
}

async function main() {
  const appendRequested = process.argv.includes('--append-btc');
  const appendResult = appendRequested ? await maybeAppendBtc() : null;
  if (process.argv.includes('--etf-snapshot')) await maybeSnapshotEtfShares();

  // ── Stage 1: FETCH ───────────────────────────────────────────────────────
  console.log('[fetch] pulling sources…');
  const [dxy, us10y, m2, nasdaq, btc, gold] = await Promise.all([
    fetchFredSeries('DTWEXBGS'),
    fetchFredSeries('DGS10'),
    fetchFredSeries('M2SL'),
    fetchFredSeries('NASDAQCOM'),
    fetchYahooDaily('BTC-USD', '6mo'),
    fetchYahooDaily('GC=F', '1y'),
  ]);
  const etfManual = fs.existsSync(ETF_MANUAL_PATH)
    ? JSON.parse(fs.readFileSync(ETF_MANUAL_PATH, 'utf8'))
    : null;

  // ── Stage 2: QUALITY GATE (fail-closed) ──────────────────────────────────
  console.log('[gate] running quality checks…');
  assertDailySeries('FRED:DTWEXBGS', dxy.series, {
    maxMovePct: OUTLIER_BOUNDS_PCT.dollarIndexDaily,
  });
  assertRateSeries('FRED:DGS10', us10y.series);
  assertDailySeries('FRED:NASDAQCOM', nasdaq.series, {
    maxMovePct: OUTLIER_BOUNDS_PCT.equityIndexDaily,
  });
  assertDailySeries('Yahoo:BTC-USD', btc.series, { maxMovePct: OUTLIER_BOUNDS_PCT.yahooDaily });
  assertDailySeries('Yahoo:GC=F', gold.series, { maxMovePct: OUTLIER_BOUNDS_PCT.yahooDaily });
  // Recency SLAs: FRED weekly-published series carry up to ~1w publication
  // lag (+ holiday); Yahoo quotes are near-live; M2 is monthly with ~4-week
  // release lag (obs date = first of the data month → worst-case ~88d).
  assertRecency('FRED:DTWEXBGS', dxy.series, TODAY, { maxAgeDays: 14 });
  assertRecency('FRED:DGS10', us10y.series, TODAY, { maxAgeDays: 7 });
  assertRecency('FRED:NASDAQCOM', nasdaq.series, TODAY, { maxAgeDays: 7 });
  assertRecency('Yahoo:BTC-USD', btc.series, TODAY, { maxAgeDays: 3 });
  assertRecency('Yahoo:GC=F', gold.series, TODAY, { maxAgeDays: 5 });
  assertRecency('FRED:M2SL', m2.series, TODAY, { maxAgeDays: 92 });
  console.log('[gate] all schema/outlier/recency checks passed.');

  // ── Stage 3: ANALYZE (same engine as the manual CLI — DRY) ──────────────
  const btcSignals = evaluateBtcStructure(btcMonths(), TODAY); // throws STALE INPUT (F-M2) if due candle missing
  const macroSignals = evaluateMacro(
    { dxyDaily: dxy.series, us10yDaily: us10y.series, m2Monthly: m2.series },
    TODAY
  );
  const relSignals = evaluateRelativeStrength(
    { btcDaily: btc.series, goldDaily: gold.series, nasdaqDaily: nasdaq.series },
    TODAY
  );
  // ETF-01: the Polygon flow ledger takes precedence once warmed up
  // (>= WARMUP_SNAPSHOTS weekly snapshots); the manual file remains the
  // fallback during warm-up / outage (auto-expiring, doc 02 §10.1).
  const etfSnapshots = readSnapshots();
  const etfSignals =
    etfSnapshots.length > 0
      ? [evaluateEtf01FromFlows(etfSnapshots, TODAY)] // warming-up UNAVAILABLE until ≥5 snapshots
      : evaluateEtfManual(etfManual, TODAY);

  const all = [...btcSignals, ...macroSignals, ...etfSignals, ...relSignals];
  const { groupTotals, score, band } = scoreSignals({
    btc: btcSignals,
    macro: macroSignals,
    etf: etfSignals,
    rel: relSignals,
  });
  const { spreadDays, warning } = anchorCoherence(all);

  console.log('\n=== Signals ===');
  for (const s of all) {
    const pts = s.state === 'ACTIVE' ? s.weight : 0;
    console.log(
      `  ${s.id.padEnd(8)} [${String(s.state).padEnd(11)}] ${pts}/${s.weight}  — ${s.detail}`
    );
  }
  console.log(`\n=== Total: ${score} / 14 → ${band.code} ===`);
  if (warning) console.log(`\n  ⚠ ANCHOR COHERENCE (F-M3): ${warning}`);
  else console.log(`  Weekly anchor spread: ${spreadDays.toFixed(0)}d (coherent)`);

  // Reconciliation vs published
  let published = null;
  try {
    published = JSON.parse(fs.readFileSync(REGIME_PATH, 'utf8'));
  } catch {
    /* absent on a fresh clone — computed.json still written */
  }
  if (published) {
    if (published.score !== score || published.regime_code !== band.code) {
      console.log(
        `\n  ⚠ PUBLISH DRIFT: computed ${score}/${band.code} vs published ` +
          `${published.score}/${published.regime_code} — update the editorial JSONs ` +
          `(the reconciliation vitest will fail until they agree).`
      );
    } else {
      console.log(`  Published regime.json matches (${score}/${band.code}).`);
    }
  }

  // ── Output: computed.json (machine-readable truth for stage 4 + CI) ─────
  const computed = {
    _comment:
      'Machine-readable regime computation (P2 Stage 3 output). Written ONLY by ' +
      'scripts/market-refresh/run.mjs after the quality gate passes. The reconciliation ' +
      'vitest asserts regime.json agrees with this file — hand-edit regime.json scores ' +
      'and CI goes red (F-M4). Regenerate by running the pipeline, never by hand.',
    computed_at: new Date().toISOString(),
    score,
    max_score: 14,
    regime_code: band.code,
    group_totals: groupTotals,
    anchor_spread_days: Number(spreadDays.toFixed(2)),
    anchor_warning: warning,
    btc_append: appendResult
      ? {
          ym: appendResult.ym,
          close: appendResult.row.close,
          divergence_pct: Number(appendResult.divergencePct.toFixed(3)),
        }
      : null,
    signals: all.map(({ id, state, weight, detail, anchor = null, anchorKind = null }) => ({
      id,
      state,
      weight,
      points: state === 'ACTIVE' ? weight : 0,
      detail,
      anchor,
      anchorKind,
    })),
    sources: [dxy, us10y, m2, nasdaq, btc, gold].map((s) => s.provenance),
  };
  fs.writeFileSync(COMPUTED_PATH, JSON.stringify(computed, null, 2) + '\n');
  console.log(`  Wrote ${path.relative(REPO_ROOT, COMPUTED_PATH)}`);

  // ── Run archive (append-only) ────────────────────────────────────────────
  if (!process.argv.includes('--no-archive')) {
    const line = {
      run_at: computed.computed_at,
      pipeline: 'market-refresh/run.mjs',
      computed: { score, regime_code: band.code, group_totals: groupTotals },
      published: published ? { score: published.score, regime_code: published.regime_code } : null,
      anchor_spread_days: computed.anchor_spread_days,
      anchor_warning: warning,
      btc_append: computed.btc_append,
      signals: computed.signals,
    };
    fs.appendFileSync(ARCHIVE_PATH, JSON.stringify(line) + '\n');
    console.log(`  Archived run → ${path.relative(REPO_ROOT, ARCHIVE_PATH)}\n`);
  }
}

main().catch((e) => {
  console.error(
    `\n✖ market-refresh failed closed — nothing written beyond the log:\n  ${e.message}`
  );
  process.exit(1);
});
