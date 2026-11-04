#!/usr/bin/env node
/**
 * collect.mjs — fetch, check, store and derive every Market series.
 *
 *   node apps/web/scripts/market-data/collect.mjs --store <dir> [--backfill]
 *        [--series spy,tlt] [--today YYYY-MM-DD]
 *
 * `--store` is the `market/` folder of a diboas-analytics checkout. Without
 * `--backfill` each series is fetched from 45 days before its last stored day
 * (the overlap re-confirms recent days and catches revisions); with it, from
 * the series' `since` date.
 *
 * Exit codes: 0 = every series stored or already up to date; 1 = at least one
 * series was BLOCKED (a check outlier, a revision, or a failed primary fetch)
 * and nothing was written for that series; 2 = bad arguments. Every response
 * body is kept under `raw/` whatever the outcome.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SERIES } from './catalogue.mjs';
import { compareCloses, reconcileDistributions } from './checks.mjs';
import { monthlyBars, weeklyCloses } from './derive.mjs';
import * as P from './parsers.mjs';
import { createStore, toCsv } from './store.mjs';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)';
const TIMEOUT_MS = 90_000;
const OVERLAP_DAYS = 45;

const PARSE = {
  yahoo: (b, l) => P.parseYahooChart(b, l),
  cnbc: (b, l) => P.parseCnbcBars(b, l),
  fred: (b, l) => P.parseFredCsv(b, l),
  coinmetrics: (b, l) => P.parseCoinMetrics(b, l),
  b3: (b, l, year) => P.parseB3Year(b, year, l),
  wgc: (b, l) => P.parseWgcChart(b, l),
  nasdaqHistorical: (b, l) => P.parseNasdaqHistorical(b, l),
  nasdaqDividends: (b, l) => P.parseNasdaqDividends(b, l),
  ishares: (b, l) => P.parseIsharesDistributions(b, l),
  stockanalysis: (b, l) => P.parseStockAnalysisDividends(b, l),
};
const EXT = { fred: 'csv', ishares: 'html' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** One GET with a deadline; up to 3 attempts on network errors, 429 and 5xx. Every attempt's body is kept. */
async function get(url, { store, provider, series, fetchedAt = () => new Date().toISOString() }) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const at = fetchedAt();
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json, text/csv, text/plain, */*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const body = await res.text();
      store.saveRaw({
        provider,
        series,
        url,
        status: res.status,
        body,
        fetchedAt: at,
        ext: EXT[provider] ?? 'json',
      });
      if (res.ok) return body;
      last = new Error(`${provider} ${series}: HTTP ${res.status}`);
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      store.saveRaw({
        provider,
        series,
        url,
        status: null,
        body: String(e?.message ?? e),
        fetchedAt: at,
        ext: 'txt',
      });
      last = new Error(
        `${provider} ${series}: ${e?.name === 'TimeoutError' ? `no answer in ${TIMEOUT_MS / 1000}s` : e?.message}`
      );
    }
    await sleep(attempt * 15_000);
  }
  throw last;
}

/** Fetch one source over [from, to] and parse it into rows/events. */
async function fetchSource(src, { from, to, store, series }) {
  const label = `${src.provider}:${series}`;
  const ctx = { store, provider: src.provider, series };
  const parse = PARSE[src.parser];
  if (src.perYear) {
    const rows = [];
    for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y += 1) {
      const body = await get(src.url(y), ctx);
      rows.push(...parse(body, label, y).rows);
      await sleep(400);
    }
    return { rows: rows.filter((r) => r.date >= from && r.date <= to) };
  }
  if (src.paged) {
    const rows = [];
    let url = src.url(from, to);
    while (url) {
      const page = parse(await get(url, ctx), label);
      rows.push(...page.rows);
      url = page.next;
    }
    return { rows };
  }
  let body;
  try {
    body = await get(src.url(from, to), ctx);
  } catch (e) {
    if (!src.fallback) throw e;
    body = await get(src.fallback(from, to), ctx);
  }
  return parse(body, label);
}

/** The last COMPLETE day: anything dated on or after the run's UTC date may still be moving. */
const complete = (rows, today) => rows.filter((r) => r.date < today);

