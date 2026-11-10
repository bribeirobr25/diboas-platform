/**
 * The weekly pipeline's file locations, in one place (plan MP-3a, `5.300`).
 *
 * Every script and test that needs the repository root, the shared run outputs, the run
 * archive or the committed monthly prices imports them from here. `providers/inrepo.mjs`
 * keeps only the Bitcoin candle functions (they stay until the old path is deleted, MP-4c).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../../../../..');
/** The weekly run's shared outputs (all views read these; 5.92). */
export const SHARED_DIR = path.join(REPO_ROOT, 'apps/web/data/market/shared');
/** The run archive (provenance of every published run day), written by `run.mjs`. */
export const RUN_ARCHIVE_PATH = path.join(SHARED_DIR, 'run-archive.jsonl');
/** The committed monthly series the Money Tools and the score read. */
export const MONTHLY_PRICES_PATH = path.join(
  REPO_ROOT,
  'apps/web/src/lib/market-data/data/monthlyPrices.json'
);
