/**
 * Email Delivery Logger
 *
 * Logs email delivery attempts to the email_delivery_logs table.
 * Fire-and-forget: failures are logged but never propagated.
 *
 * Security: recipient email is AES-256-GCM encrypted with HMAC blind index.
 */

import { sql } from '@/lib/database/client';
import { encrypt, hmacHash } from '@/lib/security/encryption';
import { Logger } from '@/lib/monitoring/Logger';

interface DeliveryLogInput {
  recipientEmail: string;
  template: string;
  subject: string;
  locale: string;
  providerId?: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export async function logEmailDelivery(input: DeliveryLogInput): Promise<void> {
  try {
    const id = `edl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const recipientEnc = encrypt(input.recipientEmail) || input.recipientEmail;
    const recipientHash = hmacHash(input.recipientEmail.toLowerCase().trim()) || '';

    await sql`
      INSERT INTO email_delivery_logs
        (id, recipient_email, recipient_hash, template, subject, locale,
         status, provider_id, error_message, metadata)
      VALUES
        (${id}, ${recipientEnc}, ${recipientHash}, ${input.template},
         ${input.subject}, ${input.locale}, ${input.status},
         ${input.providerId || null}, ${input.errorMessage || null},
         ${input.metadata ? JSON.stringify(input.metadata) : '{}'})
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
