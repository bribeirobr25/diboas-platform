/**
 * Secure Cookie Utilities
 *
 * Provides helpers for setting and reading HttpOnly cookies
 * for secure consent and session management.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_CONFIG, IS_PRODUCTION } from '@/config/env';

/**
 * Consent cookie configuration
 */
export interface ConsentValue {
  analytics: boolean;
  version: string;
  timestamp: number;
}

// Use centralized environment configuration
const CONSENT_COOKIE_NAME = COOKIE_CONFIG.consentCookieName;
const CONSENT_VERSION = COOKIE_CONFIG.consentVersion;
const COOKIE_MAX_AGE = COOKIE_CONFIG.maxAge;

/**
 * Set consent cookie on response
 *
 * @param response - NextResponse to add cookie to
 * @param consent - Consent value
 * @returns The modified response
 */
export function setConsentCookie(
  response: NextResponse,
  consent: Omit<ConsentValue, 'version' | 'timestamp'>
): NextResponse {
  const value: ConsentValue = {
    ...consent,
    version: CONSENT_VERSION,
    timestamp: Date.now(),
  };

  const cookieValue = JSON.stringify(value);

  // HttpOnly — server-side source of truth (XSS-protected)
  response.cookies.set({
    name: CONSENT_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  // Non-HttpOnly shadow — client-readable mirror for banner suppression
  // P8 Security: Server uses HttpOnly version for consent enforcement.
  // P9 Performance: Client reads shadow cookie synchronously (no API call).
  // GDPR Article 7: Even if XSS flips the shadow cookie, the server-side
  // HttpOnly record remains the source of truth for consent state.
  response.cookies.set({
    name: `${CONSENT_COOKIE_NAME}_js`,
    value: cookieValue,
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}

/**
 * Get consent cookie from request
 *
 * @param request - Incoming request
 * @returns Consent value or null
 */
export function getConsentFromRequest(request: Request): ConsentValue | null {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  // Parse cookies from header
  const cookies = parseCookies(cookieHeader);
  const consentStr = cookies[CONSENT_COOKIE_NAME];

  if (!consentStr) {
    return null;
  }

  return parseConsentValue(consentStr);
}

/**
 * Get consent from Next.js cookies() helper (for server components)
 */
export async function getConsentFromCookies(): Promise<ConsentValue | null> {
  try {
    const cookieStore = await cookies();
    const consent = cookieStore.get(CONSENT_COOKIE_NAME);

    if (!consent?.value) {
      return null;
    }

    return parseConsentValue(consent.value);
  } catch {
    return null;
  }
}

/**
 * Read a stored consent value. Anything that is not a JSON object (unparseable, `null`, a
 * string, an array) is no consent: it fails closed (twelfth audit: a JSON string came back
 * cast as a `ConsentValue`).
 */
function parseConsentValue(raw: string): ConsentValue | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as ConsentValue)
      : null;
  } catch {
    return null;
  }
}

/**
 * Check if analytics consent is given
 */
export function hasAnalyticsConsent(consent: ConsentValue | null): boolean {
  if (!consent) {
    return false;
  }

  // Check if consent version matches
  if (consent.version !== CONSENT_VERSION) {
    return false;
  }

  return consent.analytics === true;
}

/**
 * Clear consent cookie
 */
export function clearConsentCookie(response: NextResponse): NextResponse {
  response.cookies.delete(CONSENT_COOKIE_NAME);
  response.cookies.delete(`${CONSENT_COOKIE_NAME}_js`);
  return response;
}

/**
 * Parse cookies from header string.
 *
 * 5.823: each value is decoded on its own. A cookie with malformed percent-encoding (any
 * cookie on the domain, not only ours) is skipped instead of throwing, so one bad cookie can
 * never turn the consent route into a 500.
 *
 * A repeated name resolves last-wins, and a malformed copy also counts as the last word: it
 * REMOVES any earlier value of that name. So a malformed consent cookie reads as no consent
 * even when a valid copy precedes it (twelfth audit: skipping it let the earlier copy grant
 * consent), which fails closed.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      const key = name.trim();
      try {
        cookies[key] = decodeURIComponent(rest.join('=').trim());
      } catch {
        // malformed encoding: this name has no readable value
        delete cookies[key];
      }
    }
  });

  return cookies;
}

/**
 * Cookie configuration for reference
 */
export const CookieConfig = {
  name: CONSENT_COOKIE_NAME,
  version: CONSENT_VERSION,
  maxAge: COOKIE_MAX_AGE,
} as const;
