#!/usr/bin/env node
/**
 * publish.mjs — write the Money Tools' monthly series FROM the market data
 * store (plan 5.760, increment 2; founder rulings 2026-11-04/05).
 *
 *   node apps/web/scripts/market-data/publish.mjs --store <analytics market/ dir>
 *        --store-commit <sha> [--out <data dir>] [--report <file>]
 *   node apps/web/scripts/market-data/publish.mjs --check --store <dir> [--out <data dir>]
 *   node apps/web/scripts/market-data/publish.mjs --verify-manifest [--out <data dir>]
 *        (no store needed: the committed series must match store-manifest.json;
 *        run on every PR, so a hand edit of a published series alone fails CI)
 *
 * The store (diboas-analytics `market/`, collected and checked by
 * collect.mjs) is the only source. This script turns its derived monthly
 * series into the two files the website reads:
 *
 *   monthlyPrices.json  SP500, QQQ, MSCI_WORLD, TLT (total return), GOLD
 *                       (SPOT gold, founder 2026-11-04), IBOVESPA (official
 *                       B3 closes), DAX. BTC is NOT written here: the score
 *                       reads those rows, and moving them is a methodology
 *                       change that belongs to increment 3 (5.138). Its rows
 *                       are carried over exactly as they are.
 *   monthlyFx.json      the eight currencies, Fed H.10 month-end (founder
 *                       2026-11-05); entries the store does not hold
 *                       (ARS, CLP, COP placeholders) are carried over.
 *
 * Rules:
 *   - a month is published only when EVERY series written here has it COMPLETE,
 *     prices and FX alike, so no tool joins a price to a missing rate (5.479).
 *     A series' latest month is complete when its last stored day is the
 *     month's last weekday, or when the store already holds a later day (a
 *     holiday month-end). H.10 reaches the store about a week late, so at a
 *     month-roll every series waits a week rather than publish a pre-month-end
 *     rate as the month-end;
 *   - a run never removes a month that is already published, and never writes
 *     a value that is not a positive number or a bar whose open or close lies
 *     outside its low/high: it refuses (exit 3) and the series stay as they are;
 *   - each series starts at a fixed month (MSCI World at 2012-02, the first
 *     full month after the ETF's launch; FX at 2010-01);
 *   - a total-return fund's `close` is the store's total-return index,
 *     re-based so its latest month equals its price (`closePriceOnly`);
 *   - the output depends only on the store's contents: `--check` rebuilds
 *     everything and compares series by hash, which is how PUBLISH-1 proves
 *     that nobody edited a published series by hand;
 *   - `store-manifest.json` records the store commit read, the run time, the
 *     methodology version and one sha256 per series (never a value: the CI logs
 *     are public). Every key of both files is covered except BTC.
 *
 * Exit codes: 0 = written (or, with --check / --verify-manifest, nothing
 * differs); 1 = a difference; 2 = bad arguments; 3 = not published (the store
 * could not be read, or a rule above refused it; nothing is written and
 * --report says why).
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';
import { writeFileAtomic, writeJsonAtomic } from '../market-refresh/lib/atomic.mjs';
import { readCsv } from './store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const DATA_DIR = path.join(ROOT, 'apps/web/src/lib/market-data/data');
const METHODOLOGY = path.join(ROOT, 'apps/web/data/market/shared/methodology.json');

/**
 * The series this script owns, the store series each comes from, the
 * decimals it is written with, and the first month it starts at on the site.
 * `prec` rounds close / closePriceOnly; `ohl` rounds open/high/low. This list
 * replaces tools-monthlies.mjs SERIES_SHAPES (MONTHLY-RULES-1 reads it).
 */
