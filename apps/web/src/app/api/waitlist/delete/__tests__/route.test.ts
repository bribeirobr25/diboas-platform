/**
 * Waitlist deletion routes — a bad body is a 400, never a 500 (5.823 family; twelfth audit).
 *
 * Both handlers read their body through `readJsonObject`. Until this file, no test reached
 * either one, so reverting them to a raw `request.json()` passed every suite. The service is
 * mocked: these tests pin the HTTP layer only.
 *
 * 5.866 (twelfth audit): the route is the GDPR erasure door, so it is held at 100% by COV-1;
 * the second half of this file pins every answer it can give.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/lib/api/routeHelpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/routeHelpers')>();
  return {
    ...actual, // the real readJsonObject
    applyCsrf: vi.fn().mockReturnValue(null),
    applyRateLimit: vi.fn().mockResolvedValue(null),
    emitErrorEvent: vi.fn(),
  };
});

const requestDeletion = vi.fn();
const confirmDeletion = vi.fn();
vi.mock('@/lib/waitingList/WaitlistApplicationService', () => ({
  waitlistApplicationService: {
    requestDeletion: (...args: unknown[]) => requestDeletion(...args),
    confirmDeletion: (...args: unknown[]) => confirmDeletion(...args),
  },
}));

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { POST, DELETE } from '../route';
import * as routeHelpers from '@/lib/api/routeHelpers';

const call = (method: 'POST' | 'DELETE', body: string) =>
  new Request('https://diboas.com/api/waitlist/delete', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body,
  });

const BAD_BODIES = [
  ['JSON null', 'null'],
  ['malformed JSON', '{not json'],
  ['an array', '["a@example.com"]'],
] as const;

describe('POST /api/waitlist/delete — request body', () => {
  beforeEach(() => requestDeletion.mockReset());

  it.each(BAD_BODIES)(
    'should answer 400 and never reach the service when the body is %s',
    async (_l, raw) => {
      const res = await POST(call('POST', raw));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ success: false, error: 'Email is required' });
      expect(requestDeletion).not.toHaveBeenCalled();
    }
  );

  it('should answer 400 when the email is not a string', async () => {
    const res = await POST(call('POST', '{"email":123}'));
    expect(res.status).toBe(400);
    expect(requestDeletion).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/waitlist/delete — request body', () => {
  beforeEach(() => confirmDeletion.mockReset());

  it.each(BAD_BODIES)(
    'should answer 400 and never reach the service when the body is %s',
    async (_l, raw) => {
      const res = await DELETE(call('DELETE', raw));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ success: false, error: 'Deletion token is required' });
      expect(confirmDeletion).not.toHaveBeenCalled();
    }
  );

  it('should answer 400 when the token is not a string', async () => {
    const res = await DELETE(call('DELETE', '{"token":["t"]}'));
    expect(res.status).toBe(400);
    expect(confirmDeletion).not.toHaveBeenCalled();
  });
});

const json = (method: 'POST' | 'DELETE', body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://diboas.com/api/waitlist/delete', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

describe('/api/waitlist/delete — every answer (5.866)', () => {
  beforeEach(() => {
    requestDeletion.mockReset();
    confirmDeletion.mockReset();
    (routeHelpers.applyCsrf as Mock).mockReturnValue(null);
    (routeHelpers.applyRateLimit as Mock).mockResolvedValue(null);
    (routeHelpers.emitErrorEvent as Mock).mockClear();
  });

  it.each(['POST', 'DELETE'] as const)(
    'should answer the CSRF refusal, never reaching the service, on %s',
    async (method) => {
      (routeHelpers.applyCsrf as Mock).mockReturnValue(new Response(null, { status: 403 }));
      const res = await (method === 'POST' ? POST : DELETE)(json(method, {}));
      expect(res.status).toBe(403);
      expect(requestDeletion).not.toHaveBeenCalled();
      expect(confirmDeletion).not.toHaveBeenCalled();
    }
  );

  it.each(['POST', 'DELETE'] as const)(
    'should answer the rate-limit refusal, never reaching the service, on %s',
    async (method) => {
      (routeHelpers.applyRateLimit as Mock).mockResolvedValue(new Response(null, { status: 429 }));
      const res = await (method === 'POST' ? POST : DELETE)(json(method, {}));
      expect(res.status).toBe(429);
      expect(requestDeletion).not.toHaveBeenCalled();
      expect(confirmDeletion).not.toHaveBeenCalled();
    }
  );

  it('should refuse a malformed email with 400', async () => {
    const res = await POST(json('POST', { email: 'not-an-email' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Invalid email format' });
    expect(requestDeletion).not.toHaveBeenCalled();
  });

  it.each([
    ['an existing entry', true],
    ['no entry', false],
  ])(
    'should answer the same 202 for %s, passing the normalised email and audit context',
    async (_l, entryExists) => {
      requestDeletion.mockResolvedValue({ ok: true, entryExists });
      const res = await POST(
        json(
          'POST',
          { email: '  Ana@Example.COM ' },
          {
            'x-request-id': 'req-9',
            'x-forwarded-for': '203.0.113.7, 10.0.0.1',
            'user-agent': 'UA',
          }
        )
      );
      expect(res.status).toBe(202);
      expect((await res.json()).success).toBe(true);
      expect(requestDeletion).toHaveBeenCalledWith({
        email: 'ana@example.com',
        correlationId: 'req-9',
        actorIp: '203.0.113.7',
        actorUserAgent: 'UA',
      });
    }
  );

  it('should leave the audit context empty when no headers arrive', async () => {
    requestDeletion.mockResolvedValue({ ok: true, entryExists: true });
    await POST(json('POST', { email: 'ana@example.com' }));
    expect(requestDeletion).toHaveBeenCalledWith({
      email: 'ana@example.com',
      correlationId: undefined,
      actorIp: undefined,
      actorUserAgent: undefined,
    });
  });

  it('should answer 500 and report the cause when the service fails a request', async () => {
    const cause = new Error('db down');
    requestDeletion.mockResolvedValue({ ok: false, code: 'SERVER_ERROR', cause });
    const res = await POST(json('POST', { email: 'ana@example.com' }));
    expect(res.status).toBe(500);
    expect(routeHelpers.emitErrorEvent).toHaveBeenCalledWith('waitlist', 'deletion_request', cause);
  });

  it.each([
    ['an Error', new Error('boom')],
    ['a non-Error', 'boom'],
  ])('should answer 500 when the request service throws %s', async (_l, thrown) => {
    requestDeletion.mockRejectedValue(thrown);
    const res = await POST(json('POST', { email: 'ana@example.com' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      success: false,
      error: 'Failed to process deletion request',
    });
  });

  it.each([
    [true, 'Your data has been permanently deleted from our system.'],
    [false, 'No data found to delete.'],
  ])('should answer 200 when the token is valid (deleted: %s)', async (deleted, message) => {
    confirmDeletion.mockResolvedValue({ ok: true, deleted });
    const res = await DELETE(json('DELETE', { token: 'tok' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message });
    expect(confirmDeletion).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok' }));
  });

  it('should answer 400 for an invalid or expired token', async () => {
    confirmDeletion.mockResolvedValue({ ok: false, code: 'INVALID_TOKEN' });
    const res = await DELETE(json('DELETE', { token: 'old' }));
    expect(res.status).toBe(400);
    expect(routeHelpers.emitErrorEvent).not.toHaveBeenCalled();
  });

  it('should answer 500 and report the cause when the service fails a confirmation', async () => {
    const cause = new Error('db down');
    confirmDeletion.mockResolvedValue({ ok: false, code: 'SERVER_ERROR', cause });
    const res = await DELETE(json('DELETE', { token: 'tok' }));
    expect(res.status).toBe(500);
    expect(routeHelpers.emitErrorEvent).toHaveBeenCalledWith(
      'waitlist',
      'deletion_confirmation',
      cause
    );
  });

  it.each([
    ['an Error', new Error('boom')],
    ['a non-Error', 'boom'],
  ])('should answer 500 when the confirmation service throws %s', async (_l, thrown) => {
    confirmDeletion.mockRejectedValue(thrown);
    const res = await DELETE(json('DELETE', { token: 'tok' }));
    expect(res.status).toBe(500);
  });
});

/**
 * Thirteenth audit (agent C): removing the anti-enumeration delay, moving it, or answering an
 * existing email with a different message passed every test above. These pin the RULE.
 */
