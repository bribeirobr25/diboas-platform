/**
 * Unsubscribe URL Builder
 *
 * Builds HMAC-signed unsubscribe URLs. Returns TWO URLs:
 * - pageUrl: branded i18n page for email footer links (user clicks in email body)
 * - apiUrl: API endpoint for RFC 8058 List-Unsubscribe header (email clients POST directly)
 *
 * Lives in apps/web/ (not packages/email/) because it needs hmacHash from @/lib/security.
 * No PII in URLs — uses email hash as identifier, HMAC token for verification.
 */

import { hmacHash } from '@/lib/security/encryption';
import { APP_URL } from '@/config/env';

export interface UnsubscribeUrls {
  /** Branded page URL — for HTML email footer link */
  pageUrl: string;
  /** API endpoint URL — for List-Unsubscribe header (RFC 8058) */
  apiUrl: string;
}

/**
 * Build signed unsubscribe URLs for a given email address.
 * Returns undefined if HMAC computation fails (missing HMAC_KEY).
 */
export function buildUnsubscribeUrls(email: string, locale: string = 'en'): UnsubscribeUrls | undefined {
  const emailHash = hmacHash(email);
  if (!emailHash) return undefined;

  const token = hmacHash(emailHash);
  if (!token) return undefined;

  const params = `id=${encodeURIComponent(emailHash)}&token=${encodeURIComponent(token)}`;

  return {
    pageUrl: `${APP_URL}/${locale}/email-preferences?${params}`,
    apiUrl: `${APP_URL}/api/email/unsubscribe?${params}`,
  };
}
