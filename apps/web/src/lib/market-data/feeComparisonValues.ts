/**
 * Fee-comparison + paragraph fee-citation values for landing-page translation keys.
 *
 * Resolves the ICU slot values consumed by:
 *   - FeeTable (B2C `fees.rows.*` + B2B `fees.rows.*` rows)
 *   - ProseSection (B2C `catch.feeParagraph` — uniform across 4 locales; Phase 8 Item B)
 *   - FAQAccordionFactory (canonical `faq.items.*` keys — single source of truth
 *     per Phase 8 Item A; consumed by B2C/B2B landing + /help)
 *   - Phase 8 Item C: worked-example `{exampleFee}` slot in FAQ + catch paragraphs
 *
 * Backed by `marketDataService.getSync().platformFees` — values flow live from the
 * canonical service, so a future rate change propagates without translation edits.
 *
 * Why imports are split:
 *   - `formatRate` from `@/lib/market-data/formatters` (locale-aware percent).
 *   - `formatCurrency` from `@/lib/compound-interest` (3-arg, accepts
 *     `Intl.NumberFormatOptions`). DO NOT consolidate to `@/lib/market-data` —
 *     that barrel re-exports a 2-arg formatCurrency that hardcodes 0 decimals
 *     and applies Math.round(), which would render $0.25 as "$0" and break the
 *     minFee precision contract. Stage B PR-1 (lib/pre-demo/feeRateDisplay.ts:21)
 *     uses this same split.
 *
 * Audit trail: Phase 7 Followup PR-2 (M3 + M18 + M20 + CC5).
 */

import type { PlatformFees, SupportedLocale } from './types';
import { formatRate } from './formatters';
import { formatCurrency } from '@/lib/compound-interest';

/** Per-row slot values for the `{rate} (min {min}, max {max})` template. */
function fmtRowValues(
  fee: PlatformFees['deposit'],
  locale: SupportedLocale
): { rate: string; min: string; max: string } {
  return {
    // platformFees.*.rate is stored as a decimal (e.g. 0.0048); formatRate
    // accepts percent units, so multiply by 100.
    rate: formatRate(fee.rate * 100, locale),
    min: formatCurrency(fee.minFee, locale, { maximumFractionDigits: 2 }),
    max: formatCurrency(fee.maxFee, locale, { maximumFractionDigits: 0 }),
  };
}

/**
 * Phase 8 Item C — worked-example parameterization (carry-forward #4).
 *
 * Format a sub-unit fee for B2C $100-principal worked examples. Preserves
 * each locale's editorial convention:
 *   - en / es / de use sub-unit naming ("48 cents" / "48 céntimos" / "48 Cent")
 *   - pt-BR uses canonical BRL ("R$ 0,48") — matches existing literal style
 *
 * Inputs:
 *   principalUnits = 100 (B2C scenario uses $100 / R$100 / 100 € uniformly)
 *   rateDecimal    = e.g. 0.0048 for cashOut
 */
function formatSubUnitFee(
  principalUnits: number,
  rateDecimal: number,
  locale: SupportedLocale
): string {
  const subUnits = Math.round(principalUnits * rateDecimal * 100); // 100 * 0.0048 * 100 = 48
  switch (locale) {
    case 'en':
      return `${subUnits} cents`;
    case 'es':
      return `${subUnits} céntimos`;
    case 'de':
      return `${subUnits} Cent`;
    case 'pt-BR':
      return formatCurrency(principalUnits * rateDecimal, 'pt-BR', { maximumFractionDigits: 2 });
  }
}

/**
 * Phase 8 Item C — worked-example parameterization (carry-forward #4).
 *
 * Format a whole-unit currency fee for B2B $10k-principal worked examples.
 * Uses canonical Intl currency formatting (no decimals).
 */
function formatWholeUnitFee(
  principalUnits: number,
  rateDecimal: number,
  locale: SupportedLocale
): string {
  return formatCurrency(principalUnits * rateDecimal, locale, { maximumFractionDigits: 0 });
}

/**
 * Locale-specific principal amounts for B2B worked examples.
 * pt-BR uses R$50.000 (≈ USD 10k purchasing power in Brazil); other locales
 * use 10,000 of their local currency. These principals are EDITORIAL choices
 * — they stay literal in the translation template; only the derived fee
 * value gets parameterized.
 */
