/**
 * Waitlist Signup API Route
 *
 * Handles new waitlist signups with:
 * - Email validation and sanitization
 * - Distributed rate limiting (Redis with in-memory fallback)
 * - Position assignment
 * - Referral code generation
 * - Kit.com (ConvertKit) integration for email marketing
 * - Local storage fallback for pre-launch
 *
 * Security:
 * - No email enumeration (generic responses)
 * - Redis-backed rate limiting
 * - Input sanitization
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
  csrfProtection,
} from '@/lib/security';

/**
 * Simple server-side sanitization for text inputs
 * Escapes HTML entities to prevent XSS
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
import {
  generateReferralCode,
  generateReferralUrl,
  isValidEmail,
  isValidReferralCode,
} from '@/lib/waitingList/helpers';
import {
  addEntry,
  exists,
  getByEmail,
  getByReferralCode,
  processReferral,
} from '@/lib/waitingList/store';

import type { WaitlistSource } from '@/lib/waitingList/store';

/**
 * Sync subscriber to Kit.com (ConvertKit)
 * Non-blocking - failures are logged but don't affect the signup response
 */
async function syncToKit(
  email: string,
  metadata: {
    position: number;
    referralCode: string;
    referredBy?: string;
    locale: string;
    source: string;
  }
): Promise<void> {
  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId) {
    console.log('[Kit.com] Skipping sync - credentials not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          email,
          fields: {
            waitlist_position: metadata.position,
            referral_code: metadata.referralCode,
            referred_by: metadata.referredBy || '',
            locale: metadata.locale,
            signup_source: metadata.source,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[Kit.com] Sync failed:', response.status, errorData);
    } else {
      console.log('[Kit.com] Successfully synced subscriber:', email);
    }
  } catch (error) {
    console.error('[Kit.com] Sync error:', error);
  }
}

interface SignupRequestBody {
  email: string;
  name?: string;
  xAccount?: string;
  locale: string;
  gdprAccepted: boolean;
  referredBy?: string;
  source?: WaitlistSource;
  tags?: string[];
}

interface SignupResponse {
  success: boolean;
  position?: number;
  referralCode?: string;
  referralUrl?: string;
  error?: string;
  errorCode?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  // CSRF protection
  const csrfError = csrfProtection(request);
  if (csrfError) {
    return csrfError as NextResponse<SignupResponse>;
  }

  try {
    // Distributed rate limiting (Redis with in-memory fallback)
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(
      `signup:${clientIP}`,
      RateLimitPresets.strict.limit,
      RateLimitPresets.strict.windowMs
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many signup attempts. Please try again later.',
          errorCode: 'RATE_LIMITED'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const body = await request.json() as SignupRequestBody;

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email is required', errorCode: 'EMAIL_REQUIRED' },
        { status: 400 }
      );
    }

    // Sanitize email
    const email = sanitizeText(body.email.toLowerCase().trim());

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    // Check for consent
    if (!body.gdprAccepted) {
      return NextResponse.json(
        { success: false, error: 'Consent is required', errorCode: 'CONSENT_REQUIRED' },
        { status: 400 }
      );
    }

    // Check for existing signup - return same response structure to prevent email enumeration
    // Security: Attackers cannot distinguish between new and existing signups
    if (exists(email)) {
      const existing = getByEmail(email)!;
      const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, existing.referralCode);

      // Return identical response structure as new signup (prevents enumeration)
      // Note: Kit.com sync is NOT called for existing users (already synced)
      return NextResponse.json({
        success: true,
        position: existing.position,
        referralCode: existing.referralCode,
        referralUrl,
      });
    }

    // Validate and process referral code if provided
    let referredBy: string | undefined;
    if (body.referredBy && isValidReferralCode(body.referredBy, REFERRAL_CONFIG.codePrefix)) {
      referredBy = body.referredBy.toUpperCase();

      // Find and credit the referrer
      const referrer = getByReferralCode(referredBy);
      if (referrer) {
        processReferral(referrer.email, REFERRAL_CONFIG.spotsPerReferral);
      }
    }

    // Generate referral code for new user
    const referralCode = generateReferralCode(REFERRAL_CONFIG.codePrefix, REFERRAL_CONFIG.codeLength);

    // Add entry to store
    const entry = addEntry({
      email,
      name: body.name ? sanitizeText(body.name.trim()) : undefined,
      referralCode,
      referredBy,
      locale: body.locale || 'en',
      source: body.source || (referredBy ? 'referral' : 'direct'),
      tags: body.tags || [],
    });

    const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, referralCode);

    // Sync to Kit.com (non-blocking - only for NEW signups)
    syncToKit(email, {
      position: entry.position,
      referralCode,
      referredBy,
      locale: body.locale || 'en',
      source: body.source || (referredBy ? 'referral' : 'direct'),
    });

    return NextResponse.json({
      success: true,
      position: entry.position,
      referralCode: entry.referralCode,
      referralUrl,
    });

  } catch (error) {
    console.error('Waitlist signup error:', error);

    // Handle duplicate email error from store (race condition)
    // Return generic error to prevent email enumeration
    if (error instanceof Error && error.message === 'Email already exists') {
      return NextResponse.json(
        { success: false, error: 'Unable to process request. Please try again.', errorCode: 'PROCESSING_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/waitlist/signup?email=user@example.com
 *
 * Check registration status. Returns same structure regardless of existence
 * to prevent email enumeration attacks.
 *
 * Security: This endpoint intentionally does NOT reveal whether an email
 * exists in the system. Authenticated users should use /api/waitlist/position
 * to retrieve their actual data.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Rate limit check requests
  const clientIP = getClientIP(request);
  const rateLimitResult = await checkRateLimit(
    `check:${clientIP}`,
    RateLimitPresets.standard.limit,
    RateLimitPresets.standard.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email parameter required' },
      { status: 400 }
    );
  }

  const sanitizedEmail = email.toLowerCase().trim();

  if (!isValidEmail(sanitizedEmail)) {
    return NextResponse.json(
      { success: false, error: 'Invalid email format' },
      { status: 400 }
    );
  }

  // Add artificial delay to prevent timing attacks (100-300ms)
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  // Always return same response structure to prevent enumeration
  // Users must use /api/waitlist/position with authentication to get actual data
  return NextResponse.json({
    success: true,
    message: 'Check complete. Use position endpoint with authentication to retrieve your data.',
  });
}
