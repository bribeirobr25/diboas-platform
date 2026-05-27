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
