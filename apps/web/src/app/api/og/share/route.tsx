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
import { OG_DIMENSIONS, type ShareType } from './ogTypes';
import {
  sanitizeInput,
  isValidPosition,
  isValidCalculatorInput,
  parseIntSafe
} from './ogUtils';
import {
  WaitlistTemplate,
  CalculatorTemplate,
  DefaultTemplate
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
        template = (
          <WaitlistTemplate position={position} name={name} locale={locale} />
        );
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
}
