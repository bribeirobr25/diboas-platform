export type {
  EmailTemplate,
  EmailPayload,
  DeliveryResult,
  EmailServiceConfig,
  WaitlistTier,
  WelcomeEmailData,
  ReferralSuccessEmailData,
  DeletionConfirmationEmailData,
  DeletionCompleteEmailData,
} from './types';

export type { IEmailService } from './EmailService';
export { createEmailService } from './EmailService';
export { getEmailConfig, BRAND } from './config';
export { sendViaResend } from './providers';
export {
  renderWelcome,
  renderReferralSuccess,
  renderDeletionConfirmation,
  renderDeletionComplete,
} from './templates';
