/**
 * Inflation Impact Calculator engine (Phase 2 §2.3 extraction, 2026-05-25).
 *
 * Two modes:
 *   - Forward: `purchasingPower(amount, years, inflationRate)` with the
 *     horizon-switched inflation rate (`selectInflationRate`: ≤24mo current,
 *     >24mo average5y).
 *   - Retrospective: `amount / (1 + cumulativeSince2010)` — what 2010 money
 *     is worth in today's purchasing power.
 *
 * Engine-only; inflation-only by design (audit Q3a). No currency hedge.
 *
 * R1 discipline: forward and retrospective ship as TWO separate functions —
 * never one with a `retrospective: boolean` flag.
 *
 * **C42 close (CTO-board v1.1 §4 S4, 2026-05-25):** the retrospective path
 * dereferences `snapshot.inflationRates.rates[input.country]`. Before
 * extraction, the React component did this without a nullish guard on the
 * intermediate (latent crash once `inflationRates` becomes provider-driven
 * and a degraded fetch returns a partial `rates` map). The extracted
 * function MUST guard `localeInflation` before reading `.cumulativeSince2010`
 * — same "missing data → return null → existing UI handles it" pattern that
 * Phase 1 §1.2 established for C21.
 *
 * SDK readiness: consumes `MarketDataSnapshot` — no direct constants imports.
 */

import { calculateLumpSum, purchasingPower, selectInflationRate } from '@/lib/market-data/formulas';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import type { SupportedLocale } from '@diboas/i18n/config';

/**
 * Historical scenario (10%) is the only diBoaS rate offered on this tool. The
 * forward mode's "if you had invested" comparison uses this single rate; we
 * deliberately do NOT show conservative/optimistic here — the tool is about
 * inflation, not yield-tier selection.
 */
export const INFLATION_IMPACT_SCENARIO_USD_PERCENT = SCENARIO_RATES.historical;

export interface InflationImpactForwardInput {
  readonly amount: number;
  readonly years: number;
  /** User-selectable country (independent of page locale) */
  readonly country: SupportedLocale;
}

export interface InflationImpactRetrospectiveInput {
  readonly amount: number;
  readonly country: SupportedLocale;
}

export interface InflationImpactForwardResult {
  readonly cashValueReal: number;
  readonly investedReal: number;
  readonly lostToInflation: number;
  /** The inflation rate actually used (current vs average5y per 24-month rule) */
  readonly inflationRate: number;
}

export interface InflationImpactRetrospectiveResult {
  readonly cumulative: number;
  readonly todayPurchasingPower: number;
  readonly lostToInflation: number;
  readonly percentLoss: number;
}

export function calculateInflationImpactForward(
  input: InflationImpactForwardInput,
  snapshot: MarketDataSnapshot
): InflationImpactForwardResult | null {
  if (input.amount <= 0 || input.years <= 0) return null;
  const inflationRate = selectInflationRate(
    input.country,
    input.years * 12,
    snapshot.inflationRates
  );
  const cashValueReal = purchasingPower(input.amount, input.years, inflationRate);
  const investedNominal = calculateLumpSum(
    input.amount,
    INFLATION_IMPACT_SCENARIO_USD_PERCENT / 100,
    0,
    input.years
  ).nominalFV;
  const investedReal = purchasingPower(investedNominal, input.years, inflationRate);
  return {
    cashValueReal,
    investedReal,
    lostToInflation: input.amount - cashValueReal,
    inflationRate,
  };
}

export function calculateInflationImpactRetrospective(
  input: InflationImpactRetrospectiveInput,
  snapshot: MarketDataSnapshot
): InflationImpactRetrospectiveResult | null {
  if (input.amount <= 0) return null;
  // C42 guard: protect against partial `rates` maps from a degraded SDK
  // provider response. Before this guard, `localeInflation.cumulativeSince2010`
  // would throw TypeError inside the React useMemo and crash the render
  // (same failure mode as C21 in asset-history).
  const localeInflation = snapshot.inflationRates.rates[input.country];
  if (!localeInflation) return null;
  const cumulative = localeInflation.cumulativeSince2010;
  if (cumulative === undefined) return null;
  const todayPurchasingPower = input.amount / (1 + cumulative);
  const lostToInflation = input.amount - todayPurchasingPower;
  const percentLoss = (lostToInflation / input.amount) * 100;
  return { cumulative, todayPurchasingPower, lostToInflation, percentLoss };
}
