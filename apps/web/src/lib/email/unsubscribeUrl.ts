/**
 * Unsubscribe URL Builder
 *
 * Builds HMAC-signed unsubscribe URLs. Returns TWO URLs:
 * - pageUrl: branded i18n page for email footer links (user clicks in email body)
 * - apiUrl: API endpoint for RFC 8058 List-Unsubscribe header (email clients POST directly)
 *
 * Security note: The `t` param is base64url-encoded `id:token` for shorter URLs.
 * This is purely cosmetic — the actual security boundary is HMAC: `id` is a one-way
 * hash (email cannot be recovered), and `token` requires the secret HMAC_KEY to forge.
 * Base64 encoding is trivially reversible and adds zero security.
 *
 * Lives in apps/web/ (not packages/email/) because it needs hmacHash from @/lib/security.
 */

import { hmacHash } from '@/lib/security/encryption';
import { APP_URL } from '@/config/env';

// Re-export client-safe decoder for server-side consumers
export { decodeUnsubToken } from './unsubscribeToken';

export interface UnsubscribeUrls {
  /** Branded page URL — for HTML email footer link */
  pageUrl: string;
  /** API endpoint URL — for List-Unsubscribe header (RFC 8058) */
  apiUrl: string;
}

/**
 * Encode id and token into a single base64url param.
 * Server-side only (uses Node.js Buffer).
 */
export function encodeUnsubToken(id: string, token: string): string {
  return Buffer.from(`${id}:${token}`).toString('base64url');
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

  const t = encodeUnsubToken(emailHash, token);

  return {
    pageUrl: `${APP_URL}/${locale}/email-preferences?t=${t}`,
    apiUrl: `${APP_URL}/api/email/unsubscribe?t=${t}`,
  };
}
