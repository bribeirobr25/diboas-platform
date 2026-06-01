'use client';

/**
 * PostHog Analytics Provider
 *
 * Provides PostHog product analytics integration.
 * Only initializes when NEXT_PUBLIC_POSTHOG_KEY is set AND user has given consent.
 * GDPR compliant - waits for cookie consent before tracking.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import { POSTHOG_CONFIG } from '@/config/env';
import {
  applicationEventBus,
  ApplicationEventType,
  type ConsentEventPayload,
} from '@/lib/events/ApplicationEventBus';

// Lazy-loaded PostHog types
type PostHogInstance = {
  opt_out_capturing: () => void;
  debug: (enabled: boolean) => void;
  init: (...args: unknown[]) => void;
};

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const isInitializedRef = useRef(false);
  const posthogRef = useRef<PostHogInstance | null>(null);
  const [PHWrapper, setPHWrapper] = useState<{
    Provider: React.ComponentType<{ client: PostHogInstance; children: ReactNode }>;
  } | null>(null);

  useEffect(() => {
    const posthogKey = POSTHOG_CONFIG.apiKey;
    const posthogHost = POSTHOG_CONFIG.host;

    const initPostHog = async () => {
      if (
        !posthogKey ||
        typeof window === 'undefined' ||
        !hasAnalyticsConsent() ||
        isInitializedRef.current
      )
        return;

      // Set flag BEFORE async to prevent concurrent initialization race
      isInitializedRef.current = true;

      try {
        const [posthogModule, reactModule] = await Promise.all([
          import('posthog-js'),
          import('posthog-js/react'),
        ]);

        const posthog = posthogModule.default;
        posthog.init(posthogKey, {
          api_host: posthogHost,
          // Pinned defaults bundle per PostHog's recommended pattern (2026-06-01).
          // PostHog ships dated default-configs to stabilize SDK behavior across
          // version bumps. Without this, you inherit whichever defaults the
          // installed SDK version happens to choose, which can shift unexpectedly.
          // `'2025-11-30'` is the latest accepted by posthog-js 1.313.0 — the
          // newer `'2026-01-30'` value the PostHog UI suggests requires a future
          // SDK release. Bump this date when (a) you upgrade posthog-js to a
          // version that accepts a newer value AND (b) you've reviewed PostHog's
          // release notes for the behavior change.
          defaults: '2025-11-30',
          // Only create PostHog person profiles for users who have been
          // explicitly identified via posthog.identify(distinctId) — e.g.
          // post-waitlist-signup. Anonymous visitors still get events tracked
          // under a session-anonymous distinct_id but don't burn a "person"
          // quota slot. GDPR-friendly + cost-effective for pre-launch.
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          respect_dnt: true,
          advanced_disable_feature_flags: process.env.NODE_ENV === 'development',
          loaded: (ph) => {
            if (process.env.NODE_ENV === 'development') {
              ph.debug(false);
            }
          },
        });

        posthogRef.current = posthog as unknown as PostHogInstance;
        setPHWrapper({
          Provider: reactModule.PostHogProvider as React.ComponentType<{
            client: PostHogInstance;
            children: ReactNode;
          }>,
        });
      } catch {
        // Reset flag on failure so retry is possible
        isInitializedRef.current = false;
      }
    };

    initPostHog();

    // Listen for consent changes via ApplicationEventBus
    const unsubGiven = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_GIVEN,
      (payload) => {
        if (payload.consentType === 'analytics' || payload.consentType === 'all') {
          initPostHog();
        }
      }
    );

    const unsubWithdrawn = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_WITHDRAWN,
      () => {
        if (isInitializedRef.current && posthogRef.current) {
          posthogRef.current.opt_out_capturing();
        }
      }
    );

    return () => {
      unsubGiven();
      unsubWithdrawn();
    };
  }, []);

  // Only wrap with PostHog provider if initialized and loaded
  if (!POSTHOG_CONFIG.apiKey || !PHWrapper || !posthogRef.current) {
    return <>{children}</>;
  }

  return <PHWrapper.Provider client={posthogRef.current}>{children}</PHWrapper.Provider>;
}
