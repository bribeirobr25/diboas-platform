/**
 * GDPR Data Deletion API — thin HTTP adapter
 *
 * Implements Article 17 "Right to Erasure" compliance via a two-step flow:
 *   1. POST   /api/waitlist/delete  — request deletion (token issued + emailed)
 *   2. DELETE /api/waitlist/delete  — confirm deletion with token
 *
 * Both endpoints delegate orchestration to
 * `WaitlistApplicationService.requestDeletion()` and `confirmDeletion()`.
 * This file owns only HTTP-layer concerns (CSRF, rate limit, response shaping,
 * anti-enumeration timing).
 *
 * Phase 2 M4 (audit/2026-05-08): refactored from 328 LoC of inline logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, applyCsrf, emitErrorEvent } from '@/lib/api/routeHelpers';
import { logRequestStart, logRequestEnd } from '@/lib/api/requestLogger';
import { isValidEmail } from '@/lib/waitingList/helpers';
import { Logger } from '@/lib/monitoring/Logger';
import { waitlistApplicationService } from '@/lib/waitingList/WaitlistApplicationService';

/**
 * Audit context extracted from request headers, passed straight through to
 * the application service so it can log without seeing the request object.
 */
function buildAuditContext(request: NextRequest) {
  return {
    correlationId: request.headers.get('x-request-id') || undefined,
    actorIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    actorUserAgent: request.headers.get('user-agent') ?? undefined,
  };
}

/**
 * POST /api/waitlist/delete
 *
 * Request deletion of user data. Always returns 202 regardless of whether
 * the email exists, to prevent enumeration. When the email doesn't exist
 * the service returns quickly, so we add an artificial 100–300 ms delay
 * here to keep timing flat across the existence boundary.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const startTime = logRequestStart('POST', '/api/waitlist/delete');
  const nextReq = request as unknown as NextRequest;

  const csrfError = applyCsrf(nextReq);
  if (csrfError) return csrfError;

  const rateLimited = await applyRateLimit(nextReq, 'delete', 'strict');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }

    const result = await waitlistApplicationService.requestDeletion({
      email: normalizedEmail,
      ...buildAuditContext(nextReq),
    });

    if (!result.ok) {
      emitErrorEvent('waitlist', 'deletion_request', result.cause);
      logRequestEnd('POST', '/api/waitlist/delete', 500, startTime);
      return NextResponse.json(
        { success: false, error: 'Failed to process deletion request' },
        { status: 500 }
      );
    }

    // Anti-enumeration: equalize response timing across exists/doesn't-exist.
    if (!result.entryExists) {
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));
    }

    logRequestEnd('POST', '/api/waitlist/delete', 202, startTime);
    return NextResponse.json(
      {
        success: true,
        message:
          'If this email exists in our system, you will receive deletion instructions via email.',
      },
      { status: 202 }
    );
  } catch (error) {
    emitErrorEvent('waitlist', 'deletion_request', error);
    Logger.error('[GDPR] Deletion request error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    logRequestEnd('POST', '/api/waitlist/delete', 500, startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/waitlist/delete
 *
 * Confirm and execute deletion with token (single-use, 15-minute TTL).
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  const startTime = logRequestStart('DELETE', '/api/waitlist/delete');
  const nextReq = request as unknown as NextRequest;

  const csrfError = applyCsrf(nextReq);
  if (csrfError) return csrfError;

  const rateLimited = await applyRateLimit(nextReq, 'delete-confirm', 'strict');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Deletion token is required' },
        { status: 400 }
      );
    }

    const result = await waitlistApplicationService.confirmDeletion({
      token,
      ...buildAuditContext(nextReq),
    });

    if (!result.ok) {
      if (result.code === 'INVALID_TOKEN') {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired deletion token' },
          { status: 400 }
        );
      }
      emitErrorEvent('waitlist', 'deletion_confirmation', result.cause);
      logRequestEnd('DELETE', '/api/waitlist/delete', 500, startTime);
      return NextResponse.json(
        { success: false, error: 'Failed to process deletion' },
        { status: 500 }
      );
    }

    logRequestEnd('DELETE', '/api/waitlist/delete', 200, startTime);
    return NextResponse.json(
      {
        success: true,
        message: result.deleted
          ? 'Your data has been permanently deleted from our system.'
          : 'No data found to delete.',
      },
      { status: 200 }
    );
  } catch (error) {
    emitErrorEvent('waitlist', 'deletion_confirmation', error);
    Logger.error('[GDPR] Deletion confirmation error:', {
      error: error instanceof Error ? error.message : String(error),
    });
    logRequestEnd('DELETE', '/api/waitlist/delete', 500, startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion' },
      { status: 500 }
    );
  }
}
