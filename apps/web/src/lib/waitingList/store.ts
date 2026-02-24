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
import type { WaitlistEntryRow } from '@/lib/database/schema';

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

async function nextEntryId(): Promise<string> {
  const rows = await sql`
    UPDATE waitlist_counters
    SET value = value + 1
    WHERE key = 'entry_id'
    RETURNING value
  `;
  const counter = (rows[0] as { value: number }).value;
  return `wl_${Date.now()}_${counter}`;
}

async function nextPosition(): Promise<number> {
  const rows = await sql`
    UPDATE waitlist_counters
    SET value = value + 1
    WHERE key = 'position'
    RETURNING value
  `;
  return (rows[0] as { value: number }).value;
}

/**
 * Read the founding_member_count and founding_member_cap atomically.
 */
async function getFoundingMemberStatus(): Promise<{ count: number; cap: number }> {
  const rows = await sql`
    SELECT key, value FROM waitlist_counters
    WHERE key IN ('founding_member_count', 'founding_member_cap')
  `;
  let count = 0;
  let cap = 1200;
  for (const row of rows as unknown as { key: string; value: number }[]) {
    if (row.key === 'founding_member_count') count = row.value;
    if (row.key === 'founding_member_cap') cap = row.value;
  }
  return { count, cap };
}

/**
 * Atomically increment founding_member_count and return new value.
 * Returns the new count, or null if the counter was already at/above cap.
 */
async function tryClaimFoundingSlot(): Promise<number | null> {
  const rows = await sql`
    UPDATE waitlist_counters
    SET value = value + 1
    WHERE key = 'founding_member_count'
      AND value < (SELECT value FROM waitlist_counters WHERE key = 'founding_member_cap')
    RETURNING value
  `;
  return rows.length > 0 ? (rows[0] as { value: number }).value : null;
}

/**
 * Determine the tier for a new signup based on referral context and cap status.
 *
 * Rules:
 * | Scenario                                                        | Tier              |
 * |----------------------------------------------------------------|-------------------|
 * | No referral + cap not full                                      | founding_member   |
 * | No referral + cap full                                          | priority_waitlist |
 * | Valid referral + referrer is founder/early_member + invites < 5 + cap not full | founding_member |
 * | Valid referral + referrer is founder/early_member + invites < 5 + cap full     | early_member    |
 * | Valid referral + referrer has ≥ 5 invites                       | priority_waitlist |
 * | Valid referral + referrer is standard/priority_waitlist          | standard          |
 */
async function determineTier(referrer: WaitlistEntry | undefined): Promise<WaitlistTier> {
  // Referrer exists — check their tier and invite count
  if (referrer) {
    const referrerCanInvite =
      (referrer.tier === 'founding_member' || referrer.tier === 'early_member') &&
      referrer.referralCount < INVITE_LIMIT;

    if (!referrerCanInvite) {
      // Referrer is standard/priority_waitlist, or has used all 5 invites
      if (referrer.tier === 'standard' || referrer.tier === 'priority_waitlist') {
        return 'standard';
      }
      // Founder/early_member with ≥ 5 invites
      return 'priority_waitlist';
    }

    // Referrer can invite — try to claim a founding slot
    const claimed = await tryClaimFoundingSlot();
    return claimed !== null ? 'founding_member' : 'early_member';
  }

  // No referrer — direct signup
  const claimed = await tryClaimFoundingSlot();
  return claimed !== null ? 'founding_member' : 'priority_waitlist';
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before, but async
// ---------------------------------------------------------------------------

export async function getAllEntries(): Promise<WaitlistEntry[]> {
  const rows = await sql`SELECT * FROM waitlist_entries ORDER BY position`;
  return (rows as unknown as WaitlistEntryRow[]).map(rowToEntry);
}

export async function getByEmail(email: string): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(email);
  if (!hash) return undefined;

  const rows = await sql`
    SELECT * FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1
  `;
  if (rows.length === 0) return undefined;
  return rowToEntry(rows[0] as unknown as WaitlistEntryRow);
}

