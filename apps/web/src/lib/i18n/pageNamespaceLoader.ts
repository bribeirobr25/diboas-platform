/**
 * Server-side utility for loading page-specific translation namespaces
 * Optimizes performance by loading only required translations per page
 */

import { loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';

/**
 * Load and flatten multiple namespaces for a page
 *
 * @param locale - The locale to load
 * @param namespaces - Array of namespace paths (e.g., ['home'], ['personal/account'])
 * @returns Flattened messages object ready for PageI18nProvider
 *
 * @example
 * const messages = await loadPageNamespaces(locale, ['home']);
 * const messages = await loadPageNamespaces(locale, ['personal/account', 'faq']);
 */
export async function loadPageNamespaces(
  locale: SupportedLocale,
  namespaces: string[]
): Promise<Record<string, string>> {
  const allMessages: Record<string, string> = {};

  for (const namespace of namespaces) {
    const namespaceMessages = await loadMessages(locale, namespace);

    // Determine prefix based on namespace path
    // 'home' -> 'marketing.pages.home'
    // 'personal/account' -> 'marketing.pages.personal.account'
    // 'faq' -> 'marketing.faq'
    const prefix = namespace.includes('/')
      ? `marketing.pages.${namespace.replace('/', '.')}`
      : namespace === 'faq'
        ? 'marketing.faq'
        : `marketing.pages.${namespace}`;

    const flattened = flattenMessages(namespaceMessages, prefix);
    Object.assign(allMessages, flattened);
  }

  return allMessages;
}
