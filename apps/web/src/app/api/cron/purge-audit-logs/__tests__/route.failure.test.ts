/**
 * Audit-log retention cron — a failed purge is a failed run (twelfth audit).
 *
 * The route test mocks `purgeExpiredAuditLogs` and makes it throw; the real function
 * used to catch every database error and return 0, so production answered
 * `200 { ok: true, deleted: 0 }` — the same as "nothing to purge" — and the route's
 * 500 branch could never run. This file runs the route with the REAL purge function
 * and stubs only the database, so the whole path is the one production takes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSql = vi.fn();
vi.mock('@/lib/database', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

const CRON_FIXTURE = 'test-cron-secret';
const authorised = () =>
  new NextRequest('https://diboas.com/api/cron/purge-audit-logs', {
    headers: { authorization: `Bearer ${CRON_FIXTURE}` },
  });

describe('GET /api/cron/purge-audit-logs — with the real purge function', () => {
  beforeEach(() => {
    mockSql.mockReset();
    vi.stubEnv('CRON_SECRET', CRON_FIXTURE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should answer 500 purge_failed, never 200 deleted 0, when the database fails', async () => {
    mockSql.mockRejectedValueOnce(new Error('connection lost'));
    const res = await GET(authorised());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'purge_failed' });
  });

  it('should answer 200 with the real count when the DELETE succeeds', async () => {
    mockSql.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    const res = await GET(authorised());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, deleted: 2, retentionDays: 90 });
  });
});
