// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { getStrategy, FIXTURE_STAMP, observedStamp } from '@diboas/defi';
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
  'strategyDetail.needAmount': 'Enter an amount above to put money to work.',
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
  // ⚑ Added with Increment 2. Absent, these rendered as EMPTY TEXT via the
  // swallowed onError — which is why the `5.347`/`5.348` sabotages initially
  // passed: the reverts changed nothing the assertions could see. Copied from
  // `i18n/messages/en.json`, not retyped.
  'pathCard.networkFeeUnavailable': 'Network fee: amount unavailable',
  'goalDetail.entryPricingUnavailable':
    "The required cost information isn't available, so this move can't proceed; nothing moved.",
  'pathCard.riskTitle': 'Risk',
  'pathCard.riskStable': 'Stable strategies aim to hold their value.',
  'pathCard.riskGrowth': '{percent}% moves with market prices.',
  'pathCard.noPromise':
    'No promises live here. The numbers are history and current rates, not the future.',
  'common.dataLive': 'Live from {source}, fetched {date}',
  'common.dataMixed':
    'Partly live from {source}, fetched {date}. Reference values ({fixtureDate}) for: {protocols}.',
  'common.dataFixture': 'Documented reference values ({date}), not live market data.',
  // ⚑ Added 2026-09-14 with `5.316`. This harness is a HAND-ROLLED subset, so a
  // new catalogue key is invisible here and `IntlProvider`'s swallowed onError
  // renders it as nothing — which is exactly how the first run of the 5.316
  // assertion failed while the app rendered correctly. Values copied from
  // `i18n/messages/en.json`, not retyped.
  'common.dataPartlyLive': 'Partly live from {source}, fetched {date}.',
  'common.dataGasReference':
    'The network fee (gas) used in this simulation is based on reference values, not a live network quote. Actual network fees may differ.',
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
    stamp:
      source === 'fixture' ? FIXTURE_STAMP : observedStamp('defillama', '2026-08-19T00:00:00Z'),
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
    stamp: observedStamp('defillama', '2026-08-19T00:00:00Z'),
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
            stamp: FIXTURE_STAMP,
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
    expect(screen.getByText(/^No promises live here\./)).toBeTruthy();
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
    /* GAS-1 (founder 2026-08-21): this surface renders the NETWORK FEE beside
       the rates, so its stamp covers the gas source too. The harness supplies
       a FIXTURE gas quote (dated 2026-07-18, as the app ships today), so even
       all-live rates stamp `mixed` — it previously claimed "Live from
       DeFiLlama" directly above a fixture fee, on the pre-commit cost
       surface. */
    const { unmount } = renderDetail(LIVE);
    /**
     * `5.316`: this branch used to assert only that the mixed sentence was
     * PRESENT, and it rendered "Reference values (18.07.2026) for: ." — a
     * provenance stamp naming nothing. A mixed state must NAME what is on
     * reference values, so the assertions below are on CONTENT.
     */
    expect(screen.queryByText(/^Live from DeFiLlama/)).toBeNull();
    /**
     * Read the stamp's `textContent`, not `getByText`. The sentence is composed
     * from TWO `FormattedMessage` elements in one <p>, so React emits separate
     * text nodes and a text matcher cannot span them — the first version of
     * this assertion failed for exactly that reason while the copy rendered
     * correctly. The MIXED assertion below already used `textContent`; this
     * follows it.
     */
    const stamp = screen.getByText(/Partly live from DeFiLlama/);
    // the reference-backed input is IDENTIFIED as the network fee (Legal wording)
    expect(stamp.textContent).toContain('network fee (gas) used in this simulation');
    // and never an empty `for:` clause, in any locale
    expect(stamp.textContent).not.toMatch(/for: \.|für: \.|para: \./);
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

  it('should DISABLE the CTA and say why when there is no handler (never a fake control)', () => {
    renderDetail(); // no onPutToWork → the parent has nothing valid to commit
    const cta = screen.getByRole('button', { name: 'Put money to work' }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    expect(screen.getByText('Enter an amount above to put money to work.')).toBeTruthy();
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

  /**
   * `5.402`. The harness supplies three LIVE rates and a FIXTURE Arbitrum gas
   * quote — exactly what the app ships today — and the APY label used to read
   * "includes documented reference values" about rates that were all live.
   * No test covered this label in the mixed-gas state, which is why the false
   * claim shipped.
   */
  it('should state the APY label from the APY legs ONLY, never from the gas quote', () => {
    renderDetail(LIVE);
    expect(screen.getByText(/\(real, variable\)/)).toBeTruthy();
    expect(screen.queryByText(/includes documented reference values/)).toBeNull();
    // The fee's provenance is still stated — by the gas sentence, not the label.
    expect(screen.getByText(/Partly live from DeFiLlama/).textContent).toContain(
      'network fee (gas) used in this simulation'
    );
  });

  it('should not describe a reference fee it never rendered', () => {
    // No quote for safeHarbor's Arbitrum entry → no fee row, so the
    // reference-fee sentence must be absent rather than describing nothing.
    render(
      <IntlProvider locale="en" messages={M} onError={() => {}}>
        <StrategyDetail
          strategy={safeHarbor}
          goalName="Future cushion"
          apys={LIVE}
          histories={[history('skySsr', 120), history('aaveV3', 120), history('compoundV3', 120)]}
          gas={[]}
          usdPriceLocal={1}
          currency="USD"
        />
      </IntlProvider>
    );
    expect(screen.queryByText(/Network fee: about/)).toBeNull();
    expect(screen.queryByText(/network fee \(gas\) used in this simulation/)).toBeNull();
    // and it still must not claim to be fully live
    expect(screen.queryByText(/^Live from DeFiLlama/)).toBeNull();

    /* `5.348` (Execution Rulings §17): the row is NOT omitted — the approved
       string REPLACES the figure, because `amount unavailable != zero !=
       waived != free network`. Asserting only the absence above could not tell
       a replaced row from a missing one, which is exactly why reverting this
       change passed its first sabotage. */
    expect(screen.getByText('Network fee: amount unavailable')).toBeTruthy();

    /* `5.347` (§16): the refusal explanation must be ADJACENT to the blocked
       action, and must be the RIGHT reason — an unpriceable entry previously
       rendered "Enter an amount above", naming a cause that was not the cause. */
    expect(
      screen.getByText(
        "The required cost information isn't available, so this move can't proceed; nothing moved."
      )
    ).toBeTruthy();
    expect(screen.queryByText('Enter an amount above to put money to work.')).toBeNull();
  });

  it('should keep the amount hint when the fee IS priceable and only the amount is missing', () => {
    // The other side of the same selection: with a priceable fee, the reason
    // stays the amount hint. Without this, a branch that always showed the
    // refusal string would pass the test above.
    renderDetail(); // fixture Arbitrum gas + FX 1 → fee is priceable, no handler
    expect(screen.getByText('Enter an amount above to put money to work.')).toBeTruthy();
    expect(
      screen.queryByText(
        "The required cost information isn't available, so this move can't proceed; nothing moved."
      )
    ).toBeNull();
    // and the fee row shows the figure, not the unavailable label
    expect(screen.getByText(/Network fee: about/)).toBeTruthy();
    expect(screen.queryByText('Network fee: amount unavailable')).toBeNull();
  });
});
