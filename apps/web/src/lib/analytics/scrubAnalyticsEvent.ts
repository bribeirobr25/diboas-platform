/**
 * PostHog `before_send` (5.864). PostHog records the page address in `$current_url`, `$referrer`,
 * their `$initial_*` person copies, and nested places: web-vitals events, exception frames, and
 * heatmap data KEYED by the address. On `/delete-confirm?token=` and `/email-preferences?t=` that
 * address holds a bearer token. Every URL-valued string, at any depth, and every URL-valued key is
 * passed through `scrubUrl`, so only allowlisted query parameters survive.
 *
 * Thirteenth audit: the first version read only top-level properties. PostHog's own masking
 * (`mask_personal_data_properties`, PostHogProvider) covers what `before_send` never sees, such as
 * the stored first-visit URL sent with flag requests.
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

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 8) return value;
  if (typeof value === 'string') return LOOKS_LIKE_URL.test(value) ? scrubUrl(value) : value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[LOOKS_LIKE_URL.test(key) ? scrubUrl(key) : key] = scrubValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function scrubAnalyticsEvent<T extends CaptureLike | null>(event: T): T {
  if (!event) return event;
  if (event.properties)
    event.properties = scrubValue(event.properties, 0) as Record<string, unknown>;
  if (event.$set) event.$set = scrubValue(event.$set, 0) as Record<string, unknown>;
  if (event.$set_once) event.$set_once = scrubValue(event.$set_once, 0) as Record<string, unknown>;
  return event;
}
