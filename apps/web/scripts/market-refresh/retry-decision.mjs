/**
 * Whether a weekly-refresh run should refresh (C1d, 2026-10-21, owner-approved).
 *
 * The workflow is scheduled on TUESDAY and again on Wednesday (moved from Monday and Tuesday
 * by the founder on 2026-11-10, so the Fed's Monday-afternoon data is in: plan MP-3b,
 * `DR-2026-11-10-market-open-decisions` answer 13). GitHub starts scheduled runs hours late
 * (none of this workflow's has been dropped so far: 5.183; the 2026-08-31 run started 13:19
 * UTC), and a scheduled run can fail on a transient source error; either way that cycle may
 * have no refresh. The Wednesday run is the second attempt, and refreshes only when this
 * cycle has no successful run yet.
 *
 *   RETRY_SCHEDULE=true|false  OPEN_PR=<url or empty>  RUNS_FILE=<gh run list JSON>
 *   node apps/web/scripts/market-refresh/retry-decision.mjs >> "$GITHUB_OUTPUT"
 *
 * Prints `run=true|false` and `reason=…`. An open refresh PR no longer stops
 * the retry (C1a, 5.632, 2026-10-28): the run carries that PR's data
 * (carry-open-pr.mjs), so a failed Tuesday is retried even while last week's PR
 * waits. SUPERSEDED: "never decides to run while a refresh PR is open: the run
 * would refuse anyway (5.464)". Except: a run this week that stopped at the
 * carry REFUSAL is not retried, because that refusal would repeat (its reasons,
 * such as a non-data change on the branch, do not clear by themselves).
 *
 *   REFUSED_RUNS=<comma-separated run ids that stopped at the carry refusal>
 *   REFRESHED_RUNS=<comma-separated run ids whose `refresh` job succeeded>: the ONLY runs that
 *                   count as a refresh. A run whose `decide` chose to skip also ends "success",
 *                   so the run's conclusion is never enough (post-merge audit, 2026-11-11: a skipped
 *                   Tuesday counted as the week's refresh and the Wednesday retry skipped too); a
 *                   failed or cancelled fail-open top-up can leave a good refresh's run red.
 *   SCHEDULED=true|false  a scheduled run (either slot) skips when a refresh succeeded less than
 *                   RECENT_REFRESH_DAYS ago: two refreshes a day or two apart would publish a
 *                   "week" outside WEEK-WORDING-1's 6..8 days (the switch week of plan MP-3b, or a
 *                   manual run just before the schedule). A manual dispatch always refreshes.
 */

import fs from 'node:fs';
import { isDirectInvocation } from './lib/invocation.mjs';

/** A rehearsal run (its run title says so; it never opens a PR). */
export const isRehearsal = (r) => /\bREHEARSAL\b/.test(r.displayTitle ?? '');

/** The weekday the weekly refresh is scheduled on (UTC; 2 = Tuesday). */
export const SCHEDULE_DAY_UTC = 2;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SCHEDULE_DAY_NAME = DAY_NAMES[SCHEDULE_DAY_UTC];

/** A scheduled run skips when a refresh succeeded fewer than this many days ago. */
export const RECENT_REFRESH_DAYS = 5;

/** 00:00 UTC of the most recent scheduled day (today included): the start of this cycle. */
export function cycleStartUtc(now) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since = (d.getUTCDay() - SCHEDULE_DAY_UTC + 7) % 7;
  return new Date(d.getTime() - since * 86_400_000);
}

/**
 * @param {{
 *   retrySchedule: boolean,
 *   scheduled?: boolean,
 *   refreshedRunIds?: string[],
 *   openPrUrl: string,
 *   runs: { databaseId: number, conclusion: string | null, createdAt: string, displayTitle?: string }[],
 *   refusedRunIds?: string[],
 *   now: Date,
 * }} io
 * @returns {{ run: boolean, reason: string }}
 */
export function retryDecision({
  retrySchedule,
  scheduled = retrySchedule,
  openPrUrl,
  runs,
  now,
  refusedRunIds = [],
  refreshedRunIds = [],
}) {
  // A refresh is a run whose refresh job succeeded (the workflow reads each run's jobs), never
  // a run's conclusion alone: a skipped run ends "success" too. A rehearsal (plan 5.760 §8.7)
  // opens no PR, so it is never this cycle's refresh.
  const isDone = (r) => !isRehearsal(r) && refreshedRunIds.includes(String(r.databaseId));
  if (retrySchedule) {
    const since = cycleStartUtc(now).getTime();
    const done = runs.find((r) => isDone(r) && Date.parse(r.createdAt) >= since);
    if (done) {
      return {
        run: false,
        reason: `this week's refresh already succeeded (run ${done.databaseId})`,
      };
    }
  }
  if (scheduled) {
    const recent = runs.find(
      (r) =>
        isDone(r) &&
        Date.parse(r.createdAt) <= now.getTime() &&
        now.getTime() - Date.parse(r.createdAt) < RECENT_REFRESH_DAYS * 86_400_000
    );
    if (recent) {
      const days = ((now.getTime() - Date.parse(recent.createdAt)) / 86_400_000).toFixed(1);
      return {
        run: false,
        reason: `a refresh succeeded ${days} days ago (run ${recent.databaseId}): a second one now would publish a week shorter than 6 days; dispatch by hand to refresh anyway`,
      };
    }
  }
  if (!retrySchedule)
    return { run: true, reason: `the ${SCHEDULE_DAY_NAME} schedule or a manual run` };
  const since = cycleStartUtc(now).getTime();
  if (openPrUrl) {
    const refused = runs.find(
      (r) => Date.parse(r.createdAt) >= since && refusedRunIds.includes(String(r.databaseId))
    );
    if (refused) {
      return {
        run: false,
        reason: `run ${refused.databaseId} this week refused to carry the open refresh PR (${openPrUrl}); the same refusal would repeat: resolve it as that run's log says, then dispatch from main`,
      };
    }
    return {
      run: true,
      reason: `no successful refresh since ${SCHEDULE_DAY_NAME} 00:00 UTC: second attempt, carrying the open refresh PR (${openPrUrl})`,
    };
  }
  return {
    run: true,
    reason: `no successful refresh since ${SCHEDULE_DAY_NAME} 00:00 UTC: second attempt`,
  };
}

if (isDirectInvocation(import.meta.url)) {
  const runs = JSON.parse(fs.readFileSync(process.env.RUNS_FILE ?? '', 'utf8'));
  const { run, reason } = retryDecision({
    retrySchedule: process.env.RETRY_SCHEDULE === 'true',
    scheduled: process.env.SCHEDULED === 'true',
    refreshedRunIds: (process.env.REFRESHED_RUNS ?? '').split(',').filter(Boolean),
    openPrUrl: process.env.OPEN_PR ?? '',
    runs: Array.isArray(runs) ? runs : [],
    now: new Date(),
    refusedRunIds: (process.env.REFUSED_RUNS ?? '').split(',').filter(Boolean),
  });
  const safe = reason.replace(/[\r\n]+/g, ' ');
  console.log(`run=${run}`);
  console.log(`reason=${safe}`);
  console.error(`${run ? 'refresh' : 'skip'}: ${safe}`);
}