describe('/api/waitlist/delete — anti-enumeration and limits (5.866)', () => {
  beforeEach(() => {
    requestDeletion.mockReset();
    confirmDeletion.mockReset();
    (routeHelpers.applyCsrf as Mock).mockReturnValue(null);
    (routeHelpers.applyRateLimit as Mock).mockReset().mockResolvedValue(null);
  });

  it('should answer an existing and an unknown email with the byte-identical body', async () => {
    requestDeletion.mockResolvedValueOnce({ ok: true, entryExists: true });
    const known = await (await POST(json('POST', { email: 'ana@example.com' }))).text();
    requestDeletion.mockResolvedValueOnce({ ok: true, entryExists: false });
    const unknown = await (await POST(json('POST', { email: 'bob@example.com' }))).text();
    expect(unknown).toBe(known);
  });

  it('should hold an unknown email for at least 100 ms and never delay an existing one', async () => {
    vi.useFakeTimers();
    try {
      requestDeletion.mockResolvedValue({ ok: true, entryExists: false });
      let unknownDone = false;
      const unknown = POST(json('POST', { email: 'bob@example.com' })).then(() => {
        unknownDone = true;
      });
      await vi.advanceTimersByTimeAsync(99);
      expect(unknownDone).toBe(false);
      await vi.advanceTimersByTimeAsync(201);
      await unknown;
      expect(unknownDone).toBe(true);

      requestDeletion.mockResolvedValue({ ok: true, entryExists: true });
      let knownDone = false;
      const known = POST(json('POST', { email: 'ana@example.com' })).then(() => {
        knownDone = true;
      });
      await vi.advanceTimersByTimeAsync(0);
      await known;
      expect(knownDone).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should rate-limit requests and confirmations in their own strict buckets', async () => {
    requestDeletion.mockResolvedValue({ ok: true, entryExists: true });
    confirmDeletion.mockResolvedValue({ ok: true, deleted: true });
    await POST(json('POST', { email: 'ana@example.com' }));
    await DELETE(json('DELETE', { token: 'tok' }));
    expect(routeHelpers.applyRateLimit).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      'delete',
      'strict'
    );
    expect(routeHelpers.applyRateLimit).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      'delete-confirm',
      'strict'
    );
  });
});
