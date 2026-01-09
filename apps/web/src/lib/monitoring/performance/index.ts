/**
 * Performance Monitoring - Public API
 */

// Main hook
export { usePerformanceMonitor } from './usePerformanceMonitor';

// HOC
export { withPerformanceMonitoring } from './withPerformanceMonitoring';

// Component
export { PerformanceMonitorComponent } from './PerformanceMonitorComponent';

// Types
export type {
  PerformanceMetrics,
  PerformanceThresholds,
  PerformanceMonitorConfig,
  PerformanceSeverity,
  PerformanceMonitorReturn,
  PerformanceMonitorEnhancement,
} from './types';

// Constants
export { DEFAULT_THRESHOLDS, DEFAULT_REPORTING_INTERVAL } from './constants';
