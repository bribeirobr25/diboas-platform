/**
 * Whether a weekly-refresh run should refresh (C1d, 2026-10-21, owner-approved).
 *
 * The workflow is scheduled on Monday and again on Tuesday. GitHub sometimes
 * drops or delays a scheduled run (2026-08-31 never fired), and a Monday run
 * can fail on a transient source error; either way that week had no refresh.
 * The Tuesday run is the second attempt, and refreshes only when this week
 * has no successful run yet.
 *
 *   RETRY_SCHEDULE=true|false  OPEN_PR=<url or empty>  RUNS_FILE=<gh run list JSON>
 *   node apps/web/scripts/market-refresh/retry-decision.mjs >> "$GITHUB_OUTPUT"
 *
 * Prints `run=true|false` and `reason=…`. An open refresh PR no longer stops
 * the retry (C1a, 5.632, 2026-10-28): the run carries that PR's data
 * (carry-open-pr.mjs), so a failed Monday is retried even while last week's PR
 * waits. SUPERSEDED: "never decides to run while a refresh PR is open: the run
 * would refuse anyway (5.464)".
 */

import fs from 'node:fs';
import { isDirectInvocation } from './lib/invocation.mjs';

/** Monday 00:00 UTC of the week containing `now`. */
export function weekStartUtc(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - sinceMonday * 86_400_000);
}

/**
 * @param {{
 *   retrySchedule: boolean,
 *   openPrUrl: string,
 *   runs: { databaseId: number, conclusion: string | null, createdAt: string }[],
 *   now: Date,
 * }} io
 * @returns {{ run: boolean, reason: string }}
 */
export function retryDecision({ retrySchedule, openPrUrl, runs, now }) {
  if (!retrySchedule) return { run: true, reason: 'the Monday schedule or a manual run' };
  const since = weekStartUtc(now).getTime();
  const done = runs.find((r) => r.conclusion === 'success' && Date.parse(r.createdAt) >= since);
  if (done) {
    return { run: false, reason: `this week's refresh already succeeded (run ${done.databaseId})` };
  }
  if (openPrUrl) {
    return {
      run: true,
      reason: `no successful refresh since Monday 00:00 UTC: second attempt, carrying the open refresh PR (${openPrUrl})`,
    };
  }
  return { run: true, reason: 'no successful refresh since Monday 00:00 UTC: second attempt' };
}

if (isDirectInvocation(import.meta.url)) {
  const runs = JSON.parse(fs.readFileSync(process.env.RUNS_FILE ?? '', 'utf8'));
  const { run, reason } = retryDecision({
    retrySchedule: process.env.RETRY_SCHEDULE === 'true',
    openPrUrl: process.env.OPEN_PR ?? '',
    runs: Array.isArray(runs) ? runs : [],
    now: new Date(),
  });
  const safe = reason.replace(/[\r\n]+/g, ' ');
  console.log(`run=${run}`);
  console.log(`reason=${safe}`);
  console.error(`${run ? 'refresh' : 'skip'}: ${safe}`);
}
