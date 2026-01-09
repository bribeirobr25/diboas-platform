/**
 * Performance Monitor Configuration
 *
 * Default configuration values for performance monitoring
 */

import type { PerformanceThresholds, PerformanceConfig } from './performanceTypes';

/**
 * Default performance thresholds based on Core Web Vitals standards
 */
export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needs_improvement: 4000 },
  fid: { good: 100, needs_improvement: 300 },
  cls: { good: 0.1, needs_improvement: 0.25 },
  fcp: { good: 1800, needs_improvement: 3000 },
  ttfb: { good: 800, needs_improvement: 1800 },
  bundleSize: { target: 300 * 1024, maximum: 500 * 1024 },
  renderTime: { target: 16, maximum: 100 }
};

/**
 * Default performance monitor configuration
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // 10% sampling in production
  thresholds: DEFAULT_PERFORMANCE_THRESHOLDS,
  bufferSize: 10,
  flushInterval: 30000 // 30 seconds
};

/**
 * Create a merged configuration with defaults
 */
export function createPerformanceConfig(
  overrides?: Partial<PerformanceConfig>
): PerformanceConfig {
  return {
    ...DEFAULT_PERFORMANCE_CONFIG,
    ...overrides,
    thresholds: {
      ...DEFAULT_PERFORMANCE_THRESHOLDS,
      ...overrides?.thresholds
    }
  };
}
