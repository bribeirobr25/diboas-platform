/**
 * API route helpers — rate limiting, CSRF, email validation, error responses.
 *
 * Pins the SECURE outcomes: a limited client gets a 429 with Retry-After and
 * is keyed by IP + operation; a cross-origin mutation gets the CSRF 403; an
 * email never comes back with markup in it; a catch-all 500 never echoes the
 * underlying error to the client.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const checkRateLimit = vi.fn();
vi.mock('@/lib/security', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security')>();
  return {
    ...actual,
    checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
  };
});

const emit = vi.fn();
vi.mock('@/lib/events/ApplicationEventBus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/events/ApplicationEventBus')>();
  return { ...actual, applicationEventBus: { emit: (...args: unknown[]) => emit(...args) } };
});

import {
  getCorrelationId,
  applyRateLimit,
  applyCsrf,
  validateEmail,
  emitErrorEvent,
  errorResponse,
  successResponse,
  handleRouteError,
  readJsonObject,
} from '../routeHelpers';
import { RateLimitPresets } from '@/lib/security';
import { ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { Logger } from '@/lib/monitoring/Logger';

const req = (headers: Record<string, string> = {}, method = 'GET') =>
  new NextRequest('https://diboas.com/api/test', { method, headers });

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 5.823 family (5.846, 5.847): a bad body reads as `{}` so the route answers 400, never 500. */
describe('readJsonObject', () => {
  const req = (raw: string) =>
    new NextRequest('https://diboas.com/api/x', { method: 'POST', body: raw });

  it('should return the parsed object when the body is a JSON object', async () => {
    expect(await readJsonObject(req('{"email":"a@b.co","n":1}'))).toEqual({
      email: 'a@b.co',
      n: 1,
    });
  });

  it.each([
    ['JSON null', 'null'],
    ['a JSON number', '42'],
    ['a JSON string', '"yes"'],
    ['a JSON array', '[1,2]'],
    ['malformed JSON', '{not json'],
    ['an empty body', ''],
  ])('should read %s as an empty object instead of throwing', async (_label, raw) => {
    expect(await readJsonObject(req(raw))).toEqual({});
  });
});

