// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { getMessages } from '@/i18n/loadMessages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureDateSeries, fixturePriceSeries, FIXTURE_STAMP, observedStamp } from '@diboas/defi';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { TimeMachineScreen } from '../TimeMachineScreen';

/**
 * The shared fixture calendar, built ONCE per length.
 *
 * `fixtureDateSeries` walks `days` dates, so calling it inside a per-point
 * callback is O(days²) — measured consequence: `g8FallingPosition`'s
 * higher-exposure test TIMED OUT at 5000ms in the full suite (roughly a million
 * date operations per builder call, six protocols deep, twice per test) while
 * passing in isolation. Hoisted, not inlined.
 */
const datesFor = (() => {
  const cache = new Map<number, string[]>();
  return (days: number): string[] => {
    const hit = cache.get(days);
    if (hit) return hit;
    const built = fixtureDateSeries(days);
    cache.set(days, built);
    return built;
  };
})();

const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;
const apy = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: datesFor(days)[i],
      apyPercent: 5,
    })),
    stamp: observedStamp('defillama', '2026-08-20T00:00:00Z'),
  }));
const prices = (days: number) =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: FIXTURE_STAMP,
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

/**
 * `5.356` / §4 — the approved unavailable sentence REPLACES the trend sentence.
 *
 * The scenario is a genuine mixed-calendar refusal, not a stubbed flag: the APY
 * legs carry no dates while the price legs do, so §2's
 * `MIXED-CALENDAR POSITION = WHOLE-POSITION REPLAY UNAVAILABLE` fires through the
 * real ledger path.
 */
describe('TimeMachineScreen — a refused replay (5.356)', () => {
  beforeEach(() => {
    resetSandbox();
  });

  const undatedApy = (days: number) =>
    PROTOCOLS.map((protocolId) => ({
      protocolId,
      points: Array.from({ length: days }, () => ({ date: '', apyPercent: 5 })),
      stamp: observedStamp('defillama', '2026-08-20T00:00:00Z'),
    }));

  function refusedPosition() {
    grantPlayMoney(10_000, 'USD', 'b2c');
    const goalId = createGoal({
      name: 'Trip',
      icon: 'plane',
      targetAmount: 5000,
      horizonMonths: 24,
      fundAmount: 1000,
    });
    enterStrategy({ goalId, strategyId: 'fullThrottle', totalFromCash: 1000, networkFeeLocal: 0 });
    advanceTime(180, undatedApy(400), 'machine', prices(400));
  }

  it('should render the approved unavailable sentence, not a trend sentence', () => {
    refusedPosition();
    renderTM();
    expect(screen.getAllByText(M['timeMachine.meaningUnavailable']).length).toBeGreaterThan(0);
    // The three trend sentences must be ABSENT — a refusal is money-free, so
    // without the branch this screen would say "it stayed about where it started".
    expect(screen.queryByText(M['timeMachine.meaningFlat'])).toBeNull();
    expect(screen.queryByText(M['timeMachine.meaningGrew'])).toBeNull();
    expect(screen.queryByText(M['timeMachine.meaningFell'])).toBeNull();
  });

  it('should render a trend sentence again once the replay is evidenced', () => {
    fallenPosition();
    renderTM();
    expect(screen.queryByText(M['timeMachine.meaningUnavailable'])).toBeNull();
  });
});

/**
 * `5.398` — the chart's ACCESSIBLE NAME must not claim a direction beside a
 * refused span (§4: adjacent presentation must not imply gain/loss/flat).
 *
 * Asserted on the RESOLVED title text, not on the prop: the SVG's `<title>` is
 * the only thing a screen-reader user gets from this chart, and the defect was
 * invisible to every existing test because it lives in an accessible name that
 * no visual check reads either. It took the Docker MCP pass to find it.
 */
describe('ValueChart accessible name vs a refused span (5.398)', () => {
  const PROTOCOLS2 = [
    'skySsr',
    'aaveV3',
    'compoundV3',
    'sanctumInf',
    'jupiterJlp',
    'jito',
  ] as const;
  const undatedApy2 = (days: number) =>
    PROTOCOLS2.map((protocolId) => ({
      protocolId,
      points: Array.from({ length: days }, () => ({ date: '', apyPercent: 5 })),
      stamp: observedStamp('defillama', '2026-08-20T00:00:00Z'),
    }));

  /** The chart's resolved accessible name, from the element a reader actually gets. */
  const chartTitle = (container: HTMLElement): string =>
    container.querySelector('svg[role="img"] title')?.textContent ?? '';

  beforeEach(() => {
    resetSandbox();
  });

  function openDetailed(container: HTMLElement) {
    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }));
    return container;
  }

  it('should describe span and range WITHOUT a direction when a span was refused', () => {
    /* EVIDENCE, THEN ABSENCE — and the first attempt at this test got it wrong
       in a way worth recording. A refusal emits no accrual, so a corpus that is
       unevidenced from the start leaves the value line with ONE point,
       `hasHistory` false, and NO CHART AT ALL to describe (the assertion read an
       empty string). The state that actually exposes this defect is a replay
       that worked and then stopped being evidenced: advance once with a dated
       corpus (accruals -> a line), then again with undated APY beside dated
       prices, which is §2's mixed-calendar case. That is also what the browser
       pass had in front of it when it found the defect. */
    fallenPosition();
    advanceTime(30, undatedApy2(400), 'machine', prices(400));

    const { container } = renderTM();
    openDetailed(container);
    const title = chartTitle(container);

    expect(title).not.toBe('');
    // The claim is gone...
    expect(title).not.toMatch(/\b(up|down)\b/);
    expect(title).not.toContain(M['timeMachine.up']);
    expect(title).not.toContain(M['timeMachine.down']);
    // ...and the FACTS remain: §4 permits the line's own span and range.
    expect(title).toContain('Practice value from');
    expect(title).toContain('ranging');
  });

  it('should still state the direction when the replay IS evidenced', () => {
    fallenPosition();
    const { container } = renderTM();
    openDetailed(container);
    const title = chartTitle(container);

    // Discriminating: the same element, same query, opposite outcome.
    expect(title).toMatch(/\b(up|down)\b/);
  });
});
