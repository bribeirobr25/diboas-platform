#!/usr/bin/env node
/**
 * publish.mjs — write the Money Tools' monthly series FROM the market data
 * store (plan 5.760, increment 2; founder rulings 2026-11-04/05).
 *
 *   node apps/web/scripts/market-data/publish.mjs --store <analytics market/ dir>
 *        [--store-commit <sha>] [--out <data dir>] [--check] [--report <file>]
 *   node apps/web/scripts/market-data/publish.mjs --verify-manifest [--out <data dir>]
 *        (no store needed: the committed series must match store-manifest.json;
 *        run on every PR, so a hand edit of a published series fails CI)
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
 *   - a month is published only when EVERY series written here has it, prices
 *     and FX alike, so no tool joins a price to a missing rate (5.479);
 *   - each series keeps the first month it has on the website today, so no
 *     tool's start point moves;
 *   - a total-return fund's `close` is the store's total-return index,
 *     re-based so its latest month equals its price (`closePriceOnly`);
 *   - the output depends only on the store's contents: `--check` rebuilds
 *     everything and compares series by hash, which is how PUBLISH-1 proves
 *     that nobody edited a published series by hand;
 *   - `store-manifest.json` records the store commit read and one sha256 per
 *     series (never a value: the CI logs are public).
 *
 * Exit codes: 0 = written (or, with --check, nothing differs); 1 = --check
 * found a difference; 2 = bad arguments; 3 = the store could not be read
 * (nothing is written).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectInvocation } from '../market-refresh/lib/invocation.mjs';
import { writeFileAtomic, writeJsonAtomic } from '../market-refresh/lib/atomic.mjs';
import { readCsv } from './store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
export const DATA_DIR = path.join(ROOT, 'apps/web/src/lib/market-data/data');

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
const FX_DECIMALS = 6;
const FX_SOURCE =
  'Fed H.10 noon New York rate, last business day of the month, via the diboas-analytics market store';
const FX_BASIS = 'USD_per_local & inverted local_per_USD';

const round = (x, d) => Math.round(x * 10 ** d) / 10 ** d;
const num = (v, what) => {
  const n = Number(v);
  if (v === '' || v == null || !Number.isFinite(n)) throw new Error(`${what}: not a number (${v})`);
  return n;
};

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

  // The last month every series has: prices and FX are joined month by month.
  const through = Object.values(monthly)
    .map((rows) => rows.at(-1).ym)
    .sort()[0];

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
    const months = rows.map((r) => {
      const at = `${s.store} ${r.ym}`;
      const close = num(r.close, `${at} close`);
      const row = {
        ym: `${r.ym}-01`,
        open: round(num(r.open, `${at} open`), s.ohl),
        high: round(num(r.high, `${at} high`), s.ohl),
        low: round(num(r.low, `${at} low`), s.ohl),
      };
      if (s.totalReturn) {
        row.close = round(num(r.tr_close, `${at} tr_close`) * rebase, s.prec);
        row.closePriceOnly = round(close, s.prec);
      } else row.close = round(close, s.prec);
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
    const months = monthly[s.store]
      .filter((r) => r.ym <= through)
      .map((r) => {
        const v = num(r.close, `${s.store} ${r.ym} close`);
        const usdPerLocal = s.usdPerLocal ? round(v, FX_DECIMALS) : round(1 / v, FX_DECIMALS);
        const localPerUsd = s.usdPerLocal ? round(1 / v, FX_DECIMALS) : round(v, FX_DECIMALS);
        return { ym: `${r.ym}-01`, closeUsdPerLocal: usdPerLocal, closeLocalPerUsd: localPerUsd };
      });
    fx[code] = {
      source: FX_SOURCE,
      basis: FX_BASIS,
      note: 'month-end value (founder 2026-11-05)',
      months,
    };
  }
  // Entries the store does not hold yet keep their committed placeholders.
  for (const [code, v] of Object.entries(current.fx)) if (!(code in fx)) fx[code] = v;
  return { prices: out, fx, through };
}

/** One sha256 per written series: what PUBLISH-1 compares (hashes only, never values). */
export function seriesHashes({ prices, fx }) {
  const h = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
  return {
    ...Object.fromEntries(Object.keys(PRICE_SERIES).map((k) => [`prices.${k}`, h(prices[k])])),
    ...Object.fromEntries(Object.keys(FX_SERIES).map((k) => [`fx.${k}`, h(fx[k])])),
  };
}

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

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
    if (k === '--store') a.store = argv[++i];
    else if (k === '--store-commit') a.commit = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--check') a.check = true;
    else if (k === '--report') a.report = argv[++i];
    else if (k === '--verify-manifest') a.verifyManifest = true;
    else throw new Error(`unknown argument ${k}`);
  }
  if (!a.store && !a.verifyManifest)
    throw new Error('--store <analytics market/ folder> is required');
  if (a.commit != null && !/^[0-9a-f]{40}$/.test(a.commit))
    throw new Error('--store-commit must be a full 40-character sha');
  return a;
}

/** @param {string[]} argv */
export function main(argv = process.argv.slice(2)) {
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
  if (args.verifyManifest) {
    const manifest = readJson(manifestFile);
    const committed = seriesHashes({ prices: readJson(pricesFile), fx: readJson(fxFile) });
    const keys = new Set([...Object.keys(committed), ...Object.keys(manifest.series ?? {})]);
    const differ = [...keys].filter((k) => committed[k] !== manifest.series?.[k]);
    if (differ.length) {
      console.error(
        `PUBLISH-1: ${differ.length} published series no longer match store-manifest.json (edited outside publish.mjs?): ${differ.join(', ')}`
      );
      return 1;
    }
    console.log(
      `PUBLISH-1: all ${keys.size} published series match store-manifest.json (store ${manifest.store_commit?.slice(0, 12)}, through ${manifest.through})`
    );
    return 0;
  }
  let built;
  try {
    built = buildPublication(path.resolve(args.store), {
      prices: readJson(pricesFile),
      fx: readJson(fxFile),
    });
  } catch (e) {
    const why = `the Money Tools series were not updated: ${e.message}`;
    console.error(why);
    if (args.report) writeFileAtomic(args.report, `${why}\n`);
    return 3;
  }
  const hashes = seriesHashes(built);
  if (args.check) {
    const committed = seriesHashes({ prices: readJson(pricesFile), fx: readJson(fxFile) });
    const differ = Object.keys(hashes).filter((k) => hashes[k] !== committed[k]);
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
  writeJsonAtomic(pricesFile, built.prices);
  writeJsonAtomic(fxFile, built.fx);
  writeJsonAtomic(manifestFile, {
    _comment:
      'Written by apps/web/scripts/market-data/publish.mjs. One sha256 per series it owns; PUBLISH-1 rebuilds them from the store at this commit.',
    store_commit: args.commit,
    through: built.through,
    series: hashes,
  });
  if (args.report) writeFileAtomic(args.report, '');
  console.log(`published the Money Tools series from the store, through ${built.through}`);
  return 0;
}

if (isDirectInvocation(import.meta.url)) process.exit(main());
