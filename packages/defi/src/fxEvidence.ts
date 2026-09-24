/**
 * FX — its own evidence class, separated from crypto price.
 *
 * ⚑ THE CONFLATION THIS ENDS. Canon separates the classes explicitly:
 *
 * ```text
 * FX  ≠  CRYPTO PRICE  ≠  DEFI APY/RATE  ≠  NETWORK COST  ≠  HISTORICAL
 * ```
 *
 * The repository obtained FX by asking the PRICE provider for an asset already
 * denominated in the display currency (`vs_currency = usd|brl|eur`). That is a
 * price, not a rate: no FX value is ever returned, stamped, bounded or aged, so
 * nothing could state its provenance or refuse it independently.
 *
 * ⚑ AND THE RATE IS NOT DERIVED BY DIVISION. Dividing two denominated prices
 * to manufacture a rate would be a FABRICATED FX observation — the plan
 * prohibits it by name. Where no eligible source supplies a rate, the honest
 * answer is CONTROLLED UNAVAILABLE, which is what this module returns.
 *
 * ⚑ WHAT THIS DOES NOT DO. It selects no provider and activates nothing. It
 * gives FX a contract so that the day an eligible rate source is cleared, the
 * change is an adapter behind this shape rather than a new Product path.
 */

import type { UnavailableReason } from './evidence';
import { FIXTURE_FX_FROM_USD, FIXTURE_STAMP } from './fixtures';
import type { DataStamp, DisplayCurrency } from './types';

/**
 * What the rate actually IS.
 *
 * ⚑ The distinction is the point. An observed FX rate and a diBoaS-authored
 * reference constant are different evidence, and a surface that shows one must
 * not be able to claim the other.
 */
export type FxBasis =
  /** A rate quoted as a rate by a source cleared to supply it. */
  | 'OBSERVED_RATE'
  /** diBoaS-authored reference conversion. Honest, and not an observation. */
  | 'REFERENCE_CONSTANT';

export interface FxEvidence {
  readonly from: 'USD';
  readonly to: DisplayCurrency;
  /** Units of `to` per one unit of `from`. */
  readonly rate: number;
  readonly basis: FxBasis;
  readonly stamp: DataStamp;
}

export type FxResult =
  | { readonly available: true; readonly evidence: FxEvidence }
  | { readonly available: false; readonly reason: UnavailableReason };

export function fxUnavailable(reason: UnavailableReason): FxResult {
  return { available: false, reason };
}

/**
 * The documented reference conversion.
 *
 * Truthful by construction: it carries `FIXTURE_STAMP`, so it is MODELLED with
 * `fallbackUsed` set and dated to when the set was documented — it cannot be
 * mistaken for a live rate by anything that reads the stamp.
 */
export function fxReference(to: DisplayCurrency): FxResult {
  const rate = FIXTURE_FX_FROM_USD[to];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return fxUnavailable('NO_OBSERVATION');
  }
  return {
    available: true,
    evidence: { from: 'USD', to, rate, basis: 'REFERENCE_CONSTANT', stamp: FIXTURE_STAMP },
  };
}

/**
 * The current-facing FX rate from a cleared rate source.
 *
 * ⚑ THERE IS NO SUCH SOURCE TODAY, and this states it rather than hiding it.
 * The ratified plan's disposition for FX is explicit: no eligible current
 * source supplies an FX RATE, so a rate asked for as a rate is CONTROLLED
 * UNAVAILABLE. When one is cleared, it arrives as an adapter behind this
 * function — not as a new Product path, and not by dividing prices.
 */
export function fxObservedRate(_to: DisplayCurrency): FxResult {
  return fxUnavailable('NO_OBSERVATION');
}
