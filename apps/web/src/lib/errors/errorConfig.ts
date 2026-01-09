/**
 * Error Reporting Configuration
 *
 * Default configuration for error reporting service
 */

import type { ErrorReportingConfig } from './errorTypes';

/**
 * Default configuration
 */
export const DEFAULT_ERROR_CONFIG: ErrorReportingConfig = {
  enableReporting: process.env.NODE_ENV === 'production',
  enableBreadcrumbs: true,
  maxBreadcrumbs: 50,
  enablePerformanceTracking: true,
  enableUserTracking: false, // Privacy-conscious default
  enableAutoRecovery: true,
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0 // 10% sampling in production
};

/**
 * Sensitive keys that should be redacted from error reports
 */
export const SENSITIVE_KEYS = [
  'password',
  'token',
  'key',
  'secret',
  'auth',
  'credential',
  'ssn',
  'email'
];
