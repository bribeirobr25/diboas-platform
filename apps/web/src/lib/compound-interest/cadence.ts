/**
 * Cadence-to-monthly conversion.
 *
 * Daily uses 365 calendar days; weekly uses 52; monthly = 12; quarterly = 4;
 * semi-annual = 2; yearly = 1. `oneTime` is a sentinel — it has no recurring
 * monthly equivalent; callers must branch on `isOneTime(c)` and use a lump-sum
 * compounding path instead.
 */

import type { Cadence } from './types';

const ANNUAL_MULTIPLIERS: Readonly<Record<Cadence, number>> = {
  oneTime: 0,
  daily: 365,
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  semiAnnual: 2,
  yearly: 1,
};

export function isOneTime(cadence: Cadence): cadence is 'oneTime' {
  return cadence === 'oneTime';
}

export function convertCadenceToMonthly(amount: number, cadence: Cadence): number {
  if (isOneTime(cadence)) return 0;
  return (amount * ANNUAL_MULTIPLIERS[cadence]) / 12;
}
