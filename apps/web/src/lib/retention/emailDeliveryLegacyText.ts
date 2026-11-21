/**
 * `email_delivery_logs.error_message`: any text outside the code set becomes `legacy_redacted`
 * (P14, E6′). Rows written before P14 hold the provider's raw message, which can quote an
 * address; one idempotent UPDATE a day cleans them, so no migration is needed for history.
 */
import { DELIVERY_ERROR_CODES } from '@/lib/email/deliveryLogger';
import type { Purge } from './types';

export const emailDeliveryLegacyTextPurge: Purge = {
  name: 'emailDeliveryLegacyText',
  async run(query) {
    const [provider, legacy] = DELIVERY_ERROR_CODES;
    const rows = await query`
      UPDATE email_delivery_logs SET error_message = ${legacy}
      WHERE error_message IS NOT NULL AND error_message NOT IN (${provider}, ${legacy})
      RETURNING 1
    `;
    return { count: rows.length };
  },
};
