/**
 * Web Vitals Tracker Component
 *
 * Performance Optimization: Real-time Core Web Vitals monitoring
 * Error Handling: Resilient performance tracking
 * Monitoring & Observability: Performance insights and alerts
 * GDPR Compliance: Only tracks with user consent
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { performanceService } from '@/lib/performance/services/PerformanceService';
import { WebVitalMetric } from '@/lib/performance/domain/PerformanceDomain';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import { Logger } from '@/lib/monitoring/Logger';
import {
  getRating,
  getConnectionType,
  sendToGoogleAnalytics,
  trackWebVitalsLoadError,
} from './webVitalsUtils';

// Re-export the hook for external use
export { usePerformanceTracking } from './usePerformanceTracking';

interface WebVitalsTrackerProps {
  debug?: boolean;
  sampleRate?: number;
}

export function WebVitalsTracker({ debug = false, sampleRate = 1.0 }: WebVitalsTrackerProps) {
  const pathname = usePathname();
  const isTracking = useRef(false);
  const trackedMetrics = useRef(new Set<string>());
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consent = hasAnalyticsConsent();
      setHasConsent(consent);

      if (debug) {
        Logger.debug('WebVitals: Consent status', { consent: consent ? 'granted' : 'denied' });
      }
    };

    checkConsent();

    const handleConsentChange = () => {
      checkConsent();
    };

    window.addEventListener('cookie-consent-changed', handleConsentChange);

    return () => {
      window.removeEventListener('cookie-consent-changed', handleConsentChange);
    };
  }, [debug]);

  useEffect(() => {
    if (!hasConsent) {
      if (debug) Logger.debug('WebVitals: Tracking disabled - no consent');
      return;
    }

    if (Math.random() > sampleRate) {
      if (debug) Logger.debug('WebVitals: Skipped due to sample rate');
      return;
    }

    if (isTracking.current) return;
    isTracking.current = true;

    const handleMetric = async (metric: { name: string; value: number; id: string; rating?: string; delta: number }) => {
      try {
        const metricKey = `${metric.name}-${metric.id}`;
        if (trackedMetrics.current.has(metricKey)) {
          return;
        }
        trackedMetrics.current.add(metricKey);

        const webVitalMetric: WebVitalMetric = {
          name: metric.name as 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP',
          value: metric.value,
          timestamp: new Date(),
          url: pathname,
          rating: (metric.rating as 'good' | 'needs-improvement' | 'poor') || getRating(metric.name, metric.value),
          delta: metric.delta,
          userAgent: navigator.userAgent,
          connectionType: getConnectionType(),
        };

        await performanceService.trackWebVital(webVitalMetric);

        if (debug) {
          Logger.debug('WebVitals tracked', {
            name: webVitalMetric.name,
            value: webVitalMetric.value,
            rating: webVitalMetric.rating,
            url: pathname
          });
        }

        sendToGoogleAnalytics(
          metric.name,
          metric.value,
          webVitalMetric.rating,
          pathname,
          metric.delta
        );

      } catch (error) {
        Logger.error(`Failed to track ${metric.name}`, { metric: metric.name }, error instanceof Error ? error : undefined);
      }
    };

    const loadWebVitals = async () => {
      try {
        const webVitalsModule = await import('web-vitals');

        if (debug) Logger.debug('WebVitals: Module loaded successfully');

        webVitalsModule.onFCP(handleMetric);
        webVitalsModule.onLCP(handleMetric);
        webVitalsModule.onCLS(handleMetric);
        webVitalsModule.onTTFB(handleMetric);

        if (webVitalsModule.onINP) {
          webVitalsModule.onINP(handleMetric);
        }

      } catch (error) {
        Logger.error('Failed to load web-vitals library', {}, error instanceof Error ? error : undefined);
        trackWebVitalsLoadError(error);
      }
    };

    loadWebVitals();

    return () => {
      isTracking.current = false;
      trackedMetrics.current.clear();
    };
  }, [pathname, debug, sampleRate, hasConsent]);

  return null;
}
