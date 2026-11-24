/**
 * S1a (plan P12, D8): the network fee's single rounding and the entry split, defined ONCE.
 *
 * The home is provisional: ARCHITECTURE §8.1 gives fee computation to `packages/banking`, and the
 * migration plan (`5.1011`) may move these there. Moved without changing what they compute.
 */
import Decimal from 'decimal.js';

/**
 * A network fee as the LEDGER books it: whole cents, quantized ONCE.
 *
 * Every path that shows or books a network fee goes through here, because two quantizations in two
 * places is how the exit preview and the ledger came to disagree. `previewExit` used to subtract
 * the UNROUNDED fee and round the net, while `StrategyExited` rounds the fee first — so at a
 * sub-cent fee the manifest stated one net and the ledger booked another, a cent apart (measured:
 * 4,257 of 1,080,080 fee × gross combinations; e.g. gross 25.00 with a 0.005 fee showed net 24.75
 * over a 0.01 fee line, and booked 24.74). FC-15's whole promise is that the confirmation surface
 * IS the transaction; that includes its last cent.
 */
export function feeInCents(networkFeeLocal: number): Decimal {
  return new Decimal(networkFeeLocal).toDecimalPlaces(2);
}

/**
 * The committed total and its MODELLED network fee, both to the cent.
 *
 * ⚑ `5.403` — this used to subtract: it returned `invested = total − fee`, and the entry event was
 * written from it, which is how a modelled Practice fee came to reduce Practice money. Under F-12
 * the fee is *"shown separately, not deducted from the Goal split"*, so **`invested === total`**:
 * all of the committed amount reaches the strategy and the fee rides alongside as information.
 * It still earns its keep: FC-15 needs the manifest and the ledger to agree to the last cent, and
 * `feeInCents` is the single rounding both come from. The fee is clamped to the total so a modelled
 * cost can never be reported as larger than the move it describes.
 */
export function splitEntry(
  totalFromCash: number,
  networkFeeLocal: number
): { total: Decimal; fee: Decimal; invested: Decimal } {
  const total = new Decimal(totalFromCash).toDecimalPlaces(2);
  const fee = Decimal.min(feeInCents(networkFeeLocal), total);
  return { total, fee, invested: total };
}
