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
import { diBoasColors } from '@/lib/colors';

export const runtime = 'edge';

// OG Image specific colors - using design system tokens
const OG_COLORS = {
  white: '#ffffff',
  subtitleGrey: diBoasColors.neutral[400],
  brandingGrey: diBoasColors.neutral[500],
  darkBg: diBoasColors.neutral[900],
  darkBgSecondary: diBoasColors.neutral[800],
  teal: diBoasColors.primary[500],
  tealDark: diBoasColors.primary[600],
  coral: diBoasColors.secondary.coral[500],
  coralDark: diBoasColors.secondary.coral[600],
  success: diBoasColors.semantic.success,
} as const;

type ShareType = 'waitlist' | 'calculator';
type SupportedLocale = 'en' | 'pt-BR' | 'es' | 'de';

/**
 * Locale-specific translations for OG images
 * Following i18n requirements from internationalization.md
 */
const OG_TRANSLATIONS: Record<SupportedLocale, {
  waitlist: {
    joinedMessage: (name: string) => string;
    position: string;
    cta: string;
  };
  calculator: {
    badge: string;
    growthMessage: (years: number) => string;
    startingWith: string;
    strategy: string;
    cta: string;
  };
  default: {
    tagline: string;
  };
}> = {
  en: {
    waitlist: {
      joinedMessage: (name) => `${name} just joined the waitlist!`,
      position: 'Position',
      cta: 'Join me on diBoaS - Financial Freedom Made Simple',
    },
    calculator: {
      badge: 'Dream Mode Calculator',
      growthMessage: (years) => `In ${years} years, my investment could grow to`,
      startingWith: 'Starting with',
      strategy: 'Strategy',
      cta: 'Calculate your future at diboas.com',
    },
    default: {
      tagline: 'Financial Freedom Made Simple',
    },
  },
  'pt-BR': {
    waitlist: {
      joinedMessage: (name) => `${name} entrou na lista de espera!`,
      position: 'Posição',
      cta: 'Junte-se a mim no diBoaS - Liberdade Financeira Simplificada',
    },
    calculator: {
      badge: 'Calculadora Dream Mode',
      growthMessage: (years) => `Em ${years} anos, meu investimento poderia crescer para`,
      startingWith: 'Começando com',
      strategy: 'Estratégia',
      cta: 'Calcule seu futuro em diboas.com',
    },
    default: {
      tagline: 'Liberdade Financeira Simplificada',
    },
  },
  es: {
    waitlist: {
      joinedMessage: (name) => `${name} se unió a la lista de espera!`,
      position: 'Posición',
      cta: 'Únete a mí en diBoaS - Libertad Financiera Simplificada',
    },
    calculator: {
      badge: 'Calculadora Dream Mode',
      growthMessage: (years) => `En ${years} años, mi inversión podría crecer a`,
      startingWith: 'Empezando con',
      strategy: 'Estrategia',
      cta: 'Calcula tu futuro en diboas.com',
    },
    default: {
      tagline: 'Libertad Financiera Simplificada',
    },
  },
  de: {
    waitlist: {
      joinedMessage: (name) => `${name} ist der Warteliste beigetreten!`,
      position: 'Position',
      cta: 'Komm zu mir auf diBoaS - Finanzielle Freiheit Einfach Gemacht',
    },
    calculator: {
      badge: 'Dream Mode Rechner',
      growthMessage: (years) => `In ${years} Jahren könnte meine Investition wachsen auf`,
      startingWith: 'Startbetrag',
      strategy: 'Strategie',
      cta: 'Berechne deine Zukunft auf diboas.com',
    },
    default: {
      tagline: 'Finanzielle Freiheit Einfach Gemacht',
    },
  },
};

/**
 * Get translations for a locale with fallback to English
 */
function getTranslations(locale: string) {
  const supportedLocale = (
    ['en', 'pt-BR', 'es', 'de'].includes(locale) ? locale : 'en'
  ) as SupportedLocale;
  return OG_TRANSLATIONS[supportedLocale];
}

/**
 * Sanitize user input for XSS prevention
 * Following security requirements from security.md
 */
