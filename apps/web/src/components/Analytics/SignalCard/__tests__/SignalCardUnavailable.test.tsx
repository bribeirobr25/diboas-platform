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

/** Text assistive tech gets from an element: its text minus aria-hidden subtrees. */
function accessibleText(el: Element | null): string {
  if (!el) throw new Error('element not found');
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}
/** The closed row's accessible name: the <summary>'s text. */
const accessibleRowText = (c: HTMLElement) => accessibleText(c.querySelector('summary'));
/** The progress bar track (CSS-module class `bar`, never `barFill`). */
const bar = (c: HTMLElement) => c.querySelector('[class*="_bar_"]');
const occurrences = (text: string, part: string) => text.split(part).length - 1;
/** textContent joins block-level spans with no space (a browser's accessible
 *  name separates them), so names are compared with whitespace removed: the
 *  content and its ORDER are still pinned. */
const squash = (t: string) => t.replace(/\s+/g, '');

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
    expect(bar(container)).toBeNull();
  });

  it('should name the closed row with its visible label, then Unavailable and the reason, never a bare 0/2', () => {
    // WCAG 2.5.3: the accessible name contains the visible label ("0/2" and
    // the title), and the 0/2 is immediately qualified, so it can never be
    // heard as a measured zero.
    const { container } = render(<SignalCard data={suspended()} unavailableLabel={word} />);
    expect(squash(accessibleRowText(container))).toBe(
      squash(`0/2 Institutional Demand ${word} ${fill(groupTpl.suspended[locale])}`)
    );
  });

  it('should show both sentences in the open body, and give assistive tech the reason once', () => {
    // happy-dom does not apply the closed <details> hiding, so this asserts the
    // CONTENT of the open state; the open/closed rendering itself is checked in
    // a real browser (the PR's visual pass).
    const { container } = render(<SignalCard data={suspended()} unavailableLabel={word} />);
    const details = container.querySelector('details') as HTMLDetailsElement;
    details.open = true;
    const reason = fill(groupTpl.suspended[locale]);
    const body = details.querySelector('summary + div');
    expect(body?.textContent).toContain(reason);
    expect(body?.textContent).toContain(fill(signalTpl.UNAVAILABLE.variants.suspended[locale]));
    expect(occurrences(accessibleText(details), reason)).toBe(1);
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
    expect(bar(container)).toBeNull();
  });

  it('control: an EVALUATED 0/2 stays WEAK, with its bar and an audible 0/2', () => {
    const weak = group('WEAK', 'INACTIVE', groupTpl.weak[locale], signalTpl.INACTIVE[locale]);
    const { container } = render(<SignalCard data={weak} unavailableLabel={word} />);
    expect(container.querySelector('details')?.getAttribute('data-status')).toBe('WEAK');
    expect(container.querySelector('summary')?.textContent).not.toContain(word);
    expect(bar(container)).not.toBeNull();
    expect(squash(accessibleRowText(container))).toBe(squash('0/2 Institutional Demand'));
    // An evaluated group's sentence is read in its open body, as before.
    expect(
      occurrences(accessibleText(container.querySelector('details')), fill(groupTpl.weak[locale]))
    ).toBe(1);
  });
});
