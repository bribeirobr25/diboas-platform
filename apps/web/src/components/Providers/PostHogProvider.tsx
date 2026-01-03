'use client';

/**
 * PostHog Analytics Provider
 *
 * Provides PostHog product analytics integration.
 * Only initializes when NEXT_PUBLIC_POSTHOG_KEY is set AND user has given consent.
 * GDPR compliant - waits for cookie consent before tracking.
 */

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent } from '@/components/CookieConsent';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    const initPostHog = () => {
      if (posthogKey && typeof window !== 'undefined' && hasAnalyticsConsent() && !isInitialized) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          // Capture pageviews automatically
          capture_pageview: true,
          // Capture pageleaves for session duration
          capture_pageleave: true,
          // Respect Do Not Track
          respect_dnt: true,
          // Disable remote config fetching (reduces console noise)
          advanced_disable_feature_flags: process.env.NODE_ENV === 'development',
          // Disable in development unless explicitly enabled
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug(false); // Disable verbose logging in dev
            }
          },
        });
        setIsInitialized(true);
      }
    };

    // Check consent on mount
    initPostHog();

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      if (event.detail?.analytics) {
        initPostHog();
      } else if (isInitialized) {
        // User revoked consent - opt out
        posthog.opt_out_capturing();
      }
    };

    window.addEventListener('cookie-consent-changed', handleConsentChange as EventListener);

    return () => {
      window.removeEventListener('cookie-consent-changed', handleConsentChange as EventListener);
    };
  }, [isInitialized]);

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  // Only wrap with PostHog provider if key is configured
  if (!posthogKey) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
