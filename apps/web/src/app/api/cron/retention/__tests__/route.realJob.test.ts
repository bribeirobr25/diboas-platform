/**
 * The retention cron with the REAL job and purges, only the database stubbed (the path production
 * takes). A purge that fails is a failed run (twelfth audit: never "200, deleted 0"), and the
 * other purges still run (P14, E1).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';
import { PURGES } from '@/lib/retention';

const CRON_FIXTURE = 'test-cron-secret';
const authorised = () =>
  new NextRequest('https://diboas.com/api/cron/retention', {
    headers: { authorization: `Bearer ${CRON_FIXTURE}` },
  });

describe('GET /api/cron/retention — with the real job', () => {
  beforeEach(() => {
    mockSql.mockReset();
    vi.stubEnv('CRON_SECRET', CRON_FIXTURE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should answer 500, and still run every other purge, when the first purge fails', async () => {
    mockSql.mockRejectedValueOnce(new Error('connection lost')).mockResolvedValue([]);
    const res = await GET(authorised());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.purges[0]).toEqual({ name: 'auditLogs', status: 'failed', count: 0 });
    expect(body.purges).toHaveLength(PURGES.length);
    expect(mockSql).toHaveBeenCalledTimes(PURGES.length);
  });

  it('should answer 200 with the real counts when every purge succeeds', async () => {
    mockSql.mockImplementation(async () => [{ id: 1 }, { id: 2 }]);
    const res = await GET(authorised());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.purges[0]).toEqual({ name: 'auditLogs', status: 'ok', count: 2 });
  });
});
