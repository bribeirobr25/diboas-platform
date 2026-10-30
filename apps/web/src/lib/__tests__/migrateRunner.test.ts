/**
 * `scripts/lib/migrate-runner.mjs` — the one migration runner both apps use (`5.709`).
 *
 * It guards a production database, so these cases prove each REFUSAL as much as each
 * success: a name mismatch with the tracking table, an older file pending after a newer
 * one is applied (website 001–014 must never run again), a multi-statement file, a
 * checksum mismatch, and any apply without `--yes`. The core is driven with a fake Neon
 * function that records every query, so "nothing was written" is asserted, not assumed.
 * The last case starts the website's real CLI file with plain `node`.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  countStatements,
  describeTarget,
  migrationStatus,
  orderMigrations,
  planMigrations,
  runCli,
  runMigrations,
  verifyChecksums,
} from '../../../../../scripts/lib/migrate-runner.mjs';

const REPO = resolve(__dirname, '../../../../..');
const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
});

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

/** A private docs root (not a git checkout) holding `files` for `app`, with SHA256SUMS. */
function docsWith(app: string, files: Record<string, string>, sums = true): string {
  const docs = mkdtempSync(join(tmpdir(), 'migrate-runner-'));
  made.push(docs);
  mkdirSync(join(docs, 'audit'), { recursive: true });
  writeFileSync(join(docs, 'audit/PENDING_ALL.md'), '# register\n');
  const dir = join(docs, 'ops/db-migrations', app);
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  if (sums)
    writeFileSync(
      join(dir, 'SHA256SUMS'),
      Object.entries(files)
        .map(([n, b]) => `${sha(b)}  ${n}`)
        .join('\n') + '\n'
    );
  return docs;
}
const dirOf = (docs: string, app = 'web') => join(docs, 'ops/db-migrations', app);

/** A fake Neon tagged-template function recording every call. */
function fakeSql(applied: string[] | null, failOn?: string) {
  const calls: string[] = [];
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join('?').trim();
    calls.push(values.length ? `${text} [${values.join(',')}]` : text);
    if (failOn && text.includes(failOn))
      return Promise.reject(Object.assign(new Error('boom'), { code: '42P07', hint: 'h' }));
    if (text.startsWith('SELECT to_regclass'))
      return Promise.resolve([{ present: applied !== null }]);
    if (text.startsWith('SELECT filename'))
      return Promise.resolve((applied ?? []).map((filename) => ({ filename })));
    return Promise.resolve([]);
  };
  const writes = () => calls.filter((c) => /^(CREATE TABLE [ab]|DROP|INSERT)/.test(c));
  return { sql, calls, writes };
}

const ONE = { '001_a.sql': 'CREATE TABLE a();', '002_b.sql': 'CREATE TABLE b();' };
const quiet = () => {};

describe('migrate-runner · plan (5.709)', () => {
  it('should order migrations by name when the folder lists them in any order', () => {
    expect(orderMigrations(['010_c.sql', 'SHA256SUMS', '002_b.sql', '001_a.sql'])).toEqual([
      '001_a.sql',
      '002_b.sql',
      '010_c.sql',
    ]);
  });

  it('should count top-level statements and ignore semicolons in comments, quotes and bodies', () => {
    expect(countStatements('DROP TABLE IF EXISTS x;')).toBe(1);
    expect(countStatements('-- a; b;\nCREATE TABLE a(); /* c; */')).toBe(1);
    expect(countStatements("INSERT INTO t VALUES ('a;b', 'it''s;');")).toBe(1);
    expect(countStatements('CREATE FUNCTION f() AS $$ BEGIN x; y; END $$ LANGUAGE plpgsql;')).toBe(
      1
    );
    expect(countStatements('CREATE TABLE a(); CREATE INDEX i ON a(x);')).toBe(2);
    expect(countStatements('SELECT 1')).toBe(1);
  });

  it('should refuse when the tracking table names a migration the folder does not have', () => {
    const plan = planMigrations({
      files: ['001_a.sql', '002_b.sql'],
      applied: ['001_a', '002_b'],
      statements: () => 1,
    });
    expect(plan.problems[0]).toMatch(/names 2 migration\(s\) this folder does not have/);
  });

  it('should refuse a pending migration that sorts before one already applied', () => {
    const plan = planMigrations({
      files: ['001_a.sql', '002_b.sql', '003_c.sql'],
      applied: ['002_b.sql'],
      statements: () => 1,
    });
    expect(plan.problems).toEqual([
      expect.stringMatching(/1 pending migration\(s\) sort before 002_b\.sql.*001_a\.sql/),
    ]);
  });

  it('should refuse a pending migration with more than one statement', () => {
    const plan = planMigrations({ files: ['001_a.sql'], applied: [], statements: () => 3 });
    expect(plan.problems).toEqual([
      '001_a.sql holds 3 statements; a migration must hold exactly one',
    ]);
  });

  it('should plan only the newest file when every older one is applied', () => {
    const plan = planMigrations({
      files: ['014_old.sql', '015_new.sql'],
      applied: ['014_old.sql'],
      statements: (f: string) => (f === '015_new.sql' ? 1 : 3),
    });
    expect(plan).toEqual({ applied: ['014_old.sql'], pending: ['015_new.sql'], problems: [] });
  });
});

