'use client';

/**
 * PostHog Analytics Provider
 *
 * Loads PostHog only when NEXT_PUBLIC_POSTHOG_KEY is set AND analytics consent is given, by
 * dynamic `import()` (CLAUDE.md). Market clean-up W-D1 (spec §3.7, WITHDRAW-1):
 * - **One stable tree:** children render directly, always. The old `posthog-js/react` wrapper
 *   swapped in at the first start and remounted the whole page (nothing reads `usePostHog`).
 * - **Two refs:** `inFlight` guards the import and is cleared on every exit (a failed load retries
 *   at the next consent); `posthogRef` holds the initialised instance. After the import, consent
 *   is checked again, so a withdrawal during the load initialises nothing. Two `CONSENT_GIVEN`
 *   emits (each choice fires two) give one `init`.
 * - **Withdrawal really stops it:** `opt_out_capturing()`, then `reset(true)`, then
 *   `opt_out_capturing()` again: the first stops the recording flush inside `reset` from sending
 *   a last segment; `reset` clears the consent key, so the second sets it again.
 * - **Consent again:** `opt_in_capturing({ captureEventName: false })`; after `init`, a stored
 *   `denied` from an earlier withdrawal is opted back in (Do-Not-Track browsers stay off:
 *   `respect_dnt`).
 * Options and the `loaded` clean-up live in `lib/analytics/posthogInitOptions.ts`.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import { POSTHOG_CONFIG } from '@/config/env';
import {
  applicationEventBus,
  ApplicationEventType,
  type ConsentEventPayload,
} from '@/lib/events/ApplicationEventBus';
import {
  buildPostHogInitOptions,
  cleanLegacyPostHogState,
  type PostHogLoadedInstance,
} from '@/lib/analytics/posthogInitOptions';

/** The part of the lazily loaded PostHog instance this provider uses. */
type PostHogInstance = PostHogLoadedInstance & {
  init: (key: string, options: Record<string, unknown>) => void;
  opt_out_capturing: () => void;
  opt_in_capturing: (options?: { captureEventName?: string | false | null }) => void;
  reset: (resetDeviceId?: boolean) => void;
  get_explicit_consent_status: () => 'granted' | 'denied' | 'pending';
};

interface PostHogProviderProps {
  children: ReactNode;
}

const isAnalyticsChoice = (payload: ConsentEventPayload) =>
  payload.consentType === 'analytics' || payload.consentType === 'all';

/** A failure inside PostHog's `loaded` callback, reported once through the error coordinator. */
function reportLoadedFailure(error: unknown): void {
  applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
    domain: 'analytics',
    source: 'posthog',
    timestamp: Date.now(),
    error: error instanceof Error ? error : new Error('PostHog loaded clean-up failed'),
    severity: 'low',
    context: { operation: 'posthog_loaded_cleanup' },
  });
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const inFlightRef = useRef(false);
  const posthogRef = useRef<PostHogInstance | null>(null);

  useEffect(() => {
    const posthogKey = POSTHOG_CONFIG.apiKey;

    const startOrResume = async () => {
      if (!posthogKey || !hasAnalyticsConsent()) return;
      if (posthogRef.current) {
        posthogRef.current.opt_in_capturing({ captureEventName: false });
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const { default: loaded } = await import('posthog-js');
        // Consent may have been withdrawn while the library loaded: initialise nothing then.
        if (!hasAnalyticsConsent()) return;
        const posthog = loaded as unknown as PostHogInstance;
        posthog.init(
          posthogKey,
          buildPostHogInitOptions({
            apiHost: POSTHOG_CONFIG.host,
            onLoaded: (ph) => {
              cleanLegacyPostHogState(ph, window.location.origin, reportLoadedFailure);
              if (process.env.NODE_ENV === 'development') ph.debug(false);
            },
          })
        );
        posthogRef.current = posthog;
        // A `denied` stored by an earlier withdrawal: this consent opts back in.
        if (posthog.get_explicit_consent_status() === 'denied') {
          posthog.opt_in_capturing({ captureEventName: false });
        }
      } catch {
        // A failed load: nothing initialised; the next real consent retries.
      } finally {
        inFlightRef.current = false;
      }
    };

    void startOrResume();

    const unsubGiven = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_GIVEN,
      (payload) => {
        if (isAnalyticsChoice(payload)) void startOrResume();
      }
    );

    const unsubWithdrawn = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_WITHDRAWN,
      () => {
        const posthog = posthogRef.current;
        if (!posthog) return;
        // The order is pinned (WITHDRAW-1): opt out, reset, opt out again.
        posthog.opt_out_capturing();
        posthog.reset(true);
        posthog.opt_out_capturing();
      }
    );

    return () => {
      unsubGiven();
      unsubWithdrawn();
    };
  }, []);

  return <>{children}</>;
}
