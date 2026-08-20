// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { getStrategy } from '@diboas/defi';
import type { ProtocolApy, ProtocolApyHistory, ProtocolId } from '@diboas/defi';
import { StrategyDetail } from '../StrategyDetail';

/**
 * G6 pre-commit read (§4.6). Absorbs the provenance-stamp assertions that
 * lived against PathCard before board §3.2 folded it in here.
 */
const M = {
  'goalsList.viewToggle': 'How much detail to show',
  'strategyDetail.simple': 'Simple',
  'strategyDetail.detailed': 'Detailed',
  'strategyDetail.whatItIs': 'What it is',
  'strategyDetail.howItsDoing': "How it's doing",
  'strategyDetail.caveat': "It can dip some weeks. Returns aren't guaranteed.",
  'strategyDetail.seeDetail': 'See the detail',
  'strategyDetail.putToWork': 'Put money to work',
  'strategyDetail.currentApy': 'Current APY',
  'strategyDetail.varies': 'Varies',
  'strategyDetail.riskFactors': 'Risk factors',
  'strategyDetail.riskSmartContract': 'Smart contract risk',
  'strategyDetail.riskMarketVolatility': 'Market volatility',
  'strategyDetail.riskVariableApy': 'Variable returns',
  'strategyDetail.whatHappensOnExit': 'What happens on exit',
  'strategyDetail.exitFee': 'Exit fee',
  'strategyDetail.minExit': 'at least {min}',
  'strategyDetail.underlyingProtocols': 'Underlying protocols',
  'strategyDetail.protocolsNote': 'Trusted protocols. Not guaranteed.',
  'goalNew.apyNow': 'Current pool rate: {apy}%/yr (real, variable)',
  'goalNew.apyNowMixed':
    'Blended pool rate: {apy}%/yr (variable, includes documented reference values)',
  'goalNew.apyNowFixture': 'Reference pool rate: {apy}%/yr (documented values, not live)',
  'pathCard.pathTitle': 'Path',
  'pathCard.pathLine': '{goal} to {strategy} on {chain}',
  'pathCard.costTitle': 'Cost',
  'pathCard.entryFee': 'Entering: free',
  'pathCard.networkFee': 'Network fee: about {amount}',
  'pathCard.exitFee': 'Leaving later: 0.39% (at least {min}, no cap)',
  'pathCard.riskTitle': 'Risk',
  'pathCard.riskStable': 'Stable strategies aim to hold their value.',
  'pathCard.riskGrowth': '{percent}% moves with market prices.',
  'pathCard.noPromise': 'No promises live here.',
  'common.dataLive': 'Live from {source}, fetched {date}',
  'common.dataMixed':
    'Partly live from {source}, fetched {date}. Reference values ({fixtureDate}) for: {protocols}.',
  'common.dataFixture': 'Documented reference values ({date}), not live market data.',
  'catalog.strategies.safeHarbor.name': 'Safe Harbor',
  'catalog.strategies.safeHarbor.tagline': "A steady home for money you can't risk",
  'catalog.protocols.skySsr': 'Sky SSR',
  'catalog.protocols.aaveV3': 'Aave V3',
  'catalog.protocols.compoundV3': 'Compound V3',
  'apyChart.timeframeLabel': 'Chart timeframe',
  'apyChart.tf.7': '7D',
  'apyChart.tf.30': '30D',
  'apyChart.tf.90': '90D',
  'apyChart.tf.365': '1Y',
  'apyChart.noData': 'Not enough history to draw a chart yet.',
  'apyChart.description': 'Pool rate from {from} to {to}, ranging {low}% to {high}%.',
};

const safeHarbor = getStrategy('safeHarbor')!;

function apy(protocolId: ProtocolId, source: 'defillama' | 'fixture' = 'defillama'): ProtocolApy {
  return {
    protocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp: { source, asOf: source === 'defillama' ? '2026-08-19T00:00:00Z' : '2026-07-18' },
  };
}
const LIVE = [apy('skySsr'), apy('aaveV3'), apy('compoundV3')];
const MIXED = [apy('skySsr'), apy('aaveV3', 'fixture'), apy('compoundV3')];
const FIXTURE = [apy('skySsr', 'fixture'), apy('aaveV3', 'fixture'), apy('compoundV3', 'fixture')];

function history(protocolId: ProtocolId, days: number): ProtocolApyHistory {
  return {
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.UTC(2026, 4, 1 + i)).toISOString().slice(0, 10),
      apyPercent: 3 + (i % 4),
    })),
    stamp: { source: 'defillama', asOf: '2026-08-19T00:00:00Z' },
  };
}

