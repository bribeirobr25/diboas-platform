/**
 * regime-engine.mjs — the PURE regime computation (P2, Stage 3 of the
 * automation plan: "one compute, two entry points").
 *
 * Extracted verbatim from `data-fetchers/compute-regime.mjs` (2026-07-11) so
 * the manual CLI and the market-refresh pipeline import the SAME functions —
 * Principle 4 (DRY): there is no second implementation to drift. All P1
 * guards travel with the extraction (F-M2 expected-month gate, F-M3 anchors).
 *
 * This module performs NO network and NO filesystem I/O — callers inject the
 * series. Signal semantics, thresholds, and the strict-Friday / candle-lock
 * conventions are LOCKED per doc 02 §5.1/§8 and must not be changed here
 * without a methodology decision.
 *
 * Plan: docs/audit/MARKET_REFRESH_AUDIT_AND_AUTOMATION_PLAN_2026-07-11.md §B.
 */

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
 * @param {Array<[Date, number]>} daily — sorted ascending by date
 * @param {Date} today — injected clock (pipeline passes run time)
 * @returns {Array<[Date, number]>} — confirmed Friday closes, ascending
 */
export function strictFridayCloses(daily, today) {
  if (!daily.length) return [];
  const byDate = new Map();
  for (const [d, v] of daily) {
    byDate.set(d.toISOString().slice(0, 10), v);
  }
  const fridays = [];
  const first = daily[0][0];
  const last = daily[daily.length - 1][0];
  let cur = new Date(first);
  while (cur.getUTCDay() !== 5) cur.setUTCDate(cur.getUTCDate() + 1);
  while (cur <= last && cur <= today) {
    const fridayKey = cur.toISOString().slice(0, 10);
    if (byDate.has(fridayKey)) {
      fridays.push([new Date(cur), byDate.get(fridayKey)]);
    } else if (cur < today) {
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
// Freshness helpers (P1 guards — F-M2)
// ===========================================================================

/** Days after a month-roll during which the append may legitimately be pending. */
export const MONTH_APPEND_GRACE_DAYS = 3;

/** The month whose candle MUST already be appended (steps back during grace). */
export function expectedConfirmedMonthYM(now) {
  const monthsBack = now.getUTCDate() <= MONTH_APPEND_GRACE_DAYS ? 2 : 1;
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
  return prev.toISOString().slice(0, 7) + '-01';
}

/** Last confirmed month (candle-lock §5.1): current month is always in progress. */
export function lastConfirmedMonthYM(now) {
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return prev.toISOString().slice(0, 7) + '-01';
}

/** Last date of a [Date, value] series as YYYY-MM-DD, or null (F-M3 anchors). */
export function anchorOf(series) {
  if (!series || !series.length) return null;
  return series[series.length - 1][0].toISOString().slice(0, 10);
}

// ===========================================================================
// Signal evaluations (pure — series injected)
// ===========================================================================

export function evaluateBtcStructure(btcMonths, today) {
  const lastConfirmedYm = lastConfirmedMonthYM(today);
  // P1 guard (F-M2): "latest present" is never silently "latest expected".
  const expectedYm = expectedConfirmedMonthYM(today);
  if (!btcMonths.some((m) => m.ym === expectedYm)) {
    throw new Error(
      `STALE INPUT (F-M2): monthlyPrices.json BTC is missing the expected confirmed ` +
        `monthly candle ${expectedYm} (grace of ${MONTH_APPEND_GRACE_DAYS} days after ` +
        `month-roll has passed). Append the candle per the /market playbook before computing.`
    );
  }
  const closes = btcMonths.filter((m) => m.ym <= lastConfirmedYm).map((m) => m.close);
  const lastClose = closes[closes.length - 1];
  const ema20 = ema(closes, 20);
  const sma50 = sma(closes, 50);
  const rsiCurrent = rsi(closes, 14);
  const rsiPrev = rsi(closes.slice(0, -1), 14);
  const stochK = stochRsiK(closes);
  const monthAnchor = btcMonths.filter((m) => m.ym <= lastConfirmedYm).at(-1).ym;
  return [
    {
      id: 'BTC-01',
      state: lastClose > ema20 ? 'ACTIVE' : 'INACTIVE',
      weight: 2,
      detail: `close ${fmtUsd(lastClose)} vs 20M EMA ${fmtUsd(ema20)}`,
      values: { close: lastClose, ema20, gapPct: ((lastClose - ema20) / ema20) * 100 },
      anchor: monthAnchor,
      anchorKind: 'monthly',
    },
    {
      id: 'BTC-02',
      state: lastClose > sma50 ? 'ACTIVE' : 'INACTIVE',
      weight: 2,
      detail: `close ${fmtUsd(lastClose)} vs 50M SMA ${fmtUsd(sma50)}`,
      values: { close: lastClose, sma50, gapPct: ((lastClose - sma50) / sma50) * 100 },
      anchor: monthAnchor,
      anchorKind: 'monthly',
    },
    {
      id: 'BTC-03',
      state: rsiCurrent > rsiPrev ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `RSI current ${rsiCurrent.toFixed(2)} vs prev ${rsiPrev.toFixed(2)}`,
      values: { rsiCurrent, rsiPrev },
      anchor: monthAnchor,
      anchorKind: 'monthly',
    },
    {
      id: 'BTC-04',
      state: stochK > 10 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `Stoch-RSI %K ${stochK.toFixed(2)} vs threshold 10`,
      values: { stochK, threshold: 10 },
      anchor: monthAnchor,
      anchorKind: 'monthly',
    },
  ];
}

export function evaluateMacro({ dxyDaily, us10yDaily, m2Monthly }, today) {
  const dxyWeekly = strictFridayCloses(dxyDaily, today);
  const us10yWeekly = strictFridayCloses(us10yDaily, today);
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
      detail: `DXY ${dxyClose.toFixed(4)} vs EMA20W ${dxyEma20.toFixed(4)} (Δ ${(((dxyClose - dxyEma20) / dxyEma20) * 100).toFixed(3)}%); RSI ${dxyRsi.toFixed(2)}`,
      values: {
        close: dxyClose,
        ema20: dxyEma20,
        gapPct: ((dxyClose - dxyEma20) / dxyEma20) * 100,
        rsi: dxyRsi,
      },
      anchor: anchorOf(dxyWeekly),
      anchorKind: 'weekly',
    },
    {
      id: 'MAC-02',
      state: us10yClose < us10yEma20 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `US10Y ${us10yClose.toFixed(2)}% vs EMA20W ${us10yEma20.toFixed(2)}%`,
      values: { close: us10yClose, ema20: us10yEma20 },
      anchor: anchorOf(us10yWeekly),
      anchorKind: 'weekly',
    },
    {
      id: 'MAC-03',
      state: roc12m > 0 && mom >= 0 ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `M2 12M ROC ${roc12m.toFixed(2)}%, MoM ${mom > 0 ? '+' : ''}${mom.toFixed(1)}B`,
      values: { roc12m, mom },
      anchor: anchorOf(m2Monthly),
      anchorKind: 'monthly',
    },
  ];
}

export function evaluateRelativeStrength({ btcDaily, goldDaily, nasdaqDaily }, today) {
  const btcWeekly = strictFridayCloses(btcDaily, today);
  const goldWeekly = strictFridayCloses(goldDaily, today);
  const nasdaqWeekly = strictFridayCloses(nasdaqDaily, today);
  const btcMap = new Map(btcWeekly.map(([d, v]) => [d.toISOString().slice(0, 10), v]));
  const goldMap = new Map(goldWeekly.map(([d, v]) => [d.toISOString().slice(0, 10), v]));
  const nasdaqMap = new Map(nasdaqWeekly.map(([d, v]) => [d.toISOString().slice(0, 10), v]));

  const bgFridays = [...btcMap.keys()].filter((d) => goldMap.has(d)).sort();
  const bgRatios = bgFridays.map((d) => btcMap.get(d) / goldMap.get(d));
  const bgLatest = bgRatios[bgRatios.length - 1];
  const bgEma = ema(bgRatios, 20);

  const bnFridays = [...btcMap.keys()].filter((d) => nasdaqMap.has(d)).sort();
  const bnRatios = bnFridays.map((d) => btcMap.get(d) / nasdaqMap.get(d));
  const bnLatest = bnRatios[bnRatios.length - 1];
  const bnEma = ema(bnRatios, 20);

  const nasdaqCloses = nasdaqWeekly.map(([, v]) => v);
  const nasdaqLatest = nasdaqCloses[nasdaqCloses.length - 1];
  const nasdaqEma = ema(nasdaqCloses, 20);

  return [
    {
      id: 'REL-01',
      state: bgLatest > bgEma ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `BTC/Gold ratio ${bgLatest.toFixed(3)} vs EMA20W ${bgEma.toFixed(3)} (Yahoo GC=F substitute)`,
      anchor: bgFridays[bgFridays.length - 1],
      anchorKind: 'weekly',
    },
    {
      id: 'REL-02',
      state: bnLatest > bnEma ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `BTC/Nasdaq ratio ${bnLatest.toFixed(3)} vs EMA20W ${bnEma.toFixed(3)}`,
      anchor: bnFridays[bnFridays.length - 1],
      anchorKind: 'weekly',
    },
    {
      id: 'REL-03',
      state: nasdaqLatest > nasdaqEma ? 'ACTIVE' : 'INACTIVE',
      weight: 1,
      detail: `Nasdaq ${nasdaqLatest.toFixed(2)} vs EMA20W ${nasdaqEma.toFixed(2)}`,
      anchor: anchorOf(nasdaqWeekly),
      anchorKind: 'weekly',
    },
  ];
}

/**
 * ETF-01 from the manual input file (Stage 1: "the pipeline consumes it and
 * marks it UNAVAILABLE automatically when expired").
 *
 * @param {{state:string, detail:string, expires_at:string}|null} manual
 * @param {Date} today
 */
export function evaluateEtfManual(manual, today) {
  let state = 'INACTIVE';
  let detail = 'Manual feed per spec §8.3 — no etf01-manual.json provided.';
  if (manual) {
    const expired = new Date(manual.expires_at) < today;
    state = expired ? 'UNAVAILABLE' : manual.state;
    detail = expired
      ? `Manual entry expired ${manual.expires_at} → UNAVAILABLE per doc 02 §10.1 (was: ${manual.detail})`
      : manual.detail;
  }
  return [
    {
      id: 'ETF-01',
      state,
      weight: 2,
      detail,
      anchor: manual ? manual.entered_at?.slice(0, 10) : null,
      anchorKind: 'manual',
    },
  ];
}

// ===========================================================================
// Scoring
// ===========================================================================

export const BANDS = [
  { code: 'HOSTILE', label: 'Hostile', min: 0, max: 2 },
  { code: 'DEFENSIVE', label: 'Defensive', min: 3, max: 5 },
  { code: 'NEUTRAL_MIXED', label: 'Neutral / Mixed', min: 6, max: 8 },
  { code: 'CONSTRUCTIVE', label: 'Constructive', min: 9, max: 11 },
  { code: 'VERY_FAVORABLE', label: 'Very Favorable', min: 12, max: 14 },
];

export function scoreSignals({ btc, macro, etf, rel }) {
  const pts = (list) => list.reduce((s, x) => s + (x.state === 'ACTIVE' ? x.weight : 0), 0);
  const groupTotals = {
    btc_structure: pts(btc),
    macro_environment: pts(macro),
    institutional_demand: pts(etf),
    relative_strength: pts(rel),
  };
  const score = Object.values(groupTotals).reduce((s, v) => s + v, 0);
  const band = BANDS.find((b) => score >= b.min && score <= b.max);
  return { groupTotals, score, band };
}

/**
 * F-M3 anchor coherence: weekly anchors must sit within a 7-day window.
 * Returns { spreadDays, warning } — warning is null when coherent.
 */
export function anchorCoherence(signals) {
  const weekly = signals.filter((x) => x.anchor && x.anchorKind === 'weekly');
  if (weekly.length < 2) return { spreadDays: 0, warning: null };
  const times = weekly.map((x) => new Date(`${x.anchor}T00:00:00Z`).getTime());
  const spreadDays = (Math.max(...times) - Math.min(...times)) / 86400000;
  if (spreadDays <= 7) return { spreadDays, warning: null };
  const newest = Math.max(...times);
  const laggards = weekly
    .filter((x) => (newest - new Date(`${x.anchor}T00:00:00Z`).getTime()) / 86400000 > 7)
    .map((x) => `${x.id}@${x.anchor}`);
  return {
    spreadDays,
    warning:
      `weekly anchor spread ${spreadDays.toFixed(0)}d > 7d — mark the laggards DELAYED ` +
      `in data-status.json instead of silently mixing anchors: ${laggards.join(', ')}`,
  };
}

function fmtUsd(n) {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
