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
 *   node apps/web/scripts/market-refresh/run.mjs --etf-snapshot # ONLY append this week's ETF-01
 *                                                               # snapshot (POLYGON_API_KEY); no core run;
 *                                                               # refused together with --append-btc
 *
 * Fail-closed: any QualityGateError or STALE INPUT exits non-zero and writes
 * NOTHING — the last-good committed data keeps serving.
 *
 * Plan: docs/audit/MARKET_REFRESH_AUDIT_AND_AUTOMATION_PLAN_2026-07-11.md §B.
 */

import fs from 'node:fs';
import path from 'node:path';
import { isDirectInvocation } from './lib/invocation.mjs';
import { writeFileAtomic } from './lib/atomic.mjs';
import { expectedConfirmedMonthYM, MAX_SCORE } from './lib/regime-engine.mjs';
import {
  assertOhlcBar,
  assertBtcCloseVerified,
  BTC_CLOSE_TOLERANCE_PCT,
} from './lib/quality-gate.mjs';
import {
  fetchMarketSources,
  assertMarketSourcesQuality,
  evaluateMarketSignals,
} from './lib/market-sources.mjs';
import { fetchEtfSharesOutstanding, SPOT_BTC_ETFS } from './providers/polygon.mjs';
import { readSnapshots, appendSnapshot, WARMUP_SNAPSHOTS } from './lib/etf-flows.mjs';
import { archiveSignals, archiveLine, publishRun } from './lib/archive.mjs';
import { fetchYahooDaily, fetchYahooMonthlyBars } from './providers/yahoo.mjs';
import { fetchBtcMonthCloseVerifier } from './providers/coingecko.mjs';
import { btcMonths, appendBtcMonth, REPO_ROOT, SHARED_DIR } from './providers/inrepo.mjs';

// 5.92 (2026-08-19): the weekly run's outputs are SHARED across views (bitcoin,
// backdrop, umbrella) — `SHARED_DIR` (providers/inrepo.mjs, one definition).
const COMPUTED_PATH = path.join(SHARED_DIR, 'computed.json');
const REGIME_PATH = path.join(SHARED_DIR, 'regime.json');
const ARCHIVE_PATH = path.join(SHARED_DIR, 'run-archive.jsonl');
const ETF_MANUAL_PATH = path.join(SHARED_DIR, 'etf01-manual.json');

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
      `(Yahoo vs CoinGecko ${verifier.price.toFixed(2)} — divergence ${divergencePct.toFixed(3)}% ≤ ${BTC_CLOSE_TOLERANCE_PCT}%)`
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

/**
 * `--etf-snapshot` is snapshot-only, so combining it with `--append-btc` would
 * append the BTC candle and then stop without computing anything. Refused
 * before any request or write. `--no-archive` stays allowed: the weekly
 * workflow passes it with `--etf-snapshot`, where it has no effect.
 */
function assertCompatibleArgs(argv) {
  if (argv.includes('--etf-snapshot') && argv.includes('--append-btc')) {
    throw new Error(
      '--etf-snapshot runs ONLY the ETF-01 snapshot and cannot be combined with --append-btc. ' +
        'Run them as two invocations, as the weekly workflow does.'
    );
  }
}

