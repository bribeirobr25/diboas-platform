/**
 * ⛑ LEDGER-CHAR-1 · after an update run: every id named in `CHAR_CASES` must have been recorded
 * (a mistyped id used to exit 0 and write nothing). Global teardown of the update config only.
 */
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const COMMITTED = join(__dirname, '../../src/lib/ledger/decide/__tests__/characterization/goldens');

export default function setup() {
  return () => {
    const outDir = process.env.CHAR_OUT || COMMITTED;
    const seenFile = join(outDir, '.seen-case-ids');
    const seen = new Set(
      existsSync(seenFile) ? readFileSync(seenFile, 'utf8').split('\n').filter(Boolean) : []
    );
    rmSync(seenFile, { force: true });
    const asked = (process.env.CHAR_CASES ?? '').split(',').filter(Boolean);
    const unknown = asked.filter((id) => !seen.has(id));
    if (unknown.length > 0) throw new Error(`char:update: no such case: ${unknown.join(', ')}`);
  };
}
