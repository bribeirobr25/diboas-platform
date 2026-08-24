#!/usr/bin/env node
/**
 * compute-regime.mjs — reproducible regime-score computation per doc 02 §8.
 *
 * Created 2026-05-29 alongside the D1 enactment as the durable fix for the
 * convention slip surfaced in the first refresh round (intra-week values
 * used as "the latest weekly close").
 *
 * P2 refactor (2026-07-11, automation plan §B Stage 3): this CLI is now a
 * THIN WRAPPER over the shared pure engine at
 * `apps/web/scripts/market-refresh/lib/regime-engine.mjs` — the pipeline
 * (`market-refresh/run.mjs`) imports the SAME functions, so there is no
 * second implementation to drift (Principle 4). The strict-Friday and
 * candle-lock conventions are LOCKED in the engine; the P1 guards (F-M2
 * stale-input gate, F-M3 anchors + coherence) travel with it.
 *
 * Usage:
 *   node apps/web/scripts/data-fetchers/compute-regime.mjs [--archive]
 *
 * Outputs to stdout: per-signal evaluation, group totals, score → band,
 * anchors (F-M3), reconciliation vs the published regime.json. Read-only by
 * default; pass --archive to also append a line to the run archive (that
 * ledger governs the published history chart — see 5.137 below).
 *
 * Data sources (all free, no API key required):
 *   - BTC monthly closes: in-repo monthlyPrices.json (authoritative, §5.1)
 *   - DXY/US10Y/M2/Nasdaq: FRED public CSV
 *   - Gold: Yahoo GC=F (SUBSTITUTE — FRED LBMA retired; D-gold-2026-05-29)
 *   - BTC weekly: Yahoo BTC-USD
 *   - ETF-01: the shared `resolveEtfSignals` route — Polygon shares ledger
 *     first, manual file as the auto-expiring fallback (doc 02 §10.1)
 *
 * Note: this script computes signal states but does NOT write editorial
 * files. The full pipeline (fetch → quality gate → computed.json) is
 * `market-refresh/run.mjs`; editorial writes go through the pre-write gate
 * per market-editorial.md §7.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateBtcStructure,
  evaluateMacro,
  evaluateRelativeStrength,
  scoreSignals,
  anchorCoherence,
} from '../market-refresh/lib/regime-engine.mjs';
import { readSnapshots, resolveEtfSignals } from '../market-refresh/lib/etf-flows.mjs';
import { fetchFredSeries } from '../market-refresh/providers/fred.mjs';
import { fetchYahooDaily } from '../market-refresh/providers/yahoo.mjs';
import { btcMonths } from '../market-refresh/providers/inrepo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const REGIME_PATH = path.join(REPO_ROOT, 'apps/web/data/market/shared/regime.json');
const ARCHIVE_PATH = path.join(REPO_ROOT, 'apps/web/data/market/shared/run-archive.jsonl');
const ETF_MANUAL_PATH = path.join(REPO_ROOT, 'apps/web/data/market/shared/etf01-manual.json');

const TODAY = new Date();

async function main() {
  const [dxy, us10y, m2, nasdaq, btcD, gold] = await Promise.all([
    fetchFredSeries('DTWEXBGS'),
    fetchFredSeries('DGS10'),
    fetchFredSeries('M2SL'),
    fetchFredSeries('NASDAQCOM'),
    fetchYahooDaily('BTC-USD', '6mo'),
    fetchYahooDaily('GC=F', '1y'),
  ]);

  const btc = evaluateBtcStructure(btcMonths(), TODAY);
  const macro = evaluateMacro(
    { dxyDaily: dxy.series, us10yDaily: us10y.series, m2Monthly: m2.series },
    TODAY
  );
  const rel = evaluateRelativeStrength(
    { btcDaily: btcD.series, goldDaily: gold.series, nasdaqDaily: nasdaq.series },
    TODAY
  );
  const etfManual = fs.existsSync(ETF_MANUAL_PATH)
    ? JSON.parse(fs.readFileSync(ETF_MANUAL_PATH, 'utf8'))
    : null;
  // 5.136 (audit 2026-08-24): route ETF-01 through the SAME resolver the
  // pipeline uses. This CLI previously called evaluateEtfManual directly
  // against a file that expired 2026-07-18, so it scored ETF-01 UNAVAILABLE
  // and printed 8/14 against a published 10/14 — the verification tool
  // contradicting the thing it verifies.
  const etf = resolveEtfSignals({ snapshots: readSnapshots(), manual: etfManual }, TODAY);

  const all = [...btc, ...macro, ...etf, ...rel];
  console.log('\n=== Signal evaluation ===');
  for (const s of all) {
    const pts = s.state === 'ACTIVE' ? s.weight : 0;
    console.log(
      `  ${s.id.padEnd(8)} [${String(s.state).padEnd(11)}] ${pts}/${s.weight}  — ${s.detail}`
    );
  }

  const { groupTotals, score, band } = scoreSignals({ btc, macro, etf, rel });

  console.log('\n=== Group totals ===');
  console.log(`  BTC Structure (max 6):        ${groupTotals.btc_structure}`);
  console.log(`  Macro Environment (max 3):    ${groupTotals.macro_environment}`);
  console.log(`  Institutional Demand (max 2): ${groupTotals.institutional_demand}`);
  console.log(`  Relative Strength (max 3):    ${groupTotals.relative_strength}`);

  console.log(`\n=== Total: ${score} / 14 → ${band.code} (${band.label}) ===`);

  // === P1 guard (F-M3): per-signal anchor printout + coherence check ======
  const anchored = all.filter((x) => x.anchor);
  console.log('\n=== Anchors (F-M3) ===');
  for (const x of anchored) {
    console.log(`  ${x.id.padEnd(8)} ${x.anchorKind.padEnd(8)} ${x.anchor}`);
  }
  const { spreadDays, warning } = anchorCoherence(all);
  if (warning) console.log(`\n  ⚠ ANCHOR COHERENCE (F-M3): ${warning}`);
  else console.log(`  Weekly anchor spread: ${spreadDays.toFixed(0)}d (coherent)`);

  // === P1: reconciliation vs the published regime.json ====================
  let published = null;
  try {
    published = JSON.parse(fs.readFileSync(REGIME_PATH, 'utf8'));
  } catch {
    /* published file absent (fresh clone mid-edit) — archive still records computed */
  }
  if (published) {
    if (published.score !== score || published.regime_code !== band.code) {
      console.log(
        `\n  ⚠ PUBLISH DRIFT: computed ${score}/${band.code} vs published ` +
          `${published.score}/${published.regime_code} — expected mid-refresh; ` +
          `unexpected on a verification re-run.`
      );
    } else {
      console.log(`  Published regime.json matches (${score}/${band.code}).`);
    }
  }

  // === P1: append-only run archive =========================================
  // 5.137 (audit 2026-08-24): archiving is OPT-IN here. `run-archive.jsonl` is
  // the provenance ledger that authorises which points the published history
  // chart may show (fixtures.test.ts reconciles chart points against its run
  // days). A verification run on a non-run day used to mint a phantom run day
  // in that ledger — a read-only check must not write history.
  if (process.argv.includes('--archive')) {
    const line = {
      run_at: new Date().toISOString(),
      pipeline: 'data-fetchers/compute-regime.mjs',
      computed: { score, regime_code: band.code, group_totals: groupTotals },
      published: published ? { score: published.score, regime_code: published.regime_code } : null,
      anchor_spread_days: Number(spreadDays.toFixed(2)),
      anchor_warning: warning,
      signals: all.map(({ id, state, weight, detail, anchor = null, anchorKind = null }) => ({
        id,
        state,
        weight,
        detail,
        anchor,
        anchorKind,
      })),
    };
    fs.appendFileSync(ARCHIVE_PATH, JSON.stringify(line) + '\n');
    console.log(`  Archived run → ${path.relative(REPO_ROOT, ARCHIVE_PATH)}`);
  }
  console.log('');
}

// Only run if invoked directly (allows import for tests)
const isDirectInvocation = import.meta.url === `file://${process.argv[1]}`;
if (isDirectInvocation) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
