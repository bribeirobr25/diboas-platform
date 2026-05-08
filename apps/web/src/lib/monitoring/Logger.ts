/**
 * Centralized Logging System
 *
 * Monitoring & Observability: Comprehensive logging with structured data
 * Error Handling & System Recovery: Error tracking and recovery logging
 * Security & Audit Standards: Audit trail and secure logging
 * Performance & SEO Optimization: Performance-conscious logging
 * No Hard Coded Values: Configurable log levels and destinations
 * Domain-Driven Design: Domain-specific logging contexts
 *
 * Runtime safety
 * --------------
 * This Logger is safe to import from **all three Next.js runtimes**:
 *
 *   - **Browser**:   reads `<meta name="x-request-id">`, batches to localStorage,
 *                    posts to a remote endpoint when configured.
 *   - **Node.js**:   prints to console + posts to remote endpoint.
 *   - **Edge**:      prints to console + posts to remote endpoint. Storage is
 *                    automatically disabled (`enableStorage` gates on
 *                    `typeof window !== 'undefined'`), and `StorageLogDestination`
 *                    only references `localStorage` inside method bodies (never
 *                    at module scope) so the static import is harmless.
 *
 * Phase 3 L3 (audit/2026-05-08): documented the Edge-runtime safety contract
 * after replacing `console.error` in `app/api/health/live/route.ts`. New code
 * should call `Logger.*` rather than `console.*` regardless of runtime.
 */

import { sanitizeContext } from './logRedactor';
import { StorageLogDestination } from './storageLogDestination';

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
  /**
   * Server↔client correlation ID — sourced from `x-request-id` set by
   * middleware on the initial render, embedded as a `<meta>` tag, and
   * read by Logger.initFromMeta() on first client mount.
   *
   * Phase 2 L1 (audit/2026-05-08): closes the audit gap where Sentry
   * events on the client weren't traceable back to the originating
   * server request.
   */
  requestId?: string;
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

  private static storageDestination = new StorageLogDestination(
    Logger.config.maxStorageEntries
  );
  private static sessionId = this.generateSessionId();
  private static requestId: string | undefined;

  /**
   * Read x-request-id from the server-rendered `<meta>` tag on first
   * client mount. Subsequent fetches can refresh this via setRequestId().
   *
   * Phase 2 L1 (audit/2026-05-08).
   */
  static initFromMeta(): void {
    if (typeof document === 'undefined') return;
    if (this.requestId) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="x-request-id"]');
    if (meta?.content) {
      this.requestId = meta.content;
    }
  }

  /** Override the current correlation ID (e.g. after a route transition). */
  static setRequestId(id: string | undefined): void {
    this.requestId = id;
  }

  /** Read the current correlation ID — primarily for outbound fetch headers. */
  static getRequestId(): string | undefined {
    return this.requestId;
  }

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
      context: sanitizeContext(context),
      error,
      source: this.getCallSource(),
      sessionId: this.sessionId,
      requestId: this.requestId,
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Storage logging
    if (this.config.enableStorage) {
      this.storageDestination.add(logEntry);
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
        body: JSON.stringify(entry),
        signal: AbortSignal.timeout(5000)
      }).catch(() => {
        // Silently fail to prevent logging loops
      });
    }, 0);
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
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get logs for debugging
   */
  static getLogs(level?: LogLevel): LogEntry[] {
    return this.storageDestination.getAll(level);
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    this.storageDestination.clear();
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
    (window as Window & { Logger?: typeof Logger }).Logger = Logger;
  }
}