export const PRICE_SERIES = {
  SP500: {
    store: 'spy',
    totalReturn: true,
    prec: 4,
    ohl: 2,
    since: '2010-07',
    unit: 'USD per share (total return in close)',
    basis: 'total_return',
    source: 'SPY via the diboas-analytics market store',
  },
  QQQ: {
    store: 'qqq',
    totalReturn: true,
    prec: 4,
    ohl: 2,
    since: '2010-07',
    unit: 'USD per share (total return in close)',
    basis: 'total_return',
    source: 'QQQ via the diboas-analytics market store',
  },
  MSCI_WORLD: {
    store: 'urth',
    totalReturn: true,
    prec: 4,
    ohl: 2,
    since: '2012-02',
    unit: 'USD per share (total return in close)',
    basis: 'total_return',
    source: 'URTH via the diboas-analytics market store',
  },
  TLT: {
    store: 'tlt',
    totalReturn: true,
    prec: 4,
    ohl: 2,
    since: '2010-07',
    unit: 'USD per share (total return in close)',
    basis: 'total_return',
    source: 'TLT via the diboas-analytics market store',
  },
  GOLD: {
    store: 'gold_spot',
    totalReturn: false,
    prec: 2,
    ohl: 2,
    since: '2010-07',
    unit: 'USD per troy ounce',
    basis: 'price_only',
    source:
      'gold spot (CNBC XAU=, checked against the LBMA PM fix) via the diboas-analytics market store',
  },
  IBOVESPA: {
    store: 'ibovespa',
    totalReturn: false,
    prec: 0,
    ohl: 0,
    since: '2010-07',
    unit: 'index points',
    basis: 'native_total_return',
    source: 'official B3 closes via the diboas-analytics market store',
  },
  DAX: {
    store: 'dax',
    totalReturn: false,
    prec: 4,
    ohl: 4,
    since: '2010-06',
    unit: 'index points',
    basis: 'native_total_return',
    source: 'DAX (Yahoo ^GDAXI daily, checked against CNBC) via the diboas-analytics market store',
  },
};

/** H.10 quotes EUR, GBP and AUD as USD per unit; the others as units per USD. */
export const FX_SERIES = {
  EUR: { store: 'fx_eur', usdPerLocal: true },
  GBP: { store: 'fx_gbp', usdPerLocal: true },
  AUD: { store: 'fx_aud', usdPerLocal: true },
  JPY: { store: 'fx_jpy', usdPerLocal: false },
  CHF: { store: 'fx_chf', usdPerLocal: false },
  CAD: { store: 'fx_cad', usdPerLocal: false },
  MXN: { store: 'fx_mxn', usdPerLocal: false },
  BRL: { store: 'fx_brl', usdPerLocal: false },
};
const FX_SINCE = '2010-01';
/** Not written here: carried as committed and named in the manifest. */
// A string, not an array: the weekly run's prettier check covers this file, and
// prettier would fold a short array onto one line that JSON.stringify spreads.
const NOT_COVERED = 'prices.BTC (appended by run.mjs --append-btc until increment 3)';
const FX_DECIMALS = 6;
const FX_SOURCE =
  'Fed H.10 noon New York rate, last business day of the month, via the diboas-analytics market store';
const FX_BASIS = 'USD_per_local & inverted local_per_USD';

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
/** A store value as a positive number: 0, a negative or a blank is refused (TOOLS-CLOSE-1). */
const num = (v, what) => {
  const n = Number(v);
  if (v === '' || v == null || !Number.isFinite(n) || n <= 0)
    throw new Error(`${what}: not a positive number`);
  return n;
};
const ymOf = (iso) => iso.slice(0, 7);

/** The last Monday-to-Friday day of a month (YYYY-MM-DD). */
export function lastWeekday(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 0));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** The last stored day of a store series (YYYY-MM-DD). */
function lastDailyDate(storeDir, id) {
  const file = path.join(storeDir, 'daily', `${id}.csv`);
  if (!fs.existsSync(file)) throw new Error(`the store has no daily/${id}.csv`);
  const lines = fs.readFileSync(file, 'utf8').trimEnd().split('\n');
  const date = lines.at(-1).split(',')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`daily/${id}.csv has no dated row`);
  return date;
}

/**
 * The latest month of a series that is complete: its last stored day is the
 * month's last weekday, or the store already holds a later day.
 */
export function lastCompleteMonth(rows, lastDay) {
  const last = rows.at(-1);
  if (last.last_day >= lastWeekday(last.ym) || ymOf(lastDay) > last.ym) return last.ym;
  return rows.at(-2)?.ym ?? null;
}

/** One store series' derived months, oldest first. */
function readMonthly(storeDir, id) {
  const file = path.join(storeDir, 'derived', 'monthly', `${id}.csv`);
  if (!fs.existsSync(file)) throw new Error(`the store has no derived/monthly/${id}.csv`);
  const rows = readCsv(file);
  if (!rows.length) throw new Error(`derived/monthly/${id}.csv is empty`);
  return rows;
}

