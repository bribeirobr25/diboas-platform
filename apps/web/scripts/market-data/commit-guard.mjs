#!/usr/bin/env node
/**
 * commit-guard.mjs — refuse a staged change in the analytics checkout that is
 * not an append-only change under `market/` (market data store).
 *
 * The analytics repository is on a plan without branch protection (the API
 * answers 403), so nothing on the server stops a rewrite: this guard, run by
 * the workflow just before its commit, is the enforcement. It reads the index,
 * never the working tree.
 *
 * Allowed:
 *   - A (added) anywhere under `market/` except `checks/accepted-exceptions.json`
 *     (only a person changes that file, through a reviewed PR);
 *   - M (modified) on files that only ever grow: `daily/*.csv`,
 *     `events/*.distributions.csv`, `raw/manifest.jsonl`, `revisions.jsonl`,
 *     with ZERO deleted lines; `daily/us_m2.csv` may also change lines (the
 *     Fed revises M2; the collector logs each change in revisions.jsonl);
 *   - M on `derived/**` (rebuilt in full from the stored days every run).
 * Refused: anything outside `market/`, any deletion, rename, copy or type
 * change, any other modification.
 *
 *   node commit-guard.mjs              (the index; run from the analytics checkout)
 *   node commit-guard.mjs --range A..B (a commit range)       exit 1 = refused
 */

import { execFileSync } from 'node:child_process';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';

const GROWS = [
  /^market\/daily\/[a-z0-9_]+\.csv$/,
  /^market\/events\/[a-z0-9_]+\.distributions\.csv$/,
  /^market\/raw\/manifest\.jsonl$/,
  /^market\/revisions\.jsonl$/,
];
const REVISABLE = [/^market\/daily\/us_m2\.csv$/];
const REBUILT = /^market\/derived\//;
const HUMAN_ONLY = /^market\/checks\/accepted-exceptions\.json$/;

/**
 * @param {{status:string, path:string}[]} changes from `git diff --cached --name-status`
 * @param {Map<string, {added:number, deleted:number}>} numstat by path
 * @returns {string[]} reasons the commit is refused (empty = allowed)
 */
export function evaluateStaged(changes, numstat) {
  const refused = [];
  for (const { status, path } of changes) {
    const kind = status[0];
    if (!path.startsWith('market/')) refused.push(`${path}: outside market/`);
    else if (HUMAN_ONLY.test(path))
      refused.push(`${path}: only a reviewed PR changes the exceptions`);
    else if (kind === 'A') continue;
    else if (kind === 'M') {
      if (REBUILT.test(path) || REVISABLE.some((r) => r.test(path))) continue;
      if (!GROWS.some((r) => r.test(path)))
        refused.push(`${path}: modified, and it is not an append-only file`);
      else if ((numstat.get(path)?.deleted ?? 1) > 0)
        refused.push(`${path}: lines removed from an append-only file`);
    } else
      refused.push(
        `${path}: ${status} (deletions, renames, copies and type changes are never allowed)`
      );
  }
  return refused;
}

/** Parse `git diff --cached --name-status -z` output. */
export function parseNameStatus(z) {
  const parts = z.split('\0').filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length;) {
    const status = parts[i++];
    if (/^[RC]/.test(status)) {
      out.push({ status, path: parts[i + 1] ?? '' }, { status, path: parts[i] ?? '' });
      i += 2;
    } else out.push({ status, path: parts[i++] ?? '' });
  }
  return out;
}

/** Parse `git diff --cached --numstat -z` output (renames excluded by --no-renames upstream). */
export function parseNumstat(z) {
  const m = new Map();
  for (const rec of z.split('\0').filter(Boolean)) {
    const [added, deleted, ...rest] = rec.split('\t');
    m.set(rest.join('\t'), {
      added: Number(added),
      deleted: deleted === '-' ? 1 : Number(deleted),
    });
  }
  return m;
}

if (isDirectInvocation(import.meta.url)) {
  const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  // Default: the index. `--range A..B`: a commit range (after a rebase, the
  // rebased data commit is re-checked against the branch it now sits on).
  const i = process.argv.indexOf('--range');
  const what = i > 0 ? [process.argv[i + 1]] : ['--cached'];
  if (i > 0 && !/^[\w./-]+\.\.[\w./-]+$/.test(what[0] ?? '')) {
    console.error('--range must be A..B');
    process.exit(2);
  }
  const changes = parseNameStatus(git('diff', ...what, '--name-status', '--no-renames', '-z'));
  const numstat = parseNumstat(git('diff', ...what, '--numstat', '--no-renames', '-z'));
  const refused = evaluateStaged(changes, numstat);
  if (refused.length) {
    console.error(`REFUSED (${refused.length}):\n  ${refused.slice(0, 40).join('\n  ')}`);
    process.exit(1);
  }
  console.log(`commit guard: ${changes.length} staged path(s), all append-only under market/`);
}
