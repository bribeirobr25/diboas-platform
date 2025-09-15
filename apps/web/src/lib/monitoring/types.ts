/**
 * Monitoring Types
 * Error Tracking: Type definitions for monitoring system
 */

export interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  url: string;
  line?: number;
  column?: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  locale?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'security' | 'performance' | 'user';
  metadata?: Record<string, any>;
}

export interface PerformanceIssue {
  id: string;
  type: 'slow_page' | 'large_bundle' | 'memory_leak' | 'long_task';
  metric: string;
  value: number;
  threshold: number;
  url: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: 'csp_violation' | 'xss_attempt' | 'injection_attempt' | 'unauthorized_access';
  description: string;
  url: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  enabled: boolean;
  trackErrors: boolean;
  trackPerformance: boolean;
  trackSecurity: boolean;
  maxErrors: number;
  flushInterval: number;
  endpoint?: string;
  apiKey?: string;
}

export interface MonitoringService {
  trackError(error: Error, context?: Record<string, any>): void;
  trackPerformanceIssue(issue: PerformanceIssue): void;
  trackSecurityEvent(event: SecurityEvent): void;
  setUser(userId: string, metadata?: Record<string, any>): void;
  setContext(key: string, value: any): void;
  flush(): Promise<void>;
}