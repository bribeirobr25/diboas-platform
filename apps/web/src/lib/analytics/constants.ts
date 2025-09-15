/**
 * Analytics Constants
 * Configuration Management: Centralized analytics settings
 */

import { AnalyticsConfig } from './types';

export const ANALYTICS_DEFAULTS: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  trackPageViews: true,
  trackPerformance: true,
  trackNavigation: true,
  batchSize: 10,
  flushInterval: 30000 // 30 seconds
};

export const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 }
} as const;