/**
 * Migration Runner
 *
 * Idempotent migration execution with tracking via a `schema_migrations` table.
 * Each migration is recorded by filename after successful execution.
 * Re-running is safe — already-applied migrations are skipped.
 *
 * ⚑ THE MIGRATIONS ARE PRIVATE (founder 2026-10-30, register `5.709`). They live only in
 * the private `diboas-docs` checkout beside this repository, `ops/db-migrations/web/`,
 * resolved like every private doc (`scripts/lib/docs-root.mjs`, `DIBOAS_DOCS_DIR`). With
 * no such folder the runner STOPS before touching the database; it never reports "all
 * applied" over nothing. Filenames are the applied-migration keys: never rename one.
 *
 * Usage:
 *   npx tsx apps/web/src/lib/database/migrate.ts
 *
 * Or programmatically:
 *   import { runMigrations } from '@/lib/database/migrate';
 *   await runMigrations();
 */

import { sql, rawSql } from './client';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { migrationsDir } from '../../../../../scripts/lib/docs-root.mjs';

const REPO_ROOT = path.resolve(__dirname, '../../../../..');

/** The private migrations folder, or a thrown reason to stop before any database call. */
export function resolveMigrationsDir(
  env: Record<string, string | undefined> = process.env
): string {
  const found = migrationsDir(REPO_ROOT, 'web', env);
  if (!found.dir) throw new Error(`[migrate] cannot run: ${found.problem}`);
  return found.dir;
}

/**
 * Ensure the schema_migrations tracking table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
  await rawSql(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Get list of already-applied migration filenames.
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
  return new Set(rows.map((r) => r.filename as string));
}

/**
 * Run all pending migrations in order.
 * Returns the list of newly applied migration filenames.
 */
export async function runMigrations(): Promise<string[]> {
  const MIGRATIONS_DIR = resolveMigrationsDir();
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip (already applied): ${file}`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`[migrate] applying: ${file}`);
    try {
      await rawSql(content);
      await sql`INSERT INTO schema_migrations (filename) VALUES (${file})`;
      newlyApplied.push(file);
      console.log(`[migrate] applied: ${file}`);
    } catch (error) {
      console.error(`[migrate] FAILED: ${file}`, error);
      throw error; // Stop on first failure
    }
  }

  if (newlyApplied.length === 0) {
    console.log('[migrate] all migrations already applied');
  } else {
    console.log(`[migrate] applied ${newlyApplied.length} migration(s)`);
  }

  return newlyApplied;
}

/**
 * Get migration status: which are applied and which are pending.
 */
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
}> {
  const MIGRATIONS_DIR = resolveMigrationsDir();
  await ensureMigrationsTable();
  const appliedSet = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return {
    applied: files.filter((f) => appliedSet.has(f)),
    pending: files.filter((f) => !appliedSet.has(f)),
  };
}

// CLI entrypoint
const isDirectExecution = typeof require !== 'undefined' && require.main === module;

if (isDirectExecution) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] fatal error:', err);
      process.exit(1);
    });
}
