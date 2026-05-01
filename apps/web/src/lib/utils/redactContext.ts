/**
 * Generic Context Redaction Utility
 *
 * P4 DRY: Single implementation for PII redaction across error reporting and logging.
 * P8 Security: Prevents PII leakage in logs, error reports, and Sentry events.
 *
 * Handles recursive objects, arrays, and depth limits to prevent
 * stack overflow on deeply nested or circular structures.
 */

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

const SENSITIVE_KEYS = [
  'password', 'token', 'key', 'secret', 'auth',
  'credential', 'email', 'ssn', 'ip', 'ip_address',
  'phone', 'address', 'name', 'username',
];

const MAX_DEPTH = 5;

function redactString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[EMAIL_REDACTED]')
    .replace(IPV4_PATTERN, '[IP_REDACTED]');
}

function redactValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return '[DEPTH_LIMIT]';

  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(item => redactValue(item, depth + 1));

  if (typeof value === 'object' && value !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactValue(val, depth + 1);
      }
    }
    return redacted;
  }

  return value;
}

export function redactContext<T extends Record<string, unknown>>(context?: T): T | undefined {
  if (!context) return undefined;
  return redactValue(context, 0) as T;
}
