/**
 * `scripts/lib/migrate-runner.mjs` — the one migration runner both apps use (`5.709`).
 *
 * The website's earlier runner was launched with `tsx`, which this repository never
 * installed, so `pnpm --filter web db:status` could not start (found 2026-10-30). These
 * cases drive the shared core with a fake Neon function that records every query, so the
 * order of calls (folder first, then the database) is asserted, not assumed. The last case
 * runs the website's real CLI file, so its launcher can never silently break again.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  migrationStatus,
  runCli,
  runMigrations,
} from '../../../../../scripts/lib/migrate-runner.mjs';

const REPO = resolve(__dirname, '../../../../..');
const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

/** A private docs root holding the given migration files for `app`. */
function docsWith(app: string, files: Record<string, string>): string {
  const docs = mkdtempSync(join(tmpdir(), 'migrate-runner-'));
  made.push(docs);
  mkdirSync(join(docs, 'audit'), { recursive: true });
  writeFileSync(join(docs, 'audit/PENDING_ALL.md'), '# register\n');
  const dir = join(docs, 'ops/db-migrations', app);
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return docs;
}

/** A fake Neon tagged-template function: records each call; `failOn` makes one statement throw. */
function fakeSql(applied: string[], failOn?: string) {
  const calls: string[] = [];
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?').trim();
    calls.push(values.length ? `${text} [${values.join(',')}]` : text);
    if (failOn && text.includes(failOn)) return Promise.reject(new Error('boom'));
    if (text.startsWith('SELECT filename'))
      return Promise.resolve(applied.map((filename) => ({ filename })));
    return Promise.resolve([]);
  };
  return { sql, calls };
}

describe('migrate-runner (5.709)', () => {
  const FILES = { '002_b.sql': 'CREATE TABLE b();', '001_a.sql': 'CREATE TABLE a();' };

  it('should apply pending migrations in filename order and record each by filename', async () => {
    const dir = join(docsWith('web', FILES), 'ops/db-migrations/web');
    const { sql, calls } = fakeSql([]);
    const applied = await runMigrations({ sql, dir, log: () => {} });
    expect(applied).toEqual(['001_a.sql', '002_b.sql']);
    expect(
      calls.filter((c) => /^CREATE TABLE [ab]\(\);$/.test(c) || c.startsWith('INSERT'))
    ).toEqual([
      'CREATE TABLE a();',
      'INSERT INTO schema_migrations (filename) VALUES (?) [001_a.sql]',
      'CREATE TABLE b();',
      'INSERT INTO schema_migrations (filename) VALUES (?) [002_b.sql]',
    ]);
  });

  it('should skip a migration whose filename is already recorded', async () => {
    const dir = join(docsWith('web', FILES), 'ops/db-migrations/web');
    const { sql, calls } = fakeSql(['001_a.sql']);
    expect(await runMigrations({ sql, dir, log: () => {} })).toEqual(['002_b.sql']);
    expect(calls).not.toContain('CREATE TABLE a();');
  });

  it('should stop at a failing migration and not record it', async () => {
    const dir = join(docsWith('web', FILES), 'ops/db-migrations/web');
    const { sql, calls } = fakeSql([], 'CREATE TABLE b');
    await expect(runMigrations({ sql, dir, log: () => {} })).rejects.toThrow('boom');
    expect(calls.some((c) => c.endsWith('[002_b.sql]'))).toBe(false);
    expect(calls.some((c) => c.endsWith('[001_a.sql]'))).toBe(true);
  });

  it('should report applied and pending migrations when asked for the status', async () => {
    const dir = join(docsWith('web', FILES), 'ops/db-migrations/web');
    const { sql } = fakeSql(['001_a.sql']);
    expect(await migrationStatus({ sql, dir })).toEqual({
      applied: ['001_a.sql'],
      pending: ['002_b.sql'],
    });
  });

  it('should never connect when the folder is missing or DATABASE_URL is unset', async () => {
    const neon = vi.fn();
    await expect(
      runCli({
        app: 'web',
        repoRoot: REPO,
        neon,
        argv: ['', '', 'status'],
        env: { DIBOAS_DOCS_DIR: 'none' },
      })
    ).rejects.toThrow(/^\[migrate\] cannot run: no private docs checkout/);
    const docs = docsWith('web', FILES);
    await expect(
      runCli({
        app: 'web',
        repoRoot: REPO,
        neon,
        argv: ['', '', 'migrate'],
        env: { DIBOAS_DOCS_DIR: docs },
      })
    ).rejects.toThrow(
      /^\[migrate\] DATABASE_URL is not set \(expected in apps\/web\/\.env\.local\)$/
    );
    await expect(
      runCli({
        app: 'web',
        repoRoot: REPO,
        neon,
        argv: ['', '', 'drop'],
        env: { DIBOAS_DOCS_DIR: docs },
      })
    ).rejects.toThrow(/unknown mode 'drop'/);
    expect(neon).not.toHaveBeenCalled();
  });

  it('should start the website CLI with plain node and stop on the folder check when no docs root exists', () => {
    let err = '';
    try {
      execFileSync('node', [join(REPO, 'apps/web/scripts/db-migrate.mjs'), 'status'], {
        env: { ...process.env, DIBOAS_DOCS_DIR: 'none', DATABASE_URL: '' },
        stdio: 'pipe',
      });
    } catch (error) {
      err = String((error as { stderr?: Buffer }).stderr ?? '');
    }
    expect(err).toMatch(/^\[migrate\] cannot run: no private docs checkout/);
  });
});
