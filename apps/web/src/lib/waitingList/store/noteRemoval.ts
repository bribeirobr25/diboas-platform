/**
 * Removing a signup's note (market clean-up W-D1, F1, F6, G4; spec §3.6; CONSENT-EVIDENCE-1).
 *
 * The note is the tags a ticked note box stored: campaign values (`utm_*`), the button label
 * (`cta_source:`) and the server's evidence (`consent:`). One atomic `UPDATE` keyed by the email
 * hash removes exactly those tags and reports whether there were any (no read-modify-write, so no
 * version conflict; parameterised; `starts_with`, so no `LIKE` pattern needs escaping). A repeat
 * finds nothing and changes nothing. Emails, opt-outs and every other tag are untouched. An audit
 * event (`waitlist.note.removed`, no tag values) and a store event record it; afterwards only the
 * 90-day audit entry shows a note existed (F6).
 */
import { sql as defaultSql, type QueryFn } from '@/lib/database/client';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { ApplicationEventType } from '@/lib/events/applicationEventTypes';
import { CONSENT_TAG_PREFIX, CTA_SOURCE_TAG_PREFIX, UTM_TAG_PREFIX } from '../constants';
import { emitStoreEvent } from './internals';

export interface NoteRemovalResult {
  /** Whether the signup held a note that is now gone. */
  removed: boolean;
}

export async function removeSignupNote(
  emailHash: string,
  query: QueryFn = defaultSql
): Promise<NoteRemovalResult> {
  const rows = await query`
    UPDATE waitlist_entries
    SET tags = ARRAY(
          SELECT tag FROM unnest(tags) AS tag
          WHERE NOT (starts_with(tag, ${UTM_TAG_PREFIX})
                  OR starts_with(tag, ${CTA_SOURCE_TAG_PREFIX})
                  OR starts_with(tag, ${CONSENT_TAG_PREFIX}))
        ),
        updated_at = ${new Date().toISOString()}
    WHERE email_hash = ${emailHash}
      AND EXISTS (
        SELECT 1 FROM unnest(tags) AS tag
        WHERE starts_with(tag, ${UTM_TAG_PREFIX})
           OR starts_with(tag, ${CTA_SOURCE_TAG_PREFIX})
           OR starts_with(tag, ${CONSENT_TAG_PREFIX})
      )
    RETURNING id
  `;
  const removed = rows.length > 0;
  if (removed) {
    const entryId = String(rows[0].id);
    logAuditEvent({
      eventType: 'waitlist.note.removed',
      entityType: 'waitlist_entry',
      entityId: entryId,
      details: {},
    });
    emitStoreEvent(ApplicationEventType.WAITLIST_NOTE_REMOVED, { metadata: { entryId } });
  }
  return { removed };
}
