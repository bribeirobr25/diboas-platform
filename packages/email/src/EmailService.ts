import type {
  EmailPayload,
  DeliveryResult,
  WelcomeEmailData,
  ReferralSuccessEmailData,
  DeletionConfirmationEmailData,
  DeletionCompleteEmailData,
} from './types';
import { getEmailConfig } from './config';
import { renderWelcome } from './templates/welcome';
import { renderReferralSuccess } from './templates/referral-success';
import { renderDeletionConfirmation } from './templates/deletion-confirmation';
import { renderDeletionComplete } from './templates/deletion-complete';

export interface IEmailService {
  send(payload: EmailPayload): Promise<DeliveryResult>;
  sendWelcome(to: string, data: WelcomeEmailData): Promise<DeliveryResult>;
  sendReferralSuccess(to: string, data: ReferralSuccessEmailData): Promise<DeliveryResult>;
  sendDeletionConfirmation(to: string, data: DeletionConfirmationEmailData): Promise<DeliveryResult>;
  sendDeletionComplete(to: string, data: DeletionCompleteEmailData): Promise<DeliveryResult>;
}

export function createEmailService(
  provider: { send: (payload: EmailPayload) => Promise<DeliveryResult> }
): IEmailService {
  const config = getEmailConfig();

  function buildPayload(to: string, subject: string, html: string, tags: string[], unsubscribeUrl?: string): EmailPayload {
    const headers: Record<string, string> = {};
    if (unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    return {
      to,
      subject,
      html,
      replyTo: config.replyTo,
      tags,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    };
  }

  return {
    send: (payload) => provider.send(payload),

    sendWelcome: (to, data) => {
      const { subject, html } = renderWelcome(data);
      return provider.send(buildPayload(to, subject, html, ['welcome', 'waitlist'], data.unsubscribeApiUrl));
    },

    sendReferralSuccess: (to, data) => {
      const { subject, html } = renderReferralSuccess(data);
      return provider.send(buildPayload(to, subject, html, ['referral-success', 'waitlist'], data.unsubscribeApiUrl));
    },

    // Deletion emails: NO unsubscribe — transactional security emails, always delivered
    sendDeletionConfirmation: (to, data) => {
      const { subject, html } = renderDeletionConfirmation(data);
      return provider.send(buildPayload(to, subject, html, ['deletion-confirmation', 'gdpr']));
    },

    sendDeletionComplete: (to, data) => {
      const { subject, html } = renderDeletionComplete(data);
      return provider.send(buildPayload(to, subject, html, ['deletion-complete', 'gdpr']));
    },
  };
}
