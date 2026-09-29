/**
 * simulate-next-week.mjs — run the weekly blocking gate against NEXT Monday's
 * data, before next Monday does (PENDING_ALL 5.363).
 *
 * WHY THIS EXISTS. The weekly publish has failed four times in ten cycles, and
 * four of the five failures were the same step: the blocking test run. Three
 * different tests, one mechanism — each asserted something true of THIS week's
 * committed artefacts, and the refresh rewrites those artefacts every Monday.
 * The 2026-09-14 cycle died on `toBe(10)` run days when the run appended day 11.
 *
 * A test suite that is green today tells you nothing about Monday. This tells
 * you about Monday: it moves the clock forward a week the way a real run does,
 * regenerates the editorial layer with the REAL generator, and runs the exact
 * command the workflow's blocking step runs.
 *
 * SAFETY, because this mutates committed data in place:
 *   * it REFUSES to start if the market data directory is already dirty, so the
 *     restore can never be ambiguous;
 *   * it snapshots every file first and restores in a `finally`, so a failing
 *     gate still leaves the tree clean;
 *   * everything it touches is git-tracked, so `git checkout -- <dir>` is the
 *     backstop if the process is killed outright.
 *
 * It does NOT fetch. The point is the shape of next week's data, not its values.
 *
 * SCENARIOS (5.466, 2026-09-29). One "normal week" was not enough: on 2026-09-28
 * the real run failed on a state this simulator could not produce (the previous
 * refresh PR unmerged, so main's ETF ledger skipped a Friday), and on #629/#674
 * data it failed for a reason the real run did not have. Each scenario below is
 * a failure mode that HAPPENED or is PREDICTED, and each must PASS the blocking
 * gate, because each is a legitimate state of the world the pipeline must be able
 * to publish honestly:
 *   A  normal week        — +7d; monthly sources are NOT rolled, so they may go
 *                           DELAYED (the 2026-10-26 M2 case, 5.462)
 *   B  skip week          — +14d, one ETF Friday missing (2026-09-28, 5.463);
 *                           ETF-01 must publish UNAVAILABLE with the gapped wording
 *   C  ETF leg failed     — +7d, no new ETF snapshot (5.465)
 * ETF-01 is re-scored with the REAL engine and archive functions after the
 * ledger moves, and the score / band follow through `scoreSignals` — so the
 * generated copy is what a real run would produce, not a stale ACTIVE record
 * sitting beside a gapped ledger.
 *
 *   node apps/web/scripts/market-refresh/simulate-next-week.mjs
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './providers/inrepo.mjs';
import { isDirectInvocation } from './lib/invocation.mjs';
import { evaluateEtf01FromFlows, readSnapshots } from './lib/etf-flows.mjs';
import { archiveSignals } from './lib/archive.mjs';
import { scoreSignals, anchorCoherence } from './lib/regime-engine.mjs';

const SHARED = path.join(REPO_ROOT, 'apps/web/data/market/shared');
const DAY_MS = 86400000;
const shiftIso = (iso, d) => new Date(Date.parse(iso) + d * DAY_MS).toISOString();
const shiftDay = (day, d) => shiftIso(`${day}T00:00:00Z`, d).slice(0, 10);

function assertClean() {
  const out = execFileSync('git', ['status', '--porcelain', SHARED], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  if (out) {
    throw new Error(
      `market data is already modified — commit or restore first so the rollback is unambiguous:\n${out}`
    );
  }
}

const snapshot = () =>
  Object.fromEntries(fs.readdirSync(SHARED).map((f) => [f, fs.readFileSync(path.join(SHARED, f))]));

const restore = (snap) => {
  for (const [f, buf] of Object.entries(snap)) fs.writeFileSync(path.join(SHARED, f), buf);
};

/**
 * Move the world on by one cycle, the way a real run leaves it.
 * @param {{ days: number, etfDays: number | null }} opts  etfDays = how far the new
 *   ETF snapshot's anchor moves (null = the ETF leg failed: no snapshot appended)
 */
