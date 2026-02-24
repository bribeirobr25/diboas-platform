/**
 * Production Monitoring Configuration
 *
 * Monitoring & Observability: Production-ready monitoring configuration
 * Service Agnostic Abstraction: Multi-provider monitoring setup
 * Security & Audit Standards: Secure configuration management
 * No Hard Coded Values: Environment-based configuration
 */

/**
 * Error object shape for error reporting callbacks
 */
export interface MonitoringError {
  message?: string;
  name?: string;
  stack?: string;
  [key: string]: unknown;
}

/**
 * Sentry event shape for beforeSend callback
 * Using a flexible type that's compatible with Sentry's actual types
 */
export interface SentryEventLike {
  event_id?: string;
  message?: string;
  level?: string;
  platform?: string;
  timestamp?: number;
  user?: {
    id?: string | number;
    email?: string;
    username?: string;
    ip_address?: string;
    [key: string]: unknown;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
      stacktrace?: {
        frames?: Array<{
          filename?: string;
          function?: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  [key: string]: unknown;
}

export interface MonitoringConfig {
  errorReporting: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
    sampleRate: number;
    environment: string;
    release?: string;
    beforeSend?: (error: MonitoringError) => MonitoringError | null;
  };
  performance: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
    sampleRate: number;
    budgets: {
      renderTime: { warning: number; error: number };
      bundleSize: { warning: number; error: number };
      memoryUsage: { warning: number; error: number };
    };
  };
  logging: {
    enabled: boolean;
    endpoint?: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    enableRemote: boolean;
  };
  alerts: {
    enabled: boolean;
    channels: {
      slack?: {
        webhookUrl: string;
        channel: string;
        enablePerformanceAlerts: boolean;
        enableErrorAlerts: boolean;
      };
      email?: {
        endpoint: string;
        recipients: string[];
        enablePerformanceAlerts: boolean;
        enableErrorAlerts: boolean;
      };
    };
  };
}

/**
 * Production monitoring configuration
 */
export const MONITORING_CONFIG: MonitoringConfig = {
  errorReporting: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
    endpoint: process.env.ERROR_REPORTING_ENDPOINT,
    // API key is server-only - never expose to client
    apiKey: process.env.ERROR_REPORTING_API_KEY,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    beforeSend: (error) => {
      // Filter out development-only errors in production
      if (process.env.NODE_ENV === 'production') {
        // Skip hydration mismatches in production
        if (error.message?.includes('Hydration')) {
          return null;
        }
        // Skip non-critical console warnings
        if (error.message?.includes('Warning:')) {
          return null;
        }
      }
      return error;
    }
  },
  performance: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
    endpoint: process.env.PERFORMANCE_MONITORING_ENDPOINT,
    // API key is server-only - never expose to client
    apiKey: process.env.PERFORMANCE_MONITORING_API_KEY,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0, // 5% sampling in production
    budgets: {
      renderTime: { warning: 100, error: 300 }, // milliseconds
      bundleSize: { warning: 500 * 1024, error: 1024 * 1024 }, // bytes
      memoryUsage: { warning: 50 * 1024 * 1024, error: 100 * 1024 * 1024 } // bytes
    }
  },
  logging: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_DETAILED_LOGGING === 'true',
    endpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    enableRemote: process.env.NODE_ENV === 'production'
  },
  alerts: {
    enabled: process.env.PERFORMANCE_BUDGET_ALERTS === 'true',
    channels: {
      // Webhook URLs are sensitive - server-only
      slack: process.env.SLACK_WEBHOOK_URL ? {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#alerts',
        enablePerformanceAlerts: true,
        enableErrorAlerts: true
      } : undefined,
      email: process.env.ALERT_EMAIL_ENDPOINT ? {
        endpoint: process.env.ALERT_EMAIL_ENDPOINT,
        recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(','),
        enablePerformanceAlerts: true,
        enableErrorAlerts: true
      } : undefined
    }
  }
};

/**
 * Sentry Configuration (if using Sentry)
 */
export const SENTRY_CONFIG = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  org: process.env.NEXT_PUBLIC_SENTRY_ORG,
  project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  debug: process.env.NODE_ENV === 'development',
  // Note: Using SentryEventLike for local type safety; Sentry's init() will adapt
  beforeSend: (event: SentryEventLike) => {
    // Privacy: Don't send user data in production
    if (process.env.NODE_ENV === 'production' && event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  }
};

