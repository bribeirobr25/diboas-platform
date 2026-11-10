/**
 * Consent cookie API — POST (set), GET (read), DELETE (withdraw).
 *
 * Pins the SECURE outcomes:
 *   - A cross-origin mutation is refused by CSRF (403) before anything else
 *     runs; a limited client gets the 429; neither sets or clears a cookie.
 *   - Only a strictly boolean `analytics` is stored, the stored record is
 *     built server-side (a body cannot inject a version or extra fields), and
 *     the authoritative cookie is HttpOnly + SameSite=Strict.
 *   - Failures return a generic 500 that never echoes the error.
 *
 * 5.823 (fixed): a cookie with malformed percent-encoding is skipped by
 * `cookies.ts#parseCookies`, so it can no longer make the route throw; the GET
 * catch path is exercised by an injected reader failure.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const applyRateLimit = vi.fn();
const emitErrorEvent = vi.fn();
vi.mock('@/lib/api/routeHelpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/routeHelpers')>();
  return {
    ...actual, // real applyCsrf
    applyRateLimit: (...args: unknown[]) => applyRateLimit(...args),
    emitErrorEvent: (...args: unknown[]) => emitErrorEvent(...args),
  };
});

const getConsentFromRequest = vi.fn();
vi.mock('@/lib/security/cookies', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security/cookies')>();
  return {
    ...actual,
    getConsentFromRequest: (...args: [Request]) => getConsentFromRequest(...args),
  };
});

const logAuditEvent = vi.fn();
vi.mock('@/lib/audit/AuditService', () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));

const emit = vi.fn();
vi.mock('@/lib/events/ApplicationEventBus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/events/ApplicationEventBus')>();
  return { ...actual, applicationEventBus: { emit: (...args: unknown[]) => emit(...args) } };
});

import { POST, GET, DELETE } from '../route';
import { CookieConfig } from '@/lib/security/cookies';
import { ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { Logger } from '@/lib/monitoring/Logger';

const URL_ = 'https://diboas.com/api/consent';
const SITE = { origin: 'https://diboas.com' };
const FOREIGN = { origin: 'https://evil.example' };
const COOKIE = CookieConfig.name;

const consentCookie = (analytics: boolean) =>
  `${COOKIE}=${encodeURIComponent(
    JSON.stringify({ analytics, version: CookieConfig.version, timestamp: 1 })
  )}`;

const post = (body: unknown, headers: Record<string, string> = SITE, raw?: string) =>
  new NextRequest(URL_, {
    method: 'POST',
    headers,
    body: raw ?? JSON.stringify(body),
  });
const get = (headers: Record<string, string> = {}) => new NextRequest(URL_, { headers });
const del = (headers: Record<string, string> = SITE) =>
  new NextRequest(URL_, { method: 'DELETE', headers });

const setCookies = (res: Response) => res.headers.getSetCookie();
const cookieNamed = (res: Response, name: string) =>
  setCookies(res).find((c) => c.startsWith(`${name}=`));

beforeEach(async () => {
  applyRateLimit.mockReset().mockResolvedValue(null);
  emitErrorEvent.mockReset();
  logAuditEvent.mockReset();
  emit.mockReset();
  const actual =
    await vi.importActual<typeof import('@/lib/security/cookies')>('@/lib/security/cookies');
  // Default: the real cookie reader; individual tests inject a failure.
  getConsentFromRequest.mockReset().mockImplementation(actual.getConsentFromRequest);
});

const rateLimited = () => NextResponse.json({ errorCode: 'RATE_LIMITED' }, { status: 429 });

describe('POST /api/consent', () => {
  it('should return 403 and set no cookie when the request comes from a foreign origin', async () => {
    const res = await POST(post({ analytics: true }, FOREIGN));
    expect(res.status).toBe(403);
    expect(setCookies(res)).toEqual([]);
    expect(applyRateLimit).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('should return the 429 and set no cookie when the client is rate limited', async () => {
    applyRateLimit.mockResolvedValue(rateLimited());
    const res = await POST(post({ analytics: true }));
    expect(res.status).toBe(429);
    expect(setCookies(res)).toEqual([]);
    expect(applyRateLimit).toHaveBeenCalledWith(expect.anything(), 'consent', 'standard');
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it.each([['true'], [1], [null], [undefined], [{}]])(
    'should return 400 and set no cookie when analytics is %j rather than a boolean',
    async (analytics) => {
      const res = await POST(post({ analytics }));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Invalid consent data. analytics must be boolean.',
      });
      expect(setCookies(res)).toEqual([]);
      expect(emit).not.toHaveBeenCalled();
      expect(logAuditEvent).not.toHaveBeenCalled();
    }
  );

  it('should set an HttpOnly SameSite=Strict consent cookie plus a readable shadow when consent is given', async () => {
    const res = await POST(
      post(
        { analytics: true },
        {
          ...SITE,
          'x-forwarded-for': ' 203.0.113.7 , 10.0.0.1',
          'user-agent': 'test-agent',
          'x-request-id': 'req-1',
        }
      )
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      consent: { analytics: true, version: CookieConfig.version },
    });

    const authoritative = cookieNamed(res, COOKIE)!;
    expect(authoritative).toMatch(/HttpOnly/i);
    expect(authoritative).toMatch(/SameSite=Strict/i);
    expect(authoritative).toMatch(/Path=\//);
    const shadow = cookieNamed(res, `${COOKIE}_js`)!;
    expect(shadow).not.toMatch(/HttpOnly/i);
    expect(shadow).toMatch(/SameSite=Strict/i);

    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.CONSENT_GIVEN,
      expect.objectContaining({
        consentType: 'analytics',
        previousState: undefined,
        newState: true,
        correlationId: 'req-1',
      })
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'consent.given',
        actorIp: '203.0.113.7',
        actorUserAgent: 'test-agent',
        correlationId: 'req-1',
      })
    );
  });

  it('should store only the server-built record when the body carries extra fields', async () => {
    const res = await POST(post({ analytics: true, version: '999', admin: true, timestamp: 0 }));
    const value = decodeURIComponent(cookieNamed(res, COOKIE)!.split(';')[0].split('=')[1]);
    const stored = JSON.parse(value);
    expect(Object.keys(stored).sort()).toEqual(['analytics', 'timestamp', 'version']);
    expect(stored.version).toBe(CookieConfig.version);
    expect(stored.timestamp).toBeGreaterThan(0);
    expect(stored).not.toHaveProperty('admin');
  });

  it('should record the withdrawal against the previous state when consent is revoked', async () => {
    const res = await POST(post({ analytics: false }, { ...SITE, cookie: consentCookie(true) }));
    expect(res.status).toBe(200);
    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.CONSENT_WITHDRAWN,
      expect.objectContaining({ previousState: true, newState: false, correlationId: undefined })
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'consent.withdrawn',
        actorIp: undefined,
        actorUserAgent: undefined,
        correlationId: undefined,
        details: { consentType: 'analytics', previousState: true, newState: false },
      })
    );
  });

  /** 5.846: unparseable JSON and a non-object body are bad requests (400), never a 500. */
  it.each([
    ['the body is not JSON', '{not json'],
    ['the body is JSON null', 'null'],
    ['the body is a JSON string', '"yes"'],
  ])('should answer 400, set no cookie and raise no error event when %s', async (_label, raw) => {
    const res = await POST(post(undefined, SITE, raw));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      success: false,
      error: 'Invalid consent data. analytics must be boolean.',
    });
    expect(setCookies(res)).toEqual([]);
    expect(logAuditEvent).not.toHaveBeenCalled();
    expect(emitErrorEvent).not.toHaveBeenCalled();
  });

  it('should return a generic 500 that never echoes the error when a step after validation fails', async () => {
    emit.mockImplementation(() => {
      throw new Error('event bus down');
    });
    const res = await POST(post({ analytics: true }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false, error: 'Failed to set consent' });
    expect(emitErrorEvent).toHaveBeenCalledWith(
      'consent',
      'consent_set',
      expect.any(Error),
      'medium'
    );
  });

  it('should log the stringified value when a non-Error is thrown while setting consent', async () => {
    getConsentFromRequest.mockImplementation(() => {
      throw 'reader failed';
    });
    const res = await POST(post({ analytics: true }));
    expect(res.ok).toBe(false);
    expect(setCookies(res)).toEqual([]);
    expect(Logger.error).toHaveBeenCalledWith('[Consent] Error setting consent:', {
      error: 'reader failed',
    });
  });
});

