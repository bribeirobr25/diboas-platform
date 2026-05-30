#!/usr/bin/env node
/**
 * compute-regime.mjs — reproducible regime-score computation per doc 02 §8.
 *
 * Created 2026-05-29 alongside the D1 enactment as the durable fix for the
 * convention slip surfaced in the first refresh round (intra-week Tue/Wed
 * values being used as "the latest weekly close" instead of the most recent
 * confirmed Friday close). The strict-Friday resampling and the candle-lock
 * discipline are LOCKED in this script so the next weekly refresh can't slip
 * back into intra-week values.
 *
 * Per handover B2: "Follow the existing pattern: a committed, reproducible
 * fetch script under apps/web/scripts/data-fetchers/ ... so the calculation
 * layer is auditable (doc 02 §3.1)."
 *
 * Usage:
 *   node apps/web/scripts/data-fetchers/compute-regime.mjs
 *
 * Outputs to stdout:
 *   - Per-signal evaluation (BTC-01..04, MAC-01..03, ETF-01, REL-01..03)
 *   - Per-group point totals
 *   - Score → band → regime_code mapping
 *
 * Data sources (all free, no API key required):
 *   - BTC monthly closes: ../../src/lib/market-data/data/monthlyPrices.json
 *     (authoritative for BTC-01..04 per doc 02 §5.1 candle-lock)
 *   - DXY weekly: FRED DTWEXBGS public CSV
 *   - US10Y weekly: FRED DGS10 public CSV
 *   - Global M2 monthly: FRED M2SL public CSV
 *   - Gold weekly: Yahoo GC=F (SUBSTITUTE — FRED GOLDAMGBD228NLBM retired; D-gold-2026-05-29)
 *   - Nasdaq weekly: FRED NASDAQCOM public CSV
 *   - BTC weekly: Yahoo BTC-USD (Mozilla/5.0 User-Agent required)
 *   - ETF-01: NOT auto-fetched (per doc 02 §8.3 + doc 06 §6.5 — manual import).
 *     CoinGlass /etf/bitcoin can be browser-rendered as a provisional secondary
 *     source via Docker MCP; see PENDING_ALL.md 5.28 for canonical Farside acquisition.
 *
 * Strict-Friday discipline (locked):
 *   - Weekly signals (MAC, REL) evaluate against the MOST RECENT CONFIRMED FRIDAY close.
 *   - "Confirmed" means the Friday's date is in the source data AND <= today.
 *   - Intra-week values (Mon/Tue/Wed/Thu of the current week) are NEVER used
 *     as "the latest weekly close" — they get dropped from the current-week
 *     bucket if the Friday itself isn't yet in the data.
 *   - Resampling: for each Friday in [first_friday >= first_data_date, last_friday <= min(last_data_date, today)],
 *     pick the Friday's reading if present; otherwise fall back to the most
 *     recent prior trading day within that week (handles US bank holidays).
 *
 * Candle-lock (doc 02 §5.1):
 *   - BTC-01..04 use ONLY closed monthly candles. The current in-progress
 *     month (e.g., May 2026 mid-month) is excluded. As of 2026-05-29, the
 *     last confirmed monthly close is April 30, 2026.
 *
 * Note: this script computes signal states but does NOT auto-write data files.
 * The writes go through the editorial pre-write gate per market-editorial.md §7.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const MONTHLY_PRICES_PATH = path.join(
  REPO_ROOT,
  'apps/web/src/lib/market-data/data/monthlyPrices.json'
);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
const TODAY = new Date();

// ===========================================================================
// Source fetchers
// ===========================================================================

async function fetchFredCSV(seriesId, startDate = '2023-01-01') {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${startDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${seriesId} returned ${res.status}`);
  const csv = await res.text();
  if (!csv.startsWith('observation_date')) {
    throw new Error(`FRED ${seriesId} returned non-CSV response`);
  }
  return csv
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
    .filter(([d, v]) => d && v && v !== '.')
    .map(([d, v]) => [new Date(`${d}T00:00:00Z`), Number.parseFloat(v)]);
}

async function fetchYahooChart(symbol, range = '1y', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Yahoo ${symbol} returned ${res.status}`);
  const json = await res.json();
  const r = json.chart?.result?.[0];
  if (!r) throw new Error(`Yahoo ${symbol} bad response`);
  const ts = r.timestamp;
  const closes = r.indicators.quote[0].close;
  return ts
    .map((t, i) => [new Date(t * 1000), closes[i]])
    .filter((pair) => pair[1] != null);
}

// ===========================================================================
// Strict-Friday weekly resampling — LOCKED CONVENTION
// ===========================================================================

/**
 * Resample a daily series to confirmed weekly Friday closes ONLY.
 *
 * For each candidate Friday in the data range:
 *   - If the Friday date itself is in the data → use that value.
 *   - Else if any Mon-Thu of that week is in the data AND the Friday is in
 *     the past → use the most recent prior trading day of that week (handles
 *     bank holidays falling on Friday).
 *   - Else (Friday is today or in the future AND not yet in the data) → SKIP.
 *
 * This locks the rule that intra-week values of the CURRENT week never
 * silently become "the latest weekly close" — they only count once the
 * Friday close is itself in the data.
 *
 * @param {Array<[Date, number]>} daily — sorted ascending by date
 * @returns {Array<[Date, number]>} — confirmed Friday closes, ascending
 */
