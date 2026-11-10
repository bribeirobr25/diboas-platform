/**
 * Waitlist deletion routes — a bad body is a 400, never a 500 (5.823 family; twelfth audit).
 *
 * Both handlers read their body through `readJsonObject`. Until this file, no test reached
 * either one, so reverting them to a raw `request.json()` passed every suite. The service is
 * mocked: these tests pin the HTTP layer only, and assert the service is never reached.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
