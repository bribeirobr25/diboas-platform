export type WaitlistTier = 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard';

export type EmailTemplate =
  | 'welcome'
  | 'referral-success'
  | 'deletion-confirmation'
  | 'deletion-complete';

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
}

export interface WelcomeEmailData {
  name?: string;
  position: number;
  referralCode: string;
  referralUrl: string;
  locale: string;
  tier: WaitlistTier;
  foundingMemberSpotsRemaining?: number;
  /** Branded page URL for email footer link */
  unsubscribeUrl?: string;
  /** API URL for List-Unsubscribe header (RFC 8058) */
  unsubscribeApiUrl?: string;
}

export interface ReferralSuccessEmailData {
  name?: string;
  referralCount: number;
  tier: WaitlistTier;
  invitesRemaining: number;
  locale: string;
  referralUrl: string;
  referralCode: string;
  /** Branded page URL for email footer link */
  unsubscribeUrl?: string;
  /** API URL for List-Unsubscribe header (RFC 8058) */
  unsubscribeApiUrl?: string;
}

export interface DeletionConfirmationEmailData {
  locale: string;
  confirmationUrl: string;
  expiresInMinutes: number;
  name?: string;
}

export interface DeletionCompleteEmailData {
  locale: string;
  name?: string;
}
