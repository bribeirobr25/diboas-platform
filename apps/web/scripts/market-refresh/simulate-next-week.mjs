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
 *   E  ETF collection incomplete (2026-10-19) — +7d, the pull returns prices but
 *                           no share counts: refused as ledger data, kept in
 *                           etf-snapshot-attempts.jsonl, ledger byte-identical;
 *                           then a complete pull for the SAME week is accepted
 *                           and the evidence is preserved
 *   F  two unmerged weeks carried into one run (C1a, 5.632, 2026-10-28) — the
 *                           refresh PR was not merged, so the next run starts
 *                           from main with that PR's data on top
 *                           (carry-open-pr.mjs) and appends its own week: two
 *                           archive lines and two ETF snapshots beyond main.
 *                           The gate passes; ETF-01 stays suspended with 0
 *                           points (records are not usable coverage); the
 *                           ledger check is green; the weekly wording still
 *                           compares weeks 7 days apart; a complete duplicate
 *                           of a recorded week is not collected twice; a week
 *                           holding an incomplete record is kept as written
 *                           (the run's exit 21).
 * A successful collection (A, B) copies the latest COMPLETE record's funds onto
 * the next anchor (synthetic, test-only): copying the latest record would copy
 * an incomplete one once the ledger holds it (the 2026-10-16 record does).
 * ETF-01 is re-scored with the REAL engine and archive functions after the
 * ledger moves, and the score / band follow through `scoreSignals` — so the
 * generated copy is what a real run would produce, not a stale ACTIVE record
 * sitting beside a gapped ledger.
 *
 *   node apps/web/scripts/market-refresh/simulate-next-week.mjs
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT, SHARED_DIR, MONTHLY_PRICES_PATH } from './providers/inrepo.mjs';
import { isDirectInvocation } from './lib/invocation.mjs';
import { resolveEtfSignals, readSnapshots, recordEtfSnapshot } from './lib/etf-flows.mjs';
import { isCompleteSnapshot, ledgerCoverage } from './lib/etf-coverage.mjs';
import { ETF01_SUSPENSION, isSuspendedEtf } from './lib/etf-suspension.mjs';
import { archiveSignals } from './lib/archive.mjs';
import { appendJsonlLine, readJsonlTolerant } from './lib/jsonl.mjs';
import { scoreSignals, anchorCoherence, ETF_VARIANT, MAX_SCORE } from './lib/regime-engine.mjs';

const SHARED = SHARED_DIR;
// Scenario D (5.478) also writes the monthly series the pipeline appends to, so
// it is covered by the same dirty-tree refusal, snapshot and restore.
const MONTHLY = MONTHLY_PRICES_PATH;
const WATCHED = [SHARED, MONTHLY];
const MONTHLY_KEY = '\u0000monthlyPrices.json';
/**
 * Test directories OUTSIDE the weekly blocking step whose tests read the monthly
 * series the pipeline writes (they gate the refresh PR's own CI). Exported so
 * `releaseGateBoundary.test.ts` can assert every declared reader lives in one of
 * them — one list, not two that drift.
 */
/**
 * The weekly workflow's BLOCKING test step, as pnpm arguments. Run verbatim by
 * every scenario; `workflowGuards.test.ts` pins it to the workflow file, so the
 * simulator cannot quietly drift from the gate it claims to rehearse
 * (2026-10-18 compliance pass).
 */
