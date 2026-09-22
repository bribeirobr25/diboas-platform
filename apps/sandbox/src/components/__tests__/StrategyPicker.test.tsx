// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import type { ProtocolApy, ProtocolId } from '@diboas/defi';
import { STRATEGY_CATALOG, FIXTURE_STAMP } from '@diboas/defi';
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

const M = {
  'goalNew.strategiesTitle': 'Strategies whose horizon matches yours',
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
    stamp: FIXTURE_STAMP,
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
        now={props.now ?? WITHIN_FIXTURE_WINDOW}
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

/**
 * `5.436` · CANDIDATE_UNAVAILABLE on the catalogue — Product ruling 2026-09-22.
 *
 * The clock is pushed PAST the fixture window so every candidate's rate
 * evidence is outside the acceptable current-facing vintage. What must survive
 * is the candidate itself: the ruling is explicit that an unavailable rate does
 * NOT mean the strategy is deleted, invalid, an error, or an economic loss.
 */
describe('5.436 — an unavailable rate hides the number, never the candidate', () => {
  const PAST_WINDOW = '2026-09-22T00:00:00Z';
  const MESSAGES = {
    ...M,
    ...NAMES,
    ...TAGLINES,
    'common.optionUnavailable': 'This option is not available right now',
  };

  function renderUnavailable() {
    render(
      <IntlProvider locale="en" messages={MESSAGES} onError={() => {}}>
        <StrategyPicker
          horizonMonths={6}
          apys={APYS}
          selectedId={null}
          onSelect={vi.fn()}
          now={PAST_WINDOW}
        />
      </IntlProvider>
    );
  }

  it('should keep every candidate VISIBLE', () => {
    renderUnavailable();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('should keep the candidate INSPECTABLE — identity, risk band and tagline survive', () => {
    /* Ruling §4/§5: identity, risk context and the strategy's own properties
       are independently true and must not be withdrawn with the rate. */
    renderUnavailable();
    expect(screen.getByText('safeHarbor')).toBeTruthy();
    expect(screen.getByText('safeHarbor tagline')).toBeTruthy();
    expect(screen.getAllByText('Stable').length).toBeGreaterThan(0);
  });

  it('should show the approved GENERIC unavailable copy, not a number', () => {
    /**
     * ⚑ Counted by CONTAINMENT, not exact text. A growth candidate's rate span
     * also carries "· 35% growth" — growth exposure is a property of the
     * STRATEGY, not of today's rate, so it stays true and stays rendered. An
     * exact-text matcher found only the two stable rows and read as a missing
     * state; the surface was right and the first assertion was wrong.
     */
    renderUnavailable();
    const withCopy = [...document.querySelectorAll('span')].filter((el) =>
      el.textContent?.includes('This option is not available right now')
    );
    expect(withCopy.length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByText(/Current pool rate/)).toBeNull();
    expect(screen.queryByText(/Reference pool rate/)).toBeNull();
    /* Growth exposure survives alongside the unavailable state. */
    expect(document.body.textContent).toContain('% growth');
  });

  it('should show no 0%, no stale figure and no bare dash as the state', () => {
    renderUnavailable();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/\b0(\.00)?%/);
    expect(body).not.toContain('4%');
    /* A dash alone says nothing; the words carry the state. */
    expect(body).not.toMatch(/^\s*[—–-]\s*$/m);
  });

  it('should make the candidate NOT SELECTABLE for a new rate-dependent decision', () => {
    renderUnavailable();
    for (const radio of screen.getAllByRole('radio') as HTMLInputElement[]) {
      expect(radio.disabled).toBe(true);
    }
  });

  it('should not fire onSelect when an unavailable candidate is clicked', () => {
    const onSelect = vi.fn();
    render(
      <IntlProvider locale="en" messages={MESSAGES} onError={() => {}}>
        <StrategyPicker
          horizonMonths={6}
          apys={APYS}
          selectedId={null}
          onSelect={onSelect}
          now={PAST_WINDOW}
        />
      </IntlProvider>
    );
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should keep the SAME candidate universe under the Risk filter', () => {
    /**
     * Ruling §4: an unavailable rate must NOT remove the candidate from Risk.
     * Potential Return and Risk are two lenses over one universe, so filtering
     * by risk band must still find these candidates.
     */
    render(
      <IntlProvider locale="en" messages={MESSAGES} onError={() => {}}>
        <StrategyPicker
          horizonMonths={6}
          apys={APYS}
          selectedId={null}
          onSelect={vi.fn()}
          now={PAST_WINDOW}
        />
      </IntlProvider>
    );
    fireEvent.change(screen.getByLabelText('Risk band'), { target: { value: 'stable' } });
    expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
    expect(
      [...document.querySelectorAll('span')].some((el) =>
        el.textContent?.includes('This option is not available right now')
      )
    ).toBe(true);
  });

  it('should keep catalog ORDER — unavailability is stated, never reordered', () => {
    /**
     * The ruling speaks of placing unavailable candidates after the rankable
     * set. This catalogue has NO ranking: R-3 requires the full matching list
     * in stable catalog order, no scoring and no reordering. Moving these rows
     * would BE the reordering that rule forbids and would leak a judgement the
     * data does not support. Measured proof that the instruction's clause has
     * no subject here.
     */
    renderUnavailable();
    const rendered = (screen.getAllByRole('radio') as HTMLInputElement[]).map((r) => r.value);
    const expected = STRATEGY_CATALOG.filter((s) => rendered.includes(s.id)).map((s) => s.id);
    expect(rendered).toEqual(expected);
  });
});
