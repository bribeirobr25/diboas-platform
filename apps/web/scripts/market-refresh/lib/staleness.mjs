/**
 * The /market 14-day staleness backstop — ONE rule, two callers (PENDING_ALL 5.468).
 *
 *   node apps/web/scripts/market-refresh/lib/staleness.mjs
 *
 * WHY IT EXISTS AS A MODULE. The backstop used to live only inside
 * `analytics-sdk/__tests__/fixtures.test.ts`, which runs in the shared CI
 * `quality` job — so the day /market data turned 14 days old, EVERY lane's CI
 * went red (it would have tripped at 2026-09-29 13:20 UTC; averted by merging
 * the stuck refresh PR). The founder ruled (2026-09-29): block only where the
 * market is the subject — the weekly refresh workflow, and a change that touches
 * market data or code — and WARN everywhere else.
 *
 * The rule lives here so the test and CI share it (one fact, one derivation).
 * The CLI exists because the repo's vitest reporter hides console output from
 * PASSING tests: a warning emitted from inside `pnpm test` would be invisible in
 * CI, and the "warn" half of the ruling would silently not exist.
 *
 * Enforcement: MARKET_STALENESS_ENFORCE=1 → stale exits 1. Otherwise stale
 * prints a `::warning::` annotation (on GitHub Actions) and exits 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import { isDirectInvocation } from './invocation.mjs';
import { REPO_ROOT } from '../providers/inrepo.mjs';

export const STALENESS_LIMIT_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {number} ageDays
 * @param {boolean} enforce
 * @returns {'ok' | 'warn' | 'fail'} A non-finite age counts as stale: an
 *   unparseable stamp must never pass.
 */
export function stalenessVerdict(ageDays, enforce) {
  const stale = !Number.isFinite(ageDays) || ageDays >= STALENESS_LIMIT_DAYS;
  if (!stale) return 'ok';
  return enforce ? 'fail' : 'warn';
}

/** Age in days of an ISO stamp at `now`; NaN when the stamp does not parse. */
export function ageInDays(isoStamp, now = new Date()) {
  const t = Date.parse(isoStamp);
  return Number.isFinite(t) ? (now.getTime() - t) / DAY_MS : Number.NaN;
}

function main() {
  const regimePath = path.join(REPO_ROOT, 'apps/web/data/market/shared/regime.json');
  const stamp = JSON.parse(fs.readFileSync(regimePath, 'utf8')).last_updated_at;
  const age = ageInDays(stamp);
  const enforce = process.env.MARKET_STALENESS_ENFORCE === '1';
  const verdict = stalenessVerdict(age, enforce);
  const ageText = Number.isFinite(age) ? `${age.toFixed(1)} days` : `unparseable (${stamp})`;
  const gh = Boolean(process.env.GITHUB_ACTIONS);

  if (verdict === 'ok') {
    console.log(`/market data age ${ageText} — within the ${STALENESS_LIMIT_DAYS}-day backstop.`);
    return;
  }
  const remedy = 'Merge the open weekly refresh PR (or dispatch market-refresh-weekly.yml).';
  if (verdict === 'fail') {
    console.error(
      `${gh ? '::error::' : '✖ '}/market data is ${ageText} old (limit ${STALENESS_LIMIT_DAYS}). ` +
        `This change touches market data or code, so the backstop BLOCKS. ${remedy}`
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `${gh ? '::warning::' : '⚠ '}/market data is ${ageText} old (limit ${STALENESS_LIMIT_DAYS}). ` +
      `Not blocking: this change does not touch market data or code. ${remedy}`
  );
}

if (isDirectInvocation(import.meta.url)) main();
