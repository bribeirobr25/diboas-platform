/**
 * ⛑ LEDGER-CHAR-1 · the ONLY code that writes goldens (plan P12 D11). Loaded solely by
 * `vitest.char-update.config.mts` (`pnpm --filter sandbox char:update`), never by the normal
 * run, so the comparison can never rewrite what it compares against.
 *
 * - `CHAR_CASES=a,b` regenerates only those cases (every other golden is kept as it is);
 *   unset, every case is written (PR-1's first recording, or the CI base job's `--out` run).
 * - `CHAR_OUT=<dir>` writes there instead of the committed folder (the CI base job, which
 *   compares the merge-base's output with the head's, `ledger-char-base`).
 * - `CHAR_REGISTER_ID=5.x` marks a regenerated case (allowed only from PR-3's commit B on; in
 *   exact mode the comparison fails on any marker).
 * - Refuses any Node major but CI's (24), so native behaviour cannot drift into a golden.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CaseDef, Observation } from '../../src/lib/ledger/decide/__tests__/characterization/harness';
import { encode } from '../../src/lib/ledger/decide/__tests__/characterization/recorder';
import {
  hashes,
  type Golden,
  type Manifest,
} from '../../src/lib/ledger/decide/__tests__/characterization/compare';

const REQUIRED_NODE_MAJOR = 24;
const major = Number(process.versions.node.split('.')[0]);
if (major !== REQUIRED_NODE_MAJOR && process.env.CHAR_ALLOW_NODE !== String(major)) {
  throw new Error(
    `char:update records goldens on Node ${REQUIRED_NODE_MAJOR} only (CI's); this is Node ${major}.`
  );
}

const COMMITTED = join(__dirname, '../../src/lib/ledger/decide/__tests__/characterization/goldens');
const outDir = process.env.CHAR_OUT || COMMITTED;
const only = new Set((process.env.CHAR_CASES ?? '').split(',').filter(Boolean));
const registerId = process.env.CHAR_REGISTER_ID;

const read = <T>(file: string, fallback: T): T =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback;

const pending = new Map<string, Map<string, { def: CaseDef; fixed: Observation; advancing: Observation }>>();

(globalThis as Record<string, unknown>).__charSink = {
  collect(family: string, def: CaseDef, fixed: Observation, advancing: Observation) {
    if (only.size > 0 && !only.has(def.id)) return;
    if (!pending.has(family)) pending.set(family, new Map());
    pending.get(family)!.set(def.id, { def, fixed, advancing });
  },
  done(family: string) {
    const collected = pending.get(family);
    if (!collected) return;
    mkdirSync(outDir, { recursive: true });
    const goldenFile = join(outDir, `${family}.json`);
    const manifestFile = join(outDir, 'manifest.json');
    const golden = only.size > 0 ? read<Golden>(goldenFile, {}) : {};
    const manifest = read<Manifest>(manifestFile, {});
    const entries = only.size > 0 ? { ...(manifest[family] ?? {}) } : {};
    for (const [id, { def, fixed, advancing }] of collected) {
      golden[id] = JSON.parse(encode({ fixed, advancing }));
      entries[id] = {
        row: def.row,
        ...hashes(fixed, advancing),
        ...(def.pinnedDefect ? { pinnedDefect: def.pinnedDefect } : {}),
        ...(only.size > 0 && registerId ? { regenerationRegisterId: registerId } : {}),
      };
    }
    const sortedGolden = Object.fromEntries(Object.keys(golden).sort().map((k) => [k, golden[k]]));
    const sortedEntries = Object.fromEntries(Object.keys(entries).sort().map((k) => [k, entries[k]]));
    writeFileSync(goldenFile, `${encode(sortedGolden)}\n`);
    manifest[family] = sortedEntries;
    const sortedManifest = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
    writeFileSync(manifestFile, `${JSON.stringify(sortedManifest, null, 2)}\n`);
  },
};
