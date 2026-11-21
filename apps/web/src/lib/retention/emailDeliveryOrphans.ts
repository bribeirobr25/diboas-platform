/**
 * `email_delivery_logs`: rows whose recipient has no waitlist entry — a send that finished after
 * its person's erasure (P14, E7′). One statement selects up to 26 candidates and deletes them
 * only when there are at most 25 and the waitlist is not empty: a key rotation or a hash drift
 * leaves the entries table full and makes every row an orphan, and the cap stops a mass delete.
 * At today's volume the cap guards against mass deletion, not slow drift; the job logs a
 * count-only warning whenever this purge deletes a row, so drift becomes visible.
 *
 * Assumes every recipient is a waitlist member (the four templates, one sender); guard 11 pins
 * that, so a future email to non-members fails until this purge is revisited.
 */
import { asCount, type Purge } from './types';

export const ORPHAN_SWEEP_MAX_ROWS = 25;

export const emailDeliveryOrphansPurge: Purge = {
  name: 'emailDeliveryOrphans',
  warnOnDelete: true,
  async run(query) {
    const rows = await query`
      WITH candidates AS (
        SELECT d.id FROM email_delivery_logs d
        WHERE NOT EXISTS (
          SELECT 1 FROM waitlist_entries w WHERE w.email_hash = d.recipient_hash
        )
        LIMIT ${ORPHAN_SWEEP_MAX_ROWS + 1}
      ),
      gate AS (
        SELECT (SELECT count(*) FROM candidates) <= ${ORPHAN_SWEEP_MAX_ROWS}
           AND EXISTS (SELECT 1 FROM waitlist_entries) AS open
      ),
      deleted AS (
        DELETE FROM email_delivery_logs
        WHERE id IN (SELECT id FROM candidates) AND (SELECT open FROM gate)
        RETURNING 1
      )
      SELECT
        (SELECT count(*) FROM deleted)::int AS deleted,
        (SELECT count(*) FROM candidates)::int AS candidates,
        (SELECT open FROM gate) AS open
    `;
    const row = rows[0] ?? {};
    const candidates = asCount(row.candidates);
    return { count: asCount(row.deleted), brakeTripped: candidates > 0 && row.open !== true };
  },
};
