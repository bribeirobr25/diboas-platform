/**
 * Email Unsubscribe API Route
 *
 * GET  — redirects to branded email-preferences page
 * POST — processes unsubscribe/resubscribe (RFC 8058 one-click + page fetch)
 *
 * URL: /api/email/unsubscribe?id={emailHash}&token={hmacOfEmailHash}
 *
 * Security: HMAC-signed tokens, no PII in URLs, rate limited, audit logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { hmacHash } from '@/lib/security/encryption';
import { applyRateLimit } from '@/lib/api/routeHelpers';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { Logger } from '@/lib/monitoring/Logger';
import { sql } from '@/lib/database/client';

/**
 * Verify the HMAC token matches the email hash.
 */
function verifyToken(emailHash: string, token: string): boolean {
  const expected = hmacHash(emailHash);
  if (!expected) return false;
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * GET — Redirect to branded email-preferences page.
 * Handles pre-RFC 8058 email clients that GET the List-Unsubscribe URL.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'unsubscribe', 'standard');
  if (rateLimited) return rateLimited;

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');
  const token = searchParams.get('token');

  if (!id || !token) {
    return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 400 });
  }

  const pageUrl = `/en/email-preferences?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`;
  return NextResponse.redirect(new URL(pageUrl, request.url));
}

/**
 * POST — Process unsubscribe or resubscribe.
 *
 * Two callers:
 * 1. RFC 8058 one-click: email client POSTs with body "List-Unsubscribe=One-Click",
 *    id/token in URL query params
 * 2. Page fetch: EmailPreferencesContent sends JSON body with { id, token, action }
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'unsubscribe', 'standard');
  if (rateLimited) return rateLimited;

  try {
    // RFC 8058: id/token come from URL query params
    const { searchParams } = request.nextUrl;
    let id = searchParams.get('id');
    let token = searchParams.get('token');
    let action = 'unsubscribe';

    // Page fetch: id/token/action come from JSON body
    if (!id || !token) {
      const body = await request.json().catch(() => ({}));
      id = body.id || null;
      token = body.token || null;
      action = body.action || 'unsubscribe';
    }

    if (!id || !token || !verifyToken(id, token)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const optOut = action !== 'resubscribe';

    await sql`
      UPDATE waitlist_entries
      SET email_opted_out = ${optOut}, updated_at = ${new Date().toISOString()}
      WHERE email_hash = ${id}
    `;

    const eventType = optOut ? 'EMAIL_UNSUBSCRIBED' : 'EMAIL_RESUBSCRIBED';
    logAuditEvent({
      eventType,
      entityType: 'waitlist_entry',
      entityId: id.substring(0, 16),
      details: { action },
    });

    Logger.info(`Email ${eventType.toLowerCase()}`, { emailHash: id.substring(0, 8) + '...' });

    const message = optOut
      ? 'You have been unsubscribed. Your waitlist position is preserved.'
      : 'You have been re-subscribed to diBoaS emails.';

    return NextResponse.json({ success: true, message });
  } catch (error) {
    Logger.error('Unsubscribe error', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
}
