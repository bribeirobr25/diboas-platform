/**
 * Email Unsubscribe API Route
 *
 * GET  — redirects to branded email-preferences page
 * POST — processes unsubscribe/resubscribe (RFC 8058 one-click + page fetch)
 *
 * URL formats (both supported):
 *   New: /api/email/unsubscribe?t={base64url(id:token)}
 *   Legacy: /api/email/unsubscribe?id={emailHash}&token={hmacOfEmailHash}
 *
 * Security: HMAC-signed tokens, no PII in URLs, rate limited, audit logged
 */

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { detectPreferredLocale } from '@diboas/i18n/config';
import { hmacHash } from '@/lib/security/encryption';
import { decodeUnsubToken } from '@/lib/email/unsubscribeUrl';
import { applyRateLimit } from '@/lib/api/routeHelpers';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { Logger } from '@/lib/monitoring/Logger';
import { sql } from '@/lib/database/client';

/**
 * Verify the HMAC token matches the email hash using a constant-time
 * comparison (prevents timing attacks). Length-mismatch leaks the length
 * but not the contents — and HMAC outputs are always the same length, so
 * any length mismatch is a malformed input, not a useful signal.
 *
 * Phase 1.6 (audit/L2, 2026-05-08): replaced the manual constant-time
 * loop with the canonical `crypto.timingSafeEqual` for audit-friendliness.
 */
function verifyToken(emailHash: string, token: string): boolean {
  const expected = hmacHash(emailHash);
  if (!expected) return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Extract id and token from request params.
 * R2 fix: full fallback chain for both new `t` param and legacy `id`+`token`.
 */
function extractIdToken(
  searchParams: URLSearchParams,
  body?: Record<string, unknown>
): { id: string; token: string } | null {
  // 1. Try `t` param from URL (new format)
  const tParam = searchParams.get('t');
  if (tParam) {
    const decoded = decodeUnsubToken(tParam);
    if (decoded) return decoded;
  }

  // 2. Try legacy `id` + `token` from URL
  const urlId = searchParams.get('id');
  const urlToken = searchParams.get('token');
  if (urlId && urlToken) return { id: urlId, token: urlToken };

  // 3. Try `t` param from body (page fetch with new format)
  if (body?.t && typeof body.t === 'string') {
    const decoded = decodeUnsubToken(body.t);
    if (decoded) return decoded;
  }

  // 4. Try legacy `id` + `token` from body (page fetch)
  if (body?.id && body?.token && typeof body.id === 'string' && typeof body.token === 'string') {
    return { id: body.id, token: body.token };
  }

  return null;
}

/**
 * GET — Redirect to branded email-preferences page.
 * Handles pre-RFC 8058 email clients that GET the List-Unsubscribe URL.
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'unsubscribe', 'standard');
  if (rateLimited) return rateLimited;

  const { searchParams } = request.nextUrl;
  const params = extractIdToken(searchParams);

  if (!params) {
    return NextResponse.json({ success: false, error: 'Invalid link' }, { status: 400 });
  }

  // Detect locale from Accept-Language header for a localized experience
  const locale = detectPreferredLocale(null, request.headers.get('Accept-Language'));

  // Re-encode as `t` param for the redirect
  const t = Buffer.from(`${params.id}:${params.token}`).toString('base64url');
  const pageUrl = `/${locale}/email-preferences?t=${t}`;
  return NextResponse.redirect(new URL(pageUrl, request.url));
}

/**
 * POST — Process unsubscribe or resubscribe.
 *
 * Two callers:
 * 1. RFC 8058 one-click: email client POSTs with body "List-Unsubscribe=One-Click",
 *    id/token in URL query params (via `t` or legacy format)
 * 2. Page fetch: EmailPreferencesContent sends JSON body with { id, token, action }
 */
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'unsubscribe', 'standard');
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = request.nextUrl;
    const body = await request.json().catch(() => ({}));
    const action = (body.action as string) || 'unsubscribe';

    const params = extractIdToken(searchParams, body);

    if (!params || !verifyToken(params.id, params.token)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    }

    const { id } = params;

    // @deprecated: resubscribe action kept as safety net.
    // Primary re-subscribe path is now via waitlist signup form (resets email_opted_out).
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

    Logger.info(`Email ${eventType.toLowerCase()}`, { emailHash: `${id.substring(0, 8)}...` });

    const message = optOut
      ? 'You have been unsubscribed. Your waitlist position is preserved.'
      : 'You have been re-subscribed to diBoaS emails.';

    return NextResponse.json({ success: true, message });
  } catch (error) {
    Logger.error(
      'Unsubscribe error',
      {},
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ success: false, error: 'An error occurred' }, { status: 500 });
  }
}
