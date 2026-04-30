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
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import { isValidReferralCode } from '@/lib/waitingList/helpers';
import { getByReferralCode } from '@/lib/waitingList/store';
import { applyRateLimit, handleRouteError } from '@/lib/api/routeHelpers';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * Response types
 */
interface ReferralLookupResponse {
  success: boolean;
  valid?: boolean;
  referrer?: {
    position: number;
    referralCount: number;
    remainingInvites: number;
  };
  error?: string;
}

/**
 * GET /api/waitlist/referral?code=REF123ABC
 * Lookup referral code details (for validation before signup)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ReferralLookupResponse>> {
  const rateLimited = await applyRateLimit(request, 'referral-lookup', 'lenient');
  if (rateLimited) return rateLimited as NextResponse<ReferralLookupResponse>;

  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Referral code parameter required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!isValidReferralCode(code, REFERRAL_CONFIG.codePrefix)) {
      // Artificial delay prevents timing-based enumeration of valid code formats
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));
      return NextResponse.json({ success: true, valid: false });
    }

    // Find referrer
    const referrer = await getByReferralCode(code);

    // Artificial delay prevents timing-based distinction between valid/invalid codes
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 150));

    if (!referrer) {
      return NextResponse.json({ success: true, valid: false });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      referrer: {
        position: referrer.position,
        referralCount: referrer.referralCount,
        remainingInvites: Math.max(0, 5 - referrer.referralCount),
      },
    });
  } catch (error) {
    Logger.error('Referral lookup error', {}, error instanceof Error ? error : undefined);
    return handleRouteError(error, 'waitlist', 'referral_lookup', 'Referral lookup error') as NextResponse<ReferralLookupResponse>;
  }
}
