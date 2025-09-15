/**
 * Monitoring Constants
 * Configuration Management: Centralized monitoring settings
 */

import { MonitoringConfig } from './types';

export const MONITORING_DEFAULTS: MonitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  trackErrors: true,
  trackPerformance: true,
  trackSecurity: true,
  maxErrors: 100,
  flushInterval: 60000, // 1 minute
  endpoint: process.env.NEXT_PUBLIC_MONITORING_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_MONITORING_API_KEY
};