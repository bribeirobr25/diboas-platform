/**
 * A person's erasure (plan P14, E3′; register `5.863`).
 *
 * When a person confirms a deletion link, one SQL statement of data-modifying CTEs consumes the
 * link and erases what the website holds about them: their other deletion links, their email
 * delivery rows and their waitlist entry. Every part is keyed on the consumed link's own stored
 * hash (`deletion_tokens.email_hash`, which does not depend on the encryption key), and runs only
 * when the link was consumed. One statement is atomic on its own, through the existing `sql` and
 * on the test database alike, so a failure erases nothing and leaves the link usable. The GDPR
 * deletion record is written by the same statement, so it exists exactly when the erasure does
 * (a late commit after a timeout cannot lose it). An empty stored hash counts as no hash: it would
 * otherwise match every row written before 5.824 under an empty blind index.
 *
 * What erasure keeps is listed in the plan (E11′) and in the Legal request (`5.1004`).
 *
 * The query function is injected so the same statements run on Postgres in CI (PGlite).
 */
import { sql as defaultSql, type QueryFn } from '@/lib/database/client';

/** A live deletion link, read without consuming it. */
export interface DeletionLink {
  /** The address as stored (ciphertext); decrypted by the caller. */
  encryptedEmail: string | null;
  /** The stored blind index; null only on links written before it existed. */
  emailHash: string | null;
}

export interface ErasureResult {
  /** The clicked link was live and is now consumed. */
  consumed: boolean;
  /** The erased waitlist entry's id; null when the person had no entry. */
  entryId: string | null;
  deliveryRows: number;
  otherLinks: number;
}

const asCount = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));

export class PrivacyPersonErasureService {
  constructor(private readonly query: QueryFn = defaultSql) {}

  /** The link behind a token hash, if it is live. Nothing is changed. */
  async findLink(tokenHash: string): Promise<DeletionLink | null> {
    const rows = await this.query`
      SELECT email, email_hash FROM deletion_tokens
      WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      encryptedEmail: typeof row.email === 'string' && row.email ? row.email : null,
      emailHash: typeof row.email_hash === 'string' && row.email_hash ? row.email_hash : null,
    };
  }

  /**
   * Consume the link and erase the person, in one statement. `fallbackHash` keys the erasure only
   * when the link predates its stored hash. When the link is no longer live (expired, or consumed
   * by a concurrent request) nothing is erased and `consumed` is false.
   */
  async consumeAndErase(
    tokenHash: string,
    fallbackHash: string,
    record: { correlationId?: string } = {}
  ): Promise<ErasureResult> {
    const rows = await this.query`
      WITH consumed AS (
        DELETE FROM deletion_tokens
        WHERE token_hash = ${tokenHash} AND expires_at > NOW()
          AND COALESCE(NULLIF(email_hash, ''), NULLIF(${fallbackHash}, '')) IS NOT NULL
        RETURNING COALESCE(NULLIF(email_hash, ''), NULLIF(${fallbackHash}, '')) AS person
      ),
      other_links AS (
        DELETE FROM deletion_tokens
        WHERE token_hash <> ${tokenHash} AND email_hash = (SELECT person FROM consumed)
        RETURNING 1
      ),
      deliveries AS (
        DELETE FROM email_delivery_logs
        WHERE recipient_hash = (SELECT person FROM consumed)
        RETURNING 1
      ),
      entry AS (
        DELETE FROM waitlist_entries
        WHERE email_hash = (SELECT person FROM consumed)
        RETURNING id
      ),
      gdpr_record AS (
        INSERT INTO gdpr_deletion_logs (entity_type, deleted_by, reason, correlation_id, metadata)
        SELECT 'waitlist_entry', 'user_request', 'gdpr_article_17', ${record.correlationId ?? null},
               ${JSON.stringify({ method: 'token_confirmation' })}::jsonb
        WHERE EXISTS (SELECT 1 FROM entry)
        RETURNING 1
      )
      SELECT
        (SELECT count(*) FROM consumed)::int AS consumed,
        (SELECT id FROM entry LIMIT 1) AS entry_id,
        (SELECT count(*) FROM deliveries)::int AS deliveries,
        (SELECT count(*) FROM other_links)::int AS other_links,
        (SELECT count(*) FROM gdpr_record)::int AS recorded
    `;
    const row = rows[0] ?? {};
    return {
      consumed: asCount(row.consumed) > 0,
      entryId: row.entry_id == null ? null : String(row.entry_id),
      deliveryRows: asCount(row.deliveries),
      otherLinks: asCount(row.other_links),
    };
  }

  /**
   * After the statement reported a failure (a timeout does not cancel the query), whether it
   * committed: the link and the entry are both gone only when it did. Nothing is changed.
   */
  async isErased(tokenHash: string, personHash: string): Promise<boolean> {
    const rows = await this.query`
      SELECT
        EXISTS (SELECT 1 FROM deletion_tokens WHERE token_hash = ${tokenHash}) AS link,
        EXISTS (SELECT 1 FROM waitlist_entries WHERE email_hash = ${personHash}) AS entry
    `;
    const row = rows[0];
    if (!row) return false;
    return row.link === false && row.entry === false;
  }
}

/** The erasure the website uses (Neon, through the shared `sql`). */
export const privacyPersonErasureService = new PrivacyPersonErasureService();