function advance({ days, etfDays }) {
  const p = (f) => path.join(SHARED, f);
  const computed = JSON.parse(fs.readFileSync(p('computed.json'), 'utf8'));
  computed.computed_at = shiftIso(computed.computed_at, days);
  // Weekly anchors move because the run re-fetches; monthly ones do not roll here
  // (deliberately — a late monthly print is a legitimate state, 5.462).
  let weekly = 0;
  for (const s of computed.signals) {
    if (s.anchorKind === 'weekly' && s.anchor && s.id !== 'ETF-01') {
      s.anchor = shiftDay(s.anchor, days);
      weekly += 1;
    }
  }

  // The ETF ledger (append-only) gains a row unless the leg failed.
  const etfPath = p('etf-shares-weekly.jsonl');
  let etf = 0;
  if (fs.existsSync(etfPath)) {
    const snaps = fs.readFileSync(etfPath, 'utf8').trim().split('\n');
    if (etfDays !== null) {
      const last = JSON.parse(snaps[snaps.length - 1]);
      last.anchor = shiftDay(last.anchor, etfDays);
      fs.appendFileSync(etfPath, `${JSON.stringify(last)}\n`);
    }
    etf = snaps.length + (etfDays !== null ? 1 : 0);
  }

  // Re-score ETF-01 from the moved ledger with the real engine + archive seam,
  // then carry the score and band through the real scorer.
  const ledger = readSnapshots(etfPath);
  const at = new Date(computed.computed_at);
  const [etfRecord] = archiveSignals([evaluateEtf01FromFlows(ledger, at)], {
    etfSnapshotCount: ledger.length,
  });
  computed.signals = computed.signals.map((s) => (s.id === 'ETF-01' ? etfRecord : s));
  const group = (prefix) => computed.signals.filter((s) => s.id.startsWith(prefix));
  const { groupTotals, score, band } = scoreSignals({
    btc: group('BTC-'),
    macro: group('MAC-'),
    etf: group('ETF-'),
    rel: group('REL-'),
  });
  computed.score = score;
  computed.regime_code = band.code;
  computed.group_totals = groupTotals;
  const coherence = anchorCoherence(computed.signals);
  computed.anchor_spread_days = Number(coherence.spreadDays.toFixed(2));
  computed.anchor_warning = coherence.warning;
  fs.writeFileSync(p('computed.json'), `${JSON.stringify(computed, null, 2)}\n`);

  // The run archive gains the matching line — the growth that broke 2026-09-14.
  const archive = fs.readFileSync(p('run-archive.jsonl'), 'utf8').trim().split('\n');
  const lastRun = JSON.parse(archive[archive.length - 1]);
  lastRun.run_at = computed.computed_at;
  lastRun.computed = { score, regime_code: band.code, group_totals: groupTotals };
  lastRun.signals = computed.signals;
  lastRun.anchor_spread_days = computed.anchor_spread_days;
  lastRun.anchor_warning = computed.anchor_warning;
  fs.appendFileSync(p('run-archive.jsonl'), `${JSON.stringify(lastRun)}\n`);

  return {
    weekly,
    archive: archive.length + 1,
    etf,
    etfState: etfRecord.state,
    etfVariant: etfRecord.values?.variant ?? null,
    score,
    band: band.code,
  };
}

const SCENARIOS = [
  { key: 'A', name: 'normal week (monthly sources not rolled)', days: 7, etfDays: 7 },
  {
    key: 'B',
    name: 'skip week — previous refresh PR never merged',
    days: 14,
    etfDays: 14,
    expectEtf: { state: 'UNAVAILABLE', variant: 'gapped' },
    // What the READER sees (5.476): the gapped sentence in every locale, never the
    // warm-up one ("…of 5 weekly share-count snapshots recorded").
    expectEtfSentence: { contains: '{gapDays}', never: 'warming up' },
  },
  { key: 'C', name: 'ETF leg failed — no new snapshot', days: 7, etfDays: null },
];

/**
 * The published ETF-01 sentence must be the gapped variant in all four locales:
 * rendered from the real template with the real gap length, and never the
 * warm-up wording. Reads what generate.mjs just wrote, so it checks the seam
 * the 5.476 defect lived in, not the engine's return value.
 */
