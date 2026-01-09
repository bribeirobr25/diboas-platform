/**
 * Alert Utilities
 *
 * Utility functions for the alerting system
 */

import { AlertSeverity, type Alert } from './alertTypes';
import { SUPPRESSION_DURATIONS } from './alertConfig';
import type { Logger as LoggerType } from './Logger';

/**
 * Generate a unique alert ID
 */
export function generateAlertId(): string {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a fingerprint for deduplication
 */
export function generateFingerprint(alert: Omit<Alert, 'id' | 'timestamp'>): string {
  const components = [alert.title, alert.category, alert.source].join('|');
  return btoa(components).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
}

/**
 * Generate action URL for an alert
 */
export function generateActionUrl(type: string, params: Record<string, unknown>): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diboas.com';
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return `${baseUrl}/admin/monitoring/${type}?${query}`;
}

/**
 * Get log level for a severity
 */
export function getLogLevel(severity: AlertSeverity): keyof typeof LoggerType {
  switch (severity) {
    case AlertSeverity.INFO: return 'info';
    case AlertSeverity.WARNING: return 'warn';
    case AlertSeverity.ERROR: return 'error';
    case AlertSeverity.CRITICAL: return 'critical';
    default: return 'info';
  }
}

/**
 * Get Slack color for a severity
 */
export function getSlackColor(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.INFO: return 'good';
    case AlertSeverity.WARNING: return 'warning';
    case AlertSeverity.ERROR: return 'danger';
    case AlertSeverity.CRITICAL: return '#990000';
    default: return 'good';
  }
}

/**
 * Get Slack emoji for a severity
 */
export function getSlackEmoji(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.INFO: return 'i';
    case AlertSeverity.WARNING: return '!';
    case AlertSeverity.ERROR: return 'x';
    case AlertSeverity.CRITICAL: return '!!';
    default: return 'i';
  }
}

/**
 * Get suppression duration for a severity
 */
export function getSuppressionDuration(severity: AlertSeverity): number {
  return SUPPRESSION_DURATIONS[severity] || SUPPRESSION_DURATIONS.warning;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return '<1m';
  }
}

/**
 * Email severity colors
 * NOTE: Email clients don't support CSS variables, so colors are hardcoded.
 * These values match the design tokens in design-tokens.css:
 * - INFO: --alert-info (#0066cc)
 * - WARNING: --alert-warning (#ff9900)
 * - ERROR: --alert-error (#cc0000)
 * - CRITICAL: --alert-critical (#990000)
 */
export const EMAIL_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  [AlertSeverity.INFO]: '#0066cc',
  [AlertSeverity.WARNING]: '#ff9900',
  [AlertSeverity.ERROR]: '#cc0000',
  [AlertSeverity.CRITICAL]: '#990000'
};
