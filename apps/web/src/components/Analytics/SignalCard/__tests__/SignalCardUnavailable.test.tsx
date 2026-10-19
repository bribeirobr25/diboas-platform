/**
 * An unavailable signal group never reads as a weak score (2026-10-19).
 *
 * ETF-01 is suspended from the 2026-10-19 cycle, so Institutional Demand has
 * nothing evaluated and carries 0 of 2 points. The closed row used to show
 * "0/2" over an empty bar with `data-status="WEAK"`, and a screen reader heard
 * only "0/2 Institutional Demand". Now the row keeps "0/2", shows the approved
 * "Unavailable" word in place of the bar, and its accessible text is the
 * group's own sentence, which the generator words per cause. The control: a
 * group that WAS evaluated and scored 0 keeps its bar and its WEAK status.
 *
 * Copy comes from the real catalogue and template library in all four locales.
 *
 * @vitest-environment happy-dom
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SignalCard } from '../SignalCard';
import type { SignalGroup } from '@/lib/analytics-sdk/types';

afterEach(cleanup);

const WEB = join(__dirname, '../../../../..'); // apps/web
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
type Locale = (typeof LOCALES)[number];

const groupTpl = JSON.parse(
  readFileSync(join(WEB, 'scripts/market-refresh/templates/group-summaries.json'), 'utf8')
).institutional_demand;
const signalTpl = JSON.parse(
  readFileSync(join(WEB, 'scripts/market-refresh/templates/signal-sentences.json'), 'utf8')
)['ETF-01'];
const unavailableWord = (locale: Locale): string =>
  JSON.parse(
    readFileSync(join(WEB, `../../packages/i18n/translations/${locale}/market.json`), 'utf8')
  ).dashboard.freshness.UNAVAILABLE;

const fill = (t: string) =>
  t
    .replace('{points}', '0')
    .replace('{max}', '2')
    .replace('{snapshots}', '3')
    .replace('{warmupTarget}', '5')
    .replace('{positives}', '1');

function group(
  status: SignalGroup['status'],
  state: 'UNAVAILABLE' | 'INACTIVE',
  groupSentence: string,
  signalSentence: string
): SignalGroup {
  return {
    id: 'institutional_demand',
    category: 'INSTITUTIONAL_DEMAND',
    title: 'Institutional Demand',
    status,
    points_awarded: 0,
    max_points: 2,
    summary: fill(groupSentence),
    signals: [
      {
        id: 'ETF-01',
        category: 'INSTITUTIONAL_DEMAND',
        title: 'Positive ETF Flows',
        state,
        points_awarded: 0,
        max_points: 2,
        summary: fill(signalSentence),
        last_updated_at: '2026-10-19T13:16:47.917Z',
      },
    ],
  } as SignalGroup;
}

/** What assistive tech reads from the closed row: its text minus aria-hidden subtrees. */
function accessibleRowText(container: HTMLElement): string {
  const summary = container.querySelector('summary');
  if (!summary) throw new Error('no <summary>');
  const clone = summary.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const SUSPENDED_WORD: Record<Locale, RegExp> = {
  en: /suspend/i,
  'pt-BR': /suspens/i,
  es: /suspend/i,
  de: /ausgesetzt/i,
};

describe.each(LOCALES)('SignalCard — unavailable group (%s)', (locale) => {
  const word = unavailableWord(locale);
  const suspended = () =>
    group(
      'UNAVAILABLE',
      'UNAVAILABLE',
      groupTpl.suspended[locale],
      signalTpl.UNAVAILABLE.variants.suspended[locale]
    );

  it('should show 0/2 and the Unavailable word on the CLOSED row, with no bar', () => {
    const { container } = render(<SignalCard data={suspended()} unavailableLabel={word} />);
    const details = container.querySelector('details');
    expect(details?.open).toBe(false);
    expect(details?.getAttribute('data-status')).toBe('UNAVAILABLE');
    const summary = container.querySelector('summary');
    expect(summary?.textContent).toContain('0/2');
    expect(summary?.textContent).toContain(word);
    // The bar is the only element with an inline width.
    expect(container.querySelector('[style*="width"]')).toBeNull();
  });

  it('should give the closed row an accessible text that says why, never a bare 0/2', () => {
    const { container } = render(<SignalCard data={suspended()} unavailableLabel={word} />);
    const text = accessibleRowText(container);
    expect(text).toContain('Institutional Demand');
    expect(text).toContain(word);
    expect(text).toContain(fill(groupTpl.suspended[locale]));
    expect(text).not.toContain('0/2');
  });

  it('should show the group and signal sentences when the row is opened', () => {
    const { container } = render(<SignalCard data={suspended()} unavailableLabel={word} />);
    const details = container.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    const body = details.querySelector('summary + div');
    expect(body?.textContent).toContain(fill(groupTpl.suspended[locale]));
    expect(body?.textContent).toContain(fill(signalTpl.UNAVAILABLE.variants.suspended[locale]));
  });

  it('should not call a warm-up "suspended": the accessible text follows the cause', () => {
    const warmUp = group(
      'UNAVAILABLE',
      'UNAVAILABLE',
      groupTpl.unavailable[locale],
      signalTpl.UNAVAILABLE[locale]
    );
    const { container } = render(<SignalCard data={warmUp} unavailableLabel={word} />);
    const text = accessibleRowText(container);
    expect(text).toContain(fill(groupTpl.unavailable[locale]));
    expect(text).not.toMatch(SUSPENDED_WORD[locale]);
  });

  it('should render data generated before the UNAVAILABLE status as unavailable too', () => {
    // The 2026-10-19 refresh was computed with status WEAK beside an all-
    // UNAVAILABLE group; that payload must never render as a weak read.
    const legacy = { ...suspended(), status: 'WEAK' as const };
    const { container } = render(<SignalCard data={legacy} unavailableLabel={word} />);
    expect(container.querySelector('details')?.getAttribute('data-status')).toBe('UNAVAILABLE');
    expect(container.querySelector('summary')?.textContent).toContain(word);
    expect(container.querySelector('[style*="width"]')).toBeNull();
  });

  it('control: an EVALUATED 0/2 stays WEAK, with its bar and an audible 0/2', () => {
    const weak = group('WEAK', 'INACTIVE', groupTpl.weak[locale], signalTpl.INACTIVE[locale]);
    const { container } = render(<SignalCard data={weak} unavailableLabel={word} />);
    expect(container.querySelector('details')?.getAttribute('data-status')).toBe('WEAK');
    expect(container.querySelector('summary')?.textContent).not.toContain(word);
    expect(container.querySelector('[style*="width"]')).not.toBeNull();
    expect(accessibleRowText(container)).toContain('0/2');
  });
});