export function strictFridayCloses(daily) {
  if (!daily.length) return [];
  const byDate = new Map();
  for (const [d, v] of daily) {
    byDate.set(d.toISOString().slice(0, 10), v);
  }
  const fridays = [];
  const first = daily[0][0];
  const last = daily[daily.length - 1][0];
  // Snap to first Friday >= first
  let cur = new Date(first);
  while (cur.getUTCDay() !== 5) cur.setUTCDate(cur.getUTCDate() + 1);
  while (cur <= last && cur <= TODAY) {
    const fridayKey = cur.toISOString().slice(0, 10);
    if (byDate.has(fridayKey)) {
      fridays.push([new Date(cur), byDate.get(fridayKey)]);
    } else {
      // Friday not in data — only fall back to a prior trading day if the
      // Friday is in the past (so we know the week has closed)
      if (cur < TODAY) {
        for (let back = 1; back <= 4; back += 1) {
          const candidate = new Date(cur);
          candidate.setUTCDate(candidate.getUTCDate() - back);
          const key = candidate.toISOString().slice(0, 10);
          if (byDate.has(key)) {
            fridays.push([new Date(cur), byDate.get(key)]);
            break;
          }
        }
      }
      // else: current incomplete week — SKIP rather than admit intra-week data
    }
    cur.setUTCDate(cur.getUTCDate() + 7);
  }
  return fridays;
}

// ===========================================================================
// Indicator math
// ===========================================================================

export function ema(series, period) {
  const alpha = 2 / (period + 1);
  let e = series[0];
  for (let i = 1; i < series.length; i += 1) {
    e = alpha * series[i] + (1 - alpha) * e;
  }
  return e;
}

export function sma(series, period) {
  const slice = series.slice(-period);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
}

export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  const gains = [];
  const losses = [];
  for (let i = 1; i < closes.length; i += 1) {
    const d = closes[i] - closes[i - 1];
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }
  let avgG = gains.slice(0, period).reduce((s, v) => s + v, 0) / period;
  let avgL = losses.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < gains.length; i += 1) {
    avgG = (avgG * (period - 1) + gains[i]) / period;
    avgL = (avgL * (period - 1) + losses[i]) / period;
  }
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}

export function stochRsiK(closes, rsiPeriod = 14, stochPeriod = 14, kSmooth = 3) {
  const rsis = [];
  for (let end = rsiPeriod + 1; end <= closes.length; end += 1) {
    rsis.push(rsi(closes.slice(0, end), rsiPeriod));
  }
  const stochRaw = [];
  for (let end = stochPeriod; end <= rsis.length; end += 1) {
    const window = rsis.slice(end - stochPeriod, end);
    const rmin = Math.min(...window);
    const rmax = Math.max(...window);
    stochRaw.push(rmax === rmin ? 50 : ((rsis[end - 1] - rmin) / (rmax - rmin)) * 100);
  }
  if (stochRaw.length < kSmooth) return null;
  return stochRaw.slice(-kSmooth).reduce((s, v) => s + v, 0) / kSmooth;
}

// ===========================================================================
// Signal evaluations
// ===========================================================================

