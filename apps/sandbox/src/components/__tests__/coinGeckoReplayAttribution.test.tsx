// @vitest-environment happy-dom
/**
 * REPLAY-OUTCOME ATTRIBUTION, AS RENDERED.
 *
 * ⚑ WHY THIS FILE EXISTS AT ALL. The trigger has its own unit tests
 * (`view/__tests__/marketDataAttribution.test.ts`), and they were not enough:
 * deleting the attribution from `GoalDetailScreen` entirely broke NOTHING,
 * because every assertion lived on the selector and none on the WIRING. The
 * sabotage found it; this file closes it. A correct predicate that nothing
 * renders is not an implemented requirement.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import {
  fixturePriceSeries,
  fixtureDateSeries,
  observedStamp,
  FIXTURE_STAMP,
  type ProtocolApyHistory,
  type ProtocolPriceHistory,
} from '@diboas/defi';
import {
  advanceTime,
  createGoal,
  enterStrategy,
  grantPlayMoney,
  resetSandbox,
} from '@/lib/ledgerClient';
import { GoalDetailScreen } from '../GoalDetailScreen';
import { GoalsListScreen } from '../GoalsListScreen';
import { getMessages } from '@/i18n/loadMessages';
import { SANDBOX_LOCALES } from '@/i18n/config';

/* The market must be PRESENT (and mocked): the real hook fetches, which in a
   test environment hangs the socket, and an absent market gates the surface. */
const h = vi.hoisted(() => ({ market: null as unknown }));
vi.mock('@/hooks/useMarket', () => ({
  useMarket: () => ({ market: h.market, marketError: h.market === null, refreshMarket: () => {} }),
  fetchHistories: () => Promise.resolve([]),
}));

const COPY = 'Data provided by CoinGecko';
const PROTOCOLS = ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as const;

const apyHistories = (days: number): ProtocolApyHistory[] =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: fixtureDateSeries(days)[i],
      apyPercent: 5,
    })),
    stamp: FIXTURE_STAMP,
  }));

/** Price series stamped by the PROVIDER — this is what makes the leg a trigger. */
const providerPrices = (days: number): ProtocolPriceHistory[] =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: observedStamp('coingecko', '2026-07-24T00:00:00.000Z'),
  }));

/** The same series, but replayed from fixtures — NOT a trigger. */
const fixturePrices = (days: number): ProtocolPriceHistory[] =>
  PROTOCOLS.map((protocolId) => ({
    protocolId,
    points: fixturePriceSeries(protocolId, days),
    stamp: FIXTURE_STAMP,
  }));

function seed(strategyId: 'fullThrottle' | 'safeHarbor', prices: ProtocolPriceHistory[]) {
  const goalId = createGoal({
    name: 'Trip',
    icon: 'plane',
    targetAmount: 5000,
    horizonMonths: 24,
    fundAmount: 1000,
  });
  enterStrategy({ goalId, strategyId, totalFromCash: 1000, networkFeeLocal: 0 });
  advanceTime(180, apyHistories(400), 'machine', prices);
  return goalId;
}

function renderDetail(goalId: string, locale: (typeof SANDBOX_LOCALES)[number] = 'en') {
  return render(
    <IntlProvider locale={locale} messages={getMessages(locale)}>
      <GoalDetailScreen locale={locale} goalId={goalId} />
    </IntlProvider>
  );
}

h.market = {
  apys: [],
  gas: [{ chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP }],
  usdPriceLocal: 1,
} as unknown;

const attributions = () => screen.queryAllByTestId('coingecko-attribution');

/**
 * The market-change breakdown lives in the DETAILED view; open it.
 *
 * Selected by ROLE AND STATE, never by label: the toggle's text is localized
 * ("Detailliert"), so matching the English name would pass in `en` and fail in
 * every other locale — which is exactly what the locale test exists to catch,
 * and would have been mistaken for an attribution defect.
 */
function openDetailed() {
  const toggles = screen.getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'));
  const detailed = toggles[toggles.length - 1];
  fireEvent.click(detailed);
}

beforeEach(() => {
  // The surface refuses out-of-window evidence; pin inside the fixture window so
  // these tests are about ATTRIBUTION, never about the age contract.
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-25T09:00:00Z'));
  resetSandbox();
  grantPlayMoney(10_000, 'USD', 'b2c');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GoalDetail — attribution follows the replay, not the screen', () => {
  it('should attribute a goal whose replay consumed provider prices', () => {
    const goalId = seed('fullThrottle', providerPrices(400));
    renderDetail(goalId);
    openDetailed();
    expect(attributions().length).toBeGreaterThan(0);
    expect(attributions()[0].textContent).toBe(COPY);
  });

  it('should NOT attribute a lending-only goal on the same screen', () => {
    // `safeHarbor` is all lending legs: DeFiLlama rates, no price series.
    // The screen, the component and the provider are all identical — only the
    // replayed provenance differs, which is the whole point.
    const goalId = seed('safeHarbor', providerPrices(400));
    renderDetail(goalId);
    openDetailed();
    expect(attributions()).toHaveLength(0);
  });

  it('should NOT attribute when the market leg replayed FIXTURE prices', () => {
    const goalId = seed('fullThrottle', fixturePrices(400));
    renderDetail(goalId);
    openDetailed();
    expect(attributions()).toHaveLength(0);
  });

  it('should keep the exact English copy in every locale', () => {
    const goalId = seed('fullThrottle', providerPrices(400));
    for (const locale of SANDBOX_LOCALES) {
      const { unmount } = renderDetail(goalId, locale);
      openDetailed();
      expect(attributions()[0]?.textContent, `locale ${locale}`).toBe(COPY);
      unmount();
    }
  });

  it('should link to the ratified target', () => {
    const goalId = seed('fullThrottle', providerPrices(400));
    renderDetail(goalId);
    openDetailed();
    expect(attributions()[0].getAttribute('href')).toBe('https://www.coingecko.com/en/api');
  });

  it('should sit with the MARKET CHANGE row, not the contributions row', () => {
    /* MIXED-SOURCE: the breakdown states the user's own contributions beside the
       replayed market figure. The attribution must land against the market
       figure, so it cannot be read as sourcing the user's own deposits. */
    const goalId = seed('fullThrottle', providerPrices(400));
    const { container } = renderDetail(goalId);
    openDetailed();
    const text = container.textContent ?? '';
    expect(text.indexOf(COPY)).toBeGreaterThan(text.indexOf('Market change'));
  });
});

describe('GoalsList — the list is mixed, the card is not', () => {
  it('should attribute only the affected goal card', () => {
    const growth = seed('fullThrottle', providerPrices(400));
    const stable = seed('safeHarbor', providerPrices(400));
    expect(growth).not.toBe(stable);
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <GoalsListScreen locale="en" />
      </IntlProvider>
    );
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Detailed' })
        .find((b) => b.hasAttribute('aria-pressed'))!
    );
    // Exactly ONE card carries it, though two goals are listed.
    expect(attributions()).toHaveLength(1);
  });
});
