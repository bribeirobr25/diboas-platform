/**
 * `deletion_tokens`: expired links (each holds the person's encrypted address and its hash).
 * Replaces the one-in-ten reap that ran inside a deletion request (P14, E1).
 */
import type { Purge } from './types';

export const deletionTokensPurge: Purge = {
  name: 'deletionTokens',
  async run(query) {
    const rows = await query`
      DELETE FROM deletion_tokens WHERE expires_at < NOW() RETURNING 1
    `;
    return { count: rows.length };
  },
};
