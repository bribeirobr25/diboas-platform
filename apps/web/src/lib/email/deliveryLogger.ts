/**
 * Email Delivery Logger
 *
 * Logs email delivery attempts to the email_delivery_logs table.
 * Fire-and-forget: failures are logged but never propagated.
 *
 * Security: recipient email is AES-256-GCM encrypted with HMAC blind index.
 *
 * P14 (register `5.863`, E5): a row holds no free text. The subject comes from the pinned set
 * below (one per template); a failed send stores the code `provider_rejected`, never the
 * provider's message (it can quote an address); nothing else is written to `metadata` (the
 * column keeps its default). The provider's message still reaches `Logger.error` in
 * `sendEmail.ts`, whose message and context are redacted.
 */

import { EncryptionUnavailableError } from '@/lib/errors/domainErrors';
import { sql } from '@/lib/database/client';
import { encrypt } from '@/lib/security/encryption';
import { hashEmailAddress } from '@/lib/security/hashEmailAddress';
import { Logger } from '@/lib/monitoring/Logger';

/** The four emails the website sends, each with the subject recorded for it. */
export const DELIVERY_SUBJECTS = {
  welcome: 'Welcome to diBoaS',
  'deletion-confirmation': 'Confirm deletion request',
  'deletion-complete': 'Data deleted',
  'referral-success': 'Someone used your invite!',
} as const;

export type DeliveryTemplate = keyof typeof DELIVERY_SUBJECTS;

/** The only error text a delivery row may hold (`legacy_redacted` is the daily purge's, E6′). */
export const DELIVERY_ERROR_CODES = ['provider_rejected', 'legacy_redacted'] as const;

interface DeliveryLogInput {
  recipientEmail: string;
  template: DeliveryTemplate;
  locale: string;
  providerId?: string;
  status: 'sent' | 'failed';
}

export async function logEmailDelivery(input: DeliveryLogInput): Promise<void> {
  try {
    if (!Object.hasOwn(DELIVERY_SUBJECTS, input.template)) {
      throw new Error('Unknown delivery template');
    }
    const id = `edl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const recipientEnc = encrypt(input.recipientEmail);
    const recipientHash = hashEmailAddress(input.recipientEmail);
    // 5.824: never write the address in clear or under an empty blind index. Refusing here
    // skips the log row; the catch below records the failure (the logger never propagates).
    if (!recipientEnc || !recipientHash) throw new EncryptionUnavailableError();
    const errorCode = input.status === 'failed' ? DELIVERY_ERROR_CODES[0] : null;

    await sql`
      INSERT INTO email_delivery_logs
        (id, recipient_email, recipient_hash, template, subject, locale,
         status, provider_id, error_message)
      VALUES
        (${id}, ${recipientEnc}, ${recipientHash}, ${input.template},
         ${DELIVERY_SUBJECTS[input.template]}, ${input.locale}, ${input.status},
         ${input.providerId || null}, ${errorCode})
    `;
  } catch (err) {
    // Fire-and-forget: log failure but don't propagate
    Logger.error(
      '[DeliveryLog] Failed to log email delivery',
      {},
      err instanceof Error ? err : undefined
    );
  }
}
