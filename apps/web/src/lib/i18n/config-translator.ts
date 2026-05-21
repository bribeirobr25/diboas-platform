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
    (value.startsWith('security.') && value.indexOf('.', 9) > 0) ||
    (value.startsWith('strategies.') && value.indexOf('.', 11) > 0) ||
    (value.startsWith('faq.') && value.indexOf('.', 4) > 0)
  );
}

/**
 * Slot values passed to ICU message templates.
 * Matches react-intl's accepted value types.
 */
export type SlotValues = Record<string, string | number | boolean | Date>;

/**
 * Map from fully-qualified translation id to its slot values.
 * E.g. `'landing-b2c.fees.rows.adding.diboas' → { rate: "0.48%", min: "$0.25", max: "$25" }`.
 */
export type ValuesByKey = Map<string, SlotValues>;

/**
 * Recursively translate values in a config object using the provided intl instance.
 * Shared implementation used by both useConfigTranslation and withTranslations.
 *
 * The optional `valuesByKey` map injects ICU slot values into matched translation
 * keys. Lookup is by the RESOLVED translation id (the value itself when matched via
 * `isTranslationKey`, or the mapped target when matched via `translationKeyMap`).
 */
function translateValue(
  value: unknown,
  intl: IntlShape,
  translationKeyMap?: Map<string, string>,
  valuesByKey?: ValuesByKey
): unknown {
  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map(item => translateValue(item, intl, translationKeyMap, valuesByKey));
  }

  if (typeof value === 'object' && value !== null) {
    const translatedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      translatedObj[key] = translateValue(val, intl, translationKeyMap, valuesByKey);
    }
    return translatedObj;
  }

  if (typeof value === 'string') {
    // Resolve the translation id (either the value itself or via the keyMap).
    // Unified resolution so the dev warning below works for both branches.
    let resolvedKey: string | undefined;
    if (isTranslationKey(value)) {
      resolvedKey = value;
    } else if (translationKeyMap?.has(value)) {
      resolvedKey = translationKeyMap.get(value);
    }
    if (resolvedKey === undefined) return value;

    const slotValues = valuesByKey?.get(resolvedKey);

    // Dev-only warning when a key has values mapped but the ICU template is
    // missing one of those slots — likely a misnamed slot. Stripped in production
    // by `removeConsole` + `NODE_ENV` gate.
    if (process.env.NODE_ENV === 'development' && slotValues) {
      const template = (intl.messages as Record<string, string | undefined>)[resolvedKey];
      if (typeof template === 'string') {
        const provided = Object.keys(slotValues);
        const slots = (template.match(/\{(\w+)\}/g) ?? []).map(s => s.slice(1, -1));
        const missing = slots.filter(s => !provided.includes(s));
        if (missing.length > 0) {
          console.warn(
            `[config-translator] Missing values for key "${resolvedKey}": ${missing.join(', ')}`
          );
        }
      }
    }

    return intl.formatMessage({ id: resolvedKey, defaultMessage: value }, slotValues);
  }

  return value;
}

/**
 * Hook to translate configuration objects.
 * Recursively resolves all translation keys in a config object.
 *
 * @param config - Config object containing translation keys to resolve.
 * @param translationKeyMap - Optional map from non-key strings to translation ids
 *   (used for migrating literal-string configs).
 * @param valuesByKey - Optional map from translation id to ICU slot values, for
 *   keys whose templates contain `{slot}` placeholders.
 */
export function useConfigTranslation<T extends object>(
  config: T,
  translationKeyMap?: Map<string, string>,
  valuesByKey?: ValuesByKey
): T {
  const intl = useTranslation();
  return translateValue(config, intl, translationKeyMap, valuesByKey) as T;
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
 * Higher-order function to create translation-aware config.
 * Use this to wrap config objects at runtime (outside React context).
 *
 * Mirrors `useConfigTranslation`'s signature so both surfaces can pass
 * `translationKeyMap` and `valuesByKey` consistently.
 */
export function withTranslations<T extends object>(
  intl: IntlShape,
  config: T,
  translationKeyMap?: Map<string, string>,
  valuesByKey?: ValuesByKey
): T {
  return translateValue(config, intl, translationKeyMap, valuesByKey) as T;
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
