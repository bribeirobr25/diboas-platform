/**
 * Counter Manager
 *
 * Manages atomic counter operations for the waitlist system:
 * entry IDs, positions, and founding member caps.
 * Extracted from store.ts for single-responsibility compliance.
 */

import { sql } from '@/lib/database/client';
import type { WaitlistSource } from './store';

/** Counter key suffixes per source audience */
const COUNTER_KEYS = {
  b2c: { count: 'founding_member_count', cap: 'founding_member_cap' },
  b2b: { count: 'founding_member_count_b2b', cap: 'founding_member_cap_b2b' },
} as const;

export type Audience = keyof typeof COUNTER_KEYS;

/** Map a WaitlistSource to the audience for counter selection */
export function sourceToAudience(source: WaitlistSource | undefined): Audience {
  return source === 'landing_b2b' ? 'b2b' : 'b2c';
}

/**
 * Generate the next entry ID atomically.
 */
export async function nextEntryId(): Promise<string> {
  const rows = await sql`
    UPDATE waitlist_counters
    SET value = value + 1
    WHERE key = 'entry_id'
    RETURNING value
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  const counter = typeof row?.value === 'number' ? row.value : null;
  if (counter === null) {
    throw new Error('Failed to generate entry ID: counter row missing or invalid');
  }
  return `wl_${Date.now()}_${counter}`;
}

/**
 * Generate the next position atomically.
 */
export async function nextPosition(): Promise<number> {
  const rows = await sql`
    UPDATE waitlist_counters
    SET value = value + 1
    WHERE key = 'position'
    RETURNING value
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  const value = typeof row?.value === 'number' ? row.value : null;
  if (value === null) {
    throw new Error('Failed to generate position: counter row missing or invalid');
  }
  return value;
}

/**
 * Read the founding_member_count and founding_member_cap for a given audience.
 */
export async function getFoundingMemberStatus(
  audience: Audience = 'b2c'
): Promise<{ count: number; cap: number }> {
  const keys = COUNTER_KEYS[audience];
  const defaultCap = audience === 'b2b'
    ? parseInt(process.env.FOUNDING_MEMBER_CAP_B2B || '24', 10)
    : parseInt(process.env.FOUNDING_MEMBER_CAP || '1200', 10);

  const rows = await sql`
    SELECT key, value FROM waitlist_counters
    WHERE key IN (${keys.count}, ${keys.cap})
  `;
  let count = 0;
  let cap = defaultCap;
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const rowKey = typeof row?.key === 'string' ? row.key : '';
    const rowValue = typeof row?.value === 'number' ? row.value : 0;
    if (rowKey === keys.count) count = rowValue;
    if (rowKey === keys.cap) cap = rowValue;
  }
  return { count, cap };
}

/**
 * Atomically increment founding_member_count and return new value.
 * Returns the new count, or null if the counter was already at/above cap.
 */
export async function tryClaimFoundingSlot(audience: Audience = 'b2c'): Promise<number | null> {
  const keys = COUNTER_KEYS[audience];
  const rows = await sql`
    WITH cap AS (
      SELECT value FROM waitlist_counters WHERE key = ${keys.cap} FOR UPDATE
    )
    UPDATE waitlist_counters
    SET value = value + 1
    WHERE key = ${keys.count}
      AND value < (SELECT value FROM cap)
    RETURNING value
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  const value = typeof row?.value === 'number' ? row.value : null;
  return value;
}
