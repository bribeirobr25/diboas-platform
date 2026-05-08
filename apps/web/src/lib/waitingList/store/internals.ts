/**
 * Internal helpers shared across the store sub-modules — row validation,
 * row mapping, deterministic email hashing, optimistic-update execution,
 * and lazy event emission.
 *
 * NOT a public API: nothing here is re-exported through the `store.ts`
 * barrel. Sibling modules (`repository.ts`, `referral.ts`, `stats.ts`)
 * import these helpers directly via `./internals`.
 */

import { sql } from '@/lib/database/client';
import { decrypt, hmacHash } from '@/lib/security/encryption';
import { ConcurrencyConflictError } from '@/lib/errors/domainErrors';
import { ApplicationEventType } from '@/lib/events/applicationEventTypes';
import type { WaitlistEntryRow } from '@/lib/database/schema';
import type { WaitlistEntry, WaitlistSource, WaitlistTier } from './types';

export function rowToEntry(row: WaitlistEntryRow): WaitlistEntry {
  return {
    id: row.id,
    email: decrypt(row.email) || row.email,
    name: row.name ? (decrypt(row.name) || row.name) : undefined,
    position: row.position,
    originalPosition: row.original_position,
    referralCode: row.referral_code,
    referredBy: row.referred_by || undefined,
    referralCount: row.referral_count,
    locale: row.locale,
    source: row.source as WaitlistSource,
    tags: row.tags || [],
    tier: row.tier as WaitlistTier,
    country: row.country || undefined,
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Compute the deterministic blind-index hash for email lookups.
 * Normalizes to lowercase + trim before hashing.
 */
export function emailHash(email: string): string | null {
  return hmacHash(email.toLowerCase().trim());
}

/**
 * Validate that a raw DB row has the required fields and correct types
 * for a WaitlistEntryRow. Throws a descriptive error on failure.
 */
export function validateRow(row: unknown): WaitlistEntryRow {
  if (!row || typeof row !== 'object') {
    throw new Error(`validateRow: expected an object, got ${typeof row}`);
  }
  const r = row as Record<string, unknown>;

  // Neon driver returns TIMESTAMPTZ as Date objects — normalize to ISO strings.
  for (const ts of ['created_at', 'updated_at'] as const) {
    if (r[ts] instanceof Date) {
      r[ts] = (r[ts] as Date).toISOString();
    }
  }

  const requiredStrings = [
    'id', 'email', 'email_hash', 'referral_code', 'locale',
    'source', 'tier', 'created_at', 'updated_at',
  ] as const;
  for (const field of requiredStrings) {
    if (typeof r[field] !== 'string') {
      throw new Error(`validateRow: expected string for "${field}", got ${typeof r[field]}`);
    }
  }

  const requiredNumbers = ['position', 'original_position', 'referral_count', 'version'] as const;
  for (const field of requiredNumbers) {
    if (typeof r[field] !== 'number') {
      throw new Error(`validateRow: expected number for "${field}", got ${typeof r[field]}`);
    }
  }

  if (!Array.isArray(r.tags)) {
    throw new Error(`validateRow: expected array for "tags", got ${typeof r.tags}`);
  }

  if (typeof r.gdpr_accepted !== 'boolean') {
    throw new Error(`validateRow: expected boolean for "gdpr_accepted", got ${typeof r.gdpr_accepted}`);
  }

  return r as unknown as WaitlistEntryRow;
}

export function validateRows(rows: unknown[]): WaitlistEntryRow[] {
  return rows.map(validateRow);
}

/**
 * Execute an UPDATE with optional optimistic locking. If `currentVersion`
 * is provided and no row matches, run a follow-up existence check to
 * distinguish "not found" from "version mismatch" — the latter throws
 * `ConcurrencyConflictError`.
 */
export async function executeOptimisticUpdate(
  hash: string,
  sqlQuery: ReturnType<typeof sql>,
  currentVersion: number | undefined,
  concurrencyErrorMsg: string,
  extraWhereCheck?: ReturnType<typeof sql>,
): Promise<WaitlistEntryRow | undefined> {
  const rows = await sqlQuery;
  if (rows.length > 0) return validateRow(rows[0]);

  if (currentVersion !== undefined) {
    const existsQuery = extraWhereCheck ?? sql`SELECT 1 FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1`;
    const existsRows = await existsQuery;
    if (existsRows.length > 0) {
      throw new ConcurrencyConflictError(concurrencyErrorMsg);
    }
  }
  return undefined;
}

/**
 * Lazily emit an application event via dynamic import to avoid the
 * circular dependency between the store and `ApplicationEventBus`.
 * Failures are swallowed — event emission must not break a store call.
 */
export function emitStoreEvent(
  eventType: ApplicationEventType,
  payload: Record<string, unknown>,
): void {
  import('@/lib/events/ApplicationEventBus')
    .then(({ applicationEventBus }) => {
      applicationEventBus.emit(eventType, {
        domain: 'waitlist',
        source: 'waitlist-store',
        timestamp: Date.now(),
        ...payload,
      });
    })
    .catch(() => {
      // Silent fail — event emission must not break store operations.
    });
}
