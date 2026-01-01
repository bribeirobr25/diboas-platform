/**
 * Waitlist Referral API Route
 *
 * Dedicated endpoint for referral operations:
 * - GET: Lookup referral code details
 * - POST: Process a referral (credit referrer)
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import {
  generateReferralUrl,
  isValidReferralCode,
} from '@/lib/waitingList/helpers';
import {
  getByReferralCode,
  getByEmail,
  processReferral,
} from '@/lib/waitingList/store';

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

interface ProcessReferralResponse {
  success: boolean;
  referrerEmail?: string;
  newPosition?: number;
  newReferralCount?: number;
  error?: string;
}

/**
 * GET /api/waitlist/referral?code=REF123ABC
 * Lookup referral code details (for validation before signup)
 */
export async function GET(request: NextRequest): Promise<NextResponse<ReferralLookupResponse>> {
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
    const referrer = getByReferralCode(code);

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
    console.error('Referral lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waitlist/referral
 * Process a referral (called after successful signup with referral code)
 *
 * Body: { referralCode: string, referredEmail: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ProcessReferralResponse>> {
  try {
    const body = await request.json();
    const { referralCode, referredEmail } = body;

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    if (!referredEmail) {
      return NextResponse.json(
        { success: false, error: 'Referred email is required' },
        { status: 400 }
      );
    }

    // Validate referral code format
    if (!isValidReferralCode(referralCode, REFERRAL_CONFIG.codePrefix)) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Find the referrer
    const referrer = getByReferralCode(referralCode);

    if (!referrer) {
      return NextResponse.json(
        { success: false, error: 'Referral code not found' },
        { status: 404 }
      );
    }

    // Verify the referred user exists
    const referredUser = getByEmail(referredEmail);

    if (!referredUser) {
      return NextResponse.json(
        { success: false, error: 'Referred user not found' },
        { status: 404 }
      );
    }

    // Verify this user was actually referred by this code
    if (referredUser.referredBy !== referralCode.toUpperCase()) {
      return NextResponse.json(
        { success: false, error: 'Referral mismatch' },
        { status: 400 }
      );
    }

    // Process the referral (bump position)
    const updatedReferrer = processReferral(referrer.email, REFERRAL_CONFIG.spotsPerReferral);

    if (!updatedReferrer) {
      return NextResponse.json(
        { success: false, error: 'Failed to process referral' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      referrerEmail: updatedReferrer.email,
      newPosition: updatedReferrer.position,
      newReferralCount: updatedReferrer.referralCount,
    });
  } catch (error) {
    console.error('Process referral error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
