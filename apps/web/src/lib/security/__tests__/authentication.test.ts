/**
 * Tests for Zero-Trust Authentication Utilities
 *
 * @module authentication.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Logger before importing the module under test
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock next/server NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      async json() {
        return body;
      },
    })),
  },
}));

import {
  validateApiKey,
  requireAuth,
  createUnauthorizedResponse,
  createForbiddenResponse,
  generateDeletionToken,
  hashToken,
  verifyToken,
} from '../authentication';
import { Logger } from '@/lib/monitoring/Logger';

const TEST_API_KEY = 'test-secret-api-key-12345';

function createRequest(
  headers: Record<string, string> = {},
  url = 'http://localhost/api/test'
): Request {
  return new Request(url, { headers });
}

describe('authentication', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  // ─── validateApiKey ───────────────────────────────────────────────

  describe('validateApiKey', () => {
    it('should authenticate a valid API key', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest({ 'x-api-key': TEST_API_KEY });
      const result = validateApiKey(request);

      expect(result.authenticated).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject when no API key header is provided', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest();
      const result = validateApiKey(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('API key required');
    });

    it('should reject an invalid API key', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest({ 'x-api-key': 'wrong-key' });
      const result = validateApiKey(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });

    it('should allow requests in development when INTERNAL_API_KEY is not configured', () => {
      delete process.env.INTERNAL_API_KEY;
      vi.stubEnv('NODE_ENV', 'development');

      const request = createRequest();
      const result = validateApiKey(request);

      expect(result.authenticated).toBe(true);
      expect(result.isAdmin).toBe(true);
    });

    it('should reject in production when INTERNAL_API_KEY is not configured', () => {
      delete process.env.INTERNAL_API_KEY;
      vi.stubEnv('NODE_ENV', 'production');

      const request = createRequest({ 'x-api-key': 'some-key' });
      const result = validateApiKey(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Server configuration error');
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('INTERNAL_API_KEY not configured')
      );
    });

    it('should use timing-safe comparison — correct key passes, wrong key fails', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const validRequest = createRequest({ 'x-api-key': TEST_API_KEY });
      const invalidRequest = createRequest({
        'x-api-key': TEST_API_KEY.slice(0, -1) + 'X',
      });

      expect(validateApiKey(validRequest).authenticated).toBe(true);
      expect(validateApiKey(invalidRequest).authenticated).toBe(false);
    });

    it('should log authentication failures with request metadata', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent',
      });
      validateApiKey(request);

      expect(Logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Missing API key'),
        expect.objectContaining({
          ip: '192.168.1.1',
          path: '/api/test',
          userAgent: 'test-agent',
        })
      );
    });
  });

  // ─── requireAuth ──────────────────────────────────────────────────

  describe('requireAuth', () => {
    it('should return null when authenticated', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest({ 'x-api-key': TEST_API_KEY });
      const response = requireAuth(request);

      expect(response).toBeNull();
    });

    it('should return a 401 response when not authenticated', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest();
      const response = requireAuth(request);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(401);
    });

    it('should pass requireAdmin option through to validateApiKey', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      const request = createRequest({ 'x-api-key': TEST_API_KEY });
      const response = requireAuth(request, { requireAdmin: true });

      expect(response).toBeNull();
    });
  });

  // ─── createUnauthorizedResponse / createForbiddenResponse ─────────

  describe('createUnauthorizedResponse', () => {
    it('should return a response with status 401', () => {
      const response = createUnauthorizedResponse();

      expect(response.status).toBe(401);
    });

    it('should include the default error message in the body', async () => {
      const response = createUnauthorizedResponse();
      const body = await response.json();

      expect(body).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('should include a custom error message when provided', async () => {
      const response = createUnauthorizedResponse('Token expired');
      const body = await response.json();

      expect(body).toEqual({ success: false, error: 'Token expired' });
    });
  });

  describe('createForbiddenResponse', () => {
    it('should return a response with status 403', () => {
      const response = createForbiddenResponse();

      expect(response.status).toBe(403);
    });

    it('should include the default error message in the body', async () => {
      const response = createForbiddenResponse();
      const body = await response.json();

      expect(body).toEqual({ success: false, error: 'Forbidden' });
    });

    it('should include a custom error message when provided', async () => {
      const response = createForbiddenResponse('Insufficient permissions');
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
    });
  });

  // ─── Token operations ─────────────────────────────────────────────

  describe('generateDeletionToken', () => {
    it('should return a 64-character hex string', () => {
      const token = generateDeletionToken();

      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens on successive calls', () => {
      const token1 = generateDeletionToken();
      const token2 = generateDeletionToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should return a consistent SHA-256 hash for the same input', () => {
      const token = 'test-token-value';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return different hashes for different inputs', () => {
      const hash1 = hashToken('token-a');
      const hash2 = hashToken('token-b');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyToken', () => {
    it('should return true for a matching token and hash', () => {
      const token = generateDeletionToken();
      const hash = hashToken(token);

      expect(verifyToken(token, hash)).toBe(true);
    });

    it('should return false for a non-matching token and hash', () => {
      const token = generateDeletionToken();
      const hash = hashToken('completely-different-token');

      expect(verifyToken(token, hash)).toBe(false);
    });

    it('should return false when token is slightly modified', () => {
      const token = generateDeletionToken();
      const hash = hashToken(token);
      const modifiedToken = token.slice(0, -1) + '0';

      expect(verifyToken(modifiedToken, hash)).toBe(false);
    });

    it('should return false when timingSafeEqual throws due to different buffer lengths', () => {
      // verifyToken internally hashes both inputs to the same length,
      // so we test the underlying timingSafeEqual catch path via validateApiKey
      // with keys of different lengths, which produces buffers of different lengths
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      // A key of completely different length will cause bufA.length !== bufB.length
      // The implementation handles this by comparing bufA with bufA (constant time) and returning false
      const request = createRequest({ 'x-api-key': 'x' });
      const result = validateApiKey(request);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('timingSafeEqual catch block', () => {
    it('should return false when Buffer.from throws on invalid input', () => {
      process.env.INTERNAL_API_KEY = TEST_API_KEY;

      // Mock Buffer.from to throw, exercising the catch block at line 92-93
      const originalFrom = Buffer.from;
      vi.spyOn(Buffer, 'from').mockImplementation((...args: Parameters<typeof Buffer.from>) => {
        // Throw only for the timingSafeEqual usage (string arguments)
        if (typeof args[0] === 'string') {
          throw new Error('Buffer.from failed');
        }
        return originalFrom(...(args as [string]));
      });

      const request = createRequest({ 'x-api-key': TEST_API_KEY });
      const result = validateApiKey(request);

      // The catch block in timingSafeEqual returns false
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Invalid API key');

      vi.restoreAllMocks();
    });
  });
});
