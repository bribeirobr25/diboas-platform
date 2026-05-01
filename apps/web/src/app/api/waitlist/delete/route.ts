/**
 * GDPR Data Deletion API
 *
 * Implements Article 17 "Right to Erasure" compliance.
 * Two-step deletion process:
 * 1. POST: Request deletion (generates token, stores in DB)
 * 2. DELETE: Confirm deletion with token (actually deletes)
 *
 * Security:
 * - Does not reveal email existence (prevents enumeration)
 * - Token-based confirmation (tokens stored in DB, not memory)
 * - Rate limited
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateDeletionToken,
  hashToken,
} from '@/lib/security';
import { applyRateLimit, applyCsrf, emitErrorEvent } from '@/lib/api/routeHelpers';
import { logRequestStart, logRequestEnd } from '@/lib/api/requestLogger';
import { getByEmail, deleteByEmail } from '@/lib/waitingList/store';
import { sql } from '@/lib/database/client';
import { encrypt, decrypt, hmacHash } from '@/lib/security/encryption';
import { isValidEmail } from '@/lib/waitingList/helpers';
import { Logger } from '@/lib/monitoring/Logger';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { logGdprDeletion } from '@/lib/audit/GdprDeletionLogger';
import { sendEmailAsync } from '@/lib/email/sendEmail';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Store a deletion token in the database.
 * Email is encrypted (AES-256-GCM) with an HMAC blind index.
 */
async function storeDeletionToken(tokenHash: string, email: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const emailEnc = encrypt(email) || email;
  const emailHmac = hmacHash(email.toLowerCase().trim()) || '';

  await sql`
    INSERT INTO deletion_tokens (token_hash, email, email_hash, expires_at)
    VALUES (${tokenHash}, ${emailEnc}, ${emailHmac}, ${expiresAt})
    ON CONFLICT (token_hash) DO UPDATE SET
      email = ${emailEnc},
      email_hash = ${emailHmac},
      expires_at = ${expiresAt}
  `;
}

/**
 * Atomically consume a deletion token: find AND delete in a single SQL statement.
 * If two concurrent requests try the same token, only one gets the RETURNING row.
 * Also probabilistically cleans up expired tokens.
 */
async function consumeDeletionToken(token: string): Promise<{ email: string } | null> {
  // Clean up expired tokens (probabilistic)
  if (Math.random() < 0.1) {
    await sql`DELETE FROM deletion_tokens WHERE expires_at < NOW()`;
  }

  const hashedToken = hashToken(token);

  const rows = await sql`
    DELETE FROM deletion_tokens
    WHERE token_hash = ${hashedToken}
      AND expires_at > NOW()
    RETURNING email
  `;

  if (rows.length === 0) return null;

  const row = rows[0] as Record<string, unknown> | undefined;
  const emailValue = typeof row?.email === 'string' ? row.email : null;
  if (!emailValue) return null;

  // Decrypt email (falls back to plaintext for pre-migration rows)
  const decryptedEmail = decrypt(emailValue) || emailValue;
  return { email: decryptedEmail };
}