describe('GET /api/consent', () => {
  it('should return the 429 when the client is rate limited', async () => {
    applyRateLimit.mockResolvedValue(rateLimited());
    const res = await GET(get());
    expect(res.status).toBe(429);
    expect(applyRateLimit).toHaveBeenCalledWith(expect.anything(), 'consent-check', 'lenient');
  });

  it('should report no consent when no consent cookie is present', async () => {
    const cases: Record<string, string>[] = [{}, { cookie: 'other=1' }];
    for (const headers of cases) {
      const res = await GET(get(headers));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
    }
  });

  it('should return only analytics and version when a consent cookie is present', async () => {
    const res = await GET(get({ cookie: consentCookie(true) }));
    expect(await res.json()).toEqual({
      success: true,
      consent: { analytics: true, version: CookieConfig.version },
    });
  });

  it('should return a generic 500 without the error detail when the cookie reader fails', async () => {
    // Injected generic failure — not the 5.823 malformed-cookie path.
    getConsentFromRequest.mockImplementation(() => {
      throw new Error('internal reader detail');
    });
    const res = await GET(get());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'Failed to check consent' });
    expect(JSON.stringify(body)).not.toContain('internal reader detail');
    expect(emitErrorEvent).toHaveBeenCalledWith(
      'consent',
      'consent_check',
      expect.any(Error),
      'low'
    );
  });

  it('should log the stringified value when the cookie reader throws a non-Error', async () => {
    getConsentFromRequest.mockImplementation(() => {
      throw 42;
    });
    await GET(get());
    expect(Logger.error).toHaveBeenCalledWith('[Consent] Error checking consent:', { error: '42' });
  });
});

