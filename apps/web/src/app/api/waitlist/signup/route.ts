/**
 * Waitlist Signup API Route
 *
 * Thin HTTP adapter — delegates orchestration to
 * `WaitlistApplicationService.submitSignup()`. This route owns only
 * HTTP-layer concerns (idempotency, CSRF, rate limit, body parsing,
 * field validation, response shaping).
 *
 * Phase 2 M4 (audit/2026-05-08): refactored from 383 LoC of inline
 * orchestration to a thin adapter. Domain logic now lives in the service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIdempotentResponse, cacheIdempotentResponse } from '@/lib/security';
import { applyRateLimit, applyCsrf, validateEmail, emitErrorEvent } from '@/lib/api/routeHelpers';
import { isValidLocale, isValidSource, isValidTags, isValidName } from '@/lib/api/validators';
import { logRequestStart, logRequestEnd } from '@/lib/api/requestLogger';
import { Logger } from '@/lib/monitoring/Logger';
import { waitlistApplicationService } from '@/lib/waitingList/WaitlistApplicationService';
import type { WaitlistSource, WaitlistTier } from '@/lib/waitingList/store';

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

/**
 * Detect country from CDN geo-IP headers with Accept-Language fallback.
 * Does NOT store IP addresses — only derives a country code from headers.
 */
function detectCountry(request: NextRequest): string | undefined {
  const vercel = request.headers.get('x-vercel-ip-country');
  if (vercel && vercel !== 'XX') return vercel;

  const cf = request.headers.get('cf-ipcountry');
  if (cf && cf !== 'XX') return cf;

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

    const body = (await request.json()) as SignupRequestBody;

    // ---- Validation (HTTP layer) -------------------------------------------
    if (!body.email) return validationError('Email is required', 'EMAIL_REQUIRED');

    const email = validateEmail(body.email);
    if (!email) return validationError('Invalid email address', 'INVALID_EMAIL');

    if (!body.gdprAccepted) return validationError('Consent is required', 'CONSENT_REQUIRED');

    if (body.locale && !isValidLocale(body.locale))
      return validationError('Invalid locale', 'INVALID_LOCALE');
    if (body.source && !isValidSource(body.source))
      return validationError('Invalid source', 'INVALID_SOURCE');
    if (body.tags && !isValidTags(body.tags))
      return validationError('Invalid tags', 'INVALID_TAGS');
    if (body.name && !isValidName(body.name))
      return validationError('Invalid name', 'INVALID_NAME');

    // ---- Delegate to application service -----------------------------------
    const result = await waitlistApplicationService.submitSignup({
      email,
      name: body.name,
      locale: body.locale,
      gdprAccepted: body.gdprAccepted,
      referredBy: body.referredBy,
      source: body.source,
      tags: body.tags,
      country: detectCountry(request),
      correlationId: request.headers.get('x-request-id') || undefined,
      actorIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
      actorUserAgent: request.headers.get('user-agent') ?? undefined,
    });

    // ---- Map result -> HTTP response ---------------------------------------
    if (result.ok) {
      const responseBody: SignupResponse = {
        success: true,
        position: result.data.position,
        referralCode: result.data.referralCode,
        referralUrl: result.data.referralUrl,
        tier: result.data.tier,
      };
      await cacheIdempotentResponse(idempotencyKey, 200, responseBody);
      logRequestEnd('POST', '/api/waitlist/signup', 200, startTime);
      return NextResponse.json(responseBody);
    }

    // Failure mapping — keep the same status/error contract callers expect.
    if (result.code === 'EMAIL_REQUIRED') {
      return validationError('Email is required', 'EMAIL_REQUIRED');
    }
    if (result.code === 'CONSENT_REQUIRED') {
      return validationError('Consent is required', 'CONSENT_REQUIRED');
    }
    if (result.code === 'PROCESSING_ERROR') {
      // Duplicate-race condition — generic 500 to prevent enumeration.
      emitErrorEvent('waitlist', 'signup', result.cause);
      logRequestEnd('POST', '/api/waitlist/signup', 500, startTime);
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to process request. Please try again.',
          errorCode: 'PROCESSING_ERROR',
        },
        { status: 500 }
      );
    }

    // SERVER_ERROR
    emitErrorEvent('waitlist', 'signup', result.cause);
    logRequestEnd('POST', '/api/waitlist/signup', 500, startTime);
    return NextResponse.json(
      { success: false, error: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  } catch (error) {
    Logger.error('Waitlist signup error', {}, error instanceof Error ? error : undefined);
    emitErrorEvent('waitlist', 'signup', error);
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
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    // Artificial delay to prevent timing attacks (100-300ms)
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    return NextResponse.json({
      success: true,
      message: 'Check complete. Use position endpoint with authentication to retrieve your data.',
    });
  } catch (error) {
    Logger.error('Waitlist check error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
