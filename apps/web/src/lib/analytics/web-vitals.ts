/**
 * Web Vitals Integration
 * Performance: Real User Monitoring with Core Web Vitals
 */

import { WebVitalsMetric } from './types';
import { analyticsService } from './service';

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
 * Performance: Classify metrics according to Core Web Vitals thresholds
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 }
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}