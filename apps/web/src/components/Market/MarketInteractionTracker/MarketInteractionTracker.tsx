'use client';

/**
 * Sends the /market product events (`MARKET_EVENTS`) from server-rendered markup, with no
 * per-element client code: the page's `<details>` and view links carry
 * `data-market-event` (+ `data-market-value`), and this island listens on `document` in the
 * CAPTURE phase. Capture matters: a `<details>` `toggle` event does not bubble, so a bubbling
 * listener would never hear it (MKT-EVENT-1 tests exactly that).
 *
 * Once per element per page view (first open only, never on close); a link to the current
 * view (`aria-current="page"`) or a modified/middle click (another tab) is not a switch. An
 * open before consent is not marked sent. Opens before hydration are not counted (no listener
 * yet); an UNAVAILABLE row's open counts like any other (its state is not a parameter).
 * Stated limits for the German kill-signal (analytics-integration.md). Renders nothing; keyed by the view slug so a
 * client navigation to another view starts a fresh page view. Consent is enforced by the
 * analytics service (`track` returns before consent).
 */
import { useEffect } from 'react';
import { hasAnalyticsConsent } from '@/components/CookieConsent/consentUtils';
import { analyticsService } from '@/lib/analytics';
import { MARKET_EVENTS, type MarketEventName } from '@/lib/market/constants';

const EVENT_NAMES: ReadonlySet<string> = new Set(Object.values(MARKET_EVENTS));
/** A registry id (view slug, group id, condition id): never free text. */
const SAFE_VALUE = /^[a-z0-9_-]{1,40}$/i;

function parametersFor(
  name: MarketEventName,
  view: string,
  value: string | undefined
): Record<string, string> | null {
  if (name === MARKET_EVENTS.MEMO_OPENED) return { view };
  if (!value || !SAFE_VALUE.test(value)) return null;
  if (name === MARKET_EVENTS.SIGNAL_GROUP_OPENED) return { view, group: value };
  if (name === MARKET_EVENTS.BACKDROP_EXPLAINER_OPENED) return { view, condition: value };
  return { from: view, to: value };
}

export function MarketInteractionTracker({ view }: { view: string }) {
  useEffect(() => {
    const sent = new Set<string>();
    const send = (el: Element) => {
      const name = el.getAttribute('data-market-event');
      if (!name || !EVENT_NAMES.has(name)) return;
      const value = el.getAttribute('data-market-value') ?? undefined;
      const key = `${name}:${value ?? ''}`;
      if (sent.has(key)) return;
      const parameters = parametersFor(name as MarketEventName, view, value);
      if (!parameters) return;
      // Without consent nothing is sent, so nothing is marked sent: an open before the banner is
      // answered can still count once consent is given (2026-11-12 audit).
      if (!hasAnalyticsConsent()) return;
      sent.add(key);
      analyticsService.track({ name, parameters });
    };
    const onToggle = (event: Event) => {
      const el = event.target;
      if (el instanceof HTMLDetailsElement && el.open) send(el);
    };
    const onClick = (event: MouseEvent) => {
      // A modified or non-primary click opens another tab: not a switch of this page's view.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const link = (event.target as Element | null)?.closest?.('a[data-market-event]');
      if (!link || link.getAttribute('aria-current') === 'page') return;
      send(link);
    };
    document.addEventListener('toggle', onToggle, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('toggle', onToggle, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [view]);

  return null;
}
