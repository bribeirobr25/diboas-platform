// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import type { ProtocolApy, ProtocolId } from '@diboas/defi';
import { STRATEGY_CATALOG } from '@diboas/defi';
import { StrategyPicker } from '../StrategyPicker';

const M = {
  'goalNew.strategiesTitle': 'Strategies whose horizon matches yours',
  'goalNew.strategiesNote': 'A filter, not advice.',
  'goalNew.strategiesBands':
    'Each timeframe shows the same four strategies, plus the option to keep it as cash.',
  'goalNew.riskStable': 'Stable',
  'goalNew.riskGrowth': 'Growth',
  'goalNew.apyNow': 'Current pool rate: {apy}%/yr (real, variable)',
  'goalNew.apyNowMixed': 'Blended pool rate: {apy}%/yr (variable)',
  'goalNew.apyNowFixture': 'Reference pool rate: {apy}%/yr (documented values, not live)',
  'goalNew.growthExposure': '{percent}% growth',
  'catalogFilters.horizon': 'Time horizon',
  'catalogFilters.risk': 'Risk band',
  'catalogFilters.any': 'Any',
  'catalogFilters.varies': 'Varies',
  'catalogFilters.empty': 'No strategy matches those filters. Widen one to see more.',
  'catalogFilters.neverAdvises': 'You choose. diBoaS never advises.',
  'catalogFilters.horizonBand.short': 'Short',
  'catalogFilters.horizonBand.medium': 'Medium',
  'catalogFilters.horizonBand.long': 'Long',
  'catalogFilters.horizonBand.wealth': 'Wealth',
};

// Catalog names, so assertions read against real product copy.
const NAMES = Object.fromEntries(
  STRATEGY_CATALOG.map((s) => [`catalog.strategies.${s.i18nKey}.name`, s.i18nKey])
);
const TAGLINES = Object.fromEntries(
  STRATEGY_CATALOG.map((s) => [`catalog.strategies.${s.i18nKey}.tagline`, `${s.i18nKey} tagline`])
);

function apy(protocolId: ProtocolId): ProtocolApy {
  return {
    protocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp: { source: 'fixture', asOf: '2026-07-18' },
  };
}
const APYS = (
  ['skySsr', 'aaveV3', 'compoundV3', 'sanctumInf', 'jupiterJlp', 'jito'] as ProtocolId[]
).map(apy);

function renderPicker(props: Partial<React.ComponentProps<typeof StrategyPicker>> = {}) {
  const onSelect = props.onSelect ?? vi.fn();
  render(
    <IntlProvider locale="en" messages={{ ...M, ...NAMES, ...TAGLINES }} onError={() => {}}>
      <StrategyPicker
        horizonMonths={props.horizonMonths ?? 6}
        apys={props.apys ?? APYS}
        selectedId={props.selectedId ?? null}
        onSelect={onSelect}
      />
    </IntlProvider>
  );
  return { onSelect };
}

describe('StrategyPicker — the G5 catalog (§4.5, mockup 13, board §3.5 embedded-only)', () => {
  it('should start the horizon filter at the GOAL\'s own band, not "any"', () => {
    renderPicker({ horizonMonths: 6 }); // → short
    const horizon = screen.getByLabelText('Time horizon') as HTMLSelectElement;
    expect(horizon.value).toBe('short');
    // The short band's four: safeHarbor + stableGrowth (anytime) + goalKeeper + steadyProgress.
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('should widen to the whole catalog when the horizon filter is set to Any', () => {
    renderPicker({ horizonMonths: 6 });
    fireEvent.change(screen.getByLabelText('Time horizon'), { target: { value: 'any' } });
    expect(screen.getAllByRole('radio')).toHaveLength(STRATEGY_CATALOG.length);
  });

  it('should narrow by risk band using the RULED two bands only (never an invented Low/Medium/High)', () => {
    renderPicker({ horizonMonths: 6 });
    const risk = screen.getByLabelText('Risk band') as HTMLSelectElement;
    // Exactly: Any + the two ruled bands.
    expect([...risk.options].map((o) => o.value)).toEqual(['any', 'stable', 'growth']);
    expect(screen.queryByText(/Low risk|Medium risk|High risk/)).toBeNull();
    fireEvent.change(risk, { target: { value: 'stable' } });
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.getAttribute('value')).toBeTruthy();
    }
    expect(screen.getAllByText('Stable').length).toBeGreaterThan(0);
  });

  it('should CLEAR a selection that a filter change hides (E8 — approve can never commit an unseen strategy)', () => {
    const onSelect = vi.fn();
    // goalKeeper is STABLE and visible in the short band…
    renderPicker({ horizonMonths: 6, selectedId: 'goalKeeper', onSelect });
    expect(onSelect).not.toHaveBeenCalled();
    // …until the user narrows to growth, which hides it.
    fireEvent.change(screen.getByLabelText('Risk band'), { target: { value: 'growth' } });
    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('should KEEP a selection the new filter still shows', () => {
    const onSelect = vi.fn();
    renderPicker({ horizonMonths: 6, selectedId: 'goalKeeper', onSelect });
    fireEvent.change(screen.getByLabelText('Risk band'), { target: { value: 'stable' } });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should render the never-advises footer and the "Varies" line on every row', () => {
    renderPicker({ horizonMonths: 6 });
    expect(screen.getByText('You choose. diBoaS never advises.')).toBeTruthy();
    expect(screen.getAllByText('Varies')).toHaveLength(4);
  });

  it('should compose both filters (horizon AND risk), never either alone', () => {
    renderPicker({ horizonMonths: 6 });
    fireEvent.change(screen.getByLabelText('Time horizon'), { target: { value: 'wealth' } });
    fireEvent.change(screen.getByLabelText('Risk band'), { target: { value: 'stable' } });
    // wealth ∩ stable = fullHarvest + safeHarbor (its 'anytime' band spans all).
    const ids = screen.getAllByRole('radio').map((r) => r.getAttribute('value'));
    expect(ids.sort()).toEqual(['fullHarvest', 'safeHarbor']);
    // NOTE: the empty state is structurally UNREACHABLE with today's catalog —
    // the two 'anytime' strategies (one stable, one growth) put at least one
    // row in every combination. It is kept as a defensive branch because D-8
    // states the catalog is NOT frozen (the founder may redesign it through
    // sandbox use), and a filter UI without an empty state would break the
    // moment an 'anytime' entry is removed.
  });

  it('should keep every row equal weight: no badge, no ranking, catalog order preserved', () => {
    renderPicker({ horizonMonths: 6 });
    fireEvent.change(screen.getByLabelText('Time horizon'), { target: { value: 'any' } });
    const rendered = screen.getAllByRole('radio').map((r) => r.getAttribute('value'));
    expect(rendered).toEqual(STRATEGY_CATALOG.map((s) => s.id)); // stable catalog order
    expect(screen.queryByText(/recommended|best|top pick/i)).toBeNull();
  });
});
