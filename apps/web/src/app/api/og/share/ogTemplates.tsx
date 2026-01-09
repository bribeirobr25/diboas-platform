/**
 * OG Image Templates
 *
 * React components for OG image generation
 * Supports i18n via locale parameter
 */

import {
  OG_COLORS,
  type WaitlistTemplateProps,
  type CalculatorTemplateProps,
  type DefaultTemplateProps
} from './ogTypes';
import { getTranslations, getDefaultName } from './ogTranslations';
import { formatNumber, formatCurrency } from './ogUtils';

/**
 * Shared Logo Component
 */
function LogoBadge({
  gradient,
  shadowColor
}: {
  gradient: string;
  shadowColor: string;
}) {
  return (
    <div
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        boxShadow: `0 20px 40px ${shadowColor}`,
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
  );
}

/**
 * Shared Bottom Branding Component
 */
function BottomBranding() {
  return (
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
  );
}

/**
 * Shared Background Wrapper Component
 */
function OGBackground({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  );
}

/**
 * Waitlist Position OG Image Template
 * Supports i18n via locale parameter
 */
export function WaitlistTemplate({
  position,
  name,
  locale = 'en',
}: WaitlistTemplateProps) {
  const t = getTranslations(locale);
  const displayName = name || getDefaultName(locale);

  return (
    <OGBackground>
      <LogoBadge
        gradient={`linear-gradient(135deg, ${OG_COLORS.teal}, ${OG_COLORS.tealDark})`}
        shadowColor={`${OG_COLORS.teal}33`}
      />

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

      <BottomBranding />
    </OGBackground>
  );
}

/**
 * Dream Mode Calculator OG Image Template
 * Supports i18n via locale parameter
 */
export function CalculatorTemplate({
  futureAmount,
  years,
  strategy,
  initialInvestment,
  locale = 'en',
}: CalculatorTemplateProps) {
  const t = getTranslations(locale);
  const displayStrategy = strategy
    ? strategy.charAt(0).toUpperCase() + strategy.slice(1)
    : 'Balanced';

  return (
    <OGBackground>
      <LogoBadge
        gradient={`linear-gradient(135deg, ${OG_COLORS.coral}, ${OG_COLORS.coralDark})`}
        shadowColor={`${OG_COLORS.coral}33`}
      />

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

      <BottomBranding />
    </OGBackground>
  );
}

/**
 * Default fallback template
 * Supports i18n via locale parameter
 */
export function DefaultTemplate({ locale = 'en' }: DefaultTemplateProps) {
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
