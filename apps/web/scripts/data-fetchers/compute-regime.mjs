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
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';
import { MAX_SCORE } from '../market-refresh/lib/regime-engine.mjs';
import { readSnapshots } from '../market-refresh/lib/etf-flows.mjs';
import { archiveSignals, archiveLine } from '../market-refresh/lib/archive.mjs';
import {
  fetchMarketSources,
  assertMarketSourcesQuality,
  evaluateMarketSignals,
} from '../market-refresh/lib/market-sources.mjs';
import { MAX_BY_GROUP } from '../market-refresh/lib/group-summaries.mjs';
import { btcMonths, REPO_ROOT, SHARED_DIR } from '../market-refresh/providers/inrepo.mjs';

const REGIME_PATH = path.join(SHARED_DIR, 'regime.json');
const ARCHIVE_PATH = path.join(SHARED_DIR, 'run-archive.jsonl');
const ETF_MANUAL_PATH = path.join(SHARED_DIR, 'etf01-manual.json');

const TODAY = new Date();

async function main() {
  // 2026-10-18 compliance pass: the SAME fetch list, quality gate and engine as
  // the weekly pipeline (lib/market-sources.mjs). This script used to repeat
  // the six fetches and skip the gate, so with --archive it could record, in
  // the provenance ledger, data the pipeline would have refused.
  const sources = await fetchMarketSources();
  assertMarketSourcesQuality(sources, TODAY);
  const etfManual = fs.existsSync(ETF_MANUAL_PATH)
    ? JSON.parse(fs.readFileSync(ETF_MANUAL_PATH, 'utf8'))
    : null;
  // 5.136 (audit 2026-08-24): ETF-01 goes through the SAME resolver the
  // pipeline uses (now inside evaluateMarketSignals). This CLI once called
  // evaluateEtfManual directly against an expired file and printed 8/14
  // against a published 10/14 — the verification tool contradicting the
  // thing it verifies.
  const { all, groupTotals, score, band, spreadDays, warning } = evaluateMarketSignals({
    sources,
    btcMonths: btcMonths(),
    etfSnapshots: readSnapshots(),
    etfManual,
    today: TODAY,
  });

  console.log('\n=== Group totals ===');
  for (const [group, max] of Object.entries(MAX_BY_GROUP)) {
    console.log(`  ${group.padEnd(22)} (max ${max}): ${groupTotals[group]}`);
  }

  console.log(`\n=== Total: ${score} / ${MAX_SCORE} → ${band.code} (${band.label}) ===`);

  // === P1 guard (F-M3): per-signal anchor printout + coherence check ======
  const anchored = all.filter((x) => x.anchor);
  console.log('\n=== Anchors (F-M3) ===');
  for (const x of anchored) {
    console.log(`  ${x.id.padEnd(8)} ${x.anchorKind.padEnd(8)} ${x.anchor}`);
  }
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
    // 5.187a: this used to drop `points` and `values`, which could stop the
    // weekly generator the following Monday (state-lead reads prior.values).
    // Same producer as run.mjs now — there is one archive shape, not two.
    const line = archiveLine({
      runAt: new Date().toISOString(),
      pipeline: 'data-fetchers/compute-regime.mjs',
      score,
      regimeCode: band.code,
      groupTotals,
      published,
      anchorSpreadDays: Number(spreadDays.toFixed(2)),
      anchorWarning: warning,
      signals: archiveSignals(all, { etfSnapshotCount: readSnapshots().length }),
    });
    fs.appendFileSync(ARCHIVE_PATH, JSON.stringify(line) + '\n');
    console.log(`  Archived run → ${path.relative(REPO_ROOT, ARCHIVE_PATH)}`);
  }
  console.log('');
}

// Run ONLY when invoked directly: importing a writing script must be a no-op.
// Why, and the two footguns in the obvious implementation: lib/invocation.mjs.
// (The original note here said "allows import for tests" — no test imports
// this, and none should: --archive appends to the run ledger.)
if (isDirectInvocation(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
