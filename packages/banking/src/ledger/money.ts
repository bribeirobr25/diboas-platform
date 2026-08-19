import Decimal from 'decimal.js';

/** Shared Decimal helpers for the ledger modules (strings at boundaries, Decimal inside). */
export const ZERO = new Decimal(0);

export function d(value: string): Decimal {
  return new Decimal(value);
}
