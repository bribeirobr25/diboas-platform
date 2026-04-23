/**
 * Email Template Utilities
 *
 * Defense-in-depth helpers for safe HTML rendering in email templates.
 */

/**
 * HTML entity encoding for email template interpolation.
 * Escapes user-provided values before embedding in HTML strings.
 *
 * Input is already sanitized at the API layer (sanitizeUserName, validateEmail),
 * so this is a defense-in-depth measure — not the primary XSS barrier.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
