/**
 * Performance Module - Public API
 */

// Domain types and errors
export * from './domain/PerformanceDomain';

// Performance service
export {
  PerformanceMetricsService,
  createPerformanceService,
  performanceService,
} from './services/PerformanceService';
