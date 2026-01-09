/**
 * OG Image Generation Types
 *
 * Type definitions and color constants for OG image generation
 */

import { diBoasColors } from '@/lib/colors';

/**
 * Share type for OG images
 */
export type ShareType = 'waitlist' | 'calculator';

/**
 * Supported locales for OG image translations
 */
export type SupportedLocale = 'en' | 'pt-BR' | 'es' | 'de';

/**
 * OG Image specific colors - using design system tokens
 */
export const OG_COLORS = {
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

/**
 * OG Image dimensions
 */
export const OG_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

/**
 * Waitlist template props
 */
export interface WaitlistTemplateProps {
  position: number;
  name?: string;
  locale?: string;
}

/**
 * Calculator template props
 */
export interface CalculatorTemplateProps {
  futureAmount: number;
  years: number;
  strategy?: string;
  initialInvestment?: number;
  locale?: string;
}

/**
 * Default template props
 */
export interface DefaultTemplateProps {
  locale?: string;
}
