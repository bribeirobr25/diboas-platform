// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { getMessages } from '@/i18n/loadMessages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixturePriceSeries } from '@diboas/defi';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { TimeMachineScreen } from '../TimeMachineScreen';

const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;
const apy = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      apyPercent: 5,
    })),
    stamp: { source: 'defillama' as const, asOf: '2026-08-20T00:00:00Z' },
  }));
const prices = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: { source: 'fixture' as const, asOf: '2026-07-18' },
  }));

vi.mock('@/hooks/useMarket', () => ({
  fetchSeries: async () => ({ histories: apy(400), priceHistories: prices(400) }),
  useMarket: () => ({ market: null, marketError: false, refreshMarket: () => {} }),
  fetchHistories: async () => apy(400),
}));

/**
 * The REAL catalog, not a stub (`5.199`).
 *
 * This file used to hand-build an abbreviated `M`, which made its copy
 * assertions circular — they proved the element rendered whatever this file put
 * in it, not that the shipped string appears. The same reasoning is written out
 * in `shell/__tests__/AppShell.test.tsx` for the R-4 disclosure. Emptying a key in the real
 * catalog must fail these tests.
 */
const M = getMessages('en');

const renderTM = () =>
  render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <TimeMachineScreen locale="en" />
    </IntlProvider>
  );

function fallenPosition() {
  grantPlayMoney(10_000, 'USD', 'b2c');
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 24,
    fundAmount: 1000,
  });
  enterStrategy({ goalId, strategyId: 'fullThrottle', totalFromCash: 1000, networkFeeLocal: 0 });
  advanceTime(180, apy(400), 'machine', prices(400));
}

describe('TimeMachineScreen — G8 (§4.8, mockup 17)', () => {
  beforeEach(() => resetSandbox());

  it('should carry the honesty label the board required, never "real market"', () => {
    fallenPosition();
    renderTM();
    expect(screen.getAllByText('historical market-data simulation').length).toBeGreaterThan(0);
    expect(screen.queryByText(/real market/i)).toBeNull();
  });

  it('should LEAD with meaning, and say plainly that it FELL when it fell', () => {
    fallenPosition();
    renderTM();
    // The spec's core requirement: meaning first, and a loss stated as plainly
    // as a gain — no hedging, no reassurance, no alarm.
    expect(screen.getByText(/it fell\./)).toBeTruthy();
    expect(screen.queryByText(/it grew/)).toBeNull();
  });

  it('should show the loss in WORDS as well as colour (never colour-only)', () => {
    fallenPosition();
    renderTM();
    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }));
    // batch-3 master block: "the meaning is always in the words too". The
    // direction is worded in BOTH places a non-visual reader can reach it —
    // the summary cell and the chart's own description — so neither the red
    // figure nor the line's shape is load-bearing on its own.
    expect(screen.getAllByText(/\bdown\b/).length).toBeGreaterThanOrEqual(2);
    // `5.199`: the headline is the MARKET term, so the label names it. It used
    // to read "Change", which stood for `end − start` — a figure that folded
    // the user's own deposits in, directly above the words "excludes your
    // future contributions".
    expect(screen.getByText('Market change')).toBeTruthy();
    expect(screen.queryByText('Change')).toBeNull();
    expect(screen.queryByText(/\bup\b/)).toBeNull(); // never both directions at once
  });

  it('should describe the chart in text so the drawdown is not shape-only', () => {
    fallenPosition();
    renderTM();
    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }));
    expect(screen.getByText(/Practice value from .* ranging/)).toBeTruthy();
  });

  it('should offer both advances and disable nothing before money is at work', () => {
    renderTM();
    expect(screen.getByRole('button', { name: /\+1 month/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /\+1 year/ })).toBeTruthy();
    // No history yet → an honest empty line, never a zeroed chart.
    expect(screen.getByText(/Put money to work first/)).toBeTruthy();
  });

  it('should state what the simulation excludes', () => {
    fallenPosition();
    renderTM();
    expect(screen.getByText(/Excludes your future contributions/)).toBeTruthy();
  });
});
