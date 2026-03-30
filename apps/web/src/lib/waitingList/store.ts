/**
 * Waitlist Store
 *
 * Persistent store backed by Neon PostgreSQL.
 * PII (email, name) is encrypted with AES-256-GCM before INSERT.
 * Lookups use HMAC-SHA256 blind index (`email_hash`) for deterministic search.
 *
 * Why two columns for email?
 * - `email`: AES-256-GCM encrypted (random IV → non-deterministic, for storage)
 * - `email_hash`: HMAC-SHA256 (deterministic, for WHERE clauses)
 *
 * Tier system (determined at signup, permanent):
 * - founding_member:   first 1200 direct signups (or invited while cap not full)
 * - early_member:      invited by founder/early_member after cap is full
 * - priority_waitlist: signed up after cap is full with no invite, or referrer at invite limit
 * - standard:          invited by standard/priority_waitlist tier
 *
 * All functions are async — callers must await.
 */

import { sql } from '@/lib/database/client';
import { encrypt, decrypt, hmacHash } from '@/lib/security/encryption';
import { Logger } from '@/lib/monitoring/Logger';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { ApplicationEventType } from '@/lib/events/applicationEventTypes';
import {
  DuplicateEntryError,
  ConcurrencyConflictError,
  EncryptionUnavailableError,
} from '@/lib/errors/domainErrors';

/**
 * Lazily emit an application event via dynamic import to avoid circular dependencies.
 */
function emitStoreEvent(eventType: ApplicationEventType, payload: Record<string, unknown>): void {
  import('@/lib/events/ApplicationEventBus').then(({ applicationEventBus }) => {
    applicationEventBus.emit(eventType, {
      source: 'waitlist-store',
      timestamp: Date.now(),
      ...payload,
    });
  }).catch(() => {
    // Silent fail — event emission must not break store operations
  });
}
import type { WaitlistEntryRow } from '@/lib/database/schema';
import {
  nextEntryId,
  nextPosition,
  getFoundingMemberStatus,
  sourceToAudience,
} from './counterManager';
import { determineTier } from './tierDeterminer';

/**
 * WaitlistEntry type - Full spec-compliant model
 */
export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  position: number;
  originalPosition: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  locale: string;
  source: WaitlistSource;
  tags: string[];
  tier: WaitlistTier;
  country?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WaitlistTier =
  | 'founding_member'
  | 'early_member'
  | 'priority_waitlist'
  | 'standard';

export type WaitlistSource =
  | 'landing_b2c'
  | 'landing_b2b'
  | 'interactive_demo'
  | 'dream_mode'
  | 'calculator'
  | 'referral'
  | 'direct';

