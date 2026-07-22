/**
 * diBoaS fee math — parameterized from the canonical fee schedule
 * (`docs/full-view/FEES.md`, Fee Lab v3.4). A fee value appearing as a string
 * literal in a component is a bug by definition (SANDBOX_RULES R-3); every
 * display flows from these constants through locale-aware formatters.
 *
 * All money math uses Decimal.js (the standing mandate) — never float
 * arithmetic on amounts.
 */

import Decimal from 'decimal.js';

export type FeeCurrency = 'USD' | 'BRL' | 'EUR';

/** Canonical rates (FEES.md). */
export const FEE_RATES = {
  /** Add Money / Cash Out ramp fee. */
  ramp: new Decimal('0.0048'),
  /** Sell / Close + Strategy Exit execution fee. */
  exit: new Decimal('0.0039'),
  /** Buy / Invest, Send, Swap, Bridge, Strategy Entry: FREE. */
  free: new Decimal('0'),
} as const;

/** B2C Add Money / Cash Out cap per market currency (B2B: no cap). */
export const RAMP_FEE_CAP_B2C: Record<FeeCurrency, Decimal> = {
  USD: new Decimal('250'),
  EUR: new Decimal('250'),
  BRL: new Decimal('250'),
};

/** Strategy Exit / Sell floor and cap per market currency. */
export const EXIT_FEE_FLOOR: Record<FeeCurrency, Decimal> = {
  USD: new Decimal('0.25'),
  EUR: new Decimal('0.25'),
  BRL: new Decimal('0.25'),
};
export const EXIT_FEE_CAP: Record<FeeCurrency, Decimal> = {
  USD: new Decimal('25'),
  EUR: new Decimal('25'),
  BRL: new Decimal('25'),
};

export type AccountMode = 'b2c' | 'b2b';

/** Add Money fee: 0.48%, B2C capped per currency, B2B uncapped. */
export function computeAddMoneyFee(
  amount: Decimal.Value,
  currency: FeeCurrency,
  mode: AccountMode = 'b2c'
): Decimal {
  const raw = new Decimal(amount).mul(FEE_RATES.ramp);
  if (mode === 'b2b') return raw.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  return Decimal.min(raw, RAMP_FEE_CAP_B2C[currency]).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Strategy Exit fee: 0.39% with per-currency floor and cap. */
export function computeExitFee(amount: Decimal.Value, currency: FeeCurrency): Decimal {
  const raw = new Decimal(amount).mul(FEE_RATES.exit);
  const floored = Decimal.max(raw, EXIT_FEE_FLOOR[currency]);
  return Decimal.min(floored, EXIT_FEE_CAP[currency]).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Strategy Entry is FREE (FEES.md) — expressed as a function so call sites read uniformly. */
export function computeStrategyEntryFee(): Decimal {
  return new Decimal(0);
}
