/**
 * CalculatorVignettes — the Talk 1 vignette rate (register `5.648`).
 *
 * The founder's Option A (2026-07-14) sets the Beat 2 vignettes to the CONSERVATIVE 7%
 * scenario. Tracked docs said 10% for months, so a reader could "fix" the code back to the
 * historical rate. This test pins the RENDERED twelve-year figure to the conservative
 * scenario and proves it differs from the historical one, so the assertion cannot pass
 * by accident if the two rates ever coincide.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { calculateMonthlyContributions } from '@/lib/market-data';
import { formatCurrency, SCENARIO_RATES } from '@/lib/compound-interest';

const YEARLY_AMOUNTS = ['1800', '2080', '300'];

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    locale: 'en',
    formatMessage: ({ id }: { id: string }) => {
      const match = id.match(/vignettes\.(\d)\.yearlyAmount$/);
      return match ? YEARLY_AMOUNTS[Number(match[1])] : id;
    },
  }),
}));

import { CalculatorVignettes } from '../variants/CalculatorDefault/CalculatorVignettes';

const twelveYear = (yearly: string, ratePercent: number) => {
  const fv = calculateMonthlyContributions(
    Number(yearly) / 12,
    ratePercent / 100,
    0,
    144
  ).nominalFV;
  return `~${formatCurrency(Math.round(fv / 10) * 10, 'en', { maximumFractionDigits: 0 })}`;
};

describe('CalculatorVignettes', () => {
  it('should render every twelve-year figure at the conservative rate when Option A applies', () => {
    render(<CalculatorVignettes />);
    const cells = screen.getAllByRole('cell').filter((_, i) => i % 2 === 1);
    expect(cells.map((cell) => cell.textContent)).toEqual(
      YEARLY_AMOUNTS.map((yearly) => twelveYear(yearly, SCENARIO_RATES.conservative))
    );
  });

  it('should differ from the historical rate when the rates are distinct', () => {
    expect(SCENARIO_RATES.conservative).not.toBe(SCENARIO_RATES.historical);
    render(<CalculatorVignettes />);
    const cells = screen.getAllByRole('cell').filter((_, i) => i % 2 === 1);
    expect(cells.map((cell) => cell.textContent)).not.toEqual(
      YEARLY_AMOUNTS.map((yearly) => twelveYear(yearly, SCENARIO_RATES.historical))
    );
  });
});
