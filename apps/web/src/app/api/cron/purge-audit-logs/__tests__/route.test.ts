/**
 * Audit-log retention cron — bearer authentication (§5.39).
 *
 * Pins the SECURE outcomes: the purge is inert (503) while CRON_SECRET is
 * unset — even for a caller who guesses `Bearer undefined` — every bad or
 * missing bearer gets a 401, the comparison is constant-time, nothing is
 * deleted unless the bearer matches exactly, and no response is cacheable or
 * echoes the underlying failure.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const purgeExpiredAuditLogs = vi.fn();
vi.mock('@/lib/audit/AuditService', () => ({
  purgeExpiredAuditLogs: (...args: unknown[]) => purgeExpiredAuditLogs(...args),
  AUDIT_LOG_RETENTION_DAYS: 90,
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

import { GET } from '../route';
import { Logger } from '@/lib/monitoring/Logger';

const CRON_FIXTURE = 'test-cron-secret';
const NO_STORE = 'no-store, no-cache, must-revalidate';

const makeRequest = (authorization?: string) =>
  new NextRequest('https://diboas.com/api/cron/purge-audit-logs', {
    headers: authorization === undefined ? {} : { authorization },
  });

describe('GET /api/cron/purge-audit-logs — bearer authentication', () => {
  beforeEach(() => {
    purgeExpiredAuditLogs.mockReset();
    timingSafeEqualSpy.mockReset();
    vi.stubEnv('CRON_SECRET', CRON_FIXTURE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 503 and never purge when CRON_SECRET is unset, whatever the bearer', async () => {
    vi.stubEnv('CRON_SECRET', undefined);
    for (const auth of [undefined, 'Bearer ', 'Bearer undefined', `Bearer ${CRON_FIXTURE}`]) {
      const res = await GET(makeRequest(auth));
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'not_configured' });
      expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    }
    expect(purgeExpiredAuditLogs).not.toHaveBeenCalled();
    // Fourteenth audit (5.892): a cron that cannot run says so, every time.
    expect(Logger.error).toHaveBeenCalledTimes(4);
    expect(Logger.error).toHaveBeenCalledWith(
      '[cron/purge-audit-logs] CRON_SECRET is not set; the purge cannot run',
      {}
    );
  });

  it('should return 503 and never purge when CRON_SECRET is an empty string', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const res = await GET(makeRequest('Bearer '));
    expect(res.status).toBe(503);
    expect(purgeExpiredAuditLogs).not.toHaveBeenCalled();
  });

  it('should return 401 and never purge when the authorization header is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
    expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    expect(purgeExpiredAuditLogs).not.toHaveBeenCalled();
  });

  it('should return 401 and never purge when the bearer is wrong or mis-shaped', async () => {
    for (const auth of [
      `Bearer ${'x'.repeat(CRON_FIXTURE.length)}`, // same length, wrong value
      'Bearer test-cron-secreT', // one char off
      `Bearer  ${CRON_FIXTURE}`, // double space
      `bearer ${CRON_FIXTURE}`, // scheme case
      CRON_FIXTURE, // no scheme
      `Bearer ${CRON_FIXTURE}${CRON_FIXTURE}`, // longer
    ]) {
      const res = await GET(makeRequest(auth));
      expect(res.status).toBe(401);
    }
    expect(purgeExpiredAuditLogs).not.toHaveBeenCalled();
  });

  it('should compare the bearer in constant time when the lengths match', async () => {
    await GET(makeRequest(`Bearer ${'x'.repeat(CRON_FIXTURE.length)}`));
    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1);
    const [a, b] = timingSafeEqualSpy.mock.calls[0];
    expect(Buffer.from(a as Uint8Array).toString()).toBe(
      `Bearer ${'x'.repeat(CRON_FIXTURE.length)}`
    );
    expect(Buffer.from(b as Uint8Array).toString()).toBe(`Bearer ${CRON_FIXTURE}`);
  });

  it('should purge once and report the count when the bearer matches', async () => {
    purgeExpiredAuditLogs.mockResolvedValue(17);
    const res = await GET(makeRequest(`Bearer ${CRON_FIXTURE}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, deleted: 17, retentionDays: 90 });
    expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    expect(purgeExpiredAuditLogs).toHaveBeenCalledTimes(1);
  });

  it('should return a generic 500 without the error detail when the purge throws an Error', async () => {
    const err = new Error('connection to db-host-1 refused');
    purgeExpiredAuditLogs.mockRejectedValue(err);
    const res = await GET(makeRequest(`Bearer ${CRON_FIXTURE}`));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'purge_failed' });
    expect(JSON.stringify(body)).not.toContain('db-host-1');
    expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    expect(Logger.error).toHaveBeenCalledWith('[cron/purge-audit-logs] purge failed', {}, err);
  });

  it('should log without an Error object when the purge rejects with a non-Error', async () => {
    purgeExpiredAuditLogs.mockRejectedValue('plain failure');
    const res = await GET(makeRequest(`Bearer ${CRON_FIXTURE}`));
    expect(res.status).toBe(500);
    expect(Logger.error).toHaveBeenCalledWith(
      '[cron/purge-audit-logs] purge failed',
      {},
      undefined
    );
  });
});