describe('migrate-runner · apply (5.709)', () => {
  it('should print the plan and write nothing when --yes is missing', async () => {
    const { sql, writes } = fakeSql([]);
    const log = vi.fn();
    const dir = dirOf(docsWith('web', ONE));
    expect(await runMigrations({ sql, dir, confirmed: false, log })).toEqual([]);
    expect(writes()).toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/re-run with --yes/));
  });

  it('should apply pending migrations in order and record each by filename when confirmed', async () => {
    const { sql, writes } = fakeSql([]);
    const dir = dirOf(docsWith('web', ONE));
    expect(await runMigrations({ sql, dir, confirmed: true, log: quiet })).toEqual([
      '001_a.sql',
      '002_b.sql',
    ]);
    expect(writes()).toEqual([
      'CREATE TABLE a();',
      'INSERT INTO schema_migrations (filename) VALUES (?) [001_a.sql]',
      'CREATE TABLE b();',
      'INSERT INTO schema_migrations (filename) VALUES (?) [002_b.sql]',
    ]);
  });

  it('should write nothing at all when the plan has a problem, even with --yes', async () => {
    const { sql, writes } = fakeSql(['001_a']);
    const dir = dirOf(docsWith('web', ONE));
    await expect(runMigrations({ sql, dir, confirmed: true, log: quiet })).rejects.toThrow(
      /refused, nothing applied/
    );
    expect(writes()).toEqual([]);
  });

  it('should stop at a failing migration, name it with its error code and hint, and not record it', async () => {
    const { sql, calls } = fakeSql([], 'CREATE TABLE b');
    const dir = dirOf(docsWith('web', ONE));
    await expect(runMigrations({ sql, dir, confirmed: true, log: quiet })).rejects.toThrow(
      /FAILED: 002_b\.sql — boom \(code 42P07\)\n {2}hint: h/
    );
    expect(calls.some((c) => c.endsWith('[001_a.sql]'))).toBe(true);
    expect(calls.some((c) => c.endsWith('[002_b.sql]'))).toBe(false);
  });

  it('should only read when asked for the status, never creating the tracking table', async () => {
    const { sql, calls } = fakeSql(['001_a.sql']);
    const dir = dirOf(docsWith('web', ONE));
    expect(await migrationStatus({ sql, dir })).toEqual({
      applied: ['001_a.sql'],
      pending: ['002_b.sql'],
      problems: [],
    });
    expect(calls.some((c) => /^(CREATE|INSERT|DROP)/.test(c))).toBe(false);
    const none = fakeSql(null);
    expect((await migrationStatus({ sql: none.sql, dir })).problems).toEqual([
      'no schema_migrations table yet',
    ]);
    expect(none.calls.some((c) => /^(CREATE|INSERT|DROP)/.test(c))).toBe(false);
  });
});

