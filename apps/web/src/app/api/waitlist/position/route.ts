/**
 * Waitlist Position API Route — the admin-only position update.
 *
 * Twelfth audit (5.861): the public `GET ?email=` lookup is gone. Nothing called it, it put an
 * email address in the URL (request logs, Sentry `extra.path`), and its anti-enumeration dummy
 * rotated daily while a real referral code never changed, so two lookups either side of UTC
 * midnight showed whether an email was on the list.
 *
 * Security: Zero-Trust authentication (admin API key), CSRF, rate limiting; the response never
 * reveals whether an email exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import { requireAuth } from '@/lib/security';
import { generateReferralUrl } from '@/lib/waitingList/helpers';
import {
  applyRateLimit,
  applyCsrf,
  handleRouteError,
  readJsonObject,
} from '@/lib/api/routeHelpers';
import { Logger } from '@/lib/monitoring/Logger';
import { getByEmail, updateEntry, processReferral } from '@/lib/waitingList/store';

interface PositionResponse {
  success: boolean;
  position?: number | null;
  referralCode?: string | null;
  referralUrl?: string | null;
  referralCount?: number | null;
  error?: string;
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
    const { email, newPosition, incrementReferral } = await readJsonObject<{
      email?: unknown;
      newPosition?: unknown;
      incrementReferral?: unknown;
    }>(request);

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    let userData = await getByEmail(sanitizedEmail);

    // Don't reveal whether email exists for internal endpoints either
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Operation failed' }, { status: 400 });
    }

    // Update position if provided
    if (typeof newPosition === 'number' && newPosition > 0) {
      userData = (await updateEntry(sanitizedEmail, { position: newPosition })) ?? userData;
    }

    // Increment referral count if requested
    if (incrementReferral) {
      userData = (await processReferral(sanitizedEmail)) ?? userData;
    }

    return NextResponse.json({
      success: true,
      position: userData.position,
      referralCode: userData.referralCode,
      referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, userData.referralCode),
      referralCount: userData.referralCount,
    });
  } catch (error) {
    Logger.error('Position update error', {}, error instanceof Error ? error : undefined);
    return handleRouteError(
      error,
      'waitlist',
      'position_update',
      'Position update error'
    ) as NextResponse<PositionResponse>;
  }
}
