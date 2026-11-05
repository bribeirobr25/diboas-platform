#!/usr/bin/env node
/**
 * collect.mjs — fetch, check, store and derive every Market series.
 *
 *   node apps/web/scripts/market-data/collect.mjs --store <dir> [--backfill]
 *        [--series spy,tlt] [--today YYYY-MM-DD]
 *
 * `--store` is the `market/` folder of a diboas-analytics checkout. Without
 * `--backfill` each series is fetched from 45 days before its last stored day
 * (the overlap re-confirms recent days, catches revisions, and gives every
 * check enough common days to test alignment); with it, from the series'
 * `since` date. A `fullHistory` series (M2) is always fetched whole.
 *
 * FAIL CLOSED, per series. A series is BLOCKED, and NOTHING is written to its
 * values, when: the primary fails; a check source fails, returns too few of
 * the window's days, or is misaligned by a day; a check outlier on a day this
 * run adds has no reviewed exception bound to it; a distribution source
 * returns nothing or disagrees; a stored day changed at the source; or the
 * derived series cannot be computed. Every check runs, and every value is
 * planned, before any value is written.
 *
 * Always kept, whatever the outcome: every response body (`raw/`), the run's
 * check report (`checks/`), and any revision (`revisions.jsonl`).
 *
 * Exit codes: 0 = every series stored or already up to date; 1 = at least one
 * series BLOCKED; 2 = bad arguments (nothing fetched); 3 = the run itself
 * failed (for example an unreadable exceptions file); evidence written up to
 * that point is kept.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SERIES } from './catalogue.mjs';
import { compareCloses, monthlyChanges, reconcileDistributions } from './checks.mjs';
import { monthlyBars, weeklyCloses } from './derive.mjs';
import {
  checkException,
  distributionException,
  keptRevisionDates,
  parseExceptions,
} from './exceptions.mjs';
import { createFetcher } from './fetch-source.mjs';
import { createStore, toCsv } from './store.mjs';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';

export const OVERLAP_DAYS = 45;
/** A check must share at least this share of the window's days with the primary. */
export const MIN_CHECK_COVERAGE = 0.5;

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The last COMPLETE day: anything dated on or after the run's UTC date may still be moving. */
const complete = (rows, today) => rows.filter((r) => r.date < today);

/**
 * A bar whose low/high do not contain its open and close is not a usable
 * range (four CNBC gold days since 2010). Its close is kept (it is checked);
 * its open/high/low are dropped so no range is ever built from it.
 */
export function usableBars(rows) {
  let dropped = 0;
  const out = rows.map((r) => {
    if (r.low == null || r.high == null) return r;
    const ok =
      r.low <= r.high &&
      r.low <= r.close &&
      r.close <= r.high &&
      (r.open == null || (r.low <= r.open && r.open <= r.high));
    if (ok) return r;
    dropped += 1;
    return { date: r.date, open: null, high: null, low: null, close: r.close };
  });
  return { rows: out, dropped };
}

/**
 * Run every check of a series. A check outlier blocks unless (a) a reviewed
 * exception is bound to it, or (b) the series has another independent check
 * that compared the same day and agreed (two of three sources agree: the
 * disagreeing check is the odd one out, which is reported, never hidden).
 */
/** Monthly series are dated on the month's first day; their checks shift by months. */
const MONTHLY_KINDS = new Set(['monthly', 'index']);

/**
 * What a check compares (catalogue `compare`):
 *   - absent      the values themselves, relative tolerance (prices, FX)
 *   - 'points'    the values themselves, absolute tolerance (interest rates)
 *   - 'change'    the month-on-month % change, absolute tolerance in points
 *                 (price indices on different base years). `checkIsChange`
 *                 says the check source already publishes the change (BCB
 *                 SGS 433 for the IPCA); `onlyFirstOfMonth` keeps a daily
 *                 check source's first-of-month values (BCB SGS 226 for TR).
 */
