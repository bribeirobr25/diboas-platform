/**
 * The Practice migration runner reads its files from the private docs only (register
 * `5.709`, founder 2026-10-30) and stops BEFORE any database call when it finds none. Run
 * as the real CLI with no database configured: reaching the database would fail on the
 * missing DATABASE_URL instead, so the message proves which check stopped it.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { makeFixtureParent } from '../../../test/fixtureParent';

const RUNNER = resolve(__dirname, '../migrate.mjs');
const FIXTURES = makeFixtureParent('sandbox-migrate-');
afterAll(FIXTURES.remove);

function status(env: Record<string, string>) {
  try {
    execFileSync('node', [RUNNER, 'status'], {
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: '', ...env },
    });
    return { code: 0, err: '' };
  } catch (error) {
    const e = error as { status?: number; stderr?: string };
    return { code: e.status ?? 1, err: e.stderr ?? '' };
  }
}

describe('sandbox migration source (5.709)', () => {
  it('should stop before the database when there is no private docs checkout', () => {
    const r = status({ DIBOAS_DOCS_DIR: 'none' });
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/\[migrate\] cannot run: no private docs checkout \(diboas-docs\)/);
    expect(r.err).not.toMatch(/DATABASE_URL/);
  });

  it('should stop before the database when the private folder holds no .sql migration', () => {
    const docs = join(FIXTURES.dir, 'docs');
    mkdirSync(join(docs, 'audit'), { recursive: true });
    writeFileSync(join(docs, 'audit/PENDING_ALL.md'), '# register\n');
    mkdirSync(join(docs, 'ops/db-migrations/sandbox'), { recursive: true });
    const r = status({ DIBOAS_DOCS_DIR: docs });
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/cannot run: \S*sandbox holds no \.sql migration/);
  });

  it('should reach the database step when the private folder holds a migration', () => {
    const docs = join(FIXTURES.dir, 'docs-ok');
    mkdirSync(join(docs, 'audit'), { recursive: true });
    writeFileSync(join(docs, 'audit/PENDING_ALL.md'), '# register\n');
    mkdirSync(join(docs, 'ops/db-migrations/sandbox'), { recursive: true });
    writeFileSync(join(docs, 'ops/db-migrations/sandbox/001_a.sql'), 'SELECT 1;\n');
    const sum = createHash('sha256').update('SELECT 1;\n').digest('hex');
    writeFileSync(join(docs, 'ops/db-migrations/sandbox/SHA256SUMS'), `${sum}  001_a.sql\n`);
    const r = status({ DIBOAS_DOCS_DIR: docs });
    expect(r.code).toBe(1); // no database here: the next check, not the folder, stops it
    expect(r.err).toMatch(/DATABASE_URL is not set/);
    expect(r.err).not.toMatch(/cannot run/);
  });
});
