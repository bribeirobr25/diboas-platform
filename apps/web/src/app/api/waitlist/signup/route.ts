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
  getIdempotentResponse,
  cacheIdempotentResponse,
} from '@/lib/security';
import { sanitizeUserName } from '@/lib/utils/sanitize';
import {
  generateReferralCode,
  generateReferralUrl,
  isValidReferralCode,
} from '@/lib/waitingList/helpers';
import { applyRateLimit, applyCsrf, validateEmail, emitErrorEvent } from '@/lib/api/routeHelpers';
import { isValidLocale, isValidSource, isValidTags, isValidName } from '@/lib/api/validators';
import { logRequestStart, logRequestEnd } from '@/lib/api/requestLogger';
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
import { logAuditEvent } from '@/lib/audit/AuditService';
import { sendEmailAsync } from '@/lib/email/sendEmail';
import { DuplicateEntryError } from '@/lib/errors/domainErrors';
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

function validationError(error: string, errorCode: string): NextResponse<SignupResponse> {
  return NextResponse.json({ success: false, error, errorCode }, { status: 400 });
}

function successResponse(entry: { position: number; referralCode: string; tier: WaitlistTier }, referralUrl: string): SignupResponse {
  return { success: true, position: entry.position, referralCode: entry.referralCode, referralUrl, tier: entry.tier };
}

export async function POST(request: NextRequest): Promise<NextResponse<SignupResponse>> {
  const startTime = logRequestStart('POST', '/api/waitlist/signup');

  // Idempotency check
  const idempotencyKey = request.headers.get('idempotency-key');
  const cachedResponse = await getIdempotentResponse(idempotencyKey);
  if (cachedResponse) return cachedResponse as NextResponse<SignupResponse>;

  // CSRF protection
  const csrfError = applyCsrf(request);
  if (csrfError) return csrfError as NextResponse<SignupResponse>;

  try {
    const rateLimited = await applyRateLimit(request, 'signup', 'strict');
    if (rateLimited) return rateLimited as NextResponse<SignupResponse>;

    const body = await request.json() as SignupRequestBody;

    // Validate required fields
    if (!body.email) return validationError('Email is required', 'EMAIL_REQUIRED');

    const email = validateEmail(body.email);
    if (!email) return validationError('Invalid email address', 'INVALID_EMAIL');

    if (!body.gdprAccepted) return validationError('Consent is required', 'CONSENT_REQUIRED');

    // Validate optional fields
    if (body.locale && !isValidLocale(body.locale)) return validationError('Invalid locale', 'INVALID_LOCALE');
    if (body.source && !isValidSource(body.source)) return validationError('Invalid source', 'INVALID_SOURCE');
    if (body.tags && !isValidTags(body.tags)) return validationError('Invalid tags', 'INVALID_TAGS');
    if (body.name && !isValidName(body.name)) return validationError('Invalid name', 'INVALID_NAME');

    // Check for existing signup - return same response structure to prevent email enumeration
    // Security: Attackers cannot distinguish between new and existing signups
    if (await exists(email)) {
      const existing = await getByEmail(email);
      if (existing) {
        const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, existing.referralCode);
        return NextResponse.json(successResponse(existing, referralUrl));
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

    // Extract correlation ID early so it can be reused for audit logging
    const correlationId = request.headers.get('x-request-id') || undefined;

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

    // Audit trail (fire-and-forget)
    logAuditEvent({
      eventType: 'waitlist.signup',
      entityType: 'waitlist_entry',
      entityId: String(entry.id),
      actorIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      actorUserAgent: request.headers.get('user-agent') ?? undefined,
      correlationId,
      details: { locale: body.locale || 'en', source: body.source || 'direct', hasReferral: !!referredBy },
    });

    // Credit the referrer's invite count + notify them
    if (referredBy) {
      const referrer = await getByReferralCode(referredBy);
      if (referrer) {
        const updatedReferrer = await processReferral(referrer.email);
        // Notify referrer (fire-and-forget, matching sendWelcomeEmail pattern)
        if (updatedReferrer) {
          sendEmailAsync({
            method: 'sendReferralSuccess',
            recipient: referrer.email,
            template: 'referral-success',
            subject: 'Someone used your invite!',
            locale: body.locale || 'en',
            data: {
              locale: body.locale || 'en',
              name: updatedReferrer.name,
              referralCount: updatedReferrer.referralCount,
              tier: updatedReferrer.tier,
              invitesRemaining: Math.max(0, 5 - updatedReferrer.referralCount),
            },
          });
        }
      }
    }

    const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, referralCode);

    // Send welcome email (non-blocking)
    const welcomeLocale = body.locale || 'en';
    sendEmailAsync({
      method: 'sendWelcome',
      recipient: email,
      template: 'welcome',
      subject: 'Welcome to diBoaS',
      locale: welcomeLocale,
      data: {
        position: entry.position,
        referralCode,
        referralUrl,
        locale: welcomeLocale,
        name: body.name ? sanitizeUserName(body.name) : undefined,
        tier: entry.tier,
      },
      enrichData: async () => {
        const foundingMember = await getFoundingMemberCount();
        return {
          foundingMemberSpotsRemaining: Math.max(0, foundingMember.cap - foundingMember.count),
        };
      },
    });

    // Emit signup completed event for analytics and audit trail
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
      source: 'waitlist',
      timestamp: Date.now(),
      correlationId,
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

    const responseBody = successResponse(entry, referralUrl);
    await cacheIdempotentResponse(idempotencyKey, 200, responseBody);

    logRequestEnd('POST', '/api/waitlist/signup', 200, startTime);
    return NextResponse.json(responseBody);

  } catch (error) {
    Logger.error('Waitlist signup error', {}, error instanceof Error ? error : undefined);

    // Emit signup failed event for audit trail
    applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_FAILED, {
      source: 'waitlist',
      timestamp: Date.now(),
      correlationId: request.headers.get('x-request-id') || undefined,
      metadata: {
        errorType: error instanceof DuplicateEntryError
          ? 'duplicate'
          : 'unknown',
      },
    });

    // Emit application error for monitoring
    emitErrorEvent('waitlist', 'signup', error);

    // Handle duplicate email error from store (race condition)
    // Return generic error to prevent email enumeration
    if (error instanceof DuplicateEntryError) {
      return NextResponse.json(
        { success: false, error: 'Unable to process request. Please try again.', errorCode: 'PROCESSING_ERROR' },
        { status: 500 }
      );
    }

    logRequestEnd('POST', '/api/waitlist/signup', 500, startTime);
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
  try {
    // Rate limit check requests
    const rateLimited = await applyRateLimit(request, 'check', 'standard');
    if (rateLimited) return rateLimited;

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = validateEmail(email);

    if (!sanitizedEmail) {
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
