/**
 * Investor-materials Request API Route
 *
 * Thin HTTP adapter — delegates orchestration to `InvestorRequestService`.
 * Mirrors the waitlist signup route's HTTP-layer contract: idempotency, CSRF,
 * rate limit, body parsing + field validation/sanitization, response shaping,
 * correlationId threading, and error events. PII is encrypted in the service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIdempotentResponse, cacheIdempotentResponse } from '@/lib/security';
import {
  applyRateLimit,
  applyCsrf,
  validateEmail,
  emitErrorEvent,
  getCorrelationId,
} from '@/lib/api/routeHelpers';
import { isValidLocale } from '@/lib/api/validators';
import { sanitizeText } from '@/lib/utils/sanitize';
import { Logger } from '@/lib/monitoring/Logger';
import { investorRequestService, isInvestorType } from '@/lib/investor';

interface InvestorRequestBody {
  email: string;
  name?: string;
  company?: string;
  investorType?: string;
  ticketSize?: string;
  thesis?: string;
  message?: string;
  locale?: string;
}

interface InvestorRequestResponse {
  success: boolean;
  error?: string;
  errorCode?: string;
}

const MAX_SHORT = 120;
const MAX_LONG = 2000;

function validationError(error: string, errorCode: string): NextResponse<InvestorRequestResponse> {
  return NextResponse.json({ success: false, error, errorCode }, { status: 400 });
}

/** Sanitize + length-cap a free-text field; undefined if empty after cleaning. */
function clean(value: string | undefined, max: number): string | undefined {
  if (!value || typeof value !== 'string') return undefined;
  const cleaned = sanitizeText(value).slice(0, max).trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

export async function POST(request: NextRequest): Promise<NextResponse<InvestorRequestResponse>> {
  // Idempotency — a double-submit / retry returns the cached response.
  const idempotencyKey = request.headers.get('idempotency-key');
  const cached = await getIdempotentResponse(idempotencyKey);
  if (cached) return cached as NextResponse<InvestorRequestResponse>;

  // CSRF protection.
  const csrfError = applyCsrf(request);
  if (csrfError) return csrfError as NextResponse<InvestorRequestResponse>;

  try {
    const rateLimited = await applyRateLimit(request, 'investor-request', 'strict');
    if (rateLimited) return rateLimited as NextResponse<InvestorRequestResponse>;

    const body = (await request.json()) as InvestorRequestBody;

    if (!body.email) return validationError('Email is required', 'EMAIL_REQUIRED');
    const email = validateEmail(body.email);
    if (!email) return validationError('Invalid email address', 'INVALID_EMAIL');

    const investorType =
      body.investorType && isInvestorType(body.investorType) ? body.investorType : undefined;
    if (body.investorType && !investorType) {
      return validationError('Invalid investor type', 'INVALID_TYPE');
    }

    const locale = body.locale && isValidLocale(body.locale) ? body.locale : undefined;

    const result = await investorRequestService.submit(
      {
        email,
        name: clean(body.name, MAX_SHORT),
        company: clean(body.company, MAX_SHORT),
        investorType,
        ticketSize: clean(body.ticketSize, MAX_SHORT),
        thesis: clean(body.thesis, MAX_LONG),
        message: clean(body.message, MAX_LONG),
        locale,
        correlationId: getCorrelationId(request),
      },
      {
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') ?? undefined,
      }
    );

    if (result.ok) {
      // Same response whether new or duplicate — no enumeration.
      const responseBody: InvestorRequestResponse = { success: true };
      await cacheIdempotentResponse(idempotencyKey, 200, responseBody);
      return NextResponse.json(responseBody);
    }

    if (result.code === 'EMAIL_REQUIRED') {
      return validationError('Email is required', 'EMAIL_REQUIRED');
    }

    // ENCRYPTION_UNAVAILABLE / SERVER_ERROR -> generic 500 (no detail leak).
    emitErrorEvent('investor', 'request', result.cause ?? result.code);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to process request. Please try again.',
        errorCode: 'PROCESSING_ERROR',
      },
      { status: 500 }
    );
  } catch (error) {
    Logger.error('Investor request error', {}, error instanceof Error ? error : undefined);
    emitErrorEvent('investor', 'request', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', errorCode: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
