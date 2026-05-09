/**
 * API Route Helpers
 *
 * Shared utilities for API route handlers to reduce boilerplate.
 * Each helper returns NextResponse | null — null means "continue processing".
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
  csrfProtection,
} from '@/lib/security';
import { sanitizeText } from '@/lib/utils/sanitize';
import { isValidEmail } from '@/lib/waitingList/helpers';
import { Logger } from '@/lib/monitoring/Logger';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

type RateLimitPreset = keyof typeof RateLimitPresets;

/**
 * Read the request's `x-request-id` header (set by middleware) for use as
 * the `correlationId` on emitted events. Falls back to a fresh UUID if the
 * header is missing — but this should not happen in normal flow because
 * `apps/web/middleware.ts` always sets it.
 *
 * Phase 2 M1 (audit/2026-05-08): unified entry point for distributed tracing.
 */
export function getCorrelationId(request: NextRequest): string {
  const fromHeader = request.headers.get('x-request-id');
  if (fromHeader) return fromHeader;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Apply rate limiting. Returns a 429 response if limited, null otherwise.
 */
export async function applyRateLimit(
  request: NextRequest,
  operationKey: string,
  preset: RateLimitPreset = 'standard'
): Promise<NextResponse | null> {
  const clientIP = getClientIP(request);
  const config = RateLimitPresets[preset];
  const result = await checkRateLimit(
    `${operationKey}:${clientIP}`,
    config.limit,
    config.windowMs
  );

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.', errorCode: 'RATE_LIMITED' },
      { status: 429, headers: createRateLimitHeaders(result) }
    );
  }

  return null;
}

/**
 * Apply CSRF protection. Returns a 403 response if invalid, null otherwise.
 */
export function applyCsrf(request: NextRequest): NextResponse | null {
  const error = csrfProtection(request);
  return error ? (error as NextResponse) : null;
}

/**
 * Validate and sanitize an email address.
 * Returns sanitized email or null if invalid.
 */
export function validateEmail(rawEmail: string): string | null {
  const email = sanitizeText(rawEmail.toLowerCase().trim());
  return isValidEmail(email) ? email : null;
}

/**
 * Emit an APPLICATION_ERROR event to the event bus.
 */
export function emitErrorEvent(
  source: string,
  operation: string,
  error: unknown,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
  domain: 'waitlist' | 'consent' | 'share' | 'preDemo' | 'preDream' | 'analytics' | 'monitoring' | 'application' = 'application'
): void {
  applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
    domain,
    source,
    timestamp: Date.now(),
    error: error instanceof Error ? error : new Error(String(error)),
    severity,
    context: { operation },
  });
}

/**
 * Build a JSON error response.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  errorCode?: string
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, ...(errorCode && { errorCode }) },
    { status }
  );
}

/**
 * Build a JSON success response.
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    { success: true, ...data },
    { status }
  );
}

/**
 * Standard error handler for catch blocks.
 * Logs, emits error event, returns 500 response.
 */
export function handleRouteError(
  error: unknown,
  source: string,
  operation: string,
  logMessage: string
): NextResponse {
  emitErrorEvent(source, operation, error);
  Logger.error(logMessage, {}, error instanceof Error ? error : undefined);
  return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
}
