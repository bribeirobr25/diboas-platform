#!/usr/bin/env node
/**
 * range-pass-report.mjs — which stored days passed their check ONLY through the range rule
 * (register 5.776, plan MP-2).
 *
 * The range rule lets a stored value pass when it lies inside the check source's traded
 * range that day, even when it is far from that source's close. On 2022-06-30 a Coin
 * Metrics month-end 3.3% below two exchanges passed this way, and the collection reports
 * recorded only a COUNT of such days. This command lists every one, per check source, so
 * each can be reviewed, and lists the days beyond tolerance that another check confirmed.
 *
 * Read-only on the store and on the network: it reads `market/daily/<series>.csv` and the
 * check responses already kept in `market/raw/` (through `raw/manifest.jsonl`), parses
 * them with the collector's parsers, prepares them with the collector's `comparable()`
 * and compares them with its `compareCloses`. It never fetches.
 *
 * One difference from the collector, stated: the collector compared each day with the
 * response of the run that wrote it; this report uses the newest stored response for each
 * day. If a source ever revises a past candle, the two can differ.
 *
 * With `--write` it adds one file, `market/checks/reviews/<series>-range-pass-<date>.json`,
 * created exclusively (never overwritten, never through an existing link).
 *
 *   node apps/web/scripts/market-data/range-pass-report.mjs --store <path-to-diboas-analytics> [--series btc] [--write]
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SERIES_BY_ID } from './catalogue.mjs';
import { compareCloses } from './checks.mjs';
import { comparable } from './collect.mjs';
import { PARSE } from './fetch-source.mjs';
import { readCsv } from './store.mjs';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';

/**
 * Rows of one check source from its stored responses; the newest response for a day wins.
 * A response that cannot be read or parsed is skipped and listed, never fatal: the
 * collector keeps the body of a 200 that carried the wrong content before retrying it.
 */
