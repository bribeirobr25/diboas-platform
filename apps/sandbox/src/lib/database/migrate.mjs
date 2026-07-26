/**
 * Sandbox migration runner (P1.2 slice 1a).
 *
 * Self-contained ESM CLI (repo convention for standalone DB/CLI tooling is
 * `.mjs` run by node, e.g. scripts/market-refresh/*.mjs — NOT tsx, which isn't
 * installed). Node 22 loads env via --env-file, so:
 *
 *   node --env-file=.env.local src/lib/database/migrate.mjs migrate
 *   node --env-file=.env.local src/lib/database/migrate.mjs status
 *
 * Backs the sandbox's OWN Neon project (separate from the platform DB). Ships
 * only applied-to-prod + tracked in `schema_migrations`, per the 2026-07-17
 * incident rule (F-8). ONE statement per .sql file (Neon HTTP is one-shot).
 *
 * ⚠ INDEPENDENT-IDEMPOTENCY RULE (CTO §14.6 / PENDING_ALL 5.76, before 003):
 * the DDL and the `schema_migrations` INSERT run in TWO separate calls (lines
 * below) — Neon HTTP cannot wrap them in one transaction without `sql.transaction([])`.
 * So if the DDL succeeds but the INSERT fails, a re-run re-applies the DDL.
 * Therefore EVERY migration must be independently idempotent — `CREATE … IF NOT
 * EXISTS`, guarded `ALTER`, `INSERT … ON CONFLICT`. True today (001/002 use
 * `IF NOT EXISTS`); do NOT write a bare `ALTER`/backfill in 003+ without a guard.
 */

import { neon } from '@neondatabase/serverless';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (expected in apps/sandbox/.env.local).');
  return neon(url);
}

/** Run a trusted raw DDL string as a single statement (Neon HTTP one-shot). */
function rawSql(sql, query) {
  const strings = Object.assign([query], { raw: [query] });
  return sql(strings);
}

async function ensureMigrationsTable(sql) {
  await rawSql(
    sql,
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`
  );
}

async function getApplied(sql) {
  const rows = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
  return new Set(rows.map((r) => r.filename));
}

function migrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

async function runMigrations() {
  const sql = getSql();
  await ensureMigrationsTable(sql);
  const applied = await getApplied(sql);
  const newly = [];
  for (const file of migrationFiles()) {
    if (applied.has(file)) {
      console.log(`[migrate] skip (already applied): ${file}`);
      continue;
    }
    const content = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    console.log(`[migrate] applying: ${file}`);
    try {
      await rawSql(sql, content);
      await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
      newly.push(file);
      console.log(`[migrate] applied: ${file}`);
    } catch (error) {
      console.error(`[migrate] FAILED: ${file}`, error);
      throw error;
    }
  }
  console.log(
    newly.length === 0 ? '[migrate] all migrations already applied' : `[migrate] applied ${newly.length} migration(s)`
  );
  return newly;
}

async function status() {
  const sql = getSql();
  await ensureMigrationsTable(sql);
  const applied = await getApplied(sql);
  const files = migrationFiles();
  const out = {
    applied: files.filter((f) => applied.has(f)),
    pending: files.filter((f) => !applied.has(f)),
  };
  console.log(JSON.stringify(out, null, 2));
  return out;
}

const mode = process.argv[2] ?? 'status';
const action = mode === 'migrate' ? runMigrations : status;
action()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] fatal:', err);
    process.exit(1);
  });
