/**
 * Analytics Module Exports
 * File Decoupling: Clean module interface
 * Performance: Specific exports for better tree-shaking
 */

// Type exports - only export what's actually used
export type {
  AnalyticsEvent,
  PageViewEvent,
  PerformanceEvent,
  NavigationEvent,
  AnalyticsConfig,
  AnalyticsService,
  WebVitalsMetric,
} from './types';

// Constant exports - only export what's needed
export { ANALYTICS_DEFAULTS, ANALYTICS_CONSTANTS } from './constants';

// Service exports
export { analyticsService } from './service';
export { initializeWebVitals, getMetricRating } from './web-vitals';

// Backend abstraction
export type { IAnalyticsBackend } from './backends';
export { GA4Backend, PostHogBackend } from './backends';
