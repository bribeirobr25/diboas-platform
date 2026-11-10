/**
 * Email unsubscribe route — HMAC-signed tokens (RFC 8058 one-click + page fetch).
 *
 * Pins the SECURE outcomes:
 *   - GET never changes a subscription (link prefetchers and scanners GET it);
 *     it only redirects, same-origin, to the branded page.
 *   - POST writes ONLY when the token is the HMAC of the id: a forged, swapped,
 *     truncated or missing token — or an unavailable HMAC key — writes nothing
 *     and logs no audit event.
 *   - The token comparison is constant-time.
 *   - Logs and audit carry a truncated hash, never the full id; a failure
 *     returns a generic 500 that never echoes the error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const applyRateLimit = vi.fn();
vi.mock('@/lib/api/routeHelpers', () => ({
  applyRateLimit: (...args: unknown[]) => applyRateLimit(...args),
}));

// Deterministic stand-in for the keyed HMAC (fake key; the real key never enters tests).
const fakeHmac = (value: string) =>
  createHmac('sha256', 'test-hmac-key').update(value).digest('hex');
const hmacHash = vi.fn();
vi.mock('@/lib/security/encryption', () => ({
  hmacHash: (...args: unknown[]) => hmacHash(...args),
}));

const logAuditEvent = vi.fn();
vi.mock('@/lib/audit/AuditService', () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));

const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

const timingSafeEqualSpy = vi.fn();
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    ...actual,
    timingSafeEqual: (a: NodeJS.ArrayBufferView, b: NodeJS.ArrayBufferView) => {
      timingSafeEqualSpy(a, b);
      return actual.timingSafeEqual(a, b);
    },
  };
});

import { GET, POST } from '../route';
import { Logger } from '@/lib/monitoring/Logger';

const BASE = 'https://diboas.com/api/email/unsubscribe';
const ID = 'a'.repeat(64); // shaped like an email hash
const OTHER_ID = 'b'.repeat(64);
const TOKEN = fakeHmac(ID);
const encodeT = (id: string, token: string) => Buffer.from(`${id}:${token}`).toString('base64url');

const getReq = (query: string, headers: Record<string, string> = {}) =>
  new NextRequest(`${BASE}${query}`, { headers });

const postReq = (query: string, body?: unknown, raw?: string) =>
  new NextRequest(`${BASE}${query}`, {
    method: 'POST',
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });

/** Values interpolated into the n-th sql`` call. */
const sqlValues = (call = 0) => mockSql.mock.calls[call].slice(1);

beforeEach(() => {
  applyRateLimit.mockReset().mockResolvedValue(null);
  hmacHash.mockReset().mockImplementation((v: string) => fakeHmac(v));
  logAuditEvent.mockReset();
  mockSql.mockReset().mockResolvedValue([]);
  timingSafeEqualSpy.mockReset();
});

