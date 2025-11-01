/**
 * CTA Button Configuration
 *
 * Configuration Management: Centralized CTA button styling for entire platform
 * DRY Principles: Single source of truth for all Call-to-Action buttons
 * No Hardcoded Values: All CTA styling defined as constants
 * Type Safety: Type-safe CTA definitions with readonly constraints
 *
 * Following Design Token System principles from config/design-tokens.json
 */

import type { ButtonProps } from '@diboas/ui';
import designTokens from '../../../../config/design-tokens.json';

/**
 * CTA Button Configuration Interface
 */
export interface CTAButtonConfig {
  readonly variant: ButtonProps['variant'];
  readonly size: ButtonProps['size'];
  readonly trackable: boolean;
}

/**
 * CTA Link Configuration Interface
 */
export interface CTALinkConfig {
  readonly target: '_blank' | '_self';
  readonly rel: string;
}

/**
 * CTA Style Types
 */
export type CTAStyle = 'primary' | 'secondary' | 'subtle';

/**
 * Default CTA Button Configurations
 *
 * Loaded from design-tokens.json for consistency
 */
export const CTA_BUTTON_CONFIG: Record<CTAStyle, CTAButtonConfig> = {
  primary: {
    variant: designTokens.components.cta.button.primary.variant as ButtonProps['variant'],
    size: designTokens.components.cta.button.primary.size as ButtonProps['size'],
    trackable: true,
  },
  secondary: {
    variant: designTokens.components.cta.button.secondary.variant as ButtonProps['variant'],
    size: designTokens.components.cta.button.secondary.size as ButtonProps['size'],
    trackable: true,
  },
  subtle: {
    variant: designTokens.components.cta.button.subtle.variant as ButtonProps['variant'],
    size: designTokens.components.cta.button.subtle.size as ButtonProps['size'],
    trackable: true,
  }
} as const;

/**
 * Default CTA Link Configuration
 *
 * For external links in CTA buttons
 */
export const CTA_LINK_CONFIG: CTALinkConfig = {
  target: designTokens.components.cta.link.target as '_blank' | '_self',
  rel: designTokens.components.cta.link.rel,
} as const;

/**
 * Helper function to get CTA button props
 *
 * @param style - The CTA style to use (default: 'primary')
 * @returns Button props for the specified CTA style
 *
 * @example
 * ```tsx
 * <Button {...getCTAButtonProps('primary')}>Get Started</Button>
 * ```
 */
export function getCTAButtonProps(style: CTAStyle = 'primary'): CTAButtonConfig {
  return CTA_BUTTON_CONFIG[style];
}

/**
 * Helper function to get CTA link props
 *
 * @returns Link configuration for CTA buttons
 *
 * @example
 * ```tsx
 * <a href="..." {...getCTALinkProps()}>
 *   <Button>Get Started</Button>
 * </a>
 * ```
 */
export function getCTALinkProps(): CTALinkConfig {
  return CTA_LINK_CONFIG;
}

/**
 * Default CTA button props (primary style)
 *
 * Use this for the most common CTA button case
 *
 * @example
 * ```tsx
 * <Button {...DEFAULT_CTA_PROPS}>Get Started</Button>
 * ```
 */
export const DEFAULT_CTA_PROPS = CTA_BUTTON_CONFIG.primary;
