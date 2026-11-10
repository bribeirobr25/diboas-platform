/**
 * PostHog `before_send` (twelfth audit: 5.864). PostHog records the page address in
 * `$current_url`, `$referrer` and their `$initial_*` person copies; on `/delete-confirm?token=`
 * and `/email-preferences?t=` that address holds a bearer token. Every URL-valued string property
 * is passed through `scrubUrl`, so only allowlisted query parameters survive.
 *
 * No `posthog-js` import (not even a type): the library is loaded only after consent, by dynamic
 * `import()` (CLAUDE.md), so this module declares the shape it reads.
 */
import { scrubUrl } from '@/lib/utils/scrubUrl';

interface CaptureLike {
  properties?: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
}

const LOOKS_LIKE_URL = /^(?:[a-z][a-z0-9+.-]*:\/\/|\/)/i;

function scrubBag(bag: Record<string, unknown> | undefined): void {
  if (!bag) return;
  for (const [key, value] of Object.entries(bag)) {
    if (typeof value === 'string' && LOOKS_LIKE_URL.test(value)) bag[key] = scrubUrl(value);
  }
}

export function scrubAnalyticsEvent<T extends CaptureLike | null>(event: T): T {
  if (!event) return event;
  scrubBag(event.properties);
  scrubBag(event.$set);
  scrubBag(event.$set_once);
  return event;
}