export function comparable(s, c, primaryRows, checkRows) {
  const firsts = c.onlyFirstOfMonth ? checkRows.filter((r) => r.date.endsWith('-01')) : checkRows;
  const shiftUnit = MONTHLY_KINDS.has(s.kind) ? 'month' : 'day';
  if (c.compare === 'change')
    return {
      primary: monthlyChanges(primaryRows),
      check: c.checkIsChange ? firsts : monthlyChanges(firsts),
      opts: { mode: 'points', shiftUnit },
    };
  return {
    primary: primaryRows,
    check: firsts,
    opts: {
      rangeSlack: c.rangeSlack,
      mode: c.compare === 'points' ? 'points' : 'relative',
      shiftUnit,
    },
  };
}

async function runChecks(s, { rows, newDates, from, to, today, fetcher, exceptions, out }) {
  const results = [];
  for (const c of s.checks) {
    const cFrom = c.since && c.since > from ? c.since : from;
    const inCoverage = rows.filter((r) => r.date >= cFrom);
    if (!inCoverage.length) continue; // the window lies before this check's coverage
    try {
      const chk = complete(
        (await fetcher.fetchSource(c.source, { from: cFrom, to, series: s.id })).rows,
        today
      );
      const cmp = comparable(s, c, inCoverage, chk);
      const eligible = cmp.primary;
      if (!eligible.length) continue; // a single month has no change to compare yet
      const res = compareCloses(eligible, cmp.check, c.tolerance, cmp.opts);
      const bad = new Set(res.outliers.map((o) => o.date));
      const agreed = new Set(cmp.check.map((r) => r.date).filter((d) => !bad.has(d)));
      results.push({ c, cFrom, eligible, res, agreed });
    } catch (e) {
      out.checks.push({ source: c.source.provider, error: String(e.message) });
      out.blocked.push(`check ${c.source.provider} failed: ${e.message}`);
    }
  }
  for (const { c, cFrom, eligible, res } of results) {
    const provider = c.source.provider;
    const others = results.filter((r) => r.c !== c);
    const corroborated = [];
    const unresolved = [];
    for (const o of res.outliers) {
      if (!newDates.has(o.date) || checkException(exceptions, s.id, provider, o)) continue;
      const by = others.find((r) => r.agreed.has(o.date));
      if (by) corroborated.push({ date: o.date, agreed_by: by.c.source.provider });
      else unresolved.push(o);
    }
    out.checks.push({
      source: provider,
      since: cFrom,
      ...res,
      corroboratedByAnotherCheck: corroborated,
      blockingOutliers: unresolved.length,
    });
    if (res.common < MIN_CHECK_COVERAGE * eligible.length)
      out.blocked.push(`check ${provider} shares only ${res.common} of ${eligible.length} days`);
    if (res.alignment?.misaligned) out.blocked.push(`check ${provider} looks shifted by a day`);
    if (unresolved.length)
      out.blocked.push(
        `check ${provider}: ${unresolved.length} day(s) beyond ${c.compare ? `${c.tolerance} points` : `${c.tolerance * 100}%`} (first ${unresolved[0].date})`
      );
  }
  const firstChecked = s.checks.map((c) => c.since ?? s.since).sort()[0];
  if (!s.checks.length) out.notes.push('no independent source: the publisher is the only source');
  else if (firstChecked > s.since) out.notes.push(`single-source before ${firstChecked}`);
}

