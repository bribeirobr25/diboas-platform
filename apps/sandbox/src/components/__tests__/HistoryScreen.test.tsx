// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { advanceTime, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { HistoryScreen } from '../HistoryScreen';

/**
 * The trail's job is to say what actually happened. This covers the one place
 * where two different events wore the same sentence.
 */
const M = {
  'history.title': 'History',
  'history.reconciles': 'Every cent accounted for.',
  'history.playMoney': 'Play money arrived: {amount}',
  'history.timeAdvanced': 'Time machine: {days, plural, one {# day} other {# days}} forward',
  'history.timeSettled':
    'While you were away: {days, plural, one {# day} other {# days}} of real time passed',
};

const renderHistory = () =>
  render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <HistoryScreen />
    </IntlProvider>
  );

describe('HistoryScreen — what the trail claims happened', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should call a user-driven jump the time machine', () => {
    advanceTime(30, [], 'machine');
    renderHistory();
    expect(screen.getByText('Time machine: 30 days forward')).toBeTruthy();
  });

  it('should NOT credit the time machine for real time the user was merely away for', () => {
    // WS-F settles wall-clock days on load. Labelling that "Time machine: N
    // days forward" tells someone they did something they never did.
    advanceTime(21, [], 'real');
    renderHistory();
    expect(screen.getByText('While you were away: 21 days of real time passed')).toBeTruthy();
    expect(screen.queryByText(/Time machine/)).toBeNull();
  });
});