function renderDetail(
  apys: ProtocolApy[] = LIVE,
  histories: ProtocolApyHistory[] = [
    history('skySsr', 120),
    history('aaveV3', 120),
    history('compoundV3', 120),
  ],
  onPutToWork?: () => void
) {
  return render(
    <IntlProvider locale="en" messages={M} onError={() => {}}>
      <StrategyDetail
        strategy={safeHarbor}
        goalName="Future cushion"
        apys={apys}
        histories={histories}
        gas={[
          {
            chain: 'Arbitrum',
            typicalFeeUsd: 0.03,
            stamp: { source: 'fixture', asOf: '2026-07-18' },
          },
        ]}
        usdPriceLocal={1}
        currency="USD"
        onPutToWork={onPutToWork}
      />
    </IntlProvider>
  );
}

describe('StrategyDetail — the G6 pre-commit read (§4.6, board §3.2)', () => {
  it("should lead Simple with what-it-is, how-it's-doing, and the FOLDED itemization (FC-15)", () => {
    renderDetail();
    expect(screen.getByText('What it is')).toBeTruthy();
    expect(screen.getByText("How it's doing")).toBeTruthy();
    // PathCard's cost/risk itemization is a section here now — never a
    // pre-commit read without the itemized costs (board §3.2).
    expect(screen.getByText('Entering: free')).toBeTruthy();
    expect(screen.getByText(/Network fee: about/)).toBeTruthy();
    expect(screen.getByText(/Leaving later/)).toBeTruthy();
    expect(screen.getByText('No promises live here.')).toBeTruthy();
  });

  it('should NOT fold any exit fee into the entry cost (mockup-03 drift: entry is FREE)', () => {
    renderDetail();
    expect(screen.getByText('Entering: free')).toBeTruthy();
    // No "total" that adds an exit fee to the entry amount anywhere.
    expect(screen.queryByText(/Total/i)).toBeNull();
  });

  it('should render the REAL allocation with weights, never the mockup\'s "Curve"', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText(/Sky SSR 50%/)).toBeTruthy();
    expect(screen.getByText(/Aave V3 30%/)).toBeTruthy();
    expect(screen.getByText(/Compound V3 20%/)).toBeTruthy();
    expect(screen.queryByText(/Curve/)).toBeNull();
  });

  it('should take the exit terms from the fee CONSTANTS (no literal in the component)', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText('Exit fee')).toBeTruthy();
    expect(screen.getByText(/0\.39%/)).toBeTruthy(); // formatted from FEE_RATES.exit
    expect(screen.getByText(/at least \$0\.25/)).toBeTruthy(); // from EXIT_FEE_FLOOR
  });

  it('should stamp provenance honestly in all three states', () => {
    const { unmount } = renderDetail(LIVE);
    expect(screen.getByText(/Live from DeFiLlama/)).toBeTruthy();
    unmount();

    const mixed = renderDetail(MIXED);
    expect(screen.getByText(/Partly live from DeFiLlama/).textContent).toContain('Aave V3');
    mixed.unmount();

    renderDetail(FIXTURE);
    expect(screen.getByText(/Documented reference values/)).toBeTruthy();
    expect(screen.queryByText(/\(real, variable\)/)).toBeNull(); // never "real" on fixtures
  });

  it('should draw the axed chart over real history with switchable timeframes', () => {
    renderDetail();
    fireEvent.click(screen.getByText('Detailed'));
    // The chart describes itself for non-visual readers (dates + range).
    expect(screen.getByText(/Pool rate from .* ranging/)).toBeTruthy();
    const tf90 = screen.getByRole('button', { name: '90D' });
    expect(tf90.getAttribute('aria-pressed')).toBe('true'); // default
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    expect(screen.getByRole('button', { name: '7D' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('should say so plainly when there is not enough history to chart', () => {
    renderDetail(LIVE, []);
    fireEvent.click(screen.getByText('Detailed'));
    expect(screen.getByText('Not enough history to draw a chart yet.')).toBeTruthy();
  });

  it('should fire the entry seam from "Put money to work"', () => {
    const onPutToWork = vi.fn();
    renderDetail(
      LIVE,
      [history('skySsr', 30), history('aaveV3', 30), history('compoundV3', 30)],
      onPutToWork
    );
    fireEvent.click(screen.getByText('Put money to work'));
    expect(onPutToWork).toHaveBeenCalledOnce();
  });
});
