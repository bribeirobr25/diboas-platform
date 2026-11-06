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

/**
 * 7th audit · EVERY copy branch, as rendered values (the first version rendered two of ~9, so a
 * swapped message id, a dropped value or a high-as-low today line passed every test).
 */
describe('PR 2 · every copy branch renders its own text with its own values', () => {
  const amount = (a: string) => ({ kind: 'modelled' as const, amount: a });
  const text = (view: ProjectionView) => {
    const { container } = show(view);
    const t = container.textContent ?? '';
    cleanup();
    return t;
  };
  const sims = (line: Extract<ProjectionView, { kind: 'simulated' }>['line'], growthNote = false) =>
    ({ kind: 'simulated', growthNote, range, line }) as ProjectionView;

  it.each<[string, ProjectionView, string[], string[]]>([
    [
      'simulated · up to',
      sims({ kind: 'neededUpTo', max: amount('8'), monthsLeft: 36 }),
      ['up to $8 a month would reach $10,000 in the 36 months left'],
      ['about $8'],
    ],
    [
      'simulated · already enough',
      sims({ kind: 'alreadyEnough', monthsLeft: 12 }),
      ['what this goal holds would reach $10,000 in the 12 months left', 'without adding more'],
      ['over the past 12 months'],
    ],
    [
      'simulated · with a plan (Case 3)',
      sims(
        {
          kind: 'withPlan',
          amount: amount('250'),
          when: { kind: 'range', minYears: 4, maxYears: 6 },
        },
        true
      ),
      [
        'at $250 a month $10,000 would be reached in about 4 to 6 years',
        "Part of this goal's money moves with market prices",
        'It assumes $250 is added each month.',
      ],
      [],
    ],
    [
      'simulated · one amount',
      sims({ kind: 'needed', amounts: amount('209'), monthsLeft: 1 }),
      ['about $209 a month would reach $10,000 in the 1 month left'],
      ['$209 to $209', '1 months'],
    ],
    [
      'Case 3 without a line',
      sims(null, true),
      ["Part of this goal's money moves with market prices", 'Illustrative projection'],
      ['Simulated:'],
    ],
    [
      'live · no plan, under a year',
      { ...LIVE, withPlan: null, when: { kind: 'underYear' }, pace: null } as ProjectionView,
      ['From what this goal holds, $10,000 would be reached within a year'],
      ['It assumes', 'This pace'],
    ],
    [
      'live · today as a range',
      {
        ...LIVE,
        today: { kind: 'range', lowPercent: 3.1, highPercent: 3.6, asOf: dayAgo(1) },
      } as ProjectionView,
      ['Base pool rates observed: 3.1% to 3.6%'],
      ['3.6% to 3.6%', '3.1% to 3.1%'],
    ],
    [
      'live · pace lands around',
      { ...LIVE, pace: { status: 'edge', monthsLeft: 26 } } as ProjectionView,
      ['This pace lands around the 26 months left in your timeframe.'],
      ['fits inside', 'runs longer'],
    ],
    [
      'live · pace runs longer',
      { ...LIVE, pace: { status: 'beyond', monthsLeft: 24 } } as ProjectionView,
      ['This pace runs longer than the 24 months left in your timeframe.'],
      ['fits inside', 'lands around'],
    ],
    [
      'live · past the longest horizon',
      {
        ...LIVE,
        withPlan: null,
        when: { kind: 'overCap', years: 40 },
        pace: null,
      } as ProjectionView,
      ['would be reached in more than 40 years'],
      ['in about'],
    ],
    [
      'live · a range of years',
      { ...LIVE, when: { kind: 'range', minYears: 3, maxYears: 4 } } as ProjectionView,
      ['in about 3 to 4 years'],
      [],
    ],
  ])('should render %s', (_label, view, present, absent) => {
    const t = text(view);
    for (const p of present) expect(t, p).toContain(p);
    for (const a of absent) expect(t, a).not.toContain(a);
  });
});
