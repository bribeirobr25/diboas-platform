/**
 * Server-side utility for loading page-specific translation namespaces
 * Optimizes performance by loading only required translations per page
 *
 * Marketing page namespace logic removed 2026-04-04 (marketing pages deleted).
 */

import { loadMessages, flattenMessages, type SupportedLocale } from '@diboas/i18n/server';

/**
 * Load and flatten multiple namespaces for a page
 *
 * @param locale - The locale to load
 * @param namespaces - Array of namespace paths
 * @returns Flattened messages object ready for PageI18nProvider
 */
export async function loadPageNamespaces(
  locale: SupportedLocale,
  namespaces: string[]
): Promise<Record<string, string>> {
  const allMessages: Record<string, string> = {};

  for (const namespace of namespaces) {
    const namespaceMessages = await loadMessages(locale, namespace);

    // Each namespace uses its name as the prefix for flattened keys
    const prefix = namespace;
    const flattened = flattenMessages(namespaceMessages, prefix);
    Object.assign(allMessages, flattened);
  }

  return allMessages;
}
