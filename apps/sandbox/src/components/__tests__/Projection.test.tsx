// @vitest-environment happy-dom
/**
 * PR 2 · guard 5 (P3 §6) — the tag, both disclosures and the caveat render as VALUES on every
 * outcome, in every locale; Case U and loading show no number; the attribution is the screen's
 * call; the age line never says "yesterday". Values are asserted, never the controlling flag.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { SANDBOX_LOCALES } from '@/i18n/config';
import type { ProjectionView } from '@/view/projection';
import { Projection } from '../Projection';

afterEach(cleanup);

const DAY_MS = 86_400_000;
const dayAgo = (n: number) => new Date(Date.now() - n * DAY_MS).toISOString().slice(0, 10);
const range = { lowPercent: 2.8, highPercent: 3, windowMonths: 8 };

const LIVE: ProjectionView = {
  kind: 'live',
  withPlan: { kind: 'modelled', amount: '200' },
  when: { kind: 'single', years: 3 },
  range,
  today: { kind: 'single', ratePercent: 3.5, asOf: dayAgo(1) },
  pace: { status: 'within', monthsLeft: 48 },
};
const SIMULATED: ProjectionView = {
  kind: 'simulated',
  growthNote: true,
  range,
  line: {
    kind: 'needed',
    amounts: { min: { kind: 'modelled', amount: '204' }, max: { kind: 'modelled', amount: '209' } },
    monthsLeft: 36,
  },
  pace: null,
};

function show(view: ProjectionView, locale = 'en', showAttribution = false) {
  return render(
    <IntlProvider locale={locale} messages={getMessages(locale as never)}>
      <Projection view={view} target="$10,000" currency="USD" showAttribution={showAttribution} />
    </IntlProvider>
  );
}

describe('PR 2 · Projection renders the outcome with its disclosures, every locale', () => {
  it.each(SANDBOX_LOCALES)(
    'should render the tag, both disclosures and the caveat (%s)',
    (locale) => {
      const m = getMessages(locale);
      for (const view of [LIVE, SIMULATED]) {
        const { container } = show(view, locale);
        const text = container.textContent ?? '';
        for (const key of [
          'projection.tag',
          'projection.disclosure',
          'projection.disclosureUsdPools',
          'projection.caveat',
        ])
          expect(text, `${locale} ${view.kind} ${key}`).toContain(m[key]);
        cleanup();
      }
    }
  );

  it('should state the rates to one decimal, always ("3.0%"), and the money in whole units', () => {
    const { container } = show(LIVE);
    const text = container.textContent ?? '';
    expect(text).toContain('2.8%');
    expect(text).toContain('3.0%');
    expect(text).toContain('$200');
    expect(text).toContain('about 3 years');
  });

  it('should join a needed range with the locale amount-range text', () => {
    const { container } = show(SIMULATED, 'de');
    expect(container.textContent).toMatch(/204\s?\$ bis 209\s?\$/);
  });

  it('should show the age as a count, never as "yesterday"', () => {
    const { container } = show(LIVE);
    expect(container.textContent).toContain('1 day ago');
    expect(container.textContent).not.toMatch(/yesterday/i);
  });

  it('should keep the method in a native disclosure', () => {
    const { container } = show(LIVE);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details!.querySelector('summary')!.textContent).toBe('How this is worked out');
    expect(details!.textContent).toContain('It assumes $200 is added each month.');
  });

  it.each(['loading', 'unavailable'] as const)(
    'should show no number and no disclosure while %s, inside the polite live region',
    (kind) => {
      const { container } = show({ kind });
      const region = container.querySelector('[aria-live="polite"]');
      expect(region).not.toBeNull();
      expect(region!.textContent).toBe(getMessages('en')[`projection.${kind}`]);
      expect(container.textContent).not.toMatch(/\d/);
    }
  );

  it('should render nothing for none', () => {
    const { container } = show({ kind: 'none' });
    expect(container.innerHTML).toBe('');
  });

  it('should render the attribution only when the screen asks for it', () => {
    show(LIVE, 'en', true);
    expect(screen.getByText(/Data provided by CoinGecko/)).toBeTruthy();
    cleanup();
    show(LIVE, 'en', false);
    expect(screen.queryByText(/Data provided by CoinGecko/)).toBeNull();
  });
});