async function main() {
  assertCompatibleArgs(process.argv);
  const appendRequested = process.argv.includes('--append-btc');
  const appendResult = appendRequested ? await maybeAppendBtc() : null;
  // `--etf-snapshot` is SNAPSHOT-ONLY (2026-10-18 compliance pass). The weekly
  // workflow runs it as its own fail-open step WITHOUT `--append-btc`; carrying
  // on into the full pipeline made that step fetch every source a second time
  // and, on a month-roll Monday past the grace period, throw STALE INPUT AFTER
  // the snapshot had been appended — so the step reported "snapshot FAILED"
  // for a snapshot that was saved. The core run is the next workflow step.
  if (process.argv.includes('--etf-snapshot')) {
    await maybeSnapshotEtfShares();
    return;
  }

  // ── Stages 1-3: FETCH → QUALITY GATE (fail-closed) → ANALYZE ────────────
  // One definition shared with the manual CLI (lib/market-sources.mjs): the
  // same fetch list and windows, the same gate, the same engine.
  console.log('[fetch] pulling sources…');
  const sources = await fetchMarketSources();
  const { dxy, us10y, m2, nasdaq, btc, gold } = sources;
  const etfManual = fs.existsSync(ETF_MANUAL_PATH)
    ? JSON.parse(fs.readFileSync(ETF_MANUAL_PATH, 'utf8'))
    : null;
  console.log('[gate] running quality checks…');
  assertMarketSourcesQuality(sources, TODAY);
  console.log('[gate] all schema/outlier/recency checks passed.');
  // ETF-01 goes through the single route decision (`resolveEtfSignals`): the
  // 2026-10-18 suspension, then the Polygon ledger, then the manual fallback.
  const etfSnapshots = readSnapshots();
  const { all, groupTotals, score, band, spreadDays, warning } = evaluateMarketSignals({
    sources,
    btcMonths: btcMonths(),
    etfSnapshots,
    etfManual,
    today: TODAY,
  });

  console.log('\n=== Signals ===');
  for (const s of all) {
    const pts = s.state === 'ACTIVE' ? s.weight : 0;
    console.log(
      `  ${s.id.padEnd(8)} [${String(s.state).padEnd(11)}] ${pts}/${s.weight}  — ${s.detail}`
    );
  }
  console.log(`\n=== Total: ${score} / ${MAX_SCORE} → ${band.code} ===`);
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
    max_score: MAX_SCORE,
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
    // 5.187a: one producer for the signal record, shared with the manual CLI so
    // the two archive writers cannot drift apart again.
    signals: archiveSignals(all, { etfSnapshotCount: etfSnapshots.length }),
    sources: [dxy, us10y, m2, nasdaq, btc, gold].map((s) => s.provenance),
  };
  // ── publish ──────────────────────────────────────────────────────────────
  // 5.302: DERIVE EVERYTHING BEFORE PUBLISHING ANYTHING. `archiveLine()` can
  // throw on unexpected engine output, and building it after `computed.json`
  // was already on disk is exactly how you get published data with no
  // provenance row — a state `realSnapshotCount` reads as "that week never
  // ran". Both payloads now exist before either lands.
  const archiving = !process.argv.includes('--no-archive');
  const archiveText = archiving
    ? JSON.stringify(
        archiveLine({
          runAt: computed.computed_at,
          pipeline: 'market-refresh/run.mjs',
          score,
          regimeCode: band.code,
          groupTotals,
          published,
          anchorSpreadDays: computed.anchor_spread_days,
          anchorWarning: warning,
          btcAppend: computed.btc_append,
          signals: computed.signals,
        })
      ) + '\n'
    : null;

  // The archive stays APPEND-ONLY and is deliberately not made "idempotent" by
  // rewriting same-day lines: a correction re-run is a real event, and a ledger
  // you edit is not a provenance authority. Duplicate DAYS are collapsed on
  // READ instead, by the one shared rule in archive.mjs#runDayIndex.
  //
  // 5.328a: the two writes and their ORDER live in `publishRun` so the window
  // between them is testable. computed.json first, archive second — never the
  // reverse, because a provenance row for data that was not published is a
  // phantom run day (5.137), and that is worse than losing a row for a run that
  // did publish.
  publishRun({
    computedPath: COMPUTED_PATH,
    computedText: JSON.stringify(computed, null, 2) + '\n',
    archivePath: ARCHIVE_PATH,
    archiveText,
    writeFile: writeFileAtomic,
    appendFile: (p, t) => fs.appendFileSync(p, t),
  });
  console.log(`  Wrote ${path.relative(REPO_ROOT, COMPUTED_PATH)}`);
  if (archiveText) console.log(`  Archived run → ${path.relative(REPO_ROOT, ARCHIVE_PATH)}\n`);
}

// Run ONLY when invoked directly: importing a writing script must be a no-op.
// Why, and the two footguns in the obvious implementation: lib/invocation.mjs.
if (isDirectInvocation(import.meta.url)) {
  main().catch((e) => {
    console.error(
      `\n✖ market-refresh failed closed — nothing written beyond the log:\n  ${e.message}`
    );
    process.exit(1);
  });
}
