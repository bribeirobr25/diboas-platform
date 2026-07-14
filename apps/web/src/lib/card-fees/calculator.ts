/**
 * Card processing fee math for the Phase 6E.1 B2B Card Fee Savings tool.
 *
 * Customers running ~$X/month in card volume pay their processor a % cut.
 * The year-1 savings projection is that processor cut net of diBoaS's own
 * 0.48% Add Money movement fee (FEES.md), so it reflects the realistic net
 * rather than the gross processor cut.
 *
 * Caveat (per plan §6E.1): "Real savings depend on your customer mix; this
 * is an upper-bound estimate." The tool's UI surfaces this verbatim.
 */

/**
 * diBoaS Add Money movement fee — FEES.md (0.48%, B2B: no cap).
 * Mirrors FALLBACK_MARKET_DATA.platformFees.deposit.rate (0.0048).
 */
export const DIBOAS_MOVEMENT_FEE_RATE = 0.0048;

export interface CardFeeProjection {
  /** Annual fee paid to the current processor at the user's volume + rate. */
  readonly annualFeePaid: number;
  /** Monthly fee at the same volume + rate. */
  readonly monthlyFeePaid: number;
  /** Modeled diBoaS savings — net of diBoaS's own 0.48% Add Money movement fee. */
  readonly annualSavingsWithDiboas: number;
  /** Implied per-transaction fee, when avgTransactionAmount is provided. */
  readonly perTransactionFee?: number;
}

/**
 * Project the year-1 processor fee + diBoaS savings.
 *
 * @param monthlyVolume Monthly card-payment volume in the merchant's currency.
 * @param processorFeeRate Decimal rate (e.g. 0.029 for 2.9%).
 * @param avgTransactionAmount Optional — yields per-tx fee if provided.
 */
export function projectCardFeeSavings(
  monthlyVolume: number,
  processorFeeRate: number,
  avgTransactionAmount?: number
): CardFeeProjection {
  if (monthlyVolume < 0) throw new Error('monthlyVolume must be >= 0');
  if (processorFeeRate < 0) throw new Error('processorFeeRate must be >= 0');

  const monthlyFeePaid = monthlyVolume * processorFeeRate;
  const annualFeePaid = monthlyFeePaid * 12;
  // Net of diBoaS's own Add Money movement fee (FEES.md: 0.48%, B2B no cap).
  const diboasMovementFee = monthlyVolume * 12 * DIBOAS_MOVEMENT_FEE_RATE;
  const annualSavingsWithDiboas = Math.max(0, annualFeePaid - diboasMovementFee);

  const projection: CardFeeProjection = {
    annualFeePaid,
    monthlyFeePaid,
    annualSavingsWithDiboas,
  };

  if (typeof avgTransactionAmount === 'number' && avgTransactionAmount > 0) {
    return { ...projection, perTransactionFee: avgTransactionAmount * processorFeeRate };
  }
  return projection;
}
