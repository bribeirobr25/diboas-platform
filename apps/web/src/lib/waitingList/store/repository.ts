/**
 * Waitlist entry repository — read + write CRUD for `waitlist_entries`.
 *
 * PII (email, name) is encrypted with AES-256-GCM before INSERT.
 * Lookups use HMAC-SHA256 blind index (`email_hash`) for deterministic search.
 *
 * Why two columns for email?
 * - `email`:      AES-256-GCM encrypted (random IV → non-deterministic, for storage)
 * - `email_hash`: HMAC-SHA256 (deterministic, for WHERE clauses)
 *
 * All functions are async — callers must await.
 */

import { sql } from '@/lib/database/client';
import { encrypt } from '@/lib/security/encryption';
import { Logger } from '@/lib/monitoring/Logger';
import { ApplicationEventType } from '@/lib/events/applicationEventTypes';
import { DuplicateEntryError, EncryptionUnavailableError } from '@/lib/errors/domainErrors';
import { nextEntryId, nextPosition } from '../counterManager';
import { determineTier } from '../tierDeterminer';
import type { AddEntryInput, WaitlistEntry } from './types';
import {
  emailHash,
  rowToEntry,
  validateRow,
  validateRows,
  executeOptimisticUpdate,
  emitStoreEvent,
} from './internals';

// ---------------------------------------------------------------------------
// Reads
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

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function addEntry(input: AddEntryInput): Promise<WaitlistEntry> {
  const emailNorm = input.email.toLowerCase().trim();
  const hash = emailHash(emailNorm);
  const emailEnc = encrypt(emailNorm);
  const nameEnc = input.name ? encrypt(input.name) : null;

  if (!hash || !emailEnc) throw new EncryptionUnavailableError();

  // Early duplicate check via blind index — fast path, avoids counter
  // allocation for known duplicates.
  const dup = await sql`
    SELECT 1 FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1
  `;
  if (dup.length > 0) throw new DuplicateEntryError();

  // Look up referrer if invite code provided.
  let referrer: WaitlistEntry | undefined;
  if (input.referredBy) {
    referrer = await getByReferralCode(input.referredBy);
  }

  const tier = await determineTier(referrer, input.source);

  // Counter allocation — atomic per-counter but consumed before INSERT.
  // KNOWN TRADE-OFF: if a concurrent duplicate slips past the SELECT above
  // and hits the UNIQUE constraint below, the position is wasted (gap).
  // Acceptable: gaps are cosmetic, idempotency + rate limiting make
  // concurrent duplicates rare in practice.
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
    // Concurrent INSERT race: UNIQUE constraint on email_hash (Postgres 23505).
    // Position gap is logged for monitoring — see STABILITY_AUDIT_2026-04-26.md F1.
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      Logger.info('[Waitlist] Concurrent duplicate detected after counter allocation', {
        position,
      });
      throw new DuplicateEntryError('Entry already exists');
    }
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

export async function updateEntry(
  email: string,
  updates: Partial<Omit<WaitlistEntry, 'id' | 'email' | 'originalPosition' | 'createdAt' | 'tier'>>,
  currentVersion?: number
): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(email);
  if (!hash) return undefined;

  const now = new Date().toISOString();
  const nameEnc = updates.name !== undefined ? encrypt(updates.name) : null;

  const query =
    currentVersion !== undefined
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
    hash,
    query,
    currentVersion,
    'Concurrent modification detected: entry was updated by another request'
  );
  if (!row) return undefined;

  const updatedEntry = rowToEntry(row);
  emitStoreEvent(ApplicationEventType.WAITLIST_POSITION_UPDATED, {
    metadata: { entryId: updatedEntry.id, hasPositionChange: updates.position !== undefined },
  });
  return updatedEntry;
}

export async function addTags(
  email: string,
  newTags: string[]
): Promise<WaitlistEntry | undefined> {
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
