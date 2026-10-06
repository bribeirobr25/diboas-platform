/**
 * Which tests are weekly RELEASE GATES, declared (PENDING_ALL 5.363).
 *
 * THE PROBLEM THIS SOLVES. `market-refresh-weekly.yml` step 11 runs
 * `vitest run src/lib/market-data src/lib/analytics-sdk` — two WHOLE
 * DIRECTORIES. Every test in them therefore blocks the weekly publish, and
 * nothing anywhere tells an author that. Adding an ordinary unit test that
 * happens to read a committed artefact silently creates a weekly outage.
 *
 * It is not hypothetical. Across ten cycles, four failed, and four of the five
 * failures were this one step, from three different tests:
 *   2026-07-20  computedReconciliation — engine disagreed with the artefact
 *   2026-08-31  memoFigureReconciliation — memo quoted last week's figures
 *   2026-09-14  atomicWrites + freshness — pinned "10 run days" and one week's
 *               delayed-source list; the run appended day 11 and refreshed the
 *               anchors, and the cycle could not publish
 *
 * Three symptoms, one mechanism. This test makes the promotion DELIBERATE: a
 * file that reads live market data must appear below with a class and a reason,
 * so that "this is a weekly gate" is a decision someone made rather than a
 * side-effect of where the file happens to sit.
 *
 * It does NOT try to judge whether a live-data assertion is safe — that is not
 * mechanisable, and a heuristic here would be a liability. It only forces the
 * classification to exist and to be reviewed.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PIPELINE_READER_DIRS } from '../../../../scripts/market-refresh/simulate-next-week.mjs';

const DIRS = [join(__dirname, '.'), join(__dirname, '../../analytics-sdk/__tests__')];

/** What the weekly workflow excludes from its blocking step (gate-class rule). */
const NOT_IN_THE_BLOCKING_STEP = ['memoFigureReconciliation.test.ts'];

/** Anything that reaches for a committed artefact rather than a fixture. */
const LIVE_DATA = /data\/market\/shared|readSnapshots\(\)|MARKET_DIR|btcMonths\(\)/;

type Cls = 'WEEKLY-GATE' | 'UNIT-READS-LIVE';

/**
 * Every file permitted to read live market data, with WHY.
 *
 * `WEEKLY-GATE` — blocking the weekly publish IS this file's job. It compares
 * freshly generated artefacts and must run against real data.
 *
 * `UNIT-READS-LIVE` — a unit test that touches an artefact for shape or
 * relationship only. It must NOT assert a value that changes weekly; if it
 * does, it becomes a weekly outage. Prefer a fixture.
 */
const ALLOWED: Record<string, { cls: Cls; why: string }> = {
  'computedReconciliation.test.ts': {
    cls: 'WEEKLY-GATE',
    why: 'regime.json mirrors must equal computed.json — the drift gate itself',
  },
  'dataStatusDerivation.test.ts': {
    cls: 'WEEKLY-GATE',
    why: 'golden test: the derived panel must reproduce the committed one exactly',
  },
  'dataStatusMirror.test.ts': {
    cls: 'WEEKLY-GATE',
    why: 'the two committed copies of the panel must agree (F-M6)',
  },
  'fixtures.test.ts': {
    cls: 'WEEKLY-GATE',
    why: 'chart provenance (5.127): every published history point reconciles to a real run day',
  },
  'archiveShape.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'reads the newest archive line for its KEY SET only; key sets do not change weekly',
  },
  'atomicWrites.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'collapse rule checked against an independently derived day count, never a literal',
  },
  'etfFlows.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: "evaluates at the ledger's own last anchor and asserts CONSISTENCY — a gap in the window must publish UNAVAILABLE/gapped, four real weeks must be scored (5.463: never that the ledger has no gap)",
  },
  'freshness.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'reads the committed panel ONLY for identities (build-instant no-op, seam, badge agreement); every rule test runs on the FROZEN 2026-09-07 fixture (5.462: never that the live panel is HIGH)',
  },
  'watchingPhrases.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'derives the expectation from the data — for each ACTIVE signal its INACTIVE phrase must be absent',
  },
  'methodologyAttestation.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'reads methodology.json, which the weekly pipeline never writes — verified: zero references to it under scripts/market-refresh, one commit in its whole history (a path migration), and the refresh touches seven files, none of them this one',
  },
  'resilience.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'mocks the data modules to force failure paths; asserts none of their values',
  },
};

