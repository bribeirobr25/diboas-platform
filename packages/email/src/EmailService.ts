import type {
  EmailPayload,
  DeliveryResult,
  WelcomeEmailData,
  PositionUpdateEmailData,
  ReferralSuccessEmailData,
  DeletionConfirmationEmailData,
} from './types';
import { getEmailConfig } from './config';
import { renderWelcome } from './templates/welcome';
import { renderPositionUpdate } from './templates/position-update';
import { renderReferralSuccess } from './templates/referral-success';
import { renderDeletionConfirmation } from './templates/deletion-confirmation';

export interface IEmailService {
  send(payload: EmailPayload): Promise<DeliveryResult>;
  sendWelcome(to: string, data: WelcomeEmailData): Promise<DeliveryResult>;
  sendPositionUpdate(to: string, data: PositionUpdateEmailData): Promise<DeliveryResult>;
  sendReferralSuccess(to: string, data: ReferralSuccessEmailData): Promise<DeliveryResult>;
  sendDeletionConfirmation(to: string, data: DeletionConfirmationEmailData): Promise<DeliveryResult>;
}

export function createEmailService(
  provider: { send: (payload: EmailPayload) => Promise<DeliveryResult> }
): IEmailService {
  const config = getEmailConfig();

  function buildPayload(to: string, subject: string, html: string, tags: string[]): EmailPayload {
    return {
      to,
      subject,
      html,
      replyTo: config.replyTo,
      tags,
      headers: {
        'List-Unsubscribe': `<${config.unsubscribeUrl}?email=${encodeURIComponent(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  }

  return {
    send: (payload) => provider.send(payload),

    sendWelcome: (to, data) => {
      const { subject, html } = renderWelcome(data);
      return provider.send(buildPayload(to, subject, html, ['welcome', 'waitlist']));
    },

    sendPositionUpdate: (to, data) => {
      const { subject, html } = renderPositionUpdate(data);
      return provider.send(buildPayload(to, subject, html, ['position-update', 'waitlist']));
    },

    sendReferralSuccess: (to, data) => {
      const { subject, html } = renderReferralSuccess(data);
      return provider.send(buildPayload(to, subject, html, ['referral-success', 'waitlist']));
    },

    sendDeletionConfirmation: (to, data) => {
      const { subject, html } = renderDeletionConfirmation(data);
      return provider.send(buildPayload(to, subject, html, ['deletion-confirmation', 'gdpr']));
    },
  };
}
