/**
 * `email_delivery_logs`: rows sent more than 3 years ago (the founder's ruling on `5.863`; the
 * privacy policy's "Communication records: 3 years", pinned by `registry.test.ts`).
 * No row ceiling: the legitimate volume grows with time (P14, E2).
 */
import type { Purge } from './types';

export const EMAIL_DELIVERY_RETENTION_YEARS = 3;

/** A window shorter than the policy's 3 years would delete what it promises to keep. */
export function checkedRetentionYears(years: number): number {
  if (!(years >= 3)) throw new Error('email delivery retention below 3 years');
  return years;
}

export const emailDeliveryLogsPurge: Purge = {
  name: 'emailDeliveryLogs',
  async run(query) {
    const years = checkedRetentionYears(EMAIL_DELIVERY_RETENTION_YEARS);
    const rows = await query`
      DELETE FROM email_delivery_logs
      WHERE sent_at < NOW() - make_interval(years => ${years})
      RETURNING 1
    `;
    return { count: rows.length };
  },
};
