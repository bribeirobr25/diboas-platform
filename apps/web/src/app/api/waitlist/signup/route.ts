/**
 * Waitlist Signup API Route
 *
 * Handles new waitlist signups with:
 * - Email validation and sanitization
 * - Distributed rate limiting (Redis with in-memory fallback)
 * - Position assignment
 * - Referral code generation
 * - Email notification via Resend
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
  getIdempotentResponse,
  cacheIdempotentResponse,
} from '@/lib/security';
import { sanitizeText, sanitizeUserName } from '@/lib/utils/sanitize';
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
  getFoundingMemberCount,
  type WaitlistSource,
  type WaitlistTier,
} from '@/lib/waitingList/store';
import { Logger } from '@/lib/monitoring/Logger';
import { logEmailDelivery } from '@/lib/email/deliveryLogger';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

/**
 * Detect country from CDN geo-IP headers with Accept-Language fallback.
 * Does NOT store IP addresses — only derives a country code from headers.
 */
function detectCountry(request: NextRequest): string | undefined {
  // 1. Vercel (production)
  const vercel = request.headers.get('x-vercel-ip-country');
  if (vercel && vercel !== 'XX') return vercel;

  // 2. Cloudflare (if behind CF proxy)
  const cf = request.headers.get('cf-ipcountry');
  if (cf && cf !== 'XX') return cf;

  // 3. Accept-Language heuristic (last resort, imprecise)
  const acceptLang = request.headers.get('accept-language');
  if (acceptLang) {
    const primary = acceptLang.split(',')[0]?.trim().toLowerCase();
    if (primary?.startsWith('pt-br')) return 'BR';
    if (primary?.startsWith('de')) return 'DE';
    if (primary?.startsWith('es')) return 'ES';
    if (primary?.startsWith('fr')) return 'FR';
    if (primary?.startsWith('en-gb')) return 'GB';
  }

  return undefined;
}

interface SignupRequestBody {
  email: string;
  name?: string;
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
  tier?: WaitlistTier;
  error?: string;
  errorCode?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  // Idempotency check
  const idempotencyKey = request.headers.get('idempotency-key');
  const cachedResponse = getIdempotentResponse(idempotencyKey);
  if (cachedResponse) return cachedResponse as NextResponse<SignupResponse>;

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
    if (await exists(email)) {
      const existing = await getByEmail(email);
      if (existing) {
        const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, existing.referralCode);

        // Return identical response structure as new signup (prevents enumeration)
        return NextResponse.json({
          success: true,
          position: existing.position,
          referralCode: existing.referralCode,
          referralUrl,
          tier: existing.tier,
        });
      }
    }

    // Validate referral code if provided
    let referredBy: string | undefined;
    if (body.referredBy && isValidReferralCode(body.referredBy, REFERRAL_CONFIG.codePrefix)) {
      referredBy = body.referredBy.toUpperCase();
    }

    // Generate referral code for new user
    const referralCode = generateReferralCode(REFERRAL_CONFIG.codePrefix, REFERRAL_CONFIG.codeLength);

    // Detect country from CDN geo-IP headers (optional, for Founders Wall)
    const country = detectCountry(request);

    // Add entry to store (tier determination + referrer lookup happens inside addEntry)
    const entry = await addEntry({
      email,
      name: body.name ? sanitizeUserName(body.name) : undefined,
      referralCode,
      referredBy,
      locale: body.locale || 'en',
      source: body.source || (referredBy ? 'referral' : 'direct'),
      tags: body.tags || [],
      country,
    });

    // Credit the referrer's invite count + notify them
    if (referredBy) {
      const referrer = await getByReferralCode(referredBy);
      if (referrer) {
        const updatedReferrer = await processReferral(referrer.email);
        // Notify referrer (fire-and-forget, matching sendWelcomeEmail pattern)
        if (updatedReferrer) {
          sendReferralNotification(referrer.email, {
            locale: body.locale || 'en',
            name: updatedReferrer.name,
            referralCount: updatedReferrer.referralCount,
            tier: updatedReferrer.tier,
            invitesRemaining: Math.max(0, 5 - updatedReferrer.referralCount),
          });
        }
      }
    }

    const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, referralCode);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, {
      position: entry.position,
      referralCode,
      referralUrl,
      locale: body.locale || 'en',
      name: body.name ? sanitizeUserName(body.name) : undefined,
      tier: entry.tier,
    });

    // Emit signup completed event for analytics and audit trail
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
      source: 'waitlist',
      timestamp: Date.now(),
      submissionId: entry.id,
      locale: body.locale || 'en',
      hasName: !!body.name,
      referralCode: referredBy,
      metadata: {
        position: entry.position,
        hasReferral: !!referredBy,
        signupSource: body.source || (referredBy ? 'referral' : 'direct'),
      },
    });

    const responseBody = {
      success: true,
      position: entry.position,
      referralCode: entry.referralCode,
      referralUrl,
      tier: entry.tier,
    };
    cacheIdempotentResponse(idempotencyKey, 200, responseBody);

    return NextResponse.json(responseBody);

  } catch (error) {
    Logger.error('Waitlist signup error', {}, error instanceof Error ? error : undefined);

    // Emit signup failed event for audit trail
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_FAILED, {
      source: 'waitlist',
      timestamp: Date.now(),
      metadata: {
        errorType: error instanceof Error && error.message === 'Email already exists'
          ? 'duplicate'
          : 'unknown',
      },
    });

    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'waitlist',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'high',
      context: {
        operation: 'signup',
      },
    });

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
 * Send welcome email (fire-and-forget).
 * Failures are logged but don't affect the signup response.
 */
