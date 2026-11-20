/**
 * ⛑ RETENTION-1 guard 1 · the daily job (plan P14, E1/E10′; `5.863`, `5.825`).
 *
 * Every registered purge runs; one that throws, or whose brake trips, is reported and the others
 * still run; logs carry names and counts only. The registry of purges is pinned, and only the
 * cron route imports the runner (a source scan).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stripComments } from '@diboas/test-support';

vi.mock('@/lib/database/client', () => ({ sql: vi.fn() }));
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { PURGES, runRetention } from '..';
import type { Purge } from '../types';
import { Logger } from '@/lib/monitoring/Logger';

const query = vi.fn();
const purge = (name: string, run: Purge['run'], warnOnDelete = false): Purge => ({
  name,
  run,
  warnOnDelete,
});

describe('RETENTION-1 guard 1 · the retention job', () => {
  beforeEach(() => {
    vi.mocked(Logger.error).mockClear();
    vi.mocked(Logger.warn).mockClear();
  });

  it('should pin the six purges, in order, when the job is assembled', () => {
    expect(PURGES.map((p) => p.name)).toEqual([
      'auditLogs',
      'emailDeliveryLogs',
      'emailDeliveryOrphans',
      'emailDeliveryLegacyText',
      'deletionTokens',
      'idempotencyCache',
    ]);
    expect(PURGES.filter((p) => p.warnOnDelete).map((p) => p.name)).toEqual([
      'emailDeliveryOrphans',
    ]);
  });

  it('should run every purge with the injected query and report each count when all succeed', async () => {
    const a = vi.fn(async () => ({ count: 2 }));
    const b = vi.fn(async () => ({ count: 0 }));
    const run = await runRetention(query, [purge('a', a), purge('b', b)]);
    expect(a).toHaveBeenCalledWith(query);
    expect(run).toEqual({
      ok: true,
      purges: [
        { name: 'a', status: 'ok', count: 2 },
        { name: 'b', status: 'ok', count: 0 },
      ],
    });
  });

  it('should still run the others, and mark it failed with its name only, when one purge throws', async () => {
    const after = vi.fn(async () => ({ count: 1 }));
    const err = new Error('connection to db-host refused');
    const run = await runRetention(query, [
      purge('broken', async () => {
        throw err;
      }),
      purge('after', after),
    ]);
    expect(after).toHaveBeenCalledTimes(1);
    expect(run.ok).toBe(false);
    expect(run.purges[0]).toEqual({ name: 'broken', status: 'failed', count: 0 });
    expect(Logger.error).toHaveBeenCalledWith('[retention] purge failed', { purge: 'broken' }, err);
  });

  it('should log without an Error object when a purge rejects with a non-Error', async () => {
    await runRetention(query, [
      purge('odd', async () => {
        throw 'plain';
      }),
    ]);
    expect(Logger.error).toHaveBeenCalledWith(
      '[retention] purge failed',
      { purge: 'odd' },
      undefined
    );
  });

  it('should report the brake, delete nothing and still run the others when a brake trips', async () => {
    const after = vi.fn(async () => ({ count: 0 }));
    const run = await runRetention(query, [
      purge('sweep', async () => ({ count: 0, brakeTripped: true })),
      purge('after', after),
    ]);
    expect(run.purges[0]).toEqual({ name: 'sweep', status: 'brake', count: 0 });
    expect(after).toHaveBeenCalled();
    expect(run.ok).toBe(false);
    expect(Logger.error).toHaveBeenCalledWith('[retention] brake tripped; nothing deleted', {
      purge: 'sweep',
    });
  });

  it('should warn with the count only when a sweep marked for it deletes rows', async () => {
    await runRetention(query, [
      purge('sweep', async () => ({ count: 3 }), true),
      purge('quiet', async () => ({ count: 9 })),
      purge('idle', async () => ({ count: 0 }), true),
    ]);
    expect(Logger.warn).toHaveBeenCalledTimes(1);
    expect(Logger.warn).toHaveBeenCalledWith('[retention] rows deleted by a sweep', {
      purge: 'sweep',
      count: 3,
    });
  });

  it('should mark the idempotency purge failed, never swallowed, when its query fails (5.825)', async () => {
    const failing = vi.fn(async () => {
      throw new Error('timeout');
    });
    const run = await runRetention(failing as never);
    expect(run.purges.find((p) => p.name === 'idempotencyCache')?.status).toBe('failed');
    expect(run.purges.every((p) => p.status === 'failed')).toBe(true);
  });
});

/* A whole-tree source scan: its own timeout under coverage (COV-1, 5.1023). */
describe('RETENTION-1 guard 1 · only the cron route runs the job', { timeout: 30_000 }, () => {
  const SRC = join(__dirname, '../../..');
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = join(dir, e.name);
      if (e.isDirectory()) return e.name === '__tests__' ? [] : files(full);
      return /\.tsx?$/.test(e.name) ? [full] : [];
    });
  const IMPORTS_RUNNER =
    /from\s+['"](?:@\/lib\/retention|\.\.?\/(?:\.\.\/)*retention)(?:\/index)?['"]/;

  it('should find the runner imported by the cron route alone when the source is read', () => {
    const importers = files(SRC)
      .filter((f) => !f.includes(`${sep}lib${sep}retention${sep}`))
      .filter((f) => IMPORTS_RUNNER.test(stripComments(readFileSync(f, 'utf8'), f)))
      .map((f) => relative(SRC, f).split(sep).join('/'));
    expect(importers).toEqual(['app/api/cron/retention/route.ts']);
  });

  it('should tell an import of the runner from a lookalike (detector self-test)', () => {
    expect(IMPORTS_RUNNER.test("import { runRetention } from '@/lib/retention';")).toBe(true);
    expect(IMPORTS_RUNNER.test("import { x } from '@/lib/retention/index';")).toBe(true);
    expect(IMPORTS_RUNNER.test("import { x } from '@/lib/retention/registry';")).toBe(false);
    expect(IMPORTS_RUNNER.test("import { x } from '@/lib/retentionPolicy';")).toBe(false);
  });
});
