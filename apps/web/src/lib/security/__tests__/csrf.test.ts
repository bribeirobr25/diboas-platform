/**
 * CSRF Protection Tests
 *
 * Tests for origin/referer validation and CSRF middleware.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Logger
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    warn: vi.fn(),
  },
}));

// Mock getCsrfAllowedOrigins
vi.mock('@/config/env', () => ({
  getCsrfAllowedOrigins: vi.fn(() => [
    'http://localhost:3000',
    'https://diboas.com',
  ]),
}));

function createRequest(
  method: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/test'), {
    method,
    headers,
  });
}

describe('csrf', () => {
  let validateOrigin: typeof import('../csrf').validateOrigin;
  let csrfProtection: typeof import('../csrf').csrfProtection;
  let Logger: { warn: Mock };

  beforeEach(async () => {
    vi.resetModules();

    // Re-import to pick up fresh ALLOWED_ORIGINS from the mocked getCsrfAllowedOrigins
    const csrfModule = await import('../csrf');
    validateOrigin = csrfModule.validateOrigin;
    csrfProtection = csrfModule.csrfProtection;

    const loggerModule = await import('@/lib/monitoring/Logger');
    Logger = loggerModule.Logger as unknown as { warn: Mock };
    Logger.warn.mockClear();
  });

  describe('validateOrigin', () => {
    describe('safe HTTP methods', () => {
      it.each(['GET', 'HEAD', 'OPTIONS'])(
        'should allow %s requests without any origin',
        (method) => {
          const request = createRequest(method);
          const result = validateOrigin(request);

          expect(result).toEqual({ valid: true });
        }
      );

      it('should allow safe methods regardless of case', () => {
        const request = createRequest('get');
        const result = validateOrigin(request);

        expect(result).toEqual({ valid: true });
      });
    });

    describe('Origin header validation', () => {
      it('should allow POST with valid origin (localhost)', () => {
        const request = createRequest('POST', {
          Origin: 'http://localhost:3000',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({ valid: true });
      });

      it('should allow POST with valid origin (production)', () => {
        const request = createRequest('POST', {
          Origin: 'https://diboas.com',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({ valid: true });
      });

      it('should reject POST with invalid origin', () => {
        const request = createRequest('POST', {
          Origin: 'https://evil.com',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid origin: https://evil.com',
        });
      });

      it('should prevent subdomain spoofing (origin ending with allowed domain)', () => {
        const request = createRequest('POST', {
          Origin: 'https://diboas.com.evil.com',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid origin: https://diboas.com.evil.com',
        });
      });

      it('should prevent subdomain spoofing (subdomain of allowed domain)', () => {
        const request = createRequest('POST', {
          Origin: 'https://fake.diboas.com',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid origin: https://fake.diboas.com',
        });
      });

      it('should reject origin with different port', () => {
        const request = createRequest('POST', {
          Origin: 'http://localhost:4000',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid origin: http://localhost:4000',
        });
      });

      it('should reject origin with different protocol', () => {
        const request = createRequest('POST', {
          Origin: 'http://diboas.com',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid origin: http://diboas.com',
        });
      });
    });

    describe('Referer header fallback', () => {
      it('should use Referer as fallback when Origin is missing', () => {
        const request = createRequest('POST', {
          Referer: 'https://diboas.com/some/path?query=1',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({ valid: true });
      });

      it('should allow Referer from localhost', () => {
        const request = createRequest('POST', {
          Referer: 'http://localhost:3000/api/test',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({ valid: true });
      });

      it('should reject invalid Referer', () => {
        const request = createRequest('POST', {
          Referer: 'https://evil.com/attack',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid referer origin: https://evil.com',
        });
      });

      it('should reject malformed Referer', () => {
        const request = createRequest('POST', {
          Referer: 'not-a-valid-url',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid referer format',
        });
      });

      it('should prevent subdomain spoofing via Referer', () => {
        const request = createRequest('POST', {
          Referer: 'https://diboas.com.evil.com/page',
        });
        const result = validateOrigin(request);

        expect(result).toEqual({
          valid: false,
          error: 'Invalid referer origin: https://diboas.com.evil.com',
        });
      });

      it('should prefer Origin header over Referer', () => {
        const request = createRequest('POST', {
          Origin: 'https://evil.com',
          Referer: 'https://diboas.com/page',
        });
        const result = validateOrigin(request);

        // Origin is checked first and is invalid, so it should reject
        expect(result).toEqual({
          valid: false,
          error: 'Invalid origin: https://evil.com',
        });
      });
    });

    describe('missing origin and referer', () => {
      it('should allow requests without origin/referer in development', () => {
        vi.stubEnv('NODE_ENV', 'development');

        try {
          const request = createRequest('POST');
          const result = validateOrigin(request);

          expect(result).toEqual({ valid: true });
        } finally {
          vi.unstubAllEnvs();
        }
      });

      it('should reject requests without origin/referer in production', () => {
        vi.stubEnv('NODE_ENV', 'production');

        try {
          const request = createRequest('POST');
          const result = validateOrigin(request);

          expect(result).toEqual({
            valid: false,
            error: 'Missing origin and referer headers',
          });
        } finally {
          vi.unstubAllEnvs();
        }
      });
    });

    describe('mutation methods', () => {
      it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
        'should require origin validation for %s',
        (method) => {
          const request = createRequest(method, {
            Origin: 'https://evil.com',
          });
          const result = validateOrigin(request);

          expect(result.valid).toBe(false);
        }
      );
    });
  });

  describe('csrfProtection', () => {
    it('should return null for valid requests', () => {
      const request = createRequest('POST', {
        Origin: 'https://diboas.com',
      });
      const result = csrfProtection(request);

      expect(result).toBeNull();
    });

    it('should return null for safe method requests', () => {
      const request = createRequest('GET');
      const result = csrfProtection(request);

      expect(result).toBeNull();
    });

    it('should return 403 Response for invalid requests', async () => {
      const request = createRequest('POST', {
        Origin: 'https://evil.com',
      });
      const result = csrfProtection(request);

      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(403);
    });

    it('should return correct JSON body with errorCode', async () => {
      const request = createRequest('POST', {
        Origin: 'https://evil.com',
      });
      const result = csrfProtection(request);
      const body = await result!.json();

      expect(body).toEqual({
        success: false,
        error: 'Request blocked by CSRF protection',
        errorCode: 'CSRF_VALIDATION_FAILED',
      });
    });

    it('should set Content-Type to application/json on error response', () => {
      const request = createRequest('POST', {
        Origin: 'https://evil.com',
      });
      const result = csrfProtection(request);

      expect(result!.headers.get('Content-Type')).toBe('application/json');
    });

    it('should log a warning when validation fails', () => {
      const request = createRequest('POST', {
        Origin: 'https://evil.com',
      });
      csrfProtection(request);

      expect(Logger.warn).toHaveBeenCalledWith(
        '[CSRF] Validation failed:',
        expect.objectContaining({
          error: 'Invalid origin: https://evil.com',
          method: 'POST',
          url: expect.stringContaining('/api/test'),
        })
      );
    });

    it('should not log when validation succeeds', () => {
      const request = createRequest('POST', {
        Origin: 'https://diboas.com',
      });
      csrfProtection(request);

      expect(Logger.warn).not.toHaveBeenCalled();
    });
  });
});
