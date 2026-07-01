/**
 * Founder notification for new investor requests.
 *
 * Fire-and-forget, never blocks or throws into the request path. Sends a
 * minimal, PII-masked notice to `INVESTOR_NOTIFY_EMAIL` via Resend when both
 * the recipient and the Resend API key are configured; otherwise logs and skips
 * (so local/dev without email creds still works). The masked summary keeps raw
 * PII out of email subjects/logs; the full record lives encrypted in the DB.
 */

import { Logger } from '@/lib/monitoring/Logger';
import type { InvestorRequestInput } from './types';

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  const head = user.slice(0, 2);
  return `${head}***@${domain}`;
}

export function notifyFounderOfInvestorRequest(input: InvestorRequestInput): void {
  const to = process.env.INVESTOR_NOTIFY_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!to || !apiKey) {
    Logger.info(
      '[investor] request received; founder notification skipped (email not configured)',
      {
        hasRecipient: Boolean(to),
        hasApiKey: Boolean(apiKey),
        investorType: input.investorType,
      }
    );
    return;
  }

  const subject = `New investor request (${input.investorType ?? 'unspecified'})`;
  const rows: Array<[string, string]> = [
    ['Email', maskEmail(input.email)],
    ['Company', input.company ?? '-'],
    ['Investor type', input.investorType ?? '-'],
    ['Ticket size', input.ticketSize ?? '-'],
    ['Locale', input.locale ?? '-'],
  ];
  const text = [
    'A new investor-materials request came in.',
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Open the encrypted record in the database to review the full request and follow up.',
  ].join('\n');
  const html = [
    '<p>A new investor-materials request came in.</p>',
    '<ul>',
    ...rows.map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`),
    '</ul>',
    '<p>Open the encrypted record in the database to review the full request and follow up.</p>',
  ].join('');

  // Fire-and-forget — dynamic import keeps the Resend provider out of the hot path.
  void import('@diboas/email')
    .then(({ sendViaResend }) =>
      sendViaResend({
        to,
        subject,
        text,
        html,
      })
    )
    .catch((error) => {
      Logger.error(
        '[investor] founder notification failed',
        {},
        error instanceof Error ? error : undefined
      );
    });
}
