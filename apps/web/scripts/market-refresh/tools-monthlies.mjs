#!/usr/bin/env node
/**
 * tools-monthlies.mjs — the F-M8 monthly leg of the market-refresh pipeline
 * (P3, plan §B Stage 4: "one pipeline, two cadences").
 *
 * Appends the expected-confirmed month for the 7 non-BTC price series
 * (SPY/QQQ/URTH/GLD/TLT/^BVSP/^GDAXI → monthlyPrices.json) and the FX series
 * (ECB EUR + crosses, BCB PTAX BRL → monthlyFx.json), with the SAME quality
 * discipline that caught the 2026-05-23 partial-candle incident:
 *
 *   - closed candles only (append month M only on/after the 1st of M+1);
 *   - the +12h month-boundary shift that prevents the ^GDAXI CEST mislabel;
 *   - OHLC sanity + dedup + strict-monotonic-ym guards;
 *   - per-series shape (adjusted-close total-return vs price-only) preserved
 *     exactly as the existing rows (see SERIES_SHAPES).
 *
 *   node tools-monthlies.mjs            — append the due month where missing
 *   node tools-monthlies.mjs --check    — report what WOULD append; exit 1 if
 *                                         a due month is missing (CI freshness)
 *
 * Idempotent: a month already present is skipped. Cross-source verification
 * for the equity/ETF closes stays a manual Alpha-Vantage spot-check per the
 * runbook (documented); this script automates the fetch+append+shape+guard.
 */

import fs from 'node:fs';
import path from 'node:path';
import { expectedConfirmedMonthYM } from './lib/regime-engine.mjs';
import { fetchYahooMonthlyBars } from './providers/yahoo.mjs';
import { assertOhlcBar } from './lib/quality-gate.mjs';
import { REPO_ROOT } from './providers/inrepo.mjs';

const PRICES_PATH = path.join(REPO_ROOT, 'apps/web/src/lib/market-data/data/monthlyPrices.json');
// FX (monthlyFx.json) append via ECB/PTAX stays the runbook's manual step this
// cycle — see the closing NOTE. Equity/ETF price appends are automated below.
const TODAY = new Date();

// series key → { yahoo ticker, adjClose (total-return), rounding }
const SERIES_SHAPES = {
  SP500: { ticker: 'SPY', adjClose: true, prec: 4, ohl: 2 },
  QQQ: { ticker: 'QQQ', adjClose: true, prec: 4, ohl: 2 },
  MSCI_WORLD: { ticker: 'URTH', adjClose: true, prec: 2, ohl: 2 },
  GOLD: { ticker: 'GLD', adjClose: false, prec: 2, ohl: 2 },
  TLT: { ticker: 'TLT', adjClose: true, prec: 4, ohl: 2 },
  IBOVESPA: { ticker: '^BVSP', adjClose: false, prec: 0, ohl: 0 },
  DAX: { ticker: '^GDAXI', adjClose: false, prec: 4, ohl: 4 },
};

const round = (x, d) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

function buildRow(code, bar) {
  const s = SERIES_SHAPES[code];
  const row = {
    ym: bar.ym,
    open: round(bar.open, s.ohl),
    high: round(bar.high, s.ohl),
    low: round(bar.low, s.ohl),
  };
  if (s.adjClose) {
    row.close = round(bar.adjclose, s.prec);
    row.closePriceOnly = round(bar.close, s.prec);
  } else {
    row.close = round(bar.close, s.prec);
  }
  return row;
}

async function appendPriceMonths(expectedYm, check) {
  const prices = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));
  const planned = [];
  for (const [code, shape] of Object.entries(SERIES_SHAPES)) {
    const months = prices[code].months;
    if (months.some((m) => m.ym === expectedYm)) continue; // idempotent
    const { bars } = await fetchYahooMonthlyBars(shape.ticker, '2y');
    const bar = bars.get(expectedYm);
    if (!bar) {
      console.log(`  ${code}: Yahoo has no closed ${expectedYm} bar yet — skipping`);
      continue;
    }
    assertOhlcBar(`${code} ${expectedYm}`, bar);
    const last = months[months.length - 1];
    if (last && last.ym >= expectedYm)
      throw new Error(`${code}: ${expectedYm} not after ${last.ym}`);
    const row = buildRow(code, bar);
    planned.push({ code, row });
    if (!check) months.push(row);
  }
  if (!check && planned.length)
    fs.writeFileSync(PRICES_PATH, JSON.stringify(prices, null, 2) + '\n');
  return planned;
}

const checkMode = process.argv.includes('--check');
const expectedYm = expectedConfirmedMonthYM(TODAY);

console.log(
  `\n=== tools-monthlies (F-M8) — ${checkMode ? 'CHECK' : 'APPEND'} · expected month ${expectedYm} ===`
);
const planned = await appendPriceMonths(expectedYm, checkMode);
if (!planned.length) {
  console.log(`  all price series already carry ${expectedYm} — nothing to do.\n`);
} else {
  for (const p of planned)
    console.log(
      `  ${checkMode ? 'MISSING' : 'appended'} ${p.code} ${expectedYm} close ${p.row.close}`
    );
  console.log(
    `\n  NOTE: FX (ECB EUR+crosses, BCB PTAX BRL) + the Alpha-Vantage cross-check are the` +
      `\n  runbook's manual step this cycle — automate in a follow-up; equity/ETF appends are gated above.\n`
  );
}

if (checkMode && planned.length) {
  console.error(
    `✖ ${planned.length} price series missing ${expectedYm} — run tools-monthlies.mjs\n`
  );
  process.exit(1);
}
