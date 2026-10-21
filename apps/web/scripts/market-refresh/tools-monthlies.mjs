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
import { isDirectInvocation } from './lib/invocation.mjs';
import { writeJsonAtomic } from './lib/atomic.mjs';
import { assertNextMonth, expectedConfirmedMonthYM, nextMonthYM } from './lib/regime-engine.mjs';
import { fetchYahooMonthlyBars } from './providers/yahoo.mjs';
import { assertOhlcBar } from './lib/quality-gate.mjs';
import { MONTHLY_PRICES_PATH } from './providers/inrepo.mjs';

const PRICES_PATH = MONTHLY_PRICES_PATH;
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

/**
 * Append (or, with `check`, only plan) the due month for every price series.
 * Returns what was planned and which series Yahoo had no closed bar for yet
 * (2026-10-21, review gate: those were skipped silently and the run reported
 * "nothing to do").
 *
 * @returns {Promise<{planned: {code: string, row: object}[], missing: string[]}>}
 */
export async function appendPriceMonths(
  expectedYm,
  check,
  { fetchBars = fetchYahooMonthlyBars, pricesPath = PRICES_PATH } = {}
) {
  const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
  const planned = [];
  const missing = [];
  for (const [code, shape] of Object.entries(SERIES_SHAPES)) {
    const months = prices[code].months;
    if (months.some((m) => m.ym === expectedYm)) continue; // idempotent
    const { bars } = await fetchBars(shape.ticker, '2y');
    // Every month from the one after the last row up to the due month, oldest
    // first (2026-10-21, final audit): a month nobody appended in time is
    // backfilled from the same fetch, with the same checks, instead of
    // leaving a hole or stopping the whole run. If Yahoo lacks a month on the
    // way, the series keeps what precedes it and is reported as missing.
    let ym = months.length ? nextMonthYM(months[months.length - 1].ym) : expectedYm;
    while (ym <= expectedYm) {
      const bar = bars.get(ym);
      if (!bar) {
        console.log(`  ${code}: Yahoo has no closed ${ym} bar yet — stopping this series there`);
        missing.push(code);
        break;
      }
      assertOhlcBar(`${code} ${ym}`, bar);
      assertNextMonth(code, months[months.length - 1]?.ym, ym);
      const row = buildRow(code, bar);
      planned.push({ code, row });
      months.push(row); // the working copy; written to disk only when !check
      ym = nextMonthYM(ym);
    }
  }
  if (!check && planned.length)
    // 5.302: temp + rename — this file also backs the Money Tools calculators.
    writeJsonAtomic(pricesPath, prices);
  return { planned, missing };
}

/**
 * What the run reports and how it exits. A series still missing its due month
 * is never "nothing to do": it is a warning in an append run, and a failure in
 * `--check` mode, as this script's header promises.
 */
export function toolsMonthliesOutcome({ planned, missing, check, expectedYm }) {
  const warnings = missing.length
    ? [`${missing.join(', ')}: no closed ${expectedYm} bar yet — the month is still missing`]
    : [];
  return {
    nothingToDo: planned.length === 0 && missing.length === 0,
    warnings,
    exitCode: check && (planned.length > 0 || missing.length > 0) ? 1 : 0,
  };
}

// Run ONLY when invoked directly: importing a writing script must be a no-op.
// Why, and the two footguns in the obvious implementation: lib/invocation.mjs.
if (isDirectInvocation(import.meta.url)) {
  const checkMode = process.argv.includes('--check');
  const expectedYm = expectedConfirmedMonthYM(TODAY);

  console.log(
    `\n=== tools-monthlies (F-M8) — ${checkMode ? 'CHECK' : 'APPEND'} · expected month ${expectedYm} ===`
  );
  const { planned, missing } = await appendPriceMonths(expectedYm, checkMode);
  const outcome = toolsMonthliesOutcome({ planned, missing, check: checkMode, expectedYm });
  for (const w of outcome.warnings) {
    console.log(`${process.env.GITHUB_ACTIONS ? '::warning::' : '  ⚠ '}${w}`);
  }
  if (outcome.nothingToDo) {
    console.log(`  all price series already carry ${expectedYm} — nothing to do.\n`);
  } else if (planned.length) {
    for (const p of planned)
      console.log(
        `  ${checkMode ? 'MISSING' : 'appended'} ${p.code} ${p.row.ym} close ${p.row.close}`
      );
    console.log(
      `\n  NOTE: FX (ECB EUR+crosses, BCB PTAX BRL) + the Alpha-Vantage cross-check are the` +
        `\n  runbook's manual step this cycle — automate in a follow-up; equity/ETF appends are gated above.\n`
    );
  }

  if (outcome.exitCode) {
    console.error(
      `✖ ${planned.length + missing.length} price series missing ${expectedYm}` +
        `${planned.length ? ' — run tools-monthlies.mjs' : ''}${missing.length ? ` (no bar yet: ${missing.join(', ')})` : ''}\n`
    );
    process.exit(outcome.exitCode);
  }
}