describe('getCorrelationId', () => {
  it('should return the x-request-id header when the middleware set it', () => {
    expect(getCorrelationId(req({ 'x-request-id': 'req-123' }))).toBe('req-123');
  });

  it('should return a fresh UUID when the header is missing', () => {
    const id = getCorrelationId(req());
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(getCorrelationId(req())).not.toBe(id);
  });

  it('should fall back to a timestamp id when crypto is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(getCorrelationId(req())).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('should fall back to a timestamp id when crypto has no randomUUID', () => {
    vi.stubGlobal('crypto', {});
    expect(getCorrelationId(req())).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('applyRateLimit', () => {
  beforeEach(() => {
    checkRateLimit.mockReset();
  });

  it('should return a 429 with rate-limit headers when the limiter refuses the request', async () => {
    const reset = Math.floor(Date.now() / 1000) + 30;
    checkRateLimit.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset });

    const res = await applyRateLimit(
      req({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }),
      'signup',
      'strict'
    );

    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(await res!.json()).toEqual({
      success: false,
      error: 'Too many requests. Please try again later.',
      errorCode: 'RATE_LIMITED',
    });
    expect(res!.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(res!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res!.headers.get('X-RateLimit-Reset')).toBe(String(reset));
    expect(Number(res!.headers.get('Retry-After'))).toBeGreaterThan(0);
    // Keyed per operation AND per client IP (first hop of x-forwarded-for).
    expect(checkRateLimit).toHaveBeenCalledWith(
      'signup:203.0.113.7',
      RateLimitPresets.strict.limit,
      RateLimitPresets.strict.windowMs
    );
  });

  it('should return null when the limiter allows the request', async () => {
    checkRateLimit.mockResolvedValue({ success: true, limit: 10, remaining: 9, reset: 0 });
    expect(await applyRateLimit(req({ 'x-real-ip': '198.51.100.2' }), 'consent')).toBeNull();
    // Default preset is `standard`.
    expect(checkRateLimit).toHaveBeenCalledWith(
      'consent:198.51.100.2',
      RateLimitPresets.standard.limit,
      RateLimitPresets.standard.windowMs
    );
  });
});

describe('applyCsrf', () => {
  it('should return the CSRF 403 when a mutation comes from a foreign origin', async () => {
    const res = applyCsrf(req({ origin: 'https://evil.example' }, 'POST'));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(await res!.json()).toMatchObject({ errorCode: 'CSRF_VALIDATION_FAILED' });
  });

  it('should return null when a mutation comes from the site origin', () => {
    expect(applyCsrf(req({ origin: 'https://diboas.com' }, 'POST'))).toBeNull();
  });
});

describe('validateEmail', () => {
  it('should return the lower-cased trimmed email when it is valid', () => {
    expect(validateEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });

  it('should return null when the email is invalid', () => {
    expect(validateEmail('not-an-email')).toBeNull();
    expect(validateEmail('   ')).toBeNull();
  });

  it('should return the email entity-encoded, never as raw markup, when it carries HTML characters', () => {
    expect(validateEmail('<b>"x"@example.com')).toBe('&lt;b&gt;&quot;x&quot;@example.com');
  });
});

describe('emitErrorEvent', () => {
  beforeEach(() => {
    emit.mockReset();
  });

  it('should emit an APPLICATION_ERROR with defaults when only the error is given', () => {
    const err = new Error('boom');
    emitErrorEvent('signup', 'insert', err);
    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.APPLICATION_ERROR,
      expect.objectContaining({
        domain: 'application',
        source: 'signup',
        severity: 'high',
        error: err,
        context: { operation: 'insert' },
      })
    );
  });

  it('should wrap a non-Error value and honour severity and domain when they are given', () => {
    emitErrorEvent('consent', 'consent_check', 'plain string', 'low', 'consent');
    const payload = emit.mock.calls[0][1];
    expect(payload.error).toBeInstanceOf(Error);
    expect(payload.error.message).toBe('plain string');
    expect(payload).toMatchObject({ domain: 'consent', severity: 'low' });
  });
});

describe('errorResponse / successResponse', () => {
  it('should build a 500 without an errorCode key when only a message is given', async () => {
    const res = errorResponse('Nope');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ success: false, error: 'Nope' });
  });

  it('should include the errorCode and status when they are given', async () => {
    const res = errorResponse('Bad', 400, 'BAD_INPUT');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Bad', errorCode: 'BAD_INPUT' });
  });

  it('should build a success body with the given status when data is passed', async () => {
    const ok = successResponse({ position: 3 });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ success: true, position: 3 });
    expect((await successResponse({}, 201)).status).toBe(201);
  });
});

describe('handleRouteError', () => {
  beforeEach(() => {
    emit.mockReset();
  });

  it('should return a generic 500 that does not echo the error when a route throws an Error', async () => {
    const err = new Error('relation "waitlist_entries" does not exist at db-host-1');
    const res = handleRouteError(err, 'waitlist', 'signup', 'Signup failed');

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    });
    expect(JSON.stringify(body)).not.toContain('waitlist_entries');
    expect(Logger.error).toHaveBeenCalledWith('Signup failed', {}, err);
    expect(emit).toHaveBeenCalledWith(
      ApplicationEventType.APPLICATION_ERROR,
      expect.objectContaining({ source: 'waitlist', context: { operation: 'signup' } })
    );
  });

  it('should log without an Error object when the thrown value is not an Error', async () => {
    const res = handleRouteError({ secret: 'x' }, 'waitlist', 'signup', 'Signup failed');
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret');
    expect(Logger.error).toHaveBeenCalledWith('Signup failed', {}, undefined);
  });
});
