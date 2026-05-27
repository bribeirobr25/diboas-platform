/**
 * Currency Depreciation Calculator engine (Phase 2 §2.4 extraction, 2026-05-25).
 *
 * Two modes:
 *   - Forward: 3 outcomes (cash idle / bank local / digital-dollar hedged).
 *     Uses `resolveHorizonMatchedDepreciation` — a horizon-matched CAGR from
 *     `monthlySeries.fx[currency]`.
 *   - Retrospective: 2010 → 2026 USD-equivalent comparison. Uses the locked
 *     `historicalRateStart` / `historicalRateEnd` anchor pair from Phase A.
 *
 * **Important (C28):** the two modes deliberately use DIFFERENT depreciation
 * sources. Forward needs a horizon-matched CAGR (the relevant trailing window
 * for the chosen horizon). Retrospective uses the fixed Jan-2010 → now anchor
 * pair (exact endpoints, not a derived CAGR). The dual-source asymmetry is
 * documented + intentional; Phase 5 §5.5 adds copy to explain it to users.
 *
 * R1 discipline: forward and retrospective ship as TWO functions, not a flag.
 *
 * SDK readiness: consumes `MarketDataSnapshot`.
 */

import {
  applyEffectiveRateClamp,
  calculateLumpSum,
  calculateWithCurrencyHedge,
  resolveHorizonMatchedDepreciation,
} from '@/lib/market-data/formulas';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import type { SupportedLocale } from '@diboas/i18n/config';

export const CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT = SCENARIO_RATES.historical;

/**
 * Currencies offered. FX-16 adoption 2026-05-26 (Bar D1+D8) expanded the set
 * from 3 (USD/BRL/EUR) to 17 (USD + 16 from FX model §6). ARS/CLP/COP excluded
 * per the model's hyperinflation/multi-regime gate. The string-literal union
 * `CurrencyDepreciationOption` derives from this `as const` tuple for
 * compile-time exhaustiveness (D9 / Q1).
 */
export const CURRENCY_DEPRECIATION_OPTIONS = [
  'USD',
  'BRL',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'INR',
  'MXN',
  'ZAR',
  'KRW',
  'SGD',
  'HKD',
  'AED',
  'ILS',
  'CHF',
  'PLN',
] as const;
export type CurrencyDepreciationOption = (typeof CURRENCY_DEPRECIATION_OPTIONS)[number];

/**
 * Maps a currency to a representative locale for the bank-rate proxy. Only the
 * 3 currencies with a `LOCALE_CURRENCY` mapping get a locale; the 14 new
 * currencies return `undefined` → `getBankRateForCurrency` returns `null` →
 * bank card hides (D3 / "hide the bank card entirely; no fake fallback rate").
 */
export const CURRENCY_TO_LOCALE: Partial<Record<CurrencyDepreciationOption, SupportedLocale>> = {
  USD: 'en',
  BRL: 'pt-BR',
  EUR: 'de',
};

/**
 * Resolves the bank-rate proxy for a currency. Returns `null` when no local
 * bank rate is available (the 14 FX-16 currencies). Consumers MUST handle
 * `null` — TypeScript compile-time guarantees it.
 */
export function getBankRateForCurrency(
  currency: CurrencyDepreciationOption,
  snapshot: MarketDataSnapshot
): number | null {
  const locale = CURRENCY_TO_LOCALE[currency];
  if (!locale) return null;
  const rate = snapshot.rates.bankRates[locale]?.savings;
  return typeof rate === 'number' ? rate : null;
}

export interface CurrencyDepreciationForwardInput {
  readonly amount: number;
  readonly years: number;
  readonly currency: CurrencyDepreciationOption;
}

export interface CurrencyDepreciationRetrospectiveInput {
  readonly amount: number;
  readonly currency: CurrencyDepreciationOption;
}

export interface CurrencyDepreciationForwardResult {
  readonly cashUsdEquivalent: number;
  readonly bankLocal: number;
  readonly usdcLocal: number;
  readonly diboasGain: number;
  /** Effective depreciation used (horizon-matched). 0 for USD locale. */
  readonly depreciation: number;
  /**
   * Bank rate used (percent, NOT decimal) — for display.
   * `null` for the 14 FX-16 currencies that have no `LOCALE_CURRENCY` mapping
   * (FX-16 D3 / hide-bank-card rule). Components MUST handle null.
   */
  readonly bankRatePercent: number | null;
}

