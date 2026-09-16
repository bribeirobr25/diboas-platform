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

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

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
    why: "evaluates at the ledger's own last anchor; asserts the trailing 4 are weeks, not a score",
  },
  'freshness.test.ts': {
    cls: 'UNIT-READS-LIVE',
    why: 'build-instant equivalence + a FROZEN 2026-09-07 panel for the historical regression',
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