async function runDistributions(
  s,
  { primaryEvents, from, to, today, tradingDays, fetcher, exceptions, out }
) {
  const inWindow = (e) => e.date >= from && e.date <= to && e.date >= s.since && e.date < today;
  const checks = [];
  for (const dc of s.dividendChecks ?? []) {
    try {
      const r = await fetcher.fetchSource(dc.source, { from: s.since, to, series: s.id });
      const history = (r.events ?? []).filter((e) => e.date < today);
      if (!history.length) {
        out.blocked.push(`distribution check ${dc.source.provider} returned no distributions`);
        continue;
      }
      // Coverage starts at the source's first listed distribution (or its
      // stated start), measured on its WHOLE history, then the comparison is
      // cut to this run's window.
      checks.push({
        name: dc.source.provider,
        from: dc.from ?? history[0].date,
        events: history.filter(inWindow),
      });
    } catch (e) {
      out.blocked.push(`distribution check ${dc.source.provider} failed: ${e.message}`);
    }
  }
  const rec = reconcileDistributions(primaryEvents.filter(inWindow), checks, { tradingDays });
  const resolved = [];
  const unresolved = [];
  for (const o of rec.outliers) {
    const x = distributionException(exceptions, s.id, o);
    if (!x) unresolved.push(o);
    else if (x.action === 'store')
      resolved.push({
        date: o.date,
        amount: x.amount,
        sources: [...o.seen.map((v) => v.name), 'reviewed'],
      });
  }
  out.distributions = {
    compared: rec.merged.length + rec.outliers.length,
    outliers: rec.outliers,
    resolved: resolved.length,
    notes: rec.notes,
  };
  if (unresolved.length)
    out.blocked.push(
      `distributions: ${unresolved.length} disagreement(s) (first ${unresolved[0].date} ${unresolved[0].kind})`
    );
  return [...rec.merged, ...resolved].sort((a, b) => a.date.localeCompare(b.date));
}

export async function collectSeries(s, { store, fetcher, today, backfill, exceptions }) {
  const stored = store.readDaily(s.id);
  const lastStored = stored.at(-1)?.date;
  const from =
    backfill || s.fullHistory || !lastStored ? s.since : addDays(lastStored, -OVERLAP_DAYS);
  const to = addDays(today, -1);
  const out = { id: s.id, from, to, checks: [], blocked: [], notes: [] };
  const runAt = new Date().toISOString();

  const primary = await fetcher.fetchSource(s.primary, { from, to, series: s.id });
  const bars = usableBars(complete(primary.rows, today).filter((r) => r.date >= s.since));
  const rows = bars.rows;
  if (bars.dropped)
    out.notes.push(
      `${bars.dropped} bar(s) whose range did not contain open/close: range dropped, close kept`
    );
  if (!rows.length)
    throw new Error(`${s.id}: the primary returned no complete days in ${from}..${to}`);
  const storedDates = new Set(stored.map((r) => r.date));
  const newDates = new Set(rows.filter((r) => !storedDates.has(r.date)).map((r) => r.date));

  await runChecks(s, { rows, newDates, from, to, today, fetcher, exceptions, out });
  let events = null;
  if (s.kind === 'fund') {
    const tradingDays = new Set([...storedDates, ...rows.map((r) => r.date)]);
    events = await runDistributions(s, {
      primaryEvents: primary.events ?? [],
      from,
      to,
      today,
      tradingDays,
      fetcher,
      exceptions,
      out,
    });
  }

  // Plan every write; revisions are logged whatever happens.
  const first = store.planDaily(s.id, rows, {
    source: s.primary.provider,
    revisable: s.revisable,
    runAt,
  });
  const keep = keptRevisionDates(exceptions, s.id, first.revisions);
  const daily = keep.size
    ? store.planDaily(s.id, rows, {
        source: s.primary.provider,
        revisable: s.revisable,
        runAt,
        keep,
      })
    : first;
  if (daily.revisions.length) {
    out.revisions = daily.revisions;
    store.logRevisions(daily.revisions);
  }
  if (daily.blocked)
    out.blocked.push(
      `${daily.revisions.filter((r) => !r.accepted && !r.kept_by_review).length} stored day(s) changed at the source`
    );
  const ev = events ? store.planEvents(s.id, events, { runAt }) : null;
  if (ev?.revisions.length) store.logRevisions(ev.revisions);
  if (ev?.blocked)
    out.blocked.push(`${ev.revisions.length} stored distribution(s) changed at the source`);
  if (out.blocked.length) return out;

  let weekly;
  let monthly;
  try {
    weekly = MONTHLY_KINDS.has(s.kind) ? null : weeklyCloses(daily.all, today);
    monthly = monthlyBars(daily.all, ev?.all ?? [], today);
  } catch (e) {
    out.blocked.push(`derived series: ${e.message}`);
    return out;
  }

  store.writeDaily(s.id, daily.all);
  if (ev && ev.added) store.writeEvents(s.id, ev.all);
  if (weekly) store.writeDerived(`weekly/${s.id}.csv`, toCsv(weekly, ['week_ending', 'close']));
  store.writeDerived(
    `monthly/${s.id}.csv`,
    toCsv(
      monthly.map((m) => ({ ...m, tr_close: s.kind === 'fund' ? m.tr_close : '' })),
      ['ym', 'open', 'high', 'low', 'close', 'tr_close', 'distributions', 'last_day']
    )
  );
  out.added = daily.added;
  out.total = daily.all.length;
  if (ev) out.distributionsAdded = ev.added;
  return out;
}