export const WEEKLY_BLOCKING_VITEST_ARGS = Object.freeze([
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

export const PIPELINE_READER_DIRS = [
  'src/lib/asset-history',
  'src/lib/time-to-target',
  'src/lib/emergency-fund',
  'src/lib/idle-cash',
  'src/lib/inflation-impact',
  'src/lib/currency-depreciation',
];
const DAY_MS = 86400000;
const shiftIso = (iso, d) => new Date(Date.parse(iso) + d * DAY_MS).toISOString();
const shiftDay = (day, d) => shiftIso(`${day}T00:00:00Z`, d).slice(0, 10);

function assertClean() {
  const out = execFileSync('git', ['status', '--porcelain', ...WATCHED], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  if (out) {
    throw new Error(
      `market data is already modified — commit or restore first so the rollback is unambiguous:\n${out}`
    );
  }
}

const snapshot = () => ({
  ...Object.fromEntries(
    fs.readdirSync(SHARED).map((f) => [f, fs.readFileSync(path.join(SHARED, f))])
  ),
  [MONTHLY_KEY]: fs.readFileSync(MONTHLY),
});

const restore = (snap) => {
  // A scenario may CREATE a file (E writes the attempts ledger): remove what
  // was not there, or it leaks into the next scenario and dirties the tree.
  for (const f of fs.readdirSync(SHARED)) if (!(f in snap)) fs.rmSync(path.join(SHARED, f));
  for (const [f, buf] of Object.entries(snap))
    fs.writeFileSync(f === MONTHLY_KEY ? MONTHLY : path.join(SHARED, f), buf);
};

/**
 * Append `n` synthetic month-rolls to EVERY price series, each a large move
 * (`factor` per month) with a consistent OHLC bar and the price-only close scaled
 * with it. The values are deliberately extreme: a test that only passes for this
 * month's prices — a band on a moving number, a bounded month count — fails here
 * before a real month-roll fails it on a Monday (5.478).
 */
function rollMonths(n, factor) {
  const data = JSON.parse(fs.readFileSync(MONTHLY, 'utf8'));
  const nextYm = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  };
  for (const series of Object.values(data)) {
    for (let i = 0; i < n; i++) {
      const last = series.months[series.months.length - 1];
      const close = last.close * factor;
      const bar = {
        ym: nextYm(last.ym),
        open: last.close,
        high: Math.max(last.close, close) * 1.02,
        low: Math.min(last.close, close) * 0.98,
        close,
      };
      if (last.closePriceOnly != null) bar.closePriceOnly = last.closePriceOnly * factor;
      series.months.push(bar);
    }
  }
  fs.writeFileSync(MONTHLY, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

/**
 * Move the world on by one cycle, the way a real run leaves it.
 * @param {{ days: number, etfDays: number | null, etfIncomplete?: boolean }} opts
 *   etfDays = how far the new ETF anchor moves past the latest record (null =
 *   the ETF leg failed: nothing collected); etfIncomplete = the pull came back
 *   without share counts and goes through the real refusal (scenario E)
 */
function advance({ days, etfDays, etfIncomplete = false }) {
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

  // The ETF ledger (append-only) gains a row unless the leg failed or the pull
  // was incomplete (then the REAL refusal runs and the ledger must not change).
  const etfPath = p('etf-shares-weekly.jsonl');
  let etf = 0;
  let refusal = null;
  if (fs.existsSync(etfPath)) {
    const rows = readSnapshots(etfPath);
    if (etfDays !== null) {
      const nextAnchor = shiftDay(rows[rows.length - 1].anchor, etfDays);
      const base = [...rows].reverse().find(isCompleteSnapshot);
      if (etfIncomplete) {
        const before = fs.readFileSync(etfPath);
        const funds = Object.fromEntries(
          Object.entries(base.funds).map(([t, f]) => [t, { ...f, shares: null }])
        );
        const res = recordEtfSnapshot(
          { anchor: nextAnchor, funds },
          {
            attemptedAt: computed.computed_at,
            source: 'simulator',
            ledgerPath: etfPath,
            attemptsPath: p('etf-snapshot-attempts.jsonl'),
          }
        );
        if (res.outcome !== 'refused' || !fs.readFileSync(etfPath).equals(before))
          throw new Error(`an incomplete collection was not refused cleanly: ${res.outcome}`);
        refusal = { anchor: nextAnchor, complete: { anchor: nextAnchor, funds: base.funds } };
      } else {
        appendJsonlLine(etfPath, JSON.stringify({ ...base, anchor: nextAnchor }));
      }
    }
    etf = readSnapshots(etfPath).length;
  }

  // Re-score ETF-01 from the moved ledger with the real engine + archive seam,
  // then carry the score and band through the real scorer.
  const ledger = readSnapshots(etfPath);
  const at = new Date(computed.computed_at);
  // The PRODUCTION route (2026-10-18): `resolveEtfSignals` is what run.mjs and
  // compute-regime.mjs call, so the suspension applies here exactly as it will
  // on Monday. Calling `evaluateEtf01FromFlows` directly used to bypass it.
  const [etfRecord] = archiveSignals(
    [...resolveEtfSignals({ snapshots: ledger, manual: null }, at)],
    {
      etfSnapshotCount: ledgerCoverage(ledger).complete,
    }
  );
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
  // The tolerant reader (lib/jsonl.mjs): a torn line in the real archive must
  // not crash the rehearsal or be taken for the last run.
  const archive = readJsonlTolerant(fs.readFileSync(p('run-archive.jsonl'), 'utf8'));
  const lastRun = archive[archive.length - 1];
  lastRun.run_at = computed.computed_at;
  lastRun.computed = { score, regime_code: band.code, group_totals: groupTotals };
  lastRun.signals = computed.signals;
  lastRun.anchor_spread_days = computed.anchor_spread_days;
  lastRun.anchor_warning = computed.anchor_warning;
  appendJsonlLine(p('run-archive.jsonl'), JSON.stringify(lastRun));

  return {
    refusal,
    weekly,
    archive: archive.length + 1,
    etf,
    etfState: etfRecord.state,
    etfVariant: etfRecord.values?.variant ?? null,
    score,
    band: band.code,
  };
}

// 2026-10-18: while the ETF-01 suspension is active, every scenario publishes the
// suspended variant (the gap and warm-up wordings are unreachable in production
// and stay covered by etfFlows.test.ts). Scenario A starts from the committed
// archive, whose last run predates the suspension, so it is also the cycle on
// which the suspension STARTS: the opener must separate the data effect from
// what the other signals did.
const SUSPENDED = ETF01_SUSPENSION.active;
const etfExpectation = (fallback) =>
  SUSPENDED ? { state: 'UNAVAILABLE', variant: ETF_VARIANT.SUSPENDED } : fallback;

const SCENARIOS = [
  {
    key: 'A',
    name: 'normal week (monthly sources not rolled)',
    days: 7,
    etfDays: 7,
    expectEtf: etfExpectation(undefined),
    expectEtfSentence: SUSPENDED || undefined,
  },
  {
    key: 'B',
    name: 'skip week — previous refresh PR never merged',
    days: 14,
    etfDays: 14,
    expectEtf: etfExpectation({ state: 'UNAVAILABLE', variant: ETF_VARIANT.GAPPED }),
    // What the READER sees (5.476): the variant sentence in every locale, never the
    // warm-up one ("…of 5 weekly share-count snapshots recorded").
    expectEtfSentence: true,
  },
  {
    key: 'C',
    name: 'ETF leg failed — no new snapshot',
    days: 7,
    etfDays: null,
    expectEtf: etfExpectation(undefined),
    expectEtfSentence: SUSPENDED || undefined,
  },
  {
    key: 'E',
    name: 'ETF collection incomplete — refused, kept as evidence, then retried',
    days: 7,
    etfDays: 7,
    etfIncomplete: true,
    expectEtf: etfExpectation(undefined),
    expectEtfSentence: SUSPENDED || undefined,
  },
  {
    key: 'F',
    name: 'two unmerged weeks carried into one run (C1a)',
    days: 7,
    etfDays: 7,
    weeks: 2,
    expectEtf: etfExpectation(undefined),
    expectEtfSentence: SUSPENDED || undefined,
  },
  {
    key: 'D',
    name: 'three month-rolls at +25%/month — tests reading pipeline-written monthly data',
    monthRolls: 3,
    factor: 1.25,
  },
];

/**
 * The published ETF-01 sentence must be the record's own variant in all four
 * locales, rendered from the real template, and never the warm-up wording. Reads
 * what generate.mjs just wrote, so it checks the seam the 5.476 defect lived in,
 * not the engine's return value. For the suspended variant (2026-10-18) it also
 * checks the other places the suspension must be explained: the panel row, the
 * group summary and the plain read.
 */
function assertEtfSentence() {
  const tplAll = JSON.parse(
    fs.readFileSync(
      path.join(REPO_ROOT, 'apps/web/scripts/market-refresh/templates/signal-sentences.json'),
      'utf8'
    )
  );
  const tpl = tplAll['ETF-01'].UNAVAILABLE;
  const signals = JSON.parse(fs.readFileSync(path.join(SHARED, 'signals.json'), 'utf8'));
  const etf = signals.groups.flatMap((g) => g.signals).find((x) => x.id === 'ETF-01');
  const record = JSON.parse(
    fs.readFileSync(path.join(SHARED, 'computed.json'), 'utf8')
  ).signals.find((x) => x.id === 'ETF-01');
  const variant = record.values?.variant;
  const fail = (msg) => {
    throw Object.assign(new Error(msg), { stdout: '' });
  };
  for (const locale of ['en', 'pt-BR', 'es', 'de']) {
    const expected = tpl.variants[variant][locale].replace(
      '{gapDays}',
      String(record.values.gapDays)
    );
    if (etf.summary[locale] !== expected)
      fail(
        `ETF-01 ${locale} sentence is not the ${variant} variant:\n  got: ${etf.summary[locale]}`
      );
  }
  // The panel is the seam's SECOND consumer (data-status.mjs branches on the same
  // `variant`): the ETF row must be UNAVAILABLE and say why, not "warming up".
  const panel = JSON.parse(fs.readFileSync(path.join(SHARED, 'data-status.json'), 'utf8'));
  const row = panel.sources.find((x) => x.source.startsWith('Polygon:ETF'));
  const reason =
    variant === ETF_VARIANT.GAPPED ? `${record.values.gapDays}-day gap` : 'is suspended';
  if (row?.status !== 'UNAVAILABLE' || !String(row?.message).includes(reason))
    fail(`ETF panel row does not say why: ${row?.status} · ${row?.message}`);
  if (/scored from the trailing/.test(String(row?.message)))
    fail(`ETF panel row claims ETF-01 is scored while it is ${variant}`);
  if (variant === ETF_VARIANT.SUSPENDED) {
    const groupsTpl = JSON.parse(
      fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/scripts/market-refresh/templates/group-summaries.json'),
        'utf8'
      )
    ).institutional_demand.suspended;
    const openers = JSON.parse(
      fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/scripts/market-refresh/templates/weekly-openers.json'),
        'utf8'
      )
    );
    const regime = JSON.parse(fs.readFileSync(path.join(SHARED, 'regime.json'), 'utf8'));
    // The previous run is the archive's second-to-last line (this cycle's line
    // was just appended); the suspension starts here if that run was not suspended.
    const runs = readJsonlTolerant(fs.readFileSync(path.join(SHARED, 'run-archive.jsonl'), 'utf8'));
    const previous = runs[runs.length - 2] ?? {};
    const prevEtf = (previous.signals ?? []).find((x) => x.id === 'ETF-01');
    const startsThisCycle = !isSuspendedEtf(prevEtf);
    const group = regime.signal_groups.find((g) => g.id === 'institutional_demand');
    for (const locale of ['en', 'pt-BR', 'es', 'de']) {
      const head = groupsTpl[locale].split('{')[0];
      if (!String(group.summary[locale]).startsWith(head))
        fail(`group summary ${locale} is not the suspended variant: ${group.summary[locale]}`);
      // On the cycle the suspension STARTS, the plain read must open by saying so
      // (the data effect, before what the other signals did). Later cycles carry
      // the reduced-coverage note on the page instead (regime.coverage, below).
      const plain = String(regime.summary[locale].plain);
      const announced =
        plain.startsWith(openers.suspensionStart[locale].split('{')[0]) ||
        plain.startsWith(openers.suspensionStartNoPoints[locale].split('{')[0]);
      if (startsThisCycle && !announced)
        fail(`plain read ${locale} does not announce the suspension on the cycle it starts`);
    }
    if (!regime.coverage?.suspended?.some((x) => x.signal_id === 'ETF-01'))
      fail('regime.coverage does not name the suspended ETF-01');
  }
  console.log(`  ✓ ETF-01 publishes the ${variant} wording ×4 locales and the panel says why`);
}

/**
 * Scenario E: the panel names the refused attempt without being dated by it,
 * and a complete pull for the same week is then accepted with the evidence
 * file left byte-identical.
 */
function assertRefusalAndRetry({ anchor, complete }) {
  const fail = (msg) => {
    throw Object.assign(new Error(msg), { stdout: '' });
  };
  const ledgerPath = path.join(SHARED, 'etf-shares-weekly.jsonl');
  const attemptsPath = path.join(SHARED, 'etf-snapshot-attempts.jsonl');
  const panel = JSON.parse(fs.readFileSync(path.join(SHARED, 'data-status.json'), 'utf8'));
  const row = panel.sources.find((x) => x.source.startsWith('Polygon:ETF'));
  if (!String(row?.message).includes(`latest collection attempt (anchor ${anchor}`))
    fail(`ETF panel row does not name the refused attempt: ${row?.message}`);
  if (String(row?.last_updated_at).startsWith(anchor))
    fail(`ETF panel row is dated by the refused attempt: ${row?.last_updated_at}`);
  const evidence = fs.readFileSync(attemptsPath);
  const res = recordEtfSnapshot(complete, {
    attemptedAt: new Date().toISOString(),
    source: 'simulator',
    ledgerPath,
    attemptsPath,
  });
  if (res.outcome !== 'recorded')
    fail(`a complete retry for ${anchor} was not accepted: ${res.outcome}`);
  if (!fs.readFileSync(attemptsPath).equals(evidence)) fail('the retry rewrote the evidence file');
  console.log(
    `  ✓ incomplete pull refused and kept as evidence; a complete retry for ${anchor} is accepted`
  );
}

const sh = (cmd, args) =>
  execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' });

/**
 * Scenario F (C1a): what a carried run must still guarantee, after the gate.
 * Every input is the scenario's own: the baseline is git HEAD, and the
 * incomplete week is appended here rather than looked for in the ledger.
 */
function assertCarry({ baseline, generated }) {
  const fail = (msg) => {
    throw Object.assign(new Error(msg), { stdout: '' });
  };
  const ledgerPath = path.join(SHARED, 'etf-shares-weekly.jsonl');
  const attemptsPath = path.join(SHARED, 'etf-snapshot-attempts.jsonl');
  const archive = readJsonlTolerant(
    fs.readFileSync(path.join(SHARED, 'run-archive.jsonl'), 'utf8')
  );
  const ledger = readSnapshots(ledgerPath);
  if (archive.length !== baseline.archive + 2)
    fail(`expected 2 archive lines beyond main, got ${archive.length - baseline.archive}`);
  if (ledger.length !== baseline.etf + 2)
    fail(`expected 2 ETF snapshots beyond main, got ${ledger.length - baseline.etf}`);
  const computed = JSON.parse(fs.readFileSync(path.join(SHARED, 'computed.json'), 'utf8'));
  const etf01 = computed.signals.find((x) => x.id === 'ETF-01');
  if (SUSPENDED && (etf01.state !== 'UNAVAILABLE' || etf01.points !== 0))
    fail(`ETF-01 must stay UNAVAILABLE with 0 points, got ${etf01.state}/${etf01.points}`);
  if (!/weekly-opener: on/.test(generated))
    fail('the weekly opener is off: the last two run days are not read as a week apart');
  // The ledger check of the workflow, against main (HEAD), sees two whole weeks appended.
  const status = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sim-ledgers-')), 'status');
  try {
    sh('node', ['apps/web/scripts/market-refresh/check-ledgers.mjs', '--status', status]);
    const got = fs.readFileSync(status, 'utf8').trim();
    if (got !== 'ok') fail(`ledger check status ${got} with two carried weeks`);
  } finally {
    fs.rmSync(status, { force: true });
  }
  // A complete duplicate of a recorded week is not collected twice.
  const latest = ledger[ledger.length - 1];
  const before = fs.readFileSync(ledgerPath);
  const dup = recordEtfSnapshot(latest, {
    attemptedAt: computed.computed_at,
    source: 'simulator',
    ledgerPath,
    attemptsPath,
  });
  if (dup.outcome !== 'already-recorded' || !fs.readFileSync(ledgerPath).equals(before))
    fail(`a complete duplicate of ${latest.anchor} was not refused cleanly: ${dup.outcome}`);
  // A week holding an incomplete record (written before the completeness rule)
  // is kept as written: the run maps this to exit 21 (run.mjs incompleteRecord).
  const nextAnchor = shiftDay(latest.anchor, 7);
  const incomplete = {
    ...latest,
    anchor: nextAnchor,
    funds: Object.fromEntries(
      Object.entries(latest.funds).map(([t, f]) => [t, { ...f, shares: null }])
    ),
  };
  appendJsonlLine(ledgerPath, JSON.stringify(incomplete));
  const withIncomplete = fs.readFileSync(ledgerPath);
  const kept = recordEtfSnapshot(
    { ...latest, anchor: nextAnchor },
    { attemptedAt: computed.computed_at, source: 'simulator', ledgerPath, attemptsPath }
  );
  const stored = readSnapshots(ledgerPath).find((x) => x.anchor === nextAnchor);
  if (
    kept.outcome !== 'already-recorded' ||
    isCompleteSnapshot(stored) ||
    !fs.readFileSync(ledgerPath).equals(withIncomplete)
  )
    fail(`a week holding an incomplete record was not kept as written: ${kept.outcome}`);
  console.log(
    '  ✓ two carried weeks: ledger check ok; ETF-01 0 points; weekly wording on; a duplicate week and an incomplete-record week are not collected again'
  );
}

function main() {
  assertClean();
  const snap = snapshot();
  const only = process.argv.find((a) => /^--scenario=/.test(a))?.split('=')[1];
  const failures = [];
  try {
    for (const sc of SCENARIOS.filter((x) => !only || x.key === only)) {
      restore(snap);
      try {
        if (sc.monthRolls) {
          // Scenario D gates the refresh PR's own CI, not the bot pre-flight: these
          // tests stay out of the blocking step on purpose (a failure there would
          // kill the run and lose that week's ETF snapshot). See 5.478.
          rollMonths(sc.monthRolls, sc.factor);
          console.log(
            `\n=== scenario ${sc.key}: ${sc.name} ===\n` +
              `  ${sc.monthRolls} synthetic bars appended to every monthly price series`
          );
          execFileSync(
            'pnpm',
            ['--filter', 'web', 'exec', 'vitest', 'run', ...PIPELINE_READER_DIRS],
            { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' }
          );
          console.log(`  ✓ the tests reading pipeline-written monthly data pass (scenario D)`);
          continue;
        }
        const baseline = sc.weeks
          ? {
              archive: readJsonlTolerant(
                fs.readFileSync(path.join(SHARED, 'run-archive.jsonl'), 'utf8')
              ).length,
              etf: readSnapshots(path.join(SHARED, 'etf-shares-weekly.jsonl')).length,
            }
          : null;
        // F: the previous week sits unmerged on the PR branch and is carried in,
        // with the editorial files its own run generated (the opener compares
        // against them, as the real carried PR's files are).
        for (let w = 1; w < (sc.weeks ?? 1); w += 1) {
          advance(sc);
          sh('node', ['apps/web/scripts/market-refresh/generate.mjs']);
        }
        const moved = advance(sc);
        console.log(
          `\n=== scenario ${sc.key}: ${sc.name} ===\n` +
            `  computed_at +${sc.days}d · ${moved.weekly} weekly anchors moved · ` +
            `archive ${moved.archive} lines · ETF ${moved.etf} snapshots · ` +
            `ETF-01 ${moved.etfState}${moved.etfVariant ? `/${moved.etfVariant}` : ''} · ${moved.score}/${MAX_SCORE} ${moved.band}`
        );
        if (sc.expectEtf) {
          const got = { state: moved.etfState, variant: moved.etfVariant ?? undefined };
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
        const generated = sh('node', ['apps/web/scripts/market-refresh/generate.mjs']);
        if (sc.expectEtfSentence) assertEtfSentence(moved);
        // The workflow's own blocking command, verbatim, with its enforcement env.
        execFileSync('pnpm', [...WEEKLY_BLOCKING_VITEST_ARGS], {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env, MARKET_STALENESS_ENFORCE: '1' },
        });
        console.log(`  ✓ the weekly blocking gate passes (scenario ${sc.key})`);
        // After the gate: a retry is a LATER run, which regenerates first.
        if (moved.refusal) assertRefusalAndRetry(moved.refusal);
        if (sc.weeks) assertCarry({ baseline, generated });
      } catch (err) {
        failures.push(sc.key);
        console.error(
          sc.monthRolls
            ? `\n  ✖ scenario ${sc.key} would turn the refresh PR's CI red after a month-roll:\n`
            : `\n  ✖ scenario ${sc.key} would FAIL the weekly run:\n`
        );
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
    const dirty = execFileSync('git', ['status', '--porcelain', ...WATCHED], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    console.log(dirty ? `  ⚠ RESTORE INCOMPLETE:\n${dirty}` : '  data restored — tree clean');
  }
  process.exit(failures.length ? 1 : 0);
}

if (isDirectInvocation(import.meta.url)) main();
