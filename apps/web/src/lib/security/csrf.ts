/**
 * CSRF Protection Utility
 *
 * Implements origin/referer validation for CSRF protection
 * in Next.js App Router API routes.
 */

import { NextRequest } from 'next/server';
import { getCsrfAllowedOrigins } from '@/config/env';

// Allowed origins for CSRF validation (loaded from environment)
const ALLOWED_ORIGINS = getCsrfAllowedOrigins();

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
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      try {
        // Use URL origin comparison to prevent subdomain spoofing
        // e.g., https://diboas.com.attacker.com should NOT match https://diboas.com
        const originUrl = new URL(origin);
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        // Fallback to exact match for malformed URLs
        return origin === allowed;
      }
    });

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
      const refererOrigin = refererUrl.origin;

      const isAllowed = ALLOWED_ORIGINS.some(allowed => {
        try {
          // Use URL origin comparison to prevent subdomain spoofing
          const allowedUrl = new URL(allowed);
          return refererOrigin === allowedUrl.origin;
        } catch {
          return refererOrigin === allowed;
        }
      });

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
