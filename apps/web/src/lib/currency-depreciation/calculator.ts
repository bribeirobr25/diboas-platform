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
import { getIntlLocale } from '@/config/formats';
import { formatPercent } from '@diboas/format';
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
  /** ISO anchor dates of the locked historical window (Data Vintage P-6):
   *  the UI derives its "Now (<month year>)" label and "<n> years" span from
   *  these instead of hardcoding dates that rot when the series appends. */
  readonly anchorStart: string;
  readonly anchorEnd: string;
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

/**
 * 5.848: the "change in USD purchasing power" card's figure, signed by the value.
 * A loss (the currency fell against the dollar) reads "−18%"; a gain reads "+5%";
 * the sign never doubles ("−-22%" was shown while the EUR anchors were inverted).
 * Rounds to whole percent, as the card always has (locale formatting is `5.820`).
 */
export function formatRetrospectiveChange(
  percentLossInUsdTerms: number,
  locale: SupportedLocale
): string {
  const rounded = Math.round(Math.abs(percentLossInUsdTerms));
  // PCT-1: "18%" in every locale, so the shared formatter, never Intl's percent style.
  const figure = formatPercent(rounded / 100, getIntlLocale(locale), { maximumFractionDigits: 0 });
  if (rounded === 0) return figure;
  return `${percentLossInUsdTerms > 0 ? '−' : '+'}${figure}`;
}

/**
 * A plain number in the reader's locale (5.848 / 5.820 carve-out): the retrospective
 * card's exchange rates and yearly change were written with `toFixed`, so a German
 * reader saw "0.70" and "1.23%" instead of "0,70" and "1,23".
 */
export function formatRetrospectiveNumber(
  value: number,
  locale: SupportedLocale,
  digits = 2
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * The euro's retrospective anchors were inverted until 2026-11 (5.848). Decision B-13
 * (DR-2026-11-10): a dated correction note under the euro's result for four weeks. The
 * note hides itself after `showUntil`; the register row closes when this constant and
 * the note are deleted. `correctedOn` is the month the note names.
 */
export const EUR_ANCHOR_CORRECTION = {
  correctedOn: '2026-11-10',
  showUntil: '2026-12-14',
} as const;

export function showsAnchorCorrection(currency: string, todayIso: string): boolean {
  return currency === 'EUR' && todayIso.slice(0, 10) <= EUR_ANCHOR_CORRECTION.showUntil;
}

export function calculateCurrencyDepreciationRetrospective(
  input: CurrencyDepreciationRetrospectiveInput,
  snapshot: MarketDataSnapshot
): CurrencyDepreciationRetrospectiveResult | null {
  if (input.amount <= 0) return null;
  if (input.currency === 'USD') return null;
  // Same C42-pattern guard: protect against partial provider responses. The
  // anchor dates travel with the rate endpoints (D4: the historical* fields
  // ship as a complete set or not at all), so they join the guard.
  const currencyRate = snapshot.exchangeRates.rates[input.currency];
  if (
    !currencyRate?.historicalRateStart ||
    !currencyRate?.historicalRateEnd ||
    !currencyRate?.historicalAnchorStart ||
    !currencyRate?.historicalAnchorEnd
  ) {
    return null;
  }
  const usdValueThen = input.amount / currencyRate.historicalRateStart;
  const usdValueNow = input.amount / currencyRate.historicalRateEnd;
  const percentLossInUsdTerms = (1 - usdValueNow / usdValueThen) * 100;
  // 5.854: the yearly rate is computed from the same two rates the card shows (the stored
  // figure was an ECB endpoint calculation on another basis, so "1.23%" sat beside rates
  // implying 1.22%). Positive = the currency weakened against the dollar.
  const years =
    (Date.parse(currencyRate.historicalAnchorEnd) -
      Date.parse(currencyRate.historicalAnchorStart)) /
    (365.25 * 86_400_000);
  const historicalCagr =
    years > 0
      ? Math.pow(currencyRate.historicalRateEnd / currencyRate.historicalRateStart, 1 / years) - 1
      : 0;
  return {
    usdValueThen,
    usdValueNow,
    percentLossInUsdTerms,
    historicalCagr,
    rateStart: currencyRate.historicalRateStart,
    rateEnd: currencyRate.historicalRateEnd,
    anchorStart: currencyRate.historicalAnchorStart,
    anchorEnd: currencyRate.historicalAnchorEnd,
  };
}
