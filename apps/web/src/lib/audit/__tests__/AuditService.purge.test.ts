/**
 * AuditService — retention purge (§5.39).
 *
 * Verifies purgeExpiredAuditLogs() deletes via the 90-day window, returns the
 * deleted count, and fails closed (returns 0, never throws) on a DB error.
 * The SQL client is mocked — no real database.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSql = vi.fn();
vi.mock('@/lib/database', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { purgeExpiredAuditLogs, AUDIT_LOG_RETENTION_DAYS } from '../AuditService';

describe('purgeExpiredAuditLogs', () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it('should retain for 90 days', () => {
    expect(AUDIT_LOG_RETENTION_DAYS).toBe(90);
  });

  it('should return the number of rows deleted', async () => {
    mockSql.mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const deleted = await purgeExpiredAuditLogs();
    expect(deleted).toBe(3);
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('should interpolate the retention window into the DELETE', async () => {
    mockSql.mockResolvedValueOnce([]);
    await purgeExpiredAuditLogs();
    // The tagged-template values array (2nd+ args) must carry the 90-day window.
    const values = mockSql.mock.calls[0].slice(1);
    expect(values).toContain(AUDIT_LOG_RETENTION_DAYS);
  });

  it('should fail closed (return 0, never throw) on a DB error', async () => {
    mockSql.mockRejectedValueOnce(new Error('connection lost'));
    await expect(purgeExpiredAuditLogs()).resolves.toBe(0);
  });
});
