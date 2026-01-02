/**
 * Zero-Trust Authentication Utilities
 *
 * Provides API authentication and authorization helpers
 * for securing internal and admin endpoints.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  error?: string;
  isAdmin?: boolean;
}

/**
 * Validate API key from request headers
 *
 * @param request - The incoming request
 * @param requireAdmin - Whether admin-level access is required
 * @returns Authentication result
 */
export function validateApiKey(
  request: Request,
  requireAdmin: boolean = false
): AuthResult {
  const apiKey = request.headers.get('x-api-key');
  const internalApiKey = process.env.INTERNAL_API_KEY;

  // Check if API key is configured
  if (!internalApiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Auth] INTERNAL_API_KEY not configured in production');
      return {
        authenticated: false,
        error: 'Server configuration error',
      };
    }
    // Allow in development without key
    return {
      authenticated: true,
      isAdmin: true,
    };
  }

  // No API key provided
  if (!apiKey) {
    logAuthFailure(request, 'Missing API key');
    return {
      authenticated: false,
      error: 'API key required',
    };
  }

  // Use timing-safe comparison
  const isValid = timingSafeEqual(apiKey, internalApiKey);

  if (!isValid) {
    logAuthFailure(request, 'Invalid API key');
    return {
      authenticated: false,
      error: 'Invalid API key',
    };
  }

  return {
    authenticated: true,
    isAdmin: true,
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
      // Compare with self to maintain constant time
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Log authentication failure for audit
 */
function logAuthFailure(request: Request, reason: string): void {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const path = new URL(request.url).pathname;

  console.warn(`[Auth] Failed authentication: ${reason}`, {
    ip,
    path,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(error: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status: 401 }
  );
}

/**
 * Create forbidden response
 */
export function createForbiddenResponse(error: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status: 403 }
  );
}

/**
 * Middleware helper to require authentication
 * Returns null if authenticated, or an error response
 */
export function requireAuth(
  request: Request,
  options: { requireAdmin?: boolean } = {}
): NextResponse | null {
  const result = validateApiKey(request, options.requireAdmin);

  if (!result.authenticated) {
    return createUnauthorizedResponse(result.error);
  }

  return null;
}

/**
 * Generate a secure deletion token
 */
export function generateDeletionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a deletion token for storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a deletion token against its hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return timingSafeEqual(tokenHash, hash);
}
