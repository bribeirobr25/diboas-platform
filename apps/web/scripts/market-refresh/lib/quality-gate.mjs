/**
 * quality-gate.mjs — Stage 2 of the market-refresh pipeline (P2).
 *
 * The founder's requirement, verbatim: "no data corruptions or stale or
 * wrong data" passes. Hard-fail semantics: a gate failure means NO files
 * are written and the last-good committed data keeps serving.
 *
 * Checks (plan §B Stage 2):
 *   1. Schema — parses, strictly monotonic dates, no NaN/null closes,
 *      OHLC sanity (low ≤ open/close ≤ high) where bars carry OHLC.
 *   2. Expected-freshness (F-M2) — engine-level for the BTC monthlies
 *      (throws STALE INPUT); per-source daily-series recency here.
 *   3. Cross-source divergence — BTC monthly close Yahoo vs CoinGecko
 *      ≤ BTC_CLOSE_TOLERANCE_PCT; per-series single-period outlier bounds.
 *   4. Anchor coherence (F-M3) — evaluated post-compute via the engine's
 *      anchorCoherence(); surfaced by run.mjs, WARN not fail (a lagging
 *      publisher is a DELAYED status, not corruption).
 */

export const BTC_CLOSE_TOLERANCE_PCT = 0.5;

/** Max plausible single-period move per series kind before requiring a second source. */
export const OUTLIER_BOUNDS_PCT = {
  btcMonthly: 45, // BTC monthly candles (historical max regions)
  dollarIndexDaily: 8, // DTWEXBGS — broad-dollar daily moves are small; 8% is deep corruption territory
  equityIndexDaily: 16, // NASDAQCOM — calibrated to clear the real 2025-04-09 +12.2% tariff-pause day
  yahooDaily: 25, // BTC-USD / GC=F daily
};

export class QualityGateError extends Error {
  constructor(check, message) {
    super(`[quality-gate:${check}] ${message}`);
    this.check = check;
  }
}

/** Check 1 — schema + monotonicity + numeric sanity for a [Date, number][] series. */
export function assertDailySeries(label, series, { maxMovePct }) {
  if (!Array.isArray(series) || series.length < 30) {
    throw new QualityGateError(
      'schema',
      `${label}: series too short (${series?.length ?? 0} points)`
    );
  }
  let prevT = -Infinity;
  let prevV = null;
  for (const [d, v] of series) {
    const t = d instanceof Date ? d.getTime() : NaN;
    if (!Number.isFinite(t)) throw new QualityGateError('schema', `${label}: non-date entry`);
    if (t <= prevT)
      throw new QualityGateError(
        'schema',
        `${label}: dates not strictly monotonic at ${d.toISOString()}`
      );
    if (!Number.isFinite(v) || v <= 0) {
      throw new QualityGateError(
        'schema',
        `${label}: non-finite/non-positive value at ${d.toISOString()}`
      );
    }
    if (prevV !== null && maxMovePct) {
      const movePct = Math.abs((v - prevV) / prevV) * 100;
      if (movePct > maxMovePct) {
        throw new QualityGateError(
          'outlier',
          `${label}: single-period move ${movePct.toFixed(1)}% > ${maxMovePct}% at ${d.toISOString().slice(0, 10)} — needs second-source confirmation`
        );
      }
    }
    prevT = t;
    prevV = v;
  }
}

/** DGS10 is in percentage points — absolute-move bound instead of relative. */
export function assertRateSeries(label, series, { maxMovePp = 0.6 } = {}) {
  if (!Array.isArray(series) || series.length < 30) {
    throw new QualityGateError('schema', `${label}: series too short`);
  }
  let prevT = -Infinity;
  let prevV = null;
  for (const [d, v] of series) {
    const t = d instanceof Date ? d.getTime() : NaN;
    if (!Number.isFinite(t) || t <= prevT)
      throw new QualityGateError('schema', `${label}: date order violation`);
    if (!Number.isFinite(v)) throw new QualityGateError('schema', `${label}: non-finite value`);
    if (prevV !== null && Math.abs(v - prevV) > maxMovePp) {
      throw new QualityGateError(
        'outlier',
        `${label}: daily move ${Math.abs(v - prevV).toFixed(2)}pp > ${maxMovePp}pp`
      );
    }
    prevT = t;
    prevV = v;
  }
}

/** Check 2 — a daily source may not end more than `maxAgeDays` before today. */
export function assertRecency(label, series, today, { maxAgeDays }) {
  const last = series[series.length - 1][0];
  const ageDays = (today.getTime() - last.getTime()) / 86400000;
  if (ageDays > maxAgeDays) {
    throw new QualityGateError(
      'freshness',
      `${label}: last observation ${last.toISOString().slice(0, 10)} is ${ageDays.toFixed(0)}d old (max ${maxAgeDays}d) — mark DELAYED/UNAVAILABLE, do not compute silently`
    );
  }
}

/** Check 1 (bars) — OHLC sanity for a monthly bar. */
export function assertOhlcBar(label, bar) {
  const { open, high, low, close } = bar;
  for (const [k, v] of Object.entries({ open, high, low, close })) {
    if (!Number.isFinite(v) || v <= 0)
      throw new QualityGateError('schema', `${label}: ${k} not finite/positive`);
  }
  if (!(low <= open && low <= close && open <= high && close <= high && low <= high)) {
    throw new QualityGateError(
      'schema',
      `${label}: OHLC sanity violated (L ${low} O ${open} C ${close} H ${high})`
    );
  }
}

/** Check 3 — dual-source verification for the BTC monthly append. */
export function assertBtcCloseVerified(ym, yahooClose, verifierPrice) {
  const divergencePct = Math.abs((yahooClose - verifierPrice) / verifierPrice) * 100;
  if (divergencePct > BTC_CLOSE_TOLERANCE_PCT) {
    throw new QualityGateError(
      'divergence',
      `BTC ${ym} close: Yahoo ${yahooClose.toFixed(2)} vs CoinGecko ${verifierPrice.toFixed(2)} ` +
        `diverge ${divergencePct.toFixed(3)}% > ${BTC_CLOSE_TOLERANCE_PCT}% — NO WRITE`
    );
  }
  return divergencePct;
}
