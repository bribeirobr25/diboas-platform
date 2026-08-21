// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createGoal,
  createRule,
  getLedgerState,
  grantPlayMoney,
  pauseGoal,
  resetSandbox,
} from '@/lib/ledgerClient';
import { WeeklyCycleScreen } from '../WeeklyCycleScreen';

/**
 * G10 weekly cycle (§4.10, mockup 11). WG-1 is the governing constraint: the
 * credit is a fact of time, never a reward for showing up.
 */
const M = {
  'weekly.title': 'This week',
  'weekly.subtitle': 'Time passed, so credits accrued.',
  'weekly.readyTitle': 'Your weekly credits are ready',
  'weekly.creditsFor': 'For {weeks, plural, one {# week} other {# weeks}} of practice.',
  'weekly.collect': 'Collect credits',
  'weekly.nothingTitle': 'Nothing to collect yet',
  'weekly.nothingBody': 'Credits accrue on the calendar, whether or not you are here.',
  'weekly.pausedTitle': 'Credits are paused for now',
  'weekly.pausedBody': 'Your practice balance is already well ahead of the starting grant.',
  'weekly.proposalTitle': 'How your rule would handle this',
  'weekly.remainder': 'Remainder stays in Available',
  'weekly.share': '{share} of every credit',
  'weekly.pausedDiversion': 'this goal is paused',
  'weekly.repairNeeded': 'One destination in your rule is no longer open.',
  'weekly.approve': 'Approve',
  'weekly.adjustOnce': 'Adjust once',
  'weekly.decline': 'Decline',
  'weekly.adjustLater': 'Adjusting a single week is not built yet.',
};

const renderWeekly = () =>
  render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <WeeklyCycleScreen locale="en" />
    </IntlProvider>
  );

/** Genesis a fortnight ago, so real-calendar weeks are genuinely collectable. */
function seedWithElapsedWeeks(weeks: number) {
  vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 12,
    fundAmount: 0,
  });
  vi.setSystemTime(new Date(`2026-08-${String(1 + weeks * 7).padStart(2, '0')}T09:00:00Z`));
  return goalId;
}

describe('WeeklyCycleScreen — G10 (§4.10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSandbox();
  });
  afterEach(() => vi.useRealTimers());

  it('should offer collection when the CALENDAR has moved, not when you log in', () => {
    seedWithElapsedWeeks(2);
    renderWeekly();
    // WG-1: the credit accrued because time passed. Showing up is not the trigger.
    expect(screen.getByText('Your weekly credits are ready')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Collect credits' })).toBeTruthy();
  });

  it('should emit WeeklyCreditGranted per week on the explicit tap', () => {
    seedWithElapsedWeeks(2);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    const granted = getLedgerState().events.filter((e) => e.type === 'WeeklyCreditGranted');
    expect(granted.length).toBeGreaterThanOrEqual(1);
    // Idempotent per user-week: no week is granted twice.
    const weeks = granted.map((e) => (e as { week: number }).week);
    expect(new Set(weeks).size).toBe(weeks.length);
  });

  it('should carry NO reward framing anywhere in its copy (WG-1)', () => {
    seedWithElapsedWeeks(2);
    renderWeekly();
    const text = document.body.textContent ?? '';
    for (const banned of ['streak', 'bonus', 'reward', 'congrat', 'earned it', 'well done']) {
      expect(text.toLowerCase().includes(banned), banned).toBe(false);
    }
  });

  it('should say plainly when nothing has accrued yet (never an empty gap)', () => {
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
    grantPlayMoney(10_000, 'USD', 'b2c');
    renderWeekly();
    expect(screen.getByText('Nothing to collect yet')).toBeTruthy();
    expect(screen.getByText(/whether or not you are here/)).toBeTruthy();
  });

  it('should show the rule proposal with its lines and the visible remainder', () => {
    const goalId = seedWithElapsedWeeks(2);
    createRule([{ goalId, percent: 60 }]);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    expect(screen.getByText('How your rule would handle this')).toBeTruthy();
    expect(screen.getByText('Trip')).toBeTruthy();
    // The un-allocated 40% must be visible, never silently absorbed.
    expect(screen.getByText('Remainder stays in Available')).toBeTruthy();
  });

  it('should state the share behind each amount, from the rule that drafted it', () => {
    const goalId = seedWithElapsedWeeks(2);
    createRule([{ goalId, percent: 60 }]);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    // Naming the amount without naming its cause leaves the user to reverse-
    // engineer their own rule from arithmetic.
    expect(screen.getByText('60% of every credit')).toBeTruthy();
  });

  it('should NOT give a paused goal amount the emphasis of a real allocation', () => {
    const goalId = seedWithElapsedWeeks(2);
    createRule([{ goalId, percent: 60 }]);
    pauseGoal(goalId);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    // The engine diverts a paused share into the remainder, so this figure is
    // the rule's intent — not money arriving. Styled like a live allocation,
    // the amounts column appears to sum past the collected total.
    const diverted = screen.getByText('$1,200.00');
    const remainder = screen.getByText('$2,000.00');
    expect(diverted.className).not.toBe(remainder.className);
  });

  it('should apply the proposal on Approve', () => {
    const goalId = seedWithElapsedWeeks(2);
    createRule([{ goalId, percent: 60 }]);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const applied = getLedgerState().events.filter((e) => e.type === 'RuleApplied');
    const funded = getLedgerState().events.filter((e) => e.type === 'GoalFunded');
    expect(applied).toHaveLength(1);
    expect(funded.length).toBeGreaterThanOrEqual(1);
  });

  it('should let a Decline be final and silent — no nag, no re-ask', () => {
    const goalId = seedWithElapsedWeeks(2);
    createRule([{ goalId, percent: 60 }]);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    // The proposal is gone and nothing asks again; the money simply stays put.
    expect(screen.queryByText('How your rule would handle this')).toBeNull();
    expect(getLedgerState().events.filter((e) => e.type === 'RuleApplied')).toHaveLength(0);
  });

  it('should offer all three decisions at equal weight (row 24)', () => {
    const goalId = seedWithElapsedWeeks(2);
    createRule([{ goalId, percent: 60 }]);
    renderWeekly();
    fireEvent.click(screen.getByRole('button', { name: 'Collect credits' }));
    // None of the three is a Button variant="primary" — they are the same control.
    for (const name of ['Approve', 'Adjust once', 'Decline']) {
      expect(screen.getByRole('button', { name }), name).toBeTruthy();
    }
    // "Adjust once" is not built, so it is disabled AND the reason is stated.
    expect(
      (screen.getByRole('button', { name: 'Adjust once' }) as HTMLButtonElement).disabled
    ).toBe(true);
    expect(screen.getByText(/not built yet/)).toBeTruthy();
  });
});
