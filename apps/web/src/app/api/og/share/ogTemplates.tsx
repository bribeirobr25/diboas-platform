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
  type ToolResultTemplateProps,
  type DefaultTemplateProps,
} from './ogTypes';
import { getTranslations, getDefaultName } from './ogTranslations';
import { formatNumber, formatCurrency, formatResultCurrency } from './ogUtils';
import { OGMonogram } from '../_brand/monogram';

/**
 * Shared Logo Component — the official palm-"B" monogram (2026-07-13, F-BRAND / G-3;
 * replaces the banned "dB" gradient-circle-with-initials on every share card).
 */
function LogoBadge() {
  return (
    <div style={{ display: 'flex', marginBottom: '32px' }}>
      <OGMonogram size={80} />
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
          color: OG_COLORS.inkMuted,
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
        background: OG_COLORS.warmBackground,
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
export function WaitlistTemplate({ position, name, locale = 'en' }: WaitlistTemplateProps) {
  const t = getTranslations(locale);
  const displayName = name || getDefaultName(locale);

  return (
    <OGBackground>
      <LogoBadge />

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
            color: OG_COLORS.inkSoft,
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
              color: OG_COLORS.inkSoft,
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
              color: OG_COLORS.tealDark,
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
            color: OG_COLORS.ink,
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
      <LogoBadge />

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
            color: OG_COLORS.coralDark,
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
          color: OG_COLORS.inkSoft,
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
                color: OG_COLORS.inkMuted,
                textTransform: 'uppercase',
              }}
            >
              {t.calculator.startingWith}
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: OG_COLORS.ink,
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
              background: OG_COLORS.inkMuted,
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
              color: OG_COLORS.inkMuted,
              textTransform: 'uppercase',
            }}
          >
            {t.calculator.strategy}
          </span>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: OG_COLORS.ink,
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
          color: OG_COLORS.inkSoft,
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
 * Money Tools result share card (Phase 3 redesign).
 *
 * The "living proof" artifact: a holder's real, market-data-bound figure in
 * their own currency, branded with the editorial copper accent. No PII, no free
 * text — the tool name is an allowlisted localized label and the value is a
 * validated number. The honest both-sides framing lives on-page + in the share
 * text; the card is the eye-catch.
 */
export function ToolResultTemplate({
  toolKey,
  value,
  currency,
  years,
  tone = 'positive',
  locale = 'en',
}: ToolResultTemplateProps) {
  const t = getTranslations(locale);
  const toolName = t.toolResult.toolName[toolKey];
  const headlineText = t.toolResult.headlineByTool[toolKey] ?? t.toolResult.headline;
  // Honesty on the viral surface: a loss is rendered in error red, a
  // low-confidence/neutral result in white — never the celebratory green.
  const heroColor =
    tone === 'negative' ? OG_COLORS.error : tone === 'neutral' ? OG_COLORS.ink : OG_COLORS.success;

  return (
    <OGBackground>
      <LogoBadge />

      {/* Tool badge (allowlisted, localized) — omitted if the key is unknown */}
      {toolName ? (
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
            {toolName}
          </span>
        </div>
      ) : null}

      {/* Caption (per-tool headline keeps each tool honest) */}
      <p
        style={{
          fontSize: '24px',
          color: OG_COLORS.inkSoft,
          margin: 0,
          marginBottom: '16px',
        }}
      >
        {headlineText}
      </p>

      {/* Hero figure */}
      <h1
        style={{
          fontSize: '88px',
          fontWeight: 'bold',
          color: heroColor,
          margin: 0,
          lineHeight: 1,
          textShadow: `0 0 40px ${heroColor}44`,
        }}
      >
        {formatResultCurrency(value, currency, locale)}
      </h1>

      {/* Subline (only when a horizon is supplied) */}
      {years ? (
        <p
          style={{
            fontSize: '22px',
            color: OG_COLORS.ink,
            marginTop: '28px',
          }}
        >
          {t.toolResult.subline(years)}
        </p>
      ) : null}

      {/* CTA */}
      <p
        style={{
          fontSize: '20px',
          color: OG_COLORS.inkSoft,
          marginTop: years ? '24px' : '40px',
        }}
      >
        {t.toolResult.cta}
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
        background: OG_COLORS.warmBackground,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', marginBottom: '40px' }}>
        <OGMonogram size={120} />
      </div>
      <h1
        style={{
          fontSize: '80px',
          fontWeight: 'bold',
          color: OG_COLORS.ink,
          margin: 0,
        }}
      >
        diBoaS
      </h1>
      <p
        style={{
          fontSize: '28px',
          color: OG_COLORS.inkSoft,
          marginTop: '24px',
        }}
      >
        {t.default.tagline}
      </p>
    </div>
  );
}
