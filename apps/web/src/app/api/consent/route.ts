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
import { Logger } from '@/lib/monitoring/Logger';
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
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

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

    // Get previous consent state for audit trail
    const previousConsent = getConsentFromRequest(request);
    const previousState = previousConsent?.analytics;

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

    // Emit consent event for analytics and audit trail
    const eventType = body.analytics
      ? ApplicationEventType.CONSENT_GIVEN
      : ApplicationEventType.CONSENT_WITHDRAWN;

    applicationEventBus.emit(eventType, {
      source: 'consent',
      timestamp: Date.now(),
      consentType: 'analytics',
      previousState,
      newState: body.analytics,
      metadata: {
        version: CookieConfig.version,
      },
    });

    return response;
  } catch (error) {
    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'consent',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'medium',
      context: {
        operation: 'consent_set',
      },
    });

    Logger.error('[Consent] Error setting consent:', { error: error instanceof Error ? error.message : String(error) });
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
    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'consent',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'low',
      context: {
        operation: 'consent_check',
      },
    });

    Logger.error('[Consent] Error checking consent:', { error: error instanceof Error ? error.message : String(error) });
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
    // Get previous consent state for audit trail
    const previousConsent = getConsentFromRequest(request);

    const response = NextResponse.json({
      success: true,
    });

    clearConsentCookie(response);

    // Emit consent withdrawn event for audit trail
    applicationEventBus.emit(ApplicationEventType.CONSENT_WITHDRAWN, {
      source: 'consent',
      timestamp: Date.now(),
      consentType: 'all',
      previousState: previousConsent?.analytics,
      newState: false,
      metadata: {
        method: 'cookie_cleared',
      },
    });

    return response;
  } catch (error) {
    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'consent',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'medium',
      context: {
        operation: 'consent_clear',
      },
    });

    Logger.error('[Consent] Error clearing consent:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to clear consent' },
      { status: 500 }
    );
  }
}
