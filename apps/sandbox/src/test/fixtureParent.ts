/**
 * One empty parent folder for a test file's throwaway repositories (`5.699`, `5.713`).
 *
 * The review gate resolves a sibling `diboas-docs` next to the repository it runs in. A
 * fixture repository created straight in the system temp folder would resolve
 * `<tmp>/diboas-docs`, so a stray folder there once leaked into the fixtures. Under its
 * own empty parent the sibling can never exist.
 *
 * A run killed mid-way (SIGKILL, a closed terminal) skips `afterAll`, and the authGate
 * suite copies the private docs into this folder. So the folder is also removed on
 * process exit, and a new run sweeps same-prefix folders older than six hours (a run never
 * lasts that long, so a live run's folder is never touched).
 */

import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STALE_MS = 6 * 60 * 60 * 1000;

export function makeFixtureParent(prefix: string): { dir: string; remove: () => void } {
  const now = Date.now();
  for (const name of readdirSync(tmpdir())) {
    if (!name.startsWith(prefix)) continue;
    const path = join(tmpdir(), name);
    try {
      if (now - statSync(path).mtimeMs > STALE_MS) rmSync(path, { recursive: true, force: true });
    } catch {
      /* gone already, or not ours to read: leave it */
    }
  }
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const remove = () => rmSync(dir, { recursive: true, force: true });
  process.once('exit', remove);
  return { dir, remove };
}
