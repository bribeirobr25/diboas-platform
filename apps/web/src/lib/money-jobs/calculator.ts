/**
 * Money Jobs engine (tool #11 — spec: docs/tools/NEW_TOOL_PROPOSAL.md §4/§7).
 *
 * Gives every part of a monthly amount a job: Floor (essentials), Cushion
 * (emergency reserve), Working money (surplus with slack). B2C and B2B are
 * two named engines per R1 discipline (financial-calculations.md) — NEVER
 * one function with a mode flag: the business engine models an operating
 * floor + runway, not a household split.
 *
 * Unit convention (CLAUDE.md "Inflation/depreciation rate unit convention"):
 *   - `inflationRates.*` is DECIMAL → used directly (via inflation-impact).
 * All model constants below are ratios/months — no percent/decimal mixing.
 *
 * SDK readiness (§6.10): consumes a `MarketDataSnapshot` argument for the
 * cost line — no direct `FALLBACK_MARKET_DATA` reads.
 *
 * Compliance shape (CLO-light pass 2026-07-11, GO w/ conditions C1–C5):
 * the engine emits COST framing only for the free surface (what jobless
 * money loses to inflation) — never a gain figure; projections are the
 * gated layer's concern and reuse the hedged compound engine there.
 */

import { calculateInflationImpactForward } from '@/lib/inflation-impact';
import { calculateIdleCashYield, type IdleCashResult } from '@/lib/idle-cash';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import {
  applyEffectiveRateClamp,
  monthsToInflationAdjustedTarget,
  resolveHorizonMatchedDepreciation,
} from '@/lib/market-data/formulas';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import type { SupportedLocale } from '@diboas/i18n/config';

/**
 * Attested model constants — provenance format per
 * docs/tools/MONEY_JOBS_CONSTANTS_ATTESTATION.md §6 (Data Vintage P-6).
 */
export const MONEY_JOBS_MODEL = {
  // Basis A (share of NET income) — D-C1, Bar 2026-07-10. All means; on-screen label
  // "estimated — adjust to your reality" is part of the attestation contract.
  essentialsShare: {
    en: 0.62, // BLS CES 2023 news-release Table A: $54,754 / $87,869 after-tax = 0.623; lastVerified 2026-07-10; attested Bar 2026-07-10; HIGH. Re-attest when BLS restores after-tax income (~Sep 2026).
    'pt-BR': 0.61, // IBGE POF 2017-18: R$3.019,33 / (RDFPC 1.650,78 × 3,0) = 0.610; lastVerified 2026-07-10; attested Bar 2026-07-10; MEDIUM (8y vintage). NOTE: the oft-quoted 72,2% is share-of-CONSUMPTION, not income — do not "correct" back. Re-attest on POF 2024-25 first results (late 2026).
    es: 0.56, // INE EPF 2024 (G1+G4+G6+G7 €21,674) / ECV renta neta media €38,994 = 0.556; lastVerified 2026-07-10; attested Bar 2026-07-10; MEDIUM (cross-source, imputed-rent asymmetry noted).
    de: 0.47, // Destatis LWR 2022 same-survey: €1,907 / €4,056 = 0.470 (EVS-2023 structure cross-check 67.0%); lastVerified 2026-07-10; attested Bar 2026-07-10; MEDIUM-HIGH. Re-attest on EVS-2023 income module.
  },
  cushionMonths: 6, // flat, all locales — C-B1 option (i), aligns with EMERGENCY_FUND_DEFAULTS.targetMultiplier = 6; Bar 2026-07-10
  prudenceFactor: 0.75, // policy — anti-hype slack; Bar 2026-07-10
  floorCoverageMonths: 3, // policy — /business operating-floor model; Bar 2026-07-10
  cushionStep: { highRate: 0.35, normalRate: 0.25, fundedThreshold: 0.25 }, // decision 2 (safety-first); Bar 2026-07-10
  runwayComfortMonths: 12, // decision 9 (B2B runway mode); Bar 2026-07-10
  dignityFloorRatio: 0.05, // finding F3 (dignity state when surplus < 5% of income); Bar 2026-07-10
} as const;

