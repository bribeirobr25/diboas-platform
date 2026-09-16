// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, enterStrategy, getLedgerState } from '@/lib/ledgerClient';
import { advanceTime, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { fixturePriceSeries, FIXTURE_STAMP, observedStamp } from '@diboas/defi';
import { getMessages } from '@/i18n/loadMessages';
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

/**
 * `5.105` §3 / `5.356` — the DISCLOSED gap appears on the trail.
 *
 * Rendered against the REAL catalog (`getMessages('en')`), not this file's
 * minimal map: asserting an approved sentence against a hand-built map only
 * proves the element rendered whatever the test put in it. Emptying the key in
 * the shipped catalogue must fail this.
 *
 * The refusal is produced through the real ledger path — undated APY legs beside
 * dated price legs, i.e. §2's mixed-calendar case — never by injecting an event.
 * `HistoryScreen` maps EVERY event with no filter (`:315`), so reachability is
 * structural; this asserts the row a user actually sees.
 */
describe('HistoryScreen — a refused replay span (5.356)', () => {
  const REAL = getMessages('en');
  const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
    resetSandbox();
  });

  it('should state the disclosed gap using the approved sentence', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 24,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'fullThrottle', totalFromCash: 1000, networkFeeLocal: 0 });
    advanceTime(
      180,
      PROTOCOLS.map((protocolId) => ({
        protocolId,
        points: Array.from({ length: 400 }, () => ({ date: '', apyPercent: 5 })),
        stamp: observedStamp('defillama', '2026-07-20T00:00:00Z'),
      })),
      'machine',
      PROTOCOLS.map((protocolId) => ({
        protocolId,
        points: fixturePriceSeries(protocolId, 400),
        stamp: FIXTURE_STAMP,
      }))
    );

    // The ledger disclosed it...
    expect(getLedgerState().events.some((e) => e.type === 'ReplaySpanRefused')).toBe(true);

    // ...and the trail says so, in the approved words.
    render(
      <IntlProvider locale="en" messages={REAL} onError={() => {}}>
        <HistoryScreen />
      </IntlProvider>
    );
    expect(screen.getAllByText(REAL['history.replayRefused']).length).toBeGreaterThan(0);
  });
});
