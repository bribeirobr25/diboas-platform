/**
 * POST /api/waitlist/position — a bad body is a 400, never a 500 (5.823 family; twelfth audit).
 *
 * The admin-only update reads its body through `readJsonObject`; until this file no test
 * reached it, and `{"email":123}` reached `email.toLowerCase()` and threw. Auth, CSRF and the
 * rate limit are stubbed open; the store is mocked and must never be reached.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api/routeHelpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/routeHelpers')>();
  return {
    ...actual, // the real readJsonObject
    applyCsrf: vi.fn().mockReturnValue(null),
    applyRateLimit: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('@/lib/security', () => ({
  requireAuth: vi.fn().mockReturnValue(null),
  hmacHash: vi.fn().mockReturnValue('00000000'),
}));

const getByEmail = vi.fn();
vi.mock('@/lib/waitingList/store', () => ({
  getByEmail: (...args: unknown[]) => getByEmail(...args),
  updateEntry: vi.fn(),
  processReferral: vi.fn(),
}));

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../position/route';

const call = (body: string) =>
  new NextRequest('https://diboas.com/api/waitlist/position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

describe('POST /api/waitlist/position — request body', () => {
  beforeEach(() => getByEmail.mockReset());

  it.each([
    ['JSON null', 'null'],
    ['malformed JSON', '{not json'],
    ['an array', '[]'],
    ['a numeric email', '{"email":123}'],
    ['an array email', '{"email":["a@example.com"]}'],
  ])('should answer 400 and never reach the store when the body is %s', async (_l, raw) => {
    const res = await POST(call(raw));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ success: false, error: 'Email is required' });
    expect(getByEmail).not.toHaveBeenCalled();
  });
});
