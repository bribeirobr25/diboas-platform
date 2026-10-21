// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGoal, enterStrategy, getLedgerState } from '@/lib/ledgerClient';
import { advanceTime, grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { fixturePriceSeries, FIXTURE_STAMP, observedStamp } from '@diboas/defi';
import { getMessages } from '@/i18n/loadMessages';
import { HistoryScreen } from '../HistoryScreen';
import { expectedLogs } from '@/test/expectedLogs';

// Failure paths below LOG by design (R-14); asserted, not silenced (2026-10-19 cleanup).
expectedLogs({
  strict: true,
  warn: ['ledger refused an event'],
  requiredIn: /REFUSED event is never shown/,
});

/**
 * The trail's job is to say what actually happened. This covers the one place
 * where two different events wore the same sentence.
 */

const renderHistory = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
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
 * `HistoryScreen` maps every APPLIED event (P8a filters only REFUSED ones, and a
 * valid `ReplaySpanRefused` is APPLIED), so reachability is structural; this
 * asserts the row a user actually sees.
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

/**
 * P8a acceptance (a), the History leg — register `5.485`, case 3. A cross-tab
 * entry the goal could not afford is REFUSED by the projection; the trail used
 * to list it as a completed action. No refusal copy exists yet (DR-25), so it is
 * omitted, never shown as success.
 */
describe('HistoryScreen — a REFUSED event is never shown as a successful action (P8a)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T09:00:00Z'));
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it('should list the applied entry and omit the refused one', () => {
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 1000,
      horizonMonths: 12,
      fundAmount: 100,
    })!;
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 80, networkFeeLocal: 0 });
    enterStrategy({ goalId, strategyId: 'safeHarbor', totalFromCash: 50, networkFeeLocal: 0 }); // 20 left: refused
    expect(getLedgerState().events.filter((e) => e.type === 'StrategyEntered')).toHaveLength(2);
    renderHistory();
    expect(screen.getAllByText(/put to work in/)).toHaveLength(1);
    expect(screen.getByText(/\$80\.00 put to work in/)).toBeTruthy();
    expect(
      screen.queryByText(/\$50\.00 put to work in/),
      'the refused entry was listed as done'
    ).toBeNull();
  });
});
