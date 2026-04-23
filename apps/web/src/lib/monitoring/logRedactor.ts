/**
 * Log Redactor
 *
 * Sanitizes log context to remove PII and sensitive data.
 * Handles recursive sanitization with depth limits to prevent
 * stack overflow on deeply nested structures.
 * Extracted from Logger for single-responsibility compliance.
 */

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
// Note: Phone pattern removed — diBoaS does not collect phone numbers.
// Re-add if phone input fields are introduced in a future phase.
const SENSITIVE_KEYS = [
  'password', 'token', 'key', 'secret', 'auth',
  'credential', 'email', 'ssn', 'ip',
];
const MAX_SANITIZE_DEPTH = 5;

/**
 * Sanitize a context object by redacting sensitive keys and PII patterns.
 */
export function sanitizeContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  return sanitizeValue(context, 0) as Record<string, unknown>;
}

/**
 * Recursively sanitize a value, handling objects, arrays, and strings.
 * Depth-limited to prevent stack overflow on deeply nested or circular structures.
 */
function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_SANITIZE_DEPTH) return '[DEPTH_LIMIT]';

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeValue(
          (value as Record<string, unknown>)[key],
          depth + 1
        );
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Mask PII patterns in a string value: emails and IPv4 addresses.
 */
function sanitizeString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[EMAIL_REDACTED]')
    .replace(IPV4_PATTERN, '[IP_REDACTED]');
}
