import type { EmailServiceConfig } from './types';

export function getEmailConfig(): EmailServiceConfig {
  return {
    apiKey: process.env.RESEND_API_KEY || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'hello@diboas.com',
    fromName: process.env.EMAIL_FROM_NAME || 'diBoaS',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@diboas.com',
  };
}

export const BRAND = {
  name: 'diBoaS',
  primaryColor: '#14b8a6',
  headerColor: '#0f172a',
  textColor: '#0f172a',
  bgColor: '#ffffff',
  footerBg: '#f8fafc',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://diboas.com',
  /**
   * The Practice app's address (plan P13, D2). Fixed, never from an environment variable: the
   * same literal as the web app's `PRACTICE_APP_URL` (this package cannot import the app's
   * config); `apps/web/src/config/__tests__/practiceAppUrl.test.ts` keeps the two equal.
   */
  practiceUrl: 'https://app.diboas.com',
} as const;
