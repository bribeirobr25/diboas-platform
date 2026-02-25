/**
 * Waitlist Referral API Route
 *
 * Dedicated endpoint for referral operations:
 * - GET: Lookup referral code details (for validation before signup)
 *
 * Referral processing (crediting referrer) is handled by the signup route
 * after successful signup — no separate POST endpoint needed.
 *
 * Security:
 * - Rate limiting on all endpoints
 * - Input validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/monitoring/Logger';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import {
  isValidReferralCode,
} from '@/lib/waitingList/helpers';
import {
  getByReferralCode,
} from '@/lib/waitingList/store';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
} from '@/lib/security';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

/**
 * Response types
 */
interface ReferralLookupResponse {
  success: boolean;
  valid?: boolean;
  referrer?: {
    position: number;
    referralCount: number;
  };
  error?: string;
}

/**
 * GET /api/waitlist/referral?code=REF123ABC
 * Lookup referral code details (for validation before signup)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ReferralLookupResponse>> {
  // Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = await checkRateLimit(
    `referral-lookup:${clientIP}`,
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
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Referral code parameter required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!isValidReferralCode(code, REFERRAL_CONFIG.codePrefix)) {
      return NextResponse.json({
        success: true,
        valid: false,
      });
    }

    // Find referrer
    const referrer = await getByReferralCode(code);

    if (!referrer) {
      return NextResponse.json({
        success: true,
        valid: false,
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      referrer: {
        position: referrer.position,
        referralCount: referrer.referralCount,
      },
    });
  } catch (error) {
    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'waitlist',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'medium',
      context: {
        operation: 'referral_lookup',
      },
    });

    Logger.error('Referral lookup error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
