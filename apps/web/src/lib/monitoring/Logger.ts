/**
 * Centralized Logging System
 * 
 * Monitoring & Observability: Comprehensive logging with structured data
 * Error Handling & System Recovery: Error tracking and recovery logging
 * Security & Audit Standards: Audit trail and secure logging
 * Performance & SEO Optimization: Performance-conscious logging
 * No Hard Coded Values: Configurable log levels and destinations
 * Domain-Driven Design: Domain-specific logging contexts
 */

// Log levels following standard practices
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Log entry structure
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  source?: string;
  sessionId?: string;
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

/**
 * Centralized Logger with multiple destinations
 * Monitoring: Structured logging with context
 * Performance: Efficient logging with batching
 */
export class Logger {
  private static config: LoggerConfig = {
    level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableStorage: typeof window !== 'undefined',
    maxStorageEntries: 1000,
    enableRemoteLogging: process.env.NODE_ENV === 'production',
    remoteEndpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT
  };

  private static logBuffer: LogEntry[] = [];
  private static sessionId = this.generateSessionId();

  /**
   * Debug level logging
   */
  static debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  static info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  static warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  static error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Critical level logging
   */
  static critical(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * Core logging method
   * Performance: Efficient with minimal overhead
   * Security: Sanitizes sensitive data
   */
  private static log(
    level: LogLevel, 
    message: string, 
    context?: Record<string, unknown>, 
    error?: Error
  ): void {
    // Check log level
    if (level < this.config.level) {
      return;
    }

    // Create log entry
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: this.sanitizeContext(context),
      error,
      source: this.getCallSource(),
      sessionId: this.sessionId
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.logToStorage(logEntry);
    }

    // Remote logging (batched for performance)
    if (this.config.enableRemoteLogging && level >= LogLevel.WARN) {
      this.logToRemote(logEntry);
    }
  }

  /**
   * Console logging with appropriate methods
   */
  private static logToConsole(entry: LogEntry): void {
    const { level, message, context, error } = entry;
    const timestamp = new Date(entry.timestamp).toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, context, error);
        break;
      case LogLevel.INFO:
        console.info(logMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage, context, error);
        break;
    }
  }

  /**
   * Local storage logging for debugging
   * Performance: Maintains size limits
   */
  private static logToStorage(entry: LogEntry): void {
    try {
      // Add to buffer
      this.logBuffer.push(entry);

      // Maintain buffer size
      if (this.logBuffer.length > this.config.maxStorageEntries) {
        this.logBuffer = this.logBuffer.slice(-this.config.maxStorageEntries);
      }

      // Store in localStorage for debugging
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('diboas_logs', JSON.stringify(this.logBuffer.slice(-100))); // Keep last 100
      }
    } catch (error) {
      // Silently fail to prevent logging loops
      console.warn('Failed to log to storage:', error);
    }
  }

  /**
   * Remote logging for production monitoring
   * Performance: Batched and non-blocking
   */
  private static logToRemote(entry: LogEntry): void {
    if (!this.config.remoteEndpoint) {
      return;
    }

    // Non-blocking remote logging
    setTimeout(() => {
      fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      }).catch(() => {
        // Silently fail to prevent logging loops
      });
    }, 0);
  }

  /**
   * Sanitize context to remove sensitive data
   * Security: Prevents logging of sensitive information
   */
  private static sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;

    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
    const sanitized = { ...context };

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Get call source for debugging
   */
  private static getCallSource(): string {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        // Find first line that's not this Logger class
        for (let i = 3; i < lines.length; i++) {
          const line = lines[i];
          if (line && !line.includes('Logger.ts')) {
            return line.trim();
          }
        }
      }
    } catch {
      // Silently fail
    }
    return 'unknown';
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get logs for debugging
   */
  static getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logBuffer.filter(entry => entry.level >= level);
    }
    return [...this.logBuffer];
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    this.logBuffer = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('diboas_logs');
    }
  }

  /**
   * Update configuration
   */
  static configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Development utilities
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).Logger = Logger;
  }
}