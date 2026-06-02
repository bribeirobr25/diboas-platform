/**
 * Waitlist Position API Route — F13 regression test.
 *
 * F13 (Bar R2 exception, 2026-06-02): the email-not-found branch must seed its
 * dummy position with the current UTC date so the per-email value rotates daily
 * (no longer a stable cross-query fingerprint). These tests pin that the HMAC
 * seed is `${todayUTC}|${email}` and changes across UTC days.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api/routeHelpers', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null), // not rate-limited
  applyCsrf: vi.fn().mockReturnValue(null),
  handleRouteError: vi.fn(),
}));

vi.mock('@/lib/waitingList/store', () => ({
  getByEmail: vi.fn().mockResolvedValue(null), // force the not-found dummy branch
  updateEntry: vi.fn(),
  processReferral: vi.fn(),
}));

vi.mock('@/lib/utils/sanitize', () => ({
  sanitizeEmail: vi.fn((e: string) => e.toLowerCase().trim()),
}));

vi.mock('@/lib/waitingList/helpers', () => ({
  isValidEmail: vi.fn().mockReturnValue(true),
  generateReferralUrl: vi.fn().mockReturnValue('https://diboas.com/ref/X'),
}));

vi.mock('@/lib/security', () => ({
  requireAuth: vi.fn().mockReturnValue(null),
  // Deterministic hex hash that varies across the FULL input (date + email),
  // so a date change actually changes the derived dummy position.
  hmacHash: vi.fn((input: string) => {
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, '0');
  }),
}));

vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: { emit: vi.fn() },
  ApplicationEventType: { WAITLIST_POSITION_CHECKED: 'waitlist.position.checked' },
}));

import { GET } from '../position/route';
import * as security from '@/lib/security';

const req = (email: string) =>
  new NextRequest(
    `https://diboas.com/api/waitlist/position?email=${encodeURIComponent(email)}`
  );

describe('GET /api/waitlist/position — F13 daily-rotating dummy (not-found)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Fake ONLY Date so `new Date()` is controllable but the route's
    // setTimeout anti-timing delay still resolves on the real timer.
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('seeds the dummy with the UTC date and returns a non-null position', async () => {
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
    const res = await GET(req('ghost@example.com'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(typeof body.position).toBe('number');
    expect(body.position).toBeGreaterThanOrEqual(1);
    expect(body.position).toBeLessThanOrEqual(10000);
    expect(security.hmacHash).toHaveBeenCalledWith('2026-06-02|ghost@example.com');
  });

  it('uses a different seed on a different UTC day (rotation)', async () => {
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'));
    await GET(req('ghost@example.com'));
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'));
    await GET(req('ghost@example.com'));

    expect(security.hmacHash).toHaveBeenCalledWith('2026-06-02|ghost@example.com');
    expect(security.hmacHash).toHaveBeenCalledWith('2026-06-03|ghost@example.com');
  });
});