/**
 * POST /api/waitlist/delete
 *
 * Request deletion of user data.
 * Always returns 202 regardless of whether email exists (prevents enumeration).
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

    // Validate email format
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email exists (silently - don't reveal to user)
    const entry = await getByEmail(normalizedEmail);

    if (entry) {
      // Generate deletion token
      const token = generateDeletionToken();
      const tokenHash = hashToken(token);

      // Store pending deletion in database
      await storeDeletionToken(tokenHash, normalizedEmail);

      Logger.info('[GDPR] Deletion requested for email, token generated');

      // Audit trail (fire-and-forget)
      const correlationId = nextReq.headers.get('x-request-id') || undefined;
      logAuditEvent({
        eventType: 'gdpr.deletion.request',
        entityType: 'waitlist_entry',
        actorIp: nextReq.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        actorUserAgent: nextReq.headers.get('user-agent') ?? undefined,
        correlationId,
      });

      // Emit deletion requested event for audit trail
      applicationEventBus.emit(ApplicationEventType.WAITLIST_DELETION_REQUESTED, {
        source: 'waitlist',
        timestamp: Date.now(),
        correlationId,
        reason: 'user_request',
        metadata: {
          tokenExpiry: Date.now() + TOKEN_TTL_MS,
        },
      });

      // Send deletion confirmation email (non-blocking)
      const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://diboas.com'}/${entry.locale || 'en'}/delete-confirm?token=${token}`;
      sendEmailAsync({
        method: 'sendDeletionConfirmation',
        recipient: normalizedEmail,
        template: 'deletion-confirmation',
        subject: 'Confirm deletion request',
        locale: entry.locale || 'en',
        data: {
          locale: entry.locale || 'en',
          confirmationUrl,
          expiresInMinutes: 15,
          name: entry.name,
        },
      });

      logRequestEnd('POST', '/api/waitlist/delete', 202, startTime);
      return NextResponse.json(
        {
          success: true,
          message: 'If this email exists in our system, you will receive deletion instructions via email.',
        },
        { status: 202 }
      );
    }

    // Email doesn't exist - return same response to prevent enumeration
    // Add artificial delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    logRequestEnd('POST', '/api/waitlist/delete', 202, startTime);
    return NextResponse.json(
      {
        success: true,
        message: 'If this email exists in our system, you will receive deletion instructions.',
      },
      { status: 202 }
    );
  } catch (error) {
    emitErrorEvent('waitlist', 'deletion_request', error);
    Logger.error('[GDPR] Deletion request error:', { error: error instanceof Error ? error.message : String(error) });
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
 * Confirm and execute deletion with token.
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

    // Validate token
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Deletion token is required' },
        { status: 400 }
      );
    }

    // Atomically consume the deletion token (find + delete in one SQL statement).
    // If two concurrent requests try the same token, only one succeeds.
    const found = await consumeDeletionToken(token);

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired deletion token' },
        { status: 400 }
      );
    }

    // Capture entry data BEFORE deleting (needed for completion email)
    const entryBeforeDeletion = await getByEmail(found.email);
    const capturedLocale = entryBeforeDeletion?.locale || 'en';
    const capturedName = entryBeforeDeletion?.name;
    const capturedEmail = found.email;

    // Execute deletion
    const deleted = await deleteByEmail(found.email);

    if (deleted) {
      Logger.info('[GDPR] Data deleted successfully');

      // Audit trail (fire-and-forget)
      logAuditEvent({
        eventType: 'gdpr.deletion.completed',
        entityType: 'waitlist_entry',
        actorIp: nextReq.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        actorUserAgent: nextReq.headers.get('user-agent') ?? undefined,
        correlationId: nextReq.headers.get('x-request-id') || undefined,
        details: { method: 'token_confirmation' },
      });

      // GDPR deletion log (fire-and-forget)
      logGdprDeletion({
        entityType: 'waitlist_entry',
        deletedBy: 'user_request',
        reason: 'gdpr_article_17',
        correlationId: nextReq.headers.get('x-request-id') || undefined,
        metadata: { method: 'token_confirmation' },
      });

      // Emit deletion completed event for audit trail
      applicationEventBus.emit(ApplicationEventType.WAITLIST_DELETION_COMPLETED, {
        source: 'waitlist',
        timestamp: Date.now(),
        correlationId: nextReq.headers.get('x-request-id') || undefined,
        reason: 'gdpr',
        metadata: {
          method: 'token_confirmation',
        },
      });

      // Send deletion complete confirmation email (non-blocking)
      sendEmailAsync({
        method: 'sendDeletionComplete',
        recipient: capturedEmail,
        template: 'deletion-complete',
        subject: 'Data deleted',
        locale: capturedLocale,
        data: { locale: capturedLocale, name: capturedName },
      });

      logRequestEnd('DELETE', '/api/waitlist/delete', 200, startTime);
      return NextResponse.json(
        {
          success: true,
          message: 'Your data has been permanently deleted from our system.',
        },
        {
          status: 200,
        }
      );
    }

    // Entry was already deleted or never existed
    logRequestEnd('DELETE', '/api/waitlist/delete', 200, startTime);
    return NextResponse.json(
      {
        success: true,
        message: 'No data found to delete.',
      },
      { status: 200 }
    );
  } catch (error) {
    emitErrorEvent('waitlist', 'deletion_confirmation', error);
    Logger.error('[GDPR] Deletion confirmation error:', { error: error instanceof Error ? error.message : String(error) });
    logRequestEnd('DELETE', '/api/waitlist/delete', 500, startTime);
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion' },
      { status: 500 }
    );
  }
}
