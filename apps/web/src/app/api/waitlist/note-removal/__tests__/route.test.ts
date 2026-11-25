/**
 * POST /api/waitlist/note-removal (W-D1, spec §3.6; CONSENT-EVIDENCE-1 removal half). Held at
 * 100% (COV-1). The origin check and the rate limit run first; a bad or missing token removes
 * nothing; the answer names whether a note was removed; a failure is a generic 500, logged once.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const applyCsrf = vi.fn();
const applyRateLimit = vi.fn();
vi.mock('@/lib/api/routeHelpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/routeHelpers')>();
  return {
    ...actual,
    applyCsrf: (...a: unknown[]) => applyCsrf(...a),
    applyRateLimit: (...a: unknown[]) => applyRateLimit(...a),
  };
});
const verify = vi.fn();
vi.mock('@/lib/email/emailLinkToken', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email/emailLinkToken')>();
  return { ...actual, verifyEmailLinkToken: (...a: unknown[]) => verify(...a) };
});
const removeSignupNote = vi.fn();
vi.mock('@/lib/waitingList/store/noteRemoval', () => ({
  removeSignupNote: (...a: unknown[]) => removeSignupNote(...a),
}));

import { POST } from '../route';
import { Logger } from '@/lib/monitoring/Logger';

const ID = 'a'.repeat(64);
const T = Buffer.from(`${ID}:tok`).toString('base64url');
const req = (body: unknown = { t: T }) =>
  new NextRequest('https://diboas.com/api/waitlist/note-removal', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', origin: 'https://diboas.com' },
  });

beforeEach(() => {
  vi.clearAllMocks();
  applyCsrf.mockReturnValue(null);
  applyRateLimit.mockResolvedValue(null);
  verify.mockReturnValue(true);
  removeSignupNote.mockResolvedValue({ removed: true });
});

describe('POST /api/waitlist/note-removal', () => {
  it('should remove the note and say so', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, removed: true });
    expect(removeSignupNote).toHaveBeenCalledWith(ID);
    expect(verify).toHaveBeenCalledWith(ID, 'tok');
  });

  it('should answer removed: false when there was no note (a repeat is a 200 no-op)', async () => {
    removeSignupNote.mockResolvedValue({ removed: false });
    expect(await (await POST(req())).json()).toEqual({ success: true, removed: false });
  });

  it('should refuse a cross-origin request before anything else', async () => {
    applyCsrf.mockReturnValue(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    expect((await POST(req())).status).toBe(403);
    expect(applyRateLimit).not.toHaveBeenCalled();
    expect(removeSignupNote).not.toHaveBeenCalled();
  });

  it('should honour the rate limit', async () => {
    applyRateLimit.mockResolvedValue(NextResponse.json({}, { status: 429 }));
    expect((await POST(req())).status).toBe(429);
    expect(applyRateLimit).toHaveBeenCalledWith(expect.anything(), 'note-removal', 'standard');
    expect(removeSignupNote).not.toHaveBeenCalled();
  });

  it('should remove nothing for a bad or missing token', async () => {
    verify.mockReturnValue(false);
    expect((await POST(req())).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect(removeSignupNote).not.toHaveBeenCalled();
  });

  it('should answer a generic 500 and log once when the store fails', async () => {
    const spy = vi.spyOn(Logger, 'error').mockImplementation(() => {});
    removeSignupNote.mockRejectedValue(new Error('db-host-1 down'));
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('db-host-1');
    expect(spy).toHaveBeenCalledTimes(1);
    removeSignupNote.mockRejectedValue('not an error');
    expect((await POST(req())).status).toBe(500);
  });
});
