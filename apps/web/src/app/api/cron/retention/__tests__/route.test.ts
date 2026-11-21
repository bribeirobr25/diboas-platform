/**
 * ⛑ RETENTION-1 guard 2 · the daily retention cron route (plan P14; registers `5.863`, `5.39`).
 *
 * Carries the old audit-log route's SECURE outcomes (inert 503 while CRON_SECRET is unset, even
 * for `Bearer undefined`; 401 for every bad bearer; a constant-time comparison; nothing runs
 * unless the bearer matches exactly; no cacheable response, no failure detail) and adds the
 * job's: 200 with every purge's count, 500 naming only the purge when one failed or braked.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const runRetention = vi.fn();
vi.mock('@/lib/retention', () => ({
  runRetention: (...args: unknown[]) => runRetention(...args),
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
const OK_RUN = {
  ok: true,
  purges: [
    { name: 'auditLogs', status: 'ok', count: 17 },
    { name: 'emailDeliveryLogs', status: 'ok', count: 0 },
  ],
};

const makeRequest = (authorization?: string) =>
  new NextRequest('https://diboas.com/api/cron/retention', {
    headers: authorization === undefined ? {} : { authorization },
  });

describe('GET /api/cron/retention — bearer authentication', () => {
  beforeEach(() => {
    runRetention.mockReset().mockResolvedValue(OK_RUN);
    timingSafeEqualSpy.mockReset();
    vi.stubEnv('CRON_SECRET', CRON_FIXTURE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return 503 and never run when CRON_SECRET is unset, whatever the bearer', async () => {
    const error = vi.spyOn(Logger, 'error');
    vi.stubEnv('CRON_SECRET', undefined);
    for (const auth of [undefined, 'Bearer ', 'Bearer undefined', `Bearer ${CRON_FIXTURE}`]) {
      const res = await GET(makeRequest(auth));
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'not_configured' });
      expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    }
    expect(runRetention).not.toHaveBeenCalled();
    // Fourteenth audit (5.892): a cron that cannot run says so, every time.
    expect(error).toHaveBeenCalledTimes(4);
    expect(error).toHaveBeenCalledWith(
      '[cron/retention] CRON_SECRET is not set; the job cannot run',
      {}
    );
    error.mockRestore();
  });

  it('should return 503 and never run when CRON_SECRET is an empty string', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const res = await GET(makeRequest('Bearer '));
    expect(res.status).toBe(503);
    expect(runRetention).not.toHaveBeenCalled();
  });

  it('should return 401 and never run when the authorization header is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthorized' });
    expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    expect(runRetention).not.toHaveBeenCalled();
  });

  it('should return 401 and never run when the bearer is wrong or mis-shaped', async () => {
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
    expect(runRetention).not.toHaveBeenCalled();
  });

  it('should compare the bearer in constant time when the lengths match', async () => {
    await GET(makeRequest(`Bearer ${'x'.repeat(CRON_FIXTURE.length)}`));
    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1);
    const [a, b] = timingSafeEqualSpy.mock.calls[0]!;
    expect(Buffer.from(a as Uint8Array).toString()).toBe(
      `Bearer ${'x'.repeat(CRON_FIXTURE.length)}`
    );
    expect(Buffer.from(b as Uint8Array).toString()).toBe(`Bearer ${CRON_FIXTURE}`);
  });

  it('should run the job once and answer 200 with every count when the bearer matches', async () => {
    const res = await GET(makeRequest(`Bearer ${CRON_FIXTURE}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(OK_RUN);
    expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
    expect(runRetention).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['failed', { name: 'auditLogs', status: 'failed', count: 0 }],
    ['brake', { name: 'emailDeliveryOrphans', status: 'brake', count: 0 }],
  ])('should answer 500 when only one purge reports %s', async (_status, outcome) => {
    runRetention.mockResolvedValue({
      ok: false,
      purges: [outcome, { name: 'deletionTokens', status: 'ok', count: 3 }],
    });
    const res = await GET(makeRequest(`Bearer ${CRON_FIXTURE}`));
    expect(res.status).toBe(500);
  });

  it('should answer 500 naming only the purge, with no failure detail, when a purge failed or braked', async () => {
    runRetention.mockResolvedValue({
      ok: false,
      purges: [
        { name: 'auditLogs', status: 'failed', count: 0 },
        { name: 'emailDeliveryOrphans', status: 'brake', count: 0 },
        { name: 'deletionTokens', status: 'ok', count: 3 },
      ],
    });
    const res = await GET(makeRequest(`Bearer ${CRON_FIXTURE}`));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.purges.map((p: { name: string }) => p.name)).toEqual([
      'auditLogs',
      'emailDeliveryOrphans',
      'deletionTokens',
    ]);
    expect(JSON.stringify(body)).not.toMatch(/error|@|stack/i);
    expect(res.headers.get('Cache-Control')).toBe(NO_STORE);
  });
});
