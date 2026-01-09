/**
 * Waitlist Signup API Route Tests
 *
 * Critical path tests for:
 * - Happy path (successful signup)
 * - Validation errors
 * - Rate limiting responses
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../signup/route';
import * as store from '@/lib/waitingList/store';
import * as rateLimiter from '@/lib/security/rateLimiter';
import * as csrf from '@/lib/security/csrf';

// Mock the store module
vi.mock('@/lib/waitingList/store', () => ({
  addEntry: vi.fn(),
  exists: vi.fn(),
  getByEmail: vi.fn(),
  getByReferralCode: vi.fn(),
  processReferral: vi.fn(),
}));

// Mock rate limiter
vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: vi.fn(),
  getClientIP: vi.fn(),
  createRateLimitHeaders: vi.fn(() => new Headers()),
  RateLimitPresets: {
    strict: { limit: 5, windowMs: 60000 },
    standard: { limit: 20, windowMs: 60000 },
  },
}));

// Mock CSRF protection
vi.mock('@/lib/security/csrf', () => ({
  csrfProtection: vi.fn(),
}));

// Mock ApplicationEventBus
vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: {
    emit: vi.fn(),
  },
  ApplicationEventType: {
    WAITLIST_SIGNUP_COMPLETED: 'WAITLIST_SIGNUP_COMPLETED',
    WAITLIST_SIGNUP_FAILED: 'WAITLIST_SIGNUP_FAILED',
    APPLICATION_ERROR: 'APPLICATION_ERROR',
  },
}));

// Helper to create mock request
function createMockRequest(
  body: Record<string, unknown>,
  method: 'POST' | 'GET' = 'POST',
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost:3000/api/waitlist/signup');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

  return request;
}

describe('POST /api/waitlist/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: rate limit passes
    (rateLimiter.checkRateLimit as Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 60,
    });

    // Default: CSRF passes
    (csrf.csrfProtection as Mock).mockReturnValue(null);

    // Default: no existing email
    (store.exists as Mock).mockReturnValue(false);

    // Default: client IP
    (rateLimiter.getClientIP as Mock).mockReturnValue('127.0.0.1');
  });

  describe('Happy Path', () => {
    it('should successfully create a new signup', async () => {
      const mockEntry = {
        id: 'wl_123_456',
        email: 'new@example.com',
        position: 848,
        originalPosition: 848,
        referralCode: 'REFTEST01',
        referralCount: 0,
        locale: 'en',
        source: 'direct',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (store.addEntry as Mock).mockReturnValue(mockEntry);

      const request = createMockRequest({
        email: 'new@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.position).toBe(848);
      expect(data.referralCode).toBe('REFTEST01');
      expect(data.referralUrl).toBeDefined();
    });

    it('should process referral code if provided', async () => {
      const mockReferrer = {
        id: 'wl_referrer',
        email: 'referrer@example.com',
        referralCode: 'REFCODE01',
      };

      (store.getByReferralCode as Mock).mockReturnValue(mockReferrer);
      (store.processReferral as Mock).mockReturnValue({
        ...mockReferrer,
        referralCount: 1,
        position: 838,
      });
      (store.addEntry as Mock).mockReturnValue({
        id: 'wl_new_user',
        email: 'referred@example.com',
        position: 849,
        referralCode: 'REFNEW001',
        referredBy: 'REFCODE01',
        locale: 'en',
        source: 'referral',
      });

      const request = createMockRequest({
        email: 'referred@example.com',
        locale: 'en',
        gdprAccepted: true,
        referredBy: 'REFCODE01',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(store.processReferral).toHaveBeenCalledWith('referrer@example.com', expect.any(Number));
    });

    it('should return existing signup data without revealing it as duplicate', async () => {
      const existingEntry = {
        email: 'existing@example.com',
        position: 100,
        referralCode: 'REFEXIST1',
      };

      (store.exists as Mock).mockReturnValue(true);
      (store.getByEmail as Mock).mockReturnValue(existingEntry);

      const request = createMockRequest({
        email: 'existing@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      // Returns success to prevent email enumeration
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.position).toBe(100);
      expect(data.referralCode).toBe('REFEXIST1');

      // Should NOT call addEntry for existing user
      expect(store.addEntry).not.toHaveBeenCalled();
    });

    it('should sanitize and normalize email', async () => {
      (store.addEntry as Mock).mockReturnValue({
        id: 'wl_sanitized',
        email: 'sanitized@example.com',
        position: 850,
        referralCode: 'REFSANIT1',
      });

      const request = createMockRequest({
        email: '  SANITIZED@EXAMPLE.COM  ',
        locale: 'en',
        gdprAccepted: true,
      });

      await POST(request);

      expect(store.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'sanitized@example.com',
        })
      );
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing email', async () => {
      const request = createMockRequest({
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('EMAIL_REQUIRED');
    });

    it('should reject invalid email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@missing.com',
        'missing@',
        'spaces in@email.com',
        'double@@at.com',
      ];

      for (const email of invalidEmails) {
        const request = createMockRequest({
          email,
          locale: 'en',
          gdprAccepted: true,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.errorCode).toBe('INVALID_EMAIL');
      }
    });

    it('should reject missing GDPR consent', async () => {
      const request = createMockRequest({
        email: 'valid@example.com',
        locale: 'en',
        gdprAccepted: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errorCode).toBe('CONSENT_REQUIRED');
    });

    it('should reject when gdprAccepted is not provided', async () => {
      const request = createMockRequest({
        email: 'valid@example.com',
        locale: 'en',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.errorCode).toBe('CONSENT_REQUIRED');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limited', async () => {
      (rateLimiter.checkRateLimit as Mock).mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
      });

      const request = createMockRequest({
        email: 'ratelimited@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('RATE_LIMITED');
      expect(data.error).toContain('Too many signup attempts');
    });

    it('should use correct rate limit preset for signup', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      (store.addEntry as Mock).mockReturnValue({
        id: 'wl_test',
        email: 'test@example.com',
        position: 851,
        referralCode: 'REFTEST02',
      });

      await POST(request);

      // Should use strict rate limiting for signup
      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('signup:'),
        expect.any(Number), // strict limit
        expect.any(Number)  // strict window
      );
    });

    it('should include client IP in rate limit key', async () => {
      (rateLimiter.getClientIP as Mock).mockReturnValue('192.168.1.100');

      (store.addEntry as Mock).mockReturnValue({
        id: 'wl_ip_test',
        email: 'iptest@example.com',
        position: 852,
        referralCode: 'REFIPTEST',
      });

      const request = createMockRequest({
        email: 'iptest@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      await POST(request);

      expect(rateLimiter.checkRateLimit).toHaveBeenCalledWith(
        'signup:192.168.1.100',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      (store.addEntry as Mock).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = createMockRequest({
        email: 'error@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.errorCode).toBe('SERVER_ERROR');
    });

    it('should handle duplicate email race condition', async () => {
      // First check says email doesn't exist
      (store.exists as Mock).mockReturnValue(false);
      // But addEntry throws because another request added it
      (store.addEntry as Mock).mockImplementation(() => {
        throw new Error('Email already exists');
      });

      const request = createMockRequest({
        email: 'race@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);
      const data = await response.json();

      // Returns generic error to prevent enumeration
      expect(response.status).toBe(500);
      expect(data.errorCode).toBe('PROCESSING_ERROR');
    });
  });

  describe('CSRF Protection', () => {
    it('should reject requests failing CSRF check', async () => {
      const csrfErrorResponse = new Response(
        JSON.stringify({ error: 'CSRF validation failed' }),
        { status: 403 }
      );
      (csrf.csrfProtection as Mock).mockReturnValue(csrfErrorResponse);

      const request = createMockRequest({
        email: 'csrf@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });
});

describe('GET /api/waitlist/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (rateLimiter.checkRateLimit as Mock).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Math.floor(Date.now() / 1000) + 60,
    });

    (rateLimiter.getClientIP as Mock).mockReturnValue('127.0.0.1');
  });

  it('should return generic response regardless of email existence', async () => {
    const request = createMockRequest({}, 'GET', { email: 'check@example.com' });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Check complete');
    // Should NOT reveal if email exists
    expect(data).not.toHaveProperty('position');
    expect(data).not.toHaveProperty('referralCode');
  });

  it('should reject missing email parameter', async () => {
    const request = createMockRequest({}, 'GET', {});

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Email parameter required');
  });

  it('should reject invalid email format', async () => {
    const request = createMockRequest({}, 'GET', { email: 'invalid' });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid email');
  });

  it('should rate limit check requests', async () => {
    (rateLimiter.checkRateLimit as Mock).mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
    });

    const request = createMockRequest({}, 'GET', { email: 'limited@example.com' });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Too many requests');
  });
});

describe('Security Considerations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (rateLimiter.checkRateLimit as Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 60,
    });

    (csrf.csrfProtection as Mock).mockReturnValue(null);
    (rateLimiter.getClientIP as Mock).mockReturnValue('127.0.0.1');
  });

  it('should not expose internal error details', async () => {
    (store.exists as Mock).mockReturnValue(false);
    (store.addEntry as Mock).mockImplementation(() => {
      throw new Error('Internal database constraint violation XYZ-123');
    });

    const request = createMockRequest({
      email: 'error@example.com',
      locale: 'en',
      gdprAccepted: true,
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return generic error message
    expect(data.error).not.toContain('XYZ-123');
    expect(data.error).not.toContain('constraint');
    expect(data.error).toBe('Internal server error');
  });

  it('should prevent email enumeration on existing emails', async () => {
    (store.exists as Mock).mockReturnValue(true);
    (store.getByEmail as Mock).mockReturnValue({
      email: 'existing@example.com',
      position: 100,
      referralCode: 'REFEXIST2',
    });

    const request = createMockRequest({
      email: 'existing@example.com',
      locale: 'en',
      gdprAccepted: true,
    });

    const response = await POST(request);
    const data = await response.json();

    // Returns success (same as new signup) to prevent enumeration
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
