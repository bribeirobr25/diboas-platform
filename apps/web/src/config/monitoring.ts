/**
 * Production Monitoring Configuration
 * 
 * Monitoring & Observability: Production-ready monitoring configuration
 * Service Agnostic Abstraction: Multi-provider monitoring setup
 * Security & Audit Standards: Secure configuration management
 * No Hard Coded Values: Environment-based configuration
 */

export interface MonitoringConfig {
  errorReporting: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
    sampleRate: number;
    environment: string;
    release?: string;
    beforeSend?: (error: any) => any | null;
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
    endpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_ERROR_REPORTING_API_KEY,
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
    endpoint: process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING_API_KEY,
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
    enabled: process.env.NEXT_PUBLIC_PERFORMANCE_BUDGET_ALERTS === 'true',
    channels: {
      slack: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL ? {
        webhookUrl: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
        channel: process.env.NEXT_PUBLIC_SLACK_CHANNEL || '#alerts',
        enablePerformanceAlerts: true,
        enableErrorAlerts: true
      } : undefined,
      email: process.env.NEXT_PUBLIC_ALERT_EMAIL_ENDPOINT ? {
        endpoint: process.env.NEXT_PUBLIC_ALERT_EMAIL_ENDPOINT,
        recipients: (process.env.NEXT_PUBLIC_ALERT_EMAIL_RECIPIENTS || '').split(','),
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
  beforeSend: (event: any) => {
    // Privacy: Don't send user data in production
    if (process.env.NODE_ENV === 'production' && event.user) {
      delete event.user.email;
      delete event.user.username;
    }
    return event;
  }
};

/**
 * DataDog Configuration (if using DataDog)
 */
export const DATADOG_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_DATADOG_API_KEY,
  appKey: process.env.NEXT_PUBLIC_DATADOG_APP_KEY,
  site: process.env.NEXT_PUBLIC_DATADOG_SITE || 'datadoghq.com',
  env: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_APP_VERSION,
  service: 'diboas-web',
  enableRum: true,
  enableLogs: process.env.NODE_ENV === 'production',
  sampleRate: process.env.NODE_ENV === 'production' ? 10 : 100, // percentage
  trackingConsent: 'granted' // For GDPR compliance
};

/**
 * New Relic Configuration (if using New Relic)
 */
export const NEW_RELIC_CONFIG = {
  licenseKey: process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY,
  appId: process.env.NEXT_PUBLIC_NEW_RELIC_APP_ID,
  accountId: process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID,
  applicationName: 'diBoaS Web Platform',
  environment: process.env.NODE_ENV,
  version: process.env.NEXT_PUBLIC_APP_VERSION
};

/**
 * LogRocket Configuration (if using LogRocket)
 */
export const LOGROCKET_CONFIG = {
  appId: process.env.NEXT_PUBLIC_LOGROCKET_APP_ID,
  shouldCaptureIP: false, // Privacy-conscious
  console: {
    shouldAggregateConsoleErrors: true,
    isEnabled: {
      log: process.env.NODE_ENV === 'development',
      info: true,
      warn: true,
      error: true,
      debug: process.env.NODE_ENV === 'development'
    }
  },
  network: {
    requestSanitizer: (request: any) => {
      // Remove sensitive headers
      if (request.headers.authorization) {
        request.headers.authorization = '[REDACTED]';
      }
      return request;
    },
    responseSanitizer: (response: any) => {
      // Remove sensitive response data
      if (response.body && typeof response.body === 'object') {
        ['password', 'token', 'secret', 'key'].forEach(field => {
          if (response.body[field]) {
            response.body[field] = '[REDACTED]';
          }
        });
      }
      return response;
    }
  }
};

/**
 * Get active monitoring configuration based on environment
 */
export function getActiveMonitoringConfig(): MonitoringConfig {
  return MONITORING_CONFIG;
}

/**
 * Initialize monitoring services based on configuration
 */
export function initializeMonitoringServices(): void {
  if (typeof window === 'undefined') return;

  // Initialize Sentry if configured (only if package is available)
  if (SENTRY_CONFIG.dsn) {
    // @ts-ignore - Optional package
    import('@sentry/nextjs').then(({ init }) => {
      init(SENTRY_CONFIG);
    }).catch(() => {
      console.warn('Sentry package not available. Install @sentry/nextjs to enable error reporting.');
    });
  }

  // Initialize DataDog if configured (only if package is available)
  if (DATADOG_CONFIG.apiKey) {
    // @ts-ignore - Optional package
    import('@datadog/browser-rum').then(({ datadogRum }) => {
      datadogRum.init({
        applicationId: DATADOG_CONFIG.appKey || '',
        clientToken: DATADOG_CONFIG.apiKey || '',
        site: DATADOG_CONFIG.site,
        service: DATADOG_CONFIG.service,
        env: DATADOG_CONFIG.env,
        version: DATADOG_CONFIG.version,
        sampleRate: DATADOG_CONFIG.sampleRate,
        trackInteractions: true,
        defaultPrivacyLevel: 'mask-user-input'
      });
    }).catch(() => {
      console.warn('DataDog package not available. Install @datadog/browser-rum to enable RUM.');
    });
  }

  // Initialize LogRocket if configured (only if package is available)
  if (LOGROCKET_CONFIG.appId) {
    // @ts-ignore - Optional package
    import('logrocket').then((LogRocket) => {
      LogRocket.default.init(LOGROCKET_CONFIG.appId, LOGROCKET_CONFIG);
    }).catch(() => {
      console.warn('LogRocket package not available. Install logrocket to enable session recording.');
    });
  }

  console.info('Monitoring services initialized', {
    errorReporting: MONITORING_CONFIG.errorReporting.enabled,
    performance: MONITORING_CONFIG.performance.enabled,
    logging: MONITORING_CONFIG.logging.enabled,
    environment: MONITORING_CONFIG.errorReporting.environment
  });
}