export async function getById(id: string): Promise<WaitlistEntry | undefined> {
  const rows = await sql`
    SELECT * FROM waitlist_entries WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return undefined;
  return rowToEntry(rows[0] as unknown as WaitlistEntryRow);
}

export async function getByReferralCode(referralCode: string): Promise<WaitlistEntry | undefined> {
  const code = referralCode.toUpperCase();
  const rows = await sql`
    SELECT * FROM waitlist_entries WHERE referral_code = ${code} LIMIT 1
  `;
  if (rows.length === 0) return undefined;
  return rowToEntry(rows[0] as unknown as WaitlistEntryRow);
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

  if (!hash || !emailEnc) throw new Error('Encryption unavailable');

  // Check duplicate via blind index
  const dup = await sql`
    SELECT 1 FROM waitlist_entries WHERE email_hash = ${hash} LIMIT 1
  `;
  if (dup.length > 0) throw new Error('Email already exists');

  // Look up referrer if invite code provided
  let referrer: WaitlistEntry | undefined;
  if (input.referredBy) {
    referrer = await getByReferralCode(input.referredBy);
  }

  // Determine tier based on referrer context and cap
  const tier = await determineTier(referrer);

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
    if (pgError.code === '23505') throw new Error('Email already exists');
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
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };
}

export async function updateEntry(
  email: string,
  updates: Partial<Omit<WaitlistEntry, 'id' | 'email' | 'originalPosition' | 'createdAt' | 'tier'>>
): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(email);
  if (!hash) return undefined;

  const now = new Date().toISOString();

  const rows = await sql`
    UPDATE waitlist_entries SET
      position = COALESCE(${updates.position ?? null}::integer, position),
      referral_count = COALESCE(${updates.referralCount ?? null}::integer, referral_count),
      tags = COALESCE(${updates.tags ?? null}::text[], tags),
      locale = COALESCE(${updates.locale ?? null}::text, locale),
      source = COALESCE(${updates.source ?? null}::text, source),
      name = COALESCE(${updates.name !== undefined ? encrypt(updates.name) : null}::text, name),
      country = COALESCE(${updates.country ?? null}::text, country),
      updated_at = ${now}
    WHERE email_hash = ${hash}
    RETURNING *
  `;

  if (rows.length === 0) return undefined;
  return rowToEntry(rows[0] as unknown as WaitlistEntryRow);
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
  referrerEmail: string
): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(referrerEmail);
  if (!hash) return undefined;

  const rows = await sql`
    UPDATE waitlist_entries SET
      referral_count = referral_count + 1,
      updated_at = ${new Date().toISOString()}
    WHERE email_hash = ${hash}
      AND tier IN ('founding_member', 'early_member')
      AND referral_count < ${INVITE_LIMIT}
    RETURNING *
  `;

  if (rows.length === 0) return undefined;
  return rowToEntry(rows[0] as unknown as WaitlistEntryRow);
}

export async function getFoundingMemberCount(): Promise<{ count: number; cap: number }> {
  return getFoundingMemberStatus();
}

export async function getCurrentPositionCounter(): Promise<number> {
  const rows = await sql`
    SELECT value FROM waitlist_counters WHERE key = 'position'
  `;
  return rows.length > 0 ? (rows[0] as { value: number }).value : 0;
}

export async function getTotalCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::integer AS count FROM waitlist_entries`;
  return (rows[0] as { count: number }).count;
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
  return rowToEntry(rows[0] as unknown as WaitlistEntryRow);
}

export async function deleteByEmail(email: string): Promise<boolean> {
  const hash = emailHash(email);
  if (!hash) return false;

  const rows = await sql`
    DELETE FROM waitlist_entries WHERE email_hash = ${hash} RETURNING id
  `;

  if (rows.length > 0) {
    Logger.info('[Waitlist] Entry deleted for GDPR request');
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
}
