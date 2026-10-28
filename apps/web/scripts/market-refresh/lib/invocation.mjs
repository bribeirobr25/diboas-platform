/**
 * invocation.mjs — "am I the process entry point?" (PENDING_ALL 5.313).
 *
 * Every pipeline script that WRITES must run only when invoked directly.
 * Importing one for a test — or by accident — otherwise executes it and writes
 * to committed data. That happened on 2026-09-12: an `import()` of `run.mjs`
 * fetched live data and minted a phantom run day in `run-archive.jsonl`, the
 * provenance authority the published history chart is reconciled against.
 *
 * Two footguns this exists to remove, both found while fixing the first:
 *   1. `` `file://${process.argv[1]}` `` breaks on any path needing
 *      percent-encoding (spaces, accents). Use `pathToFileURL`.
 *   2. `process.argv[1]` is UNDEFINED under `node -e` / `node --input-type`,
 *      and `pathToFileURL(undefined)` THROWS. A guard that crashes instead of
 *      returning false is worse than no guard: it turns "imported" into an
 *      error rather than a no-op.
 *   3. (2026-10-18) A path reached through a SYMLINK. Node resolves the entry
 *      module to its real path, so `import.meta.url` is the real path while
 *      `process.argv[1]` keeps the path as typed. On macOS every temp dir is
 *      `/var/...` -> `/private/var/...`; a script run from there (or from any
 *      symlinked checkout) compared unequal, skipped `main()` and exited 0
 *      having done NOTHING: a silent success, the worst failure for a gate
 *      such as `staleness.mjs`. Both forms are accepted, because
 *      `--preserve-symlinks-main` keeps the symlinked path in `import.meta.url`.
 */

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * @param {string} moduleUrl — pass `import.meta.url` from the calling module
 * @returns {boolean} true only when that module is the process entry point
 */
export function isDirectInvocation(moduleUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  if (moduleUrl === pathToFileURL(entry).href) return true;
  let real;
  try {
    real = fs.realpathSync(entry);
  } catch {
    return false; // not on disk: nothing else to compare
  }
  return moduleUrl === pathToFileURL(real).href;
}