describe('DELETE /api/consent', () => {
  it('should return 403 and clear nothing when the request comes from a foreign origin', async () => {
    const res = await DELETE(del(FOREIGN));
    expect(res.status).toBe(403);
    expect(setCookies(res)).toEqual([]);
    expect(applyRateLimit).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('should return the 429 and clear nothing when the client is rate limited', async () => {
    applyRateLimit.mockResolvedValue(rateLimited());
    const res = await DELETE(del());
    expect(res.status).toBe(429);
    expect(setCookies(res)).toEqual([]);
    expect(applyRateLimit).toHaveBeenCalledWith(expect.anything(), 'consent-delete', 'standard');
  });

  it('should expire both consent cookies and record the withdrawal when consent is cleared', async () => {
    const res = await DELETE(
      del({ ...SITE, cookie: consentCookie(true), 'x-request-id': 'req-2' })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    for (const name of [COOKIE, `${COOKIE}_js`]) {
      const cleared = cookieNamed(res, name)!;
      expect(cleared).toBeDefined();
      expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
    }
    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.CONSENT_WITHDRAWN,
      expect.objectContaining({
        consentType: 'all',
        previousState: true,
        newState: false,
        correlationId: 'req-2',
      })
    );
  });

  it('should record an unknown previous state when no consent cookie was present', async () => {
    await DELETE(del());
    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.CONSENT_WITHDRAWN,
      expect.objectContaining({ previousState: undefined, correlationId: undefined })
    );
  });

  it('should return a generic 500 without the error detail when clearing fails', async () => {
    emit.mockImplementation(() => {
      throw new Error('bus detail');
    });
    const res = await DELETE(del());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'Failed to clear consent' });
    expect(JSON.stringify(body)).not.toContain('bus detail');
    expect(emitErrorEvent).toHaveBeenCalledWith(
      'consent',
      'consent_clear',
      expect.any(Error),
      'medium'
    );
  });

  it('should log the stringified value when clearing throws a non-Error', async () => {
    emit.mockImplementation(() => {
      throw 'bus down';
    });
    await DELETE(del());
    expect(Logger.error).toHaveBeenCalledWith('[Consent] Error clearing consent:', {
      error: 'bus down',
    });
  });
});
