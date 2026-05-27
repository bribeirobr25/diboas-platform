/**
 * Migration Runner
 *
 * Idempotent migration execution with tracking via a `schema_migrations` table.
 * Each migration is recorded by filename after successful execution.
 * Re-running is safe — already-applied migrations are skipped.
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

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

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
