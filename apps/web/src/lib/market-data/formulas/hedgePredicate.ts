/**
 * When a figure is hedged (market clean-up C2-S G3, register `5.933`).
 *
 * A diBoaS scenario is computed in US dollars; for another currency the figure combines that
 * result with the currency's move against the dollar (the "hedge"), and the tool marks it. Five
 * sites decided this four different ways (`> 0`, `=== 0`, `!== 0`, `!== 'USD'`), so a marker and
 * its calculation could disagree (the emergency fund computed on `=== 0` but marked on `> 0`).
 * One meaning now: any finite, non-zero depreciation hedges, so a negative one (a currency that
 * strengthens against the dollar) is computed AND marked, and the clamp in the engines still
 * reports a pathological one. A currency other than the US dollar is a hedged currency.
 */

/** A figure is hedged when its depreciation is finite and not zero. */
export function isHedgedDepreciation(depreciation: number): boolean {
  return Number.isFinite(depreciation) && depreciation !== 0;
}

/** A display in this currency shows hedged figures (every currency but the US dollar). */
export function isHedgedCurrency(currency: string | undefined): boolean {
  return Boolean(currency) && currency !== 'USD';
}
