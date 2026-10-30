/**
 * Freshness of hand-refreshed reference data (2026-10-21, founder decision on
 * gates TVL-DATA-1 / FRESH-REF-1, implementation-notes § /protocols TVL). Replaces two wall-clock unit tests that
 * turned EVERY lane's CI red on a calendar date (the /protocols TVL test on
 * 2026-11-11, the historical anchors test on 2027-05-15): stale reference data
 * is never the fault of an unrelated change.
 *
 *   node apps/web/scripts/data-freshness/check.mjs                    warn only
 *   node apps/web/scripts/data-freshness/check.mjs --changed-from-git block a subject this commit touches
 *   node apps/web/scripts/data-freshness/check.mjs --enforce-all      block every stale subject
 *                                                                     (the scheduled run: a failure
 *                                                                     emails the repository owner)
 *
 * The same rule as the /market backstop (5.468): BLOCK where the data is the
 * subject, WARN everywhere else. Fail-closed: an unparseable stamp is stale,
 * and if the changed files cannot be listed every subject is enforced.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';
import { TVL_MAX_AGE_DAYS } from '../protocols-tvl/sources.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @typedef {{
 *   id: string,
 *   what: string,
 *   limitDays: number,
 *   readStamp: () => string,
 *   paths: RegExp,
 *   remedy: string,
 * }} FreshnessSubject
 */

/** @type {FreshnessSubject[]} */
export const SUBJECTS = [
  {
    id: 'protocols-tvl',
    what: 'The /protocols TVL figures',
    limitDays: TVL_MAX_AGE_DAYS,
    readStamp: () =>
      JSON.parse(
        fs.readFileSync(
          path.join(REPO_ROOT, 'apps/web/src/lib/market-data/data/protocolsTvl.json'),
          'utf8'
        )
      ).pulled_at,
    paths:
      /^(apps\/web\/src\/lib\/market-data\/data\/protocolsTvl\.json|apps\/web\/scripts\/protocols-tvl\/|apps\/web\/src\/components\/Pages\/Protocols\/|packages\/i18n\/translations\/[^/]+\/protocols\.json$)/,
    remedy:
      'Run `node apps/web/scripts/protocols-tvl/refresh.mjs` and open a PR (owner: the founder).',
  },
  {
    id: 'historical-anchors',
    what: 'The historical anchor research data',
    limitDays: 365,
    readStamp: () => {
      const src = fs.readFileSync(
        path.join(REPO_ROOT, 'apps/web/src/lib/market-data/historical.ts'),
        'utf8'
      );
      return src.match(/export const LAST_RESEARCH_UPDATE = '([^']+)';/)?.[1] ?? '';
    },
    paths: /^apps\/web\/src\/lib\/market-data\/historical\.ts$/,
    remedy: 'Refresh the research data in historical.ts and its LAST_RESEARCH_UPDATE together.',
  },
];

/** Age in days of an ISO stamp at `now`; NaN when it does not parse. */
export function ageInDays(/** @type {string} */ stamp, now = new Date()) {
  const t = Date.parse(stamp);
  return Number.isFinite(t) ? (now.getTime() - t) / DAY_MS : Number.NaN;
}

/**
 * @param {number} ageDays
 * @param {number} limitDays
 * @param {boolean} enforce
 * @returns {'ok' | 'warn' | 'fail'} A non-finite age is stale: an unparseable
 *   stamp must never pass.
 */
export function freshnessVerdict(ageDays, limitDays, enforce) {
  const stale = !Number.isFinite(ageDays) || ageDays >= limitDays;
  if (!stale) return 'ok';
  return enforce ? 'fail' : 'warn';
}

/**
 * Which subjects to enforce: all of them, none, or those whose paths a change
 * touches. `changed === null` means the list could not be computed: enforce all.
 * @param {'all' | 'none' | 'changed'} mode
 * @param {string[] | null} changed
 */
export function enforcedSubjects(mode, changed) {
  if (mode === 'all' || (mode === 'changed' && changed === null)) {
    return new Set(SUBJECTS.map((s) => s.id));
  }
  if (mode === 'none') return new Set();
  return new Set(
    SUBJECTS.filter((s) => (changed ?? []).some((f) => s.paths.test(f))).map((s) => s.id)
  );
}

function changedFiles() {
  try {
    return execFileSync('git', ['diff', '--name-only', 'HEAD^1', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
  } catch {
    return null;
  }
}

function main() {
  const mode = process.argv.includes('--enforce-all')
    ? 'all'
    : process.argv.includes('--changed-from-git')
      ? 'changed'
      : 'none';
  const changed = mode === 'changed' ? changedFiles() : [];
  if (mode === 'changed' && changed === null) {
    console.log('::warning::could not list the changed files; enforcing every freshness subject');
  }
  const enforced = enforcedSubjects(mode, changed);
  const gh = Boolean(process.env.GITHUB_ACTIONS);
  for (const s of SUBJECTS) {
    const stamp = s.readStamp();
    const age = ageInDays(stamp);
    const verdict = freshnessVerdict(age, s.limitDays, enforced.has(s.id));
    const ageText = Number.isFinite(age) ? `${Math.floor(age)} days old` : `unparseable (${stamp})`;
    if (verdict === 'ok') {
      console.log(`${s.what}: ${ageText}, within the ${s.limitDays}-day limit.`);
    } else if (verdict === 'fail') {
      console.error(
        `${gh ? '::error::' : '✖ '}${s.what} are ${ageText} (limit ${s.limitDays}). ${s.remedy}`
      );
      process.exitCode = 1;
    } else {
      console.log(
        `${gh ? '::warning::' : '⚠ '}${s.what} are ${ageText} (limit ${s.limitDays}). ` +
          `Not blocking: this change does not touch them. ${s.remedy}`
      );
    }
  }
}

if (isDirectInvocation(import.meta.url)) main();
