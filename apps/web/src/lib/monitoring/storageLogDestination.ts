/**
 * Storage Log Destination
 *
 * Batches log entries and periodically flushes them to localStorage.
 * Extracted from Logger for single-responsibility compliance.
 */

import type { LogEntry } from './Logger';

export class StorageLogDestination {
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingWrite = false;
  private readonly maxEntries: number;
  private static readonly FLUSH_INTERVAL_MS = 5000;

  constructor(maxEntries: number) {
    this.maxEntries = maxEntries;
  }

  /**
   * Add a log entry to the buffer. Schedules a batched localStorage
   * write if one is not already pending.
   */
  add(entry: LogEntry): void {
    try {
      this.buffer.push(entry);

      if (this.buffer.length > this.maxEntries) {
        this.buffer = this.buffer.slice(-this.maxEntries);
      }

      if (!this.pendingWrite) {
        this.pendingWrite = true;
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, StorageLogDestination.FLUSH_INTERVAL_MS);
      }
    } catch {
      // Silently fail to prevent logging loops
    }
  }

  /**
   * Flush buffered logs to localStorage.
   */
  flush(): void {
    this.pendingWrite = false;
    this.flushTimer = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('diboas_logs', safeStringify(this.buffer.slice(-100)));
      }
    } catch {
      // Silently fail to prevent logging loops
    }
  }

  /**
   * Get all buffered entries, optionally filtered by minimum level.
   */
  getAll(minLevel?: number): LogEntry[] {
    if (minLevel !== undefined) {
      return this.buffer.filter((entry) => entry.level >= minLevel);
    }
    return [...this.buffer];
  }

  /**
   * Clear buffer and cancel pending flush.
   */
  clear(): void {
    this.buffer = [];
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
      this.pendingWrite = false;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('diboas_logs');
    }
  }
}

/**
 * Circular-reference-safe JSON serialization.
 * Prevents cascading failures from non-serializable objects
 * (e.g. DOM elements, React events).
 */
function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  });
}
