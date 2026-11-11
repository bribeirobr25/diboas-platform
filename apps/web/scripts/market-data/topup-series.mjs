#!/usr/bin/env node
/**
 * topup-series.mjs — which series the Tuesday top-up collects (plan MP-3b, gate TOPUP-1).
 *
 * The weekly refresh runs on Tuesday so the Fed's Monday data is in (founder 2026-11-10,
 * answer 13). Before it reads the store, a top-up collects: every catalogue series marked
 * `topUp` (published on Monday: the broad dollar index, the H.10 exchange rates, the 10-year,
 * the Nasdaq Composite; and Bitcoin, which trades through the weekend), plus every series the latest collection BLOCKED (decision B-2: a
 * fail-open re-run). Reads the store's latest check report; writes nothing.
 *
 *   node apps/web/scripts/market-data/topup-series.mjs --store <path>/market [--blocked]
 * Prints the series ids, comma-separated (the collector's `--series` format). With
 * `--blocked`, prints only the series the latest check report blocked (after the top-up
 * ran, that is the top-up's own report: what is still blocked). With `--behind`, prints the
 * top-up's weekday series whose newest stored day is before the last full week's Monday: a week
 * behind, as after a US holiday Monday when the Fed publishes a day late (answer 13).
 */
import fs from 'node:fs';
import path from 'node:path';
import { calendarOf } from './calendar.mjs';
import { SERIES } from './catalogue.mjs';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';

const REPORT = /^\d{8}T\d{6}Z\.json$/;

/** The series the latest check report blocked (empty when there is no report). */
export function blockedInLatestReport(storeDir) {
  const dir = path.join(storeDir, 'checks');
  if (!fs.existsSync(dir)) return [];
  const latest = fs
    .readdirSync(dir)
    .filter((f) => REPORT.test(f))
    .sort()
    .at(-1);
  if (!latest) return [];
  const report = JSON.parse(fs.readFileSync(path.join(dir, latest), 'utf8'));
  const listed = report.series ?? [];
  const blocked = listed.filter((s) => s.blocked?.length).map((s) => s.id);
  // A run that failed or never finished (killed by its time limit: `complete` is false, 5.883)
  // lists only the series it reached: every other one it was asked for counts as blocked, or
  // a series it never reached would stay a week old (review of MP-3b). Reports written before
  // 5.883 carry neither `requested` nor `complete`: then every catalogue series counts, and
  // only `failed` marks an unfinished run.
  if (report.failed || report.complete === false) {
    const reached = new Set(listed.map((s) => s.id));
    const asked = Array.isArray(report.requested) ? report.requested : SERIES.map((s) => s.id);
    for (const id of asked) if (!reached.has(id) && !blocked.includes(id)) blocked.push(id);
  }
  return blocked;
}

/** The Friday strictly before `today` (UTC), as YYYY-MM-DD. */
export function lastFriday(today) {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const back = (d.getUTCDay() - 5 + 7) % 7 || 7;
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The top-up's weekday series a WEEK behind: the newest stored day falls before the Monday of
 * the last full week (a day or two short, like FRED's one-day lag, is not a week behind).
 */
export function behindSeries(storeDir, today) {
  const weekStart = new Date(Date.parse(`${lastFriday(today)}T00:00:00Z`) - 4 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return SERIES.filter((s) => s.topUp && calendarOf(s) === 'weekdays')
    .filter((s) => {
      const file = path.join(storeDir, 'daily', `${s.id}.csv`);
      if (!fs.existsSync(file)) return true;
      const last = fs.readFileSync(file, 'utf8').trimEnd().split('\n').at(-1) ?? '';
      return !/^\d{4}-\d{2}-\d{2}/.test(last) || last.slice(0, 10) < weekStart;
    })
    .map((s) => s.id);
}

/** The top-up's series ids: the late ones, then any blocked one, each once, in catalogue order. */
export function topupSeries(storeDir) {
  const blocked = new Set(blockedInLatestReport(storeDir));
  return SERIES.filter((s) => s.topUp || blocked.has(s.id)).map((s) => s.id);
}

if (isDirectInvocation(import.meta.url)) {
  const i = process.argv.indexOf('--store');
  const store = i === -1 ? null : process.argv[i + 1];
  if (!store) {
    console.error('usage: topup-series.mjs --store <path>/market');
    process.exitCode = 2;
  } else {
    const ids = process.argv.includes('--blocked')
      ? blockedInLatestReport(store).filter((id) => SERIES.some((s) => s.id === id))
      : process.argv.includes('--behind')
        ? behindSeries(store, new Date())
        : topupSeries(store);
    process.stdout.write(ids.join(','));
  }
}
