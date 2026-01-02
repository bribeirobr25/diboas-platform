/**
 * CSRF Protection Utility
 *
 * Implements origin/referer validation for CSRF protection
 * in Next.js App Router API routes.
 */

import { NextRequest } from 'next/server';

// Allowed origins for CSRF validation
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL || 'https://diboas.com',
  'https://diboas.com',
  'https://www.diboas.com',
  // Development origins
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
    : [])
];

/**
 * Validates the request origin against allowed origins
 */
export function validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // Get origin from headers (prefer Origin, fallback to Referer)
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Check Origin header first
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed =>
      origin === allowed || origin.startsWith(allowed)
    );

    if (isAllowed) {
      return { valid: true };
    }

    return {
      valid: false,
      error: `Invalid origin: ${origin}`
    };
  }

  // Check Referer header as fallback
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;

      const isAllowed = ALLOWED_ORIGINS.some(allowed =>
        refererOrigin === allowed || refererOrigin.startsWith(allowed)
      );

      if (isAllowed) {
        return { valid: true };
      }

      return {
        valid: false,
        error: `Invalid referer origin: ${refererOrigin}`
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid referer format'
      };
    }
  }

  // In development, allow requests without origin/referer (for testing)
  if (process.env.NODE_ENV === 'development') {
    return { valid: true };
  }

  // In production, reject requests without origin or referer
  return {
    valid: false,
    error: 'Missing origin and referer headers'
  };
}

/**
 * CSRF validation middleware for API routes
 * Returns a 403 response if validation fails
 */
export function csrfProtection(request: NextRequest): Response | null {
  const validation = validateOrigin(request);

  if (!validation.valid) {
    console.warn('[CSRF] Validation failed:', {
      error: validation.error,
      method: request.method,
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Request blocked by CSRF protection',
        errorCode: 'CSRF_VALIDATION_FAILED'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null; // Validation passed, continue with request
}
