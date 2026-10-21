/**
 * Two render guards from the 2026-10-18 compliance pass.
 *
 *   * The gauge and the signal rows animate through IntersectionObserver. Where
 *     it does not exist the constructor threw inside the effect, and the
 *     section's error boundary replaced the whole score block (R-9). They now
 *     skip the animation and keep the final value they already render.
 *   * The Backdrop falls back to the group `summary` when a payload has no
 *     `state_view`; that summary is the scored grammar's text and can carry
 *     "(2 of 3 points)", which a state view must not show (MM-2).
 *
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RegimeScore } from '../RegimeScore';
import { SignalCard } from '../SignalCard';
import { StateViewSections } from '@/app/[locale]/(landing)/market/StateViewSections';
import type { SignalGroup } from '@/lib/analytics-sdk/types';

afterEach(cleanup);

describe('without IntersectionObserver', () => {
  const original = globalThis.IntersectionObserver;
  afterEach(() => {
    globalThis.IntersectionObserver = original;
  });

  it('should render the gauge and a signal row with their final values, not throw', () => {
    // @ts-expect-error — simulating a browser that lacks the API
    globalThis.IntersectionObserver = undefined;
    expect(() =>
      render(
        <RegimeScore
          data={{ score: 10, max_score: 14, regime_code: 'CONSTRUCTIVE' }}
          ariaLabel="Score"
        />
      )
    ).not.toThrow();
    expect(screen.getByRole('img', { name: 'Score: 10/14' })).toBeTruthy();

    const { container } = render(
      <SignalCard
        data={
          {
            id: 'btc_structure',
            title: 'BTC Structure',
            points_awarded: 4,
            max_points: 6,
            status: 'STRONG',
            signals: [],
          } as never
        }
        unavailableLabel="Unavailable"
      />
    );
    expect(container.textContent).toContain('4/6');
  });
});

describe('Backdrop lead fallback', () => {
  const t = (_key: string, fallback: string) => fallback;
  const group = (extra: Partial<SignalGroup>): SignalGroup[] => [
    {
      id: 'macro_environment',
      signals: [{ id: 'MAC-01', state: 'ACTIVE', summary: 'The dollar is firm.' }],
      ...extra,
    } as unknown as SignalGroup,
  ];

  it('should not show a summary that carries a score fragment', () => {
    const { container } = render(
      <StateViewSections
        viewSlug="backdrop"
        signalGroups={group({ summary: 'Macro conditions are mixed (2 of 3 points).' })}
        t={t}
      />
    );
    expect(container.textContent).not.toMatch(/of 3 points/);
  });

  it('should show a summary with no score fragment', () => {
    const { container } = render(
      <StateViewSections
        viewSlug="backdrop"
        signalGroups={group({ summary: 'Macro conditions are mixed.' })}
        t={t}
      />
    );
    expect(container.textContent).toContain('Macro conditions are mixed.');
  });
});
