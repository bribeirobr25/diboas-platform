/**
 * Production Alerting Service
 *
 * Monitoring & Observability: Real-time alerting for performance and errors
 * Error Handling & System Recovery: Automated incident response
 * Service Agnostic Abstraction: Multi-channel alerting system
 * Security & Audit Standards: Secure alert delivery
 * Product KPIs & Analytics: Business-critical metrics alerting
 */

import { Logger } from './Logger';
import { MONITORING_CONFIG } from '@/config/monitoring';

// Import types
import {
  AlertSeverity,
  AlertCategory,
  type Alert,
  type AlertThresholds,
  type AlertStats
} from './alertTypes';

// Import configuration
import {
  DEFAULT_THRESHOLDS,
  ALERT_CLEANUP_INTERVAL,
  MAX_ALERT_AGE
} from './alertConfig';

// Import utilities
import {
  generateAlertId,
  generateFingerprint,
  generateActionUrl,
  getLogLevel,
  getSuppressionDuration
} from './alertUtils';

// Import delivery handlers
import { deliverAlert, sendResolutionNotification } from './alertDelivery';

// Re-export for backwards compatibility
export { AlertSeverity, AlertCategory } from './alertTypes';
export type { Alert, AlertThresholds, AlertStats } from './alertTypes';
export { DEFAULT_THRESHOLDS } from './alertConfig';

/**
 * Centralized Alerting Service
 */
export class AlertingService {
  private alerts: Map<string, Alert> = new Map();
  private suppressedAlerts = new Set<string>();
  private thresholds: AlertThresholds;
  private isInitialized = false;

  constructor(customThresholds?: Partial<AlertThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
    this.initialize();
  }

  /**
   * Initialize the alerting service
   */
  private initialize(): void {
    if (this.isInitialized || !MONITORING_CONFIG.alerts.enabled) return;

    // Set up alert cleanup interval
    setInterval(() => {
      this.cleanupOldAlerts();
    }, ALERT_CLEANUP_INTERVAL);

    this.isInitialized = true;
    Logger.info('Alerting service initialized', {
      enabled: MONITORING_CONFIG.alerts.enabled,
      channels: Object.keys(MONITORING_CONFIG.alerts.channels)
    });
  }

  /**
   * Send an alert
   */
  async sendAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<string> {
    const alertId = generateAlertId();
    const fullAlert: Alert = {
      ...alert,
      id: alertId,
      timestamp: Date.now()
    };

    // Check if alert should be suppressed
    const fingerprint = alert.fingerprint || generateFingerprint(alert);
    if (this.suppressedAlerts.has(fingerprint)) {
      Logger.debug('Alert suppressed due to rate limiting', { alertId, fingerprint });
      return alertId;
    }

    // Store alert
    this.alerts.set(alertId, fullAlert);

    // Log alert
    const logMessage = 'Alert triggered';
    const logContext = {
      alertId,
      title: alert.title,
      severity: alert.severity,
      category: alert.category,
      source: alert.source
    };

    const logLevel = getLogLevel(alert.severity);
    switch (logLevel) {
      case 'error':
        Logger.error(logMessage, logContext);
        break;
      case 'warn':
        Logger.warn(logMessage, logContext);
        break;
      case 'info':
        Logger.info(logMessage, logContext);
        break;
      default:
        Logger.debug(logMessage, { breadcrumb: logContext });
    }

    try {
      // Send to configured channels
      await deliverAlert(fullAlert);

      // Add to suppression list temporarily
      this.suppressedAlerts.add(fingerprint);
      setTimeout(() => {
        this.suppressedAlerts.delete(fingerprint);
      }, getSuppressionDuration(alert.severity));

    } catch (error) {
      Logger.error('Failed to deliver alert', { alertId, error });
    }

    return alertId;
  }

  /**
   * Send performance alert
   */
  async sendPerformanceAlert(
    metric: string,
    value: number,
    threshold: number,
    severity: AlertSeverity,
    context?: Record<string, unknown>
  ): Promise<string> {
    return this.sendAlert({
      title: `Performance Alert: ${metric}`,
      message: `${metric} is ${value} (threshold: ${threshold})`,
      severity,
      category: AlertCategory.PERFORMANCE,
      source: 'performance-monitor',
      metadata: {
        metric,
        value,
        threshold,
        ...context
      },
      fingerprint: `performance-${metric}`,
      actionUrl: generateActionUrl('performance', { metric })
    });
  }

