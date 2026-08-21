// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, getLedgerState, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { HomeScreen } from '../HomeScreen';

/**
 * Home (mockup 02). Covers the money-jobs strip, whose third column reports a
 * ledger bucket that currently has no producer.
 */
const M = {
  'home.playBalance': 'Play balance',
  'home.available': 'Available',
  'home.working': 'Working',
  'home.emergencyReserve': 'Emergency reserve',
  'home.goalsTitle': 'Goals',
  'home.viewAll': 'View all',
  'home.createGoal': 'Create goal',
  'home.noGoalsTitle': 'No goals yet',
  'home.noGoalsBody': 'Start with one.',
  'home.weeklyTitle': 'This week',
  'home.weeklyNote': 'Collect.',
  'home.systemTitle': 'Your system',
  'home.systemNote': 'Decide.',
  'home.timeMachineTitle': 'Time machine',
  'home.timeMachineNote': 'Advance.',
  'home.simDay': 'Day {day}',
  'home.monthTitle': 'Month report',
  'home.monthNote': 'Where it went.',
  'home.eventTitle': 'A practice scenario is waiting',
  'home.eventNote': 'No rush.',
};

const renderHome = () =>
  render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <HomeScreen locale="en" state={getLedgerState()} />
    </IntlProvider>
  );

describe('HomeScreen — the money-jobs strip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-03T09:00:00Z'));
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should NOT show an emergency reserve that no flow can ever fill', () => {
    createGoal({
      name: 'Emergency fund',
      icon: 'shield',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 2500,
    });
    renderHome();
    // The cushion bucket's only writer was JobsSplitSet, emitted by the MVP-0
    // chain deleted in the R1 re-audit. Rendering it told a user whose goal is
    // named "Emergency fund" — and holds 2,500 — that their reserve was 0.00.
    expect(Number(getLedgerState().buckets.cushion)).toBe(0);
    expect(screen.queryByText('Emergency reserve')).toBeNull();
    // The two columns that DO carry real money stay.
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Working')).toBeTruthy();
  });

  it('should count uninvested goal cash in the play balance', () => {
    createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 12,
      fundAmount: 3000,
    });
    const { container } = renderHome();
    // The Phase-1 audit's real bug: funding a goal moved cash out of working
    // and the headline silently understated the user's money. (The hero splits
    // the integer and the cents into separate spans, so read the block.)
    expect(container.textContent).toContain('10,000');
  });
});