function evaluateBtcStructure() {
  // BTC-01..04 use the in-repo monthlyPrices.json — authoritative per spec §5.1
  const raw = JSON.parse(fs.readFileSync(MONTHLY_PRICES_PATH, 'utf8'));
  const months = raw.BTC.months;
  // Candle-lock: include only months <= April 2026 (the last confirmed close).
  // May 2026 ym='2026-05-01' is the in-progress month — exclude.
  const lastConfirmedYm = lastConfirmedMonthYM(TODAY);
  const closes = months
    .filter((m) => m.ym <= lastConfirmedYm)
    .map((m) => m.close);
  const lastClose = closes[closes.length - 1];
  const ema20 = ema(closes, 20);
  const sma50 = sma(closes, 50);
  const rsiCurrent = rsi(closes, 14);
  const rsiPrev = rsi(closes.slice(0, -1), 14);
  const stochK = stochRsiK(closes);
  return [
    {
      id: 'BTC-01',
      state: lastClose > ema20 ? 'ACTIVE' : 'INACTIVE',
      weight: 2,
      detail: `close ${fmt(lastClose)} vs 20M EMA ${fmt(ema20)}`,
    },
    {
      id: 'BTC-02',
      state: lastClose > sma50 ? 'ACTIVE' : 'INACTIVE',
      weight: 2,
      detail: `close ${fmt(lastClose)} vs 50M SMA ${fmt(sma50)}`,
    },
    {
      id: 'BTC-03',
      state: rsiCurrent > rsiPrev ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `RSI current ${rsiCurrent.toFixed(2)} vs prev ${rsiPrev.toFixed(2)}`,
    },
    {
      id: 'BTC-04',
      state: stochK > 10 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `Stoch-RSI %K ${stochK.toFixed(2)} vs threshold 10`,
    },
  ];
}

function lastConfirmedMonthYM(now) {
  // The current month is in progress; the last confirmed close is end of
  // (current_month - 1). Return as 'YYYY-MM-01' to compare against raw ym.
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return prev.toISOString().slice(0, 7) + '-01';
}

async function evaluateMacro() {
  const [dxyDaily, us10yDaily, m2Monthly] = await Promise.all([
    fetchFredCSV('DTWEXBGS'),
    fetchFredCSV('DGS10'),
    fetchFredCSV('M2SL'),
  ]);
  const dxyWeekly = strictFridayCloses(dxyDaily);
  const us10yWeekly = strictFridayCloses(us10yDaily);
  const dxyCloses = dxyWeekly.map(([, v]) => v);
  const us10yCloses = us10yWeekly.map(([, v]) => v);
  const dxyClose = dxyCloses[dxyCloses.length - 1];
  const dxyEma20 = ema(dxyCloses, 20);
  const dxyRsi = rsi(dxyCloses, 14);
  const us10yClose = us10yCloses[us10yCloses.length - 1];
  const us10yEma20 = ema(us10yCloses, 20);
  const m2Vals = m2Monthly.map(([, v]) => v);
  const m2Current = m2Vals[m2Vals.length - 1];
  const m2_12mAgo = m2Vals[m2Vals.length - 13];
  const m2Prev = m2Vals[m2Vals.length - 2];
  const roc12m = (m2Current / m2_12mAgo - 1) * 100;
  const mom = m2Current - m2Prev;
  return [
    {
      id: 'MAC-01',
      state: dxyClose < dxyEma20 && dxyRsi < 50 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `DXY ${dxyClose.toFixed(4)} vs EMA20W ${dxyEma20.toFixed(4)} (Δ ${((dxyClose - dxyEma20) / dxyEma20 * 100).toFixed(3)}%); RSI ${dxyRsi.toFixed(2)}`,
    },
    {
      id: 'MAC-02',
      state: us10yClose < us10yEma20 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `US10Y ${us10yClose.toFixed(2)}% vs EMA20W ${us10yEma20.toFixed(2)}%`,
    },
    {
      id: 'MAC-03',
      state: roc12m > 0 && mom >= 0 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `M2 12M ROC ${roc12m.toFixed(2)}%, MoM ${mom > 0 ? '+' : ''}${mom.toFixed(1)}B`,
    },
  ];
}

