export type {
  EmailTemplate,
  EmailPayload,
  DeliveryResult,
  EmailServiceConfig,
  WelcomeEmailData,
  PositionUpdateEmailData,
  ReferralSuccessEmailData,
  DeletionConfirmationEmailData,
} from './types';

export type { IEmailService } from './EmailService';
export { createEmailService } from './EmailService';
export { getEmailConfig, BRAND } from './config';
export { sendViaResend } from './providers';
export {
  renderWelcome,
  renderPositionUpdate,
  renderReferralSuccess,
  renderDeletionConfirmation,
} from './templates';
