/**
 * Monitoring Interfaces — Domain-Driven Design
 *
 * Abstracts the alerting service so consumers depend on contracts,
 * not concrete implementations.
 */

import type {
  Alert,
  AlertSeverity,
  AlertStats,
  AlertThresholds,
} from './alertTypes';

export interface IAlertingService {
  /** Send a generic alert. Returns the generated alert ID. */
  sendAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<string>;

  /** Send a performance-specific alert when a metric exceeds its threshold. */
  sendPerformanceAlert(
    metric: string,
    value: number,
    threshold: number,
    severity: AlertSeverity,
    context?: Record<string, unknown>
  ): Promise<string>;

  /** Send an error alert for a caught exception. */
  sendErrorAlert(
    error: Error,
    severity: AlertSeverity,
    context?: Record<string, unknown>
  ): Promise<string>;

  /** Send a business-metric alert when a KPI deviates from expected. */
  sendBusinessAlert(
    metric: string,
    currentValue: number,
    expectedValue: number,
    severity: AlertSeverity,
    context?: Record<string, unknown>
  ): Promise<string>;

  /** Evaluate a set of performance metrics against configured thresholds. */
  checkPerformanceThresholds(metrics: {
    renderTime?: number;
    memoryUsage?: number;
    pageLoadTime?: number;
    errorRate?: number;
  }): void;

  /** Mark an alert as resolved. */
  resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean>;

  /** Return all currently unresolved alerts. */
  getActiveAlerts(): Alert[];

  /** Return aggregate alert statistics. */
  getAlertStats(): AlertStats;

  /** Tear down the service and release resources. */
  destroy(): void;
}

/** Re-export alert types for convenience */
export type { Alert, AlertSeverity, AlertStats, AlertThresholds };