/** Horizon for the free-surface cost line (M1): inflation erosion over 5 years. */
export const MONEY_JOBS_COST_LINE_YEARS = 5;

// ============================================================================
// B2C — "For you"
// ============================================================================

export interface MoneyJobsPersonalInput {
  readonly monthlyIncome: number;
  readonly monthlyEssentials: number;
  /** Current emergency savings; optional in the UI, defaults to 0. */
  readonly currentSavings: number;
  readonly locale: SupportedLocale;
}

export interface MoneyJobsPersonalResult {
  /** Floor — money with a standing job (the essentials input, echoed). */
  readonly floor: number;
  /** Cushion target = essentials × cushionMonths (flat 6). */
  readonly cushionTarget: number;
  readonly cushionCurrent: number;
  /** Funded ratio [0, 1+] — currentSavings / cushionTarget. */
  readonly cushionFundedRatio: number;
  /** Safety-first step rate applied this month: 0.35 / 0.25 / 0. */
  readonly cushionRate: number;
  /** Monthly contribution suggestion = surplus × cushionRate. */
  readonly cushionContribution: number;
  /** Working money band: maximum = full remaining surplus. */
  readonly workingMax: number;
  /** Working money band: ideal = maximum × prudenceFactor (the slack number). */
  readonly workingIdeal: number;
  /** The share-hook headline: income not yet assigned to any job. */
  readonly joblessMoney: number;
  /** M1 cost line: purchasing power the jobless amount loses to locale
   *  inflation over MONEY_JOBS_COST_LINE_YEARS. Null when jobless ≤ 0 or
   *  inflation data is unavailable. COST framing only — never a gain. */
  readonly joblessCostOfInflation: number | null;
  /** F3: true when the month's job is holding you up (no split rendered). */
  readonly dignityState: boolean;
  readonly inputEcho: MoneyJobsPersonalInput;
}

/**
 * B2C split. Returns null on invalid input (non-finite or negative values,
 * essentials exceeding any positive income is VALID — it produces the
 * dignity state, a first-class path, not an error).
 */
export function calculateMoneyJobsPersonal(
  input: MoneyJobsPersonalInput,
  snapshot: MarketDataSnapshot
): MoneyJobsPersonalResult | null {
  const { monthlyIncome, monthlyEssentials, currentSavings } = input;
  if (
    !Number.isFinite(monthlyIncome) ||
    !Number.isFinite(monthlyEssentials) ||
    !Number.isFinite(currentSavings) ||
    monthlyIncome <= 0 ||
    monthlyEssentials < 0 ||
    currentSavings < 0
  ) {
    return null;
  }

  const surplus = monthlyIncome - monthlyEssentials;
  // F3: zero/thin surplus is a common month, not an edge case. Below the
  // dignity floor the split is suppressed — protection leads.
  const dignityState = surplus <= monthlyIncome * MONEY_JOBS_MODEL.dignityFloorRatio;

  const cushionTarget = monthlyEssentials * MONEY_JOBS_MODEL.cushionMonths;
  const cushionFundedRatio = cushionTarget > 0 ? currentSavings / cushionTarget : 1;

  // Safety-first step (decision 2): 35% while <25% funded → 25% until funded → 0.
  const { highRate, normalRate, fundedThreshold } = MONEY_JOBS_MODEL.cushionStep;
  const cushionRate = dignityState
    ? 0
    : cushionFundedRatio < fundedThreshold
      ? highRate
      : cushionFundedRatio < 1
        ? normalRate
        : 0;

  const effectiveSurplus = dignityState ? 0 : surplus;
  const cushionContribution = effectiveSurplus * cushionRate;
  // M4 reconcile invariant: floor + cushionContribution + workingMax === income
  // (when not in dignity state). Guarded by tests and the stress harness.
  const workingMax = effectiveSurplus - cushionContribution;
  const workingIdeal = workingMax * MONEY_JOBS_MODEL.prudenceFactor;

  const joblessMoney = Math.max(0, surplus);
  const cost =
    joblessMoney > 0
      ? calculateInflationImpactForward(
          { amount: joblessMoney, years: MONEY_JOBS_COST_LINE_YEARS, country: input.locale },
          snapshot
        )
      : null;

  return {
    floor: monthlyEssentials,
    cushionTarget,
    cushionCurrent: currentSavings,
    cushionFundedRatio,
    cushionRate,
    cushionContribution,
    workingMax,
    workingIdeal,
    joblessMoney,
    joblessCostOfInflation: cost ? cost.lostToInflation : null,
    dignityState,
    inputEcho: input,
  };
}

