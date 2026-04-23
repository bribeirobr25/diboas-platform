/**
 * HTML Sanitizer
 *
 * Thin abstraction over DOMPurify for consistent HTML sanitization.
 * Centralizes configuration and allows swapping the underlying library
 * without modifying every consumer.
 *
 * Security: All user-generated or CMS-sourced HTML must be sanitized
 * before rendering with dangerouslySetInnerHTML.
 */

import DOMPurify from 'dompurify';

/**
 * Default allowed tags for rich text content (FAQ answers, blog posts, etc.)
 */
const DEFAULT_ALLOWED_TAGS = ['strong', 'em', 'br', 'p', 'a', 'ul', 'li', 'ol'] as const;

/**
 * Default allowed attributes
 */
const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel'] as const;

export interface SanitizeHtmlOptions {
  /** Override allowed HTML tags (defaults to rich-text safe set) */
  allowedTags?: string[];
  /** Override allowed HTML attributes (defaults to link-safe set) */
  allowedAttr?: string[];
}

/**
 * Sanitize an HTML string, stripping dangerous tags and attributes.
 *
 * @param dirty - The untrusted HTML string
 * @param options - Optional overrides for allowed tags/attributes
 * @returns A sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty: string, options?: SanitizeHtmlOptions): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags ?? [...DEFAULT_ALLOWED_TAGS],
    ALLOWED_ATTR: options?.allowedAttr ?? [...DEFAULT_ALLOWED_ATTR],
  });
}
