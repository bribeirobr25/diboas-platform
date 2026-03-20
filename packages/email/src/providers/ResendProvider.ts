import { Resend } from 'resend';
import type { EmailPayload, DeliveryResult } from '../types';
import { getEmailConfig } from '../config';

let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const config = getEmailConfig();
  if (!config.apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  _client = new Resend(config.apiKey);
  return _client;
}

const MAX_RETRIES = 2;
const BACKOFF_MS = [1000, 3000];

function isRetryableError(message: string): boolean {
  return /5\d{2}|timeout|network|ECONNRESET|ETIMEDOUT/i.test(message);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendViaResend(payload: EmailPayload): Promise<DeliveryResult> {
  const config = getEmailConfig();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = getClient();
      const { data, error } = await client.emails.send({
        from: `${config.fromName} <${config.fromAddress}>`,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        replyTo: payload.replyTo || config.replyTo,
        tags: payload.tags?.map((t) => ({ name: t, value: 'true' })),
        headers: payload.headers,
      });

      if (error) {
        if (attempt < MAX_RETRIES && isRetryableError(error.message)) {
          await delay(BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1]);
          continue;
        }
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (attempt < MAX_RETRIES && isRetryableError(message)) {
        await delay(BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1]);
        continue;
      }

      return { success: false, error: message };
    }
  }

  return { success: false, error: 'All retry attempts failed' };
}
