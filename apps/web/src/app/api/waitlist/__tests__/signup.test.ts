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
import { POST } from '../signup/route';
import * as store from '@/lib/waitingList/store';
import * as security from '@/lib/security';
import { DuplicateEntryError } from '@/lib/errors/domainErrors';
import { WAITLIST_SOURCES } from '@/lib/waitingList/store/types';
import { isValidSource } from '@/lib/api/validators';
import { buildModalSignupBody } from '@/lib/waitingList/modalSignupBody';

// Mock the store module
vi.mock('@/lib/waitingList/store', () => ({
  addEntry: vi.fn(),
  exists: vi.fn(),
  getByEmail: vi.fn(),
  getByReferralCode: vi.fn(),
  processReferral: vi.fn(),
  getFoundingMemberCount: vi.fn().mockResolvedValue({ count: 100, cap: 1200 }),
  checkEmailOptOut: vi.fn().mockResolvedValue(false),
}));

// Mock security barrel (rate limiter, CSRF, idempotency)
vi.mock('@/lib/security', () => ({
  checkRateLimit: vi.fn(),
  getClientIP: vi.fn(),
  createRateLimitHeaders: vi.fn(() => new Headers()),
  RateLimitPresets: {
    strict: { limit: 5, windowMs: 60000 },
    standard: { limit: 20, windowMs: 60000 },
  },
  csrfProtection: vi.fn(),
  getIdempotentResponse: vi.fn().mockResolvedValue(null),
  cacheIdempotentResponse: vi.fn().mockResolvedValue(undefined),
}));

// Mock sanitize utilities
vi.mock('@/lib/utils/sanitize', () => ({
  sanitizeText: vi.fn((text: string) => text),
  sanitizeUserName: vi.fn((name: string) => name),
}));

// Mock waitingList helpers
vi.mock('@/lib/waitingList/helpers', () => ({
  generateReferralCode: vi.fn().mockReturnValue('REFTEST01'),
  generateReferralUrl: vi.fn().mockReturnValue('https://diboas.com/ref/REFTEST01'),
  isValidEmail: vi.fn((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
  isValidReferralCode: vi.fn().mockReturnValue(true),
}));

// Mock unsubscribe URL builder
vi.mock('@/lib/email/unsubscribeUrl', () => ({
  buildUnsubscribeUrls: vi.fn().mockReturnValue({
    pageUrl: 'https://diboas.com/en/email-preferences?id=hash&token=tok',
    apiUrl: 'https://diboas.com/api/email/unsubscribe?id=hash&token=tok',
  }),
}));

// Mock encryption (hmacHash used for opt-out check)
vi.mock('@/lib/security/encryption', () => ({
  hmacHash: vi.fn().mockReturnValue('test-hash'),
  encrypt: vi.fn((v: string) => v),
  decrypt: vi.fn((v: string) => v),
}));

// Mock Logger
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(), critical: vi.fn() },
}));

// Mock email delivery logger
vi.mock('@/lib/email/deliveryLogger', () => ({
  logEmailDelivery: vi.fn(),
}));

// Mock @diboas/email (dynamic import in sendWelcomeEmail)
vi.mock('@diboas/email', () => ({
  createEmailService: vi.fn().mockReturnValue({
    sendWelcome: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
    sendReferralSuccess: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-2' }),
  }),
  sendViaResend: vi.fn(),
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
      Origin: 'http://localhost:3000',
    },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });

  return request;
}

