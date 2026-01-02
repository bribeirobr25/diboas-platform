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

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page } = await params;

  // Validate page type
  const pageType = isValidPageType(page) ? page : 'default';

  // Generate the OG image template
  const template = getOGTemplate(pageType);

  return new ImageResponse(template, {
    width: 1200,
    height: 630,
  });
}
