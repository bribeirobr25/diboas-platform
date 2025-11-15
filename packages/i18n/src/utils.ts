/**
 * Internationalization Utilities
 *
 * File Decoupling: Separate utility functions for i18n operations
 * Code Reusability: Shared utilities across all applications
 */

import type { SupportedLocale } from './config';

/**
 * Load translation messages for a specific locale and namespace
 * Supports hierarchical namespaces like 'personal/account', 'home', 'common'
 *
 * @param locale - The locale to load messages for
 * @param namespace - The namespace path (e.g., 'common', 'home', 'personal/account')
 * @returns Promise resolving to the translation messages object
 */
export async function loadMessages(
  locale: SupportedLocale,
  namespace: string = 'common'
): Promise<Record<string, any>> {
  try {
    // Support both flat and hierarchical namespace paths
    // 'common' → ../translations/en/common.json
    // 'personal/account' → ../translations/en/personal/account.json
    const messages = await import(`../translations/${locale}/${namespace}.json`);
    return messages.default || messages;
  } catch (error) {
    console.error(`Failed to load messages for ${locale}/${namespace}:`, error);

    // Fallback to English if translation not found
    if (locale !== 'en') {
      try {
        const fallbackMessages = await import(`../translations/en/${namespace}.json`);
        return fallbackMessages.default || fallbackMessages;
      } catch (fallbackError) {
        console.error('Failed to load fallback English messages:', fallbackError);
        return {};
      }
    }

    return {};
  }
}

/**
 * Load multiple namespaces for a locale
 * Supports hierarchical namespace paths
 *
 * @param locale - The locale to load messages for
 * @param namespaces - Array of namespace paths to load (e.g., ['common', 'home', 'personal/account'])
 * @returns Promise resolving to merged translation messages object
 *
 * @example
 * // Load common + home page
 * await loadAllMessages('en', ['common', 'home'])
 *
 * @example
 * // Load common + personal account page
 * await loadAllMessages('en', ['common', 'personal/account'])
 */
export async function loadAllMessages(
  locale: SupportedLocale,
  namespaces: string[] = ['common', 'marketing']
): Promise<Record<string, any>> {
  const messagesArray = await Promise.all(
    namespaces.map(namespace => loadMessages(locale, namespace))
  );

  // Merge all messages into a single object
  return messagesArray.reduce((acc, messages) => ({ ...acc, ...messages }), {});
}

/**
 * Flatten nested translation object for react-intl
 * Converts { common: { hello: "Hello" } } to { "common.hello": "Hello" }
 */
export function flattenMessages(
  nestedMessages: Record<string, any>,
  prefix = ''
): Record<string, string> {
  return Object.keys(nestedMessages).reduce((messages: Record<string, string>, key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      messages[prefixedKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(messages, flattenMessages(value, prefixedKey));
    }

    return messages;
  }, {});
}

/**
 * Get translation key path
 * Helper for type-safe translation keys
 */
export function getTranslationKey(...parts: string[]): string {
  return parts.filter(Boolean).join('.');
}
