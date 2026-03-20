/**
 * Waitlist Position API Route
 *
 * Handles position queries and updates:
 * - Get current position by email
 * - Get referral stats
 * - Track referral attributions
 *
 * Security:
 * - No email enumeration (generic responses)
 * - Rate limiting
 * - Zero-Trust authentication for POST
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import {
  requireAuth,
  hmacHash,
} from '@/lib/security';
import { sanitizeEmail } from '@/lib/utils/sanitize';
import { generateReferralUrl, isValidEmail } from '@/lib/waitingList/helpers';
import { applyRateLimit, applyCsrf, handleRouteError } from '@/lib/api/routeHelpers';
import {
  getByEmail,
  updateEntry,
  processReferral,
} from '@/lib/waitingList/store';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

interface PositionResponse {
  success: boolean;
  position?: number | null;
  referralCode?: string | null;
  referralUrl?: string | null;
  referralCount?: number | null;
  error?: string;
}

/**
 * GET /api/waitlist/position?email=user@example.com
 *
 * Returns the user's waitlist position and referral info.
 * Returns same structure regardless of email existence to prevent enumeration.
 */
export async function GET(request: NextRequest): Promise<NextResponse<PositionResponse>> {
  const rateLimited = await applyRateLimit(request, 'position', 'standard');
  if (rateLimited) return rateLimited as NextResponse<PositionResponse>;

  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const userData = await getByEmail(sanitizedEmail);

    // Add artificial delay to prevent timing attacks (100-300ms)
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    if (!userData) {
      // Return deterministic dummy non-null values to prevent email enumeration
      // HMAC-derived values are stable per email, indistinguishable from real users
      const hash = hmacHash(sanitizedEmail);
      // Fallback to a simple hash if HMAC key is unavailable
      const hashHex = hash || sanitizedEmail.split('').reduce((acc, c) => acc + c.charCodeAt(0).toString(16), '').slice(0, 16);
      const hashInt = parseInt(hashHex.slice(0, 8), 16);
      const dummyPosition = (hashInt % 500) + 100;
      const dummyCode = `${REFERRAL_CONFIG.codePrefix}${hashHex.slice(0, 6).toUpperCase()}`;

      return NextResponse.json({
        success: true,
        position: dummyPosition,
        referralCode: dummyCode,
        referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, dummyCode),
        referralCount: 0,
      });
    }

    // Emit position checked event for analytics (only when user exists)
    applicationEventBus.emit(ApplicationEventType.WAITLIST_POSITION_CHECKED, {
      source: 'waitlist',
      timestamp: Date.now(),
      metadata: {
        hasReferrals: userData.referralCount > 0,
      },
    });

    return NextResponse.json({
      success: true,
      position: userData.position,
      referralCode: userData.referralCode,
      referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, userData.referralCode),
      referralCount: userData.referralCount,
    });

  } catch (error) {
    return handleRouteError(error, 'waitlist', 'position_lookup', 'Position lookup error') as NextResponse<PositionResponse>;
  }
}

/**
 * POST /api/waitlist/position
 *
 * Update position (used internally when referrals come in).
 * This is typically called by webhooks, not directly by users.
 *
 * Security: Requires valid API key (Zero-Trust authentication)
 */
export async function POST(request: NextRequest): Promise<NextResponse<PositionResponse>> {
  const csrfError = applyCsrf(request);
  if (csrfError) return csrfError as NextResponse<PositionResponse>;

  // Zero-Trust: Mandatory authentication
  const authError = requireAuth(request, { requireAdmin: true });
  if (authError) return authError as NextResponse<PositionResponse>;

  const rateLimited = await applyRateLimit(request, 'position-update', 'standard');
  if (rateLimited) return rateLimited as NextResponse<PositionResponse>;

  try {
    const body = await request.json();
    const { email, newPosition, incrementReferral } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    let userData = await getByEmail(sanitizedEmail);

    // Don't reveal whether email exists for internal endpoints either
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Operation failed' },
        { status: 400 }
      );
    }

    // Update position if provided
    if (typeof newPosition === 'number' && newPosition > 0) {
      userData = await updateEntry(sanitizedEmail, { position: newPosition }) ?? userData;
    }

    // Increment referral count if requested
    if (incrementReferral) {
      userData = await processReferral(sanitizedEmail) ?? userData;
    }

    return NextResponse.json({
      success: true,
      position: userData.position,
      referralCode: userData.referralCode,
      referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, userData.referralCode),
      referralCount: userData.referralCount,
    });

  } catch (error) {
    return handleRouteError(error, 'waitlist', 'position_update', 'Position update error') as NextResponse<PositionResponse>;
  }
}
