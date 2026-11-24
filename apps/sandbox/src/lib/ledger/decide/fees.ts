/**
 * S1a (plan P12, D8): the network fee's single rounding and the entry split, defined ONCE.
 *
 * The home is provisional: ARCHITECTURE §8.1 gives fee computation to `packages/banking`, and the
 * migration plan (`5.1011`) may move these there. Moved without changing what they compute.
 */
import Decimal from 'decimal.js';

/**
 * A network fee as the LEDGER books it: whole cents, quantized ONCE. Every path that shows or
 * books a network fee goes through here (FC-15: the confirmation surface IS the transaction,
 * to its last cent; 4,257 of 1,080,080 fee × gross combinations disagreed before this existed).
 */
export function feeInCents(networkFeeLocal: number): Decimal {
  return new Decimal(networkFeeLocal).toDecimalPlaces(2);
}

/**
 * The committed total and its MODELLED network fee, both to the cent. `5.403`: `invested ===
 * total` (the fee is shown separately, deducted from nothing); the fee is clamped to the total
 * so a modelled cost is never reported as larger than the move it describes.
 */
export function splitEntry(
  totalFromCash: number,
  networkFeeLocal: number
): { total: Decimal; fee: Decimal; invested: Decimal } {
  const total = new Decimal(totalFromCash).toDecimalPlaces(2);
  const fee = Decimal.min(feeInCents(networkFeeLocal), total);
  return { total, fee, invested: total };
}
