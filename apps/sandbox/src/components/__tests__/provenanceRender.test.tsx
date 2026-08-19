// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import type { ProtocolApy, ProtocolId } from '@diboas/defi';
import { getStrategy } from '@diboas/defi';
import { PathCard } from '../PathCard';
import { StrategyPicker } from '../StrategyPicker';

/**
 * E10 render tests for the §3-A provenance surfaces: the three states render
 * the RIGHT stamp/row strings, the mixed stamp names the protocol, and the
 * F6 band disclosure renders with the picker. Uses real message TEXT (not just
 * ids) so a wrong-state render fails loudly.
 */

const M = {
  'pathCard.title': 'Your path',
  'pathCard.subtitle': 'The path, the cost, the risk.',
  'pathCard.pathTitle': 'The path',
  'pathCard.pathLine': '{goal} via {strategy} on {chain}',
  'pathCard.costTitle': 'The cost',
  'pathCard.entryFee': 'Entry: free',
  'pathCard.networkFee': 'Network fee: {amount}',
  'pathCard.exitFee': 'Exit: 0.39% (min {min})',
  'pathCard.riskTitle': 'The risk',
  'pathCard.riskStable': 'Stable strategies',
  'pathCard.riskGrowth': '{percent}% growth exposure',
  'pathCard.noPromise': 'Never a promise.',
  'common.dataLive': 'Live from {source}, fetched {date}',
  'common.dataMixed':
    'Partly live from {source}, fetched {date}. Reference values ({fixtureDate}) for: {protocols}.',
  'common.dataFixture': 'Documented reference values ({date}), not live market data.',
  'catalog.protocols.skySsr': 'Sky Savings Rate',
  'catalog.protocols.aaveV3': 'Aave v3',
  'catalog.protocols.compoundV3': 'Compound v3',
  'catalog.strategies.safeHarbor.name': 'Safe Harbor',
  'catalog.strategies.safeHarbor.tagline': 'Calm and steady.',
  'catalog.strategies.goalKeeper.name': 'Goal Keeper',
  'catalog.strategies.goalKeeper.tagline': 'Keeps the goal.',
  'catalog.strategies.stableGrowth.name': 'Stable Growth',
  'catalog.strategies.stableGrowth.tagline': 'A little growth.',
  'catalog.strategies.steadyProgress.name': 'Steady Progress',
  'catalog.strategies.steadyProgress.tagline': 'Progress, steadily.',
  'goalNew.strategiesTitle': 'Pick a strategy',
  'goalNew.strategiesNote': 'A filter, not advice.',
  'goalNew.strategiesBands':
    'Each timeframe shows the same four strategies, plus the option to keep it as cash.',
  'goalNew.riskStable': 'Stable',
  'goalNew.riskGrowth': 'Growth',
  'goalNew.apyNow': 'Current pool rate: {apy}%/yr (real, variable)',
  'goalNew.apyNowMixed':
    'Blended pool rate: {apy}%/yr (variable, includes documented reference values)',
  'goalNew.apyNowFixture': 'Reference pool rate: {apy}%/yr (documented values, not live)',
  'goalNew.growthExposure': '{percent}% growth',
};

const safeHarbor = getStrategy('safeHarbor')!;

function apy(
  protocolId: ProtocolId,
  source: 'defillama' | 'fixture',
  asOf: string,
  chain: 'Arbitrum' | 'Solana' = 'Arbitrum'
): ProtocolApy {
  return { protocolId, apyPercent: 4, tvlUsd: null, chain, stamp: { source, asOf } };
}

const LIVE = [
  apy('skySsr', 'defillama', '2026-08-19T00:00:00Z'),
  apy('aaveV3', 'defillama', '2026-08-19T00:00:00Z'),
  apy('compoundV3', 'defillama', '2026-08-19T00:00:00Z'),
];
const MIXED = [
  apy('skySsr', 'defillama', '2026-08-19T00:00:00Z'),
  apy('aaveV3', 'fixture', '2026-07-18'),
  apy('compoundV3', 'defillama', '2026-08-19T00:00:00Z'),
];
const FIXTURE = [
  apy('skySsr', 'fixture', '2026-07-18'),
  apy('aaveV3', 'fixture', '2026-07-18'),
  apy('compoundV3', 'fixture', '2026-07-18'),
];

function renderCard(apys: ProtocolApy[]) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <PathCard
        goalName="Trip"
        strategy={safeHarbor}
        apys={apys}
        gas={[]}
        usdPriceLocal={1}
        currency="USD"
      />
    </IntlProvider>
  );
}

describe('PathCard provenance stamp (§3-A: the three states, honestly labeled)', () => {
  it('should stamp LIVE with the source and fetch date when every leg is live', () => {
    renderCard(LIVE);
    expect(screen.getByText(/Live from DeFiLlama, fetched/)).toBeTruthy();
  });

  it('should stamp MIXED naming the reference protocol (E5 condition), never claiming fully live', () => {
    renderCard(MIXED);
    const stamp = screen.getByText(/Partly live from DeFiLlama/);
    expect(stamp.textContent).toContain('Aave v3');
    expect(screen.queryByText(/^Live from/)).toBeNull();
  });

  it('should stamp FIXTURE via the locale date formatter, no hardcoded literal (P-F4b)', () => {
    renderCard(FIXTURE);
    const stamp = screen.getByText(/Documented reference values/);
    // The formatter renders a localized date, never the raw ISO literal —
    // and the NAMED day, in every timezone (date-only strings parse local).
    expect(stamp.textContent).not.toContain('2026-07-18');
    expect(stamp.textContent).toContain('Jul 18, 2026');
  });
});

describe('StrategyPicker provenance rows + the F6 band disclosure (§3-A)', () => {
  function renderPicker(apys: ProtocolApy[]) {
    return render(
      <IntlProvider locale="en" messages={M}>
        <StrategyPicker horizonMonths={6} apys={apys} selectedId={null} onSelect={() => {}} />
      </IntlProvider>
    );
  }

  it('should render the F6 band disclosure with the picker', () => {
    renderPicker(FIXTURE);
    expect(
      screen.getByText(
        'Each timeframe shows the same four strategies, plus the option to keep it as cash.'
      )
    ).toBeTruthy();
  });

  it('should label every row "real" ONLY in the all-live state', () => {
    renderPicker(LIVE);
    // safeHarbor + goalKeeper are all-Arbitrum stable strategies → live rows exist.
    expect(screen.getAllByText(/\(real, variable\)/).length).toBeGreaterThan(0);
  });

  it('should downgrade rows honestly on fixture data — no "real" anywhere', () => {
    renderPicker(FIXTURE);
    expect(screen.queryByText(/\(real, variable\)/)).toBeNull();
    expect(screen.getAllByText(/documented values, not live/).length).toBeGreaterThan(0);
  });

  it('should mark a partly-live strategy as mixed, not real', () => {
    renderPicker(MIXED);
    // safeHarbor (sky live, aave fixture, compound live) → mixed row present.
    expect(screen.getAllByText(/includes documented reference values/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\(real, variable\)/)).toBeNull();
  });
});
