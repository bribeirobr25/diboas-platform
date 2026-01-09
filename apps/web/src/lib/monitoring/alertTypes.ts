/**
 * Alert Types
 *
 * Type definitions for the alerting system
 */

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

export interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  bySeverity: Record<AlertSeverity, number>;
  byCategory: Record<AlertCategory, number>;
}
