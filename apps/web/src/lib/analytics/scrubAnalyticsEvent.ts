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
 * Market clean-up W-D1 (5.924, DR G3, spec §3.7, §3.10): URLs keep campaign values only in their
 * known shape (`{ campaign: 'shaped' }`); a property named a campaign key, or ending in one
 * (`$initial_utm_source`), is shaped or dropped; and every referrer-derived property is removed
 * (the library reads `document.referrer` into `$referrer`, `$referring_domain`, `$search_engine`
 * and `ph_keyword`, the search query, with `$session_entry_` and `$initial_` copies), because the
 * referrer can carry another site's query and PostHog saves it unmasked.
 *
 * No `posthog-js` import (not even a type): the library is loaded only after consent, by dynamic
 * `import()` (CLAUDE.md), so this module declares the shape it reads.
 */
import { scrubUrl, scrubUrlsInText } from '@/lib/utils/scrubUrl';
import { isCampaignPropertyName, shapeUtmValue } from './utmShape';

interface CaptureLike {
  properties?: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
}

const LOOKS_LIKE_URL = /^(?:[a-z][a-z0-9+.-]*:\/\/|\/)/i;
const SHAPED = { campaign: 'shaped' } as const;

/** A property derived from the referrer, in any of its `$`, `$initial_` or `$session_entry_` forms. */
const REFERRER_DERIVED = /(?:referrer|referring_domain|search_engine|ph_keyword)$/;

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 8) return value;
  if (typeof value === 'string') {
    if (LOOKS_LIKE_URL.test(value)) return scrubUrl(value, SHAPED);
    // a URL inside free text (an exception message, `$elements_chain`'s hrefs): scrubbed with the
    // default (no campaign value), as Sentry's text scrubber does (W-D1 audit)
    return /[?#]|%3F/i.test(value) ? scrubUrlsInText(value) : value;
  }
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[LOOKS_LIKE_URL.test(key) ? scrubUrl(key, SHAPED) : key] = scrubValue(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** One property map scrubbed: URLs, then campaign-named values shaped or dropped, referrers removed. */
function scrubProperties(props: Record<string, unknown>): Record<string, unknown> {
  const scrubbed = scrubValue(props, 0) as Record<string, unknown>;
  for (const name of Object.keys(scrubbed)) {
    if (REFERRER_DERIVED.test(name)) {
      delete scrubbed[name];
    } else if (isCampaignPropertyName(name)) {
      const shaped = shapeUtmValue(scrubbed[name]);
      if (shaped === null) delete scrubbed[name];
      else scrubbed[name] = shaped;
    }
  }
  return scrubbed;
}

export function scrubAnalyticsEvent<T extends CaptureLike | null>(event: T): T {
  if (!event) return event;
  if (event.properties) event.properties = scrubProperties(event.properties);
  if (event.$set) event.$set = scrubProperties(event.$set);
  if (event.$set_once) event.$set_once = scrubProperties(event.$set_once);
  return event;
}
