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
import { getBudgetById } from './budgetDefinitions';
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

  import('web-vitals')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((mod: any) => {
      mod.getCLS?.((m: { value: number }) => handleMetric('cls', m));
      mod.getFID?.((m: { value: number }) => handleMetric('fid', m));
      mod.getFCP?.((m: { value: number }) => handleMetric('fcp', m));
      mod.getLCP?.((m: { value: number }) => handleMetric('lcp', m));
      mod.getTTFB?.((m: { value: number }) => handleMetric('ttfb', m));
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

import { PERFORMANCE_BUDGETS } from './budgetDefinitions';

function findBudgetByMetric(metricName: string): PerformanceBudget | undefined {
  return PERFORMANCE_BUDGETS.find((b) => b.metric === metricName && b.enabled);
}
