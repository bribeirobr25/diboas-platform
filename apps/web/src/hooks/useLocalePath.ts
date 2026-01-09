/**
 * useLocalePath Hook
 *
 * Domain-Driven Design: Localization-aware path generation hook
 * Code Reusability: Reusable hook for programmatic path generation
 * No Hardcoded Values: Uses current locale from context
 * Type Safety: Full TypeScript support
 * Service Agnostic Abstraction: Decoupled from specific i18n implementation
 */

'use client';

import { useLocale } from '@/components/Providers';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@diboas/i18n/server';

/**
 * useLocalePath Hook
 *
 * Provides utilities for generating locale-aware paths programmatically.
 * Useful when you need paths for router.push(), dynamic redirects, etc.
 *
 * @example
 * ```tsx
 * const { getLocalePath, locale } = useLocalePath();
 *
 * // Get localized path
 * const benefitsPath = getLocalePath('/benefits');
 * // Returns: '/en/benefits' (if current locale is 'en')
 *
 * // Use with router
 * router.push(getLocalePath('/account'));
 *
 * // Use with ROUTES config
 * router.push(getLocalePath(ROUTES.HELP.FAQ));
 * ```
 */
export function useLocalePath() {
  const { locale } = useLocale();

  /**
   * Generate locale-aware path
   *
   * @param path - The path to localize (e.g., '/benefits', '/help/faq')
   * @returns Localized path with locale prefix (e.g., '/en/benefits')
   *
   * Rules:
   * 1. Skip external URLs (http://, https://)
   * 2. Skip if path already has locale prefix
   * 3. Add current locale prefix
   */
  const getLocalePath = (path: string): string => {
    // Rule 1: Skip external URLs
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Rule 2: Skip if already has locale prefix
    const segments = path.split('/').filter(Boolean);
    if (SUPPORTED_LOCALES.includes(segments[0] as SupportedLocale)) {
      return path;
    }

    // Rule 3: Add locale prefix
    return `/${locale}${path.startsWith('/') ? path : `/${  path}`}`;
  };

  return {
    /**
     * Get locale-aware path
     */
    getLocalePath,

    /**
     * Current locale
     */
    locale,
  };
}
