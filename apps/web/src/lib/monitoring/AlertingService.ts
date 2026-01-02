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

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AlertCategory {
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security',
  BUSINESS = 'business',
  INFRASTRUCTURE = 'infrastructure'
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  timestamp: number;
  source: string;
  metadata: Record<string, unknown>;
  fingerprint?: string;
  actionUrl?: string;
  resolved?: boolean;
}

export interface AlertThresholds {
  performance: {
    renderTimeMs: { warning: number; critical: number };
    memoryUsageMB: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
    pageLoadTimeMs: { warning: number; critical: number };
  };
  business: {
    conversionRate: { warning: number; critical: number };
    userEngagement: { warning: number; critical: number };
    errorImpactUsers: { warning: number; critical: number };
  };
  infrastructure: {
    uptime: { warning: number; critical: number };
    responseTimeMs: { warning: number; critical: number };
    errorCount: { warning: number; critical: number };
  };
}

/**
 * Default alert thresholds based on industry standards
 */
const DEFAULT_THRESHOLDS: AlertThresholds = {
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
    }, 5 * 60 * 1000); // Clean up every 5 minutes

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
    const alertId = this.generateAlertId();
    const fullAlert: Alert = {
      ...alert,
      id: alertId,
      timestamp: Date.now()
    };

    // Check if alert should be suppressed
    const fingerprint = alert.fingerprint || this.generateFingerprint(alert);
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

    switch (this.getLogLevel(alert.severity)) {
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
      await this.deliverAlert(fullAlert);

      // Add to suppression list temporarily
      this.suppressedAlerts.add(fingerprint);
      setTimeout(() => {
        this.suppressedAlerts.delete(fingerprint);
      }, this.getSuppressionDuration(alert.severity));

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
      actionUrl: this.generateActionUrl('performance', { metric })
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
      actionUrl: this.generateActionUrl('error', { errorName: error.name })
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
      actionUrl: this.generateActionUrl('business', { metric })
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
   * Deliver alert to configured channels
   */
  private async deliverAlert(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Slack delivery
    if (MONITORING_CONFIG.alerts.channels.slack) {
      const { slack } = MONITORING_CONFIG.alerts.channels;
      if ((alert.category === AlertCategory.PERFORMANCE && slack.enablePerformanceAlerts) ||
          (alert.category === AlertCategory.ERROR && slack.enableErrorAlerts)) {
        promises.push(this.sendToSlack(alert, slack));
      }
    }

    // Email delivery
    if (MONITORING_CONFIG.alerts.channels.email) {
      const { email } = MONITORING_CONFIG.alerts.channels;
      if ((alert.category === AlertCategory.PERFORMANCE && email.enablePerformanceAlerts) ||
          (alert.category === AlertCategory.ERROR && email.enableErrorAlerts)) {
        promises.push(this.sendToEmail(alert, email));
      }
    }

    // Wait for all deliveries
    await Promise.allSettled(promises);
  }

  /**
   * Send alert to Slack
   */
  private async sendToSlack(alert: Alert, config: NonNullable<typeof MONITORING_CONFIG.alerts.channels.slack>): Promise<void> {
    const color = this.getSlackColor(alert.severity);
    const emoji = this.getSlackEmoji(alert.severity);
    
    const payload = {
      channel: config.channel,
      username: 'diBoaS Monitoring',
      icon_emoji: ':warning:',
      attachments: [{
        color,
        title: `${emoji} ${alert.title}`,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Category', value: alert.category, short: true },
          { title: 'Source', value: alert.source, short: true },
          { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
        ],
        actions: alert.actionUrl ? [{
          type: 'button',
          text: 'View Details',
          url: alert.actionUrl
        }] : undefined,
        footer: 'diBoaS Monitoring',
        ts: Math.floor(alert.timestamp / 1000)
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send alert to email
   */
  private async sendToEmail(alert: Alert, config: NonNullable<typeof MONITORING_CONFIG.alerts.channels.email>): Promise<void> {
    const payload = {
      to: config.recipients,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      html: this.generateEmailHTML(alert),
      from: 'alerts@diboas.com'
    };

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Generate email HTML content
   *
   * NOTE: Email clients don't support CSS variables, so colors are hardcoded here.
   * These values match the design tokens in design-tokens.css:
   * - INFO: --alert-info (#0066cc)
   * - WARNING: --alert-warning (#ff9900)
   * - ERROR: --alert-error (#cc0000)
   * - CRITICAL: --alert-critical (#990000)
   */
  private generateEmailHTML(alert: Alert): string {
    const severityColor = {
      [AlertSeverity.INFO]: '#0066cc',
      [AlertSeverity.WARNING]: '#ff9900',
      [AlertSeverity.ERROR]: '#cc0000',
      [AlertSeverity.CRITICAL]: '#990000'
    }[alert.severity];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>diBoaS Alert</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; }
            .metadata { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 20px; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; background-color: ${severityColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${alert.title}</h1>
              <p>Severity: ${alert.severity.toUpperCase()}</p>
            </div>
            <div class="content">
              <p><strong>Message:</strong> ${alert.message}</p>
              <p><strong>Source:</strong> ${alert.source}</p>
              <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
              
              ${alert.actionUrl ? `<a href="${alert.actionUrl}" class="button">View Details</a>` : ''}
              
              <div class="metadata">
                <strong>Additional Information:</strong>
                <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
              </div>
            </div>
            <div class="footer">
              This alert was generated by diBoaS Monitoring System
            </div>
          </div>
        </body>
      </html>
    `;
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
      await this.sendResolutionNotification(alert, resolvedBy);
    }

    return true;
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert, resolvedBy?: string): Promise<void> {
    const config = MONITORING_CONFIG.alerts.channels.slack;
    if (!config) return;

    const payload = {
      channel: config.channel,
      username: 'diBoaS Monitoring',
      icon_emoji: ':white_check_mark:',
      text: `✅ Alert resolved: ${alert.title}`,
      attachments: [{
        color: 'good',
        fields: [
          { title: 'Alert ID', value: alert.id, short: true },
          { title: 'Resolved By', value: resolvedBy || 'System', short: true },
          { title: 'Duration', value: this.formatDuration(Date.now() - alert.timestamp), short: true }
        ]
      }]
    };

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
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
  getAlertStats(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<AlertCategory, number>;
  } {
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
   * Utility methods
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(alert: Omit<Alert, 'id' | 'timestamp'>): string {
    const components = [alert.title, alert.category, alert.source].join('|');
    return btoa(components).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  private generateActionUrl(type: string, params: Record<string, unknown>): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://diboas.com';
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    return `${baseUrl}/admin/monitoring/${type}?${query}`;
  }

  private getLogLevel(severity: AlertSeverity): keyof typeof Logger {
    switch (severity) {
      case AlertSeverity.INFO: return 'info';
      case AlertSeverity.WARNING: return 'warn';
      case AlertSeverity.ERROR: return 'error';
      case AlertSeverity.CRITICAL: return 'critical';
      default: return 'info';
    }
  }

  private getSlackColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO: return 'good';
      case AlertSeverity.WARNING: return 'warning';
      case AlertSeverity.ERROR: return 'danger';
      case AlertSeverity.CRITICAL: return '#990000';
      default: return 'good';
    }
  }

  private getSlackEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO: return 'ℹ️';
      case AlertSeverity.WARNING: return '⚠️';
      case AlertSeverity.ERROR: return '❌';
      case AlertSeverity.CRITICAL: return '🚨';
      default: return 'ℹ️';
    }
  }

  private getSuppressionDuration(severity: AlertSeverity): number {
    switch (severity) {
      case AlertSeverity.INFO: return 10 * 60 * 1000; // 10 minutes
      case AlertSeverity.WARNING: return 5 * 60 * 1000; // 5 minutes
      case AlertSeverity.ERROR: return 2 * 60 * 1000; // 2 minutes
      case AlertSeverity.CRITICAL: return 1 * 60 * 1000; // 1 minute
      default: return 5 * 60 * 1000;
    }
  }

  private formatDuration(ms: number): string {
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

  private cleanupOldAlerts(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, alert] of this.alerts.entries()) {
      if (now - alert.timestamp > maxAge) {
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
    (window as any).alertingService = alertingService;
  }
}