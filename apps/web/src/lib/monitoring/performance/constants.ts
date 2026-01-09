/**
 * Performance Monitor - Constants
 *
 * Default configuration values for performance monitoring
 */

import type { PerformanceThresholds } from './types';

/**
 * Default reporting interval (ms)
 */
export const DEFAULT_REPORTING_INTERVAL = 5000; // 5 seconds

/**
 * Default performance thresholds based on web vitals
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: {
    good: 100, // 100ms
    needsImprovement: 300, // 300ms
    poor: 500 // 500ms
  },
  memoryUsage: {
    good: 50 * 1024 * 1024, // 50MB
    needsImprovement: 100 * 1024 * 1024, // 100MB
    poor: 200 * 1024 * 1024 // 200MB
  }
};
