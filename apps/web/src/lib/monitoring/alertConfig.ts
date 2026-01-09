/**
 * Alert Configuration
 *
 * Default thresholds and configuration for the alerting system
 */

import type { AlertThresholds } from './alertTypes';

/**
 * Default alert thresholds based on industry standards
 */
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  performance: {
    renderTimeMs: { warning: 100, critical: 300 },
    memoryUsageMB: { warning: 50, critical: 100 },
    errorRate: { warning: 1, critical: 5 }, // percentage
    pageLoadTimeMs: { warning: 2000, critical: 4000 }
  },
  business: {
    conversionRate: { warning: -10, critical: -25 }, // percentage drop
    userEngagement: { warning: -15, critical: -30 }, // percentage drop
    errorImpactUsers: { warning: 10, critical: 50 } // number of users
  },
  infrastructure: {
    uptime: { warning: 99.9, critical: 99.5 }, // percentage
    responseTimeMs: { warning: 500, critical: 1000 },
    errorCount: { warning: 10, critical: 50 } // errors per minute
  }
};

/**
 * Alert suppression durations by severity (in milliseconds)
 */
export const SUPPRESSION_DURATIONS = {
  info: 10 * 60 * 1000,      // 10 minutes
  warning: 5 * 60 * 1000,    // 5 minutes
  error: 2 * 60 * 1000,      // 2 minutes
  critical: 1 * 60 * 1000    // 1 minute
} as const;

/**
 * Alert cleanup interval (in milliseconds)
 */
export const ALERT_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum alert age before cleanup (in milliseconds)
 */
export const MAX_ALERT_AGE = 24 * 60 * 60 * 1000; // 24 hours
