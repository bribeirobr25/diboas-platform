/**
 * The one-off clean-up of PostHog's on-device session copy saved before W-D1 (market clean-up
 * W-D1, register 5.924, DR G3; spec §3.7).
 *
 * Before W-D1, PostHog stored the entry page's address and referrer (`$client_session_props`,
 * `{ sessionId, props: { r, u } }`) with our campaign values in clear: the library masked none of
 * them, and our pages passed their full address as the referrer. W-D1 masks the five keys and
 * sets `Referrer-Policy: strict-origin`, so a copy saved after it holds `<masked>` campaign values
 * and, from our own pages, only our origin plus `/`. This check says whether a stored copy
 * predates that, so the provider clears it once (no marker is stored).
 *
 * Pure and total: it never throws (a throw inside PostHog's `loaded` callback would skip the rest
 * of the callback). Deleted 90 days after the W-D1 production deploy, with `useUtmCapture`'s legacy
 * `removeItem` calls (register row opened at merge).
 */
import { UTM_KEYS, rawQueryPieces } from './utmShape';

/** What PostHog writes in place of a masked query value (`@posthog/browser-common` `MASKED`). */
export const POSTHOG_MASKED = '<masked>';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** (i) the stored address holds a campaign key with a value other than PostHog's `<masked>`. */
function hasUnmaskedCampaignValue(address: unknown): boolean {
  if (typeof address !== 'string') return false;
  return rawQueryPieces(address).some(
    ([name, value]) =>
      (UTM_KEYS as readonly string[]).includes(name) && value !== null && value !== POSTHOG_MASKED
  );
}

/** (ii) the stored referrer is one of our own pages other than the bare origin. */
function isOwnDeepReferrer(referrer: unknown, origin: string): boolean {
  if (typeof referrer !== 'string' || referrer === '$direct') return false;
  let parsed: URL;
  try {
    parsed = new URL(referrer);
  } catch {
    return false;
  }
  return parsed.origin === origin && (parsed.pathname !== '/' || parsed.search !== '');
}

/**
 * True when PostHog's stored `$client_session_props` predates W-D1: its entry address holds an
 * unmasked campaign value, or its referrer is one of our own pages beyond the bare origin.
 * `origin` is passed in (`location.origin`) so the function stays pure. Never throws.
 */
export function hasUnmaskedCampaignSessionProps(stored: unknown, origin: string): boolean {
  try {
    if (!isRecord(stored) || !isRecord(stored.props)) return false;
    const { r, u } = stored.props;
    return hasUnmaskedCampaignValue(u) || isOwnDeepReferrer(r, origin);
  } catch {
    return false;
  }
}
