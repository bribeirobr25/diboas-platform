/**
 * Text Sanitization Utilities
 *
 * Domain-Driven Design: Centralized sanitization for security
 * Security & Audit Standards: XSS prevention through HTML entity encoding
 * Code Reusability & DRY Principles: Single source of truth for sanitization
 * Service Agnostic Abstraction: Pure functions without external dependencies
 * Error Handling & System Recovery: Safe handling of invalid inputs
 */

/**
 * HTML entity mapping for XSS prevention
 * Maps potentially dangerous characters to their safe HTML entity equivalents
 */
const HTML_ENTITY_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '&': '&amp;',
} as const;

/**
 * Regex pattern matching all characters that need escaping
 */
const ESCAPE_PATTERN = /[<>'"&]/g;

/**
 * Sanitize text content to prevent XSS attacks
 *
 * Escapes HTML special characters to their entity equivalents:
 * - < becomes &lt;
 * - > becomes &gt;
 * - " becomes &quot;
 * - ' becomes &#x27;
 * - & becomes &amp;
 *
 * @param text - The text to sanitize
 * @returns Sanitized text safe for HTML rendering, or empty string for invalid input
 *
 * @example
 * sanitizeText('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 *
 * @example
 * sanitizeText("Hello & welcome")
 * // Returns: 'Hello &amp; welcome'
 */
export function sanitizeText(text: string): string {
  // Type guard: Return empty string for non-string inputs
  if (typeof text !== 'string') {
    return '';
  }

  // Return empty string for falsy values (null, undefined handled by type guard)
  if (!text) {
    return '';
  }

  // Replace dangerous characters with HTML entities
  return text.replace(ESCAPE_PATTERN, (char) => HTML_ENTITY_MAP[char] || char);
}

/**
 * Sanitize email address
 *
 * Normalizes and sanitizes email for safe storage and comparison:
 * - Converts to lowercase
 * - Trims whitespace
 * - Escapes HTML entities
 *
 * @param email - The email address to sanitize
 * @returns Sanitized email address
 *
 * @example
 * sanitizeEmail('  User@Example.COM  ')
 * // Returns: 'user@example.com'
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  return sanitizeText(email.toLowerCase().trim());
}

/**
 * Sanitize user name or display text
 *
 * Sanitizes user-provided names while preserving formatting:
 * - Trims whitespace
 * - Escapes HTML entities
 *
 * @param name - The name to sanitize
 * @returns Sanitized name
 *
 * @example
 * sanitizeUserName('  John <script>Doe  ')
 * // Returns: 'John &lt;script&gt;Doe'
 */
export function sanitizeUserName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }

  return sanitizeText(name.trim());
}
