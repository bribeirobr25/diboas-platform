/**
 * invocation.mjs — "am I the process entry point?" (PENDING_ALL 5.308).
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
 */

import { pathToFileURL } from 'node:url';

/**
 * @param {string} moduleUrl — pass `import.meta.url` from the calling module
 * @returns {boolean} true only when that module is the process entry point
 */
export function isDirectInvocation(moduleUrl) {
  const entry = process.argv[1];
  if (!entry) return false;
  return moduleUrl === pathToFileURL(entry).href;
}
