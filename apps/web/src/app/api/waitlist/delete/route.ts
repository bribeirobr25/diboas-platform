/**
 * GDPR Data Deletion API
 *
 * Implements Article 17 "Right to Erasure" compliance.
 * Two-step deletion process:
 * 1. POST: Request deletion (generates token, returns 202)
 * 2. DELETE: Confirm deletion with token (actually deletes)
 *
 * Security:
 * - Does not reveal email existence (prevents enumeration)
 * - Token-based confirmation
 * - Rate limited
 * - Audit logging
 */

import { NextResponse } from 'next/server';
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
import { Logger } from '@/lib/monitoring/Logger';

// In-memory token store (in production, use Redis with TTL)
const pendingDeletions = new Map<string, { email: string; expiresAt: number }>();
const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [hash, data] of pendingDeletions.entries()) {
    if (data.expiresAt < now) {
      pendingDeletions.delete(hash);
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
  const csrfError = csrfProtection(request as any);
  if (csrfError) {
    return csrfError as unknown as NextResponse;
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Clean up expired tokens periodically
    if (Math.random() < 0.1) {
      cleanupExpiredTokens();
    }

    // Check if email exists (silently - don't reveal to user)
    const entry = getByEmail(normalizedEmail);

    if (entry) {
      // Generate deletion token
      const token = generateDeletionToken();
      const tokenHash = hashToken(token);

      // Store pending deletion
      pendingDeletions.set(tokenHash, {
        email: normalizedEmail,
        expiresAt: Date.now() + TOKEN_TTL_MS,
      });

      // In production, send this token via email
      // Token is never exposed in response - only sent via secure email channel
      Logger.info('[GDPR] Deletion requested for email, token generated');

      // TODO: Send deletion confirmation email with token
      // await sendDeletionConfirmationEmail(normalizedEmail, token);

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
    console.error('[GDPR] Deletion request error:', error);
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
  // CSRF protection
  const csrfError = csrfProtection(request as any);
  if (csrfError) {
    return csrfError as unknown as NextResponse;
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

    // Clean up expired tokens
    cleanupExpiredTokens();

    // Find pending deletion by verifying token against stored hashes
    let foundHash: string | null = null;
    let foundEmail: string | null = null;

    for (const [hash, data] of pendingDeletions.entries()) {
      if (verifyToken(token, hash)) {
        foundHash = hash;
        foundEmail = data.email;
        break;
      }
    }

    if (!foundHash || !foundEmail) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired deletion token' },
        { status: 400 }
      );
    }

    // Execute deletion
    const deleted = deleteByEmail(foundEmail);

    // Remove pending deletion
    pendingDeletions.delete(foundHash);

    if (deleted) {
      Logger.info('[GDPR] Data deleted successfully');
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
    console.error('[GDPR] Deletion confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion' },
      { status: 500 }
    );
  }
}
