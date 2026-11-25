/**
 * Every table the website writes, and how its rows end (plan P14, E9; register `5.863`).
 *
 * A table holding personal data must have a purge (time-bound), an erasure (removed with the
 * person), or an exemption with its reason. `registry.test.ts` scans the source for
 * every `INSERT INTO` / `UPDATE` and fails on a table missing here, so a new table cannot be
 * added without answering the question.
 */
export interface TableRetention {
  /** Daily purges (names in `PURGES`). */
  purges?: readonly string[];
  /** Removed by `PrivacyPersonErasureService` when the person confirms a deletion link. */
  erasure?: boolean;
  /** Why the table needs neither. */
  exemption?: string;
  /** What is kept after erasure, and for how long (E11′). */
  keeps?: string;
}

export const RETENTION_REGISTRY: Readonly<Record<string, TableRetention>> = {
  audit_logs: {
    purges: ['auditLogs'],
    keeps:
      'signup, request, completion, referral, resubscribe and note-removal rows (IP, user agent, entry id): 90 days',
  },
  deletion_tokens: { purges: ['deletionTokens'], erasure: true },
  email_delivery_logs: {
    purges: ['emailDeliveryLogs', 'emailDeliveryOrphans', 'emailDeliveryLegacyText'],
    erasure: true,
    keeps: 'a row from a send in flight at erasure: until the next orphan sweep',
  },
  gdpr_deletion_logs: { exemption: 'records that a deletion happened; holds no personal data' },
  idempotency_cache: {
    purges: ['idempotencyCache'],
    keeps: "a signup's replayed response (the person's referral code): until the next daily run",
  },
  waitlist_entries: {
    erasure: true,
    keeps: "the person's referral code on the rows of people they referred",
  },
  waitlist_counters: { exemption: 'aggregate counts only; no personal data' },
  schema_migrations: { exemption: 'migration bookkeeping (scripts/); no personal data' },
};