const SERIES_ARG = /^[a-z0-9_]+(,[a-z0-9_]+)*$/;

function parseArgs(argv) {
  const a = {
    backfill: false,
    series: null,
    store: null,
    today: new Date().toISOString().slice(0, 10),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    if (k === '--backfill') a.backfill = true;
    else if (k === '--store') a.store = argv[++i];
    else if (k === '--series') a.series = argv[++i];
    else if (k === '--today') a.today = argv[++i];
    else throw new Error(`unknown argument ${k}`);
  }
  if (!a.store) throw new Error('--store <analytics market/ folder> is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.today)) throw new Error('--today must be YYYY-MM-DD');
  if (a.series != null && !SERIES_ARG.test(a.series))
    throw new Error('--series must be comma-separated ids');
  if (a.series != null) a.series = a.series.split(',');
  return a;
}

/**
 * @param {string[]} argv
 * @param {{fetchImpl?: Function, retryBaseMs?: number}} [deps] test seams
 */
export async function main(argv = process.argv.slice(2), deps = {}) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const unknown = (args.series ?? []).filter((id) => !SERIES.some((s) => s.id === id));
  if (unknown.length) {
    console.error(`unknown series: ${unknown.join(', ')}`);
    return 2;
  }
  const store = createStore(path.resolve(args.store));
  const report = {
    run_at: new Date().toISOString(),
    today: args.today,
    backfill: args.backfill,
    series: [],
  };
  try {
    const file = path.join(store.root, 'checks', 'accepted-exceptions.json');
    const exceptions = fs.existsSync(file) ? parseExceptions(fs.readFileSync(file, 'utf8')) : [];
    const fetcher = createFetcher({ store, ...deps });
    const todo = SERIES.filter((s) => !args.series || args.series.includes(s.id));
    for (const s of todo) {
      let r;
      try {
        r = await collectSeries(s, {
          store,
          fetcher,
          today: args.today,
          backfill: args.backfill,
          exceptions,
        });
      } catch (e) {
        r = { id: s.id, blocked: [`primary ${s.primary.provider}: ${e.message}`] };
      }
      report.series.push(r);
      const state = r.blocked?.length
        ? `BLOCKED — ${r.blocked.join('; ')}`
        : `ok, +${r.added} day(s), ${r.total} stored`;
      console.log(`${s.id.padEnd(17)} ${state}`);
    }
    report.hosts_down = fetcher.hostsDown();
    const blocked = report.series.filter((r) => r.blocked?.length).length;
    const where = store.writeChecks(report.run_at, report);
    console.log(
      `\n${todo.length - blocked} of ${todo.length} series stored; check report: ${where}`
    );
    return blocked ? 1 : 0;
  } catch (e) {
    report.failed = String(e?.message ?? e);
    try {
      store.writeChecks(report.run_at, report);
    } catch {
      // the original failure is the one to report
    }
    console.error(`RUN FAILED: ${report.failed}`);
    return 3;
  }
}

if (isDirectInvocation(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (e) => {
      console.error(`RUN FAILED: ${e?.message ?? e}`);
      process.exit(3);
    }
  );
}