const B2B_EXAMPLE_PRINCIPAL_UNITS: Record<SupportedLocale, number> = {
  en: 10000,
  'pt-BR': 50000,
  es: 10000,
  de: 10000,
};

/**
 * Resolve all fee-citation slot values for the given locale.
 *
 * Map keyed by fully-qualified translation id; consumers pass it as the
 * `valuesByKey` arg of `useConfigTranslation` / `withTranslations`.
 *
 * Surfaces covered (Phase 7 Followup PR-2 scope):
 *   B2C — fees.rows.{adding,selling,strategies,cashout}.diboas (4 keys)
 *   B2B — fees.rows.{add,sell,cashOut}.diboas (3 keys) + fees.example (1 key)
 *   B2C — catch.paragraphs.p5 (en/es/de only; pt-BR uses p4 — deferred per CC8)
 *
 * Future entries (PR-3, PR-5) extend this builder rather than spawning new ones.
 */
export function buildAllFeeValues(
  fees: PlatformFees,
  locale: SupportedLocale
): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();

  // B2C fees.rows
  map.set('landing-b2c.fees.rows.adding.diboas', fmtRowValues(fees.deposit, locale));
  map.set('landing-b2c.fees.rows.selling.diboas', fmtRowValues(fees.sell, locale));
  map.set('landing-b2c.fees.rows.cashout.diboas', {
    rate: formatRate(fees.cashOut.rate * 100, locale),
  });
  map.set('landing-b2c.fees.rows.strategies.diboas', {
    exitRate: formatRate(fees.strategyExit.rate * 100, locale),
  });

  // B2B fees.rows
  map.set('landing-b2b.fees.rows.add.diboas', fmtRowValues(fees.deposit, locale));
  map.set('landing-b2b.fees.rows.sell.diboas', fmtRowValues(fees.sell, locale));
  map.set('landing-b2b.fees.rows.cashOut.diboas', fmtRowValues(fees.cashOut, locale));

  // B2B fees.example (only cashOut rate is parameterized; worked-example
  // numerics + competitor compares stay literal).
  map.set('landing-b2b.fees.example', {
    cashOutRate: formatRate(fees.cashOut.rate * 100, locale),
  });

  // B2C catch.feeParagraph (Phase 8 Item B — CC8 closeout). Uniform across
  // all 4 locales (no pt-BR exclusion). ProseSection injects this key at the
  // locale-specific narrative position via `feeParagraphAt`.
  map.set('landing-b2c.catch.feeParagraph', {
    sellRate: formatRate(fees.sell.rate * 100, locale),
    maxFee: formatCurrency(fees.sell.maxFee, locale, { maximumFractionDigits: 0 }),
    exampleFee: formatSubUnitFee(100, fees.sell.rate, locale),
  });

  // Phase 8 Item C (worked-example parameterization). Pre-compute fee values
  // for the $100 / $10k worked examples so a future rate change auto-recomputes
  // the displayed fee instead of leaving the literal `$0.48` / `$39` stale.
  const cashOutExampleFee = formatSubUnitFee(100, fees.cashOut.rate, locale);
  const sellB2BExampleFee = formatWholeUnitFee(
    B2B_EXAMPLE_PRINCIPAL_UNITS[locale],
    fees.sell.rate,
    locale
  );

  // Canonical FAQ items (Phase 8 Item A — single source of truth in faq.json).
  // Both render on multiple surfaces: `faq.items.withdraw.answer` flows to
  // both B2C_FAQ_ITEMS and /help moneySafety; `faq.items.catch.answer` flows
  // to B2B_FAQ_ITEMS and /help feesCosts. Single key, multiple consumers.
  map.set('faq.items.withdraw.answer', {
    rate: formatRate(fees.cashOut.rate * 100, locale),
    exampleFee: cashOutExampleFee,
  });
  map.set('faq.items.catch.answer', {
    sellRate: formatRate(fees.sell.rate * 100, locale),
    cashOutRate: formatRate(fees.cashOut.rate * 100, locale),
    sellExampleFee: sellB2BExampleFee,
  });

  return map;
}
