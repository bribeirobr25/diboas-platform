/**
 * MKT-EVENT-1 and MKT-EVENT-2 · the /market product events (market clean-up W-C; founder
 * decisions DR-2026-11-11-market-cleanup-decisions items 7 and 8).
 *
 *   * A `<details>` toggle event does NOT bubble: the tracker must listen in the capture phase,
 *     so these tests dispatch a non-bubbling toggle (a bubbling listener fails them).
 *   * Once per element per page view; never on close; a link to the current view is not a
 *     switch; a new view (remount) starts over.
 *   * Caller parameters come only from registry ids: free text in `data-market-value` sends
 *     nothing, and every markup site binds the value to a registry id.
 *
 * @vitest-environment happy-dom
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const track = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics', () => ({ analyticsService: { track } }));
const consent = vi.hoisted(() => ({ given: true }));
vi.mock('@/components/CookieConsent/consentUtils', () => ({
  hasAnalyticsConsent: () => consent.given,
}));

import { MarketInteractionTracker } from '../MarketInteractionTracker/MarketInteractionTracker';
import { MARKET_EVENTS } from '@/lib/market/constants';

const toggle = (el: HTMLDetailsElement, open: boolean) => {
  el.open = open;
  el.dispatchEvent(new Event('toggle', { bubbles: false }));
};

function page(view: string) {
  return (
    <div>
      <MarketInteractionTracker key={view} view={view} />
      <details data-market-event={MARKET_EVENTS.MEMO_OPENED} data-testid="memo">
        <summary>memo</summary>
      </details>
      <details
        data-market-event={MARKET_EVENTS.SIGNAL_GROUP_OPENED}
        data-market-value="relative_strength"
        data-testid="group2"
      >
        <summary>group 2</summary>
      </details>
      <details
        data-market-event={MARKET_EVENTS.SIGNAL_GROUP_OPENED}
        data-market-value="macro_environment"
        data-testid="group"
      >
        <summary>group</summary>
      </details>
      <details
        data-market-event={MARKET_EVENTS.BACKDROP_EXPLAINER_OPENED}
        data-market-value="Ana Silva <ana@x.com>"
        data-testid="bad"
      >
        <summary>bad</summary>
      </details>
      <a
        href="/en/market/backdrop"
        data-market-event={MARKET_EVENTS.VIEW_SWITCHED}
        data-market-value="backdrop"
      >
        Backdrop
      </a>
      <a
        href="/en/market/bitcoin"
        aria-current="page"
        data-market-event={MARKET_EVENTS.VIEW_SWITCHED}
        data-market-value="bitcoin"
      >
        Bitcoin
      </a>
    </div>
  );
}

beforeEach(() => {
  track.mockClear();
  consent.given = true;
});
afterEach(() => cleanup());

describe('MKT-EVENT-1: each /market event fires once, on the first open', () => {
  it('should send memo opened once on first open and never on close (non-bubbling toggle)', () => {
    const { getByTestId } = render(page('bitcoin'));
    const memo = getByTestId('memo') as HTMLDetailsElement;
    toggle(memo, true);
    toggle(memo, false);
    toggle(memo, true);
    expect(track.mock.calls).toEqual([
      [{ name: 'market_memo_opened', parameters: { view: 'bitcoin' } }],
    ]);
  });

  it('should send the signal group with its id', () => {
    const { getByTestId } = render(page('bitcoin'));
    toggle(getByTestId('group') as HTMLDetailsElement, true);
    expect(track).toHaveBeenCalledWith({
      name: 'market_signal_group_opened',
      parameters: { view: 'bitcoin', group: 'macro_environment' },
    });
  });

  it('should send a view switch for another view and not for the current one', () => {
    const { getByText } = render(page('bitcoin'));
    getByText('Bitcoin').click();
    getByText('Backdrop').click();
    expect(track.mock.calls).toEqual([
      [{ name: 'market_view_switched', parameters: { from: 'bitcoin', to: 'backdrop' } }],
    ]);
  });

  it('should start over on another view (remount by key)', () => {
    const { getByTestId, rerender } = render(page('bitcoin'));
    toggle(getByTestId('memo') as HTMLDetailsElement, true);
    rerender(page('backdrop'));
    const memo = getByTestId('memo') as HTMLDetailsElement;
    toggle(memo, false);
    toggle(memo, true);
    expect(track.mock.calls.map((c) => c[0].parameters.view)).toEqual(['bitcoin', 'backdrop']);
  });

  it('should stop listening when unmounted', () => {
    const { getByTestId, unmount } = render(page('bitcoin'));
    const memo = getByTestId('memo') as HTMLDetailsElement;
    unmount();
    document.body.appendChild(memo);
    toggle(memo, true);
    expect(track).not.toHaveBeenCalled();
    memo.remove();
  });
});

describe('MKT-EVENT-1: the audit cases (2026-11-12)', () => {
  it('should send one event per element, so two signal groups send two', () => {
    const { getByTestId } = render(page('bitcoin'));
    toggle(getByTestId('group') as HTMLDetailsElement, true);
    toggle(getByTestId('group2') as HTMLDetailsElement, true);
    expect(track.mock.calls.map((c) => c[0].parameters.group)).toEqual([
      'macro_environment',
      'relative_strength',
    ]);
  });

  it('should send nothing when the first toggle is a close (a row already open on render)', async () => {
    const { getByTestId } = render(
      <div>
        <MarketInteractionTracker view="bitcoin" />
        <details open data-market-event={MARKET_EVENTS.MEMO_OPENED} data-testid="open-memo">
          <summary>memo</summary>
        </details>
      </div>
    );
    await new Promise((r) => setTimeout(r, 0)); // let any queued toggle from the open attribute land
    track.mockClear();
    toggle(getByTestId('open-memo') as HTMLDetailsElement, false);
    expect(track).not.toHaveBeenCalled();
  });

  it('should not count a modified or middle click as a view switch', () => {
    const { getByText } = render(page('bitcoin'));
    const link = getByText('Backdrop');
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { button: 1 }]) {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    }
    expect(track).not.toHaveBeenCalled();
  });

  it('should not mark an open before consent as sent, so it counts after consent', () => {
    consent.given = false;
    const { getByTestId } = render(page('bitcoin'));
    const memo = getByTestId('memo') as HTMLDetailsElement;
    toggle(memo, true);
    expect(track).not.toHaveBeenCalled();
    consent.given = true;
    toggle(memo, false);
    toggle(memo, true);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('should keep the tracker mounted once on each market page and every event attribute in place', () => {
    const SRC = join(__dirname, '../../..');
    const read = (f: string) => readFileSync(join(SRC, f), 'utf8');
    const shell = read('app/[locale]/(landing)/market/MarketViewShell.tsx');
    const umbrella = read('app/[locale]/(landing)/market/UmbrellaView.tsx');
    expect(shell.match(/<MarketInteractionTracker\b/g)).toHaveLength(1);
    expect(umbrella.match(/<MarketInteractionTracker\b/g)).toHaveLength(1);
    const expected: Array<[string, string, number]> = [
      ['app/[locale]/(landing)/market/MarketViewShell.tsx', 'MEMO_OPENED', 1],
      ['app/[locale]/(landing)/market/StateViewSections.tsx', 'MEMO_OPENED', 1],
      ['app/[locale]/(landing)/market/StateViewSections.tsx', 'BACKDROP_EXPLAINER_OPENED', 1],
      ['components/Analytics/SignalCard/SignalCard.tsx', 'SIGNAL_GROUP_OPENED', 1],
      ['app/[locale]/(landing)/market/MarketViewSwitcher.tsx', 'VIEW_SWITCHED', 1],
      ['app/[locale]/(landing)/market/UmbrellaView.tsx', 'VIEW_SWITCHED', 1],
    ];
    for (const [file, event, count] of expected) {
      const hits = read(file).match(
        new RegExp(`data-market-event=\\{MARKET_EVENTS\\.${event}\\}`, 'g')
      );
      expect(hits?.length ?? 0, `${file} ${event}`).toBe(count);
    }
  });
});

describe('MKT-EVENT-2: caller parameters come from registries only', () => {
  it('should send nothing when the value is free text', () => {
    const { getByTestId } = render(page('backdrop'));
    toggle(getByTestId('bad') as HTMLDetailsElement, true);
    expect(track).not.toHaveBeenCalled();
  });

  it('should bind every data-market-value in the views to a registry id', () => {
    const SRC = join(__dirname, '../../..');
    const sites: Array<[string, RegExp]> = [
      ['components/Analytics/SignalCard/SignalCard.tsx', /data-market-value=\{data\.id\}/],
      ['app/[locale]/(landing)/market/StateViewSections.tsx', /data-market-value=\{id\}/],
      ['app/[locale]/(landing)/market/MarketViewSwitcher.tsx', /data-market-value=\{view\.slug\}/],
      ['app/[locale]/(landing)/market/UmbrellaView.tsx', /data-market-value=\{model\.slug\}/],
    ];
    for (const [file, binding] of sites) {
      const src = readFileSync(join(SRC, file), 'utf8');
      const values = src.match(/data-market-value=\{[^}]+\}/g) ?? [];
      expect(values.length, file).toBe(1);
      expect(src, file).toMatch(binding);
    }
  });
});
