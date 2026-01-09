/**
 * Section Design Token Utilities
 *
 * Design token generation and validation
 */

import type { DesignTokenConvention, SectionBreakpoints } from './SectionPattern';

/**
 * Generate CSS custom property name using design token convention
 */
export function generateTokenName(
  convention: DesignTokenConvention,
  category: string,
  property: string,
  variant?: string,
  modifier?: string
): string {
  const parts = [`--${convention.prefix}`, category, property];

  if (variant) parts.push(variant);
  if (modifier) parts.push(modifier);

  return parts.join('-');
}

/**
 * Extract design tokens from CSS and validate against convention
 * Note: This validates CSS custom property names, not JSON token objects
 */
export function validateCSSDesignTokens(
  cssContent: string,
  convention: DesignTokenConvention
): { valid: string[]; invalid: string[]; missing: string[] } {
  const tokenPattern = new RegExp(`--${convention.prefix}-[\\w-]+`, 'g');
  const foundTokens = cssContent.match(tokenPattern) || [];

  const valid: string[] = [];
  const invalid: string[] = [];

  foundTokens.forEach(token => {
    const parts = token.substring(2).split('-'); // Remove '--' prefix

    if (parts.length >= 3 && parts[0] === convention.prefix) {
      const category = parts[1];
      if (Object.values(convention.categories).includes(category)) {
        valid.push(token);
      } else {
        invalid.push(token);
      }
    } else {
      invalid.push(token);
    }
  });

  // This would need to be extended to check for missing required tokens
  const missing: string[] = [];

  return { valid, invalid, missing };
}

/**
 * Generate responsive CSS media queries based on breakpoints
 */
export function generateMediaQueries(breakpoints: SectionBreakpoints): {
  mobile: string;
  tablet: string;
  desktop: string;
  largeDesktop: string;
} {
  return {
    mobile: `@media (max-width: ${breakpoints.tablet - 1}px)`,
    tablet: `@media (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
    desktop: `@media (min-width: ${breakpoints.desktop}px) and (max-width: ${breakpoints.largeDesktop - 1}px)`,
    largeDesktop: `@media (min-width: ${breakpoints.largeDesktop}px)`
  };
}
