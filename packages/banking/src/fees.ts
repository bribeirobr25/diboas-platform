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

/** Strategy Exit / Sell floor per market currency (FE-1a: floors kept, caps removed). */
export const EXIT_FEE_FLOOR: Record<FeeCurrency, Decimal> = {
  USD: new Decimal('0.25'),
  EUR: new Decimal('0.25'),
  BRL: new Decimal('0.25'),
};

/** Minimum add-money amount per market currency (FE-1b, 2026-08-03) — a
 *  transaction minimum, not a fee floor. Bounds the exit floor's worst case
 *  to ≤2.5% of the smallest position. */
export const MIN_ADD_MONEY: Record<FeeCurrency, Decimal> = {
  USD: new Decimal('10'),
  EUR: new Decimal('10'),
  BRL: new Decimal('20'),
};

export type AccountMode = 'b2c' | 'b2b';

/** Add Money fee: 0.48%, no cap — B2C and B2B alike (FE-1/FC-13, 2026-08-03).
 *  `mode` and `currency` stay in the signature: the fee schedule is carried by a
 *  tier-capable FeePolicy (FE-1c), orthogonal to AccountMode — call sites keep
 *  passing both so a future tier can differentiate without a signature change. */
export function computeAddMoneyFee(
  amount: Decimal.Value,
  _currency: FeeCurrency,
  _mode: AccountMode = 'b2c'
): Decimal {
  return new Decimal(amount).mul(FEE_RATES.ramp).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Strategy Exit fee: 0.39% with per-currency floor — no cap (FE-1a, 2026-08-03). */
export function computeExitFee(amount: Decimal.Value, currency: FeeCurrency): Decimal {
  const raw = new Decimal(amount).mul(FEE_RATES.exit);
  return Decimal.max(raw, EXIT_FEE_FLOOR[currency]).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Strategy Entry is FREE (FEES.md) — expressed as a function so call sites read uniformly. */
export function computeStrategyEntryFee(): Decimal {
  return new Decimal(0);
}
