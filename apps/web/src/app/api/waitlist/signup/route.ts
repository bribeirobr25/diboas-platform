/**
 * Waitlist Signup API Route
 *
 * Handles new waitlist signups with:
 * - Email validation and sanitization
 * - Position assignment
 * - Referral code generation
 * - Kit.com integration (when credentials available)
 * - Local storage fallback for pre-launch
 */

import { NextRequest, NextResponse } from 'next/server';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';

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
  try {
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

    // Check for existing signup
    if (exists(email)) {
      const existing = getByEmail(email)!;
      return NextResponse.json(
        {
          success: false,
          error: 'Already registered',
          errorCode: 'ALREADY_REGISTERED',
          position: existing.position,
          referralCode: existing.referralCode,
          referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, existing.referralCode),
        },
        { status: 409 }
      );
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

    // TODO: When Kit.com credentials are available, sync to Kit.com
    // await syncToKit(email, { position: entry.position, referralCode, referredBy, locale: body.locale });

    return NextResponse.json({
      success: true,
      position: entry.position,
      referralCode: entry.referralCode,
      referralUrl,
    });

  } catch (error) {
    console.error('Waitlist signup error:', error);

    // Handle duplicate email error from store
    if (error instanceof Error && error.message === 'Email already exists') {
      return NextResponse.json(
        { success: false, error: 'Already registered', errorCode: 'ALREADY_REGISTERED' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

// GET method to check if an email is already registered
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    );
  }

  const sanitizedEmail = email.toLowerCase().trim();

  if (!isValidEmail(sanitizedEmail)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    );
  }

  const existing = getByEmail(sanitizedEmail);

  if (existing) {
    return NextResponse.json({
      exists: true,
      position: existing.position,
      referralCode: existing.referralCode,
      referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, existing.referralCode),
      referralCount: existing.referralCount,
    });
  }

  return NextResponse.json({ exists: false });
}