describe('POST /api/waitlist/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: rate limit passes
    (security.checkRateLimit as Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 60,
    });

    // Default: CSRF passes
    (security.csrfProtection as Mock).mockReturnValue(null);

    // Default: no existing email
    (store.exists as Mock).mockResolvedValue(false);

    // Default: client IP
    (security.getClientIP as Mock).mockReturnValue('127.0.0.1');
  });

  /** 5.823 family: a bad body is a 400 (email required), never a 500. */
  it.each([
    ['JSON null', 'null'],
    ['malformed JSON', '{not json'],
  ])('should answer 400 EMAIL_REQUIRED when the body is %s', async (_label, raw) => {
    const response = await POST(
      new NextRequest('http://localhost:3000/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
        body: raw,
      })
    );
    expect(response.status).toBe(400);
    expect((await response.json()).errorCode).toBe('EMAIL_REQUIRED');
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

      (store.addEntry as Mock).mockResolvedValue(mockEntry);

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

      (store.getByReferralCode as Mock).mockResolvedValue(mockReferrer);
      (store.processReferral as Mock).mockResolvedValue({
        ...mockReferrer,
        referralCount: 1,
        position: 838,
      });
      (store.addEntry as Mock).mockResolvedValue({
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
      expect(store.processReferral).toHaveBeenCalledWith('referrer@example.com');
    });

    it('should return existing signup data without revealing it as duplicate', async () => {
      const existingEntry = {
        email: 'existing@example.com',
        position: 100,
        referralCode: 'REFEXIST1',
      };

      (store.exists as Mock).mockResolvedValue(true);
      (store.getByEmail as Mock).mockResolvedValue(existingEntry);

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
      (store.addEntry as Mock).mockResolvedValue({
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

  describe('Tags (ATTR-1, server half)', () => {
    const entry = {
      id: 'wl_1',
      email: 'tags@example.com',
      position: 1,
      originalPosition: 1,
      referralCode: 'REFTEST01',
      referralCount: 0,
      locale: 'en',
      source: 'direct',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should store only the sanitized tags: known keys, one known label, nothing over fifty chars', async () => {
      (store.addEntry as Mock).mockResolvedValue(entry);
      const response = await POST(
        createMockRequest({
          email: 'tags@example.com',
          gdprAccepted: true,
          tags: [
            'utm_source:ig',
            'cta_source:market',
            'cta_source:ana@example.com',
            'x:free text',
            `utm_campaign:${'x'.repeat(60)}`,
          ],
        })
      );
      expect(response.status).toBe(200);
      expect((store.addEntry as Mock).mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ tags: ['utm_source:ig', 'cta_source:market'] })
      );
    });

    it.each([
      ['null', null],
      ['a string', 'utm_source:ig'],
      ['eleven tags', Array.from({ length: 11 }, () => 'utm_source:a')],
    ])('should refuse the signup with INVALID_TAGS when tags are %s', async (_label, tags) => {
      const response = await POST(
        createMockRequest({ email: 'tags@example.com', gdprAccepted: true, tags })
      );
      expect(response.status).toBe(400);
      expect((await response.json()).errorCode).toBe('INVALID_TAGS');
      expect(store.addEntry).not.toHaveBeenCalled();
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

    /* twelfth audit: a non-string email reached `.toLowerCase()` (a 500). */
    it.each([
      ['a number', 123],
      ['an array', ['valid@example.com']],
    ])('should reject with INVALID_EMAIL when the email is %s', async (_l, email) => {
      const response = await POST(createMockRequest({ email, locale: 'en', gdprAccepted: true }));
      expect(response.status).toBe(400);
      expect((await response.json()).errorCode).toBe('INVALID_EMAIL');
    });

    /* twelfth audit: any truthy value counted as consent, including the string "false". */
    it.each([
      ['the string "false"', 'false'],
      ['the string "true"', 'true'],
      ['the number 1', 1],
    ])('should reject with CONSENT_REQUIRED when gdprAccepted is %s', async (_l, gdprAccepted) => {
      const response = await POST(
        createMockRequest({ email: 'valid@example.com', locale: 'en', gdprAccepted })
      );
      expect(response.status).toBe(400);
      expect((await response.json()).errorCode).toBe('CONSENT_REQUIRED');
      expect(store.addEntry).not.toHaveBeenCalled();
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
      (security.checkRateLimit as Mock).mockResolvedValue({
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
      expect(data.error).toContain('Too many requests');
    });

    it('should use correct rate limit preset for signup', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        locale: 'en',
        gdprAccepted: true,
      });

      (store.addEntry as Mock).mockResolvedValue({
        id: 'wl_test',
        email: 'test@example.com',
        position: 851,
        referralCode: 'REFTEST02',
      });

      await POST(request);

      // Should use strict rate limiting for signup
      expect(security.checkRateLimit).toHaveBeenCalledWith(
        expect.stringContaining('signup:'),
        expect.any(Number), // strict limit
        expect.any(Number) // strict window
      );
    });

    it('should include client IP in rate limit key', async () => {
      (security.getClientIP as Mock).mockReturnValue('192.168.1.100');

      (store.addEntry as Mock).mockResolvedValue({
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

      expect(security.checkRateLimit).toHaveBeenCalledWith(
        'signup:192.168.1.100',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle store errors gracefully', async () => {
      (store.addEntry as Mock).mockRejectedValue(new Error('Database connection failed'));

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
      (store.exists as Mock).mockResolvedValue(false);
      // But addEntry throws because another request added it
      (store.addEntry as Mock).mockRejectedValue(new DuplicateEntryError());

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
      const csrfErrorResponse = new Response(JSON.stringify({ error: 'CSRF validation failed' }), {
        status: 403,
      });
      (security.csrfProtection as Mock).mockReturnValue(csrfErrorResponse);

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

describe('Security Considerations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (security.checkRateLimit as Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 60,
    });

    (security.csrfProtection as Mock).mockReturnValue(null);
    (security.getClientIP as Mock).mockReturnValue('127.0.0.1');
  });

  it('should not expose internal error details', async () => {
    (store.exists as Mock).mockResolvedValue(false);
    (store.addEntry as Mock).mockRejectedValue(
      new Error('Internal database constraint violation XYZ-123')
    );

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
    (store.exists as Mock).mockResolvedValue(true);
    (store.getByEmail as Mock).mockResolvedValue({
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

/**
 * ⛑ `5.979` · WAITLIST-SOURCE-1 · the route accepts every listed source and refuses the rest
 * (plan P11, guards 2 and 5).
 *
 * Every signup through the website's modal was refused from 2026-03-20: the modal posted
 * `source: 'modal'`, which the route's hand-kept list did not hold, and the 400 left no log
 * line. The list is now one (`store/types.ts`), and these cases run the REAL validator and
 * the REAL request logger (only the store, security and Logger sinks are mocked above).
 */
describe('5.979 · WAITLIST-SOURCE-1 · signup sources at the route', () => {
  const mockEntry = (source: string) => ({
    id: 'wl_1',
    email: 'reader@example.com',
    position: 12,
    originalPosition: 12,
    referralCode: 'REFTEST01',
    referralCount: 0,
    locale: 'en',
    source,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (security.checkRateLimit as Mock).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Math.floor(Date.now() / 1000) + 60,
    });
    (security.csrfProtection as Mock).mockReturnValue(null);
    (store.exists as Mock).mockResolvedValue(false);
    (security.getClientIP as Mock).mockReturnValue('127.0.0.1');
  });

  it('should read the real list and the real validator (the guard is not vacuous)', () => {
    /* Imported from `store/types` directly: the `store` barrel is mocked in this file. */
    expect(WAITLIST_SOURCES.length).toBeGreaterThan(0);
    expect(WAITLIST_SOURCES).toContain('dream_mode');
    expect(vi.isMockFunction(isValidSource)).toBe(false);
  });

  it.each([...WAITLIST_SOURCES])(
    'should store the signup with its source when the source is %s',
    async (source) => {
      (store.addEntry as Mock).mockResolvedValue(mockEntry(source));
      const response = await POST(
        createMockRequest({
          email: 'reader@example.com',
          locale: 'en',
          gdprAccepted: true,
          source,
        })
      );
      expect(response.status).toBe(200);
      expect(store.addEntry).toHaveBeenCalledWith(expect.objectContaining({ source }));
    }
  );

  it.each(['dream_mode'] as const)(
    "should store the modal's own body, as it builds it, when its opener is %s",
    async (source) => {
      (store.addEntry as Mock).mockResolvedValue(mockEntry(source));
      const body = buildModalSignupBody(
        { email: '  Reader@Example.com ', name: '', gdprAccepted: true },
        'en',
        source
      );
      const response = await POST(createMockRequest(body as unknown as Record<string, unknown>));
      expect(response.status).toBe(200);
      expect(store.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ source, email: 'reader@example.com' })
      );
    }
  );

  /* P13 (D6): `interactive_demo` and `app_link` left the list with the demo and the app-link
     interceptor; an open tab still posting one is refused like any unknown source. */
  it.each(['popup', 'modal', 'interactive_demo', 'app_link'])(
    'should refuse the source %s with 400 INVALID_SOURCE and never reach the store',
    async (source) => {
      const response = await POST(
        createMockRequest({ email: 'reader@example.com', locale: 'en', gdprAccepted: true, source })
      );
      expect(response.status).toBe(400);
      expect((await response.json()).errorCode).toBe('INVALID_SOURCE');
      expect(store.addEntry).not.toHaveBeenCalled();
    }
  );

  /* Guard 5: every refusal names its code in one log line, and no log carries personal data. */
  const REFUSALS: [string, Record<string, unknown>][] = [
    ['EMAIL_REQUIRED', { locale: 'en', gdprAccepted: true }],
    ['INVALID_EMAIL', { email: 'not-an-email', locale: 'en', gdprAccepted: true }],
    ['CONSENT_REQUIRED', { email: 'ada.private@example.com', locale: 'en', gdprAccepted: false }],
    ['INVALID_LOCALE', { email: 'ada.private@example.com', locale: 'xx', gdprAccepted: true }],
    [
      'INVALID_SOURCE',
      { email: 'ada.private@example.com', locale: 'en', gdprAccepted: true, source: 'zzrefused' },
    ],
    [
      'INVALID_TAGS',
      { email: 'ada.private@example.com', locale: 'en', gdprAccepted: true, tags: 7 },
    ],
    [
      'INVALID_NAME',
      { email: 'ada.private@example.com', locale: 'en', gdprAccepted: true, name: 'n'.repeat(500) },
    ],
  ];

  it.each(REFUSALS)(
    'should log exactly one 400 naming %s when the route refuses the request',
    async (code, body) => {
      const { Logger } = await import('@/lib/monitoring/Logger');
      const response = await POST(createMockRequest({ name: 'Ada Lovelace', ...body }));
      expect(response.status).toBe(400);
      expect((await response.json()).errorCode).toBe(code);
      const refusals = (Logger.warn as Mock).mock.calls.filter(([message]) =>
        String(message).includes('→ 400')
      );
      expect(refusals).toHaveLength(1);
      expect(refusals[0]![1]).toMatchObject({ status: 400, code });
    }
  );

  it('should never put the email, the name or the refused value in any log call', async () => {
    const { Logger } = await import('@/lib/monitoring/Logger');
    /* The console too: a value written there reaches production logs as well. */
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {})
    );
    for (const [, body] of REFUSALS) {
      await POST(createMockRequest({ name: 'Ada Lovelace', ...body }));
    }
    const logged = JSON.stringify([
      ...(['info', 'warn', 'error', 'debug', 'critical'] as const).flatMap(
        (level) => (Logger[level] as Mock).mock.calls
      ),
      ...consoleSpies.flatMap((spy) => spy.mock.calls),
    ]);
    consoleSpies.forEach((spy) => spy.mockRestore());
    expect(logged.length).toBeGreaterThan(0);
    for (const secret of ['ada.private@example.com', 'Ada Lovelace', 'zzrefused']) {
      expect(logged, secret).not.toContain(secret);
    }
  });
});
