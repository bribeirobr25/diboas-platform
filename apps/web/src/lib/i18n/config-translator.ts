/**
 * Configuration Translation Integration Layer
 *
 * Domain-Driven Design: Translation integration for config-driven components
 * Code Reusability: Single translation resolution system for all configs
 * Service Agnostic Abstraction: Decouples configuration from translation
 * No Hardcoded Values: All content comes from translation files
 *
 * This layer bridges the gap between configuration objects and translations,
 * allowing config-driven components to remain language-agnostic while
 * providing translated content at runtime.
 */

'use client';

import { useTranslation } from '@diboas/i18n/client';
import type { IntlShape } from 'react-intl';

/**
 * Translation key interface for config objects
 * All config objects should use translation keys instead of hardcoded strings
 */
export interface TranslationKeys {
  readonly [key: string]: string | TranslationKeys;
}

/**
 * Resolved translation interface
 * Result after translation keys are resolved to actual strings
 */
export interface ResolvedTranslations {
  readonly [key: string]: string | ResolvedTranslations;
}

/**
 * Hook to translate configuration objects
 * Recursively resolves all translation keys in a config object
 */
export function useConfigTranslation<T extends Record<string, any>>(
  config: T,
  translationKeyMap?: Map<string, string>
): T {
  const intl = useTranslation();

  const translateValue = (value: any): any => {
    // Handle null/undefined
    if (value == null) return value;

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => translateValue(item));
    }

    // Handle objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      const translatedObj: any = {};
      for (const [key, val] of Object.entries(value)) {
        translatedObj[key] = translateValue(val);
      }
      return translatedObj;
    }

    // Handle strings - check if it's a translation key
    if (typeof value === 'string') {
      // Translation keys have format 'namespace.key.path' (must have dots after prefix)
      // Valid: 'landing-b2c.demo.header', 'common.buttons.submit'
      // Invalid: 'landing-b2c' (just a category/identifier, not a translation key)
      const isTranslationKey = (
        (value.startsWith('common.') && value.indexOf('.', 7) > 0) ||
        (value.startsWith('marketing.') && value.indexOf('.', 10) > 0) ||
        (value.startsWith('landing-') && value.indexOf('.', value.indexOf('-') + 1) > 0)
      );

      if (isTranslationKey) {
        return intl.formatMessage({ id: value, defaultMessage: value });
      }

      // Check custom translation map
      if (translationKeyMap && translationKeyMap.has(value)) {
        const key = translationKeyMap.get(value)!;
        return intl.formatMessage({ id: key, defaultMessage: value });
      }
    }

    return value;
  };

  return translateValue(config) as T;
}

/**
 * Helper to create translation key mapping
 * Useful for migrating existing configs to use translation keys
 */
export function createTranslationMap(
  entries: Array<[string, string]>
): Map<string, string> {
  return new Map(entries);
}

/**
 * Directly translate a string key
 * Use this for simple one-off translations
 */
export function useTranslate(key: string, defaultMessage?: string): string {
  const intl = useTranslation();
  return intl.formatMessage({ id: key, defaultMessage: defaultMessage || key });
}

/**
 * Translate with values (for interpolation)
 */
export function useTranslateWithValues(
  key: string,
  values: Record<string, any>,
  defaultMessage?: string
): string {
  const intl = useTranslation();
  return intl.formatMessage({ id: key, defaultMessage: defaultMessage || key }, values);
}

/**
 * Create a translation helper for a specific namespace
 * This provides scoped translations for cleaner code
 */
export function useNamespacedTranslation(namespace: string) {
  const intl = useTranslation();

  return {
    t: (key: string, defaultMessage?: string) => {
      const fullKey = `${namespace}.${key}`;
      return intl.formatMessage({ id: fullKey, defaultMessage: defaultMessage || key });
    },
    tv: (key: string, values: Record<string, any>, defaultMessage?: string) => {
      const fullKey = `${namespace}.${key}`;
      return intl.formatMessage({ id: fullKey, defaultMessage: defaultMessage || key }, values);
    }
  };
}

/**
 * Higher-order function to create translation-aware config
 * Use this to wrap config objects at runtime
 */
export function withTranslations<T extends Record<string, any>>(
  intl: IntlShape,
  config: T
): T {
  const translateValue = (value: any): any => {
    if (value == null) return value;

    if (Array.isArray(value)) {
      return value.map(item => translateValue(item));
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const translatedObj: any = {};
      for (const [key, val] of Object.entries(value)) {
        translatedObj[key] = translateValue(val);
      }
      return translatedObj;
    }

    if (typeof value === 'string') {
      // Translation keys have format 'namespace.key.path' (must have dots after prefix)
      const isTranslationKey = (
        (value.startsWith('common.') && value.indexOf('.', 7) > 0) ||
        (value.startsWith('marketing.') && value.indexOf('.', 10) > 0) ||
        (value.startsWith('landing-') && value.indexOf('.', value.indexOf('-') + 1) > 0)
      );

      if (isTranslationKey) {
        return intl.formatMessage({ id: value, defaultMessage: value });
      }
    }

    return value;
  };

  return translateValue(config) as T;
}

/**
 * Create translation keys from existing config
 * Helper for migration - generates translation key structure
 */
export function generateTranslationKeys<T extends Record<string, any>>(
  config: T,
  namespace: string
): Record<string, any> {
  const result: Record<string, any> = {};

  const process = (obj: any, path: string[] = []): any => {
    if (obj == null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item, index) => process(item, [...path, `${index}`]));
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const processed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        processed[key] = process(value, [...path, key]);
      }
      return processed;
    }

    if (typeof obj === 'string') {
      const keyPath = [...path].join('.');
      return `${namespace}.${keyPath}`;
    }

    return obj;
  };

  return process(config);
}
