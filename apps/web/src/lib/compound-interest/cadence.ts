/**
 * Cadence-to-monthly conversion.
 *
 * Daily uses 365 calendar days; weekly uses 52 weeks; monthly is unchanged.
 * The tooltip on the calculator's cadence selector documents this convention.
 */

import type { Cadence } from './types';

const ANNUAL_MULTIPLIERS: Readonly<Record<Cadence, number>> = {
  daily: 365,
  weekly: 52,
  monthly: 12,
};

export function convertCadenceToMonthly(amount: number, cadence: Cadence): number {
  return (amount * ANNUAL_MULTIPLIERS[cadence]) / 12;
}
