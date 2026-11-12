/**
 * Generic Context Redaction Utility
 *
 * P4 DRY: Single implementation for PII redaction across error reporting and logging.
 * P8 Security: Prevents PII leakage in logs, error reports, and Sentry events.
 *
 * Handles recursive objects, arrays, and depth limits to prevent
 * stack overflow on deeply nested or circular structures.
 */
import { scrubUrlsInText } from './scrubUrl';

/**
 * An email address, Unicode letters included (`jöhn@exämple.de`; fourteenth audit: the ASCII-only
 * pattern let internationalised addresses through).
 */
const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
/** An IPv4-mapped IPv6 address (`::ffff:203.0.113.9`), redacted as one address. */
const IPV4_MAPPED_PATTERN = /(?<![\w:])::ffff:(?:\d{1,3}\.){3}\d{1,3}\b/gi;
/**
 * An IPv6 address: the full eight groups, or a compressed form with `::`. Clock times
 * (`01:35:38`) have neither, so they are left alone; `Foo::bar` is excluded by the guards.
 */
const IPV6_PATTERN =
  /(?<![\w:])(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{0,4}::(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{0,4})(?![\w:])/gi;
/**
 * A token written as a key/value pair outside a URL: `"token":"…"`, `t=…`, any key ending in
 * `token` (`deletionToken`, `unsubscribe_token`), and the URL-encoded `token%3D…` of a relative
 * link (fifteenth audit: those three forms passed). The value stops at an encoded `&` (`%26`).
 */
const TOKEN_PAIR = /(["']?)\b(\w*token|t)\1(\s*(?:[:=]|%3D)\s*)(["']?)(?:(?!%26)[^\s"'&,}])+\4/gi;
/** A credential in an `Authorization` header value (`Bearer …`, `Basic …`). */
const AUTH_SCHEME = /\b(Bearer|Basic)\s+[\w.~+/=-]+/gi;

/** Keys that are sensitive wherever they appear inside a key name (`userEmail`, `clientSecret`). */
const SENSITIVE_SUBSTRINGS = [
  'password',
  'token',
  'secret',
  'auth',
  'credential',
  'email',
  'ssn',
  'phone',
  'username',
];
/**
 * Short words that are sensitive only as a whole word of the key (`ip_address`, `API_KEY`,
 * `displayName`), so `description`, `monkey` or `hostname` are not (fourteenth audit: substring
 * matching redacted `cpu_description` and every `*name` diagnostic).
 */
const SENSITIVE_WORDS = ['ip', 'key', 'name', 'address'];
/**
 * Keys that name the software, not a person, although a word of them is sensitive: the
 * tracer's span name is a route template (`GET /api/waitlist`). Their values are still scrubbed
 * as text (fifteenth audit: `next.span_name` arrived as `[REDACTED]`).
 */
const DIAGNOSTIC_KEYS = ['next.span_name'];

/** The words of a key: split at separators, camelCase and acronym boundaries (`IPAddress`). */
function keyWords(key: string): string[] {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, (_m, upper: string, next: string) => `${upper} ${next}`)
    .replace(/([a-z0-9])([A-Z])/g, (_m, lower: string, upper: string) => `${lower} ${upper}`)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Whether a key names a field whose whole value must be redacted. */
export function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (DIAGNOSTIC_KEYS.includes(lower)) return false;
  if (SENSITIVE_SUBSTRINGS.some((s) => lower.includes(s))) return true;
  return keyWords(key).some((word) => SENSITIVE_WORDS.includes(word));
}

const MAX_DEPTH = 5;

/**
 * Free text (an error message, a log line, breadcrumb text) with every embedded URL scrubbed to
 * its allowlisted query, every email and IP address redacted, and every bare token pair masked.
 */
export function redactText(value: string): string {
  return (
    scrubUrlsInText(value)
      .replace(EMAIL_PATTERN, '[EMAIL_REDACTED]')
      // The mapped form, then IPv4, then IPv6: the IPv6 pattern alone took only `::ffff:203`
      // of `::ffff:203.0.113.9` and left three octets (fifteenth audit).
      .replace(IPV4_MAPPED_PATTERN, '[IP_REDACTED]')
      .replace(IPV4_PATTERN, '[IP_REDACTED]')
      .replace(IPV6_PATTERN, '[IP_REDACTED]')
      .replace(AUTH_SCHEME, (_m, scheme: string) => `${scheme} [REDACTED]`)
      .replace(
        TOKEN_PAIR,
        (_m, keyQuote: string, key: string, separator: string, valueQuote: string) =>
          `${keyQuote}${key}${keyQuote}${separator}${valueQuote}[REDACTED]${valueQuote}`
      )
  );
}

function redactValue(value: unknown, depth: number): unknown {
  if (depth > MAX_DEPTH) return '[DEPTH_LIMIT]';

  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1));

  if (typeof value === 'object' && value !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
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
