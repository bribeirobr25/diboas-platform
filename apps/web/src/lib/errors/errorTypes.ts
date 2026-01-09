/**
 * Error Types & Enums
 *
 * Type definitions for error reporting
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  JAVASCRIPT = 'javascript',
  NETWORK = 'network',
  RENDERING = 'rendering',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  USER_INTERACTION = 'user_interaction',
  THIRD_PARTY = 'third_party',
  UNKNOWN = 'unknown'
}

/**
 * Error breadcrumb for tracking user actions leading to error
 */
export interface ErrorBreadcrumb {
  timestamp: number;
  message: string;
  category: 'navigation' | 'user_action' | 'http' | 'console' | 'custom';
  level: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

/**
 * Error context interface
 */
export interface ErrorContext {
  sectionId?: string;
  sectionType?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: number;
  customData?: Record<string, unknown>;
  breadcrumbs?: ErrorBreadcrumb[];
}

/**
 * Structured error report
 */
export interface ErrorReport {
  id: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    cause?: string;
  };
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  fingerprint: string;
  tags: string[];
  isRecoverable: boolean;
  affectedUsers?: number;
  firstSeen: number;
  lastSeen: number;
  occurrenceCount: number;
}

/**
 * Error reporting configuration
 */
export interface ErrorReportingConfig {
  enableReporting: boolean;
  enableBreadcrumbs: boolean;
  maxBreadcrumbs: number;
  enablePerformanceTracking: boolean;
  enableUserTracking: boolean;
  enableAutoRecovery: boolean;
  reportingEndpoint?: string;
  apiKey?: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  sampleRate: number; // 0.0 to 1.0
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
  onError?: (report: ErrorReport) => void;
}

/**
 * Error occurrence tracking data
 */
export interface ErrorOccurrence {
  count: number;
  firstSeen: number;
  lastSeen: number;
}
