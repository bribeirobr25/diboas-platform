/**
 * Emergency Fund Calculator engine (Phase 2 §2.1 extraction, 2026-05-25).
 *
 * Extracted from `components/Sections/EmergencyFundCalculator/EmergencyFundCalculator.tsx`
 * to honour File Decoupling (coding-standards §6) and the lib-engine pattern
 * the compound-interest family already uses. Composition logic (target, horizon
 * estimate, hedge resolution, per-scenario try/catch, savedMonths) lives here;
 * the React component is now a thin renderer.
 *
 * Unit convention (CLAUDE.md "Inflation/depreciation rate unit convention"):
 *   - `scenarioRates.*`, `bankRates.*.savings` are PERCENT  → divide by 100.
 *   - `inflationRates.*` is already DECIMAL                 → use directly.
 *   - `exchangeRates.*.annualDepreciation` is DECIMAL       → use directly.
 *
 * R1 discipline (financial-calculations.md): this is a separate named function
 * from `calculateTimeToTargetTimeline` even though both wrap
 * `monthsToInflationAdjustedTarget`. The emergency-fund variant passes the
 * locale's `average5y` inflation; time-to-target passes `0`. Never collapse
 * these two behind an `inflationAdjusted: boolean` flag.
 *
 * SDK readiness (iter5-sdk-migration-map.md §6.10): consumes a
 * `MarketDataSnapshot` argument — no direct `FALLBACK_MARKET_DATA` reads. The
 * eventual SDK swap is mechanical: the caller passes a provider-driven
 * snapshot instead of the fallback.
 */

import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import {
  applyEffectiveRateClamp,
  monthsToInflationAdjustedTarget,
  resolveHorizonMatchedDepreciation,
} from '@/lib/market-data/formulas';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import type { SupportedLocale } from '@diboas/i18n/config';

/**
 * Asymmetric horizon-estimate cap vs time-to-target (which clamps at 40 — C12).
 * Emergency-fund's estimate is `target / (monthlySavings × 12)` clamped to
 * [1, MAX_HORIZON_YEARS]. With realistic inputs the cap is rarely reached, but
 * un-clamped values let `deriveHorizonMatchedCAGR` saturate at the full FX
 * series silently. Aligning to time-to-target's 40 closes C12.
 */
export const EMERGENCY_FUND_MAX_HORIZON_YEARS = 40;

/**
 * Fallback horizon when `monthlySavings <= 0`. Matches the audit-bundle's F3
 * "Emergency Fund 5-year default" (deliberately shorter than time-to-target's
 * 10-year default — an emergency fund implies a short horizon by construction).
 */
export const EMERGENCY_FUND_FALLBACK_HORIZON_YEARS = 5;

/**
 * The defining design choice of emergency-fund: only the `historical` scenario
 * is shown. Conservative/optimistic alongside introduces optionality that
 * conflicts with the tool's safety framing — emergency funds are not the place
 * to optimize yield (C13 close: this is the rationale, recorded as a comment
 * on the constant instead of a code smell).
 */
export const EMERGENCY_FUND_SCENARIO_USD_PERCENT = SCENARIO_RATES.historical;

export interface EmergencyFundInput {
  /** Monthly cost of living, positive number */
  readonly monthlyExpenses: number;
  /** Monthly contribution toward the fund */
  readonly monthlySavings: number;
  /** Months of expenses to bank (typically 3–12) */
  readonly targetMultiplier: number;
  /** Drives currency hedge + inflation lookup */
  readonly locale: SupportedLocale;
}

export interface EmergencyFundResult {
  /** Computed target = monthlyExpenses × targetMultiplier */
  readonly target: number;
  /** Months to reach the inflation-adjusted target via diBoaS yield */
  readonly diboasMonths: number | null;
  /** Months to reach the inflation-adjusted target via the user's bank */
  readonly bankMonths: number | null;
  /** Difference (bank - diboas); 0 when one or both are unreachable */
  readonly savedMonths: number;
  /** True if either timeline exceeds 360 months (over-30-years warning) */
  readonly over30Years: boolean;
  /** True if the user has selected a currency that benefits from the hedge */
  readonly hedged: boolean;
  /** Bank APY as a decimal (e.g. 0.0038 = 0.38%) — for display */
  readonly bankApy: number;
}

/**
 * Compute the bank-vs-diBoaS emergency-fund timeline. Returns `null` for any
 * scenario that exceeds the 1200-month engine cap; the caller renders that
 * as "cannot reach in 100 years" guidance.
 */
export function calculateEmergencyFundTimeline(
  input: EmergencyFundInput,
  snapshot: MarketDataSnapshot
): EmergencyFundResult | null {
  if (input.monthlySavings <= 0) return null;

  const bankApy = (snapshot.rates.bankRates[input.locale]?.savings ?? 0) / 100;
  const inflation = snapshot.inflationRates.rates[input.locale]?.average5y ?? 0;

  const currency = LOCALE_CURRENCY[input.locale];
  const estimatedHorizonYears = Math.min(
    EMERGENCY_FUND_MAX_HORIZON_YEARS,
    Math.max(1, (input.monthlyExpenses * input.targetMultiplier) / (input.monthlySavings * 12))
  );
  const depreciation = resolveHorizonMatchedDepreciation(snapshot, currency, estimatedHorizonYears);
  const diboasUsdApy = EMERGENCY_FUND_SCENARIO_USD_PERCENT / 100;
  // C3 close (CTO-board v3 audit, 2026-05-26): route the inline effective-rate
  // computation through `applyEffectiveRateClamp` for parity with the compound
  // engine and `lib/time-to-target`. Use `=== 0` (not `> 0`) so catastrophic
  // negative depreciation (`d ≤ −1`) actually reaches the clamp and emits the
  // observability event — previously the `> 0` gate silently skipped the
  // hedge AND the clamp, hiding the pathological case rather than logging it.
  const diboasEffective =
    depreciation === 0
      ? diboasUsdApy
      : applyEffectiveRateClamp((1 + diboasUsdApy) * (1 + depreciation) - 1, {
          source: 'calculateEmergencyFundTimeline',
          usdYield: diboasUsdApy,
          depreciation,
        });

  const target = input.monthlyExpenses * input.targetMultiplier;

  const tryMonths = (rate: number): number | null => {
    try {
      return monthsToInflationAdjustedTarget(target, input.monthlySavings, rate, inflation);
    } catch {
      return null;
    }
  };

  const diboasMonths = tryMonths(diboasEffective);
  const bankMonths = tryMonths(bankApy);
  if (diboasMonths === null && bankMonths === null) return null;

  const savedMonths = diboasMonths !== null && bankMonths !== null ? bankMonths - diboasMonths : 0;

  const over30Years =
    (diboasMonths !== null && diboasMonths > 360) || (bankMonths !== null && bankMonths > 360);

  return {
    target,
    diboasMonths,
    bankMonths,
    savedMonths,
    over30Years,
    hedged: depreciation > 0,
    bankApy,
  };
}
