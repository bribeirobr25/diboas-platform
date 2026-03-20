/**
 * HTML Sanitizer Tests
 *
 * 100% coverage target for security utilities.
 * Tests DOMPurify-based sanitization with default and custom options.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DOMPurify since we are in a node environment
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((dirty: string, config: { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] }) => {
      // Simple mock: strip tags not in ALLOWED_TAGS
      let result = dirty;
      const allTags = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
      result = result.replace(allTags, (match, tag) => {
        if (config.ALLOWED_TAGS.includes(tag.toLowerCase())) {
          return match;
        }
        return '';
      });
      return result;
    }),
  },
}));

import { sanitizeHtml } from '../htmlSanitizer';
import DOMPurify from 'dompurify';

describe('htmlSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should call DOMPurify.sanitize with default allowed tags and attributes', () => {
      sanitizeHtml('<p>Hello</p>');

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<p>Hello</p>', {
        ALLOWED_TAGS: ['strong', 'em', 'br', 'p', 'a', 'ul', 'li', 'ol'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
    });

    it('should return the sanitized output from DOMPurify', () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert(1)</script>');

      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should accept custom allowedTags', () => {
      sanitizeHtml('<div>test</div>', { allowedTags: ['div', 'span'] });

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<div>test</div>', {
        ALLOWED_TAGS: ['div', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
    });

    it('should accept custom allowedAttr', () => {
      sanitizeHtml('<a class="link">test</a>', { allowedAttr: ['class'] });

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<a class="link">test</a>', {
        ALLOWED_TAGS: ['strong', 'em', 'br', 'p', 'a', 'ul', 'li', 'ol'],
        ALLOWED_ATTR: ['class'],
      });
    });

    it('should accept both custom allowedTags and allowedAttr', () => {
      sanitizeHtml('<div data-id="1">test</div>', {
        allowedTags: ['div'],
        allowedAttr: ['data-id'],
      });

      expect(DOMPurify.sanitize).toHaveBeenCalledWith('<div data-id="1">test</div>', {
        ALLOWED_TAGS: ['div'],
        ALLOWED_ATTR: ['data-id'],
      });
    });

    it('should handle empty string input', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const result = sanitizeHtml('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should strip script tags by default', () => {
      const result = sanitizeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('script');
    });

    it('should preserve allowed tags like strong and em', () => {
      const result = sanitizeHtml('<strong>bold</strong> <em>italic</em>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('should strip dangerous tags like iframe', () => {
      const result = sanitizeHtml('<iframe src="evil.com"></iframe>');
      expect(result).not.toContain('iframe');
    });
  });
});
