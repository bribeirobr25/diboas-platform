/**
 * `idempotency_cache`: expired replayed responses (a signup's holds the person's referral code)
 * (`5.825`, P14 E1). Uses the same comparison as the reads (`expires_at > NOW()`), so nothing a
 * read would still use is deleted. Replaces the uncalled `dbCleanupIdempotencyCache`; a failure
 * throws to the job, never swallowed.
 */
import type { Purge } from './types';

export const idempotencyCachePurge: Purge = {
  name: 'idempotencyCache',
  async run(query) {
    const rows = await query`
      DELETE FROM idempotency_cache WHERE expires_at <= NOW() RETURNING 1
    `;
    return { count: rows.length };
  },
};
