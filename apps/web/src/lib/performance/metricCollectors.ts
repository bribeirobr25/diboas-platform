/**
 * Performance Metric Collectors
 *
 * Handles observation and measurement of performance metrics:
 * - Core Web Vitals (via web-vitals library or PerformanceObserver fallback)
 * - Section render times (via MutationObserver)
 * - Carousel interaction delays
 * - Image load durations
 *
 * Reports measurements through a callback, keeping collection
 * decoupled from budget evaluation.
 */

import { Logger } from '@/lib/monitoring/Logger';
import { getBudgetById, PERFORMANCE_BUDGETS } from './budgetDefinitions';
import type { PerformanceBudget } from './budgetTypes';

/** Callback invoked when a metric measurement is ready for budget evaluation. */
export type MetricMeasurementCallback = (
  budget: PerformanceBudget,
  value: number,
  context: Record<string, unknown>
) => void;

/**
 * Set up Core Web Vitals monitoring.
 * Attempts to use the web-vitals library; falls back to raw PerformanceObserver.
 */
export function setupWebVitalsCollector(onMeasurement: MetricMeasurementCallback): void {
  if (typeof window === 'undefined') return;

  const handleMetric = (metricName: string, metric: { value: number }) => {
    const budget = getBudgetById(metricName) ??
      // budgetDefinitions may use the metric field rather than id
      undefined;
    // Also search by metric field
    const found = budget ?? findBudgetByMetric(metricName);
    if (!found) return;

    const navigatorWithConnection = navigator as Navigator & { connection?: { effectiveType?: string } };
    onMeasurement(found, metric.value, {
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      connection: navigatorWithConnection.connection?.effectiveType || 'unknown',
    });
  };

  type MetricReporter = (callback: (metric: { value: number }) => void) => void;
  interface WebVitalsCompat {
    // v5 API (onXxx)
    onCLS?: MetricReporter;
    onFCP?: MetricReporter;
    onLCP?: MetricReporter;
    onTTFB?: MetricReporter;
    onINP?: MetricReporter;
    // v3 legacy API (getXxx)
    getCLS?: MetricReporter;
    getFID?: MetricReporter;
    getFCP?: MetricReporter;
    getLCP?: MetricReporter;
    getTTFB?: MetricReporter;
  }

  import('web-vitals')
    .then((mod) => {
      const vitals = mod as unknown as WebVitalsCompat;
      (vitals.getCLS ?? vitals.onCLS)?.((m) => handleMetric('cls', m));
      (vitals.getFID ?? vitals.onINP)?.((m) => handleMetric('fid', m));
      (vitals.getFCP ?? vitals.onFCP)?.((m) => handleMetric('fcp', m));
      (vitals.getLCP ?? vitals.onLCP)?.((m) => handleMetric('lcp', m));
      (vitals.getTTFB ?? vitals.onTTFB)?.((m) => handleMetric('ttfb', m));
    })
    .catch(() => {
      setupPerformanceObserverFallback(handleMetric);
    });
}

/** Fallback PerformanceObserver for environments without web-vitals. */
function setupPerformanceObserverFallback(
  handleMetric: (name: string, metric: { value: number }) => void
): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      handleMetric('lcp', { value: lastEntry.startTime });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        handleMetric('fcp', { value: fcpEntry.startTime });
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value ?? 0;
        }
      }
      handleMetric('cls', { value: clsValue });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    Logger.warn('Failed to set up Performance Observer', { error });
  }
}

/**
 * Set up custom metric collectors for sections, carousels, and images.
 */
export function setupCustomMetricCollectors(onMeasurement: MetricMeasurementCallback): void {
  if (typeof window === 'undefined') return;

  monitorSectionPerformance(onMeasurement);
  monitorCarouselPerformance(onMeasurement);
  monitorImagePerformance(onMeasurement);
}

/** Observe section DOM insertions and measure render time. */
function monitorSectionPerformance(onMeasurement: MetricMeasurementCallback): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('section[class*="section"]')) {
              measureSectionRenderTime(element, onMeasurement);
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function measureSectionRenderTime(
  section: Element,
  onMeasurement: MetricMeasurementCallback
): void {
  const startTime = performance.now();

  requestAnimationFrame(() => {
    const renderTime = performance.now() - startTime;
    const budget = getBudgetById('section-render-budget');
    if (budget) {
      onMeasurement(budget, renderTime, {
        sectionClass: section.className,
        sectionId: section.id,
      });
    }
  });
}

/** Listen for carousel clicks and measure interaction delay. */
function monitorCarouselPerformance(onMeasurement: MetricMeasurementCallback): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest('[class*="carousel"]')) {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const interactionDelay = performance.now() - startTime;
        const budget = getBudgetById('carousel-interaction-budget');
        if (budget) {
          onMeasurement(budget, interactionDelay, {
            interactionType: 'click',
            carouselElement: target.closest('[class*="carousel"]')?.className,
          });
        }
      });
    }
  });
}

/** Observe image resource loads and measure duration. */
function monitorImagePerformance(onMeasurement: MetricMeasurementCallback): void {
  const imageObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
        const budget = getBudgetById('image-load-budget');
        if (budget) {
          const resourceEntry = entry as PerformanceResourceTiming;
          onMeasurement(budget, entry.duration, {
            imageUrl: entry.name,
            imageSize: resourceEntry.transferSize,
          });
        }
      }
    }
  });

  imageObserver.observe({ entryTypes: ['resource'] });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findBudgetByMetric(metricName: string): PerformanceBudget | undefined {
  return PERFORMANCE_BUDGETS.find((b) => b.metric === metricName && b.enabled);
}
