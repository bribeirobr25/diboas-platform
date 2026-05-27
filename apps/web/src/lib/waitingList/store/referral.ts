/**
 * Referral processing — increment a referrer's invite count.
 *
 * Guards (enforced in SQL WHERE clause):
 *   - Referrer must be founding_member or early_member
 *   - Referrer must have used fewer than INVITE_LIMIT (5) invites
 *
 * Position bump is no longer applied (the tier system replaces
 * position-based rewards).
 */

import { sql } from '@/lib/database/client';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { ApplicationEventType } from '@/lib/events/applicationEventTypes';
import { INVITE_LIMIT, type WaitlistEntry } from './types';
import { emailHash, rowToEntry, executeOptimisticUpdate, emitStoreEvent } from './internals';

export async function processReferral(
  referrerEmail: string,
  currentVersion?: number
): Promise<WaitlistEntry | undefined> {
  const hash = emailHash(referrerEmail);
  if (!hash) return undefined;

  const now = new Date().toISOString();

  const query =
    currentVersion !== undefined
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
    hash,
    query,
    currentVersion,
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
