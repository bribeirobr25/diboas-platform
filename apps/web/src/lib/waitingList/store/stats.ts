/**
 * Aggregate stats + email opt-out + test fixtures.
 *
 * Read-only counts (founding-member status, totals, distinct countries),
 * the email-opt-out toggle pair (used by the welcome / referral-success
 * email senders to honour unsubscribes), and the destructive `clearStore`
 * helper used only by tests.
 */

import { sql } from '@/lib/database/client';
import { getFoundingMemberStatus, sourceToAudience } from '../counterManager';
import type { WaitlistSource } from './types';

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Email opt-out
// ---------------------------------------------------------------------------

/**
 * Check whether a user has opted out of emails. Used before sending
 * marketing emails (welcome, referral-success). Opt-out status is
 * query-only — not part of the WaitlistEntry domain model.
 */
export async function checkEmailOptOut(emailHash: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM waitlist_entries
    WHERE email_hash = ${emailHash} AND email_opted_out = TRUE
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Reset email opt-out for a user who re-submits their email to the
 * waitlist. Re-submitting is explicit consent to receive emails
 * (GDPR Art. 7). Idempotent: the WHERE clause prevents a no-op write
 * when the user wasn't opted out.
 */
export async function resetEmailOptOut(emailHash: string): Promise<boolean> {
  const now = new Date().toISOString();
  const rows = await sql`
    UPDATE waitlist_entries
    SET email_opted_out = FALSE, updated_at = ${now}
    WHERE email_hash = ${emailHash} AND email_opted_out = TRUE
    RETURNING id
  `;
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Test fixtures (NOT for production use)
// ---------------------------------------------------------------------------

/**
 * Wipe the entire waitlist + reset all counters. Tests only — never call
 * from production code paths.
 */
export async function clearStore(): Promise<void> {
  await sql`DELETE FROM waitlist_entries`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'position'`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'entry_id'`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'founding_member_count'`;
  await sql`UPDATE waitlist_counters SET value = 0 WHERE key = 'founding_member_count_b2b'`;
}