/** Max invites per founding_member or early_member */
const INVITE_LIMIT = 5;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rowToEntry(row: WaitlistEntryRow): WaitlistEntry {
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
 * Compute the deterministic hash for email lookups.
 * Normalizes to lowercase + trim before hashing.
 */
function emailHash(email: string): string | null {
  return hmacHash(email.toLowerCase().trim());
}

/**
 * Validate that a raw DB row has the required fields and correct types
 * for a WaitlistEntryRow. Throws a descriptive error on failure.
 */
function validateRow(row: unknown): WaitlistEntryRow {
  if (!row || typeof row !== 'object') {
    throw new Error(`validateRow: expected an object, got ${  typeof row}`);
  }
  const r = row as Record<string, unknown>;

  const requiredStrings = ['id', 'email', 'email_hash', 'referral_code', 'locale', 'source', 'tier', 'created_at', 'updated_at'] as const;
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

/**
 * Validate an array of raw DB rows.
 */
function validateRows(rows: unknown[]): WaitlistEntryRow[] {
  return rows.map(validateRow);
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before, but async
// ---------------------------------------------------------------------------

export async function getAllEntries(): Promise<WaitlistEntry[]> {
  const rows = await sql`SELECT * FROM waitlist_entries ORDER BY position`;
  return validateRows(rows).map(rowToEntry);
}

export async function getByEmail(email: string): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(email);
  if (!hash) return undefined;

  const rows = await sql`
    SELECT * FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1
  `;
  if (rows.length === 0) return undefined;
  return rowToEntry(validateRow(rows[0]));
}

export async function getById(id: string): Promise<WaitlistEntry | undefined> {
  const rows = await sql`
    SELECT * FROM waitlist_entries WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return undefined;
  return rowToEntry(validateRow(rows[0]));
}

export async function getByReferralCode(referralCode: string): Promise<WaitlistEntry | undefined> {
  const code = referralCode.toUpperCase();
  const rows = await sql`
    SELECT * FROM waitlist_entries WHERE referral_code = ${code} LIMIT 1
  `;
  if (rows.length === 0) return undefined;
  return rowToEntry(validateRow(rows[0]));
}

export async function exists(email: string): Promise<boolean> {
  const hash = emailHash(email);
  if (!hash) return false;

  const rows = await sql`
    SELECT 1 FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1
  `;
  return rows.length > 0;
}

export interface AddEntryInput {
  email: string;
  name?: string;
  referralCode: string;
  referredBy?: string;
  locale: string;
  source?: WaitlistSource;
  tags?: string[];
  country?: string;
}

export async function addEntry(input: AddEntryInput): Promise<WaitlistEntry> {
  const emailNorm = input.email.toLowerCase().trim();
  const hash = emailHash(emailNorm);
  const emailEnc = encrypt(emailNorm);
  const nameEnc = input.name ? encrypt(input.name) : null;

  if (!hash || !emailEnc) throw new EncryptionUnavailableError();

  // Check duplicate via blind index
  const dup = await sql`
    SELECT 1 FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1
  `;
  if (dup.length > 0) throw new DuplicateEntryError();

  // Look up referrer if invite code provided
  let referrer: WaitlistEntry | undefined;
  if (input.referredBy) {
    referrer = await getByReferralCode(input.referredBy);
  }

  // Determine tier based on referrer context, cap, and source audience
  const tier = await determineTier(referrer, input.source);

  const [id, position] = await Promise.all([nextEntryId(), nextPosition()]);
  const now = new Date().toISOString();
  const source = input.source || 'direct';
  const tags = input.tags || [];

  try {
    await sql`
      INSERT INTO waitlist_entries
        (id, email, email_hash, name, position, original_position, referral_code,
         referred_by, referral_count, locale, source, tags, gdpr_accepted,
         tier, country, created_at, updated_at)
      VALUES
        (${id}, ${emailEnc}, ${hash}, ${nameEnc}, ${position}, ${position},
         ${input.referralCode}, ${input.referredBy || null}, 0,
         ${input.locale}, ${source}, ${tags}, true,
         ${tier}, ${input.country || null}, ${now}, ${now})
    `;
  } catch (error: unknown) {
    // Handle concurrent INSERT race: UNIQUE constraint on email_hash (PostgreSQL 23505)
    const pgError = error as { code?: string };
    if (pgError.code === '23505') throw new DuplicateEntryError('Entry already exists');
    throw error;
  }

  return {
    id,
    email: emailNorm,
    name: input.name,
    position,
    originalPosition: position,
    referralCode: input.referralCode,
    referredBy: input.referredBy,
    referralCount: 0,
    locale: input.locale,
    source,
    tags,
    tier,
    country: input.country,
    version: 1,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

/**
 * Execute an UPDATE with optional optimistic locking.
 * If currentVersion is provided and no row matches, checks whether the row exists
 * to distinguish "not found" from "version mismatch".
 */
async function executeOptimisticUpdate(
  hash: string,
  sqlQuery: ReturnType<typeof sql>,
  currentVersion: number | undefined,
  concurrencyErrorMsg: string,
  extraWhereCheck?: ReturnType<typeof sql>
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

export async function updateEntry(
  email: string,
  updates: Partial<Omit<WaitlistEntry, 'id' | 'email' | 'originalPosition' | 'createdAt' | 'tier'>>,
  currentVersion?: number
): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(email);
  if (!hash) return undefined;

  const now = new Date().toISOString();
  const nameEnc = updates.name !== undefined ? encrypt(updates.name) : null;

  const query = currentVersion !== undefined
    ? sql`
        UPDATE waitlist_entries SET
          position = COALESCE(${updates.position ?? null}::integer, position),
          referral_count = COALESCE(${updates.referralCount ?? null}::integer, referral_count),
          tags = COALESCE(${updates.tags ?? null}::text[], tags),
          locale = COALESCE(${updates.locale ?? null}::text, locale),
          source = COALESCE(${updates.source ?? null}::text, source),
          name = COALESCE(${nameEnc}::text, name),
          country = COALESCE(${updates.country ?? null}::text, country),
          version = version + 1,
          updated_at = ${now}
        WHERE email_hash = ${hash} AND version = ${currentVersion}
        RETURNING *`
    : sql`
        UPDATE waitlist_entries SET
          position = COALESCE(${updates.position ?? null}::integer, position),
          referral_count = COALESCE(${updates.referralCount ?? null}::integer, referral_count),
          tags = COALESCE(${updates.tags ?? null}::text[], tags),
          locale = COALESCE(${updates.locale ?? null}::text, locale),
          source = COALESCE(${updates.source ?? null}::text, source),
          name = COALESCE(${nameEnc}::text, name),
          country = COALESCE(${updates.country ?? null}::text, country),
          version = version + 1,
          updated_at = ${now}
        WHERE email_hash = ${hash}
        RETURNING *`;

  const row = await executeOptimisticUpdate(
    hash, query, currentVersion,
    'Concurrent modification detected: entry was updated by another request'
  );
  if (!row) return undefined;

  const updatedEntry = rowToEntry(row);
  emitStoreEvent(ApplicationEventType.WAITLIST_POSITION_UPDATED, {
    metadata: { entryId: updatedEntry.id, hasPositionChange: updates.position !== undefined },
  });
  return updatedEntry;
}

/**
 * Process an invite/referral: increment referrer's count.
 *
 * Guards:
 * - Referrer must be founding_member or early_member
 * - Referrer must have < 5 invites used
 *
 * Position bump is no longer applied (tier system replaces position-based rewards).
 */
export async function processReferral(
  referrerEmail: string,
  currentVersion?: number
): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(referrerEmail);
  if (!hash) return undefined;

  const now = new Date().toISOString();

  const query = currentVersion !== undefined
    ? sql`
        UPDATE waitlist_entries SET
          referral_count = referral_count + 1,
          version = version + 1,
          updated_at = ${now}
        WHERE email_hash = ${hash}
          AND tier IN ('founding_member', 'early_member')
          AND referral_count < ${INVITE_LIMIT}
          AND version = ${currentVersion}
        RETURNING *`
    : sql`
        UPDATE waitlist_entries SET
          referral_count = referral_count + 1,
          version = version + 1,
          updated_at = ${now}
        WHERE email_hash = ${hash}
          AND tier IN ('founding_member', 'early_member')
          AND referral_count < ${INVITE_LIMIT}
        RETURNING *`;

  const tierCheck = sql`
    SELECT 1 FROM waitlist_entries
    WHERE email_hash = ${hash}
      AND tier IN ('founding_member', 'early_member')
      AND referral_count < ${INVITE_LIMIT}
    LIMIT 1`;

  const row = await executeOptimisticUpdate(
    hash, query, currentVersion,
    'Concurrent modification detected: referral entry was updated by another request',
    tierCheck
  );
  if (!row) return undefined;

  const referralEntry = rowToEntry(row);
  emitStoreEvent(ApplicationEventType.WAITLIST_REFERRAL_USED, {
    metadata: { referrerId: referralEntry.id, referralCount: referralEntry.referralCount },
  });

  // Audit trail (fire-and-forget)
  logAuditEvent({
    eventType: 'waitlist.referral.processed',
    entityType: 'waitlist_entry',
    entityId: referralEntry.id,
    details: { referralCount: referralEntry.referralCount, tier: referralEntry.tier },
  });

  return referralEntry;
}

export async function getFoundingMemberCount(
  source?: WaitlistSource
): Promise<{ count: number; cap: number }> {
  return getFoundingMemberStatus(sourceToAudience(source));
}

export async function getCurrentPositionCounter(): Promise<number> {
  const rows = await sql`
    SELECT value FROM waitlist_counters WHERE key = 'position'
  `;
  if (rows.length === 0) return 0;
  const row = rows[0] as Record<string, unknown> | undefined;
  return typeof row?.value === 'number' ? row.value : 0;
}

async function extractCount(query: ReturnType<typeof sql>): Promise<number> {
  const rows = await query;
  const row = rows[0] as Record<string, unknown> | undefined;
  return typeof row?.count === 'number' ? row.count : 0;
}

export async function getTotalCount(source?: WaitlistSource): Promise<number> {
  return extractCount(
    source
      ? sql`SELECT COUNT(*)::integer AS count FROM waitlist_entries WHERE source = ${source}`
      : sql`SELECT COUNT(*)::integer AS count FROM waitlist_entries`
  );
}

export async function getDistinctCountryCount(source?: WaitlistSource): Promise<number> {
  return extractCount(
    source
      ? sql`SELECT COUNT(DISTINCT country)::integer AS count FROM waitlist_entries WHERE country IS NOT NULL AND source = ${source}`
      : sql`SELECT COUNT(DISTINCT country)::integer AS count FROM waitlist_entries WHERE country IS NOT NULL`
  );
}

export async function addTags(email: string, newTags: string[]): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(email);
  if (!hash) return undefined;

  const rows = await sql`
    UPDATE waitlist_entries SET
      tags = (
        SELECT ARRAY(SELECT DISTINCT unnest(tags || ${newTags}::text[]))
      ),
      updated_at = ${new Date().toISOString()}
    WHERE email_hash = ${hash}
    RETURNING *
  `;

  if (rows.length === 0) return undefined;
  return rowToEntry(validateRow(rows[0]));
}

export async function deleteByEmail(email: string): Promise<boolean> {
  const hash = emailHash(email);
  if (!hash) return false;

  const rows = await sql`
    DELETE FROM waitlist_entries WHERE email_hash = ${hash} RETURNING id
  `;

  if (rows.length > 0) {
    Logger.info('[Waitlist] Entry deleted for GDPR request');
    emitStoreEvent(ApplicationEventType.WAITLIST_DELETION_COMPLETED, {
      reason: 'gdpr',
      metadata: { method: 'store_deleteByEmail' },
    });
    return true;
  }
  return false;
}

/**
 * Clear store (for testing only)
 */
export async function clearStore(): Promise<void> {
  await sql`DELETE FROM waitlist_entries`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'position'`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'entry_id'`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'founding_member_count'`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'founding_member_count_b2b'`;
}
