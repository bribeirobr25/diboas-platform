/**
 * Pipeline scripts must not run when imported (PENDING_ALL 5.313).
 *
 * On 2026-09-12 an `import()` of `run.mjs` — intended as a "does it still
 * parse" check — executed the entire weekly pipeline: it fetched live data,
 * rewrote `computed.json`, and appended a phantom run day to
 * `run-archive.jsonl`. That file is the provenance authority every published
 * history point is reconciled against, so minting a day in it is the 5.137
 * defect class arriving through a different door.
 *
 * `compute-regime.mjs` had been guarded since 5.137 "(allows import for
 * tests)". `run.mjs`, `generate.mjs` and `tools-monthlies.mjs` had not — and
 * all three wrote to committed data. `tools-monthlies.mjs` was replaced in plan
 * 5.760 increment 2 by `market-data/publish.mjs`, which writes the same files
 * and is guarded the same way.
 */

import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, afterEach } from 'vitest';
import { isDirectInvocation } from '../../../../scripts/market-refresh/lib/invocation.mjs';

const SCRIPTS = join(__dirname, '../../../../scripts');
const WRITERS = [
  'market-refresh/run.mjs',
  'market-refresh/generate.mjs',
  // the Money Tools series from the store (5.760 increment 2; replaced tools-monthlies.mjs)
  'market-data/publish.mjs',
  'data-fetchers/compute-regime.mjs',
  // the market data store (2026-11-05): both write (the store; the guard exits)
  'market-data/collect.mjs',
  'market-data/commit-guard.mjs',
  // the read-only range-pass report writes one record with --write (5.776, plan MP-2)
  'market-data/range-pass-report.mjs',
  // writers that carried the guard but were missing from this list (post-merge audit 2026-11-10)
  'market-refresh/carry-open-pr.mjs',
  'market-refresh/check-ledgers.mjs',
  'market-refresh/simulate-next-week.mjs',
  'protocols-tvl/refresh.mjs',
  // the Money Tools stress harness writes its baseline only when run directly (5.853)
  'tools-stress-test.mjs',
  // plan MP-3b: two entry points that print and set the exit code; tests import both
  'market-data/collect-watch.mjs',
  'market-data/topup-series.mjs',
  // post-merge audit (2026-11-11): guarded and imported by tests, but missing from this list
  'market-refresh/retry-decision.mjs',
  'market-refresh/lib/staleness.mjs',
  'market-refresh/lib/memo-orphans.mjs',
  'data-freshness/check.mjs',
];

describe('isDirectInvocation — the guard itself', () => {
  const original = process.argv[1];
  afterEach(() => {
    process.argv[1] = original;
  });

  it('should be true only for the module that IS the entry point', () => {
    process.argv[1] = '/tmp/some/script.mjs';
    expect(isDirectInvocation('file:///tmp/some/script.mjs')).toBe(true);
    expect(isDirectInvocation('file:///tmp/other/script.mjs')).toBe(false);
  });

  it('should return false, NOT throw, when there is no entry point', () => {
    // `node -e` / `node --input-type=module` leave argv[1] undefined, and
    // pathToFileURL(undefined) throws. A guard that crashes instead of
    // returning false is worse than no guard — it converts "imported" into an
    // error. This is the bug the first version of the guard actually had.
    process.argv[1] = undefined as unknown as string;
    expect(() => isDirectInvocation('file:///anything.mjs')).not.toThrow();
    expect(isDirectInvocation('file:///anything.mjs')).toBe(false);
  });

  it('should handle a path needing percent-encoding', () => {
    // `file://` + argv[1] string-concatenation breaks here; pathToFileURL does not.
    process.argv[1] = '/tmp/my scripts/run.mjs';
    expect(isDirectInvocation('file:///tmp/my%20scripts/run.mjs')).toBe(true);
  });

  it('should recognise the entry point when it was invoked through a symlinked path', () => {
    // Node reports the REAL path in import.meta.url while argv[1] keeps the
    // typed one; before this case existed, a script run through a symlink
    // (every macOS temp dir) skipped main() and exited 0 having done nothing.
    const base = realpathSync(mkdtempSync(join(tmpdir(), 'invocation-')));
    try {
      mkdirSync(join(base, 'real'));
      writeFileSync(join(base, 'real', 'script.mjs'), '');
      writeFileSync(join(base, 'real', 'other.mjs'), '');
      symlinkSync(join(base, 'real'), join(base, 'link'));
      process.argv[1] = join(base, 'link', 'script.mjs');
      expect(isDirectInvocation(pathToFileURL(join(base, 'real', 'script.mjs')).href)).toBe(true);
      // --preserve-symlinks-main keeps the symlinked path in import.meta.url.
      expect(isDirectInvocation(pathToFileURL(join(base, 'link', 'script.mjs')).href)).toBe(true);
      expect(isDirectInvocation(pathToFileURL(join(base, 'real', 'other.mjs')).href)).toBe(false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});

/**
 * This gate reads the source rather than importing the scripts, and that is
 * deliberate. The behaviour under test is "importing this file does nothing",
 * so a behavioural test would have to import it — which is the exact act that
 * is unsafe the moment the guard regresses. A test that fetches live data and
 * rewrites `computed.json` on its way to reporting the failure is worse than
 * the bug. So: assert the guard is present at every write site, and prove the
 * assertion by removing a guard and watching this fail.
 */
/** Every .mjs under apps/web/scripts, recursively (test fixtures and node_modules excluded). */
function scriptFiles(dir: string, rel = ''): string[] {
  return readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) => {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : scriptFiles(dir, r);
    return e.name.endsWith('.mjs') ? [r] : [];
  });
}

// Post-merge audit (2026-11-11): the list was kept by hand and four guarded entry points were
// missing, so removing their guard failed nothing. Now every script that calls the guard must be
// listed, so the list cannot fall behind the code again.
describe('the list of entry points is the code, not a hand list', () => {
  it('should name every script under apps/web/scripts that calls isDirectInvocation', () => {
    const guarded = scriptFiles(SCRIPTS).filter((r) =>
      /isDirectInvocation\(import\.meta\.url\)/.test(readFileSync(join(SCRIPTS, r), 'utf8'))
    );
    expect(guarded.length).toBeGreaterThan(10);
    expect(guarded.filter((r) => !WRITERS.includes(r))).toEqual([]);
  });
});

describe('every writing pipeline script is guarded', () => {
  it.each(WRITERS)('%s should gate its side effects behind isDirectInvocation', (rel) => {
    const src = readFileSync(join(SCRIPTS, rel), 'utf8');
    expect(src, `${rel} does not import the guard`).toMatch(
      // from another folder (`../market-refresh/lib/invocation.mjs`) or from lib itself (`./invocation.mjs`)
      /import \{ isDirectInvocation \} from '(?:.*lib\/|\.\/)invocation\.mjs'/
    );
    expect(src, `${rel} imports the guard but never calls it`).toMatch(
      /isDirectInvocation\(import\.meta\.url\)/
    );
  });

  it('should keep the guard next to every write site', () => {
    // A script that writes but never calls the guard is the exact 5.313 shape.
    for (const rel of WRITERS) {
      const src = readFileSync(join(SCRIPTS, rel), 'utf8');
      const writes = (src.match(/writeFileSync|appendFileSync/g) ?? []).length;
      if (writes > 0) {
        expect(src, `${rel} writes ${writes}x but is unguarded`).toMatch(
          /isDirectInvocation\(import\.meta\.url\)/
        );
      }
    }
  });
});