  /**
   * Send error alert
   */
  async sendErrorAlert(
    error: Error,
    severity: AlertSeverity,
    context?: Record<string, unknown>
  ): Promise<string> {
    return this.sendAlert({
      title: `Error Alert: ${error.name}`,
      message: error.message,
      severity,
      category: AlertCategory.ERROR,
      source: 'error-boundary',
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        ...context
      },
      fingerprint: `error-${error.name}-${error.message}`,
      actionUrl: generateActionUrl('error', { errorName: error.name })
    });
  }

  /**
   * Send business metric alert
   */
  async sendBusinessAlert(
    metric: string,
    currentValue: number,
    expectedValue: number,
    severity: AlertSeverity,
    context?: Record<string, unknown>
  ): Promise<string> {
    const changePercent = ((currentValue - expectedValue) / expectedValue) * 100;

    return this.sendAlert({
      title: `Business Alert: ${metric}`,
      message: `${metric} is ${currentValue} (expected: ${expectedValue}, change: ${changePercent.toFixed(1)}%)`,
      severity,
      category: AlertCategory.BUSINESS,
      source: 'business-metrics',
      metadata: {
        metric,
        currentValue,
        expectedValue,
        changePercent,
        ...context
      },
      fingerprint: `business-${metric}`,
      actionUrl: generateActionUrl('business', { metric })
    });
  }

  /**
   * Check performance metrics against thresholds
   */
  checkPerformanceThresholds(metrics: {
    renderTime?: number;
    memoryUsage?: number;
    pageLoadTime?: number;
    errorRate?: number;
  }): void {
    const { renderTime, memoryUsage, pageLoadTime, errorRate } = metrics;

    // Check render time
    if (renderTime !== undefined) {
      if (renderTime > this.thresholds.performance.renderTimeMs.critical) {
        this.sendPerformanceAlert('Render Time', renderTime, this.thresholds.performance.renderTimeMs.critical, AlertSeverity.CRITICAL);
      } else if (renderTime > this.thresholds.performance.renderTimeMs.warning) {
        this.sendPerformanceAlert('Render Time', renderTime, this.thresholds.performance.renderTimeMs.warning, AlertSeverity.WARNING);
      }
    }

    // Check memory usage
    if (memoryUsage !== undefined) {
      const memoryMB = memoryUsage / (1024 * 1024);
      if (memoryMB > this.thresholds.performance.memoryUsageMB.critical) {
        this.sendPerformanceAlert('Memory Usage', memoryMB, this.thresholds.performance.memoryUsageMB.critical, AlertSeverity.CRITICAL);
      } else if (memoryMB > this.thresholds.performance.memoryUsageMB.warning) {
        this.sendPerformanceAlert('Memory Usage', memoryMB, this.thresholds.performance.memoryUsageMB.warning, AlertSeverity.WARNING);
      }
    }

    // Check page load time
    if (pageLoadTime !== undefined) {
      if (pageLoadTime > this.thresholds.performance.pageLoadTimeMs.critical) {
        this.sendPerformanceAlert('Page Load Time', pageLoadTime, this.thresholds.performance.pageLoadTimeMs.critical, AlertSeverity.CRITICAL);
      } else if (pageLoadTime > this.thresholds.performance.pageLoadTimeMs.warning) {
        this.sendPerformanceAlert('Page Load Time', pageLoadTime, this.thresholds.performance.pageLoadTimeMs.warning, AlertSeverity.WARNING);
      }
    }

    // Check error rate
    if (errorRate !== undefined) {
      if (errorRate > this.thresholds.performance.errorRate.critical) {
        this.sendPerformanceAlert('Error Rate', errorRate, this.thresholds.performance.errorRate.critical, AlertSeverity.CRITICAL);
      } else if (errorRate > this.thresholds.performance.errorRate.warning) {
        this.sendPerformanceAlert('Error Rate', errorRate, this.thresholds.performance.errorRate.warning, AlertSeverity.WARNING);
      }
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    this.alerts.set(alertId, alert);

    Logger.info('Alert resolved', { alertId, resolvedBy });

    // Send resolution notification if configured
    if (MONITORING_CONFIG.alerts.channels.slack?.webhookUrl) {
      await sendResolutionNotification(alert, resolvedBy);
    }

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get alert statistics
   */
  getAlertStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());

    return {
      total: alerts.length,
      active: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      bySeverity: alerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<AlertSeverity, number>),
      byCategory: alerts.reduce((acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      }, {} as Record<AlertCategory, number>)
    };
  }

  /**
   * Clean up old alerts
   */
  private cleanupOldAlerts(): void {
    const now = Date.now();

    for (const [id, alert] of this.alerts.entries()) {
      if (now - alert.timestamp > MAX_ALERT_AGE) {
        this.alerts.delete(id);
      }
    }
  }
}

// Singleton instance
export const alertingService = new AlertingService();

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as Window & { alertingService?: AlertingService }).alertingService = alertingService;
  }
}
