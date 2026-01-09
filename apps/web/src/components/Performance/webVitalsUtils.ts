/**
 * Web Vitals Utilities
 *
 * Helper functions for web vitals tracking
 */

/**
 * Performance rating thresholds based on Core Web Vitals
 */
const METRIC_THRESHOLDS: Record<string, { good: number; poor: number }> = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 600, poor: 1200 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get performance rating based on metric thresholds
 */
export function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = METRIC_THRESHOLDS[metricName];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Get connection type information
 */
export function getConnectionType(): string | undefined {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; type?: string } }).connection;
    return connection?.effectiveType || connection?.type;
  }
  return undefined;
}

/**
 * Type for window with gtag
 */
export type WindowWithGtag = Window & {
  gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
};

/**
 * Send metric to Google Analytics
 */
export function sendToGoogleAnalytics(
  metricName: string,
  value: number,
  rating: string,
  pathname: string,
  delta: number
): void {
  const windowWithGtag = window as WindowWithGtag;
  if (typeof window !== 'undefined' && windowWithGtag.gtag) {
    windowWithGtag.gtag('event', metricName, {
      event_category: 'Web Vitals',
      event_label: pathname,
      value: Math.round(metricName === 'CLS' ? value * 1000 : value),
      custom_map: {
        metric_rating: rating,
        metric_delta: delta,
      }
    });
  }
}

/**
 * Track web vitals load error
 */
export function trackWebVitalsLoadError(error: Error | unknown): void {
  const windowWithGtag = window as WindowWithGtag;
  if (typeof window !== 'undefined' && windowWithGtag.gtag) {
    windowWithGtag.gtag('event', 'web_vitals_load_error', {
      event_category: 'Performance',
      event_label: 'library_load_failed',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