// ============================================================================
// B2B — "For your business"
// ============================================================================

export interface MoneyJobsBusinessInput {
  /** Monthly revenue; 0 for pre-revenue (raised capital lives in cashOnHand). */
  readonly monthlyRevenue: number;
  /** Monthly burn — payroll + rent + taxes + suppliers, one number. */
  readonly monthlyBurn: number;
  readonly cashOnHand: number;
  readonly locale: SupportedLocale;
}

export interface MoneyJobsBusinessResult {
  /** Operating floor = burn × floorCoverageMonths (what must stay ready). */
  readonly operatingFloor: number;
  /** Cash above the floor. */
  readonly excess: number;
  readonly excessIdeal: number;
  readonly excessMax: number;
  /** The share-hook headline: cash above the floor with no rule yet. */
  readonly idleExcess: number;
  /** M1 (B2B variant): inflation erosion on the unruled excess — never a
   *  card-fee figure (scope correction over the IR draft). */
  readonly idleExcessCostOfInflation: number | null;
  /** netBurn = burn − revenue. ≤ 0 means cash-positive. */
  readonly netBurn: number;
  readonly cashPositive: boolean;
  /** cash ÷ netBurn, null when cash-positive (runway is unbounded). */
  readonly runwayMonths: number | null;
  /** cash ÷ burn — the if-revenue-stopped figure, always shown. */
  readonly grossCoverageMonths: number;
  /** Decision 9: burning AND runway < runwayComfortMonths → runway-led UI,
   *  invest-the-excess framing suppressed. Cash-positive never enters it. */
  readonly runwayMode: boolean;
  readonly inputEcho: MoneyJobsBusinessInput;
}

/** B2B split. Returns null on invalid input (non-finite/negative, or zero burn). */
export function calculateMoneyJobsBusiness(
  input: MoneyJobsBusinessInput,
  snapshot: MarketDataSnapshot
): MoneyJobsBusinessResult | null {
  const { monthlyRevenue, monthlyBurn, cashOnHand } = input;
  if (
    !Number.isFinite(monthlyRevenue) ||
    !Number.isFinite(monthlyBurn) ||
    !Number.isFinite(cashOnHand) ||
    monthlyRevenue < 0 ||
    monthlyBurn <= 0 ||
    cashOnHand < 0
  ) {
    return null;
  }

  const operatingFloor = monthlyBurn * MONEY_JOBS_MODEL.floorCoverageMonths;
  const excess = Math.max(0, cashOnHand - operatingFloor);
  const excessMax = excess;
  const excessIdeal = excess * MONEY_JOBS_MODEL.prudenceFactor;

  const netBurn = monthlyBurn - monthlyRevenue;
  const cashPositive = netBurn <= 0;
  const runwayMonths = cashPositive ? null : cashOnHand / netBurn;
  const grossCoverageMonths = cashOnHand / monthlyBurn;

  // Decision 9 (option A): the B2B mirror of the dignity state. Boundary is
  // strict: runway of exactly runwayComfortMonths is COMFORTABLE (not mode).
  const runwayMode =
    !cashPositive && (runwayMonths as number) < MONEY_JOBS_MODEL.runwayComfortMonths;

  const idleExcess = excess;
  const cost =
    idleExcess > 0
      ? calculateInflationImpactForward(
          { amount: idleExcess, years: MONEY_JOBS_COST_LINE_YEARS, country: input.locale },
          snapshot
        )
      : null;

  return {
    operatingFloor,
    excess,
    excessIdeal,
    excessMax,
    idleExcess,
    idleExcessCostOfInflation: cost ? cost.lostToInflation : null,
    netBurn,
    cashPositive,
    runwayMonths,
    grossCoverageMonths,
    runwayMode,
    inputEcho: input,
  };
}