/**
 * Build both files' series from the store (pure, given the store's files).
 *
 * @param {string} storeDir the `market/` folder of a diboas-analytics checkout
 * @param {{prices: object, fx: object}} current the committed files (BTC rows
 *   and FX placeholders are carried over from them)
 * @returns {{prices: object, fx: object, through: string}}
 */
export function buildPublication(storeDir, current) {
  const monthly = {};
  for (const s of Object.values(PRICE_SERIES)) monthly[s.store] = readMonthly(storeDir, s.store);
  for (const s of Object.values(FX_SERIES)) monthly[s.store] = readMonthly(storeDir, s.store);

  // The last month every series has complete: prices and FX are joined month by month.
  const complete = {};
  for (const id of Object.keys(monthly))
    complete[id] = lastCompleteMonth(monthly[id], lastDailyDate(storeDir, id));
  const through = Object.values(complete).sort()[0];
  if (!through) throw new Error('a store series has no complete month');
  const binding = Object.entries(complete)
    .filter(([, ym]) => ym === through)
    .map(([id]) => id);

  // Never remove a month the website already shows.
  const published = [
    ...Object.keys(PRICE_SERIES).map((k) => current.prices[k]),
    ...Object.keys(FX_SERIES).map((k) => current.fx[k]),
  ]
    .map((sr) => sr?.months?.at(-1)?.ym?.slice(0, 7))
    .filter(Boolean)
    .sort()
    .at(-1);
  if (published && through < published)
    throw new Error(
      `the store's last complete month for every series is ${through} (${binding.join(', ')}), but the website already shows ${published}; publishing would remove published months`
    );

  const prices = {};
  for (const [code, s] of Object.entries(PRICE_SERIES)) {
    const rows = monthly[s.store].filter((r) => r.ym >= s.since && r.ym <= through);
    if (rows[0]?.ym !== s.since)
      throw new Error(
        `${code}: the store starts at ${rows[0]?.ym ?? 'nothing'}, the site at ${s.since}`
      );
    const last = rows.at(-1);
    const rebase = s.totalReturn
      ? num(last.close, `${s.store} ${last.ym} close`) /
        num(last.tr_close, `${s.store} ${last.ym} tr_close`)
      : null;
    if (rebase != null && !(Number.isFinite(rebase) && rebase > 0))
      throw new Error(`${s.store} ${last.ym}: the total-return re-base is not a positive number`);
    const months = rows.map((r) => {
      const at = `${s.store} ${r.ym}`;
      const price = round(num(r.close, `${at} close`), s.prec);
      const open = round(num(r.open, `${at} open`), s.ohl);
      const high = round(num(r.high, `${at} high`), s.ohl);
      const low = round(num(r.low, `${at} low`), s.ohl);
      // A bar must hold its own open and close: the store's are consistent, so
      // this only fires on bad data. Rounding the close at more decimals than the
      // bar can put it a hair outside, so the bar widens to hold it.
      if (low > high || open < low || open > high)
        throw new Error(`${at}: the open lies outside the low/high`);
      if (price - high > 10 ** -s.ohl || low - price > 10 ** -s.ohl)
        throw new Error(`${at}: the close lies outside the low/high`);
      const row = {
        ym: `${r.ym}-01`,
        open,
        high: Math.max(high, price),
        low: Math.min(low, price),
      };
      if (s.totalReturn) {
        row.close = round(num(r.tr_close, `${at} tr_close`) * rebase, s.prec);
        row.closePriceOnly = price;
      } else row.close = price;
      return row;
    });
    prices[code] = {
      basis: s.basis,
      unit: s.unit,
      source: s.source,
      note: s.totalReturn
        ? 'close = total return computed in the store from daily closes and checked distributions (each in its ex-date month), re-based so the latest month equals its price; open/high/low/closePriceOnly are prices.'
        : 'Monthly open/high/low/close from the store’s checked daily values.',
      months,
    };
  }
  // BTC stays on its current writer until increment 3 (the score reads it).
  const out = { BTC: current.prices.BTC, ...prices };

  const fx = {};
  for (const [code, s] of Object.entries(FX_SERIES)) {
    const rows = monthly[s.store].filter((r) => r.ym >= FX_SINCE && r.ym <= through);
    if (rows[0]?.ym !== FX_SINCE)
      throw new Error(
        `${code}: the store starts at ${rows[0]?.ym ?? 'nothing'}, the site at ${FX_SINCE}`
      );
    const months = rows.map((r) => {
      const v = num(r.close, `${s.store} ${r.ym} close`);
      const usdPerLocal = s.usdPerLocal ? round(v, FX_DECIMALS) : round(1 / v, FX_DECIMALS);
      const localPerUsd = s.usdPerLocal ? round(1 / v, FX_DECIMALS) : round(v, FX_DECIMALS);
      return { ym: `${r.ym}-01`, closeUsdPerLocal: usdPerLocal, closeLocalPerUsd: localPerUsd };
    });
    fx[code] = {
      source: FX_SOURCE,
      basis: FX_BASIS,
      unit: `closeUsdPerLocal: USD per ${code}; closeLocalPerUsd: ${code} per USD`,
      note: 'month-end value (founder 2026-11-05)',
      months,
    };
  }
  // Entries the store does not hold yet keep their committed placeholders.
  for (const [code, v] of Object.entries(current.fx)) if (!(code in fx)) fx[code] = v;
  return { prices: out, fx, through, binding };
}

