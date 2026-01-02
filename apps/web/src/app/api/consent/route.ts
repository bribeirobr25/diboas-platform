/**
 * Consent Cookie API
 *
 * Manages user consent preferences via secure HttpOnly cookies.
 * This provides better security than localStorage as cookies
 * cannot be accessed via JavaScript (XSS protection).
 *
 * Endpoints:
 * - POST: Set consent preferences
 * - GET: Check current consent status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  setConsentCookie,
  getConsentFromRequest,
  hasAnalyticsConsent,
  clearConsentCookie,
  CookieConfig,
} from '@/lib/security/cookies';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
  csrfProtection,
} from '@/lib/security';

interface ConsentRequest {
  analytics: boolean;
}

interface ConsentResponse {
  success: boolean;
  consent?: {
    analytics: boolean;
    version: string;
  };
  error?: string;
}

/**
 * POST /api/consent
 *
 * Set consent preferences via HttpOnly cookie.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ConsentResponse>> {
  // CSRF protection
  const csrfError = csrfProtection(request);
  if (csrfError) {
    return csrfError as NextResponse<ConsentResponse>;
  }

  const clientIP = getClientIP(request);

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `consent:${clientIP}`,
    RateLimitPresets.standard.limit,
    RateLimitPresets.standard.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const body = await request.json() as ConsentRequest;

    // Validate input
    if (typeof body.analytics !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid consent data. analytics must be boolean.' },
        { status: 400 }
      );
    }

    // Create response with consent cookie
    const response = NextResponse.json({
      success: true,
      consent: {
        analytics: body.analytics,
        version: CookieConfig.version,
      },
    });

    // Set HttpOnly cookie
    setConsentCookie(response, { analytics: body.analytics });

    return response;
  } catch (error) {
    console.error('[Consent] Error setting consent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set consent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/consent
 *
 * Check current consent status from HttpOnly cookie.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ConsentResponse>> {
  const clientIP = getClientIP(request);

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `consent-check:${clientIP}`,
    RateLimitPresets.lenient.limit,
    RateLimitPresets.lenient.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const consent = getConsentFromRequest(request);

    if (!consent) {
      return NextResponse.json({
        success: true,
        consent: undefined, // No consent given yet
      });
    }

    return NextResponse.json({
      success: true,
      consent: {
        analytics: consent.analytics,
        version: consent.version,
      },
    });
  } catch (error) {
    console.error('[Consent] Error checking consent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check consent' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/consent
 *
 * Clear consent cookie (withdraw consent).
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ConsentResponse>> {
  // CSRF protection
  const csrfError = csrfProtection(request);
  if (csrfError) {
    return csrfError as NextResponse<ConsentResponse>;
  }

  const clientIP = getClientIP(request);

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `consent-delete:${clientIP}`,
    RateLimitPresets.standard.limit,
    RateLimitPresets.standard.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const response = NextResponse.json({
      success: true,
    });

    clearConsentCookie(response);

    return response;
  } catch (error) {
    console.error('[Consent] Error clearing consent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear consent' },
      { status: 500 }
    );
  }
}
