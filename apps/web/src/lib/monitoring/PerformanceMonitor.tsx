/**
 * Performance Monitor - Re-exports
 *
 * Original: 502 lines → Refactored into performance/ directory
 * Maintains backwards compatibility with existing imports
 */

'use client';

// Re-export everything from the refactored performance module
export {
  usePerformanceMonitor,
  withPerformanceMonitoring,
  PerformanceMonitorComponent as PerformanceMonitor,
  DEFAULT_THRESHOLDS,
  DEFAULT_REPORTING_INTERVAL,
} from './performance';

export type {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceMonitorConfig,
  PerformanceSeverity,
  PerformanceMonitorReturn,
  PerformanceMonitorEnhancement,
} from './performance';