function testFiles() {
  const out: { name: string; src: string }[] = [];
  for (const dir of DIRS) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.test.ts') || f === 'releaseGateBoundary.test.ts') continue;
      if (NOT_IN_THE_BLOCKING_STEP.includes(f)) continue;
      out.push({ name: f, src: readFileSync(join(dir, f), 'utf8') });
    }
  }
  return out;
}

describe('every weekly release gate is declared, not inherited from a directory path', () => {
  it('should have no UNDECLARED file reading live market data', () => {
    const undeclared = testFiles()
      .filter((f) => LIVE_DATA.test(f.src))
      .map((f) => f.name)
      .filter((n) => !(n in ALLOWED));
    expect(
      undeclared,
      `these read committed market data and so BLOCK the weekly publish, but declare no class:\n` +
        `  ${undeclared.join('\n  ')}\n` +
        `Add them to ALLOWED with a reason, or read a fixture instead.`
    ).toEqual([]);
  });

  it('should not list a file that no longer reads live data (the list must stay honest)', () => {
    const actuallyReads = new Set(
      testFiles()
        .filter((f) => LIVE_DATA.test(f.src))
        .map((f) => f.name)
    );
    const stale = Object.keys(ALLOWED).filter((n) => !actuallyReads.has(n));
    expect(stale, 'listed but no longer reading live data — remove the entry').toEqual([]);
  });

  it('should give every declaration a non-empty reason', () => {
    for (const [name, e] of Object.entries(ALLOWED)) {
      expect(e.why.length, `${name} has no reason`).toBeGreaterThan(20);
    }
  });

  it('should keep the count of weekly-blocking live-data files visible and small', () => {
    // Not a floor, a LEDGER: this number going up is the thing to notice. Nine
    // of twenty-six files carried the weekly publish when this was written;
    // methodologyAttestation took it to ten on 2026-09-16.
    const gates = Object.values(ALLOWED).filter((e) => e.cls === 'WEEKLY-GATE').length;
    const units = Object.values(ALLOWED).filter((e) => e.cls === 'UNIT-READS-LIVE').length;
    expect(gates + units).toBe(Object.keys(ALLOWED).length);
    expect(gates).toBe(4);
    expect(units).toBe(7);
  });
});

/**
 * THE SAME DISCIPLINE, ONE DOOR FURTHER OUT (PENDING_ALL 5.478, 2026-10-06).
 *
 * The block above guards the two directories the weekly workflow's blocking step
 * runs. But the pipeline also WRITES `src/lib/market-data/data/monthlyPrices.json`
 * (the BTC candle via `--append-btc`, the tool series via `tools-monthlies.mjs`),
 * and tests elsewhere read it through `marketDataService`. On 2026-10-05 one of
 * them — `asset-history/__tests__/calculator.test.ts`, bounding a value every
 * month-roll moves — failed on the refresh PR, which therefore opened with red CI
 * that no memo rewrite could fix, and nothing had flagged it.
 *
 * These files deliberately stay OUT of the blocking step: a failure there kills
 * the run before the PR step and loses that week's non-backfillable ETF snapshot.
 * They gate on the PR's own CI instead (`PR-GATE-READS-PIPELINE-DATA`), so every
 * one must assert RULES or DERIVED values — never a band on a moving number. This
 * forces the declaration to exist; `market:simulate-next-week` scenario D
 * (a synthetic month-roll) is the executable check that they hold.
 */