export interface CurrencyDepreciationRetrospectiveResult {
  readonly usdValueThen: number;
  readonly usdValueNow: number;
  readonly percentLossInUsdTerms: number;
  readonly historicalCagr: number;
  readonly rateStart: number;
  readonly rateEnd: number;
}

export function calculateCurrencyDepreciationForward(
  input: CurrencyDepreciationForwardInput,
  snapshot: MarketDataSnapshot
): CurrencyDepreciationForwardResult | null {
  if (input.amount <= 0 || input.years <= 0) return null;
  // FX-16 D3 (2026-05-26): `getBankRateForCurrency` returns null for the 14
  // new currencies (no LOCALE_CURRENCY mapping). The bank-card UI hides on
  // null per the "hide the bank card entirely" rule. Forward math still runs;
  // we pass 0 to `calculateLumpSum` here so `bankLocal` is a deterministic
  // zero — the component checks `bankRatePercent === null` (via the helper)
  // to decide whether to render the bank card at all.
  const bankRate = getBankRateForCurrency(input.currency, snapshot);
  const rawDepreciation = resolveHorizonMatchedDepreciation(snapshot, input.currency, input.years);
  // C3 / FX-16 audit §6.1 fix (2026-05-26): clamp the FX rate before the
  // `Math.pow(1 + d, years)` divide. For calibrated inputs the worst case is
  // ZAR at +4.73% (depreciation) and CHF at -1.79% (appreciation) — far from
  // the EFFECTIVE_RATE_FLOOR boundary. The clamp is a defensive guard for
  // future bad rates / fat-finger constants so a `depreciation <= -1` cannot
  // silently produce NaN/Infinity via `Math.pow(0, n)` or `Math.pow(<0, n)`.
  // Reuses the EFFECTIVE_RATE_FLOOR (-0.99) for taxonomy consistency with
  // every other hedge site (compound, retirement, goal-savings, emergency-fund,
  // time-to-target, idle-cash). The observability event fires on clamp.
  const depreciation = applyEffectiveRateClamp(rawDepreciation, {
    source: 'currencyDepreciation.forward',
    usdYield: CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT / 100,
    depreciation: rawDepreciation,
  });

  const cashUsdEquivalent = input.amount / Math.pow(1 + depreciation, input.years);
  const effectiveBankRate = bankRate ?? 0;
  const bankLocal = calculateLumpSum(
    input.amount,
    effectiveBankRate / 100,
    0,
    input.years
  ).nominalFV;
  const usdcResult = calculateWithCurrencyHedge(
    input.amount,
    CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT / 100,
    depreciation,
    0,
    input.years
  );

  return {
    cashUsdEquivalent,
    bankLocal,
    usdcLocal: usdcResult.nominalFV,
    diboasGain: usdcResult.nominalFV - input.amount,
    depreciation,
    // Null for currencies without a bank-rate proxy (FX-16 D3); UI hides the
    // bank card on null. Components MUST handle null — type-checked.
    bankRatePercent: bankRate,
  };
}

export function calculateCurrencyDepreciationRetrospective(
  input: CurrencyDepreciationRetrospectiveInput,
  snapshot: MarketDataSnapshot
): CurrencyDepreciationRetrospectiveResult | null {
  if (input.amount <= 0) return null;
  if (input.currency === 'USD') return null;
  // Same C42-pattern guard: protect against partial provider responses.
  const currencyRate = snapshot.exchangeRates.rates[input.currency];
  if (!currencyRate?.historicalRateStart || !currencyRate?.historicalRateEnd) return null;
  const usdValueThen = input.amount / currencyRate.historicalRateStart;
  const usdValueNow = input.amount / currencyRate.historicalRateEnd;
  const percentLossInUsdTerms = (1 - usdValueNow / usdValueThen) * 100;
  return {
    usdValueThen,
    usdValueNow,
    percentLossInUsdTerms,
    historicalCagr: currencyRate.historicalCagr ?? 0,
    rateStart: currencyRate.historicalRateStart,
    rateEnd: currencyRate.historicalRateEnd,
  };
}