// ============================================================================
// Gated plan (decision 8: plan + projections behind the email gate)
// ============================================================================

/** Cap mirrors EMERGENCY_FUND_MAX_HORIZON_YEARS (C12 alignment). */
const PLAN_MAX_HORIZON_YEARS = 40;

export interface MoneyJobsPersonalPlan {
  /** Months to reach the cushion target at the suggested contribution
   *  (conservative-hedged, inflation-adjusted). Null when unreachable;
   *  0 when already funded. */
  readonly cushionMonthsToTarget: number | null;
  /** True when the non-USD hedge path applied (digitalDollarSuffix gates on this). */
  readonly hedged: boolean;
}

/**
 * B2C gated plan — the cushion timeline. Uses the CONSERVATIVE scenario
 * (CLO condition C4 / P2-c consistency: the plan under-promises), hedged per
 * the emergency-fund composition (applyEffectiveRateClamp + horizon-matched
 * depreciation). The working-money projections are rendered from
 * `calculateCompoundProjectionHedged` directly in the plan component (the
 * hedged engine already returns all three canonical scenarios and reads the
 * live snapshot itself).
 */
export function calculateMoneyJobsPersonalPlan(
  result: MoneyJobsPersonalResult,
  snapshot: MarketDataSnapshot
): MoneyJobsPersonalPlan | null {
  const remaining = Math.max(0, result.cushionTarget - result.cushionCurrent);
  if (remaining === 0) {
    return { cushionMonthsToTarget: 0, hedged: false };
  }
  if (result.cushionContribution <= 0) {
    return { cushionMonthsToTarget: null, hedged: false };
  }

  const locale = result.inputEcho.locale;
  const inflation = snapshot.inflationRates.rates[locale]?.average5y ?? 0;
  const currency = LOCALE_CURRENCY[locale];
  const estimatedHorizonYears = Math.min(
    PLAN_MAX_HORIZON_YEARS,
    Math.max(1, remaining / (result.cushionContribution * 12))
  );
  const depreciation = resolveHorizonMatchedDepreciation(snapshot, currency, estimatedHorizonYears);
  const conservativeUsd = SCENARIO_RATES.conservative / 100;
  const effective =
    depreciation === 0
      ? conservativeUsd
      : applyEffectiveRateClamp((1 + conservativeUsd) * (1 + depreciation) - 1, {
          source: 'calculateMoneyJobsPersonalPlan',
          usdYield: conservativeUsd,
          depreciation,
        });

  let months: number | null;
  try {
    months = monthsToInflationAdjustedTarget(
      result.cushionTarget,
      result.cushionContribution,
      effective,
      inflation,
      'end',
      result.cushionCurrent
    );
  } catch {
    months = null;
  }

  return { cushionMonthsToTarget: months, hedged: depreciation !== 0 };
}

export interface MoneyJobsBusinessPlan {
  /** Conservative-only idle-cash comparison on the IDEAL excess over 12 months.
   *  Null in runway mode (held back per decision 9) or when there is no excess. */
  readonly idleComparison: IdleCashResult | null;
}

/**
 * B2B gated plan. In runway mode the idle-cash yield comparison is HELD —
 * the plan is runway-led (decision 9); the component renders runway detail
 * from the free result instead.
 */
export function calculateMoneyJobsBusinessPlan(
  result: MoneyJobsBusinessResult,
  snapshot: MarketDataSnapshot
): MoneyJobsBusinessPlan {
  if (result.runwayMode || result.excessIdeal <= 0) {
    return { idleComparison: null };
  }
  const locale = result.inputEcho.locale;
  const idleComparison = calculateIdleCashYield(
    {
      idleCash: result.excessIdeal,
      years: 1,
      bankYieldPct: snapshot.rates.bankRates[locale]?.savings ?? 0,
      locale,
    },
    snapshot
  );
  return { idleComparison };
}