async function evaluateRelativeStrength() {
  const [btcDaily, goldDaily, nasdaqDaily] = await Promise.all([
    fetchYahooChart('BTC-USD', '6mo'),
    fetchYahooChart('GC=F', '1y'), // SUBSTITUTE — FRED LBMA retired
    fetchFredCSV('NASDAQCOM'),
  ]);
  const btcWeekly = strictFridayCloses(btcDaily);
  const goldWeekly = strictFridayCloses(goldDaily);
  const nasdaqWeekly = strictFridayCloses(nasdaqDaily);
  const btcMap = new Map(btcWeekly.map(([d, v]) => [d.toISOString().slice(0, 10), v]));
  const goldMap = new Map(goldWeekly.map(([d, v]) => [d.toISOString().slice(0, 10), v]));
  const nasdaqMap = new Map(nasdaqWeekly.map(([d, v]) => [d.toISOString().slice(0, 10), v]));

  // BTC/Gold
  const bgFridays = [...btcMap.keys()].filter((d) => goldMap.has(d)).sort();
  const bgRatios = bgFridays.map((d) => btcMap.get(d) / goldMap.get(d));
  const bgLatest = bgRatios[bgRatios.length - 1];
  const bgEma = ema(bgRatios, 20);

  // BTC/Nasdaq
  const bnFridays = [...btcMap.keys()].filter((d) => nasdaqMap.has(d)).sort();
  const bnRatios = bnFridays.map((d) => btcMap.get(d) / nasdaqMap.get(d));
  const bnLatest = bnRatios[bnRatios.length - 1];
  const bnEma = ema(bnRatios, 20);

  // Nasdaq alone
  const nasdaqCloses = nasdaqWeekly.map(([, v]) => v);
  const nasdaqLatest = nasdaqCloses[nasdaqCloses.length - 1];
  const nasdaqEma = ema(nasdaqCloses, 20);

  return [
    {
      id: 'REL-01',
      state: bgLatest > bgEma ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `BTC/Gold ratio ${bgLatest.toFixed(3)} vs EMA20W ${bgEma.toFixed(3)} (Yahoo GC=F substitute)`,
    },
    {
      id: 'REL-02',
      state: bnLatest > bnEma ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `BTC/Nasdaq ratio ${bnLatest.toFixed(3)} vs EMA20W ${bnEma.toFixed(3)}`,
    },
    {
      id: 'REL-03',
      state: nasdaqLatest > nasdaqEma ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `Nasdaq ${nasdaqLatest.toFixed(2)} vs EMA20W ${nasdaqEma.toFixed(2)}`,
    },
  ];
}

function fmt(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

// ===========================================================================
// Main
// ===========================================================================

async function main() {
  const btc = evaluateBtcStructure();
  const macro = await evaluateMacro();
  const rel = await evaluateRelativeStrength();
  // ETF-01: NOT computed by this script — manual per spec §8.3. See PENDING_ALL.md 5.28.
  const etf = [
    {
      id: 'ETF-01',
      state: 'INACTIVE',
      weight: 2,
      detail: 'Manual feed per spec §8.3 — not auto-computed. Evaluate via CoinGlass browser render + §4.5 partial-data rule.',
    },
  ];

  const all = [...btc, ...macro, ...etf, ...rel];
  console.log('\n=== Signal evaluation ===');
  for (const s of all) {
    const pts = s.state === 'ACTIVE' ? s.weight : 0;
    console.log(`  ${s.id.padEnd(8)} [${s.state.padEnd(8)}] ${pts}/${s.weight}  — ${s.detail}`);
  }

  const groupTotals = {
    btc_structure: btc.reduce((s, x) => s + (x.state === 'ACTIVE' ? x.weight : 0), 0),
    macro_environment: macro.reduce((s, x) => s + (x.state === 'ACTIVE' ? x.weight : 0), 0),
    institutional_demand: etf.reduce((s, x) => s + (x.state === 'ACTIVE' ? x.weight : 0), 0),
    relative_strength: rel.reduce((s, x) => s + (x.state === 'ACTIVE' ? x.weight : 0), 0),
  };

  console.log('\n=== Group totals ===');
  console.log(`  BTC Structure (max 6):        ${groupTotals.btc_structure}`);
  console.log(`  Macro Environment (max 3):    ${groupTotals.macro_environment}`);
  console.log(`  Institutional Demand (max 2): ${groupTotals.institutional_demand}`);
  console.log(`  Relative Strength (max 3):    ${groupTotals.relative_strength}`);

  const score = Object.values(groupTotals).reduce((s, v) => s + v, 0);
  const bands = [
    { code: 'HOSTILE', label: 'Hostile', min: 0, max: 2 },
    { code: 'DEFENSIVE', label: 'Defensive', min: 3, max: 5 },
    { code: 'NEUTRAL_MIXED', label: 'Neutral / Mixed', min: 6, max: 8 },
    { code: 'CONSTRUCTIVE', label: 'Constructive', min: 9, max: 11 },
    { code: 'VERY_FAVORABLE', label: 'Very Favorable', min: 12, max: 14 },
  ];
  const band = bands.find((b) => score >= b.min && score <= b.max);

  console.log(`\n=== Total: ${score} / 14 → ${band.code} (${band.label}) ===\n`);
}

// Only run if invoked directly (allows import for tests)
const isDirectInvocation = import.meta.url === `file://${process.argv[1]}`;
if (isDirectInvocation) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
