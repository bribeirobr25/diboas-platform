/**
 * MoneyJobsCalculator — render contract (spec §9 component rows).
 *
 * i18n is mocked to id-echo (`tools-money-jobs.headline.kicker …`), so
 * assertions target message IDs + engine-derived numbers, not copy. The
 * engines run REAL (fallback market-data snapshot) — this test locks the
 * component↔engine wiring: default split render, dignity state (F3),
 * mode toggle, business runway mode (decision 9), cash-positive coverage
 * card, and the unlock → plan path with Conservative leading (C4).
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MoneyJobsCalculator } from '../MoneyJobsCalculator';

let mockLocale = 'en';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) =>
      values ? `${id} ${JSON.stringify(values)}` : id,
  }),
}));
vi.mock('@/components/Providers', () => ({
  useLocale: () => ({ locale: mockLocale }),
}));
vi.mock('@/components/UI', () => ({
  SegmentedControl: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <div data-testid="mode-control" data-value={value}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('@/components/UI/LocaleLink', () => ({
  LocaleLink: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/hooks/useCalculatorAnalytics', () => ({ useCalculatorAnalytics: () => {} }));
vi.mock('@/hooks/useResultShare', () => ({
  useResultShare: () => ({ share: vi.fn(), copied: false }),
}));
vi.mock('../MoneyJobsGate', () => ({
  MoneyJobsGate: ({ unlocked, onUnlocked }: { unlocked: boolean; onUnlocked: () => void }) =>
    unlocked ? null : (
      <button type="button" data-testid="gate-unlock" onClick={onUnlocked}>
        unlock
      </button>
    ),
}));

function setEssentials(value: number) {
  // Two controls carry the essentials label (A1: number field + slider) —
  // drive the number field.
  const inputs = screen.getAllByLabelText(
    'tools-money-jobs.inputs.essentialsLabel'
  ) as HTMLInputElement[];
  const numberInput = inputs.find((el) => el.type === 'number');
  fireEvent.change(numberInput as HTMLInputElement, { target: { value: String(value) } });
}

describe('MoneyJobsCalculator', () => {
  beforeEach(() => {
    mockLocale = 'en';
  });

  it('renders the free split for the en default (headline, cost line, 3 jobs, band explainer, gate)', () => {
    render(<MoneyJobsCalculator />);
    expect(screen.getByText('tools-money-jobs.headline.kicker')).toBeTruthy();
    // en default: income 6000, essentials 0.62 pre-fill → surplus 2280 above dignity floor
    expect(screen.queryByTestId('dignity-state')).toBeNull();
    expect(screen.getByText(/costLine\.personal/)).toBeTruthy();
    expect(screen.getByText('tools-money-jobs.jobs.floor.label')).toBeTruthy();
    expect(screen.getByText(/jobs\.cushion\.label/)).toBeTruthy();
    expect(screen.getByText('tools-money-jobs.jobs.working.label')).toBeTruthy();
    // C2: band explains its own gap
    expect(screen.getByText('tools-money-jobs.band.explainer')).toBeTruthy();
    // C3: tool disclaimer on the free surface
    expect(screen.getByText('tools-money-jobs.disclaimer')).toBeTruthy();
    // A3: gate present, plan not rendered pre-unlock
    expect(screen.getByTestId('gate-unlock')).toBeTruthy();
    expect(screen.queryByTestId('personal-plan')).toBeNull();
  });

  it('enters the dignity state when essentials reach income, and exits when lowered (F3)', () => {
    render(<MoneyJobsCalculator />);
    setEssentials(6000);
    expect(screen.getByTestId('dignity-state')).toBeTruthy();
    // Dignity: split, gate and share all suppressed — one caring next step.
    expect(screen.queryByTestId('gate-unlock')).toBeNull();
    expect(screen.queryByText('tools-money-jobs.jobs.floor.label')).toBeNull();
    setEssentials(3000);
    expect(screen.queryByTestId('dignity-state')).toBeNull();
    expect(screen.getByTestId('gate-unlock')).toBeTruthy();
  });

  it('unlocking reveals the personal plan with Conservative leading the projections (C4)', () => {
    render(<MoneyJobsCalculator />);
    fireEvent.click(screen.getByTestId('gate-unlock'));
    const plan = screen.getByTestId('personal-plan');
    expect(plan).toBeTruthy();
    const rows = plan.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(rows[0]?.textContent).toContain('tools-shared.scenarios.conservative');
    expect(rows[1]?.textContent).toContain('tools-shared.scenarios.historical');
    expect(rows[2]?.textContent).toContain('tools-shared.scenarios.optimistic');
  });

  it('holds the BR dollar line behind the gate and shows the hedge sentence beside it (C1)', () => {
    mockLocale = 'pt-BR';
    render(<MoneyJobsCalculator />);
    expect(screen.queryByText(/brDollarLine/)).toBeNull();
    fireEvent.click(screen.getByTestId('gate-unlock'));
    const line = screen.getByText(/brDollarLine/);
    expect(line.textContent).toContain('tools-money-jobs.plan.brDollarBothWays');
  });

  it('mode toggle renders the business surface; en default (cash-positive) shows coverage, not runway', () => {
    render(<MoneyJobsCalculator />);
    fireEvent.click(screen.getByText('tools-money-jobs.mode.business'));
    // en business default: revenue 30k > burn 25k → cash-positive
    expect(screen.getByText('tools-money-jobs.jobs.coverage.label')).toBeTruthy();
    expect(screen.queryByTestId('runway-mode')).toBeNull();
    expect(screen.getByText('tools-money-jobs.jobs.operatingFloor.label')).toBeTruthy();
  });

  it('initialMode="business" honors decision 6 (?for=business arrivals)', () => {
    render(<MoneyJobsCalculator initialMode="business" />);
    expect(screen.getByTestId('mode-control').getAttribute('data-value')).toBe('business');
  });

  it('pt-BR business default enters runway mode: sell suppressed, runway-led plan on unlock (decision 9)', () => {
    mockLocale = 'pt-BR';
    render(<MoneyJobsCalculator initialMode="business" />);
    // pt-BR default: burn 100k, revenue 120k → cash-positive… so force the
    // campaign vignette: revenue 0, burn 120k, cash 600k → runway 5mo.
    fireEvent.change(screen.getByLabelText('tools-money-jobs.inputs.revenueLabel'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('tools-money-jobs.inputs.burnLabel'), {
      target: { value: '120000' },
    });
    expect(screen.getByTestId('runway-mode')).toBeTruthy();
    // Invest framing suppressed: no band, no share row on the free surface.
    expect(screen.queryByText('tools-money-jobs.band.explainer')).toBeNull();
    fireEvent.click(screen.getByTestId('gate-unlock'));
    const plan = screen.getByTestId('business-plan');
    expect(plan.textContent).toContain('plan.runwayLed');
    // Idle-cash comparison HELD in runway mode.
    expect(plan.textContent).not.toContain('plan.idleComparison');
  });
});
