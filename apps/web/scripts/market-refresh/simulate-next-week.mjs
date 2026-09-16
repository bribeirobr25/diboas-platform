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
 *   node apps/web/scripts/market-refresh/simulate-next-week.mjs
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './providers/inrepo.mjs';
import { isDirectInvocation } from './lib/invocation.mjs';

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

/** Move the world on by one weekly cycle, exactly as a real run leaves it. */
function advanceOneWeek(days = 7) {
  const p = (f) => path.join(SHARED, f);
  const computed = JSON.parse(fs.readFileSync(p('computed.json'), 'utf8'));
  computed.computed_at = shiftIso(computed.computed_at, days);
  // Weekly anchors move because the run re-fetches; monthly ones do not roll in 7 days.
  let weekly = 0;
  for (const s of computed.signals) {
    if (s.anchorKind === 'weekly' && s.anchor) {
      s.anchor = shiftDay(s.anchor, days);
      weekly += 1;
    }
  }
  fs.writeFileSync(p('computed.json'), `${JSON.stringify(computed, null, 2)}\n`);

  // Both append-only ledgers gain a row — the growth that broke 2026-09-14.
  const archive = fs.readFileSync(p('run-archive.jsonl'), 'utf8').trim().split('\n');
  const lastRun = JSON.parse(archive[archive.length - 1]);
  lastRun.run_at = computed.computed_at;
  fs.appendFileSync(p('run-archive.jsonl'), `${JSON.stringify(lastRun)}\n`);

  const etfPath = p('etf-shares-weekly.jsonl');
  let etf = 0;
  if (fs.existsSync(etfPath)) {
    const snaps = fs.readFileSync(etfPath, 'utf8').trim().split('\n');
    const last = JSON.parse(snaps[snaps.length - 1]);
    last.anchor = shiftDay(last.anchor, days);
    fs.appendFileSync(etfPath, `${JSON.stringify(last)}\n`);
    etf = snaps.length + 1;
  }
  return { weekly, archive: archive.length + 1, etf };
}

const sh = (cmd, args) =>
  execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' });

function main() {
  assertClean();
  const snap = snapshot();
  let failed = false;
  try {
    const moved = advanceOneWeek();
    console.log(
      `\n=== simulate-next-week ===\n` +
        `  computed_at +7d · ${moved.weekly} weekly anchors +7d · ` +
        `archive ${moved.archive} lines · ETF ${moved.etf} snapshots\n`
    );

    // The generator is the real one: the editorial layer must be regenerated
    // from the moved computed.json or the reconciliation gates fail for a
    // reason that has nothing to do with next week.
    sh('node', ['apps/web/scripts/market-refresh/generate.mjs']);
    console.log('  regenerated editorial JSONs from the advanced computed.json');

    // The workflow's own blocking command, verbatim.
    sh('pnpm', [
      '--filter',
      'web',
      'exec',
      'vitest',
      'run',
      'src/lib/market-data',
      'src/lib/analytics-sdk',
      '--exclude',
      '**/memoFigureReconciliation.test.ts',
    ]);
    console.log('\n  ✓ the weekly blocking gate passes against next week\n');
  } catch (err) {
    failed = true;
    console.error('\n  ✖ the weekly blocking gate would FAIL next Monday:\n');
    console.error(
      String(err.stdout ?? err.message)
        .split('\n')
        .slice(-40)
        .join('\n')
    );
    console.error(
      '\n  This is an expiry landmine: a test asserting something true only of\n' +
        "  THIS week's artefacts. Make it own its input or derive its expectation.\n"
    );
  } finally {
    restore(snap);
    const dirty = execFileSync('git', ['status', '--porcelain', SHARED], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    console.log(dirty ? `  ⚠ RESTORE INCOMPLETE:\n${dirty}` : '  data restored — tree clean');
  }
  process.exit(failed ? 1 : 0);
}

if (isDirectInvocation(import.meta.url)) main();
