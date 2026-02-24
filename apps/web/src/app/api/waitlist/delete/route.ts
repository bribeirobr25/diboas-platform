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
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
  generateDeletionToken,
  hashToken,
  verifyToken,
  csrfProtection,
} from '@/lib/security';
import { getByEmail, deleteByEmail } from '@/lib/waitingList/store';
import { sql } from '@/lib/database/client';
import { isValidEmail } from '@/lib/waitingList/helpers';
import { Logger } from '@/lib/monitoring/Logger';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Store a deletion token in the database.
 */
async function storeDeletionToken(tokenHash: string, email: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  await sql`
    INSERT INTO deletion_tokens (token_hash, email, expires_at)
    VALUES (${tokenHash}, ${email}, ${expiresAt})
    ON CONFLICT (token_hash) DO UPDATE SET
      email = ${email},
      expires_at = ${expiresAt}
  `;
}

/**
 * Look up a deletion token from the database.
 * Automatically cleans up expired tokens.
 */
async function findDeletionToken(token: string): Promise<{ email: string } | null> {
  // Clean up expired tokens (probabilistic)
  if (Math.random() < 0.1) {
    await sql`DELETE FROM deletion_tokens WHERE expires_at < NOW()`;
  }

  // Retrieve all non-expired tokens and verify against the provided token
  const rows = await sql`
    SELECT token_hash, email FROM deletion_tokens WHERE expires_at > NOW()
  `;

  for (const row of rows) {
    const r = row as { token_hash: string; email: string };
    if (verifyToken(token, r.token_hash)) {
      return { email: r.email };
    }
  }

  return null;
}

/**
 * Remove a deletion token from the database after use.
 */
async function removeDeletionToken(token: string): Promise<void> {
  const rows = await sql`
    SELECT token_hash FROM deletion_tokens WHERE expires_at > NOW()
  `;
  for (const row of rows) {
    const r = row as { token_hash: string };
    if (verifyToken(token, r.token_hash)) {
      await sql`DELETE FROM deletion_tokens WHERE token_hash = ${r.token_hash}`;
      return;
    }
  }
}

/**
 * POST /api/waitlist/delete
 *
 * Request deletion of user data.
 * Always returns 202 regardless of whether email exists (prevents enumeration).
 */
export async function POST(request: Request): Promise<NextResponse> {
  // CSRF protection
  const csrfError = csrfProtection(request as unknown as NextRequest);
  if (csrfError) {
    return csrfError as NextResponse;
  }

  const clientIP = getClientIP(request);

  // Rate limiting - strict for deletion requests
  const rateLimitResult = await checkRateLimit(
    `delete:${clientIP}`,
    RateLimitPresets.strict.limit,
    RateLimitPresets.strict.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

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

      // Emit deletion requested event for audit trail
      applicationEventBus.emit(ApplicationEventType.WAITLIST_DELETION_REQUESTED, {
        source: 'waitlist',
        timestamp: Date.now(),
        reason: 'user_request',
        metadata: {
          tokenExpiry: Date.now() + TOKEN_TTL_MS,
        },
      });

      // Send deletion confirmation email (non-blocking)
      sendDeletionEmail(normalizedEmail, token, entry.locale);

      return NextResponse.json(
        {
          success: true,
          message: 'If this email exists in our system, you will receive deletion instructions via email.',
        },
        {
          status: 202,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Email doesn't exist - return same response to prevent enumeration
    // Add artificial delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    return NextResponse.json(
      {
        success: true,
        message: 'If this email exists in our system, you will receive deletion instructions.',
      },
      {
        status: 202,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'waitlist',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'high',
      context: {
        operation: 'deletion_request',
      },
    });

    Logger.error('[GDPR] Deletion request error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}

/**
 * Send deletion confirmation email (fire-and-forget).
 */
function sendDeletionEmail(email: string, _token: string, locale: string): void {
  Promise.all([
    import('@diboas/email'),
  ]).then(async ([{ createEmailService, sendViaResend }]) => {
    try {
      const emailService = createEmailService({ send: sendViaResend });
      const result = await emailService.sendDeletionConfirmation(email, { locale });

      if (result.success) {
        Logger.info('[Email] Deletion confirmation email sent');
      } else {
        Logger.error('[Email] Deletion confirmation email failed', { error: result.error });
      }
    } catch (err) {
      Logger.error('[Email] Deletion email error', {}, err instanceof Error ? err : undefined);
    }
  }).catch((err) => {
    Logger.error('[Email] Failed to load email service', {}, err instanceof Error ? err : undefined);
  });
}

/**
 * DELETE /api/waitlist/delete
 *
 * Confirm and execute deletion with token.
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  // CSRF protection
  const csrfError = csrfProtection(request as unknown as NextRequest);
  if (csrfError) {
    return csrfError as NextResponse;
  }

  const clientIP = getClientIP(request);

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    `delete-confirm:${clientIP}`,
    RateLimitPresets.strict.limit,
    RateLimitPresets.strict.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  }

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

    // Find pending deletion by verifying token against stored hashes
    const found = await findDeletionToken(token);

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired deletion token' },
        { status: 400 }
      );
    }

    // Execute deletion
    const deleted = await deleteByEmail(found.email);

    // Remove pending deletion token
    await removeDeletionToken(token);

    if (deleted) {
      Logger.info('[GDPR] Data deleted successfully');

      // Emit deletion completed event for audit trail
      applicationEventBus.emit(ApplicationEventType.WAITLIST_DELETION_COMPLETED, {
        source: 'waitlist',
        timestamp: Date.now(),
        reason: 'gdpr',
        metadata: {
          method: 'token_confirmation',
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Your data has been permanently deleted from our system.',
        },
        {
          status: 200,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Entry was already deleted or never existed
    return NextResponse.json(
      {
        success: true,
        message: 'No data found to delete.',
      },
      {
        status: 200,
        headers: createRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    // Emit application error for monitoring
    applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
      source: 'waitlist',
      timestamp: Date.now(),
      error: error instanceof Error ? error : new Error(String(error)),
      severity: 'high',
      context: {
        operation: 'deletion_confirmation',
      },
    });

    Logger.error('[GDPR] Deletion confirmation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion' },
      { status: 500 }
    );
  }
}
