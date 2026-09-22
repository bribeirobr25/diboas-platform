// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import type { ProtocolApy, ProtocolId } from '@diboas/defi';
import { FIXTURE_STAMP, getStrategy, observedStamp } from '@diboas/defi';
import { StrategyPicker } from '../StrategyPicker';

/**
 * ⛑ `5.436` (2026-09-22). `StrategyPicker` now takes an explicit CURRENT-FACING
 * moment and renders a candidate whose rate evidence is over-age in the
 * approved unavailable state. These fixtures carry `FIXTURE_STAMP`
 * (2026-07-18), so the reference moment sits inside its window: every
 * assertion below keeps testing exactly what it tested before. The rate gate is
 * exercised in its own tests, which supply their own over-age clock.
 */
const WITHIN_FIXTURE_WINDOW = '2026-07-25T09:00:00Z';
/**
 * ⛑ `5.436` (2026-09-22) · THE OBSERVED DATE MOVED, AND HERE IS WHY.
 *
 * These stamps read `2026-08-19` while the pinned clock sits at `2026-07-25`
 * (inside the fixture gas window) — so the "live" APYs were 25 days in the
 * FUTURE relative to the moment the surface was judged at. Nothing read them
 * against a clock before, so the incoherence was invisible; the rate gate reads
 * them, and a future stamp is refused (a clock skew must not manufacture
 * currency).
 *
 * The date is arbitrary test data whose only job is "an observed live reading",
 * and no assertion depends on the literal. Moving it to three days before the
 * clock makes the fixture internally coherent — gas 07-18, rates 07-22, judged
 * at 07-25 — and preserves every subject: live, mixed and fixture provenance
 * all still render exactly as before.
 */
const OBSERVED_AT = '2026-07-22T00:00:00Z';

/**
 * E10 render tests for the §3-A provenance surfaces on the PICKER rows: each
 * state renders the RIGHT row string, and the F6 band disclosure renders with
 * it. Real message TEXT (not ids) so a wrong-state render fails loudly.
 * (The PathCard stamp assertions moved to StrategyDetail.test.tsx when board
 * §3.2 folded that component in — §4.6.)
 */

const M = {
  'pathCard.title': 'Your path',
  'pathCard.subtitle': 'The path, the cost, the risk.',
  'pathCard.pathTitle': 'The path',
  'pathCard.pathLine': '{goal} via {strategy} on {chain}',
  'pathCard.costTitle': 'The cost',
  'pathCard.entryFee': 'Entry: free',
  'pathCard.networkFee': 'Network fee: {amount}',
  'pathCard.exitFee': 'Leaving later: 0.39% (at least {min}, no cap)',
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
  /* Branch on the parameter: a fixture leg must carry `fallbackUsed` and the
     fixture VERSION, a live leg must carry neither (§8.8). A literal `{ source,
     asOf }` could state neither, which is why those fields are required. */
  return {
    protocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain,
    stamp: source === 'fixture' ? FIXTURE_STAMP : observedStamp('defillama', asOf),
  };
}

const LIVE = [
  apy('skySsr', 'defillama', OBSERVED_AT),
  apy('aaveV3', 'defillama', OBSERVED_AT),
  apy('compoundV3', 'defillama', OBSERVED_AT),
];
const MIXED = [
  apy('skySsr', 'defillama', OBSERVED_AT),
  apy('aaveV3', 'fixture', '2026-07-18'),
  apy('compoundV3', 'defillama', OBSERVED_AT),
];
const FIXTURE = [
  apy('skySsr', 'fixture', '2026-07-18'),
  apy('aaveV3', 'fixture', '2026-07-18'),
  apy('compoundV3', 'fixture', '2026-07-18'),
];

describe('StrategyPicker provenance rows + the F6 band disclosure (§3-A)', () => {
  function renderPicker(apys: ProtocolApy[]) {
    return render(
      <IntlProvider locale="en" messages={M}>
        <StrategyPicker
          horizonMonths={6}
          apys={apys}
          selectedId={null}
          onSelect={() => {}}
          now={WITHIN_FIXTURE_WINDOW}
        />
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
