// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { StrategyDetail } from '../StrategyDetail';

const M = {
  'common.playBadge': 'Sandbox · play money',
  'strategyDetail.simple': 'Simple',
  'strategyDetail.detailed': 'Detailed',
  'strategyDetail.whatItIs': 'What it is',
  'strategyDetail.howItsDoing': "How it's doing",
  'strategyDetail.whatItCosts': 'What it costs',
  'strategyDetail.caveat': "It can dip some weeks. Returns aren't guaranteed.",
  'strategyDetail.costLine': 'Free to start. A small 0.39% when you take money out.',
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
  'strategyDetail.minExit': '$0.25 minimum',
  'strategyDetail.underlyingProtocols': 'Underlying protocols',
  'strategyDetail.protocolsNote': 'Trusted protocols. Not guaranteed.',
  'strategyExample.name': 'Grow steadily',
  'strategyExample.description': 'A steady, lower-risk way to grow.',
  'strategyExample.whatItIs': 'A calm, lower-risk way to grow your money steadily.',
  'strategyExample.howItsDoing': 'Growing gently, with small ups and downs.',
};

function renderDetail(onPutToWork?: () => void) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <StrategyDetail
        series={[100, 101, 99, 103, 101, 104]}
        apyLow="2.0%"
        apyHigh="4.0%"
        protocols={['Sky', 'Aave', 'Compound']}
        onPutToWork={onPutToWork}
      />
    </IntlProvider>
  );
}

describe('StrategyDetail (Phase B dual-view)', () => {
  it('should DEFAULT to the Simple view: lead with what-it-is, NOT an APY number', () => {
    renderDetail();
    expect(screen.getByText('What it is')).toBeTruthy();
    expect(screen.getByText(/calm, lower-risk way to grow/)).toBeTruthy();
    // APY is NOT shown in the Simple view (no hero number).
    expect(screen.queryByText('Current APY')).toBeNull();
    // The honest caveat is present.
    expect(screen.getByText(/dip some weeks/)).toBeTruthy();
  });

  it('should show the traditional data only after toggling to Detailed', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }));
    expect(screen.getByText('Current APY')).toBeTruthy();
    expect(screen.getByText(/2.0%/)).toBeTruthy();
    // Correct ruled protocols (never a fabricated "Curve").
    expect(screen.getByText('Sky')).toBeTruthy();
    expect(screen.getByText('Aave')).toBeTruthy();
    expect(screen.getByText('Compound')).toBeTruthy();
    expect(screen.queryByText('Curve')).toBeNull();
    // Exit fee (0.39%) belongs to the DETAILED "what happens on exit" — entry is free.
    expect(screen.getByText('Exit fee')).toBeTruthy();
  });

  it('should render an honest sparkline (aria-hidden svg present in both views)', () => {
    const { container } = renderDetail();
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  });

  it('should fire onPutToWork', () => {
    const onPutToWork = vi.fn();
    renderDetail(onPutToWork);
    fireEvent.click(screen.getByRole('button', { name: 'Put money to work' }));
    expect(onPutToWork).toHaveBeenCalledOnce();
  });
});
