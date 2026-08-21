// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { createGoal, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { GoalsListScreen } from '../GoalsListScreen';

const M = {
  'goalsList.title': 'Your goals',
  'goalsList.subtitle': 'Every goal, its money, and where that money stands.',
  'goalsList.viewToggle': 'How much detail to show',
  'goalsList.simple': 'Simple',
  'goalsList.detailed': 'Detailed',
  'goalsList.closedTitle': 'Closed goals',
  'goalsList.inGoal': 'In the goal, not yet working',
  'goalsList.working': 'Working in a strategy',
  'goalsList.earned': 'Earned so far',
  'goalsList.status.paused': 'Paused',
  'goalsList.status.accomplished': 'Accomplished',
  'goalsList.status.dropped': 'Closed',
  'home.noGoalsTitle': 'No goals yet.',
  'home.noGoalsBody': 'Create one to give money a job.',
  'home.createGoal': 'Create goal',
};

function renderScreen() {
  return render(
    <IntlProvider locale="en" messages={M}>
      <GoalsListScreen locale="en" />
    </IntlProvider>
  );
}

describe('GoalsListScreen — the portfolio host (§4 item 1)', () => {
  beforeEach(() => {
    resetSandbox();
  });

  it('should show the empty state with the create CTA when no goals exist', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    renderScreen();
    expect(screen.getByText('No goals yet.')).toBeTruthy();
    expect(screen.getByText('Create goal')).toBeTruthy();
    // No view toggle in the empty state — nothing to toggle.
    expect(screen.queryByText('Simple')).toBeNull();
  });

  it('should list goals as rows with accessible progress, no pace claim anywhere', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 1500,
    });
    createGoal({
      name: 'Laptop',
      icon: 'briefcase',
      targetAmount: 2000,
      horizonMonths: 6,
      fundAmount: 0,
    });
    renderScreen();
    expect(screen.getByText('Trip')).toBeTruthy();
    expect(screen.getByText('Laptop')).toBeTruthy();
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.queryByText(/on track/i)).toBeNull(); // absent over false (board §6a)
  });

  it('should switch to the Detailed view: per-goal source-separation rows', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 3000,
      horizonMonths: 12,
      fundAmount: 1500,
    });
    renderScreen();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText('In the goal, not yet working')).toBeTruthy();
    expect(screen.getByText('Working in a strategy')).toBeTruthy();
    expect(screen.getByText('Earned so far')).toBeTruthy();
    expect(screen.getByText('1,500.00')).toBeTruthy(); // the funded cash, source-separated
  });

  it('should render goals equal-weight in creation order (no sort, no ranking)', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    createGoal({
      name: 'Zebra',
      icon: 'target',
      targetAmount: 100,
      horizonMonths: 6,
      fundAmount: 0,
    });
    createGoal({
      name: 'Apple',
      icon: 'target',
      targetAmount: 9000,
      horizonMonths: 6,
      fundAmount: 0,
    });
    renderScreen();
    const names = screen.getAllByRole('link').map((a) => a.textContent);
    const zebra = names.findIndex((t) => t?.includes('Zebra'));
    const apple = names.findIndex((t) => t?.includes('Apple'));
    expect(zebra).toBeGreaterThanOrEqual(0);
    expect(zebra).toBeLessThan(apple); // creation order preserved
  });
});
