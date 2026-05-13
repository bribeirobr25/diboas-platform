/**
 * Contract test — pins the exact call shape into calculateMonthlyContributions
 * from lib/market-data/formulas.ts.
 *
 * Without this test, a refactor to the upstream formula signature could silently
 * break the calculator (the runtime would still execute but produce wrong values
 * if positional argument meaning changed). This test fails loudly the moment
 * the contract drifts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted lifts this assignment to the top of the module before any imports
// run, so it's available when the vi.mock factory below executes.
type CalculateMonthlyContributions = (
  monthlyPayment: number,
  annualRate: number,
  annualInflation: number,
  months: number,
) => {
  totalDeposited: number;
  nominalFV: number;
  realFV: number;
  nominalGain: number;
  realGain: number;
};

const { calculateMonthlyContributionsMock } = vi.hoisted(() => ({
  calculateMonthlyContributionsMock: vi.fn<CalculateMonthlyContributions>(() => ({
    totalDeposited: 0,
    nominalFV: 1000,
    realFV: 1000,
    nominalGain: 0,
    realGain: 0,
  })),
}));

vi.mock('@/lib/market-data/formulas', () => ({
  calculateMonthlyContributions: calculateMonthlyContributionsMock,
}));

import { calculateCompoundProjection } from '../calculator';

beforeEach(() => {
  calculateMonthlyContributionsMock.mockClear();
});

describe('formulas.ts contract', () => {
  it('should call calculateMonthlyContributions with positional args (monthlyPayment, decimal annualRate, 0 inflation, months)', () => {
    calculateCompoundProjection({
      amount: 5,
      cadence: 'daily',
      years: 1,
      locale: 'en',
    });
    expect(calculateMonthlyContributionsMock.mock.calls.length).toBeGreaterThan(0);

    const historicalCall = calculateMonthlyContributionsMock.mock.calls.find(
      (c) => c[1] === 0.1,
    );
    expect(historicalCall).toBeDefined();
    expect(historicalCall![1]).toBe(0.1);
    expect(historicalCall![2]).toBe(0);
    expect(historicalCall![3]).toBe(12);
  });

  it('should pass conservative rate as 0.07 decimal', () => {
    calculateCompoundProjection({ amount: 5, cadence: 'daily', years: 1, locale: 'en' });
    expect(
      calculateMonthlyContributionsMock.mock.calls.find((c) => c[1] === 0.07),
    ).toBeDefined();
  });

  it('should pass optimistic rate as 0.14 decimal', () => {
    calculateCompoundProjection({ amount: 5, cadence: 'daily', years: 1, locale: 'en' });
    expect(
      calculateMonthlyContributionsMock.mock.calls.find((c) => c[1] === 0.14),
    ).toBeDefined();
  });

  it('should never pass non-zero inflation when computing scenarios', () => {
    calculateCompoundProjection({ amount: 5, cadence: 'daily', years: 5, locale: 'en' });
    calculateMonthlyContributionsMock.mock.calls.forEach((call) => {
      expect(call[2]).toBe(0);
    });
  });

  it('should multiply year by 12 for the months argument', () => {
    calculateCompoundProjection({ amount: 5, cadence: 'daily', years: 5, locale: 'en' });
    const monthsArgs = calculateMonthlyContributionsMock.mock.calls.map((c) => c[3]);
    [12, 24, 36, 48, 60].forEach((m) => {
      expect(monthsArgs).toContain(m);
    });
  });
});
