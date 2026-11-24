/**
 * ⛑ LEDGER-CHAR-1 · the ONLY code that writes goldens (plan P12 D11). Loaded solely by
 * `vitest.char-update.config.mts` (`pnpm --filter sandbox char:update`), never by the normal
 * run, so the comparison can never rewrite what it compares against.
 *
 * - `CHAR_OUT=<dir>` writes there instead of the committed folder (the CI base job,
 *   `ledger-char-base`, records the base's and the PR's output this way and compares them).
 * - Into the COMMITTED folder, a full recording happens once (`CHAR_INITIAL=1`, PR-1); after
 *   that only named cases may be written: `CHAR_CASES=a,b CHAR_REGISTER_ID=5.x`, and each one is
 *   marked with that id (in exact mode the comparison fails on any marker, and the frozen hashes
 *   in `../frozen.json`, which nothing here writes, fail any changed golden). An unknown id in
 *   `CHAR_CASES` fails the run.
 * - Records on Node 24 (CI's) only, unless `CHAR_ALLOW_NODE` names the running major; goldens
 *   recorded on Node 22 and 24 were byte-identical at PR-1.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CaseDef,
  Observation,
} from '../../src/lib/ledger/decide/__tests__/characterization/harness';
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
const committed = outDir === COMMITTED;
const recorded =
  existsSync(join(COMMITTED, 'manifest.json')) &&
  Object.keys(JSON.parse(readFileSync(join(COMMITTED, 'manifest.json'), 'utf8')) as object).length >
    0;
if (committed && only.size === 0 && recorded && process.env.CHAR_INITIAL !== '1') {
  throw new Error(
    'char:update: the committed goldens exist; name the cases to regenerate (CHAR_CASES) and why (CHAR_REGISTER_ID).'
  );
}
const initial = process.env.CHAR_INITIAL === '1';
if (committed && only.size > 0 && !registerId && !initial) {
  throw new Error(
    'char:update: regenerating committed cases needs CHAR_REGISTER_ID (the register id that explains why).'
  );
}
/** Ids actually collected, so a mistyped CHAR_CASES id fails (`updateTeardown.ts`). */
const SEEN_FILE = join(outDir, '.seen-case-ids');

const read = <T>(file: string, fallback: T): T =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : fallback;

const pending = new Map<
  string,
  Map<string, { def: CaseDef; fixed: Observation; advancing: Observation }>
>();

(globalThis as Record<string, unknown>).__charSink = {
  collect(family: string, def: CaseDef, fixed: Observation, advancing: Observation) {
    if (only.size > 0 && !only.has(def.id)) return;
    mkdirSync(outDir, { recursive: true });
    appendFileSync(SEEN_FILE, `${def.id}\n`);
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
        ...(only.size > 0 && registerId && !initial ? { regenerationRegisterId: registerId } : {}),
      };
    }
    const sortedGolden = Object.fromEntries(
      Object.keys(golden)
        .sort()
        .map((k) => [k, golden[k]])
    );
    const sortedEntries = Object.fromEntries(
      Object.keys(entries)
        .sort()
        .map((k) => [k, entries[k]])
    );
    writeFileSync(goldenFile, `${encode(sortedGolden)}\n`);
    manifest[family] = sortedEntries;
    const sortedManifest = Object.fromEntries(
      Object.keys(manifest)
        .sort()
        .map((k) => [k, manifest[k]])
    );
    writeFileSync(manifestFile, `${JSON.stringify(sortedManifest, null, 2)}\n`);
  },
};
