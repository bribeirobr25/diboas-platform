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
 * all three write to committed data, `tools-monthlies.mjs` to the file the
 * Money Tools calculators also read.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { isDirectInvocation } from '../../../../scripts/market-refresh/lib/invocation.mjs';

const SCRIPTS = join(__dirname, '../../../../scripts');
const WRITERS = [
  'market-refresh/run.mjs',
  'market-refresh/generate.mjs',
  'market-refresh/tools-monthlies.mjs',
  'data-fetchers/compute-regime.mjs',
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
describe('every writing pipeline script is guarded', () => {
  it.each(WRITERS)('%s should gate its side effects behind isDirectInvocation', (rel) => {
    const src = readFileSync(join(SCRIPTS, rel), 'utf8');
    expect(src, `${rel} does not import the guard`).toMatch(
      /import \{ isDirectInvocation \} from '.*lib\/invocation\.mjs'/
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
