/**
 * Card-fees lib barrel.
 *
 * Phase 2 §2.6 (2026-05-26): relocated from `lib/business/cardFees.ts` for
 * consistency with the other 5 tools' new `lib/<tool>/calculator.ts`
 * locations introduced during Phase 2.1–2.5. Math is unchanged; only the
 * file path moved + tests renamed.
 */

export { projectCardFeeSavings, type CardFeeProjection } from './calculator';
