/**
 * Performance Observers
 *
 * PerformanceObserver setup functions for monitoring
 */

import { Logger } from './Logger';
import type { MetricRecorder } from './performanceTypes';

/**
 * Observer storage type
 */
export type ObserverMap = { [key: string]: PerformanceObserver };

/**
 * Setup Core Web Vitals observer (LCP, FID, FCP)
 */
export function setupCoreWebVitalsObserver(
  observers: ObserverMap,
  recordMetric: MetricRecorder
): void {
  try {
    // Largest Contentful Paint
    observers.lcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceEventTiming[];
      const lastEntry = entries[entries.length - 1];

      recordMetric('lcp', lastEntry.startTime, {
        element: 'element' in lastEntry ? (lastEntry as { element?: { tagName?: string } }).element?.tagName : undefined,
        url: 'url' in lastEntry ? (lastEntry as { url?: string }).url : undefined
      });
    });
    observers.lcp.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    observers.fid = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceEventTiming[];
      entries.forEach(entry => {
        recordMetric('fid', entry.processingStart - entry.startTime, {
          eventType: entry.name,
          target: 'target' in entry ? (entry as { target?: { tagName?: string } }).target?.tagName : undefined
        });
      });
    });
    observers.fid.observe({ entryTypes: ['first-input'] });

    // First Contentful Paint
    observers.fcp = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          recordMetric('fcp', entry.startTime);
        }
      });
    });
    observers.fcp.observe({ entryTypes: ['paint'] });

  } catch (error) {
    Logger.warn('Failed to setup Core Web Vitals observer', { error });
  }
}

/**
 * Setup Cumulative Layout Shift observer
 */
export function setupLayoutShiftObserver(
  observers: ObserverMap,
  recordMetric: MetricRecorder
): void {
  try {
    let clsValue = 0;

    observers.cls = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceEventTiming[];

      entries.forEach(entry => {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value ?? 0;
        }
      });

      recordMetric('cls', clsValue);
    });
    observers.cls.observe({ entryTypes: ['layout-shift'] });

  } catch (error) {
    Logger.warn('Failed to setup layout shift observer', { error });
  }
}

/**
 * Setup navigation timing observer
 */
export function setupNavigationObserver(
  observers: ObserverMap,
  recordMetric: MetricRecorder
): void {
  try {
    observers.navigation = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceNavigationTiming[];

      entries.forEach(entry => {
        const ttfb = entry.responseStart - entry.requestStart;
        recordMetric('ttfb', ttfb);

        // Record loading metrics
        const loadTime = entry.loadEventEnd - entry.startTime;
        const renderTime = entry.domContentLoadedEventEnd - entry.startTime;
        const interactiveTime = entry.domInteractive - entry.startTime;

        recordMetric('loadTime', loadTime);
        recordMetric('renderTime', renderTime);
        recordMetric('interactiveTime', interactiveTime);
      });
    });
    observers.navigation.observe({ entryTypes: ['navigation'] });

  } catch (error) {
    Logger.warn('Failed to setup navigation observer', { error });
  }
}

/**
 * Setup resource timing observer
 */
export function setupResourceObserver(
  observers: ObserverMap,
  recordMetric: MetricRecorder,
  onBundleEntry: (entry: PerformanceResourceTiming) => void,
  onSectionEntry: (entry: PerformanceResourceTiming) => void
): void {
  try {
    observers.resource = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceResourceTiming[];

      entries.forEach(entry => {
        // Track bundle sizes and load times
        if (entry.name.includes('/_next/static/')) {
          onBundleEntry(entry);
        }

        // Track section component loading
        if (entry.name.includes('/sections/')) {
          onSectionEntry(entry);
        }
      });
    });
    observers.resource.observe({ entryTypes: ['resource'] });

  } catch (error) {
    Logger.warn('Failed to setup resource observer', { error });
  }
}

/**
 * Disconnect all observers
 */
export function disconnectObservers(observers: ObserverMap): void {
  Object.values(observers).forEach(observer => {
    observer.disconnect();
  });
}
