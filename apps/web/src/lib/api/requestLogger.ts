/**
 * Request Logger
 *
 * Structured request-level logging for API routes.
 * Uses performance.now() for accurate timing measurements.
 *
 * Monitoring & Observability: Structured logging for all API requests
 * Security & Audit: Audit trail for sensitive operations
 */

import { Logger } from '@/lib/monitoring/Logger';

/** Log the start of a request. Returns a start timestamp for use with logRequestEnd. */
export function logRequestStart(method: string, path: string): number {
  const start = performance.now();
  Logger.info(`[API] ${method} ${path} started`, { method, path });
  return start;
}

/** Log the end of a request with status code and duration. */
export function logRequestEnd(
  method: string,
  path: string,
  status: number,
  startTime: number,
  /**
   * The refusal's fixed code (e.g. `INVALID_SOURCE`), so a 4xx names its reason
   * (`5.979`, plan P11 D6). A code only: never the request body or any value from it.
   */
  detail?: { readonly code: string }
): void {
  const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

  const message = `[API] ${method} ${path} → ${status} (${durationMs}ms)${
    detail ? ` ${detail.code}` : ''
  }`;
  const meta = { method, path, status, durationMs, ...(detail ? { code: detail.code } : {}) };

  if (level === 'error') {
    Logger.error(message, meta);
  } else if (level === 'warn') {
    Logger.warn(message, meta);
  } else {
    Logger.info(message, meta);
  }
}