async function collectSeries(s, { store, today, backfill, accepted }) {
  const stored = store.readDaily(s.id);
  const lastStored = stored.at(-1)?.date;
  const from = backfill || !lastStored ? s.since : addDays(lastStored, -OVERLAP_DAYS);
  const to = addDays(today, -1);
  const out = { id: s.id, from, to, checks: [], blocked: [], notes: [] };

  const primary = await fetchSource(s.primary, { from, to, store, series: s.id });
  const rows = complete(primary.rows, today).filter((r) => r.date >= s.since);
  if (!rows.length)
    throw new Error(`${s.id}: the primary returned no complete days in ${from}..${to}`);
  const storedDates = new Set(stored.map((r) => r.date));
  const newDates = new Set(rows.filter((r) => !storedDates.has(r.date)).map((r) => r.date));
  const isAccepted = (date) =>
    accepted.some((a) => a.series === s.id && a.date === date && a.reason);

  for (const c of s.checks) {
    const cFrom = c.since && c.since > from ? c.since : from;
    let res;
    try {
      const chk = await fetchSource(c.source, { from: cFrom, to, store, series: s.id });
      res = compareCloses(rows, complete(chk.rows, today), c.tolerance);
    } catch (e) {
      out.checks.push({ source: c.source.provider, error: String(e.message) });
      out.blocked.push(`check ${c.source.provider} could not be fetched: ${e.message}`);
      continue;
    }
    const blocking = res.outliers.filter((o) => newDates.has(o.date) && !isAccepted(o.date));
    out.checks.push({ source: c.source.provider, ...res, blockingOutliers: blocking.length });
    if (blocking.length)
      out.blocked.push(
        `check ${c.source.provider}: ${blocking.length} day(s) beyond ${c.tolerance * 100}% (first ${blocking[0].date})`
      );
    // A check that shares too few days with the new rows checked nothing.
    const newCommon = rows.filter((r) => newDates.has(r.date)).length;
    if (newCommon > 20 && res.common < 0.8 * Math.min(newCommon, rows.length))
      out.notes.push(`check ${c.source.provider} shares only ${res.common} of ${rows.length} days`);
  }

  let events = null;
  if (s.kind === 'fund') {
    const checks = [];
    for (const dc of s.dividendChecks ?? []) {
      try {
        const r = await fetchSource(dc.source, { from: s.since, to, store, series: s.id });
        checks.push({
          name: dc.source.provider,
          from: dc.from,
          events: r.events.filter((e) => e.date >= s.since && e.date < today),
        });
      } catch (e) {
        out.blocked.push(
          `distribution check ${dc.source.provider} could not be fetched: ${e.message}`
        );
      }
    }
    const rec = reconcileDistributions(
      (primary.events ?? []).filter((e) => e.date >= s.since && e.date < today),
      checks
    );
    // A reviewed exception resolves a disagreement by stating the amount to
    // store and why (e.g. a third source); without an amount it is not resolved.
    const resolution = (o) =>
      accepted.find(
        (a) =>
          a.series === `${s.id}.distributions` &&
          a.date === o.date &&
          a.reason &&
          Number.isFinite(a.amount)
      );
    const blocking = rec.outliers.filter((o) => !resolution(o));
    const resolved = rec.outliers
      .filter((o) => resolution(o))
      .map((o) => ({
        date: o.date,
        amount: resolution(o).amount,
        sources: [...o.seen.map((x) => x.name), 'reviewed'],
      }));
    out.distributions = {
      merged: rec.merged.length + resolved.length,
      outliers: rec.outliers,
      resolved: resolved.length,
      notes: rec.notes,
    };
    if (blocking.length)
      out.blocked.push(
        `distributions: ${blocking.length} disagreement(s) (first ${blocking[0].date} ${blocking[0].kind})`
      );
    events = [...rec.merged, ...resolved].sort((a, b) => a.date.localeCompare(b.date));
  }

  if (out.blocked.length) return out; // nothing is written for a blocked series

  const runAt = new Date().toISOString();
  const merged = store.mergeDaily(s.id, rows, {
    source: s.primary.provider,
    revisable: s.revisable,
    runAt,
  });
  out.added = merged.added;
  out.total = merged.total;
  if (merged.revisions.length) out.revisions = merged.revisions;
  if (merged.blocked) {
    out.blocked.push(
      `${merged.revisions.filter((r) => !r.accepted).length} stored day(s) changed at the source (see revisions.jsonl)`
    );
    return out;
  }
  let dist = [];
  if (events) {
    const m = store.mergeEvents(s.id, events, { runAt });
    out.distributionsAdded = m.added;
    if (m.blocked) {
      out.blocked.push(`${m.revisions.length} stored distribution(s) changed at the source`);
      return out;
    }
    dist = store.readEvents(s.id);
  }
  const daily = store.readDaily(s.id);
  store.writeDerived(
    `weekly/${s.id}.csv`,
    toCsv(weeklyCloses(daily, today), ['week_ending', 'date', 'close'])
  );
  store.writeDerived(
    `monthly/${s.id}.csv`,
    toCsv(
      monthlyBars(daily, dist, today).map((m) => ({
        ...m,
        tr_close: s.kind === 'fund' ? m.tr_close : '',
      })),
      ['ym', 'open', 'high', 'low', 'close', 'tr_close', 'distributions', 'last_day']
    )
  );
  return out;
}

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
    else if (k === '--series') a.series = argv[++i].split(',');
    else if (k === '--today') a.today = argv[++i];
    else throw new Error(`unknown argument ${k}`);
  }
  if (!a.store) throw new Error('--store <analytics market/ folder> is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.today)) throw new Error('--today must be YYYY-MM-DD');
  return a;
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const store = createStore(path.resolve(args.store));
  const acceptedFile = path.join(store.root, 'checks', 'accepted-exceptions.json');
  const accepted = fs.existsSync(acceptedFile)
    ? JSON.parse(fs.readFileSync(acceptedFile, 'utf8'))
    : [];
  const unknown = (args.series ?? []).filter((id) => !SERIES.some((s) => s.id === id));
  if (unknown.length) {
    console.error(`unknown series: ${unknown.join(', ')}`);
    return 2;
  }
  const todo = SERIES.filter((s) => !args.series || args.series.includes(s.id));
  const report = {
    run_at: new Date().toISOString(),
    today: args.today,
    backfill: args.backfill,
    series: [],
  };
  for (const s of todo) {
    let r;
    try {
      r = await collectSeries(s, { store, today: args.today, backfill: args.backfill, accepted });
    } catch (e) {
      r = { id: s.id, blocked: [`primary ${s.primary.provider}: ${e.message}`] };
    }
    report.series.push(r);
    const state = r.blocked?.length
      ? `BLOCKED — ${r.blocked.join('; ')}`
      : `ok, +${r.added} day(s), ${r.total} stored`;
    console.log(`${s.id.padEnd(17)} ${state}`);
  }
  const where = store.writeChecks(args.today, report);
  const blocked = report.series.filter((r) => r.blocked?.length).length;
  console.log(`\n${todo.length - blocked} of ${todo.length} series stored; check report: ${where}`);
  return blocked ? 1 : 0;
}

if (isDirectInvocation(import.meta.url)) {
  main().then((code) => process.exit(code));
}
