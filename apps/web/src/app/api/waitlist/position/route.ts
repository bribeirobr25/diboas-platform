/**
 * Waitlist Position API Route
 *
 * Handles position queries and updates:
 * - Get current position by email
 * - Get referral stats
 * - Track referral attributions
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';

/**
 * Simple server-side sanitization for text inputs
 */
function sanitizeText(str: string): string {
  if (!str) return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
import { generateReferralUrl, isValidEmail } from '@/lib/waitingList/helpers';
import {
  getByEmail,
  updateEntry,
  processReferral,
} from '@/lib/waitingList/store';

interface PositionResponse {
  success: boolean;
  position?: number;
  referralCode?: string;
  referralUrl?: string;
  referralCount?: number;
  error?: string;
}

/**
 * GET /api/waitlist/position?email=user@example.com
 * Returns the user's waitlist position and referral info
 */
export async function GET(request: NextRequest): Promise<NextResponse<PositionResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeText(email.toLowerCase().trim());

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const userData = getByEmail(sanitizedEmail);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Email not found on waitlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      position: userData.position,
      referralCode: userData.referralCode,
      referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, userData.referralCode),
      referralCount: userData.referralCount,
    });

  } catch (error) {
    console.error('Position lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/waitlist/position
 * Update position (used internally when referrals come in)
 * This is typically called by webhooks, not directly by users
 */
export async function POST(request: NextRequest): Promise<NextResponse<PositionResponse>> {
  try {
    // Verify internal API key for webhook security
    const authHeader = request.headers.get('x-api-key');
    const internalApiKey = process.env.INTERNAL_API_KEY;

    // In production, uncomment this check
    // if (!internalApiKey || authHeader !== internalApiKey) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { email, newPosition, incrementReferral } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    let userData = getByEmail(sanitizedEmail);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Email not found on waitlist' },
        { status: 404 }
      );
    }

    // Update position if provided
    if (typeof newPosition === 'number' && newPosition > 0) {
      userData = updateEntry(sanitizedEmail, { position: newPosition });
    }

    // Increment referral count if requested
    if (incrementReferral) {
      userData = processReferral(sanitizedEmail, REFERRAL_CONFIG.spotsPerReferral);
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Failed to update entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      position: userData.position,
      referralCode: userData.referralCode,
      referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, userData.referralCode),
      referralCount: userData.referralCount,
    });

  } catch (error) {
    console.error('Position update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