function assertEtfSentence() {
  const tpl = JSON.parse(
    fs.readFileSync(
      path.join(REPO_ROOT, 'apps/web/scripts/market-refresh/templates/signal-sentences.json'),
      'utf8'
    )
  )['ETF-01'].UNAVAILABLE;
  const signals = JSON.parse(fs.readFileSync(path.join(SHARED, 'signals.json'), 'utf8'));
  const etf = signals.groups.flatMap((g) => g.signals).find((x) => x.id === 'ETF-01');
  const gapDays = JSON.parse(
    fs.readFileSync(path.join(SHARED, 'computed.json'), 'utf8')
  ).signals.find((x) => x.id === 'ETF-01').values.gapDays;
  for (const locale of ['en', 'pt-BR', 'es', 'de']) {
    const expected = tpl.variants.gapped[locale].replace('{gapDays}', String(gapDays));
    if (etf.summary[locale] !== expected)
      throw Object.assign(
        new Error(
          `ETF-01 ${locale} sentence is not the gapped variant:\n  got: ${etf.summary[locale]}`
        ),
        { stdout: '' }
      );
  }
  // The panel is the seam's SECOND consumer (data-status.mjs branches on the same
  // `variant`): the ETF row must be UNAVAILABLE and name the gap, not "warming up".
  const panel = JSON.parse(fs.readFileSync(path.join(SHARED, 'data-status.json'), 'utf8'));
  const row = panel.sources.find((x) => x.source.startsWith('Polygon:ETF'));
  if (row?.status !== 'UNAVAILABLE' || !String(row?.message).includes(`${gapDays}-day gap`))
    throw Object.assign(
      new Error(`ETF panel row does not name the gap: ${row?.status} · ${row?.message}`),
      { stdout: '' }
    );
  console.log(
    `  ✓ ETF-01 publishes the gapped sentence ×4 locales and the panel names the ${gapDays}-day gap`
  );
}

const sh = (cmd, args) =>
  execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' });

function main() {
  assertClean();
  const snap = snapshot();
  const only = process.argv.find((a) => /^--scenario=/.test(a))?.split('=')[1];
  const failures = [];
  try {
    for (const sc of SCENARIOS.filter((x) => !only || x.key === only)) {
      restore(snap);
      try {
        const moved = advance(sc);
        console.log(
          `\n=== scenario ${sc.key}: ${sc.name} ===\n` +
            `  computed_at +${sc.days}d · ${moved.weekly} weekly anchors moved · ` +
            `archive ${moved.archive} lines · ETF ${moved.etf} snapshots · ` +
            `ETF-01 ${moved.etfState}${moved.etfVariant ? `/${moved.etfVariant}` : ''} · ${moved.score}/14 ${moved.band}`
        );
        if (sc.expectEtf) {
          const got = { state: moved.etfState, variant: moved.etfVariant };
          if (got.state !== sc.expectEtf.state || got.variant !== sc.expectEtf.variant)
            throw Object.assign(
              new Error(
                `ETF-01 expected ${JSON.stringify(sc.expectEtf)}, got ${JSON.stringify(got)}`
              ),
              { stdout: '' }
            );
        }
        // The generator is the real one: the editorial layer must be regenerated
        // from the moved computed.json or the reconciliation gates fail for a
        // reason that has nothing to do with next week.
        sh('node', ['apps/web/scripts/market-refresh/generate.mjs']);
        if (sc.expectEtfSentence) assertEtfSentence(moved);
        // The workflow's own blocking command, verbatim, with its enforcement env.
        execFileSync(
          'pnpm',
          [
            '--filter',
            'web',
            'exec',
            'vitest',
            'run',
            'src/lib/market-data',
            'src/lib/analytics-sdk',
            '--exclude',
            '**/memoFigureReconciliation.test.ts',
          ],
          {
            cwd: REPO_ROOT,
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env, MARKET_STALENESS_ENFORCE: '1' },
          }
        );
        console.log(`  ✓ the weekly blocking gate passes (scenario ${sc.key})`);
      } catch (err) {
        failures.push(sc.key);
        console.error(`\n  ✖ scenario ${sc.key} would FAIL the weekly run:\n`);
        console.error(
          String(err.stdout || err.message)
            .split('\n')
            .slice(-40)
            .join('\n')
        );
      }
    }
    if (failures.length) {
      console.error(
        `\n  ✖ failing scenario(s): ${failures.join(', ')} — read the output above.\n` +
          "  The usual cause is a test asserting something true only of THIS week's\n" +
          '  artefacts: make it own its input or derive its expectation.\n'
      );
    } else {
      console.log('\n  ✓ every scenario passes the weekly blocking gate\n');
    }
  } finally {
    restore(snap);
    const dirty = execFileSync('git', ['status', '--porcelain', SHARED], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    console.log(dirty ? `  ⚠ RESTORE INCOMPLETE:\n${dirty}` : '  data restored — tree clean');
  }
  process.exit(failures.length ? 1 : 0);
}

if (isDirectInvocation(import.meta.url)) main();
