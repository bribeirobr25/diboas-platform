/**
 * PostHog's init options and the clean-up that runs in its `loaded` callback (market clean-up
 * W-D1, DR G3, F4; spec §3.7). Moved out of `PostHogProvider` so the provider stays small and the
 * options can be read and tested in one place (`privacyWiring.test.ts` reads this file).
 *
 * No `posthog-js` import, not even a type: the library is loaded only after consent, by dynamic
 * `import()` (CLAUDE.md), so this module declares the shapes it uses. The two storage names below
 * are the library's own; `posthogInitOptions.test.ts` reads them from the INSTALLED library, so a
 * rename in a version bump fails a test instead of silently turning the clean-up into a no-op.
 */
import { scrubAnalyticsEvent } from './scrubAnalyticsEvent';
import { hasUnmaskedCampaignSessionProps } from './posthogLegacySessionCleanup';
import { UTM_KEYS } from './utmShape';
import { scrubUrl } from '@/lib/utils/scrubUrl';

/** PostHog's persisted session entry properties (`posthog-js` `CLIENT_SESSION_PROPS`). */
export const POSTHOG_CLIENT_SESSION_PROPS = '$client_session_props';
/** PostHog's persisted first-visit person info (`posthog-js` `INITIAL_PERSON_INFO`). */
export const POSTHOG_INITIAL_PERSON_INFO = '$initial_person_info';

/** The part of a loaded PostHog instance the `loaded` callback uses. */
export interface PostHogLoadedInstance {
  get_property(name: string): unknown;
  unregister(name: string): void;
  debug(enabled: boolean): void;
}

/**
 * Session recording's network-request and page-address mask: every recorded URL passes the
 * shaped scrubber (no token; campaign values only in their shape). A named function, hoisted out
 * of the options object, so a reader of `session_recording` sees one line per option.
 */
export function maskCapturedNetworkRequest<
  T extends { name?: string; url?: string; [key: string]: unknown },
>(request: T): T {
  const shaped = { campaign: 'shaped' } as const;
  return {
    ...request,
    ...(typeof request.name === 'string' ? { name: scrubUrl(request.name, shaped) } : {}),
    ...(typeof request.url === 'string' ? { url: scrubUrl(request.url, shaped) } : {}),
  };
}

/**
 * Runs first in `loaded`, before any `/flags` request: removes any stored `$initial_person_info`
 * (nothing writes it again with both save flags off) and, once, a `$client_session_props` saved
 * before W-D1 (`hasUnmaskedCampaignSessionProps`). Never throws: a failure is handed to `report`
 * once, and the rest of the callback still runs.
 */
export function cleanLegacyPostHogState(
  ph: PostHogLoadedInstance,
  origin: string,
  report: (error: unknown) => void
): void {
  try {
    ph.unregister(POSTHOG_INITIAL_PERSON_INFO);
    if (hasUnmaskedCampaignSessionProps(ph.get_property(POSTHOG_CLIENT_SESSION_PROPS), origin)) {
      ph.unregister(POSTHOG_CLIENT_SESSION_PROPS);
    }
  } catch (error) {
    report(error);
  }
}

/** The options object `posthog.init` receives. */
export function buildPostHogInitOptions(config: {
  apiHost: string;
  onLoaded: (ph: PostHogLoadedInstance) => void;
}): Record<string, unknown> {
  return {
    api_host: config.apiHost,
    // Pinned defaults bundle (2026-06-01): bump with a posthog-js upgrade after reading its notes.
    defaults: '2025-11-30',
    // Person profiles only for identified visitors (none are identified pre-launch).
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    respect_dnt: true,
    // 5.864: tokens in page addresses never leave the browser; W-D1: campaign values only in their
    // shape, campaign-named properties shaped or dropped, referrer-derived properties removed.
    before_send: scrubAnalyticsEvent,
    // Thirteenth audit + W-D1: mask the token parameters AND the five campaign keys at the source,
    // including stored addresses `before_send` never sees. The custom list applies only with
    // `mask_personal_data_properties: true`, which must stay (WITHDRAW-1 pins both).
    mask_personal_data_properties: true,
    custom_personal_data_properties: ['t', 'token', 'id', 'email', ...UTM_KEYS],
    // W-D1 (G3, F4): nothing persists before an opt-in; no campaign values or referrer are saved
    // to the person (so `$initial_person_info` is never written and `/flags` carries nothing).
    opt_out_persistence_by_default: true,
    save_campaign_params: false,
    save_referrer: false,
    // No feature flag is read anywhere in the app (git grep), so none is evaluated.
    advanced_disable_feature_flags: true,
    // Session recordings (fourteenth audit): all text and inputs masked, no headers, bodies or
    // console lines; every recorded URL through the shaped scrubber (W-D1).
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      recordHeaders: false,
      recordBody: false,
      maskCapturedNetworkRequestFn: maskCapturedNetworkRequest,
    },
    enable_recording_console_log: false,
    loaded: config.onLoaded,
  };
}
