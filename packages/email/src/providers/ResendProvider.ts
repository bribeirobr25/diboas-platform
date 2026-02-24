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

export async function sendViaResend(payload: EmailPayload): Promise<DeliveryResult> {
  const config = getEmailConfig();

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
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