function sendWelcomeEmail(
  email: string,
  data: {
    position: number;
    referralCode: string;
    referralUrl: string;
    locale: string;
    name?: string;
    tier: string;
  }
): void {
  Promise.all([
    import('@diboas/email'),
    getFoundingMemberCount(),
  ]).then(async ([{ createEmailService, sendViaResend }, foundingMember]) => {
    try {
      const spotsRemaining = Math.max(0, foundingMember.cap - foundingMember.count);
      const emailService = createEmailService({ send: sendViaResend });
      const result = await emailService.sendWelcome(email, {
        position: data.position,
        referralCode: data.referralCode,
        referralUrl: data.referralUrl,
        locale: data.locale,
        name: data.name,
        tier: data.tier as 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard',
        foundingMemberSpotsRemaining: spotsRemaining,
      });

      if (result.success) {
        Logger.info('[Email] Welcome email sent', { email });
      } else {
        Logger.error('[Email] Welcome email failed', { email, error: result.error });
      }

      // Log delivery to email_delivery_logs (fire-and-forget)
      logEmailDelivery({
        recipientEmail: email,
        template: 'welcome',
        subject: 'Welcome to diBoaS',
        locale: data.locale,
        providerId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error,
      });
    } catch (err) {
      Logger.error('[Email] Welcome email error', {}, err instanceof Error ? err : undefined);
    }
  }).catch((err) => {
    Logger.error('[Email] Failed to load email service', {}, err instanceof Error ? err : undefined);
  });
}

/**
 * Send referral success notification to referrer (fire-and-forget).
 * Failures are logged but don't affect the signup response.
 */
function sendReferralNotification(
  referrerEmail: string,
  data: {
    locale: string;
    name?: string;
    referralCount: number;
    tier: WaitlistTier;
    invitesRemaining: number;
  }
): void {
  import('@diboas/email').then(async ({ createEmailService, sendViaResend }) => {
    try {
      const emailService = createEmailService({ send: sendViaResend });
      const result = await emailService.sendReferralSuccess(referrerEmail, {
        locale: data.locale,
        name: data.name,
        referralCount: data.referralCount,
        tier: data.tier as 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard',
        invitesRemaining: data.invitesRemaining,
      });

      if (result.success) {
        Logger.info('[Email] Referral success email sent', { email: referrerEmail });
      } else {
        Logger.error('[Email] Referral success email failed', { email: referrerEmail, error: result.error });
      }

      logEmailDelivery({
        recipientEmail: referrerEmail,
        template: 'referral-success',
        subject: 'Someone used your invite!',
        locale: data.locale,
        providerId: result.messageId,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error,
      });
    } catch (err) {
      Logger.error('[Email] Referral success email error', {}, err instanceof Error ? err : undefined);
    }
  }).catch((err) => {
    Logger.error('[Email] Failed to load email service for referral', {}, err instanceof Error ? err : undefined);
  });
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
  try {
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
  } catch (error) {
    Logger.error('Waitlist check error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
