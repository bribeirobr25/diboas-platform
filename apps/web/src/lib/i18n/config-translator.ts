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
 * Check whether a string looks like a translation key.
 * Translation keys have format 'namespace.key.path' (must have dots after prefix).
 * Valid: 'landing-b2c.demo.header', 'common.buttons.submit'
 * Invalid: 'landing-b2c' (just a category/identifier, not a translation key)
 */
function isTranslationKey(value: string): boolean {
  return (
    (value.startsWith('common.') && value.indexOf('.', 7) > 0) ||
    (value.startsWith('marketing.') && value.indexOf('.', 10) > 0) ||
    (value.startsWith('landing-') && value.indexOf('.', value.indexOf('-') + 1) > 0) ||
    (value.startsWith('about.') && value.indexOf('.', 6) > 0) ||
    (value.startsWith('protocols.') && value.indexOf('.', 10) > 0) ||
    (value.startsWith('security.') && value.indexOf('.', 9) > 0)
  );
}

/**
 * Recursively translate values in a config object using the provided intl instance.
 * Shared implementation used by both useConfigTranslation and withTranslations.
 */
function translateValue(
  value: unknown,
  intl: IntlShape,
  translationKeyMap?: Map<string, string>
): unknown {
  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map(item => translateValue(item, intl, translationKeyMap));
  }

  if (typeof value === 'object' && value !== null) {
    const translatedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      translatedObj[key] = translateValue(val, intl, translationKeyMap);
    }
    return translatedObj;
  }

  if (typeof value === 'string') {
    if (isTranslationKey(value)) {
      return intl.formatMessage({ id: value, defaultMessage: value });
    }

    if (translationKeyMap && translationKeyMap.has(value)) {
      const key = translationKeyMap.get(value)!;
      return intl.formatMessage({ id: key, defaultMessage: value });
    }
  }

  return value;
}

/**
 * Hook to translate configuration objects
 * Recursively resolves all translation keys in a config object
 */
export function useConfigTranslation<T extends object>(
  config: T,
  translationKeyMap?: Map<string, string>
): T {
  const intl = useTranslation();
  return translateValue(config, intl, translationKeyMap) as T;
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
  values: Record<string, string | number | boolean | Date>,
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
    tv: (key: string, values: Record<string, string | number | boolean | Date>, defaultMessage?: string) => {
      const fullKey = `${namespace}.${key}`;
      return intl.formatMessage({ id: fullKey, defaultMessage: defaultMessage || key }, values);
    }
  };
}

/**
 * Higher-order function to create translation-aware config
 * Use this to wrap config objects at runtime
 */
export function withTranslations<T extends object>(
  intl: IntlShape,
  config: T
): T {
  return translateValue(config, intl) as T;
}

/**
 * Create translation keys from existing config
 * Helper for migration - generates translation key structure
 */
export function generateTranslationKeys<T extends object>(
  config: T,
  namespace: string
): Record<string, unknown> {
  const process = (obj: unknown, path: string[] = []): unknown => {
    if (obj == null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item, index) => process(item, [...path, `${index}`]));
    }

    if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
      const processed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
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

  return process(config) as Record<string, unknown>;
}
