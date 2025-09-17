/**
 * Web Vitals Tracker Component
 * 
 * Performance Optimization: Real-time Core Web Vitals monitoring
 * Error Handling: Resilient performance tracking
 * Monitoring & Observability: Performance insights and alerts
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { performanceService } from '@/lib/performance/services/PerformanceService';
import { WebVitalMetric } from '@/lib/performance/domain/PerformanceDomain';

interface WebVitalsTrackerProps {
  /**
   * Enable debug logging for development
   */
  debug?: boolean;
  
  /**
   * Sample rate for tracking (0-1, where 1 = 100%)
   */
  sampleRate?: number;
}

export function WebVitalsTracker({ debug = false, sampleRate = 1.0 }: WebVitalsTrackerProps) {
  const pathname = usePathname();
  const isTracking = useRef(false);
  const trackedMetrics = useRef(new Set<string>());

  useEffect(() => {
    // Performance: Only track if within sample rate
    if (Math.random() > sampleRate) {
      if (debug) console.log('WebVitals: Skipped due to sample rate');
      return;
    }

    // Prevent duplicate tracking
    if (isTracking.current) return;
    isTracking.current = true;

    let webVitalsModule: any = null;

    // Dynamic import for better performance
    const loadWebVitals = async () => {
      try {
        webVitalsModule = await import('web-vitals');
        
        if (debug) console.log('WebVitals: Module loaded successfully');
        
        // Track Core Web Vitals
        webVitalsModule.onFCP(handleMetric);
        webVitalsModule.onLCP(handleMetric);
        webVitalsModule.onFID?.(handleMetric); // FID might not be available in newer versions
        webVitalsModule.onCLS(handleMetric);
        webVitalsModule.onTTFB(handleMetric);
        
        // Track INP if available (newer metric)
        if (webVitalsModule.onINP) {
          webVitalsModule.onINP(handleMetric);
        }

      } catch (error) {
        // Error Handling: Graceful fallback if web-vitals fails to load
        console.error('Failed to load web-vitals library:', error);
        
        // Track the error for monitoring
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'web_vitals_load_error', {
            event_category: 'Performance',
            event_label: 'library_load_failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    // Handle individual metrics
    const handleMetric = async (metric: any) => {
      try {
        // Prevent duplicate tracking of the same metric
        const metricKey = `${metric.name}-${metric.id}`;
        if (trackedMetrics.current.has(metricKey)) {
          return;
        }
        trackedMetrics.current.add(metricKey);

        // Convert web-vitals metric to our domain model
        const webVitalMetric: WebVitalMetric = {
          name: metric.name as 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP',
          value: metric.value,
          timestamp: new Date(),
          url: pathname,
          rating: metric.rating || getRating(metric.name, metric.value),
          delta: metric.delta,
          userAgent: navigator.userAgent,
          connectionType: getConnectionType(),
        };

        // Track through our performance service
        await performanceService.trackWebVital(webVitalMetric);

        if (debug) {
          console.log('WebVitals tracked:', {
            name: webVitalMetric.name,
            value: webVitalMetric.value,
            rating: webVitalMetric.rating,
            url: pathname
          });
        }

        // Send to external analytics (Google Analytics, etc.)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: pathname,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            custom_map: {
              metric_rating: webVitalMetric.rating,
              metric_delta: metric.delta,
            }
          });
        }

      } catch (error) {
        // Error Handling: Don't let tracking errors break the app
        console.error(`Failed to track ${metric.name}:`, error);
        
        if (debug) {
          console.error('WebVitals tracking error:', error);
        }
      }
    };

    // Load and initialize web-vitals
    loadWebVitals();

    // Cleanup
    return () => {
      isTracking.current = false;
      trackedMetrics.current.clear();
    };
  }, [pathname, debug, sampleRate]);

  // This component doesn't render anything
  return null;
}

// Helper functions

/**
 * Get performance rating based on metric thresholds
 */
function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, { good: number; poor: number }> = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 600, poor: 1200 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[metricName];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Get connection type information
 */
function getConnectionType(): string | undefined {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || connection?.type;
  }
  return undefined;
}

/**
 * Hook for manual performance tracking
 */
export function usePerformanceTracking() {
  const pathname = usePathname();

  const trackCustomMetric = async (name: string, value: number) => {
    try {
      await performanceService.trackCustomMetric({
        name,
        value,
        timestamp: new Date(),
        url: pathname,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to track custom metric:', error);
    }
  };

  const trackTiming = (name: string, startTime: number) => {
    const duration = performance.now() - startTime;
    trackCustomMetric(name, duration);
  };

  return {
    trackCustomMetric,
    trackTiming,
  };
}