describe('GET /api/email/unsubscribe — redirect only', () => {
  it('should return the rate-limit response and not redirect when the client is limited', async () => {
    const limited = NextResponse.json({ errorCode: 'RATE_LIMITED' }, { status: 429 });
    applyRateLimit.mockResolvedValue(limited);
    const res = await GET(getReq(`?t=${encodeT(ID, TOKEN)}`));
    expect(res).toBe(limited);
    expect(applyRateLimit).toHaveBeenCalledWith(expect.anything(), 'unsubscribe', 'standard');
  });

  it('should return 400 when the link carries no id and token', async () => {
    const res = await GET(getReq(''));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Invalid link' });
  });

  it('should return 400 when the t param does not decode to id:token', async () => {
    const res = await GET(getReq(`?t=${Buffer.from('no-separator').toString('base64url')}`));
    expect(res.status).toBe(400);
  });

  it('should redirect same-origin to the localized preferences page and write nothing when t is given', async () => {
    const t = encodeT(ID, TOKEN);
    const res = await GET(getReq(`?t=${t}`, { 'Accept-Language': 'de-DE,de;q=0.9' }));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location')!);
    expect(location.origin).toBe('https://diboas.com');
    expect(location.pathname).toBe('/de/email-preferences');
    expect(location.searchParams.get('t')).toBe(t);
    expect(mockSql).not.toHaveBeenCalled();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('should re-encode legacy id and token as t and default to en when no language is sent', async () => {
    const res = await GET(getReq(`?id=${ID}&token=${TOKEN}`));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/en/email-preferences');
    expect(location.searchParams.get('t')).toBe(encodeT(ID, TOKEN));
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('should keep the redirect on the site origin when the id is attacker-shaped', async () => {
    const res = await GET(getReq(`?id=${encodeURIComponent('//evil.example/x')}&token=t`));
    expect(new URL(res.headers.get('location')!).origin).toBe('https://diboas.com');
  });
});

describe('POST /api/email/unsubscribe — HMAC verification', () => {
  /** 5.847: `null` is valid JSON; it must read as an empty body (400), never a 500. */
  it.each([
    ['JSON null', 'null'],
    ['a JSON number', '42'],
    ['malformed JSON', '{not json'],
  ])(
    'should answer 400 and write nothing when the body is %s and the URL has no token',
    async (_l, raw) => {
      const res = await POST(postReq('', undefined, raw));
      expect(res.status).toBe(400);
      expect(mockSql).not.toHaveBeenCalled();
    }
  );

  it('should return the rate-limit response and write nothing when the client is limited', async () => {
    const limited = NextResponse.json({ errorCode: 'RATE_LIMITED' }, { status: 429 });
    applyRateLimit.mockResolvedValue(limited);
    const res = await POST(postReq(`?t=${encodeT(ID, TOKEN)}`));
    expect(res).toBe(limited);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('should unsubscribe when an RFC 8058 one-click POST carries a valid t in the URL', async () => {
    const res = await POST(
      postReq(`?t=${encodeT(ID, TOKEN)}`, undefined, 'List-Unsubscribe=One-Click')
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      message: 'You have been unsubscribed. Your waitlist position is preserved.',
    });
    expect(mockSql).toHaveBeenCalledTimes(1);
    const [optOut, , whereId] = sqlValues();
    expect(optOut).toBe(true);
    expect(whereId).toBe(ID);
    expect(logAuditEvent).toHaveBeenCalledWith({
      eventType: 'EMAIL_UNSUBSCRIBED',
      entityType: 'waitlist_entry',
      entityId: ID.substring(0, 16),
      details: { action: 'unsubscribe' },
    });
  });

  it('should never log or audit the full id when it processes a request', async () => {
    await POST(postReq(`?t=${encodeT(ID, TOKEN)}`));
    const logged = JSON.stringify([
      (Logger.info as ReturnType<typeof vi.fn>).mock.calls,
      logAuditEvent.mock.calls,
    ]);
    expect(logged).not.toContain(ID);
    expect(Logger.info).toHaveBeenCalledWith('Email email_unsubscribed', {
      emailHash: `${ID.substring(0, 8)}...`,
    });
  });

  it('should compare the token in constant time when the lengths match', async () => {
    await POST(postReq(`?t=${encodeT(ID, TOKEN)}`));
    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1);
    const [expected, given] = timingSafeEqualSpy.mock.calls[0];
    expect(Buffer.from(expected as Uint8Array).toString()).toBe(TOKEN);
    expect(Buffer.from(given as Uint8Array).toString()).toBe(TOKEN);
  });

  it.each([
    ['a forged token of the right length', encodeT(ID, 'f'.repeat(TOKEN.length))],
    ['a token minted for a different id', encodeT(ID, fakeHmac(OTHER_ID))],
    ['a valid token re-used for a different id', encodeT(OTHER_ID, TOKEN)],
    ['a truncated token', encodeT(ID, TOKEN.slice(0, -1))],
    ['a token with trailing bytes', encodeT(ID, `${TOKEN}0`)],
  ])('should return 400 and write nothing when the URL carries %s', async (_label, t) => {
    const res = await POST(postReq(`?t=${t}`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Invalid request' });
    expect(mockSql).not.toHaveBeenCalled();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('should fail closed and write nothing when the HMAC key is unavailable', async () => {
    hmacHash.mockReturnValue(null);
    for (const token of [TOKEN, 'null', '']) {
      const res = await POST(postReq('', { id: ID, token }));
      expect(res.status).toBe(400);
    }
    expect(mockSql).not.toHaveBeenCalled();
    expect(timingSafeEqualSpy).not.toHaveBeenCalled();
  });

  it('should return 400 and write nothing when no id and token are supplied anywhere', async () => {
    for (const body of [
      undefined,
      {},
      { id: ID },
      { token: TOKEN },
      { id: 1, token: TOKEN },
      { id: ID, token: 2 },
      { t: 42 },
    ]) {
      const res = await POST(postReq('', body));
      expect(res.status).toBe(400);
    }
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('should accept the legacy id and token from the URL when they verify', async () => {
    const res = await POST(postReq(`?id=${ID}&token=${TOKEN}`));
    expect(res.status).toBe(200);
    expect(sqlValues()[2]).toBe(ID);
  });

  it('should fall back to the legacy URL pair when the URL t does not decode', async () => {
    const badT = Buffer.from('no-separator').toString('base64url');
    const res = await POST(postReq(`?t=${badT}&id=${ID}&token=${TOKEN}`));
    expect(res.status).toBe(200);
  });

  it('should accept t from the JSON body when the page fetch sends it', async () => {
    const res = await POST(postReq('', { t: encodeT(ID, TOKEN) }));
    expect(res.status).toBe(200);
    expect(sqlValues()[2]).toBe(ID);
  });

  it('should fall back to the legacy body pair when the body t does not decode', async () => {
    const badT = Buffer.from('no-separator').toString('base64url');
    const res = await POST(postReq('', { t: badT, id: ID, token: TOKEN }));
    expect(res.status).toBe(200);
  });

  it('should still verify the body pair when the URL carries a legacy pair for another id', async () => {
    // URL params win over the body: a valid body cannot launder an unsigned URL id.
    const res = await POST(postReq(`?id=${OTHER_ID}&token=${TOKEN}`, { id: ID, token: TOKEN }));
    expect(res.status).toBe(400);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('should re-subscribe when the verified body asks for resubscribe', async () => {
    const res = await POST(postReq('', { id: ID, token: TOKEN, action: 'resubscribe' }));
    expect(res.status).toBe(200);
    expect((await res.json()).message).toBe('You have been re-subscribed to diBoaS emails.');
    expect(sqlValues()[0]).toBe(false);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'EMAIL_RESUBSCRIBED',
        details: { action: 'resubscribe' },
      })
    );
  });

  it('should default to opting out when the action is unknown', async () => {
    const res = await POST(postReq('', { id: ID, token: TOKEN, action: 'subscribe-everything' }));
    expect(res.status).toBe(200);
    expect(sqlValues()[0]).toBe(true);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'EMAIL_UNSUBSCRIBED' })
    );
  });

  it('should return a generic 500 without the error detail when the update throws', async () => {
    const err = new Error('relation "waitlist_entries" missing on db-host-1');
    mockSql.mockRejectedValue(err);
    const res = await POST(postReq(`?t=${encodeT(ID, TOKEN)}`));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'An error occurred' });
    expect(JSON.stringify(body)).not.toContain('db-host-1');
    expect(logAuditEvent).not.toHaveBeenCalled();
    expect(Logger.error).toHaveBeenCalledWith('Unsubscribe error', {}, err);
  });

  it('should wrap a non-Error failure before logging it', async () => {
    mockSql.mockRejectedValue('plain failure');
    const res = await POST(postReq(`?t=${encodeT(ID, TOKEN)}`));
    expect(res.status).toBe(500);
    const logged = (Logger.error as ReturnType<typeof vi.fn>).mock.calls[0][2];
    expect(logged).toBeInstanceOf(Error);
    expect(logged.message).toBe('plain failure');
  });
});