describe('migrate-runner · CLI guards (5.709)', () => {
  it('should refuse an edited, unlisted or missing file against SHA256SUMS', () => {
    const docs = docsWith('web', ONE);
    expect(verifyChecksums(dirOf(docs))).toEqual([]);
    writeFileSync(join(dirOf(docs), '002_b.sql'), 'CREATE TABLE changed();');
    writeFileSync(join(dirOf(docs), '003_c.sql'), 'SELECT 1;');
    expect(verifyChecksums(dirOf(docs))).toEqual([
      '002_b.sql does not match its SHA256SUMS entry',
      '003_c.sql is not listed in SHA256SUMS',
    ]);
    expect(verifyChecksums(dirOf(docsWith('web', ONE, false)))).toEqual(['SHA256SUMS is missing']);
  });

  it('should name the target database without its credentials', () => {
    expect(
      describeTarget('postgres://user:secret@ep-x.eu.aws.neon.tech/neondb?sslmode=require')
    ).toBe('ep-x.eu.aws.neon.tech / neondb');
    expect(describeTarget('not a url')).toBe('(unreadable DATABASE_URL)');
  });

  it('should never connect when the folder, its checksums or DATABASE_URL fail', async () => {
    const neon = vi.fn();
    const run = (argv: string[], env: Record<string, string>) =>
      runCli({ app: 'web', repoRoot: REPO, neon, argv: ['', '', ...argv], env, log: quiet });
    await expect(run(['status'], { DIBOAS_DOCS_DIR: 'none' })).rejects.toThrow(
      /^\[migrate\] cannot run: no private docs checkout/
    );
    await expect(run(['status'], { DIBOAS_DOCS_DIR: docsWith('web', ONE, false) })).rejects.toThrow(
      /cannot run: SHA256SUMS is missing/
    );
    await expect(
      run(['migrate', '--yes'], { DIBOAS_DOCS_DIR: docsWith('web', ONE) })
    ).rejects.toThrow(
      /^\[migrate\] DATABASE_URL is not set \(expected in apps\/web\/\.env\.local\)$/
    );
    await expect(run(['drop'], { DIBOAS_DOCS_DIR: docsWith('web', ONE) })).rejects.toThrow(
      /unknown mode 'drop'/
    );
    expect(neon).not.toHaveBeenCalled();
  });

  it('should print the target database before it queries, then apply only with --yes', async () => {
    const fake = fakeSql([]);
    const log = vi.fn();
    const env = {
      DIBOAS_DOCS_DIR: docsWith('web', ONE),
      DATABASE_URL: 'postgres://u:p@db.host/main',
    };
    const neon = () => fake.sql;
    await runCli({ app: 'web', repoRoot: REPO, neon, argv: ['', '', 'migrate'], env, log });
    expect(log.mock.calls[0][0]).toBe(
      '[migrate] database: db.host / main — check this is the one you mean'
    );
    expect(fake.writes()).toEqual([]);
    await runCli({
      app: 'web',
      repoRoot: REPO,
      neon,
      argv: ['', '', 'migrate', '--yes'],
      env,
      log,
    });
    expect(fake.writes()).toHaveLength(4);
  });

  it('should refuse to migrate when the private docs checkout is off main or has uncommitted changes', async () => {
    const docs = docsWith('web', ONE);
    const env: NodeJS.ProcessEnv = { ...process.env };
    for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k];
    const git = (...a: string[]) =>
      execFileSync(
        'git',
        [
          '-c',
          'user.email=f@example.invalid',
          '-c',
          'user.name=f',
          '-c',
          'commit.gpgsign=false',
          ...a,
        ],
        { cwd: docs, env, stdio: 'pipe' }
      );
    git('init', '-q', '-b', 'main');
    git('add', '-A');
    git('commit', '-q', '-m', 'docs');
    const neon = vi.fn();
    const run = () =>
      runCli({
        app: 'web',
        repoRoot: REPO,
        neon,
        argv: ['', '', 'migrate'],
        env: { DIBOAS_DOCS_DIR: docs, DATABASE_URL: 'postgres://u:p@h/d' },
        log: quiet,
      });
    // an edit whose checksum list is refreshed too, but not committed
    const edited = 'CREATE TABLE a(); -- edited';
    writeFileSync(join(dirOf(docs), '001_a.sql'), edited);
    writeFileSync(
      join(dirOf(docs), 'SHA256SUMS'),
      `${sha(edited)}  001_a.sql\n${sha(ONE['002_b.sql'])}  002_b.sql\n`
    );
    await expect(run()).rejects.toThrow(
      /cannot run: the migrations folder has uncommitted changes/
    );
    git('checkout', '-q', '--', '.');
    git('checkout', '-q', '-b', 'feature');
    await expect(run()).rejects.toThrow(/cannot run: the private docs checkout is not on main/);
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
