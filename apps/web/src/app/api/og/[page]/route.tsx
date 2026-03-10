/**
 * Dynamic OG Image Generation API
 *
 * Generates Open Graph images for social sharing
 * Uses Next.js ImageResponse for server-side image generation
 *
 * Usage: /api/og/[page]
 * - /api/og/default - Default diBoaS branding
 * - /api/og/b2c - B2C landing page
 * - /api/og/b2b - B2B landing page
 * - /api/og/strategies - Strategies page
 * - /api/og/future-you - Future You calculator
 */

import { ImageResponse } from 'next/og';
import { getOGTemplate, isValidPageType } from '@/lib/og';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/security/rateLimiter';
import { RATE_LIMIT_CONFIG } from '@/config/env';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, RATE_LIMIT_CONFIG.lenient.limit, RATE_LIMIT_CONFIG.lenient.windowMs);
    if (!rateLimitResult.success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    const { page } = await params;

    // Validate page type
    const pageType = isValidPageType(page) ? page : 'default';

    // Generate the OG image template
    const template = getOGTemplate(pageType);

    return new ImageResponse(template, {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
