/**
 * market-sources.mjs — fetch, gate and evaluate the weekly sources ONCE, for
 * every entry point (2026-10-18 compliance pass, Principle 4).
 *
 * WHY THIS EXISTS. `run.mjs` (the weekly pipeline) and `data-fetchers/
 * compute-regime.mjs` (the manual score check) each listed the same six fetch
 * calls with the same windows, and only the pipeline ran the quality gate.
 * The check script could therefore score — and, with `--archive`, record in
 * the provenance ledger — data the pipeline would have refused, and a window
 * changed in one file (5.138 is the open question on the BTC window) would
 * make the two disagree again: the 5.136 failure, the verification tool
 * contradicting the site it verifies. One fetch list, one gate, one
 * evaluation.
 */
import { fetchFredSeries } from '../providers/fred.mjs';
import { fetchYahooDaily } from '../providers/yahoo.mjs';
import {
  assertDailySeries,
  assertMonthlySeries,
  assertRateSeries,
  assertRecency,
  OUTLIER_BOUNDS_PCT,
} from './quality-gate.mjs';
import {
  evaluateBtcStructure,
  evaluateMacro,
  evaluateRelativeStrength,
  scoreSignals,
  anchorCoherence,
  M2_MONTHS_FOR_ROC,
} from './regime-engine.mjs';
import { resolveEtfSignals } from './etf-flows.mjs';
import { FETCHED_SOURCES } from './source-registry.mjs';

/**
 * Recency SLAs, in days, per source. FRED weekly-published series carry up to
 * ~1 week of publication lag (+ holiday); Yahoo quotes are near-live; M2 is
 * monthly with a ~4-week release lag (observation date = first of the data
 * month, so the worst case is ~88 days).
 */
/** The newest point of each fetched source may be at most this old (from the source list). */
export const RECENCY_SLA_DAYS = Object.freeze(
  Object.fromEntries(FETCHED_SOURCES.map((s) => [s.label, s.recencyMaxDays]))
);

/** The six weekly sources, with their windows. Throws on any fetch failure. */
export async function fetchMarketSources() {
  const [dxy, us10y, m2, nasdaq, btc, gold] = await Promise.all([
    fetchFredSeries('DTWEXBGS'),
    fetchFredSeries('DGS10'),
    fetchFredSeries('M2SL'),
    fetchFredSeries('NASDAQCOM'),
    fetchYahooDaily('BTC-USD', '6mo'),
    fetchYahooDaily('GC=F', '1y'),
  ]);
  return { dxy, us10y, m2, nasdaq, btc, gold };
}

/** Fail-closed quality gate over the fetched sources (throws QualityGateError). */

/**
 * Every fetched source passes its quality check, then its recency limit, both read from the
 * one source list (plan MP-3a). The order matches the list.
 */
export function assertMarketSourcesQuality(sources, today) {
  for (const s of FETCHED_SOURCES) {
    const series = sources[s.key].series;
    if (s.check === 'rate') assertRateSeries(s.label, series);
    else if (s.check === 'monthly')
      assertMonthlySeries(s.label, series, {
        minPoints: M2_MONTHS_FOR_ROC,
        maxMovePct: OUTLIER_BOUNDS_PCT[s.boundsKey],
      });
    else assertDailySeries(s.label, series, { maxMovePct: OUTLIER_BOUNDS_PCT[s.boundsKey] });
  }
  for (const s of FETCHED_SOURCES)
    assertRecency(s.label, sources[s.key].series, today, {
      maxAgeDays: s.recencyMaxDays,
    });
}

/**
 * Evaluate all eleven signals and score them. Pure apart from what the caller
 * injects.
 *
 * @param {object} io
 * @param {object} io.sources — from `fetchMarketSources`, already gated
 * @param {Array} io.btcMonths — the in-repo monthly BTC series
 * @param {Array} io.etfSnapshots — the ETF shares ledger
 * @param {object|null} io.etfManual — parsed etf01-manual.json, or null
 * @param {Date} io.today
 */
export function evaluateMarketSignals({ sources, btcMonths, etfSnapshots, etfManual, today }) {
  const { dxy, us10y, m2, nasdaq, btc: btcDaily, gold } = sources;
  const btc = evaluateBtcStructure(btcMonths, today); // throws STALE INPUT (F-M2) if the due candle is missing
  const macro = evaluateMacro(
    { dxyDaily: dxy.series, us10yDaily: us10y.series, m2Monthly: m2.series },
    today
  );
  const rel = evaluateRelativeStrength(
    { btcDaily: btcDaily.series, goldDaily: gold.series, nasdaqDaily: nasdaq.series },
    today
  );
  const etf = resolveEtfSignals({ snapshots: etfSnapshots, manual: etfManual }, today);
  const all = [...btc, ...macro, ...etf, ...rel];
  const { groupTotals, score, band } = scoreSignals({ btc, macro, etf, rel });
  const { spreadDays, warning } = anchorCoherence(all);
  return { btc, macro, etf, rel, all, groupTotals, score, band, spreadDays, warning };
}