/**
 * One sha256 per series: what PUBLISH-1 compares (hashes only, never values).
 * Every key of both files is covered, the carried FX placeholders included, so
 * an added or edited entry shows; only BTC is left out (NOT_COVERED).
 */
export function seriesHashes({ prices, fx }) {
  const h = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
  return {
    ...Object.fromEntries(
      Object.keys(prices)
        .filter((k) => k !== 'BTC')
        .map((k) => [`prices.${k}`, h(prices[k])])
    ),
    ...Object.fromEntries(Object.keys(fx).map((k) => [`fx.${k}`, h(fx[k])])),
  };
}

/** Keys whose hashes differ between two hash maps (either side missing counts). */
const differing = (a, b) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]).sort();

/**
 * Already-published months whose values changed, per series. A total-return
 * fund is re-based to its latest price every month, which scales every close by
 * one factor and leaves returns unchanged: that alone is not counted.
 */
export function changedPublishedMonths(current, built) {
  const out = {};
  const compare = (code, oldS, newS, tr, prec) => {
    const old = new Map((oldS?.months ?? []).map((r) => [r.ym, r]));
    const both = newS.months.filter((r) => old.has(r.ym));
    if (!both.length) return;
    const factor = tr ? both[0].close / old.get(both[0].ym).close : 1;
    const tol = (x) => 1.5 * 10 ** -prec + Math.abs(x) * 1e-9;
    const changed = both
      .filter((r) => {
        const o = old.get(r.ym);
        return Object.keys(r).some((k) =>
          k === 'close' && tr ? Math.abs(r.close - o.close * factor) > tol(r.close) : r[k] !== o[k]
        );
      })
      .map((r) => r.ym.slice(0, 7));
    if (changed.length) out[code] = changed;
  };
  for (const [code, s] of Object.entries(PRICE_SERIES))
    compare(code, current.prices[code], built.prices[code], s.totalReturn, s.prec);
  for (const code of Object.keys(FX_SERIES))
    compare(code, current.fx[code], built.fx[code], false, FX_DECIMALS);
  return out;
}

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const VALUE_FLAGS = {
  '--store': 'store',
  '--store-commit': 'commit',
  '--out': 'out',
  '--report': 'report',
};

function parseArgs(argv) {
  const a = {
    store: null,
    commit: null,
    out: DATA_DIR,
    check: false,
    report: null,
    verifyManifest: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const k = argv[i];
    if (k in VALUE_FLAGS) {
      const v = argv[i + 1];
      if (v == null || v.startsWith('--')) throw new Error(`${k} needs a value`);
      a[VALUE_FLAGS[k]] = v;
      i += 1;
    } else if (k === '--check') a.check = true;
    else if (k === '--verify-manifest') a.verifyManifest = true;
    else throw new Error(`unknown argument ${k}`);
  }
  if (!a.store && !a.verifyManifest)
    throw new Error('--store <analytics market/ folder> is required');
  if (a.commit != null && !/^[0-9a-f]{40}$/.test(a.commit))
    throw new Error('--store-commit must be a full 40-character sha');
  if (a.store && !a.check && !a.verifyManifest && !a.commit)
    throw new Error(
      '--store-commit is required when writing: the manifest records the commit read'
    );
  return a;
}

