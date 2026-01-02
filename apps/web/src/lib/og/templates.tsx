/**
 * OG Image Templates
 * Design System: Consistent brand imagery for social sharing
 */

import { diBoasColors } from '@/lib/colors';

export type OGPageType = 'default' | 'b2c' | 'b2b' | 'strategies' | 'future-you';

interface OGTemplateConfig {
  title: string;
  subtitle?: string;
  badge?: string;
  theme: 'teal' | 'coral' | 'dark';
}

const PAGE_CONFIGS: Record<OGPageType, OGTemplateConfig> = {
  default: {
    title: 'diBoaS',
    subtitle: 'Financial Freedom Made Simple',
    theme: 'teal',
  },
  b2c: {
    title: 'diBoaS',
    subtitle: 'Your Money. Your Future. One Platform.',
    badge: 'Personal Finance',
    theme: 'teal',
  },
  b2b: {
    title: 'diBoaS for Business',
    subtitle: 'Corporate Treasury & Yield Solutions',
    badge: 'Business',
    theme: 'coral',
  },
  strategies: {
    title: 'Investment Strategies',
    subtitle: '10 Strategies. Different Goals. Different Risk Levels.',
    badge: 'Strategies',
    theme: 'teal',
  },
  'future-you': {
    title: 'Future You Calculator',
    subtitle: 'See What Your Money Could Become',
    badge: 'Calculator',
    theme: 'dark',
  },
};

// OG Image specific colors - using design tokens
// Note: OG images render server-side and can't use CSS variables
const OG_COLORS = {
  white: '#ffffff',
  subtitleGrey: diBoasColors.neutral[400],    // #94a3b8
  brandingGrey: diBoasColors.neutral[500],    // #64748b
  darkBg: diBoasColors.neutral[900],          // #0f172a
  darkBgSecondary: diBoasColors.neutral[800], // #1e293b
} as const;

const THEME_COLORS = {
  teal: {
    primary: diBoasColors.primary[500],
    secondary: diBoasColors.primary[600],
    background: `linear-gradient(135deg, ${OG_COLORS.darkBg} 0%, ${OG_COLORS.darkBgSecondary} 50%, ${OG_COLORS.darkBg} 100%)`,
    text: OG_COLORS.white,
    badge: diBoasColors.primary[500],
  },
  coral: {
    primary: diBoasColors.secondary.coral[500],
    secondary: diBoasColors.secondary.coral[600],
    background: `linear-gradient(135deg, ${OG_COLORS.darkBg} 0%, ${OG_COLORS.darkBgSecondary} 50%, ${OG_COLORS.darkBg} 100%)`,
    text: OG_COLORS.white,
    badge: diBoasColors.secondary.coral[500],
  },
  dark: {
    primary: OG_COLORS.white,
    secondary: OG_COLORS.subtitleGrey,
    background: `linear-gradient(135deg, ${OG_COLORS.darkBg} 0%, ${OG_COLORS.darkBgSecondary} 100%)`,
    text: OG_COLORS.white,
    badge: diBoasColors.primary[500],
  },
};

/**
 * Generate OG image JSX template for a page
 */
export function getOGTemplate(pageType: OGPageType): React.ReactElement {
  const config = PAGE_CONFIGS[pageType] || PAGE_CONFIGS.default;
  const theme = THEME_COLORS[config.theme];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.background,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '60px',
      }}
    >
      {/* Logo Circle */}
      <div
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px',
          boxShadow: `0 20px 40px ${theme.primary}33`,
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

      {/* Badge */}
      {config.badge && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${theme.badge}22`,
            border: `1px solid ${theme.badge}44`,
            borderRadius: '999px',
            padding: '8px 24px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              color: theme.badge,
              fontSize: '18px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {config.badge}
          </span>
        </div>
      )}

      {/* Title */}
      <h1
        style={{
          fontSize: pageType === 'default' ? '80px' : '56px',
          fontWeight: 'bold',
          color: theme.text,
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {config.title}
      </h1>

      {/* Subtitle */}
      {config.subtitle && (
        <p
          style={{
            fontSize: '28px',
            color: OG_COLORS.subtitleGrey,
            marginTop: '24px',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          {config.subtitle}
        </p>
      )}

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
 * Check if a page type is valid
 */
export function isValidPageType(page: string): page is OGPageType {
  return ['default', 'b2c', 'b2b', 'strategies', 'future-you'].includes(page);
}
