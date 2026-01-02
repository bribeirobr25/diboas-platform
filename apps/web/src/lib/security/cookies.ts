/**
 * Secure Cookie Utilities
 *
 * Provides helpers for setting and reading HttpOnly cookies
 * for secure consent and session management.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Consent cookie configuration
 */
export interface ConsentValue {
  analytics: boolean;
  version: string;
  timestamp: number;
}

const CONSENT_COOKIE_NAME = 'diboas-consent';
const CONSENT_VERSION = '1.0';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

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

  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set({
    name: CONSENT_COOKIE_NAME,
    value: JSON.stringify(value),
    httpOnly: true,
    secure: isProduction,
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

  try {
    return JSON.parse(consentStr) as ConsentValue;
  } catch {
    return null;
  }
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

    return JSON.parse(consent.value) as ConsentValue;
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
  return response;
}

/**
 * Parse cookies from header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
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
