/**
 * Log Redactor
 *
 * P4 DRY: Delegates to shared redactContext utility.
 * Maintains backward-compatible export name for Logger consumers.
 */

import { redactContext } from '@/lib/utils/redactContext';

/**
 * Sanitize a context object by redacting sensitive keys and PII patterns.
 */
export function sanitizeContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  return redactContext(context);
}
