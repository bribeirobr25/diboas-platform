/**
 * Dynamic Personalized OG Image Generation API
 *
 * Generates personalized Open Graph images for social sharing
 * Supports waitlist positions and Dream Mode calculator results
 *
 * Usage: /api/og/share?type=[type]&[params]
 *
 * Waitlist: /api/og/share?type=waitlist&position=247&name=John
 * Calculator: /api/og/share?type=calculator&amount=125000&years=10&strategy=balanced
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

// Import from extracted modules
import { OG_DIMENSIONS, SHAREABLE_TOOL_KEYS, type ShareType } from './ogTypes';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/security/rateLimiter';
import { RATE_LIMIT_CONFIG } from '@/config/env';
import {
  sanitizeInput,
  isValidPosition,
  isValidCalculatorInput,
  isValidToolResultValue,
  parseIntSafe,
} from './ogUtils';
import {
  WaitlistTemplate,
  CalculatorTemplate,
  ToolResultTemplate,
  DefaultTemplate,
} from './ogTemplates';

export const runtime = 'edge';

/**
 * GET handler for dynamic OG image generation
 *
 * Following API requirements from api.md:
 * - Input validation on all parameters
 * - Security headers
 * - Cache headers for performance
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(
      clientIP,
      RATE_LIMIT_CONFIG.lenient.limit,
      RATE_LIMIT_CONFIG.lenient.windowMs
    );
    if (!rateLimitResult.success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult),
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ShareType | null;
    const locale = searchParams.get('locale') || 'en';

    let template: React.ReactElement;

    switch (type) {
      case 'waitlist': {
        const position = parseIntSafe(searchParams.get('position'), 0);
        const name = sanitizeInput(searchParams.get('name'));

        if (!isValidPosition(position)) {
          template = <DefaultTemplate locale={locale} />;
        } else {
          template = <WaitlistTemplate position={position} name={name} locale={locale} />;
        }
        break;
      }

      case 'calculator': {
        const futureAmount = parseIntSafe(searchParams.get('amount'), 0);
        const years = parseIntSafe(searchParams.get('years'), 10);
        const strategy = sanitizeInput(searchParams.get('strategy'));
        const initialInvestment = searchParams.get('initial')
          ? parseIntSafe(searchParams.get('initial'), 0)
          : undefined;

        if (!isValidCalculatorInput(futureAmount, years)) {
          template = <DefaultTemplate locale={locale} />;
        } else {
          template = (
            <CalculatorTemplate
              futureAmount={futureAmount}
              years={years}
              strategy={strategy}
              initialInvestment={initialInvestment}
              locale={locale}
            />
          );
        }
        break;
      }

      case 'tool-result': {
        const toolKey = searchParams.get('tool') ?? '';
        const value = parseIntSafe(searchParams.get('value'), 0);
        const currency = (searchParams.get('currency') ?? 'USD').toUpperCase();
        // Range-guard years (1..100) so a hostile/garbage param can't render
        // "over -5 years" on a shareable card; drop it otherwise.
        const yearsRaw = searchParams.get('years') ? parseIntSafe(searchParams.get('years'), 0) : 0;
        const years = yearsRaw > 0 && yearsRaw <= 100 ? yearsRaw : undefined;
        const toneParam = searchParams.get('tone');
        const tone = toneParam === 'negative' || toneParam === 'neutral' ? toneParam : 'positive';

        // Allowlist the tool key + range-validate the figure; anything off the
        // happy path falls back to the safe default card (SSRF / abuse guard).
        const isShareable = (SHAREABLE_TOOL_KEYS as readonly string[]).includes(toolKey);
        if (!isShareable || !isValidToolResultValue(value)) {
          template = <DefaultTemplate locale={locale} />;
        } else {
          template = (
            <ToolResultTemplate
              toolKey={toolKey}
              value={value}
              currency={currency}
              years={years}
              tone={tone}
              locale={locale}
            />
          );
        }
        break;
      }

      default:
        template = <DefaultTemplate locale={locale} />;
    }

    return new ImageResponse(template, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      headers: {
        // Cache for 1 hour, stale-while-revalidate for 1 day
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
