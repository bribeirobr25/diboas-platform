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
import { writeFileAtomic, writeJsonAtomic } from './lib/atomic.mjs';
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

/**
 * The close a series stores (the adjusted close for a total-return series), or
 * null when the bar does not carry a usable one (5.627). `assertOhlcBar`
 * checks the price-only close; a total-return series stores `adjclose`, and a
 * missing one used to round to 0 and land in the file the Money Tools read.
 *
 * @param {{adjClose: boolean}} shape
 * @param {{close: number, adjclose: number|null}} bar
 * @returns {number|null}
 */
export function storedClose(shape, bar) {
  const v = shape.adjClose ? bar.adjclose : bar.close;
  return Number.isFinite(v) && v > 0 ? v : null;
}

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
 * A series that could not be read or failed a check is in `failed` (C1c).
 *
 * @returns {Promise<{planned: {code: string, row: object}[], missing: string[], failed: {code: string, reason: string}[]}>}
 */
export async function appendPriceMonths(
  expectedYm,
  check,
  { fetchBars = fetchYahooMonthlyBars, pricesPath = PRICES_PATH } = {}
) {
  const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
  const planned = [];
  const missing = [];
  /** @type {{ code: string, reason: string }[]} */
  const failed = [];
  for (const [code, shape] of Object.entries(SERIES_SHAPES)) {
    const months = prices[code].months;
    if (months.some((m) => m.ym === expectedYm)) continue; // idempotent
    // C1c (2026-10-21, owner-approved): one series' failure (a Yahoo error, a
    // timeout, a bar that fails its checks) is that series' failure, never
    // the weekly run's. It keeps the rows it has, including any earlier month
    // this run already appended and checked; the others still update, and
    // the failure is reported. These series feed the Money Tools only.
    try {
      await appendSeries(code, shape, months, expectedYm, fetchBars, planned, missing);
    } catch (err) {
      failed.push({ code, reason: oneLine(err) });
    }
  }
  if (!check && planned.length)
    // 5.302: temp + rename — this file also backs the Money Tools calculators.
    writeJsonAtomic(pricesPath, prices);
  return { planned, missing, failed };
}

/** An error as one short line, safe to place in a PR body. */
function oneLine(err) {
  const text = err instanceof Error ? err.message : String(err);
  return text
    .replace(/[\r\n`]+/g, ' ')
    .trim()
    .slice(0, 200);
}

/** One series: append every month after its last row up to the due month. */
async function appendSeries(code, shape, months, expectedYm, fetchBars, planned, missing) {
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
    // 5.627 (founder point 3, 2026-10-19): a required month whose stored close
    // is missing or invalid is NOT a month the source allows appending. It
    // fails this series (C1c: reported, nothing written for it from here on;
    // months this run already appended before it stay), and `--check` fails.
    if (storedClose(shape, bar) === null) {
      throw new Error(
        `${ym} bar has no usable ${shape.adjClose ? 'adjusted ' : ''}close (got ${shape.adjClose ? bar.adjclose : bar.close})`
      );
    }
    assertNextMonth(code, months[months.length - 1]?.ym, ym);
    const row = buildRow(code, bar);
    planned.push({ code, row });
    months.push(row); // the working copy; written to disk only when !check
    ym = nextMonthYM(ym);
  }
}

/**
 * What the run reports and how it exits. A series still missing its due month
 * is never "nothing to do": it is a warning in an append run, and a failure in
 * `--check` mode, as this script's header promises.
 */
/**
 * @param {{ planned: object[], missing: string[], failed?: {code: string, reason: string}[], check: boolean, expectedYm: string }} io
 */
export function toolsMonthliesOutcome({ planned, missing, failed = [], check, expectedYm }) {
  const warnings = [
    ...(missing.length
      ? [`${missing.join(', ')}: no closed ${expectedYm} bar yet — the month is still missing`]
      : []),
    ...failed.map((f) => `${f.code}: not updated this run (${f.reason})`),
  ];
  const incomplete = planned.length > 0 || missing.length > 0 || failed.length > 0;
  return {
    nothingToDo: !incomplete,
    warnings,
    // An append run always lets the weekly run continue (C1c); `--check`
    // fails while any series is behind or could not be read.
    exitCode: check && incomplete ? 1 : 0,
  };
}

/**
 * The note for the weekly PR body: '' when every series is current or was
 * updated; otherwise one line per series still behind, so a lagging series is
 * visible every week until it is fixed.
 */
/** @param {{ missing: string[], failed?: {code: string, reason: string}[], expectedYm: string }} io */
export function toolsReport({ missing, failed = [], expectedYm }) {
  const lines = [
    ...missing.map((code) => `- ${code}: Yahoo has no closed ${expectedYm} bar yet`),
    ...failed.map((f) => `- ${f.code}: not updated this run (${f.reason})`),
  ];
  return lines.length
    ? `Money Tools monthly prices are behind for ${missing.length + failed.length} series (they do not feed the /market score):\n${lines.join('\n')}\n`
    : '';
}

// Run ONLY when invoked directly: importing a writing script must be a no-op.
// Why, and the two footguns in the obvious implementation: lib/invocation.mjs.
if (isDirectInvocation(import.meta.url)) {
  const checkMode = process.argv.includes('--check');
  const expectedYm = expectedConfirmedMonthYM(TODAY);

  console.log(
    `\n=== tools-monthlies (F-M8) — ${checkMode ? 'CHECK' : 'APPEND'} · expected month ${expectedYm} ===`
  );
  const { planned, missing, failed } = await appendPriceMonths(expectedYm, checkMode);
  const outcome = toolsMonthliesOutcome({
    planned,
    missing,
    failed,
    check: checkMode,
    expectedYm,
  });
  const reportAt = process.argv.indexOf('--report');
  if (reportAt > 0 && process.argv[reportAt + 1]) {
    writeFileAtomic(process.argv[reportAt + 1], toolsReport({ missing, failed, expectedYm }));
  }
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
      `✖ ${planned.length + missing.length + failed.length} price series missing ${expectedYm}` +
        `${planned.length ? ' — run tools-monthlies.mjs' : ''}${missing.length ? ` (no bar yet: ${missing.join(', ')})` : ''}` +
        `${failed.length ? ` (could not be read: ${failed.map((f) => f.code).join(', ')})` : ''}\n`
    );
    process.exit(outcome.exitCode);
  }
}
