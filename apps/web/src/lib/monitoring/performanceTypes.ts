/**
 * Performance Monitor Types
 *
 * Type definitions for performance monitoring
 */

/**
 * Core Web Vitals and performance metrics
 */
export interface PerformanceMetrics {
  /**
   * Core Web Vitals
   */
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    fcp: number; // First Contentful Paint
    ttfb: number; // Time to First Byte
  };

  /**
   * Bundle and loading metrics
   */
  loading: {
    bundleSize: number;
    loadTime: number;
    initialRenderTime: number;
    interactiveTime: number;
  };

  /**
   * Section-specific performance
   */
  sections: {
    [sectionName: string]: {
      renderTime: number;
      interactionTime: number;
      errorCount: number;
    };
  };

  /**
   * Theme system performance
   */
  theme: {
    switchTime: number;
    tokenEvaluationTime: number;
  };

  /**
   * Device and environment context
   */
  context: {
    userAgent: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    connectionType: string;
    memoryLimit?: number;
  };
}

/**
 * Buffered metric for batched sending
 */
export interface BufferedMetric {
  type: string;
  value: number;
  rating?: string;
  context: Record<string, unknown>;
  timestamp: number;
  page?: string;
}

/**
 * Performance thresholds configuration
 */
export interface PerformanceThresholds {
  lcp: { good: number; needs_improvement: number };
  fid: { good: number; needs_improvement: number };
  cls: { good: number; needs_improvement: number };
  fcp: { good: number; needs_improvement: number };
  ttfb: { good: number; needs_improvement: number };
  bundleSize: { target: number; maximum: number };
  renderTime: { target: number; maximum: number };
}

/**
 * Performance monitor configuration
 */
export interface PerformanceConfig {
  /**
   * Enable performance monitoring
   */
  enabled: boolean;

  /**
   * Sampling rate (0-1)
   */
  sampleRate: number;

  /**
   * Performance thresholds
   */
  thresholds: PerformanceThresholds;

  /**
   * Analytics endpoint
   */
  endpoint?: string;

  /**
   * Buffer size for batching
   */
  bufferSize: number;

  /**
   * Flush interval in milliseconds
   */
  flushInterval: number;
}

/**
 * Performance summary result
 */
export interface PerformanceSummary {
  loadTime: number | null;
  fcp: number | null;
  timestamp: number;
  page: string;
}

/**
 * Metric recording callback type
 */
export type MetricRecorder = (
  type: string,
  value: number,
  context?: Record<string, unknown>
) => void;