const SRC = join(__dirname, '../../..'); // apps/web/src
const GUARDED = [join(__dirname, '.'), join(__dirname, '../../analytics-sdk/__tests__')];
const READS_PIPELINE_DATA =
  /marketDataService\.(get|getSync|getMonthlySeries)\(|data\/monthly(Prices|Fx|Inflation)\.json/;
const MOCKS_THE_SERVICE = /vi\.mock\(\s*['"]@\/lib\/market-data/;

const PIPELINE_DATA_READERS: Record<string, string> = {
  'lib/asset-history/__tests__/calculator.test.ts':
    'DCA replay over the live monthly series; values asserted against an INDEPENDENT replay of the committed JSON (5.478), never a band',
  'lib/asset-history/__tests__/unexpectedError.test.ts':
    'loads the live series only to exercise the error path; asserts error handling, not values',
  'lib/time-to-target/__tests__/calculator.test.ts':
    'uses the live snapshot as an input; asserts arithmetic rules and constants (TIMELINE_MAX_MONTHS), not market values',
  'lib/emergency-fund/__tests__/calculator.test.ts':
    'uses the live snapshot only for locale context; the asserted target is pure arithmetic of the inputs',
  'lib/idle-cash/__tests__/calculator.test.ts':
    'bands come from fixed SCENARIO_RATES on the en path (no FX); the live snapshot does not move them',
  'lib/idle-cash/__tests__/contract.test.ts':
    'contract/shape test over the live snapshot; asserts structure, not values',
  'lib/inflation-impact/__tests__/calculator.test.ts':
    'asserts directional rules (real value below nominal, loss below 100%) that hold for any inflation series',
  'lib/currency-depreciation/__tests__/calculator.test.ts':
    'asserts identities (USD stays 10000 against itself) and direction, not a dated rate',
};

function walkTests(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'node_modules' || GUARDED.includes(full)) continue;
      walkTests(full, out);
    } else if (/\.test\.tsx?$/.test(name)) out.push(full);
  }
  return out;
}
const pipelineReaders = () =>
  walkTests(SRC)
    .filter((f) => {
      const src = readFileSync(f, 'utf8');
      return READS_PIPELINE_DATA.test(src) && !MOCKS_THE_SERVICE.test(src);
    })
    .map((f) => f.slice(SRC.length + 1));

describe('tests OUTSIDE the weekly step that read pipeline-written data are declared (5.478)', () => {
  it('should have no undeclared test reading the monthly series the pipeline writes', () => {
    const undeclared = pipelineReaders().filter((f) => !(f in PIPELINE_DATA_READERS));
    expect(
      undeclared,
      `these read pipeline-written monthly data (they gate the refresh PR's CI) but declare no reason:\n` +
        `  ${undeclared.join('\n  ')}\n` +
        `Assert a rule or a value derived from the same series, then declare it here.`
    ).toEqual([]);
  });

  it('should not list a file that no longer reads pipeline data (the list must stay honest)', () => {
    const actual = new Set(pipelineReaders());
    expect(Object.keys(PIPELINE_DATA_READERS).filter((f) => !actual.has(f))).toEqual([]);
  });

  it('should run every declared reader in simulate-next-week scenario D (one list, not two)', () => {
    // Scenario D is the executable check that these tests hold across month-rolls;
    // a declared reader outside its directories would be silently untested there.
    const outside = Object.keys(PIPELINE_DATA_READERS).filter(
      (f) => !PIPELINE_READER_DIRS.some((d: string) => `src/${f}`.startsWith(`${d}/`))
    );
    expect(outside, 'declared here but not run by scenario D').toEqual([]);
  });

  it('should not count a test that MOCKS the data service (it reads no live data)', () => {
    expect(pipelineReaders()).not.toContain('hooks/__tests__/useMarketData.test.tsx');
    expect(pipelineReaders()).not.toContain('lib/pre-demo/__tests__/feeRateDisplay.test.ts');
  });
});
