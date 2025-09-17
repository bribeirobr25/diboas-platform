/**
 * Web Vitals Integration
 * Performance: Real User Monitoring with Core Web Vitals
 */

import { WebVitalsMetric } from './types';
import { analyticsService } from './service';
import { WEB_VITALS_THRESHOLDS, evaluatePerformance } from '@/config/performance-thresholds';

/**
 * Initialize Web Vitals tracking
 * Performance: Automatic Core Web Vitals monitoring
 */
export function initializeWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Dynamic import to avoid SSR issues
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    const vitalsQueue: WebVitalsMetric[] = [];

    // Track Core Web Vitals
    onCLS(handleVital);
    onFCP(handleVital);
    onLCP(handleVital);
    onTTFB(handleVital);
    onINP(handleVital);

    function handleVital(metric: any) {
      const webVital: WebVitalsMetric = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType || 'navigate'
      };

      vitalsQueue.push(webVital);

      // Batch and send vitals
      if (vitalsQueue.length >= 3) {
        analyticsService.trackPerformance([...vitalsQueue]);
        vitalsQueue.length = 0;
      }
    }

    // Send remaining vitals on page unload
    window.addEventListener('beforeunload', () => {
      if (vitalsQueue.length > 0) {
        analyticsService.trackPerformance([...vitalsQueue]);
      }
    });

  }).catch(error => {
    console.warn('Failed to load web-vitals library:', error);
  });
}

/**
 * Get rating for a performance metric value
 * Performance: Classify metrics according to centralized Core Web Vitals thresholds
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholdMap: Record<string, keyof typeof WEB_VITALS_THRESHOLDS> = {
    FCP: 'FCP',
    LCP: 'LCP', 
    CLS: 'CLS',
    TTFB: 'TTFB',
    INP: 'INP',
    FID: 'FID'
  };

  const thresholdKey = thresholdMap[name];
  if (!thresholdKey) return 'good';

  const threshold = WEB_VITALS_THRESHOLDS[thresholdKey];
  return evaluatePerformance(value, threshold);
}