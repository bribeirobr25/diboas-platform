/**
 * Analytics Constants
 * Configuration Management: Centralized analytics settings
 */

import { AnalyticsConfig } from './types';
import { WEB_VITALS_THRESHOLDS } from '@/config/performance-thresholds';

export const ANALYTICS_DEFAULTS: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  trackPageViews: true,
  trackPerformance: true,
  trackNavigation: true,
  batchSize: 10,
  flushInterval: 30000 // 30 seconds
};

export const ANALYTICS_CONSTANTS = {
  RETRY_DELAY: 5000, // 5 seconds
  MAX_QUEUE_SIZE: 100,
  MONITORING_TIMEOUT: 3000, // 3 seconds
  
  // Error handling timeouts
  MAX_RETRY_DELAY: 10000, // 10 seconds
  BASE_RETRY_DELAY: 1000, // 1 second
  JITTER_MAX: 1000, // 1 second jitter
  BACKOFF_MULTIPLIER: 2
} as const;

// Use centralized performance thresholds
export const PERFORMANCE_THRESHOLDS = WEB_VITALS_THRESHOLDS;