/**
 * PreDemo fee-rate display helper (Phase 7 PR-1, 2026-05-18).
 *
 * Sources the rate values rendered in `FeeBreakdown` fee labels from
 * `marketDataService` (canonical). Phase 8 Item E (2026-05-20) closed the
 * remaining duplication on the calculation side — `calculations.ts` now
 * also derives fee values from `marketDataService.getSync()` via
 * `resolveFeeRates()`. Display + calculation pipelines now share the same
 * canonical source. Pre-demo-specific scenario constants (xautSwapGas,
 * xautLp, defaultRate) remain local in `PRE_DEMO_BUY_EXTRAS`.
 *
 * Audit trail: `docs/audit/PHASE_7_AUDIT.md` PR-1 + Phase 8 Followup Item E.
 */

import { marketDataService } from '@/lib/market-data';
import type { SupportedLocale } from '@/lib/market-data/types';
import { formatRate } from '@/lib/market-data/formatters';
import { formatCurrency } from '@/lib/compound-interest';

const INTL_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  'pt-BR': 'pt-BR',
  de: 'de-DE',
  es: 'es-ES',
};

/**
 * Locale-format a decimal-fee rate with adaptive precision.
 *
 * Examples (en):
 *   0.01     → "1%"        (1% — no decimals needed)
 *   0.00001  → "0.001%"    (very small — 3 decimals)
 *   0.0025   → "0.25%"     (small — 2 decimals)
 *   0.003    → "0.3%"      (small — 2 decimals)
 *
 * `formatRate` from `lib/market-data/formatters` caps at 2 decimals; the
 * 0.001% network-fee case needs 3, so this helper does its own Intl call.
 */
function formatFeeRate(decimal: number, locale: SupportedLocale): string {
  const asPercent = decimal * 100;
  // Heuristic preserves the original translation formatting convention:
  //   - integers get 0 decimals (1% / 2%)
  //   - non-integer ≥1% gets 0-2 (trim trailing zeros so 2.5% not 2.50%)
  //   - sub-1% gets exactly 2 decimals (0.30% / 0.25% / 0.48%)
  //   - sub-0.1% gets exactly 3 decimals (0.001%)
  //   - sub-0.001% safety: 4 decimals
  let minDecimals: number;
  let maxDecimals: number;
  if (asPercent === 0) {
    minDecimals = 0;
    maxDecimals = 0;
  } else if (asPercent >= 1) {
    minDecimals = 0;
    maxDecimals = asPercent % 1 === 0 ? 0 : 2;
  } else if (asPercent >= 0.1) {
    minDecimals = 2;
    maxDecimals = 2;
  } else if (asPercent >= 0.001) {
    minDecimals = 3;
    maxDecimals = 3;
  } else {
    minDecimals = 4;
    maxDecimals = 4;
  }

  const intlLocale = INTL_LOCALE_MAP[locale] ?? 'en-US';
  const formatted = new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(asPercent);
  return `${formatted}%`;
}

/** Values resolved at render time, keyed by i18n slot name (`{rate}`/`{min}`/`{max}`). */
export interface PreDemoFeeRateValues {
  paymentProcessor: { rate: string };
  networkFee: { rate: string };
  crossChainSwap: { rate: string };
  btcMinerFee: { rate: string };
  issuerMintRedemption: { rate: string };
  diboasFeeDeposit: { rate: string; min: string; max: string };
}

/**
 * Resolve all fee-rate display values for the given locale.
 *
 * Each entry maps an i18n key family (e.g., `preDemo.fees.paymentProcessor`)
 * to the values that should be injected into the message template. Values
 * are sourced live from `marketDataService.getSync()` so a future swap
 * to live data flows through transparently.
 */
export function getPreDemoFeeRateValues(locale: SupportedLocale): PreDemoFeeRateValues {
  const snapshot = marketDataService.getSync();
  const tp = snapshot.thirdPartyFees;
  const deposit = snapshot.platformFees.deposit;

  return {
    paymentProcessor: { rate: formatFeeRate(tp.paymentProcessor, locale) },
    networkFee: { rate: formatFeeRate(tp.networkFee, locale) },
    crossChainSwap: { rate: formatFeeRate(tp.crossChainSwap, locale) },
    btcMinerFee: { rate: formatFeeRate(tp.btcMiner, locale) },
    issuerMintRedemption: { rate: formatFeeRate(tp.xautIssuer, locale) },
    diboasFeeDeposit: {
      // formatRate accepts the rate IN PERCENT UNITS (e.g. 0.48 → "0.48%"),
      // while platformFees.deposit.rate is stored as a decimal (e.g. 0.0048).
      // Multiply by 100 before passing — same convention as formatFeeRate above.
      rate: formatRate(deposit.rate * 100, locale),
      min: formatCurrency(deposit.minFee, locale, { maximumFractionDigits: 2 }),
      max: formatCurrency(deposit.maxFee, locale, { maximumFractionDigits: 0 }),
    },
  };
}
