/**
 * Monitoring Constants
 * Configuration Management: Centralized monitoring settings
 */

import { MonitoringConfig } from './types';
import { MONITORING_ENDPOINT, IS_PRODUCTION } from '@/config/env';

const MAX_QUEUE_SIZE = 100;

export const MONITORING_DEFAULTS: MonitoringConfig = {
  enabled: IS_PRODUCTION,
  trackErrors: true,
  trackPerformance: true,
  trackSecurity: true,
  maxErrors: MAX_QUEUE_SIZE,
  flushInterval: 60000, // 1 minute
  endpoint: MONITORING_ENDPOINT,
  // API key should only be used server-side, not exposed to client
  apiKey: process.env.MONITORING_API_KEY,
};
