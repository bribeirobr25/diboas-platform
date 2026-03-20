'use client';

/**
 * PageViewTracker — Tracks page views on pathname change.
 *
 * - Consent-gated: only fires when analytics consent is given
 * - Debounced: avoids double-tracking on rapid navigation
 * - Uses analyticsService.track() for consistent event processing
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsService } from '@/lib/analytics/service';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import type { WindowWithGtag } from './webVitalsUtils';

const DEBOUNCE_MS = 300;

export function PageViewTracker() {
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Clear any pending debounce
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      // Skip if already tracked this exact pathname (e.g. re-render)
      if (lastTrackedRef.current === pathname) return;

      // Consent gate
      if (!hasAnalyticsConsent()) return;

      lastTrackedRef.current = pathname;

      const pageTitle = typeof document !== 'undefined' ? document.title : '';

      analyticsService.track({
        name: 'page_view',
        parameters: {
          page_path: pathname,
          page_title: pageTitle,
        },
      });

      // GA4 direct pageview — fire alongside the analytics service
      const windowWithGtag = window as WindowWithGtag;
      if (windowWithGtag.gtag) {
        windowWithGtag.gtag('event', 'page_view', {
          page_path: pathname,
          page_title: pageTitle,
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname]);

  return null;
}