/** The store checkout's HEAD, or null when the folder is not a git checkout (tests). */
function storeHead(storeDir) {
  try {
    return execFileSync('git', ['-C', storeDir, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** The month before `now` (YYYY-MM): the newest month a run could publish. */
const expectedMonth = (now) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);

/** The weekly PR body's note (plain text, no values beyond months and ids). */
function successNote(built, commit, changed, now) {
  const lines = [
    `Published through ${built.through} from the market data store (commit ${commit.slice(0, 12)}).`,
  ];
  const want = expectedMonth(now);
  if (built.through < want)
    lines.push(
      `${want} is not published yet: it is not complete in ${built.binding.join(', ')} (a month is published only when every series has it complete; H.10 exchange rates reach the store about a week late).`
    );
  const ids = Object.keys(changed);
  if (ids.length)
    lines.push(
      `Already-published months that changed (store revisions): ${ids
        .map(
          (k) =>
            `${k} ${changed[k].length} (${changed[k].slice(0, 3).join(', ')}${changed[k].length > 3 ? ', …' : ''})`
        )
        .join('; ')}. The old → new values are in this PR's diff.`
    );
  return `${lines.join('\n\n')}\n`;
}

/** @param {string[]} argv */
export function main(argv = process.argv.slice(2), now = new Date()) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const pricesFile = path.join(args.out, 'monthlyPrices.json');
  const fxFile = path.join(args.out, 'monthlyFx.json');
  const manifestFile = path.join(args.out, 'store-manifest.json');
  const refuse = (why) => {
    const msg = `the Money Tools series were not updated: ${why}`;
    console.error(msg);
    if (args.report) writeFileAtomic(args.report, `${msg}\n`);
    return 3;
  };
  if (args.verifyManifest) {
    const manifest = readJson(manifestFile);
    const committed = seriesHashes({ prices: readJson(pricesFile), fx: readJson(fxFile) });
    const differ = differing(committed, manifest.series ?? {});
    if (differ.length) {
      console.error(
        `PUBLISH-1: ${differ.length} published series no longer match store-manifest.json (edited outside publish.mjs?): ${differ.join(', ')}`
      );
      return 1;
    }
    console.log(
      `PUBLISH-1: all ${Object.keys(committed).length} published series match store-manifest.json (store ${String(manifest.store_commit).slice(0, 12)}, through ${manifest.through})`
    );
    return 0;
  }
  const storeDir = path.resolve(args.store);
  const current = { prices: readJson(pricesFile), fx: readJson(fxFile) };
  const head = storeHead(storeDir);
  if (head && args.commit && head !== args.commit)
    return refuse(`the store checkout is at ${head.slice(0, 12)}, not ${args.commit.slice(0, 12)}`);
  let built;
  try {
    built = buildPublication(storeDir, current);
  } catch (e) {
    return refuse(e.message);
  }
  const hashes = seriesHashes(built);
  if (args.check) {
    const differ = differing(hashes, seriesHashes(current));
    if (differ.length) {
      console.error(
        `PUBLISH-1: ${differ.length} series differ from what the store produces (through ${built.through}): ${differ.join(', ')}`
      );
      return 1;
    }
    console.log(
      `PUBLISH-1: all ${Object.keys(hashes).length} series match the store (through ${built.through})`
    );
    return 0;
  }
  const changed = changedPublishedMonths(current, built);
  try {
    const manifest = {
      _comment:
        'Written by apps/web/scripts/market-data/publish.mjs. One sha256 per series; PUBLISH-1 rebuilds them from the store at this commit.',
      store_commit: args.commit,
      published_at: now.toISOString(),
      methodology_version: readJson(METHODOLOGY).version ?? null,
      through: built.through,
      not_covered: NOT_COVERED,
      series: hashes,
    };
    writeJsonAtomic(pricesFile, built.prices);
    writeJsonAtomic(fxFile, built.fx);
    writeJsonAtomic(manifestFile, manifest);
  } catch (e) {
    // Prices may be written and FX not: --verify-manifest fails the PR, and
    // this report says why.
    return refuse(`writing the files failed part-way (${e.message}); CI will flag the mismatch`);
  }
  if (args.report) writeFileAtomic(args.report, successNote(built, args.commit, changed, now));
  console.log(`published the Money Tools series from the store, through ${built.through}`);
  return 0;
}

if (isDirectInvocation(import.meta.url)) process.exit(main());