function sanitizeInput(input: string | null): string | undefined {
  if (!input) return undefined;
  // Remove HTML tags, script content, and limit length
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'&]/g, '')
    .slice(0, 50);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(num: number): string {
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${formatNumber(num)}`;
}

/**
 * Waitlist Position OG Image Template
 * Supports i18n via locale parameter
 */
function WaitlistTemplate({
  position,
  name,
  locale = 'en',
}: {
  position: number;
  name?: string;
  locale?: string;
}) {
  const t = getTranslations(locale);
  const displayName = name || (locale === 'pt-BR' ? 'Alguém' : locale === 'es' ? 'Alguien' : locale === 'de' ? 'Jemand' : 'Someone');

  return (
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
      {/* Logo */}
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

      {/* Main Message */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <p
          style={{
            fontSize: '28px',
            color: OG_COLORS.subtitleGrey,
            margin: 0,
          }}
        >
          {t.waitlist.joinedMessage(displayName)}
        </p>

        {/* Position Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: `${OG_COLORS.teal}15`,
            border: `2px solid ${OG_COLORS.teal}44`,
            borderRadius: '24px',
            padding: '24px 48px',
          }}
        >
          <span
            style={{
              fontSize: '24px',
              color: OG_COLORS.subtitleGrey,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {t.waitlist.position}
          </span>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: OG_COLORS.teal,
              lineHeight: 1,
            }}
          >
            #{formatNumber(position)}
          </span>
        </div>

        {/* CTA */}
        <p
          style={{
            fontSize: '24px',
            color: OG_COLORS.white,
            marginTop: '24px',
          }}
        >
          {t.waitlist.cta}
        </p>
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
          diboas.com
        </span>
      </div>
    </div>
  );
}

/**
 * Dream Mode Calculator OG Image Template
 * Supports i18n via locale parameter
 */
function CalculatorTemplate({
  futureAmount,
  years,
  strategy,
  initialInvestment,
  locale = 'en',
}: {
  futureAmount: number;
  years: number;
  strategy?: string;
  initialInvestment?: number;
  locale?: string;
}) {
  const t = getTranslations(locale);
  const displayStrategy = strategy
    ? strategy.charAt(0).toUpperCase() + strategy.slice(1)
    : 'Balanced';

  return (
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
      {/* Logo */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${OG_COLORS.coral}, ${OG_COLORS.coralDark})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: `0 20px 40px ${OG_COLORS.coral}33`,
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
          background: `${OG_COLORS.coral}22`,
          border: `1px solid ${OG_COLORS.coral}44`,
          borderRadius: '999px',
          padding: '8px 24px',
          marginBottom: '24px',
        }}
      >
        <span
          style={{
            color: OG_COLORS.coral,
            fontSize: '16px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {t.calculator.badge}
        </span>
      </div>

      {/* Title */}
      <p
        style={{
          fontSize: '24px',
          color: OG_COLORS.subtitleGrey,
          margin: 0,
          marginBottom: '16px',
        }}
      >
        {t.calculator.growthMessage(years)}
      </p>

      {/* Big Amount */}
      <h1
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: OG_COLORS.success,
          margin: 0,
          lineHeight: 1,
          textShadow: `0 0 40px ${OG_COLORS.success}44`,
        }}
      >
        {formatCurrency(futureAmount)}
      </h1>

      {/* Strategy Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          marginTop: '32px',
        }}
      >
        {initialInvestment && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: OG_COLORS.brandingGrey,
                textTransform: 'uppercase',
              }}
            >
              {t.calculator.startingWith}
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: OG_COLORS.white,
              }}
            >
              {formatCurrency(initialInvestment)}
            </span>
          </div>
        )}
        {initialInvestment && (
          <div
            style={{
              width: '1px',
              height: '40px',
              background: OG_COLORS.brandingGrey,
            }}
          />
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: OG_COLORS.brandingGrey,
              textTransform: 'uppercase',
            }}
          >
            {t.calculator.strategy}
          </span>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: OG_COLORS.white,
            }}
          >
            {displayStrategy}
          </span>
        </div>
      </div>

      {/* CTA */}
      <p
        style={{
          fontSize: '20px',
          color: OG_COLORS.subtitleGrey,
          marginTop: '40px',
        }}
      >
        {t.calculator.cta}
      </p>

      {/* Bottom branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '20px',
            color: OG_COLORS.brandingGrey,
          }}
        >
          diboas.com
        </span>
      </div>
    </div>
  );
}

/**
 * Default fallback template
 * Supports i18n via locale parameter
 */
function DefaultTemplate({ locale = 'en' }: { locale?: string }) {
  const t = getTranslations(locale);

  return (
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
      }}
    >
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${OG_COLORS.teal}, ${OG_COLORS.tealDark})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          boxShadow: `0 20px 40px ${OG_COLORS.teal}33`,
        }}
      >
        <span
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: OG_COLORS.white,
          }}
        >
          dB
        </span>
      </div>
      <h1
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: OG_COLORS.white,
          margin: 0,
        }}
      >
        diBoaS
      </h1>
      <p
        style={{
          fontSize: '28px',
          color: OG_COLORS.subtitleGrey,
          marginTop: '24px',
        }}
      >
        {t.default.tagline}
      </p>
    </div>
  );
}

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
      const position = parseInt(searchParams.get('position') || '0', 10);
      // Sanitize name input to prevent XSS
      const name = sanitizeInput(searchParams.get('name'));

      // Validate position (following security input validation requirements)
      if (position <= 0 || position > 1000000 || !Number.isFinite(position)) {
        template = <DefaultTemplate locale={locale} />;
      } else {
        template = (
          <WaitlistTemplate position={position} name={name} locale={locale} />
        );
      }
      break;
    }

    case 'calculator': {
      const futureAmount = parseInt(searchParams.get('amount') || '0', 10);
      const years = parseInt(searchParams.get('years') || '10', 10);
      // Sanitize strategy input
      const strategy = sanitizeInput(searchParams.get('strategy'));
      const initialInvestment = searchParams.get('initial')
        ? parseInt(searchParams.get('initial')!, 10)
        : undefined;

      // Validate inputs (following security requirements)
      if (
        futureAmount <= 0 ||
        !Number.isFinite(futureAmount) ||
        years <= 0 ||
        years > 100
      ) {
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
    width: 1200,
    height: 630,
    headers: {
      // Cache for 1 hour, stale-while-revalidate for 1 day
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
