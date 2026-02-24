export type EmailTemplate =
  | 'welcome'
  | 'position-update'
  | 'referral-success'
  | 'deletion-confirmation';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
  headers?: Record<string, string>;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  apiKey: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  unsubscribeUrl: string;
}

export interface WelcomeEmailData {
  name?: string;
  position: number;
  referralCode: string;
  referralUrl: string;
  locale: string;
}

export interface PositionUpdateEmailData {
  name?: string;
  oldPosition: number;
  newPosition: number;
  spotsGained: number;
  locale: string;
}

export interface ReferralSuccessEmailData {
  name?: string;
  referralCount: number;
  newPosition: number;
  locale: string;
}

export interface DeletionConfirmationEmailData {
  locale: string;
}
