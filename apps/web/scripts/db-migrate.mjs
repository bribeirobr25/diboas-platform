/**
 * Website (diboas.com) migration CLI — a thin wrapper over the shared runner.
 *
 *   pnpm --filter web db:migrate   (node --env-file=.env.local scripts/db-migrate.mjs migrate)
 *   pnpm --filter web db:status
 *
 * The migrations live only in the private `diboas-docs` checkout, `ops/db-migrations/web/`
 * (register `5.709`). Every rule (one statement per file, tracking by filename, independent
 * idempotency, no folder = no run) lives in `scripts/lib/migrate-runner.mjs`. This replaced
 * `src/lib/database/migrate.ts`, whose `tsx` launcher was never installed here (2026-10-30).
 */

import { neon } from '@neondatabase/serverless';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from '../../../scripts/lib/migrate-runner.mjs';

runCli({
  app: 'web',
  repoRoot: resolve(dirname(fileURLToPath(import.meta.url)), '../../..'),
  neon,
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
