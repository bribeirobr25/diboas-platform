/**
 * Idle Cash Yield Calculator engine (Phase 2 §2.5 extraction, 2026-05-25).
 *
 * B2B tool. Lump-sum compounding at diBoaS conservative-yield (7%) vs the
 * user's overridable bank yield, with currency hedge for non-USD locales.
 *
 * **Important (C39 close):** idle-cash uses the CONSERVATIVE 7% rate, not the
 * historical 10% used by every other hedged tool. This is deliberate — B2B
 * treasury-reserve framing prefers the most cautious of the three scenarios.
 *
 * idle-cash deliberately does NOT route through `calculateCompoundProjectionHedged`
 * (with cadence `oneTime`) because the compound engine doesn't expose
 * (a) conservative-as-default + (b) user-overridable bank yield cleanly.
 * Phase 7 §7.4 ships a contract test pinning that USD output here equals the
 * compound engine's `oneTime` USD output at the same conservative rate, so
 * any divergence is detectable.
 *
 * SDK readiness: consumes `MarketDataSnapshot`.
 */

import {
  calculateLumpSum,
  calculateWithCurrencyHedge,
  resolveHorizonMatchedDepreciation,
} from '@/lib/market-data/formulas';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import type { MarketDataSnapshot } from '@/lib/market-data/types';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import type { SupportedLocale } from '@diboas/i18n/config';

/** Conservative scenario (7%) — see file header for rationale. */
export const IDLE_CASH_SCENARIO_USD_PERCENT = SCENARIO_RATES.conservative;

export interface IdleCashInput {
  readonly idleCash: number;
  readonly years: number;
  /** Bank yield as a PERCENT (e.g. 0.38 for 0.38%, not 0.0038). */
  readonly bankYieldPct: number;
  readonly locale: SupportedLocale;
}

export interface IdleCashResult {
  readonly bankFV: number;
  readonly bankGain: number;
  readonly diboasFV: number;
  readonly diboasGain: number;
  /** diboasFV − bankFV. Can be NEGATIVE when bank rate exceeds diBoaS hedged
   * conservative rate for this horizon (C37 — copy must branch on sign). */
  readonly difference: number;
  /** True if non-USD locale → hedge applied to diBoaS line */
  readonly hedged: boolean;
}

export function calculateIdleCashYield(
  input: IdleCashInput,
  snapshot: MarketDataSnapshot
): IdleCashResult | null {
  if (input.idleCash <= 0 || input.years <= 0) return null;
  const localeCurrency = LOCALE_CURRENCY[input.locale];
  const depreciation = resolveHorizonMatchedDepreciation(snapshot, localeCurrency, input.years);

  // Bank stays nominal in local currency.
  const bankFV = calculateLumpSum(
    input.idleCash,
    input.bankYieldPct / 100,
    0,
    input.years
  ).nominalFV;

  // diBoaS uses currency hedge for non-USD locales.
  const diboasFV =
    depreciation > 0
      ? calculateWithCurrencyHedge(
          input.idleCash,
          IDLE_CASH_SCENARIO_USD_PERCENT / 100,
          depreciation,
          0,
          input.years
        ).nominalFV
      : calculateLumpSum(input.idleCash, IDLE_CASH_SCENARIO_USD_PERCENT / 100, 0, input.years)
          .nominalFV;

  return {
    bankFV,
    bankGain: bankFV - input.idleCash,
    diboasFV,
    diboasGain: diboasFV - input.idleCash,
    difference: diboasFV - bankFV,
    hedged: depreciation > 0,
  };
}
