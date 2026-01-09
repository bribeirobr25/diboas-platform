'use client';

/**
 * Dream Mode Translation Hook
 *
 * Code Reusability & DRY: Single source of truth for Dream Mode translations
 * Service Agnostic Abstraction: Uses @diboas/i18n abstraction layer
 * Error Handling: Provides fallback for missing translations
 * Semantic Naming: Clear API for Dream Mode translation access
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import type { IntlShape } from 'react-intl';

/**
 * Dream Mode screen namespaces for type-safe translation access
 */
export type DreamModeNamespace =
  | 'disclaimer'
  | 'welcome'
  | 'paths'
  | 'input'
  | 'timeframe'
  | 'simulation'
  | 'results'
  | 'share'
  | 'gate';

/**
 * Translation function type
 */
export type TranslateFunction = (key: string, values?: Record<string, string | number>) => string;

/**
 * Result of useDreamModeTranslation hook
 */
export interface DreamModeTranslationResult {
  /** The intl instance for advanced formatting */
  intl: IntlShape;
  /** Translate a key within a specific Dream Mode namespace */
  t: (namespace: DreamModeNamespace, key: string, values?: Record<string, string | number>) => string;
  /** Get a translation helper bound to a specific namespace */
  getTranslator: (namespace: DreamModeNamespace) => TranslateFunction;
  /** Direct access to common namespace translations */
  tCommon: (key: string, values?: Record<string, string | number>) => string;
  /** Direct access to root-level dreamMode translations (e.g., dreamMode.watermark) */
  tRoot: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Hook for Dream Mode translations with namespace support
 *
 * Provides a centralized, memoized way to access Dream Mode translations.
 * Replaces the per-screen `t()` helper functions with a single source of truth.
 *
 * @example
 * // In a Dream Mode screen component
 * const { t, getTranslator } = useDreamModeTranslation();
 *
 * // Option 1: Use t() with namespace
 * const headline = t('welcome', 'headline');
 *
 * // Option 2: Get a bound translator for a namespace
 * const tWelcome = getTranslator('welcome');
 * const headline = tWelcome('headline');
 * const subhead = tWelcome('subhead');
 */
export function useDreamModeTranslation(): DreamModeTranslationResult {
  const intl = useTranslation();

  /**
   * Translate a key within a Dream Mode namespace
   * Falls back to the key if translation is missing
   */
  const t = useCallback(
    (namespace: DreamModeNamespace, key: string, values?: Record<string, string | number>): string => {
      const id = `dreamMode.${namespace}.${key}`;
      try {
        return intl.formatMessage({ id }, values);
      } catch {
        // Return the key as fallback to make debugging easier
        if (process.env.NODE_ENV === 'development') {
          // Dev: [DreamMode] Missing translation: ${id}`);
        }
        return key;
      }
    },
    [intl]
  );

  /**
   * Get a translator function bound to a specific namespace
   * Memoized for performance
   */
  const getTranslator = useCallback(
    (namespace: DreamModeNamespace): TranslateFunction => {
      return (key: string, values?: Record<string, string | number>) => t(namespace, key, values);
    },
    [t]
  );

  /**
   * Translate a key from the common namespace
   */
  const tCommon = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const id = `common.${key}`;
      try {
        return intl.formatMessage({ id }, values);
      } catch {
        if (process.env.NODE_ENV === 'development') {
          // Dev: [DreamMode] Missing common translation: ${id}`);
        }
        return key;
      }
    },
    [intl]
  );

  /**
   * Translate a root-level dreamMode key (e.g., dreamMode.watermark)
   */
  const tRoot = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const id = `dreamMode.${key}`;
      try {
        return intl.formatMessage({ id }, values);
      } catch {
        if (process.env.NODE_ENV === 'development') {
          // Dev: [DreamMode] Missing root translation: ${id}`);
        }
        return key;
      }
    },
    [intl]
  );

  // Memoize the result object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      intl,
      t,
      getTranslator,
      tCommon,
      tRoot,
    }),
    [intl, t, getTranslator, tCommon, tRoot]
  );
}
