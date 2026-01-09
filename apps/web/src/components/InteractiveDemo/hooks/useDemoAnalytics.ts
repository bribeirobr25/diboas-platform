/**
 * Demo Analytics Hook
 *
 * Handles analytics tracking for the interactive demo
 */

import { useCallback, useEffect } from 'react';
import type { DemoAnalyticsEvent } from '../types';

interface UseDemoAnalyticsOptions {
  onAnalyticsEvent?: (event: DemoAnalyticsEvent, data?: Record<string, unknown>) => void;
}

export function useDemoAnalytics({ onAnalyticsEvent }: UseDemoAnalyticsOptions) {
  // Track analytics events
  const trackEvent = useCallback((event: DemoAnalyticsEvent, data?: Record<string, unknown>) => {
    onAnalyticsEvent?.(event, data);

    // Also track via gtag if available
    const windowWithGtag = window as Window & {
      gtag?: (command: string, action: string, params: Record<string, unknown>) => void
    };
    if (typeof window !== 'undefined' && windowWithGtag.gtag) {
      windowWithGtag.gtag('event', event, {
        event_category: 'interactive_demo',
        ...data
      });
    }
  }, [onAnalyticsEvent]);

  // Track demo start on mount
  useEffect(() => {
    trackEvent('demo_start');
  }, [trackEvent]);

  return { trackEvent };
}
