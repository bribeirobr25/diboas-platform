/**
 * Practice (sandbox) migration CLI — a thin wrapper over the shared runner.
 *
 *   pnpm --filter sandbox db:migrate   (node --env-file=.env.local src/lib/database/migrate.mjs migrate)
 *   pnpm --filter sandbox db:status
 *
 * Backs the sandbox's OWN Neon project (separate from the website database). The
 * migrations live only in the private `diboas-docs` checkout, `ops/db-migrations/sandbox/`
 * (register `5.709`). Every rule (one statement per file, tracking by filename, independent
 * idempotency, no folder = no run) lives in `scripts/lib/migrate-runner.mjs`.
 */

import { neon } from '@neondatabase/serverless';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from '../../../../../scripts/lib/migrate-runner.mjs';

runCli({
  app: 'sandbox',
  repoRoot: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..'),
  neon,
})
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
