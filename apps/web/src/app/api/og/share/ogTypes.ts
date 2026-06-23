/**
 * OG Image Generation Types
 *
 * Type definitions and color constants for OG image generation
 */

import { diBoasColors } from '@/lib/colors';

/**
 * Share type for OG images
 */
export type ShareType = 'waitlist' | 'calculator' | 'dream' | 'tool-result';

/**
 * Supported locales for OG image translations — single source of truth from @diboas/i18n
 */
export type { SupportedLocale } from '@diboas/i18n/config';

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
  error: diBoasColors.semantic.error,
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
 * Tool-result template props (Money Tools share card — Phase 3 redesign).
 *
 * Carries no free text and no PII: `toolKey` selects a localized, allowlisted
 * tool name; `value` is the hero figure; `currency` is the locale's ISO code
 * (validated). The honest "both-sides" framing lives in the on-page
 * ResultMoment + the share text, not the image.
 */
export interface ToolResultTemplateProps {
  toolKey: string;
  value: number;
  currency: string;
  years?: number;
  /** Hero color semantics — so a loss/low-confidence result is never shared as a green "win". */
  tone?: 'positive' | 'negative' | 'neutral';
  locale?: string;
}

/**
 * Allowlist of tool keys that may render a share card. Mirrors the Money Tools
 * `ToolKey` union (`@/lib/tools`) — kept local so the edge OG route has no
 * heavy import. Expanded as each tool is wired to ResultMoment.
 */
export const SHAREABLE_TOOL_KEYS = [
  'currency-depreciation',
  'idle-cash',
  'asset-history',
  'card-fees',
] as const;

/**
 * Default template props
 */
export interface DefaultTemplateProps {
  locale?: string;
}
