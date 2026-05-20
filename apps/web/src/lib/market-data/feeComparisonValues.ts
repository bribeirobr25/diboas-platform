/**
 * Fee-comparison + paragraph fee-citation values for landing-page translation keys.
 *
 * Resolves the ICU slot values consumed by:
 *   - FeeTable (B2C `fees.rows.*` + B2B `fees.rows.*` rows)
 *   - ProseSection (B2C `catch.paragraphs.p5` — en/es/de only; pt-BR deferred)
 *   - FAQAccordionFactory (PR-3: landing-help; PR-5: landing-b2c + landing-b2b FAQ)
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
  locale: SupportedLocale,
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
  locale: SupportedLocale,
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

  // B2C catch.paragraphs.p5 (en/es/de only; pt-BR p4 carries the fee citation
  // and stays hardcoded — see CC8 Option C carry-forward).
  if (locale !== 'pt-BR') {
    map.set('landing-b2c.catch.paragraphs.p5', {
      sellRate: formatRate(fees.sell.rate * 100, locale),
      maxFee: formatCurrency(fees.sell.maxFee, locale, { maximumFractionDigits: 0 }),
    });
  }

  // landing-help FAQ paragraphs (PR-3 — rendered via /help topics).
  map.set('landing-help.topics.moneySafety.questions.q2.answer', {
    rate: formatRate(fees.cashOut.rate * 100, locale),
  });
  map.set('landing-help.topics.feesCosts.questions.q2.answer', {
    sellRate: formatRate(fees.sell.rate * 100, locale),
    cashOutRate: formatRate(fees.cashOut.rate * 100, locale),
  });

  return map;
}
