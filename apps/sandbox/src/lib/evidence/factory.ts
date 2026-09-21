/**
 * Evidence STORE selection — which adapter persists, never which source
 * produces.
 *
 * ⚑ `EVIDENCE STORE SELECTION` != `PROVIDER / SOURCE SELECTION`. Which adapter
 * writes evidence is an F question and lives here. Which source produces
 * evidence is a G question and lives in `lib/market/factory.ts`. The two must
 * not share vocabulary, or the F/G boundary canon draws gets re-blurred in
 * implementation.
 *
 * ⚑ THE FORBIDDEN TRANSLATION IS UNEXPRESSIBLE. The return type is a
 * discriminated union, so there is no value in which a caller holds a store AND
 * a reason:
 *
 * ```text
 * durable store unavailable -> InMemory -> "persistence succeeded"   IMPOSSIBLE
 * ```
 *
 * `InMemoryEvidenceStore` is never constructed here. It lives in
 * `@diboas/defi`'s `testing.ts` and is instantiated only by tests. When durable
 * persistence cannot run, ingestion is INACTIVE and existing Product behaviour
 * continues unchanged — a disabled state is preferable to a fake durable one.
 *
 * Selection is by environment presence, the `lib/auth/factory.ts` pattern, and
 * the opt-in is STRICT (`=== 'true'`) for the same reason `SANDBOX_PUBLIC_ACCESS`
 * is: `TRUE`, `1` and `' true'` must all leave it shut.
 */

import type { EvidenceStore } from '@diboas/defi';
import { sql } from '../database/client';
import { PostgresEvidenceStore } from './PostgresEvidenceStore';

export type PersistenceDisabledReason =
  /** The opt-in flag is absent or not exactly `'true'`. */
  | 'NOT_CONFIGURED'
  /** The flag is on but no database is configured to write to. */
  | 'NO_DATABASE_URL';

export type EvidencePersistence =
  { enabled: true; store: EvidenceStore } | { enabled: false; reason: PersistenceDisabledReason };

let instance: EvidencePersistence | null = null;

/**
 * The one selection point. Memoised per process like the other factories, so
 * the decision is made once and cannot differ between two call sites.
 */
export function getEvidencePersistence(): EvidencePersistence {
  if (instance) return instance;
  if (process.env.SANDBOX_EVIDENCE_PERSISTENCE !== 'true') {
    instance = { enabled: false, reason: 'NOT_CONFIGURED' };
    return instance;
  }
  if (!process.env.DATABASE_URL) {
    instance = { enabled: false, reason: 'NO_DATABASE_URL' };
    return instance;
  }
  instance = { enabled: true, store: new PostgresEvidenceStore(sql) };
  return instance;
}

/** Test-only: drop the memoised decision (mirrors `__resetMarketProviders`). */
export function __resetEvidencePersistence(): void {
  instance = null;
}
