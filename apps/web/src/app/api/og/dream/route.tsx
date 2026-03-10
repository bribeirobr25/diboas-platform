/**
 * Dream Mode OG Image Generation API
 *
 * Generates personalized Open Graph images for Dream Mode share URLs.
 * Displays the user's projected investment growth for rich social previews.
 *
 * Usage: /api/og/dream?amount=$125,000&growth=247%&locale=en
 */

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

import { OG_DIMENSIONS, OG_COLORS } from '../share/ogTypes';
import { sanitizeInput } from '../share/ogUtils';
import { checkRateLimit, getClientIP, createRateLimitHeaders } from '@/lib/security/rateLimiter';
import { RATE_LIMIT_CONFIG } from '@/config/env';

export const runtime = 'edge';

/**
 * Dream-specific OG translations
 */
const DREAM_TRANSLATIONS: Record<string, { badge: string; growth: string; cta: string }> = {
  en: {
    badge: 'While I Slept...',
    growth: 'projected growth',
    cta: 'Financial Freedom Made Simple',
  },
  'pt-BR': {
    badge: 'Enquanto Eu Dormia...',
    growth: 'crescimento projetado',
    cta: 'Liberdade Financeira Simplificada',
  },
  es: {
    badge: 'Mientras Dormia...',
    growth: 'crecimiento proyectado',
    cta: 'Libertad Financiera Simplificada',
  },
  de: {
    badge: 'Wahrend Ich Schlief...',
    growth: 'prognostiziertes Wachstum',
    cta: 'Finanzielle Freiheit Einfach Gemacht',
  },
};

function getDreamTranslations(locale: string) {
  return DREAM_TRANSLATIONS[locale] || DREAM_TRANSLATIONS.en;
}

/**
 * GET handler for Dream Mode OG image generation
 *
 * Query parameters:
 * - amount: Formatted currency string (e.g., "$125,000")
 * - growth: Growth percentage string (e.g., "247%")
 * - locale: Locale for translations (default: "en")
 */
export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;

  const amount = sanitizeInput(searchParams.get('amount')) || '$10,000';
  const growth = sanitizeInput(searchParams.get('growth')) || '200%';
  const locale = searchParams.get('locale') || 'en';

  const dt = getDreamTranslations(locale);

  const template = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${OG_COLORS.darkBg} 0%, ${OG_COLORS.darkBgSecondary} 50%, ${OG_COLORS.darkBg} 100%)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '60px',
      }}
    >
      {/* Logo badge */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${OG_COLORS.teal}, ${OG_COLORS.tealDark})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: `0 20px 40px ${OG_COLORS.teal}33`,
        }}
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: OG_COLORS.white,
          }}
        >
          dB
        </span>
      </div>

      {/* Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: `${OG_COLORS.teal}15`,
          border: `1px solid ${OG_COLORS.teal}44`,
          borderRadius: '999px',
          padding: '8px 24px',
          marginBottom: '24px',
        }}
      >
        <span
          style={{
            color: OG_COLORS.teal,
            fontSize: '18px',
            fontWeight: '600',
            letterSpacing: '0.05em',
          }}
        >
          {dt.badge}
        </span>
      </div>

      {/* Main amount */}
      <div
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: OG_COLORS.success,
          lineHeight: 1,
          marginBottom: '16px',
          textShadow: `0 0 40px ${OG_COLORS.success}44`,
          display: 'flex',
        }}
      >
        {amount}
      </div>

      {/* Growth percentage */}
      <div
        style={{
          fontSize: '24px',
          color: OG_COLORS.teal,
          marginBottom: '40px',
          display: 'flex',
        }}
      >
        +{growth} {dt.growth}
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontSize: '20px',
            color: OG_COLORS.brandingGrey,
          }}
        >
          diboas.com — {dt.cta}
        </span>
      </div>
    </div>
  );

  return new ImageResponse(template, {
    width: OG_DIMENSIONS.width,
    height: OG_DIMENSIONS.height,
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
  } catch {
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