export function storedCheckRows(storeRoot, check, seriesId) {
  const market = path.join(storeRoot, 'market');
  const provider = check.source.provider;
  const parse = PARSE[check.source.parser];
  if (!parse) throw new Error(`no parser ${check.source.parser}`);
  if (check.source.perYear) throw new Error(`${provider}: per-year sources are not supported`);
  const entries = fs
    .readFileSync(path.join(market, 'raw', 'manifest.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .filter((e) => e.provider === provider && e.series === seriesId && e.status === 200)
    .sort((a, b) => a.fetched_at.localeCompare(b.fetched_at));
  const byDate = new Map();
  const missing = [];
  const unreadable = [];
  for (const e of entries) {
    const file = path.join(market, e.saved_as);
    if (!fs.existsSync(file)) {
      missing.push(e.saved_as);
      continue;
    }
    let rows;
    try {
      const raw = fs.readFileSync(file);
      const body = (e.saved_as.endsWith('.gz') ? zlib.gunzipSync(raw) : raw).toString('utf8');
      rows = parse(body, `${provider}:${seriesId}`, check.source.parserOpts).rows;
    } catch (err) {
      unreadable.push({ saved_as: e.saved_as, error: String(err.message) });
      continue;
    }
    const fetchDay = e.fetched_at.slice(0, 10);
    // only complete days: the day the response was fetched may still be trading
    for (const r of rows) if (r.date < fetchDay) byDate.set(r.date, r);
  }
  return {
    rows: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    responses: entries.length,
    missing,
    unreadable,
  };
}

/** The report for one series: every check with a range rule, every range-passed day. */
export function rangePassReport(storeRoot, seriesId, today) {
  const series = SERIES_BY_ID.get(seriesId);
  if (!series) throw new Error(`unknown series ${seriesId}`);
  const dailyFile = path.join(storeRoot, 'market', 'daily', `${seriesId}.csv`);
  const manifest = path.join(storeRoot, 'market', 'raw', 'manifest.jsonl');
  // A wrong --store path must never produce a clean-looking "0 days" record.
  for (const f of [dailyFile, manifest])
    if (!fs.existsSync(f)) throw new Error(`not a market data store: ${f} is missing`);
  const stored = readCsv(dailyFile).map((r) => ({ date: r.date, close: Number(r.close) }));
  const checks = [];
  const rows = [];
  const confirmedElsewhere = [];
  const results = [];
  for (const c of series.checks.filter((x) => x.rangeSlack != null)) {
    const provider = c.source.provider;
    const since = c.since ?? series.since;
    const got = storedCheckRows(storeRoot, c, seriesId);
    const base = {
      check_source: provider,
      since,
      stored_responses: got.responses,
      missing_files: got.missing,
      unreadable_responses: got.unreadable,
    };
    if (!got.rows.length) {
      checks.push({ ...base, note: 'no stored check response: nothing could be compared' });
      continue;
    }
    const last = got.rows[got.rows.length - 1].date;
    const inCoverage = stored.filter((r) => r.date >= since && r.date <= last);
    const cmp = comparable(series, c, inCoverage, got.rows);
    const res = compareCloses(cmp.primary, cmp.check, c.tolerance, cmp.opts);
    const checkDays = new Set(cmp.check.map((r) => r.date));
    results.push({
      provider,
      res,
      checkDays,
      outlierDays: new Set(res.outliers.map((o) => o.date)),
    });
    checks.push({
      ...base,
      through: last,
      tolerance: c.tolerance,
      rangeSlack: c.rangeSlack,
      compared_days: res.common,
      stored_days_without_a_check_value: cmp.primary.filter((p) => !checkDays.has(p.date)).length,
      passed_by_range: res.passedByRange,
      beyond_tolerance: res.outliers.length,
    });
    for (const d of res.rangePassDays)
      rows.push({
        series: seriesId,
        check_source: provider,
        day: d.date,
        stored: d.stored,
        check_low: d.check_low,
        check_high: d.check_high,
        check_close: d.check_close,
        passed_by: 'range',
      });
  }
  // Days beyond one check's tolerance and range: the collector lets them through only when
  // another check agreed that day (two of three sources), or a reviewed exception covers
  // them. Listed so the record states what happened to each.
  for (const r of results)
    for (const o of r.res.outliers) {
      const by = results.find(
        (x) => x !== r && x.checkDays.has(o.date) && !x.outlierDays.has(o.date)
      );
      confirmedElsewhere.push({
        day: o.date,
        check_source: r.provider,
        stored: o.primary,
        check_close: o.check,
        diff: o.diff,
        agreed_by: by ? by.provider : null,
      });
    }
  return {
    series: seriesId,
    generated: today,
    definition: series.definition ?? null,
    method:
      "read-only: stored daily values against the check responses kept in market/raw/ (newest response per day; the collector used each run's own response), prepared with the collector's comparable() and compared with its compareCloses; no fetch",
    checks,
    rows: rows.sort(
      (a, b) => a.day.localeCompare(b.day) || a.check_source.localeCompare(b.check_source)
    ),
    distinct_days: new Set(rows.map((x) => x.day)).size,
    beyond_tolerance: confirmedElsewhere.sort((a, b) => a.day.localeCompare(b.day)),
  };
}

export function main(argv = process.argv.slice(2), { now = new Date(), log = console.log } = {}) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    const v = i === -1 ? null : argv[i + 1];
    return v && !v.startsWith('--') ? v : null;
  };
  const store = arg('--store');
  if (!store) {
    log('usage: range-pass-report.mjs --store <path-to-diboas-analytics> [--series btc] [--write]');
    return 2;
  }
  const seriesId = arg('--series') ?? 'btc';
  const today = now.toISOString().slice(0, 10);
  let report;
  try {
    report = rangePassReport(store, seriesId, today);
  } catch (e) {
    log(`refused: ${e.message}`);
    return 2;
  }
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (!argv.includes('--write')) {
    log(text);
    return 0;
  }
  const dir = path.join(store, 'market', 'checks', 'reviews');
  const out = path.join(dir, `${seriesId}-range-pass-${today}.json`);
  fs.mkdirSync(dir, { recursive: true });
  try {
    // 'wx': fails if anything exists at the path, a dangling link included
    fs.writeFileSync(out, text, { flag: 'wx' });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    log(`refused: ${out} exists (the report is a record; write a new day's file instead)`);
    return 3;
  }
  log(`wrote ${out}: ${report.rows.length} range pass(es) on ${report.distinct_days} day(s)`);
  return 0;
}

if (isDirectInvocation(import.meta.url)) process.exitCode = main();
