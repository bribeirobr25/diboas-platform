/**
 * migrate-runner.mjs — the ONE database migration runner for both apps (register `5.709`).
 *
 * The website (`apps/web`) and the Practice app (`apps/sandbox`) each have their own Neon
 * database and their own migrations, kept privately in `diboas-docs`
 * (`ops/db-migrations/<app>/`). Each app has a thin CLI that passes in its own Neon driver;
 * everything else lives here, once (Principle 4). It is plain JavaScript run by `node`:
 * the website's earlier TypeScript runner was started with `tsx`, which this repository
 * never installed, so `db:migrate` / `db:status` could not run at all (found 2026-10-30).
 *
 * Rules every migration and this runner keep:
 * - **One statement per `.sql` file** (Neon HTTP is one-shot).
 * - **Applied migrations are tracked by FILENAME** in `schema_migrations`; never rename one.
 * - **Every migration is independently idempotent** (`IF NOT EXISTS` / `IF EXISTS` /
 *   guarded `ALTER`): the statement and its tracking row are two calls, so a failure between
 *   them re-applies the statement on the next run (CTO §14.6, register `5.76`).
 * - **No folder, no run:** the runner stops BEFORE any database call when the private folder
 *   is missing or holds no `.sql` file, and never reports "all applied" over nothing.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrationsDir } from './docs-root.mjs';

/** Run a trusted DDL string as one statement through a Neon tagged-template function. */
function rawSql(sql, query) {
  return sql(Object.assign([query], { raw: [query] }));
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

async function appliedSet(sql) {
  const rows = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
  return new Set(rows.map((r) => r.filename));
}

function sqlFiles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

/** Apply every pending migration in filename order; stop at the first failure. */
export async function runMigrations({ sql, dir, log = console.log }) {
  await ensureMigrationsTable(sql);
  const applied = await appliedSet(sql);
  const newly = [];
  for (const file of sqlFiles(dir)) {
    if (applied.has(file)) {
      log(`[migrate] skip (already applied): ${file}`);
      continue;
    }
    log(`[migrate] applying: ${file}`);
    await rawSql(sql, readFileSync(join(dir, file), 'utf-8'));
    await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    newly.push(file);
    log(`[migrate] applied: ${file}`);
  }
  log(
    newly.length === 0
      ? '[migrate] all migrations already applied'
      : `[migrate] applied ${newly.length} migration(s)`
  );
  return newly;
}

/** Which migrations are applied and which are pending; writes nothing but the tracking table. */
export async function migrationStatus({ sql, dir }) {
  await ensureMigrationsTable(sql);
  const applied = await appliedSet(sql);
  const files = sqlFiles(dir);
  return {
    applied: files.filter((f) => applied.has(f)),
    pending: files.filter((f) => !applied.has(f)),
  };
}

/**
 * The CLI both apps call: `node --env-file=.env.local <cli> migrate|status`.
 * Order matters: the private folder is resolved FIRST, then `DATABASE_URL`, so a missing
 * folder stops the run before anything connects.
 *
 * @param {{ app: 'web' | 'sandbox', repoRoot: string, neon: (url: string) => Function,
 *   argv?: string[], env?: Record<string, string | undefined> }} options
 */
export async function runCli({ app, repoRoot, neon, argv = process.argv, env = process.env }) {
  const mode = argv[2] ?? 'status';
  if (mode !== 'migrate' && mode !== 'status')
    throw new Error(`[migrate] unknown mode '${mode}'; use migrate | status`);
  const found = migrationsDir(repoRoot, app, env);
  if (!found.dir) throw new Error(`[migrate] cannot run: ${found.problem}`);
  if (!env.DATABASE_URL)
    throw new Error(`[migrate] DATABASE_URL is not set (expected in apps/${app}/.env.local)`);
  const sql = neon(env.DATABASE_URL);
  if (mode === 'migrate') return runMigrations({ sql, dir: found.dir });
  const status = await migrationStatus({ sql, dir: found.dir });
  console.log(JSON.stringify(status, null, 2));
  return status;
}
